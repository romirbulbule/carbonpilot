"""Polls real GPU telemetry (nvidia-smi / rocm-smi) and pushes it to the
CarbonPilot ingest endpoint. Use --mock to simulate readings on machines
with no GPU (e.g. a laptop during dev) so the live pipeline is testable
before you're on real hackathon hardware.

Usage:
    python gpu_poller.py --mock --node-id dev-laptop --gpu-type MI300X
    python gpu_poller.py --vendor nvidia --node-id node-1
    python gpu_poller.py --vendor amd --node-id node-1
"""
import argparse
import math
import os
import subprocess
import time

import httpx

BACKEND_URL = os.getenv("CARBONPILOT_BACKEND_URL", "http://localhost:8000")
INGEST_KEY = os.getenv("INGEST_SHARED_SECRET", "dev-secret-change-me")


def poll_nvidia() -> dict:
    out = subprocess.check_output(
        ["nvidia-smi", "--query-gpu=power.draw,utilization.gpu,temperature.gpu", "--format=csv,noheader,nounits"],
        text=True,
    )
    power_w, util_pct, temp_c = (float(x.strip()) for x in out.strip().split(","))
    return {"power_w": power_w, "util_pct": util_pct, "temp_c": temp_c}


def poll_amd() -> dict:
    out = subprocess.check_output(["rocm-smi", "--showpower", "--showuse", "--showtemp", "--json"], text=True)
    import json
    data = json.loads(out)
    card = next(iter(data.values()))
    # Key names verified against a real MI300X droplet's rocm-smi (ROCm 7.2.4) output;
    # older/newer ROCm versions may use "Average Graphics Package Power (W)" instead.
    power = card.get("Current Socket Graphics Package Power (W)") or card.get("Average Graphics Package Power (W)", 0)
    temp = card.get("Temperature (Sensor junction) (C)") or card.get("Temperature (Sensor edge) (C)", 0)
    return {
        "power_w": float(power),
        "util_pct": float(card.get("GPU use (%)", 0)),
        "temp_c": float(temp),
    }


def poll_mock(t: float, gpu_type: str) -> dict:
    from services.calc_engine import GPU_SPECS

    tdp = GPU_SPECS[gpu_type]["tdp_watts"]
    baseline = tdp * 0.65
    wobble = tdp * 0.2 * math.sin(t / 8)
    return {
        "power_w": round(baseline + wobble, 1),
        "util_pct": round(70 + 20 * math.sin(t / 8), 1),
        "temp_c": round(65 + 5 * math.sin(t / 8), 1),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--node-id", default="node-1")
    parser.add_argument("--gpu-type", default="MI300X")
    parser.add_argument("--vendor", choices=["nvidia", "amd"], default="nvidia")
    parser.add_argument("--mock", action="store_true")
    parser.add_argument("--interval", type=float, default=2.0)
    args = parser.parse_args()

    print(f"Polling {'mock' if args.mock else args.vendor} GPU as node_id={args.node_id!r}, "
          f"pushing to {BACKEND_URL}/ingest/gpu every {args.interval}s")

    start = time.time()
    with httpx.Client(timeout=5.0) as client:
        while True:
            try:
                if args.mock:
                    reading = poll_mock(time.time() - start, args.gpu_type)
                elif args.vendor == "nvidia":
                    reading = poll_nvidia()
                else:
                    reading = poll_amd()

                payload = {
                    "node_id": args.node_id,
                    "gpu_type": args.gpu_type,
                    "source": "mock" if args.mock else "real",
                    **reading,
                }
                resp = client.post(
                    f"{BACKEND_URL}/ingest/gpu",
                    json=payload,
                    headers={"X-Ingest-Key": INGEST_KEY},
                )
                resp.raise_for_status()
                print(f"sent {payload}")
            except Exception as exc:  # keep polling even if backend is briefly down
                print(f"poll error: {exc}")

            time.sleep(args.interval)


if __name__ == "__main__":
    main()
