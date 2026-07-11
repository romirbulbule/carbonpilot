import { motion } from 'motion/react'
import { Car, Smartphone, Fuel } from 'lucide-react'

export default function ImpactEquivalents({ result }) {
  if (!result?.equivalents) return null
  const { miles_driven, phones_charged, gasoline_gallons } = result.equivalents

  const items = [
    { icon: Car, value: miles_driven.toLocaleString(), label: 'miles driven', sub: 'in an average gas car' },
    { icon: Smartphone, value: phones_charged.toLocaleString(), label: 'phone charges', sub: 'full smartphone charges' },
    { icon: Fuel, value: gasoline_gallons.toLocaleString(), label: 'gallons of gas', sub: 'burned' },
  ]

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">
        {result.carbon_kg} kg CO2e is the same as…
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.2 }}
            className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5"
          >
            <item.icon size={20} className="shrink-0 text-emerald-400" />
            <div className="min-w-0">
              <div className="text-lg font-semibold text-slate-100">{item.value}</div>
              <div className="truncate text-xs text-slate-500">{item.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
