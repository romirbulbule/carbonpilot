"""In-memory store for live GPU telemetry pushed by the poller.

A ring buffer per node is plenty for a hackathon demo — no need for a
real time-series database at this scale.
"""
import time
from collections import defaultdict, deque

MAX_READINGS_PER_NODE = 120  # ~4 minutes at 2s intervals

_readings: dict[str, deque] = defaultdict(lambda: deque(maxlen=MAX_READINGS_PER_NODE))


def record(node_id: str, power_w: float, util_pct: float, temp_c: float, gpu_type: str) -> dict:
    reading = {
        "node_id": node_id,
        "gpu_type": gpu_type,
        "power_w": power_w,
        "util_pct": util_pct,
        "temp_c": temp_c,
        "timestamp": time.time(),
    }
    _readings[node_id].append(reading)
    return reading


def latest(node_id: str | None = None) -> list[dict]:
    if node_id:
        readings = _readings.get(node_id)
        return [readings[-1]] if readings else []
    return [d[-1] for d in _readings.values() if d]


def history(node_id: str) -> list[dict]:
    return list(_readings.get(node_id, []))


def known_nodes() -> list[str]:
    return list(_readings.keys())
