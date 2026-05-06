import { useState } from 'react'

const COLORS = {
  pizza:     { empty: '#fdf3e0', stroke: '#c8a060', selected: '#e07018', correct: '#85BB4B', incorrect: '#ec6d5c' },
  cake:      { empty: '#fdf0f5', stroke: '#d07090', selected: '#c0607a', correct: '#85BB4B', incorrect: '#ec6d5c' },
  chocolate: { empty: '#f5e8d8', stroke: '#5c3420', selected: '#5c3218', correct: '#85BB4B', incorrect: '#ec6d5c' },
}

function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function PizzaShape({ pieces, selected, isSubmitted, resultCorrect, onToggle, colors }) {
  const cx = 65, cy = 65, r = 58
  return (
    <svg className="fraction-tap-svg" viewBox="0 0 130 130">
      {Array.from({ length: pieces }, (_, i) => {
        const startDeg = (360 * i) / pieces
        const endDeg = (360 * (i + 1)) / pieces
        const s = polarToXY(cx, cy, r, startDeg)
        const e = polarToXY(cx, cy, r, endDeg)
        const largeArc = endDeg - startDeg > 180 ? 1 : 0
        const d = `M ${cx},${cy} L ${s.x},${s.y} A ${r},${r} 0 ${largeArc},1 ${e.x},${e.y} Z`
        const isSel = selected.has(i)
        let fill = isSel ? colors.selected : colors.empty
        if (isSubmitted && isSel) fill = resultCorrect ? colors.correct : colors.incorrect

        return (
          <path key={i} d={d}
            fill={fill}
            stroke={colors.stroke}
            strokeWidth="1.5"
            style={{ cursor: isSubmitted ? 'default' : 'pointer', transition: 'fill 0.15s' }}
            onClick={() => onToggle(i)}
          />
        )
      })}
    </svg>
  )
}

function ChocolateShape({ pieces, selected, isSubmitted, resultCorrect, onToggle, colors }) {
  const cols = pieces <= 4 ? pieces : pieces <= 6 ? 3 : 4
  const rows = Math.ceil(pieces / cols)
  const pad = 8, gap = 5
  const cellW = (130 - 2 * pad - gap * (cols - 1)) / cols
  const cellH = (130 - 2 * pad - gap * (rows - 1)) / rows

  return (
    <svg className="fraction-tap-svg" viewBox="0 0 130 130">
      {Array.from({ length: pieces }, (_, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = pad + col * (cellW + gap)
        const y = pad + row * (cellH + gap)
        const isSel = selected.has(i)
        let fill = isSel ? colors.selected : colors.empty
        if (isSubmitted && isSel) fill = resultCorrect ? colors.correct : colors.incorrect

        return (
          <rect key={i} x={x} y={y} width={cellW} height={cellH} rx="4"
            fill={fill}
            stroke={colors.stroke}
            strokeWidth="1.5"
            style={{ cursor: isSubmitted ? 'default' : 'pointer', transition: 'fill 0.15s' }}
            onClick={() => onToggle(i)}
          />
        )
      })}
    </svg>
  )
}

export default function FractionTapExercise({ exercise, onSubmit, result }) {
  const {
    pieces = 8,
    shape = 'pizza',
    question,
    target_numerator: targetNum = 1,
    target_denominator: targetDen = 2,
    feedback,
  } = exercise

  const [selected, setSelected] = useState(new Set())
  const isSubmitted = result !== null
  const colors = COLORS[shape] ?? COLORS.pizza
  const expectedCount = (pieces * targetNum) / targetDen

  const togglePiece = (i) => {
    if (isSubmitted) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const ShapeComponent = shape === 'chocolate' ? ChocolateShape : PizzaShape

  return (
    <div className="exercise-fraction-tap">
      {question && <p className="exercise-question">{question}</p>}
      <p className="fraction-tap-hint">
        Clique sur les parts · {selected.size} / {expectedCount} sélectionnée{selected.size > 1 ? 's' : ''}
      </p>
      <div className="fraction-tap-shapes">
        <ShapeComponent
          pieces={pieces}
          selected={selected}
          isSubmitted={isSubmitted}
          resultCorrect={result?.correct}
          onToggle={togglePiece}
          colors={colors}
        />
      </div>
      {!isSubmitted && (
        <button
          className="exercise-btn-validate"
          onClick={() => onSubmit({ selected: [...selected], pieces })}
          disabled={selected.size === 0}
        >
          Valider
        </button>
      )}
      {isSubmitted && feedback && (
        <div className="exercise-choice-feedback">
          {result?.correct
            ? feedback.correct
            : (feedback.incorrect ?? '').replace('{expected}', String(expectedCount))}
        </div>
      )}
    </div>
  )
}
