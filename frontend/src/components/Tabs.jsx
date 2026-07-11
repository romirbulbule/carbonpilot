export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="mb-6 flex gap-1 border-b border-slate-800">
      {tabs.map((t) => {
        const Icon = t.icon
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {Icon && <Icon size={15} />}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
