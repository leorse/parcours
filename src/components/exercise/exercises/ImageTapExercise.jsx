import { useState, useEffect } from 'react'
import MathText from '../shared/MathText'

const INKSCAPE_NS = 'http://www.inkscape.org/namespaces/inkscape'

function parseLabel(el) {
  return el.getAttributeNS(INKSCAPE_NS, 'label') || el.getAttribute('id') || ''
}

function parseShape(el) {
  const tag = el.tagName.toLowerCase()
  const id = parseLabel(el)
  if (!id) return null
  if (tag === 'rect')    return { id, tag, x: +el.getAttribute('x'), y: +el.getAttribute('y'), width: +el.getAttribute('width'), height: +el.getAttribute('height') }
  if (tag === 'polygon') return { id, tag, points: el.getAttribute('points') }
  if (tag === 'path')    return { id, tag, d: el.getAttribute('d') }
  if (tag === 'circle')  return { id, tag, cx: +el.getAttribute('cx'), cy: +el.getAttribute('cy'), r: +el.getAttribute('r') }
  if (tag === 'ellipse') return { id, tag, cx: +el.getAttribute('cx'), cy: +el.getAttribute('cy'), rx: +el.getAttribute('rx'), ry: +el.getAttribute('ry') }
  return null
}

function useSvgZones(svgUrl) {
  const [svgData, setSvgData] = useState(null)

  useEffect(() => {
    if (!svgUrl) { setSvgData(null); return }
    fetch(svgUrl)
      .then((r) => r.text())
      .then((text) => {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
        const svgEl = doc.querySelector('svg')
        const viewBox = svgEl?.getAttribute('viewBox') ?? '0 0 100 100'

        // Look for a layer/group named "zone" or "zones", fallback to whole SVG
        const allGroups = Array.from(doc.querySelectorAll('g'))
        const zonesLayer = allGroups.find((g) => {
          const lbl = parseLabel(g).toLowerCase()
          return lbl === 'zone' || lbl === 'zones'
        })
        const container = zonesLayer ?? svgEl

        const shapes = Array.from(container.querySelectorAll('rect,polygon,path,circle,ellipse'))
          .map(parseShape)
          .filter(Boolean)

        setSvgData({ viewBox, shapes })
      })
      .catch(() => setSvgData(null))
  }, [svgUrl])

  return svgData
}

function SvgShape({ shape, className, onClick }) {
  const props = { className, onClick }
  if (shape.tag === 'polygon') return <polygon points={shape.points} {...props} />
  if (shape.tag === 'path')    return <path d={shape.d} {...props} />
  if (shape.tag === 'circle')  return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...props} />
  if (shape.tag === 'ellipse') return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...props} />
  return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} {...props} />
}

export default function ImageTapExercise({ exercise, onSubmit, result }) {
  const [selected, setSelected] = useState(null)
  const isSubmitted = result !== null

  // Load SVG zones if svg_zones path is provided
  const svgData = useSvgZones(exercise.svg_zones ?? null)

  const getZoneClass = (zone) => {
    if (!isSubmitted) return selected === zone.id ? 'selected' : ''
    if (zone.id === selected) return zone.correct ? 'correct' : 'incorrect'
    if (zone.correct) return 'correct-reveal'
    return ''
  }

  const handleZoneClick = (zoneId) => {
    if (isSubmitted) return
    setSelected(zoneId)
    onSubmit(zoneId)
  }

  // Build a lookup from zone id → zone definition
  const zoneLookup = Object.fromEntries((exercise.zones ?? []).map((z) => [z.id, z]))

  const renderOverlay = () => {
    // Mode SVG dynamique : formes extraites du fichier SVG
    if (exercise.svg_zones && svgData) {
      return (
        <svg viewBox={svgData.viewBox} className="exercise-image-overlay" preserveAspectRatio="none">
          {svgData.shapes.map((shape) => {
            const zone = zoneLookup[shape.id]
            if (!zone) return null
            return (
              <SvgShape
                key={shape.id}
                shape={shape}
                className={`image-zone ${getZoneClass(zone)}`}
                onClick={() => handleZoneClick(zone.id)}
              />
            )
          })}
        </svg>
      )
    }

    // Mode coords YAML (rétrocompatibilité)
    return (
      <svg viewBox="0 0 100 100" className="exercise-image-overlay" preserveAspectRatio="none">
        {(exercise.zones ?? []).map((zone) => {
          const cls = `image-zone ${getZoneClass(zone)}`
          const onClick = () => handleZoneClick(zone.id)
          if (zone.shape === 'polygon' && zone.points) return <polygon key={zone.id} points={zone.points} className={cls} onClick={onClick} />
          if (zone.shape === 'path' && zone.d)         return <path key={zone.id} d={zone.d} className={cls} onClick={onClick} />
          return <rect key={zone.id} x={zone.coords?.x ?? 0} y={zone.coords?.y ?? 0} width={zone.coords?.width ?? 10} height={zone.coords?.height ?? 10} className={cls} onClick={onClick} />
        })}
      </svg>
    )
  }

  return (
    <div className="exercise-image-tap">
      {exercise.instruction && (
        <div className="exercise-instruction"><MathText text={exercise.instruction} /></div>
      )}
      {exercise.image ? (
        <div className="exercise-image-container">
          <img src={exercise.image} alt="Exercice" />
          {renderOverlay()}
        </div>
      ) : (
        <div className="exercise-zone-grid">
          {(exercise.zones ?? []).map((zone) => (
            <button
              key={zone.id}
              className={`exercise-zone-cell ${getZoneClass(zone)}`}
              onClick={() => handleZoneClick(zone.id)}
              disabled={isSubmitted}
            >
              {zone.label ?? zone.id}
            </button>
          ))}
        </div>
      )}
      {isSubmitted && selected && (
        <div className="exercise-choice-feedback">
          {zoneLookup[selected]?.feedback}
        </div>
      )}
    </div>
  )
}
