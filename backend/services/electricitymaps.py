"""Thin client for the ElectricityMaps live carbon-intensity API.

Falls back to the static value in regions.json when no API key is set or
the API call fails, so the app always works offline / without a key.
"""
import os
import time

import httpx

from .calc_engine import REGIONS

API_BASE = "https://api.electricitymap.org/v3/carbon-intensity/latest"
CACHE_TTL_SECONDS = 5 * 60

_cache: dict[str, tuple[float, dict]] = {}  # region -> (fetched_at, payload)


async def get_live_intensity(region: str) -> dict:
    """Return {carbon_intensity_g, source: 'live'|'static', fetched_at}."""
    reg = REGIONS[region]
    api_key = os.getenv("ELECTRICITYMAPS_API_KEY")

    cached = _cache.get(region)
    if cached and (time.time() - cached[0]) < CACHE_TTL_SECONDS:
        return cached[1]

    if not api_key:
        payload = {
            "region": region,
            "carbon_intensity_g": reg["carbon_intensity_g"],
            "source": "static",
            "fetched_at": time.time(),
        }
        _cache[region] = (time.time(), payload)
        return payload

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                API_BASE,
                params={"zone": reg["electricitymaps_zone"]},
                headers={"auth-token": api_key},
            )
            resp.raise_for_status()
            data = resp.json()
            payload = {
                "region": region,
                "carbon_intensity_g": data["carbonIntensity"],
                "source": "live",
                "fetched_at": time.time(),
            }
    except (httpx.HTTPError, KeyError):
        payload = {
            "region": region,
            "carbon_intensity_g": reg["carbon_intensity_g"],
            "source": "static",
            "fetched_at": time.time(),
        }

    _cache[region] = (time.time(), payload)
    return payload
