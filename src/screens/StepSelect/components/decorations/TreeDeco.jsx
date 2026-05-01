export default function TreeDeco({ x, y }) {
  return (
    <g>
      <rect x={x - 4} y={y} width="8" height="26" fill="#8B5E3C" rx="2" />
      <circle cx={x} cy={y - 2} r="19" fill="#2d7a2d" />
      <circle cx={x - 9} cy={y + 6} r="14" fill="#34a034" />
      <circle cx={x + 8} cy={y + 5} r="12" fill="#2d7a2d" />
      <circle cx={x} cy={y - 14} r="11" fill="#3db53d" />
    </g>
  )
}
