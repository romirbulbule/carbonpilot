import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
GPU_SPECS = json.loads((DATA_DIR / "gpu_specs.json").read_text())
REGIONS = json.loads((DATA_DIR / "regions.json").read_text())

KG_CO2_PER_TREE_PER_YEAR = 21.0


def footprint(gpu_type: str, gpu_count: int, hours: float, region: str,
              carbon_intensity_g: float | None = None) -> dict:
    """Compute energy/carbon/water footprint for a workload.

    carbon_intensity_g overrides the region's static value when a live
    reading (e.g. from ElectricityMaps) is available.
    """
    gpu = GPU_SPECS[gpu_type]
    reg = REGIONS[region]
    intensity_g = carbon_intensity_g if carbon_intensity_g is not None else reg["carbon_intensity_g"]

    energy_kwh = gpu["tdp_watts"] * gpu_count * hours / 1000
    carbon_kg = energy_kwh * reg["pue"] * intensity_g / 1000
    water_l = energy_kwh * reg["pue"] * reg["wue_l_per_kwh"]
    trees_per_year = carbon_kg / KG_CO2_PER_TREE_PER_YEAR
    cost_usd = energy_kwh * reg["pue"] * reg["electricity_price_usd_per_kwh"]

    return {
        "gpu_type": gpu_type,
        "gpu_count": gpu_count,
        "hours": hours,
        "region": region,
        "carbon_intensity_g": intensity_g,
        "carbon_intensity_source": "live" if carbon_intensity_g is not None else "static",
        "energy_kwh": round(energy_kwh, 2),
        "carbon_kg": round(carbon_kg, 2),
        "water_l": round(water_l, 1),
        "trees_per_year": round(trees_per_year, 2),
        "cost_usd": round(cost_usd, 2),
    }


def compare_alternatives(gpu_type: str, gpu_count: int, hours: float, region: str, top_n: int = 3) -> list[dict]:
    """Rank alternative (gpu_type, region) combos by resulting carbon_kg, cheapest-carbon first."""
    current = footprint(gpu_type, gpu_count, hours, region)
    candidates = []
    for alt_gpu in GPU_SPECS:
        for alt_region in REGIONS:
            if alt_gpu == gpu_type and alt_region == region:
                continue
            result = footprint(alt_gpu, gpu_count, hours, alt_region)
            result["carbon_savings_kg"] = round(current["carbon_kg"] - result["carbon_kg"], 2)
            result["carbon_savings_pct"] = round(
                100 * result["carbon_savings_kg"] / current["carbon_kg"], 1
            ) if current["carbon_kg"] else 0.0
            result["cost_savings_usd"] = round(current["cost_usd"] - result["cost_usd"], 2)
            candidates.append(result)

    candidates.sort(key=lambda c: c["carbon_kg"])
    return candidates[:top_n]


def region_table() -> list[dict]:
    return [
        {"region": key, **{k: v for k, v in val.items() if k != "electricitymaps_zone"}}
        for key, val in sorted(REGIONS.items(), key=lambda kv: kv[1]["carbon_intensity_g"])
    ]
