import os
import time
from datetime import datetime


def run() -> None:
    job_name = os.getenv("JOB_NAME", "worker")
    print(f"[{datetime.utcnow().isoformat()}] {job_name} started")
    time.sleep(1)
    print(f"[{datetime.utcnow().isoformat()}] {job_name} completed")


if __name__ == "__main__":
    run()
