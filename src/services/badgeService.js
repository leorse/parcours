import yaml from 'js-yaml'

let badgesCache   = null
let trophiesCache = null

async function getBadgesDef() {
  if (badgesCache) return badgesCache
  const res  = await fetch('/content/config/badges.yaml')
  const text = await res.text()
  badgesCache = yaml.load(text).badges
  return badgesCache
}

async function getTrophiesDef() {
  if (trophiesCache) return trophiesCache
  const res  = await fetch('/content/config/trophies.yaml')
  const text = await res.text()
  trophiesCache = yaml.load(text).trophies
  return trophiesCache
}

function matchesWildcard(tag, pattern) {
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2)
    return tag.startsWith(prefix + '/')
  }
  return tag === pattern
}

function evaluate(condition, stats) {
  const { type, operator, value, skill_tag, min_confidence } = condition
  const ops = {
    gte: (a, b) => a >= b,
    gt:  (a, b) => a > b,
    eq:  (a, b) => a === b,
    lt:  (a, b) => a < b,
  }
  const compare = ops[operator] ?? ops.gte

  switch (type) {
    case 'exercise_count':
      return compare(stats.exerciseCount ?? 0, value)

    case 'exercise_perfect_count':
      return compare(stats.perfectCount ?? 0, value)

    case 'course_complete_count':
      return compare(stats.courseCompleteCount ?? 0, value)

    case 'streak':
      return compare(stats.currentStreak ?? 0, value)

    case 'total_xp':
      return compare(stats.totalXP ?? 0, value)

    case 'badge_count':
      return compare(stats.earnedBadgeCount ?? 0, value)

    case 'skill_score': {
      const matchingSkills = (stats.skills ?? []).filter(s =>
        matchesWildcard(s.skill_tag, skill_tag) &&
        (!min_confidence || s.confidence !== 'low')
      )
      if (!matchingSkills.length) return false
      const avgScore = matchingSkills.reduce((acc, s) => acc + s.score, 0) / matchingSkills.length
      return compare(avgScore, value)
    }

    default:
      return false
  }
}

// Exported for tests
export { evaluate as evaluateCondition }

export async function checkNewBadges(stats, earnedBadgeIds) {
  const all     = await getBadgesDef()
  const newOnes = []
  for (const badge of all) {
    if (earnedBadgeIds.includes(badge.id)) continue
    if (evaluate(badge.condition, stats)) newOnes.push(badge)
  }
  return newOnes
}

export async function checkNewTrophies(stats, earnedTrophyIds) {
  const all     = await getTrophiesDef()
  const newOnes = []
  for (const trophy of all) {
    if (earnedTrophyIds.includes(trophy.id)) continue
    if (evaluate(trophy.condition, stats)) newOnes.push(trophy)
  }
  return newOnes
}

export { getBadgesDef, getTrophiesDef }
