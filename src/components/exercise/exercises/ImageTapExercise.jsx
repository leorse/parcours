import { useState } from 'react'

export default function ImageTapExercise({ exercise, onSubmit, result }) {
  const [selected, setSelected] = useState(null)
  const isSubmitted = result !== null

  const getZoneClass = (zone) => {
    if (!isSubmitted) return selected === zone.id ? 'selected' : ''
    if (zone.id === selected) return zone.correct ? 'correct' : 'incorrect'
    if (zone.correct) return 'correct-reveal'
    return ''
  }

  const handleZoneClick = (zoneId) => {
    if (isSubmitted) return
    setSelected(zoneId)
    onSubmit(zoneId)
  }

  return (
    <div className="exercise-image-tap">
      {exercise.instruction && (
        <p className="exercise-instruction">{exercise.instruction}</p>
      )}
      {exercise.image ? (
        <div className="exercise-image-container">
          <img src={exercise.image} alt="Exercice" />
          <svg
            viewBox="0 0 100 100"
            className="exercise-image-overlay"
            preserveAspectRatio="none"
          >
            {exercise.zones.map((zone) => (
              <rect
                key={zone.id}
                x={zone.coords?.x ?? 0}
                y={zone.coords?.y ?? 0}
                width={zone.coords?.width ?? 10}
                height={zone.coords?.height ?? 10}
                className={`image-zone ${getZoneClass(zone)}`}
                onClick={() => handleZoneClick(zone.id)}
              />
            ))}
          </svg>
        </div>
      ) : (
        <div className="exercise-zone-grid">
          {exercise.zones.map((zone) => (
            <button
              key={zone.id}
              className={`exercise-zone-cell ${getZoneClass(zone)}`}
              onClick={() => handleZoneClick(zone.id)}
              disabled={isSubmitted}
            >
              {zone.label ?? zone.id}
            </button>
          ))}
        </div>
      )}
      {isSubmitted && selected && (
        <div className="exercise-choice-feedback">
          {exercise.zones.find((z) => z.id === selected)?.feedback}
        </div>
      )}
    </div>
  )
}
