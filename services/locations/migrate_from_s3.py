from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Sequence

import boto3
from botocore.exceptions import ClientError
from sqlmodel import Session, SQLModel, delete

from main import LocationPinRecord, engine, ensure_uuid

DEFAULT_S3_BUCKET = os.environ.get("PHOTOGRAPHY_BUCKET", "tjprohammer-photography-data-v3")
DEFAULT_S3_KEY = os.environ.get("PINS_OBJECT_KEY", "data/pins.json")
DEFAULT_AWS_REGION = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Load pins JSON data from S3 (or a local file) into the locations Postgres database."
    )
    parser.add_argument("--bucket", default=DEFAULT_S3_BUCKET, help="S3 bucket that stores pins.json")
    parser.add_argument("--key", default=DEFAULT_S3_KEY, help="S3 object key for the pins JSON payload")
    parser.add_argument("--region", default=DEFAULT_AWS_REGION, help="AWS region for the S3 bucket")
    parser.add_argument("--profile", default=None, help="Optional AWS named profile to use for credentials")
    parser.add_argument(
        "--file",
        default=None,
        help="Path to a local JSON file (bypasses S3 and is useful for offline development)",
    )
    parser.add_argument(
        "--truncate",
        action="store_true",
        help="Delete existing rows before inserting the imported pins",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Execute the migration but roll back the transaction before committing",
    )
    return parser.parse_args()


def parse_timestamp(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return datetime.now(timezone.utc)


def load_pins_from_file(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as fp:
        payload = json.load(fp)
    if not isinstance(payload, list):
        raise ValueError(f"Expected an array of pins in {path}")
    return payload


def load_pins_from_s3(
    bucket: str,
    key: str,
    *,
    region: str | None = None,
    profile: str | None = None,
) -> List[Dict[str, Any]]:
    session = boto3.session.Session(profile_name=profile, region_name=region)
    s3 = session.client("s3")
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
    except ClientError as exc:
        raise RuntimeError(f"Unable to download s3://{bucket}/{key}: {exc}") from exc

    body = response["Body"].read()
    payload = json.loads(body.decode("utf-8"))
    if not isinstance(payload, list):
        raise ValueError(f"Expected s3://{bucket}/{key} to contain a JSON array of pins")
    return payload


def upsert_pins(pins: Sequence[Dict[str, Any]], *, truncate: bool = False, dry_run: bool = False) -> Dict[str, int]:
    SQLModel.metadata.create_all(engine)

    stats = {"inserted": 0, "updated": 0, "deleted": 0}
    with Session(engine) as session:
        if truncate:
            result = session.exec(delete(LocationPinRecord))
            stats["deleted"] = result.rowcount or 0

        for pin in pins:
            location_id = ensure_uuid(pin.get("id"))
            created_at = parse_timestamp(pin.get("createdAt"))
            updated_at = parse_timestamp(pin.get("updatedAt")) if pin.get("updatedAt") else created_at

            record_payload = dict(pin)
            record_payload["id"] = str(location_id)
            record_payload.setdefault("createdAt", created_at.isoformat())
            record_payload["updatedAt"] = updated_at.isoformat()

            record = session.get(LocationPinRecord, location_id)
            if record:
                record.data = record_payload
                record.updated_at = updated_at
                if not record.created_at:
                    record.created_at = created_at
                stats["updated"] += 1
            else:
                session.add(
                    LocationPinRecord(
                        id=location_id,
                        data=record_payload,
                        created_at=created_at,
                        updated_at=updated_at,
                    )
                )
                stats["inserted"] += 1

        if dry_run:
            session.rollback()
        else:
            session.commit()

    return stats


def main() -> None:
    args = parse_args()
    if not args.file and not args.bucket:
        raise SystemExit("Either --file or --bucket must be provided")

    if args.file:
        print(f"Loading pins from local file: {args.file}")
        pins = load_pins_from_file(args.file)
    else:
        bucket = args.bucket
        key = args.key
        region = args.region
        print(f"Downloading pins from s3://{bucket}/{key}")
        pins = load_pins_from_s3(bucket, key, region=region, profile=args.profile)

    print(f"Loaded {len(pins)} pins")
    stats = upsert_pins(pins, truncate=args.truncate, dry_run=args.dry_run)

    action = "ROLLED BACK" if args.dry_run else "COMMITTED"
    print(
        f"{action}: inserted={stats['inserted']} updated={stats['updated']} deleted={stats['deleted']}"
    )


if __name__ == "__main__":
    main()
