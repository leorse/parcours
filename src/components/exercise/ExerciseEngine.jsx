import { useState, useEffect } from 'react'
import { validateAnswer } from '../../services/exerciseService'
import { calcScore, recordResult } from '../../services/scoreService'
import ExerciseResult from './shared/ExerciseResult'
import MultipleChoiceExercise from './exercises/MultipleChoiceExercise'
import FillInTheBlanksExercise from './exercises/FillInTheBlanksExercise'
import ImageTapExercise from './exercises/ImageTapExercise'
import DragDropExercise from './exercises/DragDropExercise'
import TimelineExercise from './exercises/TimelineExercise'
import FreeTextExercise from './exercises/FreeTextExercise'
import MatchingExercise from './exercises/MatchingExercise'

const EXERCISE_REGISTRY = {
  multiple_choice: MultipleChoiceExercise,
  fill_in_the_blank: FillInTheBlanksExercise,
  image_tap: ImageTapExercise,
  drag_drop: DragDropExercise,
  timeline: TimelineExercise,
  free_text: FreeTextExercise,
  matching: MatchingExercise,
}

export default function ExerciseEngine({
  exercise,
  injectedAnswer = null,
  debugMode = false,
  onDebugResult = null,
}) {
  const [result, setResult] = useState(null)

  // Auto-submit when debug injects an answer
  useEffect(() => {
    if (injectedAnswer === null) return
    const validation = validateAnswer(exercise.exercise, injectedAnswer)
    const computed = calcScore(validation, exercise)
    const fullResult = { ...validation, ...computed }
    setResult(fullResult)
    recordResult(exercise.id, fullResult)
    onDebugResult?.(injectedAnswer)
  }, [injectedAnswer]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (userAnswer) => {
    const validation = validateAnswer(exercise.exercise, userAnswer)
    const computed = calcScore(validation, exercise)
    const fullResult = { ...validation, ...computed }
    setResult(fullResult)
    recordResult(exercise.id, fullResult)
    onDebugResult?.(userAnswer)
  }

  const handleReset = () => setResult(null)

  const ExerciseComponent = EXERCISE_REGISTRY[exercise?.exercise?.type]

  if (!ExerciseComponent) {
    return (
      <div className="exercise-engine">
        <div className="exercise-unknown">
          Type inconnu : <code>{exercise?.exercise?.type}</code>
        </div>
      </div>
    )
  }

  return (
    <div className="exercise-engine">
      <div className="exercise-meta">
        <span className="exercise-difficulty">
          {'★'.repeat(exercise.difficulty ?? 1)}{'☆'.repeat(3 - (exercise.difficulty ?? 1))}
        </span>
        <span className="exercise-xp-badge">{exercise.xp ?? 0} XP</span>
      </div>
      <ExerciseComponent
        exercise={exercise.exercise}
        onSubmit={handleSubmit}
        result={result}
      />
      <ExerciseResult result={result} xp={exercise.xp} onReset={result ? handleReset : null} />
    </div>
  )
}
