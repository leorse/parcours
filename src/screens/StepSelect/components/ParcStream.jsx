const CENTER_X = 200

export default function ParcStream({ y }) {
  return (
    <g>
      {/* Berges herbeuses */}
      <rect x="0" y={y - 22} width="400" height="44" fill="#4a9e4a" opacity="0.35" />

      {/* Corps du ruisseau */}
      <path
        d={`M 0 ${y} Q 80 ${y - 10} 200 ${y} Q 320 ${y + 10} 400 ${y}`}
        stroke="#3d9fd4" strokeWidth="28" fill="none"
      />
      {/* Couche claire */}
      <path
        d={`M 0 ${y} Q 80 ${y - 10} 200 ${y} Q 320 ${y + 10} 400 ${y}`}
        stroke="#82ccf7" strokeWidth="16" fill="none" opacity="0.6"
      />
      {/* Reflets de surface */}
      <path d={`M 25 ${y - 5} Q 65 ${y - 11} 105 ${y - 5}`}
            stroke="white" strokeWidth="2" fill="none" opacity="0.55" />
      <path d={`M 200 ${y + 3} Q 245 ${y - 4} 290 ${y + 3}`}
            stroke="white" strokeWidth="2" fill="none" opacity="0.45" />
      <path d={`M 330 ${y - 3} Q 360 ${y - 8} 390 ${y - 3}`}
            stroke="white" strokeWidth="1.5" fill="none" opacity="0.35" />

      {/* Ponton en bois */}
      <rect x={CENTER_X - 24} y={y - 16} width="48" height="32" fill="#8B5E3C" rx="3" opacity="0.93" />
      {/* Lames du ponton */}
      {[0, 9, 18].map((off) => (
        <rect key={off}
              x={CENTER_X - 20} y={y - 13 + off}
              width="40" height="6"
              fill="#a07040" rx="1" />
      ))}
      {/* Poteaux verticaux */}
      <rect x={CENTER_X - 22} y={y - 20} width="5" height="40" fill="#6B4226" rx="1" />
      <rect x={CENTER_X + 17} y={y - 20} width="5" height="40" fill="#6B4226" rx="1" />
      {/* Cordes de sécurité */}
      <line x1={CENTER_X - 20} y1={y - 14} x2={CENTER_X + 20} y2={y - 14}
            stroke="#a07040" strokeWidth="1.5" opacity="0.6" />
    </g>
  )
}
