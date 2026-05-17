// src/services/eventConditions.js
// Évalue les conditions YAML de façon purement déclarative.
// Exporté pour les tests unitaires.

export function evaluateCondition(condition, context) {
  const { type, operator, value, min_score, min_attempts } = condition

  const ops = {
    eq:  (a, b) => a === b,
    gte: (a, b) => a >= b,
    gt:  (a, b) => a > b,
    lt:  (a, b) => a < b,
    lte: (a, b) => a <= b,
  }
  const compare = ops[operator] ?? ops.gte

  switch (type) {

    case 'session_count':
      return compare(context.sessionCount ?? 0, value)

    case 'days_since_last_session':
      return compare(context.daysSinceLastSession ?? 0, value)

    case 'streak':
      return compare(context.currentStreak ?? 0, value)

    case 'subject_attempts':
      return compare(context.subjectAttempts ?? 0, value)

    case 'total_courses_completed':
      return compare(context.totalCoursesCompleted ?? 0, value)

    case 'session_duration_minutes':
      return compare(context.sessionDurationMinutes ?? 0, value)

    case 'score':
      return compare(context.score ?? 0, value)

    case 'has_weak_skill': {
      const weak = (context.skills ?? []).find(s =>
        (s.score ?? 0) < (min_score ?? 0.5) &&
        (s.attempts ?? 0) >= (min_attempts ?? 3)
      )
      return !!weak
    }

    default:
      console.warn(`[EventEngine] Condition inconnue : ${type}`)
      return false
  }
}
