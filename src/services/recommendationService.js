import { getWeakSkills } from './skillService'
import { getExercises }  from './contentService'

export async function getReinforcementExercises(skills, allCourses, recentExerciseIds = [], maxResults = 5) {
  const weak = getWeakSkills(skills)
  if (!weak.length) return []

  const recommendations = []

  for (const skill of weak) {
    for (const course of allCourses) {
      const exercises = await getExercises(course.id, course.subjectId)

      const matching = exercises.filter(exo => {
        const tags   = exo.skills?.map(s => s.tag) ?? []
        const recent = recentExerciseIds.includes(exo.id)
        return tags.includes(skill.skill_tag) && !recent
      })

      const difficulty = skill.score < 0.3 ? 1 : skill.score < 0.6 ? 2 : 3
      const sorted = matching
        .filter(e => e.difficulty <= difficulty)
        .sort((a, b) => a.difficulty - b.difficulty)

      recommendations.push(...sorted)
    }
  }

  const unique = [...new Map(recommendations.map(e => [e.id, e])).values()]
  return unique.slice(0, maxResults)
}
