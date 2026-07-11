import { useState } from 'react'
import { motion } from 'motion/react'
import { Activity, Globe2, TrendingDown, X } from 'lucide-react'

const STEPS = [
  {
    icon: Activity,
    title: 'Describe a workload',
    body: 'Type a plain-English AI workload, or use the structured form. CarbonPilot calculates energy, carbon, water, and cost instantly.',
  },
  {
    icon: Globe2,
    title: 'Real AMD hardware, live data',
    body: 'Live Ops shows a rotating globe of live grid carbon intensity, plus real GPU telemetry streamed from AMD Instinct MI300X hardware.',
  },
  {
    icon: TrendingDown,
    title: 'Get ranked alternatives',
    body: 'Optimization shows the greenest GPU/region alternatives, cost savings, and an A+-F efficiency grade for your choice.',
  },
]

export default function OnboardingTour({ onDone }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6"
      >
        <button onClick={onDone} className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
          <X size={16} />
        </button>
        <current.icon size={28} className="mb-3 text-emerald-400" />
        <h2 className="mb-2 text-base font-semibold text-slate-100">{current.title}</h2>
        <p className="mb-5 text-sm leading-relaxed text-slate-400">{current.body}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === step ? 'bg-emerald-400' : 'bg-slate-700'}`} />
            ))}
          </div>
          <button
            onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400"
          >
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
