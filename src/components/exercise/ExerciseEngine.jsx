import { useState, useEffect } from 'react'
import { validateAnswer } from '../../services/exerciseService'
import { calcScore, saveResult } from '../../services/scoreService'
import { useEventEngine } from '../../hooks/useEventEngine'
import ExerciseResult from './shared/ExerciseResult'
import SvgIllustration from './shared/SvgIllustration'
import MultipleChoiceExercise from './exercises/MultipleChoiceExercise'
import FillInTheBlanksExercise from './exercises/FillInTheBlanksExercise'
import ImageTapExercise from './exercises/ImageTapExercise'
import DragDropExercise from './exercises/DragDropExercise'
import TimelineExercise from './exercises/TimelineExercise'
import FreeTextExercise from './exercises/FreeTextExercise'
import MatchingExercise from './exercises/MatchingExercise'
import FractionTapExercise from './exercises/FractionTapExercise'
import DictationExercise from './exercises/DictationExercise'

const EXERCISE_REGISTRY = {
  multiple_choice: MultipleChoiceExercise,
  fill_in_the_blank: FillInTheBlanksExercise,
  image_tap: ImageTapExercise,
  drag_drop: DragDropExercise,
  timeline: TimelineExercise,
  free_text: FreeTextExercise,
  matching: MatchingExercise,
  fraction_tap: FractionTapExercise,
  dictation: DictationExercise,
}

export default function ExerciseEngine({
  exercise,
  courseId = null,
  injectedAnswer = null,
  debugMode = false,
  onDebugResult = null,
}) {
  const [result,        setResult]        = useState(null)
  const [gamification,  setGamification]  = useState({ newBadges: [], newTrophies: [] })
  const { trigger } = useEventEngine()

  const fireAndForgetSave = (id, fullResult) => {
    saveResult(id, { ...fullResult, skills: exercise.skills ?? [] })
      .then(g => {
        const gamif = g ?? { newBadges: [], newTrophies: [], isFirstToday: false, sessionStats: null }
        setGamification(gamif)

        trigger('exercise_complete', {
          xp_earned: fullResult.xpEarned ?? 0,
          score:     fullResult.score    ?? 0,
        })

        // Première session du jour → daily_login
        if (gamif.isFirstToday && gamif.sessionStats) {
          trigger('daily_login', {
            currentStreak:  gamif.sessionStats.currentStreak ?? 0,
            current_streak: gamif.sessionStats.currentStreak ?? 0,
            sessionCount:   gamif.sessionStats.sessionCount  ?? 0,
          })
        }

        // Un événement par badge débloqué
        for (const badge of (gamif.newBadges ?? [])) {
          trigger('badge_earned', {
            badge_label: badge.label ?? badge.id,
            badge_icon:  badge.icon  ?? '🏅',
          })
        }
      })
      .catch(() => {})
  }

  // Auto-submit when debug injects an answer
  useEffect(() => {
    if (injectedAnswer === null) return
    const validation = validateAnswer(exercise.exercise, injectedAnswer)
    const computed = calcScore(validation, exercise)
    const fullResult = { ...validation, ...computed }
    setResult(fullResult)
    fireAndForgetSave(exercise.id, fullResult)
    onDebugResult?.(injectedAnswer)
  }, [injectedAnswer]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (userAnswer) => {
    const validation = validateAnswer(exercise.exercise, userAnswer)
    const computed = calcScore(validation, exercise)
    const fullResult = { ...validation, ...computed }
    setResult(fullResult)
    fireAndForgetSave(exercise.id, fullResult)
    onDebugResult?.(userAnswer)
  }

  const handleReset = () => { setResult(null); setGamification({ newBadges: [], newTrophies: [] }) }

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
      {exercise.exercise.visual && (
        <SvgIllustration visual={exercise.exercise.visual} />
      )}
      <ExerciseComponent
        exercise={exercise.exercise}
        onSubmit={handleSubmit}
        result={result}
        exerciseData={exercise}
        courseId={courseId}
      />
      <ExerciseResult
        result={result}
        xp={exercise.xp}
        onReset={result ? handleReset : null}
        newBadges={gamification.newBadges}
      />
    </div>
  )
}
