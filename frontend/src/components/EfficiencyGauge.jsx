import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Gauge } from 'lucide-react'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ARC_FRACTION = 0.75 // 270° sweep, like a real gauge
const PARTICLE_COUNT = 14
const PARTICLE_COLORS = ['#34d399', '#a3e635', '#fbbf24', '#38bdf8']

const GRADE_COLOR = {
  'A+': '#34d399',
  A: '#34d399',
  B: '#a3e635',
  C: '#facc15',
  D: '#fb923c',
  F: '#f87171',
}

function ConfettiBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.3
        const distance = 55 + Math.random() * 35
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        }
      }),
    []
  )

  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  )
}

export default function EfficiencyGauge({ efficiency }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [burst, setBurst] = useState(false)

  useEffect(() => {
    if (!efficiency) {
      setAnimatedScore(0)
      return
    }
    const frame = requestAnimationFrame(() => setAnimatedScore(efficiency.score))
    return () => cancelAnimationFrame(frame)
  }, [efficiency])

  useEffect(() => {
    if (efficiency && (efficiency.grade === 'A+' || efficiency.grade === 'A')) {
      setBurst(true)
      const timeout = setTimeout(() => setBurst(false), 900)
      return () => clearTimeout(timeout)
    }
  }, [efficiency])

  const color = efficiency ? GRADE_COLOR[efficiency.grade] : '#475569'
  const arcLength = CIRCUMFERENCE * ARC_FRACTION
  const filled = (animatedScore / 100) * arcLength

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="relative h-32 w-32 shrink-0">
        <AnimatePresence>{burst && <ConfettiBurst />}</AnimatePresence>
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
