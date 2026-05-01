import { useMemo } from 'react'
import TreeDeco from './decorations/TreeDeco'
import BuissonDeco from './decorations/BuissonDeco'
import BancDeco from './decorations/BancDeco'
import ReverbereDeco from './decorations/ReverbereDeco'

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateDecorations(courseId, totalHeight, streamYs) {
  const seed = Array.from(courseId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const rng  = seededRandom(seed)
  const decos = []

  const isTooClose = (y) =>
    streamYs.some((sy) => Math.abs(y - sy) < 45)

  const tryAdd = (type, xFn, tries = 8) => {
    for (let i = 0; i < tries; i++) {
      const x = xFn(rng)
      const y = 60 + rng() * (totalHeight - 120)
      if (!isTooClose(y)) { decos.push({ type, x, y }); return }
    }
  }

  const leftX  = (r) => 12 + r() * 78
  const rightX = (r) => 312 + r() * 76

  const trees   = Math.max(3, Math.floor(totalHeight / 180))
  const bushes  = Math.max(5, Math.floor(totalHeight / 120))
  const benches = Math.max(1, Math.floor(totalHeight / 360))
  const lamps   = Math.max(2, Math.floor(totalHeight / 260))

  for (let i = 0; i < trees;   i++) tryAdd('tree',      rng() > 0.5 ? leftX : rightX)
  for (let i = 0; i < bushes;  i++) tryAdd('buisson',   rng() > 0.5 ? leftX : rightX)
  for (let i = 0; i < benches; i++) tryAdd('banc',      rng() > 0.5 ? leftX : rightX)
  for (let i = 0; i < lamps;   i++) tryAdd('reverbere', rng() > 0.5 ? leftX : rightX)

  return decos
}

export default function ParcBackground({ totalHeight, courseId, streamYs }) {
  const decos = useMemo(
    () => generateDecorations(courseId, totalHeight, streamYs),
    [courseId, totalHeight] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <g>
      {/* Herbe principale */}
      <rect width="400" height={totalHeight} fill="#5aad58" />
      {/* Zones latérales plus claires */}
      <rect x="0"   y="0" width="90"  height={totalHeight} fill="#6abf69" opacity="0.45" />
      <rect x="310" y="0" width="90"  height={totalHeight} fill="#6abf69" opacity="0.45" />
      {/* Légère texture (bandes très subtiles) */}
      {Array.from({ length: Math.ceil(totalHeight / 80) }, (_, i) => (
        <rect key={i} x="0" y={i * 80} width="400" height="40" fill="black" opacity="0.02" />
      ))}

      {/* Décorations */}
      {decos.map((d, i) => {
        if (d.type === 'tree')      return <TreeDeco      key={i} x={d.x} y={d.y} />
        if (d.type === 'buisson')   return <BuissonDeco   key={i} x={d.x} y={d.y} />
        if (d.type === 'banc')      return <BancDeco      key={i} x={d.x} y={d.y} />
        if (d.type === 'reverbere') return <ReverbereDeco key={i} x={d.x} y={d.y} />
        return null
      })}
    </g>
  )
}
