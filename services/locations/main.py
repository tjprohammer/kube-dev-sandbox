from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from collections.abc import Generator
from typing import Dict, List, Optional

import redis.asyncio as redis
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel, ConfigDict, Field
from sqlmodel import Column, Field as SQLField, Session, SQLModel, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB

DEFAULT_DB_URL = (
    "postgresql+psycopg://devuser:devpassword@postgresql.sandbox-app.svc.cluster.local:5432/locations"
)
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)

DEFAULT_REDIS_HOST = "redis.sandbox-app.svc.cluster.local"
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", "")
DEFAULT_REDIS_URL = (
    f"redis://:{REDIS_PASSWORD}@{DEFAULT_REDIS_HOST}:6379/0"
    if REDIS_PASSWORD
    else f"redis://{DEFAULT_REDIS_HOST}:6379/0"
)
REDIS_URL = os.environ.get("REDIS_URL", DEFAULT_REDIS_URL)
CACHE_TTL_SECONDS = int(os.environ.get("CACHE_TTL_SECONDS", "60"))

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://ui.sandbox.local,https://ui.sandbox.local,http://localhost:5173",
    ).split(",")
    if origin.strip()
]

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
redis_client: Optional[redis.Redis] = None
CACHE_KEY = "locations:all"


class Coordinates(BaseModel):
    latitude: float
    longitude: float


class LocationPhoto(BaseModel):
    id: str
    src: str
    alt: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None


class Trip(BaseModel):
    id: str
    title: str
    story: str
    visitDate: str
    photos: List[LocationPhoto] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    weather: Optional[str] = None
    equipment: Optional[List[str]] = None


class LocationPin(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    coordinates: Coordinates
    featured: bool = False
    category: str = "other"
    trips: Optional[List[Trip]] = None
    story: Optional[str] = None
    visitDate: Optional[str] = None
    photos: Optional[List[LocationPhoto]] = None
    tags: Optional[List[str]] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class LocationPinRecord(SQLModel, table=True):
    __tablename__ = "location_pins"

    id: uuid.UUID = SQLField(default_factory=uuid.uuid4, primary_key=True, index=True)
    data: Dict = SQLField(sa_column=Column(JSONB, nullable=False))
    created_at: datetime = SQLField(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = SQLField(default_factory=lambda: datetime.now(timezone.utc))


def serialize_record(record: LocationPinRecord) -> Dict:
    payload = dict(record.data)
    payload["id"] = payload.get("id", str(record.id))
    payload.setdefault("createdAt", record.created_at.isoformat())
    payload["updatedAt"] = record.updated_at.isoformat()
    return payload


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


async def get_cached_locations() -> Optional[List[Dict]]:
    if redis_client is None:
        return None
    cached = await redis_client.get(CACHE_KEY)
    if not cached:
        return None
    return json.loads(cached)


async def cache_locations(locations: List[Dict]) -> None:
    if redis_client is None:
        return
    await redis_client.setex(CACHE_KEY, CACHE_TTL_SECONDS, json.dumps(locations))


async def invalidate_cache() -> None:
    if redis_client is None:
        return
    await redis_client.delete(CACHE_KEY)


def ensure_uuid(value: Optional[str]) -> uuid.UUID:
    if value:
        try:
            return uuid.UUID(value)
        except ValueError:
            pass
    return uuid.uuid4()


def apply_write(record: LocationPinRecord, payload: LocationPin, *, is_new: bool = False) -> Dict:
    data = payload.model_dump(mode="python", exclude_none=True)
    now = datetime.now(timezone.utc)
    created = record.created_at or now
    if is_new:
        record.created_at = created

    data["id"] = str(record.id)
    data["createdAt"] = data.get("createdAt") or created.isoformat()
    data["updatedAt"] = now.isoformat()
    record.data = data
    record.updated_at = now
    return data


app = FastAPI(title="Locations Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Instrumentator().instrument(app).expose(app, include_in_schema=False)


@app.on_event("startup")
async def on_startup() -> None:
    global redis_client
    SQLModel.metadata.create_all(engine)
    redis_client = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    if redis_client:
        await redis_client.close()
        await redis_client.wait_closed()


@app.get("/healthz", tags=["health"])
async def healthz() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/locations", response_model=List[LocationPin])
async def list_locations(session: Session = Depends(get_session)) -> List[Dict]:
    cached = await get_cached_locations()
    if cached is not None:
        return cached

    records = session.exec(
        select(LocationPinRecord).order_by(LocationPinRecord.updated_at.desc())
    ).all()
    items = [serialize_record(record) for record in records]
    await cache_locations(items)
    return items


@app.get("/locations/{location_id}", response_model=LocationPin)
async def get_location(location_id: str, session: Session = Depends(get_session)) -> Dict:
    record = session.get(LocationPinRecord, ensure_uuid(location_id))
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return serialize_record(record)


@app.post("/locations", response_model=LocationPin, status_code=status.HTTP_201_CREATED)
async def create_location(
    payload: LocationPin, session: Session = Depends(get_session)
) -> Dict:
    location_uuid = ensure_uuid(payload.id)
    record = LocationPinRecord(id=location_uuid, data={})
    session.add(record)
    updated_payload = apply_write(record, payload, is_new=True)
    session.add(record)
    session.commit()
    await invalidate_cache()
    return updated_payload


@app.put("/locations/{location_id}", response_model=LocationPin)
async def update_location(
    location_id: str, payload: LocationPin, session: Session = Depends(get_session)
) -> Dict:
    record = session.get(LocationPinRecord, ensure_uuid(location_id))
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    updated_payload = apply_write(record, payload)
    session.add(record)
    session.commit()
    await invalidate_cache()
    return updated_payload


@app.delete(
    "/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response
)
async def delete_location(location_id: str, session: Session = Depends(get_session)) -> Response:
    record = session.get(LocationPinRecord, ensure_uuid(location_id))
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    session.delete(record)
    session.commit()
    await invalidate_cache()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
