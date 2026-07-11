import { History, Leaf } from 'lucide-react'

const ENGINE_DOT = {
  fireworks: 'bg-emerald-400',
  claude: 'bg-sky-400',
  manual: 'bg-slate-400',
  fallback: 'bg-amber-400',
}

export default function RunHistory({ runs, onSelect, onClear }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={16} className="text-emerald-400" />
          <div>
            <h2 className="text-sm font-medium text-slate-200">Run history</h2>
            <p className="text-xs text-slate-500">Saved across reloads — click one to reload it</p>
          </div>
        </div>
        {runs.length > 0 && (
          <button onClick={onClear} className="text-xs text-slate-600 hover:text-slate-400">
            Clear
          </button>
        )}
      </div>

      {!runs.length && (
        <p className="text-sm text-slate-600">Runs you generate will appear here and persist across reloads.</p>
      )}

      <div className="space-y-1.5">
        {runs.map((run) => (
          <button
            key={run.id}
            onClick={() => onSelect(run)}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-left hover:border-emerald-500/50"
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ENGINE_DOT[run.engine] ?? 'bg-slate-600'}`} />
            <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{run.label}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-400">
              <Leaf size={12} />
              {run.carbonKg} kg
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
