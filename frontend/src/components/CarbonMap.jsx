import { useMemo, useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landTopology from 'world-atlas/land-110m.json'
import { carbonLevel } from '../lib/carbonLevel'

const WIDTH = 720
const HEIGHT = 380

const landGeoJson = feature(landTopology, landTopology.objects.land)

export default function CarbonMap({ regions, selectedRegion, onSelectRegion, liveIntensity }) {
  const [hovered, setHovered] = useState(null)

  const projection = useMemo(
    () => geoNaturalEarth1().fitSize([WIDTH, HEIGHT], landGeoJson),
    []
  )
  const path = useMemo(() => geoPath(projection), [projection])
  const landPath = useMemo(() => path(landGeoJson), [path])

  const points = regions
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => {
      const [x, y] = projection([r.lng, r.lat])
      const intensity = r.region === selectedRegion && liveIntensity ? liveIntensity.carbon_intensity_g : r.carbon_intensity_g
      return { ...r, x, y, intensity, lvl: carbonLevel(intensity) }
    })

  const active = hovered || points.find((p) => p.region === selectedRegion)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Region carbon intensity map</h3>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          {['Best', 'Low', 'Med', 'High'].map((label) => {
            const sample = { Best: 30, Low: 100, Med: 200, High: 300 }[label]
            return (
              <span key={label} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: carbonLevel(sample).hex }} />
                {label}
              </span>
            )
          })}
        </div>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        <path d={landPath} className="fill-slate-800 stroke-slate-700" strokeWidth={0.5} />

        {points.map((p) => {
          const isSelected = p.region === selectedRegion
          return (
            <g
              key={p.region}
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectRegion?.(p.region)}
              className="cursor-pointer"
            >
              {isSelected && (
                <circle cx={p.x} cy={p.y} r={9} fill="none" stroke={p.lvl.hex} strokeWidth={1.5} opacity={0.6}>
                  <animate attributeName="r" values="7;12;7" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={p.x} cy={p.y} r={isSelected ? 6 : 4.5} fill={p.lvl.hex} stroke="#0f172a" strokeWidth={1.2} />
            </g>
          )
        })}
      </svg>

      <div className="mt-2 h-10 text-sm">
        {active ? (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: active.lvl.hex }} />
            <span className="font-medium text-slate-200">{active.label}</span>
            <span className="text-slate-400">
              {Math.round(active.intensity)} gCO2/kWh · {active.lvl.label}
              {active.region === selectedRegion && liveIntensity ? ' · live' : ''}
            </span>
          </div>
        ) : (
          <span className="text-slate-600">Hover or click a region to inspect it</span>
        )}
      </div>
    </div>
  )
}
