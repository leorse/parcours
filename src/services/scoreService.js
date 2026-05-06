// Jalon 4  : saveResult branché sur progressService
// Jalon 7  : sync backend ajoutée dans saveResult

import { saveExerciseResult } from './progressService'
import { getCurrentUser } from './profileService'

export function calcScore(validationResult, exerciseData) {
  const score = validationResult.score ?? 0
  const xpEarned = Math.round((exerciseData.xp ?? 0) * score)
  return {
    score,
    xpEarned,
    correct: validationResult.correct,
  }
}

export async function saveResult(exerciseId, result, userId) {
  const uid = userId ?? getCurrentUser()?.uid
  if (!uid) return
  saveExerciseResult(uid, exerciseId, result)

  // ═══════════════════════════════════════════════════
  // JALON 7 — Sync backend :
  //   await fetch(`${BACKEND_URL}/api/progress/exercise`, { ... })
  // ═══════════════════════════════════════════════════

  console.log(`[scoreService] Sauvegardé | exo:${exerciseId} | score:${result.score}`)
}

// Alias maintenu pour ExerciseEngine (jalon 3)
export function recordResult(exerciseId, result) {
  saveResult(exerciseId, result)
}
