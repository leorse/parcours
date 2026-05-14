// Jalon 4b : saveResult transmet les skills au backend via progressService
// Jalon 5  : saveResult évalue les badges et retourne { newBadges, newTrophies }

import { saveExerciseResult } from './progressService'
import { getCurrentUser, getFirebaseToken } from './profileService'
import { checkNewBadges, checkNewTrophies } from './badgeService'

const BACKEND = import.meta.env.VITE_BACKEND_URL

export function calcScore(validationResult, exerciseData) {
  const score   = validationResult.score ?? 0
  const xpEarned = Math.round((exerciseData.xp ?? 0) * score)
  return {
    score,
    xpEarned,
    correct: validationResult.correct,
  }
}

export async function saveResult(exerciseId, result, userId) {
  const uid = userId ?? getCurrentUser()?.uid
  if (!uid) return { newBadges: [], newTrophies: [] }

  await saveExerciseResult(uid, exerciseId, {
    score:        result.score,
    xpEarned:     result.xpEarned,
    correct:      result.correct,
    skills:       result.skills       ?? [],
    timeSpentSec: result.timeSpentSec ?? null,
  })

  try {
    const token = await getFirebaseToken()
    const [xpData, skillsData, badgesData, streakData] = await Promise.all([
      fetch(`${BACKEND}/api/xp/${uid}?token=${token}`).then(r => r.json()),
      fetch(`${BACKEND}/api/skills/${uid}?token=${token}`).then(r => r.json()),
      fetch(`${BACKEND}/api/badges/${uid}?token=${token}`).then(r => r.json()),
      fetch(`${BACKEND}/api/streak/${uid}?token=${token}`).then(r => r.json()),
    ])

    const stats = {
      totalXP:            xpData.total_xp          ?? 0,
      skills:             skillsData.skills         ?? [],
      currentStreak:      streakData.current_streak ?? 0,
      earnedBadgeCount:   badgesData.badges?.length ?? 0,
      exerciseCount:      xpData.exercise_count     ?? 0,
      perfectCount:       result.score >= 1.0 ? 1 : 0,
      courseCompleteCount: 0,
    }

    const earnedIds   = badgesData.badges?.map(b => b.badge_id) ?? []
    const newBadges   = await checkNewBadges(stats, earnedIds)
    const newTrophies = await checkNewTrophies(stats, [])

    for (const badge of newBadges) {
      await fetch(`${BACKEND}/api/badges/award`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, badge_id: badge.id }),
      })
    }

    return { newBadges, newTrophies }
  } catch (e) {
    console.warn('[scoreService] Évaluation badges échouée :', e.message)
    return { newBadges: [], newTrophies: [] }
  }
}

// Alias maintenu pour ExerciseEngine (jalon 3)
export function recordResult(exerciseId, result) {
  saveResult(exerciseId, result)
}
