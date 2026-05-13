// Jalon 4b : saveResult transmet les skills au backend via progressService

import { saveExerciseResult } from './progressService'
import { getCurrentUser }     from './profileService'

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

  await saveExerciseResult(uid, exerciseId, {
    score:        result.score,
    xpEarned:     result.xpEarned,
    correct:      result.correct,
    skills:       result.skills       ?? [],
    timeSpentSec: result.timeSpentSec ?? null,
  })
}

// Alias maintenu pour ExerciseEngine (jalon 3)
export function recordResult(exerciseId, result) {
  saveResult(exerciseId, result)
}
