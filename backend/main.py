from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config
from routers import estimate, ingest, live, report

app = FastAPI(title="CarbonPilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(estimate.router)
app.include_router(live.router)
app.include_router(ingest.router)
app.include_router(report.router)


@app.get("/health")
def health():
    return {"status": "ok"}
