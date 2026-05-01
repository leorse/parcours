const R = 22

const STATUS = {
  completed:   { fill: '#4caf50', label: '✓' },
  in_progress: { fill: '#f5a623', label: '▶' },
  locked:      { fill: '#b0b0b0', label: '🔒' },
}

export default function LeconNode({ x, y, lecon, leconIndex, parentColor, onClick }) {
  const style      = STATUS[lecon.status] ?? STATUS.locked
  const isLocked   = lecon.status === 'locked'
  const isInProgress = lecon.status === 'in_progress'

  // Alterne le titre gauche / droite selon l'index
  const onRight    = leconIndex % 2 === 0
  const textX      = onRight ? x + R + 12 : x - R - 12
  const anchor     = onRight ? 'start' : 'end'
  const lineX1     = onRight ? x + R + 2  : x - R - 2
  const lineX2     = onRight ? textX - 4   : textX + 4

  return (
    <g onClick={isLocked ? undefined : onClick} style={{ cursor: isLocked ? 'default' : 'pointer' }}>
      {/* Anneau pulsant */}
      {isInProgress && (
        <circle cx={x} cy={y} r={R} fill="none" stroke={parentColor ?? '#f5a623'} strokeWidth="3" opacity="0.5">
          <animate attributeName="r"       values={`${R};${R + 10};${R}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5"              dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Ombre */}
      <circle cx={x} cy={y + 2} r={R} fill="black" opacity="0.12" />

      {/* Cercle */}
      <circle cx={x} cy={y} r={R} fill={style.fill} opacity={isLocked ? 0.6 : 0.95} />
      <circle cx={x} cy={y} r={R} fill="none" stroke="white" strokeWidth="2.5" />

      {/* Reflet */}
      <ellipse cx={x - 7} cy={y - 8} rx="8" ry="5" fill="white" opacity="0.18" />

      {/* Label statut */}
      <text x={x} y={y + 5} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">
        {style.label}
      </text>

      {/* Trait de connexion vers le titre */}
      <line x1={lineX1} y1={y} x2={lineX2} y2={y} stroke="white" strokeWidth="1" opacity="0.35" />

      {/* Titre */}
      <text
        x={textX} y={y + 5}
        textAnchor={anchor}
        fontFamily="Inter, sans-serif"
        fontSize="11"
        fontWeight={isInProgress ? '700' : '400'}
        fill={isLocked ? 'rgba(255,255,255,0.45)' : 'white'}
      >
        {lecon.title}
      </text>
    </g>
  )
}
