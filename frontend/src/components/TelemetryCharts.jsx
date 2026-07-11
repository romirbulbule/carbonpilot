import { useEffect, useState } from 'react'
import { Activity, Server } from 'lucide-react'
import { fetchGpuHistory } from '../api'

function MiniBarChart({ title, unit, points, color }) {
  if (!points.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">{title}</span>
          <span className="text-slate-600">{unit}</span>
        </div>
        <div className="flex h-16 items-center justify-center text-xs text-slate-600">waiting for data…</div>
      </div>
    )
  }

  const max = Math.max(...points, 1)
  const latest = points[points.length - 1]

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-slate-400">{title}</span>
        <span className="text-slate-300">{latest.toFixed(1)} {unit}</span>
      </div>
      <div className="flex h-16 items-end gap-0.5">
        {points.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${Math.max(6, (v / max) * 100)}%`, backgroundColor: color }}
            title={`${v.toFixed(1)} ${unit}`}
          />
        ))}
      </div>
    </div>
  )
}

function FleetRow({ nodes, selectedNodeId, onSelect }) {
  if (nodes.length < 2) return null
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {nodes.map((n) => (
        <button
          key={n.node_id}
          onClick={() => onSelect(n.node_id)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
            n.node_id === selectedNodeId
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-700 text-slate-400 hover:border-slate-500'
          }`}
        >
          <Server size={12} />
          {n.node_id} · {n.power_w.toFixed(0)}W
        </button>
      ))}
    </div>
  )
}

export default function TelemetryCharts({ gpuNodes = [] }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!gpuNodes.length) return
    if (!selectedNodeId || !gpuNodes.some((n) => n.node_id === selectedNodeId)) {
      setSelectedNodeId(gpuNodes[0].node_id)
    }
  }, [gpuNodes, selectedNodeId])

  useEffect(() => {
    if (!selectedNodeId) {
      setHistory([])
      return
    }
    let cancelled = false

    async function poll() {
      try {
        const data = await fetchGpuHistory(selectedNodeId)
        if (!cancelled) setHistory(data)
      } catch {
        // transient network hiccup - keep showing the last known readings
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [selectedNodeId])

  if (!selectedNodeId) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-600">
        No live GPU telemetry connected. Run <code className="text-slate-500">gpu_poller.py</code> against real hardware (or with{' '}
        <code className="text-slate-500">--mock</code>) to see power/utilization/thermal traces here.
      </div>
    )
  }

  const recent = history.slice(-30)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity size={16} className="text-emerald-400" />
        <div>
          <h2 className="text-sm font-medium text-slate-200">
            Live GPU telemetry {gpuNodes.length > 1 && <span className="text-slate-500">· {gpuNodes.length} nodes</span>}
          </h2>
          <p className="text-xs text-slate-500">{selectedNodeId} · real hardware readings</p>
        </div>
      </div>

      <FleetRow nodes={gpuNodes} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniBarChart title="Power draw" unit="W" points={recent.map((r) => r.power_w)} color="#34d399" />
        <MiniBarChart title="Utilization" unit="%" points={recent.map((r) => r.util_pct)} color="#38bdf8" />
        <MiniBarChart title="Temperature" unit="°C" points={recent.map((r) => r.temp_c)} color="#fb923c" />
      </div>
    </div>
  )
}
