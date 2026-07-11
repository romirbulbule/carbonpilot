import { useEffect, useState } from 'react'
import { Gauge } from 'lucide-react'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ARC_FRACTION = 0.75 // 270° sweep, like a real gauge

const GRADE_COLOR = {
  'A+': '#34d399',
  A: '#34d399',
  B: '#a3e635',
  C: '#facc15',
  D: '#fb923c',
  F: '#f87171',
}

export default function EfficiencyGauge({ efficiency }) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (!efficiency) {
      setAnimatedScore(0)
      return
    }
    const frame = requestAnimationFrame(() => setAnimatedScore(efficiency.score))
    return () => cancelAnimationFrame(frame)
  }, [efficiency])

  const color = efficiency ? GRADE_COLOR[efficiency.grade] : '#475569'
  const arcLength = CIRCUMFERENCE * ARC_FRACTION
  const filled = (animatedScore / 100) * arcLength

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-[135deg]">
          <circle
            cx={70}
            cy={70}
            r={RADIUS}
            fill="none"
            stroke="#1e293b"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${CIRCUMFERENCE}`}
          />
          <circle
            cx={70}
            cy={70}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.5s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {efficiency ? efficiency.grade : '—'}
          </span>
          <span className="text-xs text-slate-500">{efficiency ? `${Math.round(animatedScore)}/100` : 'no data'}</span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
          <Gauge size={13} className="text-emerald-500" />
          Efficiency score
        </div>
        {efficiency ? (
          <p className="text-sm leading-relaxed text-slate-400">
            Ranked against every GPU/region combo for this workload size — {efficiency.best_carbon_kg} kg CO2e is the
            greenest possible, {efficiency.worst_carbon_kg} kg CO2e is the worst.
          </p>
        ) : (
          <p className="text-sm text-slate-600">Run an analysis to score this workload's configuration.</p>
        )}
      </div>
    </div>
  )
}
