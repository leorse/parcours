import { describe, test, expect } from 'vitest'
import { evaluateCondition } from '../services/eventConditions'

describe('eventConditions — session_count', () => {
  const cond = { type: 'session_count', operator: 'eq', value: 1 }

  test('retourne true si sessionCount === 1', () => {
    expect(evaluateCondition(cond, { sessionCount: 1 })).toBe(true)
  })

  test('retourne false si sessionCount !== 1', () => {
    expect(evaluateCondition(cond, { sessionCount: 2 })).toBe(false)
  })

  test('utilise 0 par défaut si sessionCount absent', () => {
    expect(evaluateCondition(cond, {})).toBe(false)
  })
})

describe('eventConditions — days_since_last_session', () => {
  test('gte 3 → true si 5 jours', () => {
    const cond = { type: 'days_since_last_session', operator: 'gte', value: 3 }
    expect(evaluateCondition(cond, { daysSinceLastSession: 5 })).toBe(true)
  })

  test('gte 3 → false si 2 jours', () => {
    const cond = { type: 'days_since_last_session', operator: 'gte', value: 3 }
    expect(evaluateCondition(cond, { daysSinceLastSession: 2 })).toBe(false)
  })
})

describe('eventConditions — streak', () => {
  test('gte 7 → true si currentStreak=10', () => {
    const cond = { type: 'streak', operator: 'gte', value: 7 }
    expect(evaluateCondition(cond, { currentStreak: 10 })).toBe(true)
  })

  test('gte 7 → false si currentStreak=5', () => {
    const cond = { type: 'streak', operator: 'gte', value: 7 }
    expect(evaluateCondition(cond, { currentStreak: 5 })).toBe(false)
  })
})

describe('eventConditions — score', () => {
  test('gte 1.0 → true si score=1', () => {
    const cond = { type: 'score', operator: 'gte', value: 1.0 }
    expect(evaluateCondition(cond, { score: 1 })).toBe(true)
  })

  test('lt 0.5 → true si score=0.3', () => {
    const cond = { type: 'score', operator: 'lt', value: 0.5 }
    expect(evaluateCondition(cond, { score: 0.3 })).toBe(true)
  })

  test('lt 0.5 → false si score=0.8', () => {
    const cond = { type: 'score', operator: 'lt', value: 0.5 }
    expect(evaluateCondition(cond, { score: 0.8 })).toBe(false)
  })
})

describe('eventConditions — has_weak_skill', () => {
  test('true si skill < min_score avec assez d\'essais', () => {
    const cond = { type: 'has_weak_skill', min_score: 0.5, min_attempts: 3 }
    const ctx  = { skills: [{ score: 0.3, attempts: 5 }] }
    expect(evaluateCondition(cond, ctx)).toBe(true)
  })

  test('false si pas assez d\'essais', () => {
    const cond = { type: 'has_weak_skill', min_score: 0.5, min_attempts: 5 }
    const ctx  = { skills: [{ score: 0.3, attempts: 2 }] }
    expect(evaluateCondition(cond, ctx)).toBe(false)
  })

  test('false si score suffisant', () => {
    const cond = { type: 'has_weak_skill', min_score: 0.5, min_attempts: 3 }
    const ctx  = { skills: [{ score: 0.8, attempts: 10 }] }
    expect(evaluateCondition(cond, ctx)).toBe(false)
  })

  test('false si skills vide', () => {
    const cond = { type: 'has_weak_skill', min_score: 0.5, min_attempts: 3 }
    expect(evaluateCondition(cond, { skills: [] })).toBe(false)
  })
})

describe('eventConditions — cas limites', () => {
  test('condition inconnue retourne false', () => {
    const cond = { type: 'type_inexistant', operator: 'gte', value: 1 }
    expect(evaluateCondition(cond, {})).toBe(false)
  })

  test('operator gte par défaut si absent', () => {
    const cond = { type: 'streak', value: 3 }
    expect(evaluateCondition(cond, { currentStreak: 5 })).toBe(true)
    expect(evaluateCondition(cond, { currentStreak: 2 })).toBe(false)
  })
})
