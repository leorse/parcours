export default function BancDeco({ x, y }) {
  return (
    <g>
      {/* Assise */}
      <rect x={x} y={y} width="30" height="5" fill="#8B5E3C" rx="2" />
      {/* Dossier */}
      <rect x={x} y={y - 8} width="30" height="4" fill="#a07040" rx="2" />
      {/* Pieds */}
      <rect x={x + 3} y={y + 5} width="4" height="10" fill="#6B4226" rx="1" />
      <rect x={x + 23} y={y + 5} width="4" height="10" fill="#6B4226" rx="1" />
      {/* Support dossier */}
      <rect x={x + 5} y={y - 8} width="3" height="13" fill="#6B4226" rx="1" />
      <rect x={x + 22} y={y - 8} width="3" height="13" fill="#6B4226" rx="1" />
    </g>
  )
}
