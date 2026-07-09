import { carbonLevel } from '../lib/carbonLevel'

export default function RegionTable({ regions }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-sm font-medium text-slate-300">Region carbon intensity</h3>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-slate-500">
            <th className="pb-2">Region</th>
            <th className="pb-2">gCO2/kWh</th>
            <th className="pb-2">Rating</th>
          </tr>
        </thead>
        <tbody>
          {regions.map((r) => {
            const lvl = carbonLevel(r.carbon_intensity_g)
            return (
              <tr key={r.region} className="border-t border-slate-800/60">
                <td className="py-1.5">{r.label}</td>
                <td className="py-1.5">{r.carbon_intensity_g}</td>
                <td className={`py-1.5 font-medium ${lvl.color}`}>{lvl.label}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
