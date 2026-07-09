export default function Sparkline({ points, width = 240, height = 60, color = '#34d399' }) {
  if (!points.length) {
    return <div style={{ width, height }} className="flex items-center justify-center text-xs text-slate-500">waiting for data…</div>
  }

  const values = points.map((p) => p.power_w)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const path = points
    .map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * width
      const y = height - ((p.power_w - min) / range) * height
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const latest = values[values.length - 1]

  return (
    <div>
      <svg width={width} height={height} className="overflow-visible">
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-1 text-sm text-slate-300">{latest.toFixed(0)} W total draw</div>
    </div>
  )
}
