// Jalon 4  : progression stockée dans localStorage
// Jalon 7  : ajoute la sync backend, garde localStorage comme cache
// L'interface publique NE CHANGE PAS au jalon 7

const STORAGE_KEY = 'parcours_progress'

// ── Lecture / écriture internes ───────────────────────────────────────────────

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

export function markStepComplete(userId, stepId, score, courseStructure) {
  const progress = loadProgress(userId)
  progress[stepId] = {
    status:      'completed',
    score,
    completedAt: new Date().toISOString(),
  }

  // Déverrouiller l'étape suivante si la structure du cours est fournie
  if (courseStructure) {
    const nextStep = findNextStep(stepId, courseStructure)
    if (nextStep && !progress[nextStep.id]) {
      progress[nextStep.id] = { status: 'in_progress' }
    }
  }

  saveProgress(userId, progress)

  // ═══════════════════════════════════════════════════
  // JALON 7 — Sync backend :
  //   await syncProgressToBackend(userId, stepId, score)
  // ═══════════════════════════════════════════════════
}

export function markStepInProgress(userId, stepId) {
  const progress = loadProgress(userId)
  if (progress[stepId]?.status === 'completed') return  // ne pas rétrograder
  progress[stepId] = { ...progress[stepId], status: 'in_progress' }
  saveProgress(userId, progress)
}

export function saveExerciseResult(userId, exerciseId, result) {
  const progress = loadProgress(userId)
  if (!progress.__exercises) progress.__exercises = {}
  progress.__exercises[exerciseId] = {
    ...result,
    submittedAt: new Date().toISOString(),
  }
  saveProgress(userId, progress)
}

export function resetProgress(userId) {
  localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
}

export function getAllProgress(userId) {
  return loadProgress(userId)
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
