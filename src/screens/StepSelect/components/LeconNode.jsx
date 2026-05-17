const R = 22

function lightenHex(hex, factor = 0.35) {
  if (!hex?.startsWith('#')) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r + (255 - r) * factor)}, ${Math.round(g + (255 - g) * factor)}, ${Math.round(b + (255 - b) * factor)})`
}

function renderLeconIcon(lecon, cx, cy, isAvailable) {
  if (!isAvailable) {
    const label = lecon.status === 'completed' ? '✓'
                : lecon.status === 'in_progress' ? '▶'
                : '🔒'
    return <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">{label}</text>
  }
  const icon = lecon.icon
  if (icon?.endsWith('.svg')) {
    return (
      <image
        href={`/assets/icons/${icon}`}
        x={cx - 10} y={cy - 10}
        width="20" height="20"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    )
  }
  if (icon) {
    return <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">{icon}</text>
  }
  return <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">▶</text>
}

export default function LeconNode({ x, y, lecon, leconIndex, parentColor, onClick }) {
  const isAvailable  = lecon.status === 'available'
  const isLocked     = lecon.status === 'locked'
  const isInProgress = lecon.status === 'in_progress'
  const isCompleted  = lecon.status === 'completed'

  const fillColor = isCompleted  ? '#4caf50'
                  : isInProgress ? '#f5a623'
                  : isAvailable  ? lightenHex(parentColor, 0.35)
                  :                '#b0b0b0'

  const onRight = leconIndex % 2 === 0
  const textX   = onRight ? x + R + 12 : x - R - 12
  const anchor  = onRight ? 'start' : 'end'
  const lineX1  = onRight ? x + R + 2  : x - R - 2
  const lineX2  = onRight ? textX - 4  : textX + 4

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
      <circle cx={x} cy={y} r={R} fill={fillColor} opacity={isLocked ? 0.6 : 0.95} />
      <circle cx={x} cy={y} r={R} fill="none" stroke="white" strokeWidth="2.5" />

      {/* Reflet */}
      <ellipse cx={x - 7} cy={y - 8} rx="8" ry="5" fill="white" opacity="0.18" />

      {/* Icône */}
      {renderLeconIcon(lecon, x, y, isAvailable)}

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
