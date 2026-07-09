# AMD hardware evidence

Real telemetry captured from an actual AMD Instinct MI300X instance, provisioned on
AMD Developer Cloud, for the Track 3 "AMD compute usage" requirement.

## Instance

- Provider: AMD Developer Cloud (devcloud.amd.com), region `atl1`
- Droplet name/hostname: `rocm-7-2-4-gpu-mi300x1-192gb-devcloud-atl1`
- Plan: MI300X x1 — 1 GPU, 192 GB VRAM, 20 vCPU, 240 GB RAM
- Image: ROCm 7.2.4 Quick Start (Ubuntu 24.04)
- Date: 2026-07-09
- Lifetime: provisioned and destroyed same session (~20 min), single-GPU plan at $1.99/hr

## Real `rocm-smi` output

Captured via SSH directly from the running instance:

```json
{
  "card0": {
    "Temperature (Sensor junction) (C)": "38.0",
    "Temperature (Sensor memory) (C)": "33.0",
    "Current Socket Graphics Package Power (W)": "139.0",
    "GPU use (%)": "0"
  }
}
```

## Fed into CarbonPilot's live pipeline

Five consecutive readings were polled over SSH and pushed through the app's real
`/ingest/gpu` endpoint (same code path `gpu_poller.py --vendor amd` uses), then
verified readable back via `/live/gpu/amd-devcloud-atl1-mi300x/history` —
confirming the full ingest → store → API round trip works against real AMD
hardware telemetry, not just the `--mock` fallback.

```json
[
  {"node_id": "amd-devcloud-atl1-mi300x", "gpu_type": "MI300X", "power_w": 139.0, "util_pct": 0.0, "temp_c": 38.0, "timestamp": 1783583937.01},
  {"node_id": "amd-devcloud-atl1-mi300x", "gpu_type": "MI300X", "power_w": 139.0, "util_pct": 0.0, "temp_c": 38.0, "timestamp": 1783583940.26},
  {"node_id": "amd-devcloud-atl1-mi300x", "gpu_type": "MI300X", "power_w": 139.0, "util_pct": 0.0, "temp_c": 38.0, "timestamp": 1783583943.48},
  {"node_id": "amd-devcloud-atl1-mi300x", "gpu_type": "MI300X", "power_w": 139.0, "util_pct": 0.0, "temp_c": 38.0, "timestamp": 1783583946.72},
  {"node_id": "amd-devcloud-atl1-mi300x", "gpu_type": "MI300X", "power_w": 139.0, "util_pct": 0.0, "temp_c": 38.0, "timestamp": 1783583949.94}
]
```

Readings show a freshly booted, idle GPU (0% utilization) — expected, since the
box was provisioned solely to verify the telemetry pipeline against real hardware,
not to run a workload. `gpu_poller.py`'s key names were corrected against this
real output (see commit history): initial guesses (`Average Graphics Package
Power (W)`, `Sensor edge`) didn't match ROCm 7.2.4's actual `rocm-smi --json`
schema (`Current Socket Graphics Package Power (W)`, `Sensor junction`).
