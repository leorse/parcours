export default function ReverbereDeco({ x, y }) {
  return (
    <g>
      {/* Pied */}
      <rect x={x - 1} y={y} width="3" height="30" fill="#555" rx="1" />
      {/* Base */}
      <rect x={x - 5} y={y + 27} width="11" height="4" fill="#444" rx="2" />
      {/* Bras courbe */}
      <path
        d={`M${x + 1} ${y} Q${x + 9} ${y - 10} ${x + 15} ${y - 7}`}
        stroke="#555" strokeWidth="2.5" fill="none"
      />
      {/* Lanterne */}
      <ellipse cx={x + 15} cy={y - 8} rx="5" ry="6" fill="#ffe066" opacity="0.9" />
      <ellipse cx={x + 15} cy={y - 8} rx="5" ry="6" fill="none" stroke="#aaa" strokeWidth="1" />
      {/* Halo lumineux */}
      <circle cx={x + 15} cy={y - 8} r="9" fill="#ffe066" opacity="0.15" />
    </g>
  )
}
