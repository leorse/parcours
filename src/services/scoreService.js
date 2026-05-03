export function calcScore(validationResult, exerciseData) {
  const score = validationResult.score ?? 0
  const xpEarned = Math.round((exerciseData.xp ?? 0) * score)
  return {
    score,
    xpEarned,
    correct: validationResult.correct,
  }
}

// Stub — sera remplacé au jalon 4
export function recordResult(exerciseId, result) {
  console.log('[scoreService] exercice terminé', { exerciseId, ...result })
}
