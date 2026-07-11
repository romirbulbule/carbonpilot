import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

export default function CommandPalette({ open, onClose, actions }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const filtered = useMemo(
    () => actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase())),
    [actions, query]
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-32" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2.5">
          <Search size={15} className="text-slate-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command…"
            className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
          />
          <kbd className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">Esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {!filtered.length && <p className="px-3 py-3 text-sm text-slate-600">No matching commands.</p>}
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                a.run()
                onClose()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
            >
              {a.icon && <a.icon size={15} className="text-emerald-400" />}
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
