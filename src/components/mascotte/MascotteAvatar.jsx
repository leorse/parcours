// src/components/mascotte/MascotteAvatar.jsx
// Animations CSS pures au jalon 6.
// ═══════════════════════════════════════════════════════
// JALON 8a — Android natif :
// Remplacer les animations CSS par des fichiers Lottie
// Dossier : assets/animations/mascotte-{animation}.json
// Lib     : com.airbnb.android:lottie-compose
// ═══════════════════════════════════════════════════════

const ANIMATION_CLASSES = {
  wave:      'mascotte-wave',
  happy:     'mascotte-bounce',
  excited:   'mascotte-jump',
  jump:      'mascotte-jump',
  concerned: 'mascotte-shake',
  thinking:  'mascotte-tilt',
  proud:     'mascotte-grow',
  celebrate: 'mascotte-spin',
  amazed:    'mascotte-pulse',
  sleepy:    'mascotte-sway',
}

export default function MascotteAvatar({ animation = 'wave' }) {
  const animClass = ANIMATION_CLASSES[animation] ?? 'mascotte-wave'

  return (
    <div className={`mascotte-avatar ${animClass}`}>
      <img
        src="/assets/mascotte/lumio.webp"
        alt="Lumio la mascotte"
        className="mascotte-img"
        onError={e => { e.target.style.display = 'none' }}
      />
    </div>
  )
}
