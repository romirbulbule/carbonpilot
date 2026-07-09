function intensityColor(g) {
  if (g < 100) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
  if (g < 250) return 'text-amber-400 border-amber-500/40 bg-amber-500/10'
  return 'text-rose-400 border-rose-500/40 bg-rose-500/10'
}

export default function LiveTicker({ carbonIntensity, connected, powerSpark }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
      <span className="text-sm text-slate-400">{connected ? 'Live' : 'Disconnected'}</span>

      {carbonIntensity && (
        <span
          className={`rounded-full border px-3 py-1 text-sm font-medium ${intensityColor(carbonIntensity.carbon_intensity_g)}`}
        >
          {carbonIntensity.region}: {Math.round(carbonIntensity.carbon_intensity_g)} gCO2/kWh
          <span className="ml-1 text-[10px] uppercase opacity-70">{carbonIntensity.source}</span>
        </span>
      )}

      {powerSpark}
    </div>
  )
}
