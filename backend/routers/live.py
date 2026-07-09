import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services import electricitymaps, gpu_metrics

router = APIRouter(prefix="/live", tags=["live"])

STREAM_INTERVAL_SECONDS = 2


@router.get("/carbon-intensity")
async def carbon_intensity(region: str):
    return await electricitymaps.get_live_intensity(region)


@router.get("/gpu")
def gpu_latest(node_id: str | None = None):
    return gpu_metrics.latest(node_id)


@router.get("/gpu/{node_id}/history")
def gpu_history(node_id: str):
    return gpu_metrics.history(node_id)


@router.websocket("/stream")
async def live_stream(ws: WebSocket, region: str = "virginia"):
    """Pushes the latest GPU readings + live carbon intensity every few seconds."""
    await ws.accept()
    try:
        while True:
            intensity = await electricitymaps.get_live_intensity(region)
            await ws.send_json({
                "type": "tick",
                "carbon_intensity": intensity,
                "gpu_nodes": gpu_metrics.latest(),
            })
            await asyncio.sleep(STREAM_INTERVAL_SECONDS)
    except WebSocketDisconnect:
        pass
