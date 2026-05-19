import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getExercise } from '../../../services/contentService'
import { instantiateExercise } from '../../../services/dynamicExerciseService'
import ExerciseEngine from '../../exercise/ExerciseEngine'

export default function ExerciseBlock({ exercise_id }) {
  const { courseId, subjectId } = useParams()
  const [exercise, setExercise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getExercise(courseId, subjectId, exercise_id)
      .then((data) => {
        if (!data) setError(`Exercice introuvable : ${exercise_id}`)
        else setExercise(instantiateExercise(data))
      })
      .catch(() => setError(`Erreur de chargement : ${exercise_id}`))
      .finally(() => setLoading(false))
  }, [courseId, subjectId, exercise_id])

  if (loading) {
    return (
      <div className="exercise-placeholder">
        <span className="exercise-placeholder-icon">⏳</span>
        <span>Chargement de l'exercice…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="exercise-placeholder">
        <span className="exercise-placeholder-icon">⚠️</span>
        <span>{error}</span>
      </div>
    )
  }

  return <ExerciseEngine exercise={exercise} courseId={courseId} />
}
