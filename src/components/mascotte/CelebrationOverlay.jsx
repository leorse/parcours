// src/components/mascotte/CelebrationOverlay.jsx
// Confettis et feux d'artifice en CSS pur — aucune bibliothèque externe.

import { useEffect, useState } from 'react'

const CONFETTI_COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#F97316', '#EC4899']

function generateConfetti(count) {
  return Array.from({ length: count }, (_, i) => ({
    id:    i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left:  `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    size:  `${6 + Math.random() * 8}px`,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
    speed: `${1.8 + Math.random() * 1.2}s`,
  }))
}

export default function CelebrationOverlay({ animation = 'confetti', onComplete }) {
  const count   = animation === 'fireworks' ? 60 : 40
  const [pieces] = useState(() => generateConfetti(count))

  useEffect(() => {
    const t = setTimeout(onComplete, 2500)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div className="celebration-overlay" onClick={onComplete} role="presentation">
      {pieces.map(p => (
        <div
          key={p.id}
          className={`confetti-piece${p.shape === 'circle' ? ' circle' : ''}`}
          style={{
            left:            p.left,
            backgroundColor: p.color,
            width:           p.size,
            height:          p.size,
            animationDelay:  p.delay,
            animationDuration: p.speed,
          }}
        />
      ))}
    </div>
  )
}
