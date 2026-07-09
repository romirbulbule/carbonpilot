"""The CarbonPilot agent: turns a free-text workload description into a
footprint analysis, reasoning about greener alternatives along the way.

Uses Claude tool-calling when ANTHROPIC_API_KEY is set. Falls back to a
regex-based parser + templated narration otherwise, so the estimator
endpoint always works without a key.
"""
import json
import os
import re

from services import calc_engine

TOOLS = [
    {
        "name": "calculate_footprint",
        "description": "Compute energy, carbon, and water footprint for an AI workload.",
        "input_schema": {
            "type": "object",
            "properties": {
                "gpu_type": {"type": "string", "enum": list(calc_engine.GPU_SPECS.keys())},
                "gpu_count": {"type": "integer"},
                "hours": {"type": "number"},
                "region": {"type": "string", "enum": list(calc_engine.REGIONS.keys())},
            },
            "required": ["gpu_type", "gpu_count", "hours", "region"],
        },
    },
    {
        "name": "compare_alternatives",
        "description": "Find greener (gpu_type, region) alternatives for the same workload, ranked by carbon savings.",
        "input_schema": {
            "type": "object",
            "properties": {
                "gpu_type": {"type": "string", "enum": list(calc_engine.GPU_SPECS.keys())},
                "gpu_count": {"type": "integer"},
                "hours": {"type": "number"},
                "region": {"type": "string", "enum": list(calc_engine.REGIONS.keys())},
            },
            "required": ["gpu_type", "gpu_count", "hours", "region"],
        },
    },
]

SYSTEM_PROMPT = f"""You are CarbonPilot, an agent that analyzes the carbon, energy, and \
water footprint of AI workloads and recommends greener alternatives.

Known GPU types: {", ".join(calc_engine.GPU_SPECS.keys())}
Known regions: {", ".join(calc_engine.REGIONS.keys())}

Given a natural-language workload description, extract gpu_type, gpu_count, hours, and \
region (default region to "virginia" if not mentioned), call calculate_footprint, then \
call compare_alternatives, then give a short final recommendation highlighting the \
greenest alternative and the percent carbon savings. Think step by step before each tool call."""


def _run_tool(name: str, tool_input: dict) -> dict:
    if name == "calculate_footprint":
        return calc_engine.footprint(**tool_input)
    if name == "compare_alternatives":
        return {"alternatives": calc_engine.compare_alternatives(**tool_input)}
    raise ValueError(f"Unknown tool {name}")


def analyze_with_claude(workload_text: str) -> dict:
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    messages = [{"role": "user", "content": workload_text}]
    trace = []

    for _ in range(5):  # bounded agent loop
        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        for block in response.content:
            if block.type == "text" and block.text.strip():
                trace.append({"type": "thought", "text": block.text})

        if response.stop_reason != "tool_use":
            final_text = "".join(b.text for b in response.content if b.type == "text")
            trace.append({"type": "final_answer", "text": final_text})
            return {"trace": trace, "raw_messages": None}

        messages.append({"role": "assistant", "content": response.content})
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                result = _run_tool(block.name, block.input)
                trace.append({"type": "tool_call", "name": block.name, "input": block.input, "result": result})
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                })
        messages.append({"role": "user", "content": tool_results})

    trace.append({"type": "final_answer", "text": "Reached max reasoning steps."})
    return {"trace": trace, "raw_messages": None}


_GPU_ALIASES = {
    "a100": "A100-80GB", "h100": "H100-SXM", "mi300": "MI300X", "mi300x": "MI300X", "mi250": "MI250",
}
_REGION_ALIASES = {r: r for r in calc_engine.REGIONS}


def _regex_parse(text: str) -> dict:
    text_l = text.lower()

    gpu_type = "H100-SXM"
    for alias, canonical in _GPU_ALIASES.items():
        if alias in text_l:
            gpu_type = canonical
            break

    count_match = re.search(r"(\d+)\s*x?\s*(?:gpus?|a100|h100|mi300x?|mi250)", text_l)
    gpu_count = int(count_match.group(1)) if count_match else 8

    hours_match = re.search(r"(\d+(?:\.\d+)?)\s*(hours?|hrs?|h\b|days?)", text_l)
    hours = 24.0
    if hours_match:
        value = float(hours_match.group(1))
        hours = value * 24 if hours_match.group(2).startswith("day") else value

    region = "virginia"
    for key, val in calc_engine.REGIONS.items():
        if key in text_l or val["label"].split(",")[0].lower() in text_l:
            region = key
            break

    return {"gpu_type": gpu_type, "gpu_count": gpu_count, "hours": hours, "region": region}


def analyze_with_fallback(workload_text: str) -> dict:
    """No-API-key path: regex-parse the text, run the same calc engine, template a narration."""
    params = _regex_parse(workload_text)
    trace = [{"type": "thought", "text": f"Parsed workload (fallback parser, no ANTHROPIC_API_KEY set): {params}"}]

    result = calc_engine.footprint(**params)
    trace.append({"type": "tool_call", "name": "calculate_footprint", "input": params, "result": result})

    alternatives = calc_engine.compare_alternatives(**params)
    trace.append({"type": "tool_call", "name": "compare_alternatives", "input": params, "result": {"alternatives": alternatives}})

    best = alternatives[0] if alternatives else None
    if best and best["carbon_savings_pct"] > 0:
        final = (
            f"This workload on {params['gpu_count']}x {params['gpu_type']} in "
            f"{calc_engine.REGIONS[params['region']]['label']} produces {result['carbon_kg']} kg CO2e. "
            f"Switching to {best['gpu_type']} in {calc_engine.REGIONS[best['region']]['label']} would cut "
            f"emissions by {best['carbon_savings_pct']}% ({best['carbon_savings_kg']} kg CO2e saved)."
        )
    else:
        final = f"This workload produces {result['carbon_kg']} kg CO2e — already a near-optimal configuration."
    trace.append({"type": "final_answer", "text": final})

    return {"trace": trace, "raw_messages": None}


def analyze(workload_text: str) -> dict:
    if os.getenv("ANTHROPIC_API_KEY"):
        return analyze_with_claude(workload_text)
    return analyze_with_fallback(workload_text)
