// src/components/personnages/SpriteEmotion.jsx
// Affiche une émotion d'un personnage via spritesheet CSS.
// Ne charge personnages.yaml qu'une seule fois (cache dans personnageService).

import { useState, useEffect } from 'react'
import { getPersonnage, getSpritePosition } from '../../services/personnageService'

export default function SpriteEmotion({
  name,           // ex: "Crac"
  emotion,        // ex: "content"
  size = 120,     // taille d'affichage en px
  className = '',
}) {
  const [personnage, setPersonnage] = useState(null)

  useEffect(() => {
    getPersonnage(name).then(setPersonnage)
  }, [name])

  if (!personnage) return <div style={{ width: size, height: size, flexShrink: 0 }} />

  const { x, y } = getSpritePosition(personnage, emotion)
  const scale     = size / personnage.width

  return (
    <div
      className={`sprite-emotion ${className}`}
      style={{
        width:              size,
        height:             size,
        backgroundImage:    `url(/assets/${personnage.spritesheet})`,
        backgroundSize:     `${personnage.cols * personnage.width * scale}px ${personnage.rows * personnage.height * scale}px`,
        backgroundPosition: `${x * scale}px ${y * scale}px`,
        backgroundRepeat:   'no-repeat',
        flexShrink:         0,
      }}
      role="img"
      aria-label={`${name} — ${emotion}`}
    />
  )
}
