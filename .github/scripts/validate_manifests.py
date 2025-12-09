from pathlib import Path

import yaml

BASE = Path(__file__).resolve().parents[2]
MANIFEST_DIRS = [
    BASE / "infra" / "k8s",
    BASE / "services" / "api" / "k8s",
    BASE / "services" / "notifications" / "k8s",
    BASE / "services" / "frontend" / "k8s",
    BASE / "services" / "worker" / "k8s",
]


def validate_yaml_file(path: Path) -> None:
    with path.open("r", encoding="utf-8") as handle:
        docs = list(yaml.safe_load_all(handle))
    if not docs:
        raise ValueError(f"{path} is empty")
    for index, doc in enumerate(docs, start=1):
        if not isinstance(doc, dict):
            raise ValueError(f"{path} document #{index} is not a mapping")
        if "apiVersion" not in doc or "kind" not in doc:
            raise ValueError(f"{path} document #{index} missing apiVersion/kind")


def main() -> None:
    manifest_files = []
    for directory in MANIFEST_DIRS:
        manifest_files.extend(sorted(directory.glob("*.yaml")))
    if not manifest_files:
        raise SystemExit("No manifests found to validate")
    for manifest in manifest_files:
        validate_yaml_file(manifest)
        print(f"validated {manifest.relative_to(BASE)}")


if __name__ == "__main__":
    main()
