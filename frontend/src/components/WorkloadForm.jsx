import { useState } from 'react'

export default function WorkloadForm({ onSubmit, loading }) {
  const [text, setText] = useState(
    "We're fine-tuning a 70-billion-parameter LLaMA model using 8 MI300X GPUs in a Virginia data center for 24 hours."
  )

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <label className="text-sm font-medium text-slate-300">Describe your AI workload</label>
      <p className="mt-1 text-xs text-slate-500">
        Natural language in, the agent parses GPU type, count, region, and duration, then reasons about greener alternatives.
      </p>
      <textarea
        className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading) onSubmit(text)
        }}
      />
      <button
        onClick={() => onSubmit(text)}
        disabled={loading}
        className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading ? 'Analyzing…' : 'Analyze →'}
        <kbd className="rounded border border-slate-950/30 bg-emerald-600/40 px-1.5 py-0.5 text-[10px] font-normal">⌘⏎</kbd>
      </button>
    </div>
  )
}
