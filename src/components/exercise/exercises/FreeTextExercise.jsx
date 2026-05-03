export default function FreeTextExercise({ exercise }) {
  return (
    <div className="exercise-free-text">
      {exercise.instruction && (
        <p className="exercise-instruction">{exercise.instruction}</p>
      )}
      {exercise.prompt && (
        <p className="exercise-free-text-prompt">{exercise.prompt}</p>
      )}
      <textarea
        className="exercise-free-text-area"
        disabled
        placeholder="Correction manuelle — disponible prochainement (jalon 3bis)"
        rows={4}
      />
      <div className="exercise-free-text-notice">
        ✏️ Cet exercice sera corrigé dans une prochaine version.
      </div>
    </div>
  )
}
