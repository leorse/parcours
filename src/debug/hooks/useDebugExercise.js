import { useState, useCallback } from 'react'
import { getExercise } from '../../services/contentService'
import { validateAnswer } from '../../services/exerciseService'
import { calcScore } from '../../services/scoreService'
import { generateCorrectAnswer, generateWrongAnswer } from '../utils/answerGenerator'

export function useDebugExercise() {
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [exerciseData, setExerciseData] = useState(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [injectedAnswer, setInjectedAnswer] = useState(null)
  const [engineKey, setEngineKey] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadExercise = useCallback(async (subjectId, courseId, exerciseId) => {
    setLoading(true)
    setLastResult(null)
    setInjectedAnswer(null)
    setEngineKey((k) => k + 1)
    try {
      const data = await getExercise(courseId, subjectId, exerciseId)
      setExerciseData(data)
      setSelectedSubject(subjectId)
      setSelectedCourse(courseId)
    } finally {
      setLoading(false)
    }
  }, [])

  const injectCorrectAnswer = useCallback(() => {
    if (!exerciseData) return
    setInjectedAnswer(generateCorrectAnswer(exerciseData.exercise))
  }, [exerciseData])

  const injectWrongAnswer = useCallback(() => {
    if (!exerciseData) return
    setInjectedAnswer(generateWrongAnswer(exerciseData.exercise))
  }, [exerciseData])

  const recordDebugResult = useCallback(
    (userAnswer) => {
      if (!exerciseData) return
      const validation = validateAnswer(exerciseData.exercise, userAnswer)
      const score = calcScore(validation, exerciseData)
      setLastResult({
        validation,
        score,
        userAnswer,
        xpMax: exerciseData.xp,
        timestamp: new Date(),
      })
    },
    [exerciseData]
  )

  const reset = useCallback(() => {
    setLastResult(null)
    setInjectedAnswer(null)
    setEngineKey((k) => k + 1)
  }, [])

  return {
    selectedSubject,
    selectedCourse,
    exerciseData,
    showAnswers,
    setShowAnswers,
    lastResult,
    injectedAnswer,
    engineKey,
    loading,
    loadExercise,
    injectCorrectAnswer,
    injectWrongAnswer,
    recordDebugResult,
    reset,
  }
}
