export default function ExerciseBlock({ exercise_id }) {
  return (
    <div className="exercise-placeholder">
      <span className="exercise-placeholder-icon">✏️</span>
      <span>Exercice : <code>{exercise_id}</code></span>
      <span className="exercise-placeholder-badge">À venir</span>
    </div>
  )
}
