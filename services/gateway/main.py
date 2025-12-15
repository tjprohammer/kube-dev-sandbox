from __future__ import annotations

import logging
import os
from typing import Dict, Iterable, Optional

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter
from prometheus_fastapi_instrumentator import Instrumentator

logger = logging.getLogger("gateway-service")
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))

LEGACY_BASE_URL = os.environ.get(
    "LEGACY_BASE_URL",
    "https://5cjnp8rcga.execute-api.us-west-2.amazonaws.com/staging_api",
)
LOCATIONS_BASE_URL = os.environ.get(
    "LOCATIONS_BASE_URL",
    "http://locations.sandbox-app.svc.cluster.local",
)
DEFAULT_ALLOWED_ORIGINS = (
    "http://ui.sandbox.local,https://ui.sandbox.local,http://localhost:5173"
)
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS).split(",")
    if origin.strip()
]

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}

ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]

app = FastAPI(title="Gateway Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Instrumentator().instrument(app).expose(app, include_in_schema=False)

_client: Optional[httpx.AsyncClient] = None

PROXY_REQUESTS = Counter(
    "gateway_proxy_requests_total",
    "Total number of proxied requests grouped by upstream and outcome",
    ("upstream", "outcome"),
)


def _strip_trailing_slash(value: str) -> str:
    return value[:-1] if value.endswith("/") else value


def _build_target_url(base: str, path: str, raw_query: str) -> str:
    normalized_path = path if path.startswith("/") else f"/{path}"
    url = f"{_strip_trailing_slash(base)}{normalized_path}"
    if raw_query:
        return f"{url}?{raw_query}"
    return url


def _copy_headers(source: Iterable[tuple[str, str]]) -> Dict[str, str]:
    result: Dict[str, str] = {}
    for key, value in source:
        lk = key.lower()
        if lk in HOP_BY_HOP_HEADERS:
            continue
        result[key] = value
    return result


def _upstream_label(target_base: str) -> str:
    if target_base == LOCATIONS_BASE_URL:
        return "locations"
    if target_base == LEGACY_BASE_URL:
        return "legacy"
    return "custom"


async def _proxy_request(request: Request, target_base: str) -> Response:
    if not target_base:
        return Response(status_code=502, content="Missing upstream configuration")

    if _client is None:
        raise RuntimeError("HTTP client not initialized")

    body = await request.body()
    target_url = _build_target_url(target_base, request.url.path, request.url.query)
    headers = _copy_headers(request.headers.raw)
    headers.setdefault("x-forwarded-host", request.headers.get("host", ""))
    headers["x-forwarded-proto"] = request.url.scheme

    logger.debug("Proxying %s %s -> %s", request.method, request.url.path, target_url)
    upstream_name = _upstream_label(target_base)

    method = request.method.upper()
    try:
        upstream_response = await _client.request(
            method,
            target_url,
            content=body if method not in {"GET", "HEAD"} else None,
            headers=headers,
        )
    except httpx.HTTPError as exc:
        PROXY_REQUESTS.labels(upstream_name, "failure").inc()
        logger.error("Upstream request failed for %s: %s", upstream_name, exc)
        return Response(
            content="Upstream request failed",
            status_code=502,
            headers={"content-type": "text/plain; charset=utf-8"},
        )

    response_headers = _copy_headers(upstream_response.headers.multi_items())
    outcome = "success" if upstream_response.status_code < 500 else "failure"
    PROXY_REQUESTS.labels(upstream_name, outcome).inc()

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
    )


@app.on_event("startup")
async def _startup() -> None:
    global _client
    timeout = httpx.Timeout(30.0, connect=5.0)
    _client = httpx.AsyncClient(timeout=timeout)
    logger.info("Gateway service ready; proxying to %s", LEGACY_BASE_URL)


@app.on_event("shutdown")
async def _shutdown() -> None:
    if _client is not None:
        await _client.aclose()


@app.get("/healthz", tags=["health"])
async def healthcheck() -> Dict[str, str]:
    return {"status": "ok"}


@app.api_route("/locations{full_path:path}", methods=ALLOWED_METHODS)
async def proxy_locations(full_path: str, request: Request) -> Response:
    return await _proxy_request(request, LOCATIONS_BASE_URL)


@app.api_route("/{full_path:path}", methods=ALLOWED_METHODS)
async def proxy_legacy(full_path: str, request: Request) -> Response:
    return await _proxy_request(request, LEGACY_BASE_URL)
