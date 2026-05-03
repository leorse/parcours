import { useState } from 'react'
import MathText from '../shared/MathText'

export default function FillInTheBlanksExercise({ exercise, onSubmit, result }) {
  const [answers, setAnswers] = useState({})
  const isSubmitted = result !== null

  const setAnswer = (blankId, value) =>
    setAnswers((prev) => ({ ...prev, [blankId]: value }))

  const allFilled = exercise.segments
    .filter((s) => s.blank)
    .every((s) => answers[s.blank.id]?.trim())

  const getBlankClass = (blankId) => {
    if (!isSubmitted || !result?.details) return ''
    const expected = exercise.segments.find((s) => s.blank?.id === blankId)?.blank?.answer ?? ''
    const given = (answers[blankId] ?? '').trim()
    const isCaseSensitive = exercise.settings?.case_sensitive ?? false
    const normalize = (v) => (isCaseSensitive ? v : v.toLowerCase())
    return normalize(given) === normalize(expected) ? 'correct' : 'incorrect'
  }

  return (
    <div className="exercise-fitb">
      {exercise.instruction && (
        <p className="exercise-instruction">{exercise.instruction}</p>
      )}
      <div className="exercise-segments">
        {exercise.segments.map((seg, i) => {
          if (seg.text) {
            return (
              <span key={i} className="exercise-segment-text">
                <MathText text={seg.text} inline />
              </span>
            )
          }
          if (seg.blank) {
            const blankClass = getBlankClass(seg.blank.id)
            return (
              <span key={i} className="exercise-blank-wrap">
                <input
                  type="text"
                  className={`exercise-blank ${blankClass}`}
                  value={answers[seg.blank.id] ?? ''}
                  onChange={(e) => setAnswer(seg.blank.id, e.target.value)}
                  disabled={isSubmitted}
                  style={{ width: `${Math.max((seg.blank.answer?.length ?? 4) * 14, 60)}px` }}
                />
                {isSubmitted && blankClass === 'incorrect' && (
                  <span className="exercise-blank-answer">{seg.blank.answer}</span>
                )}
              </span>
            )
          }
          return null
        })}
      </div>
      {exercise.hint && !isSubmitted && (
        <p className="exercise-hint">💡 {exercise.hint}</p>
      )}
      {!isSubmitted && (
        <button
          className="exercise-btn-validate"
          disabled={!allFilled}
          onClick={() => onSubmit(answers)}
        >
          Vérifier
        </button>
      )}
    </div>
  )
}
