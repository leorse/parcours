import { useState, useMemo } from 'react'
import MathText from '../shared/MathText'
import { getFirebaseToken } from '../../../services/profileService'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export default function FreeTextExercise({ exercise, onSubmit, result, exerciseData, courseId }) {
  const [text,    setText]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const isSubmitted = result !== null

  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text]
  )

  const minWords = exercise.min_words ?? 10
  const maxWords = exercise.max_words ?? 200
  const canSubmit = !isSubmitted && !loading && wordCount >= minWords && wordCount <= maxWords

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    // ═══════════════════════════════════════════════════
    // JALON 7 — Remplacer par le vrai token Firebase (app Android)
    // ═══════════════════════════════════════════════════
    const token = await getFirebaseToken()

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_token: token,
          exercise_id:    exerciseData?.id ?? 'unknown',
          course_id:      courseId ?? null,
          student_text:   text,
          ai_correction:  exercise.ai_correction ?? {},
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Erreur ${res.status}` }))
        throw new Error(err.detail ?? 'Erreur serveur')
      }

      const aiResult = await res.json()
      onSubmit({
        type:           'ai_result',
        score:          aiResult.score / (aiResult.score_max || 10),
        feedback:       aiResult.feedback,
        points_reussis: aiResult.points_reussis,
        a_ameliorer:    aiResult.a_ameliorer,
        flag:           aiResult.flag,
        xp_earned:      aiResult.xp_earned,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const counterClass = wordCount < minWords ? 'under' : wordCount > maxWords ? 'over' : 'ok'

  return (
    <div className="exercise-free-text">
      {exercise.instruction && (
        <div className="exercise-instruction"><MathText text={exercise.instruction} /></div>
      )}

      {exercise.image && (
        <img
          src={`/content/${exercise.image}`}
          alt="Image de l'exercice"
          className="freetext-image"
        />
      )}

      <textarea
        className="exercise-free-text-area freetext-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={exercise.placeholder ?? exercise.prompt ?? 'Écris ta réponse ici…'}
        disabled={isSubmitted || loading}
        rows={5}
        {...(exercise.disable_spellcheck ? { autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false } : {})}
      />

      {!isSubmitted && (
        <div className={`word-counter word-counter--${counterClass}`}>
          {wordCount} mot{wordCount !== 1 ? 's' : ''}
          {wordCount < minWords && ` (minimum ${minWords})`}
          {wordCount > maxWords && ` (maximum ${maxWords})`}
        </div>
      )}

      {error && (
        <div className="freetext-error">⚠️ {error}</div>
      )}

      {!isSubmitted && (
        <button
          className="exercise-btn-validate"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {loading
            ? <span>✏️ Correction en cours…</span>
            : '✉️ Envoyer ma réponse'}
        </button>
      )}
    </div>
  )
}
