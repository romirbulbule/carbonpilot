import { useEffect, useMemo, useRef, useState } from 'react'
import { geoOrthographic, geoPath, geoDistance, geoGraticule10 } from 'd3-geo'
import { feature } from 'topojson-client'
import { Pause, Play } from 'lucide-react'
import landTopology from 'world-atlas/land-110m.json'
import { carbonLevel } from '../lib/carbonLevel'

const WIDTH = 720
const HEIGHT = 380
const AUTO_ROTATE_DEG_PER_FRAME = 0.04
const DRAG_SENSITIVITY = 0.3

const landGeoJson = feature(landTopology, landTopology.objects.land)

export default function CarbonMap({ regions, selectedRegion, onSelectRegion, liveIntensity }) {
  const [hovered, setHovered] = useState(null)
  const [rotation, setRotation] = useState({ lambda: -60, phi: -20 })
  const [autoRotate, setAutoRotate] = useState(true)
  const dragState = useRef(null)

  const projection = useMemo(
    () => geoOrthographic().fitSize([WIDTH, HEIGHT], { type: 'Sphere' }).clipAngle(90),
    []
  )

  useEffect(() => {
    if (!autoRotate) return
    let raf
    function tick() {
      if (!dragState.current) {
        setRotation((r) => ({ ...r, lambda: r.lambda + AUTO_ROTATE_DEG_PER_FRAME }))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoRotate, hovered])

  projection.rotate([rotation.lambda, rotation.phi])
  const path = useMemo(() => geoPath(projection), [projection, rotation])
  const landPath = path(landGeoJson)
  const spherePath = path({ type: 'Sphere' })
  const graticulePath = path(geoGraticule10())

  const center = [-rotation.lambda, -rotation.phi]
  const points = regions
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => {
      const visible = geoDistance([r.lng, r.lat], center) < Math.PI / 2 - 0.05
      const [x, y] = projection([r.lng, r.lat])
      const intensity = r.region === selectedRegion && liveIntensity ? liveIntensity.carbon_intensity_g : r.carbon_intensity_g
      return { ...r, x, y, visible, intensity, lvl: carbonLevel(intensity) }
    })

  const active = hovered || points.find((p) => p.region === selectedRegion && p.visible)

  function handlePointerDown(e) {
    dragState.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.x
    const dy = e.clientY - dragState.current.y
    dragState.current = { x: e.clientX, y: e.clientY }
    setRotation((r) => ({
      lambda: r.lambda + dx * DRAG_SENSITIVITY,
      phi: Math.max(-90, Math.min(90, r.phi - dy * DRAG_SENSITIVITY)),
    }))
  }

  function handlePointerUp(e) {
    dragState.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // pointer capture already released
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Region carbon intensity globe</h3>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setAutoRotate((v) => !v)}
            className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:border-emerald-500 hover:text-emerald-400"
            title={autoRotate ? 'Pause rotation' : 'Resume rotation'}
          >
            {autoRotate ? <Pause size={10} /> : <Play size={10} />}
          </button>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full cursor-grab active:cursor-grabbing touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <path d={spherePath} className="fill-slate-950 stroke-slate-700" strokeWidth={1} />
        <path d={graticulePath} className="fill-none stroke-slate-800" strokeWidth={0.5} />
        <path d={landPath} className="fill-slate-800 stroke-slate-600" strokeWidth={0.4} />

        {points
          .filter((p) => p.visible)
          .map((p) => {
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
          <span className="text-slate-600">Drag to rotate the globe · hover or click a region to inspect it</span>
        )}
      </div>
    </div>
  )
}
