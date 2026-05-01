const R = 38

export default function GrandeEtapeNode({ x, y, step, onClick }) {
  const isLocked     = step.status === 'locked'
  const isCompleted  = step.status === 'completed'
  const isInProgress = step.status === 'in_progress'
  const fillColor    = isLocked ? '#aaaaaa' : step.color

  return (
    <g onClick={isLocked ? undefined : onClick} style={{ cursor: isLocked ? 'default' : 'pointer' }}>
      {/* Anneau pulsant — étape en cours */}
      {isInProgress && (
        <circle cx={x} cy={y} r={R} fill="none" stroke={step.color} strokeWidth="4" opacity="0.5">
          <animate attributeName="r"       values={`${R};${R + 14};${R}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5"              dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Ombre portée */}
      <circle cx={x} cy={y + 5} r={R} fill="black" opacity="0.18" />

      {/* Cercle principal */}
      <circle cx={x} cy={y} r={R} fill={fillColor} opacity={isLocked ? 0.65 : 0.95} />

      {/* Bordure blanche (tiretée si verrouillé) */}
      <circle
        cx={x} cy={y} r={R}
        fill="none" stroke="white" strokeWidth="3"
        strokeDasharray={isLocked ? '8 4' : 'none'}
      />

      {/* Reflet interne */}
      <ellipse cx={x - 10} cy={y - 14} rx="14" ry="8" fill="white" opacity="0.15" />

      {/* Icône texte */}
      <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="auto" fontSize="22" fill="white" fontWeight="bold">
        {isLocked ? '🔒' : step.icon}
      </text>

      {/* Badge "terminé" */}
      {isCompleted && (
        <g>
          <circle cx={x + 30} cy={y - 30} r={14} fill="#4caf50" />
          <circle cx={x + 30} cy={y - 30} r={14} fill="none" stroke="white" strokeWidth="2" />
          <text x={x + 30} y={y - 25} textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">✓</text>
        </g>
      )}

      {/* Étiquette titre sous le rond */}
      <rect x={x - 72} y={y + R + 8} width="144" height="22" fill="white" rx="11" opacity="0.92" />
      <text
        x={x} y={y + R + 23}
        textAnchor="middle"
        fontFamily="Nunito, sans-serif"
        fontSize="11"
        fontWeight="700"
        fill={isLocked ? '#999' : step.color}
      >
        {step.title}
      </text>
    </g>
  )
}
