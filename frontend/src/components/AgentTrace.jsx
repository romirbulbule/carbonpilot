export default function AgentTrace({ trace }) {
  if (!trace) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-600">
        Describe a workload above and hit Analyze to see the agent reason through it.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-sm font-medium text-slate-300">CarbonPilot agent analysis</h3>
      <div className="space-y-2 text-sm">
        {trace.map((step, i) => {
          if (step.type === 'thought') {
            return (
              <p key={i} className="text-slate-400">
                <span className="text-slate-600">Thought: </span>
                {step.text}
              </p>
            )
          }
          if (step.type === 'tool_call') {
            return (
              <div key={i} className="rounded-lg bg-slate-800/50 p-2 font-mono text-xs text-slate-400">
                <span className="text-sky-400">{step.name}</span>({JSON.stringify(step.input)})
              </div>
            )
          }
          return (
            <p key={i} className="font-medium text-emerald-300">
              {step.text}
            </p>
          )
        })}
      </div>
    </div>
  )
}
