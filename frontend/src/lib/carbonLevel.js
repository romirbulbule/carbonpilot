/** Shared carbon-intensity color scale so the map and table always agree. */
export function carbonLevel(g) {
  if (g < 60) return { label: 'Best', color: 'text-emerald-400', hex: '#34d399' }
  if (g < 150) return { label: 'Low', color: 'text-lime-400', hex: '#a3e635' }
  if (g < 250) return { label: 'Med', color: 'text-amber-400', hex: '#fbbf24' }
  return { label: 'High', color: 'text-rose-400', hex: '#fb7185' }
}
