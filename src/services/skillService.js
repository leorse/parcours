const BACKEND = import.meta.env.VITE_BACKEND_URL

export async function fetchUserSkills(uid, token) {
  try {
    const res = await fetch(`${BACKEND}/api/skills/${uid}?token=${token}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.skills ?? []
  } catch {
    return []
  }
}

export function getWeakSkills(skills, minAttempts = 3, maxScore = 0.5) {
  return skills
    .filter(s =>
      s.score < maxScore &&
      s.attempts >= minAttempts &&
      s.confidence !== 'low'
    )
    .sort((a, b) => a.score - b.score)
}

export function getStrongSkills(skills, minScore = 0.75) {
  return skills
    .filter(s => s.score >= minScore && s.confidence !== 'low')
    .sort((a, b) => b.score - a.score)
}

export function groupSkillsBySubject(skills, skillsTree) {
  const groups = {}
  skills.forEach(skill => {
    const subject = skillsTree.find(s =>
      s.children?.some(c => c.id === skill.skill_tag)
    )
    if (subject) {
      if (!groups[subject.id]) groups[subject.id] = []
      groups[subject.id].push(skill)
    }
  })
  return groups
}
