from fastapi import FastAPI
from prometheus_client import Counter, CONTENT_TYPE_LATEST, generate_latest
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.responses import Response
import uvicorn

app = FastAPI(title="Sandbox API", version="0.1.0")

# Register default FastAPI metrics and expose /metrics right away so probes don't race startup events.
Instrumentator().instrument(app).expose(app, include_in_schema=False)


REQUEST_COUNTER = Counter(
    "api_requests_total",
    "Total requests handled by the sandbox API",
    labelnames=("endpoint",),
)


@app.get("/health")
def health():
    REQUEST_COUNTER.labels(endpoint="health").inc()
    return {"status": "ok"}


@app.get("/stats")
def stats():
    REQUEST_COUNTER.labels(endpoint="stats").inc()
    return {"requests": 42, "errors": 0}


@app.get("/metrics")
def metrics() -> Response:
    """Expose Prometheus metrics for scrapers."""

    payload = generate_latest()
    return Response(content=payload, media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
