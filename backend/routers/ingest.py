import os

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from services import gpu_metrics

router = APIRouter(prefix="/ingest", tags=["ingest"])


class GpuReading(BaseModel):
    node_id: str
    gpu_type: str
    power_w: float
    util_pct: float
    temp_c: float


@router.post("/gpu")
def ingest_gpu(reading: GpuReading, x_ingest_key: str = Header(default="")):
    expected = os.getenv("INGEST_SHARED_SECRET", "dev-secret-change-me")
    if x_ingest_key != expected:
        raise HTTPException(status_code=401, detail="Invalid ingest key")

    return gpu_metrics.record(
        node_id=reading.node_id,
        power_w=reading.power_w,
        util_pct=reading.util_pct,
        temp_c=reading.temp_c,
        gpu_type=reading.gpu_type,
    )
