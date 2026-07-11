from fastapi import APIRouter
from pydantic import BaseModel

from services import report as report_service

router = APIRouter(prefix="/report", tags=["report"])


class ReportRequest(BaseModel):
    gpu_type: str
    gpu_count: int
    hours: float
    region: str
    node_id: str | None = None  # optional live GPU telemetry node to fold in as evidence


@router.post("")
async def generate_report(req: ReportRequest):
    return await report_service.build_report(req.gpu_type, req.gpu_count, req.hours, req.region, req.node_id)
