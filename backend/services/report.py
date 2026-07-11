"""Builds a submission-ready narrative report (executive summary + ranked
scenarios + recommended actions) on top of the existing calc_engine output.
Optionally folds in live GPU telemetry as hardware-verified evidence.
"""
from services import calc_engine, gpu_metrics


def _scenario(alt: dict) -> dict:
    return {
        "id": f"{alt['gpu_type']}-{alt['region']}",
        "title": f"Switch to {alt['gpu_type']} in {calc_engine.REGIONS[alt['region']]['label']}",
        "description": (
            f"Re-run this workload on {alt['gpu_type']} in "
            f"{calc_engine.REGIONS[alt['region']]['label']} instead of the current configuration."
        ),
        "carbon_savings_kg": alt["carbon_savings_kg"],
        "carbon_savings_pct": alt["carbon_savings_pct"],
        "cost_savings_usd": alt["cost_savings_usd"],
    }


def _telemetry_note(node_id: str | None) -> str | None:
    if not node_id:
        return None
    readings = gpu_metrics.latest(node_id)
    if not readings:
        return None
    reading = readings[0]
    return (
        f"Live telemetry from {node_id}: {reading['power_w']}W draw, "
        f"{reading['util_pct']}% utilization, {reading['temp_c']}°C."
    )


def _actions(result: dict, region: str, scenarios: list[dict], telemetry_note: str | None) -> list[str]:
    actions = []

    if scenarios and scenarios[0]["carbon_savings_pct"] > 0:
        best = scenarios[0]
        cost_note = f" and ${best['cost_savings_usd']} in electricity costs" if best["cost_savings_usd"] > 0 else ""
        actions.append(
            f"{best['title']} first — modeled at {best['carbon_savings_pct']}% lower carbon "
            f"({best['carbon_savings_kg']} kg CO2e/mo saved{cost_note})."
        )

    if calc_engine.REGIONS[region]["carbon_intensity_g"] > 300:
        actions.append(
            f"{calc_engine.REGIONS[region]['label']} runs a carbon-intensive grid — shifting "
            "flexible jobs to a cleaner region has outsized impact."
        )

    if result["water_l"] > 1000:
        actions.append(
            "Water usage is material at this scale — consider a lower-WUE region or cooling change."
        )

    if telemetry_note:
        actions.append("Live GPU telemetry is attached below as hardware-verified evidence, not just a model estimate.")

    if not actions:
        actions.append("Current configuration is already close to optimal among modeled alternatives.")

    return actions


def build_report(gpu_type: str, gpu_count: int, hours: float, region: str, node_id: str | None = None) -> dict:
    result = calc_engine.footprint(gpu_type, gpu_count, hours, region)
    alternatives = calc_engine.compare_alternatives(gpu_type, gpu_count, hours, region)
    scenarios = [_scenario(alt) for alt in alternatives]
    telemetry_note = _telemetry_note(node_id)
    actions = _actions(result, region, scenarios, telemetry_note)

    best_line = f" The best modeled alternative is {scenarios[0]['title']}." if scenarios else ""
    telemetry_line = f" {telemetry_note}" if telemetry_note else ""

    executive_summary = (
        f"Running {gpu_count}x {gpu_type} in {calc_engine.REGIONS[region]['label']} for {hours} hours "
        f"consumes {result['energy_kwh']} kWh, emits {result['carbon_kg']} kg CO2e, uses "
        f"{result['water_l']} L of water, and costs an estimated ${result['cost_usd']} in electricity."
        f"{telemetry_line}{best_line}"
    )

    return {
        "headline": "CarbonPilot efficiency report",
        "baseline": result,
        "scenarios": scenarios,
        "actions": actions,
        "executive_summary": executive_summary,
        "telemetry_note": telemetry_note,
    }
