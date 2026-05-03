import MathText from './MathText'

export default function ExerciseResult({ result, xp, onReset }) {
  if (!result) return null

  const { correct, score, details } = result
  const isIndeterminate = correct === null
  const isSuccess = !isIndeterminate && score >= 0.5
  const xpEarned = isIndeterminate ? null : Math.round((xp ?? 0) * (score ?? 0))
  const feedback = details?.feedback

  return (
    <div className={`exercise-result ${isIndeterminate ? 'indeterminate' : isSuccess ? 'correct' : 'incorrect'}`}>
      <div className="exercise-result-icon">
        {isIndeterminate ? '📝' : isSuccess ? '✅' : '❌'}
      </div>
      <div className="exercise-result-body">
        {!isIndeterminate && (
          <div className="exercise-result-score">
            {Math.round((score ?? 0) * 100)}%
          </div>
        )}
        {feedback && (
          <div className="exercise-result-feedback">
            <MathText text={feedback} />
          </div>
        )}
        {xpEarned !== null && (
          <div className="exercise-result-xp">+{xpEarned} XP</div>
        )}
      </div>
      {onReset && !isSuccess && !isIndeterminate && (
        <button className="exercise-result-retry" onClick={onReset}>
          Réessayer
        </button>
      )}
    </div>
  )
}
