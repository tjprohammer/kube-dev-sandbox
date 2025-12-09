"""Mock notification service used inside the sandbox cluster."""

from __future__ import annotations

from collections import Counter as StatsCounter
from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI
from prometheus_client import Counter, CONTENT_TYPE_LATEST, generate_latest
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel, Field
from fastapi.responses import Response
import uvicorn

app = FastAPI(title="Notifications API", version="0.1.0")

# Expose /metrics immediately so scrapes do not depend on startup timing.
Instrumentator().instrument(app).expose(app, include_in_schema=False)


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "notifications"
    time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NotificationRequest(BaseModel):
    channel: Literal["email", "sms", "push"]
    recipient: str = Field(..., min_length=3, max_length=256)
    message: str = Field(..., min_length=1, max_length=1024)


class NotificationResponse(BaseModel):
    id: str
    channel: str
    recipient: str
    message: str
    status: Literal["queued", "sent"]
    sent_at: datetime


class StatsResponse(BaseModel):
    total_sent: int
    by_channel: dict[str, int]


stats = StatsCounter()
NOTIFICATIONS_SENT = Counter(
    "notifications_sent_total",
    "Total notifications processed by channel",
    labelnames=("channel",),
)


@app.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    """Minimal readiness/liveness probe."""
    return HealthResponse()


@app.post("/send", response_model=NotificationResponse)
def send_notification(payload: NotificationRequest) -> NotificationResponse:
    """Simulate dispatching a notification and keep track of aggregates."""

    stats["total"] += 1
    stats[payload.channel] += 1
    NOTIFICATIONS_SENT.labels(channel=payload.channel).inc()

    return NotificationResponse(
        id=str(uuid4()),
        channel=payload.channel,
        recipient=payload.recipient,
        message=payload.message,
        status="sent",
        sent_at=datetime.now(timezone.utc),
    )


@app.get("/stats", response_model=StatsResponse)
def get_stats() -> StatsResponse:
    """Return aggregate counts for demos/tests."""

    return StatsResponse(
        total_sent=stats.get("total", 0),
        by_channel={k: v for k, v in stats.items() if k != "total"},
    )


@app.get("/metrics")
def metrics() -> Response:
    """Expose Prometheus metrics in plain text."""

    payload = generate_latest()
    return Response(content=payload, media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8100, reload=False)
