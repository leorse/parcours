import { useState, useMemo } from 'react'
import MathText from '../shared/MathText'

export default function MultipleChoiceExercise({ exercise, onSubmit, result }) {
  const [selected, setSelected] = useState(null)

  const choices = useMemo(() => {
    const list = [...exercise.choices]
    if (exercise.settings?.shuffle) list.sort(() => Math.random() - 0.5)
    return list
  }, [exercise])

  const isSubmitted = result !== null

  const getChoiceClass = (choice) => {
    if (!isSubmitted) return selected === choice.id ? 'selected' : ''
    if (choice.id === selected) return choice.correct ? 'correct' : 'incorrect'
    if (choice.correct) return 'correct-reveal'
    return ''
  }

  return (
    <div className="exercise-mcq">
      <div className="exercise-question">
        <MathText text={exercise.question} />
      </div>
      <div className="exercise-choices">
        {choices.map((choice) => (
          <button
            key={choice.id}
            className={`exercise-choice ${getChoiceClass(choice)}`}
            onClick={() => !isSubmitted && setSelected(choice.id)}
            disabled={isSubmitted}
          >
            <MathText text={choice.text} inline />
          </button>
        ))}
      </div>
      {isSubmitted && selected && (
        <div className="exercise-choice-feedback">
          <MathText text={choices.find((c) => c.id === selected)?.feedback ?? ''} inline />
        </div>
      )}
      {!isSubmitted && (
        <button
          className="exercise-btn-validate"
          disabled={selected === null}
          onClick={() => onSubmit(selected)}
        >
          Vérifier
        </button>
      )}
    </div>
  )
}
