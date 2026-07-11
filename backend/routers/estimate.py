from fastapi import APIRouter
from pydantic import BaseModel

from agents import carbon_agent
from services import calc_engine, electricitymaps

router = APIRouter(prefix="/estimate", tags=["estimate"])


class WorkloadTextRequest(BaseModel):
    workload_text: str


class WorkloadManualRequest(BaseModel):
    gpu_type: str
    gpu_count: int
    hours: float
    region: str


@router.post("")
def estimate_from_text(req: WorkloadTextRequest):
    """Agent path: parse free text, reason, return a trace + final footprint."""
    return carbon_agent.analyze(req.workload_text)


@router.post("/manual")
async def estimate_from_fields(req: WorkloadManualRequest):
    """Direct path: skip the agent, compute straight from structured fields.

    Uses live grid carbon intensity for the baseline when available; the
    alternatives ranking stays on the static reference values so every
    candidate is compared on the same basis (fetching live data for all
    10 regions on every request isn't practical against a rate-limited
    free-tier API).
    """
    live = await electricitymaps.get_live_intensity(req.region)
    live_intensity_g = live["carbon_intensity_g"] if live["source"] == "live" else None

    result = calc_engine.footprint(req.gpu_type, req.gpu_count, req.hours, req.region, carbon_intensity_g=live_intensity_g)
    alternatives = calc_engine.compare_alternatives(req.gpu_type, req.gpu_count, req.hours, req.region)
    return {"result": result, "alternatives": alternatives}


@router.get("/regions")
def list_regions():
    return calc_engine.region_table()


@router.get("/gpus")
def list_gpus():
    return calc_engine.GPU_SPECS
