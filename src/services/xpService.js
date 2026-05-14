import yaml from 'js-yaml'

let levelsCache = null

async function getLevels() {
  if (levelsCache) return levelsCache
  const res  = await fetch('/content/config/levels.yaml')
  const text = await res.text()
  levelsCache = yaml.load(text).levels
  return levelsCache
}

// ── Sync helpers (for tests and inline use) ──────────────────────────────────

export function getLevelFromXP_sync(totalXP, levels) {
  let current = levels[0]
  for (const lvl of levels) {
    if (totalXP >= lvl.xp_required) current = lvl
    else break
  }
  return current
}

export function getProgressInLevel_sync(totalXP, levels) {
  const current = getLevelFromXP_sync(totalXP, levels)
  const next    = levels.find(l => l.xp_required > totalXP) ?? null
  if (!next) return 1.0
  const xpInLevel  = totalXP - current.xp_required
  const xpForLevel = next.xp_required - current.xp_required
  return Math.min(xpInLevel / xpForLevel, 1.0)
}

// ── Async API ─────────────────────────────────────────────────────────────────

export async function getLevelFromXP(totalXP) {
  const levels = await getLevels()
  return getLevelFromXP_sync(totalXP, levels)
}

export async function getNextLevel(totalXP) {
  const levels = await getLevels()
  return levels.find(l => l.xp_required > totalXP) ?? null
}

export async function getProgressInLevel(totalXP) {
  const levels = await getLevels()
  return getProgressInLevel_sync(totalXP, levels)
}

export async function fetchUserXP(uid, token) {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/xp/${uid}?token=${token}`
  )
  if (!res.ok) return null
  return res.json()
}
