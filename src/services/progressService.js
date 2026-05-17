// Jalon 4  : progression stockée dans localStorage
// Jalon 4b : sync backend en fire and forget (localStorage = cache)
// Jalon 7  : remplacer getFirebaseToken() par le vrai token Firebase
// L'interface publique NE CHANGE PAS

import { getFirebaseToken } from './profileService'

const STORAGE_KEY = 'parcours_progress'
const SESSION_KEY = 'parcours_session'
const BACKEND     = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

// ── Helpers backend (fire and forget — jamais bloquants pour l'UI) ────────────

async function backendPost(path, body) {
  try {
    const token = await getFirebaseToken()
    const res = await fetch(`${BACKEND}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...body, token }),
    })
    if (!res.ok) throw new Error(`Backend error ${res.status}`)
    return await res.json()
  } catch (e) {
    // Silencieux — localStorage reste la source de vérité pour l'affichage
    console.warn(`[progressService] Sync backend échoué (${path}) :`, e.message)
    return null
  }
}

async function backendGet(path) {
  try {
    const token = await getFirebaseToken()
    const res = await fetch(`${BACKEND}${path}?token=${token}`)
    if (!res.ok) throw new Error(`Backend error ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn(`[progressService] GET backend échoué (${path}) :`, e.message)
    return null
  }
}

// ── Lecture / écriture localStorage ──────────────────────────────────────────

function loadProgress(userId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveProgress(userId, progress) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(progress))
  } catch (e) {
    console.error('Erreur sauvegarde progression', e)
  }
}

// ── Interface publique ────────────────────────────────────────────────────────

export function getStepStatus(userId, stepId) {
  if (!userId) return 'locked'
  const progress = loadProgress(userId)
  return progress[stepId]?.status ?? 'locked'
}

export function getStepScore(userId, stepId) {
  const progress = loadProgress(userId)
  return progress[stepId]?.score ?? null
}

export function getCourseProgress(userId, courseId, steps) {
  if (!steps?.length) return 0
  const progress = loadProgress(userId)
  const completed = steps.filter((s) => progress[s.id]?.status === 'completed').length
  return completed / steps.length
}

export async function markStepComplete(userId, stepId, score, courseStructure) {
  const progress = loadProgress(userId)
  progress[stepId] = {
    status:      'completed',
    score,
    completedAt: new Date().toISOString(),
  }

  const nextStep = findNextStep(stepId, courseStructure)
  if (nextStep && !progress[nextStep.id]) {
    progress[nextStep.id] = { status: 'in_progress' }
  }

  saveProgress(userId, progress)

  // ═══════════════════════════════════════════════════
  // JALON 7 — Remplacer getFirebaseToken() par le vrai token Firebase
  // ═══════════════════════════════════════════════════
  backendPost('/api/progress/step', {
    step_id:   stepId,
    course_id: courseStructure?.id ?? 'unknown',
    status:    'completed',
    score,
  })
}

export function markStepInProgress(userId, stepId) {
  const progress = loadProgress(userId)
  if (progress[stepId]?.status === 'completed') return
  progress[stepId] = { ...progress[stepId], status: 'in_progress' }
  saveProgress(userId, progress)
}

export async function saveExerciseResult(userId, exerciseId, result) {
  // result = { score, xpEarned, correct, skills: [{ tag, weight }] }
  const progress = loadProgress(userId)
  if (!progress.__exercises) progress.__exercises = {}
  progress.__exercises[exerciseId] = {
    ...result,
    submittedAt: new Date().toISOString(),
  }
  saveProgress(userId, progress)

  // ═══════════════════════════════════════════════════
  // JALON 7 — Remplacer getFirebaseToken() par le vrai token Firebase
  // ═══════════════════════════════════════════════════
  backendPost('/api/progress/exercise', {
    exercise_id:    exerciseId,
    score:          result.score,
    xp_earned:      result.xpEarned   ?? 0,
    skills:         result.skills     ?? [],
    time_spent_sec: result.timeSpentSec ?? null,
  })
}

export function resetProgress(userId) {
  localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
}

export function getAllProgress(userId) {
  return loadProgress(userId)
}

// ── Streak, événements, hydratation ──────────────────────────────────────────

export async function checkStreak() {
  return backendPost('/api/streak/check', {})
}

export async function logEvent(eventId) {
  return backendPost('/api/events/log', { event_id: eventId })
}

export async function hydrateFromBackend(userId) {
  /**
   * Récupère la progression du backend et l'écrit dans localStorage.
   * Utile si l'élève change d'appareil.
   * Jalon 7 : appelé après authentification Firebase.
   */
  const data = await backendGet(`/api/progress/${userId}`)
  if (!data?.steps) return

  const progress = loadProgress(userId)
  data.steps.forEach((step) => {
    if (!progress[step.step_id]) {
      progress[step.step_id] = {
        status:      step.status,
        score:       step.score,
        completedAt: step.completed_at,
      }
    }
  })
  saveProgress(userId, progress)
}

// ── Session validée par exercice ──────────────────────────────────────────────

/**
 * Appelé quand un exercice est complété.
 * Valide la session du jour si pas encore fait.
 * @returns {boolean} true si c'est le premier exercice du jour
 */
export function markSessionActive(userId) {
  const today  = new Date().toISOString().slice(0, 10)
  const stored = localStorage.getItem(`${SESSION_KEY}_${userId}`)
  const data   = stored ? JSON.parse(stored) : {}

  if (data.lastSessionDate === today) {
    data.exercisesToday = (data.exercisesToday ?? 0) + 1
    localStorage.setItem(`${SESSION_KEY}_${userId}`, JSON.stringify(data))
    return false
  }

  const previousDate  = data.lastSessionDate ?? null
  const daysSinceLast = previousDate
    ? Math.floor((Date.now() - new Date(previousDate)) / (1000 * 60 * 60 * 24))
    : 999

  data.lastSessionDate = today
  data.exercisesToday  = 1
  data.sessionCount    = (data.sessionCount ?? 0) + 1
  data.daysSinceLast   = daysSinceLast
  localStorage.setItem(`${SESSION_KEY}_${userId}`, JSON.stringify(data))

  backendPost('/api/streak/check', {}) // fire-and-forget
  return true
}

export function getSessionStats(userId) {
  const stored = localStorage.getItem(`${SESSION_KEY}_${userId}`)
  const data   = stored ? JSON.parse(stored) : {}
  return {
    sessionCount:         data.sessionCount   ?? 0,
    exercisesToday:       data.exercisesToday  ?? 0,
    daysSinceLastSession: data.daysSinceLast   ?? 999,
    lastSessionDate:      data.lastSessionDate ?? null,
  }
}

// ── Utilitaire interne ────────────────────────────────────────────────────────

function findNextStep(currentStepId, courseStructure) {
  const allSteps = courseStructure?.grandes_etapes
    ?.flatMap((ge) => [{ id: ge.id, type: 'grande_etape' }, ...ge.lessons]) ?? []
  const currentIndex = allSteps.findIndex((s) => s.id === currentStepId)
  return currentIndex >= 0 && currentIndex < allSteps.length - 1
    ? allSteps[currentIndex + 1]
    : null
}
