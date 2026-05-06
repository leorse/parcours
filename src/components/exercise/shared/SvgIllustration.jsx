const COLORS = {
  pizza:     { filled: '#f0a020', empty: '#fdf3e0', stroke: '#c8a060' },
  cake:      { filled: '#e88cb0', empty: '#fdf0f5', stroke: '#d07090' },
  chocolate: { filled: '#7b4a2d', empty: '#f5e8d8', stroke: '#5c3420' },
  gauge:     { filled: '#85BB4B', empty: '#e2f0d0', stroke: '#6a9940' },
}

function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function CircleSlices({ pieces, filled, colors }) {
  const cx = 50
  const cy = 50
  const r = 44

  if (pieces === 1) {
    return (
      <circle cx={cx} cy={cy} r={r}
        fill={filled >= 1 ? colors.filled : colors.empty}
        stroke={colors.stroke} strokeWidth="2" />
    )
  }

  return Array.from({ length: pieces }, (_, i) => {
    const startDeg = (360 * i) / pieces
    const endDeg = (360 * (i + 1)) / pieces
    const s = polarToXY(cx, cy, r, startDeg)
    const e = polarToXY(cx, cy, r, endDeg)
    const largeArc = (endDeg - startDeg) > 180 ? 1 : 0
    const d = `M ${cx},${cy} L ${s.x},${s.y} A ${r},${r} 0 ${largeArc},1 ${e.x},${e.y} Z`
    return (
      <path key={i} d={d}
        fill={i < filled ? colors.filled : colors.empty}
        stroke={colors.stroke} strokeWidth="1.5" />
    )
  })
}

function ChocolateGrid({ pieces, filled, colors }) {
  const cols = pieces <= 4 ? pieces : pieces <= 6 ? 3 : 4
  const rows = Math.ceil(pieces / cols)
  const pad = 6
  const gap = 4
  const cellW = (100 - 2 * pad - gap * (cols - 1)) / cols
  const cellH = (100 - 2 * pad - gap * (rows - 1)) / rows

  return Array.from({ length: pieces }, (_, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = pad + col * (cellW + gap)
    const y = pad + row * (cellH + gap)
    return (
      <rect key={i} x={x} y={y} width={cellW} height={cellH} rx="4"
        fill={i < filled ? colors.filled : colors.empty}
        stroke={colors.stroke} strokeWidth="1.5" />
    )
  })
}

function SingleShape({ type, pieces, filled, colors }) {
  const isCircle = type === 'pizza' || type === 'cake'
  return (
    <svg className="svg-illustration-shape" viewBox="0 0 100 100">
      {isCircle
        ? <CircleSlices pieces={pieces} filled={filled} colors={colors} />
        : <ChocolateGrid pieces={pieces} filled={filled} colors={colors} />
      }
    </svg>
  )
}

function GaugeBar({ numerator, denominator, colors }) {
  const ratio = Math.min(numerator / denominator, 1)
  const fillW = ratio * 84  // bar width is 84 (from x=8 to x=92)
  return (
    <svg className="svg-illustration-gauge" viewBox="0 0 200 56">
      <rect x="8" y="14" width="184" height="28" rx="14"
        fill={colors.empty} stroke={colors.stroke} strokeWidth="2" />
      {fillW > 0 && (
        <rect x="8" y="14" width={fillW} height="28" rx="14" fill={colors.filled} />
      )}
      <text x="100" y="50" textAnchor="middle" fontSize="10" fill="#666" fontFamily="sans-serif">
        {numerator}/{denominator}
      </text>
    </svg>
  )
}

export default function SvgIllustration({ visual }) {
  if (!visual) return null
  const { type = 'pizza', numerator = 1, denominator = 2 } = visual
  if (!numerator || !denominator || denominator === 0) return null

  const colors = COLORS[type] ?? COLORS.pizza

  if (type === 'gauge') {
    return (
      <div className="svg-illustration-wrap">
        <GaugeBar numerator={numerator} denominator={denominator} colors={colors} />
      </div>
    )
  }

  // Split into full shapes + remainder
  const fullCount = Math.floor(numerator / denominator)
  const remainder = numerator % denominator
  const shapes = [
    ...Array.from({ length: fullCount }, (_, i) => ({ key: `full-${i}`, filled: denominator })),
    ...(remainder > 0 ? [{ key: 'rem', filled: remainder }] : []),
  ]

  return (
    <div className="svg-illustration-wrap">
      <div className="svg-illustration-row">
        {shapes.map(s => (
          <SingleShape key={s.key} type={type} pieces={denominator} filled={s.filled} colors={colors} />
        ))}
      </div>
    </div>
  )
}
