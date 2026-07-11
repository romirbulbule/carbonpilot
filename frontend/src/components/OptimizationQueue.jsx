import { motion } from 'motion/react'
import { TrendingDown } from 'lucide-react'

export default function OptimizationQueue({ scenarios }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingDown size={16} className="text-emerald-400" />
        <div>
          <h2 className="text-sm font-medium text-slate-200">Optimization queue</h2>
          <p className="text-xs text-slate-500">Ranked by modeled monthly carbon savings</p>
        </div>
      </div>

      {!scenarios?.length && (
        <p className="text-sm text-slate-600">Run an analysis to see ranked alternatives.</p>
      )}

      <div className="space-y-2">
        {scenarios?.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-400">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-100">{scenario.title}</p>
              <p className="text-xs text-slate-500">{scenario.carbon_savings_kg} kg CO2e saved</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-emerald-400">
              {scenario.carbon_savings_pct}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
