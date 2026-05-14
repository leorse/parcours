import { describe, test, expect } from 'vitest'
import { evaluateCondition } from '../services/badgeService'

describe('badgeService — evaluateCondition', () => {
  test('exercise_count gte 1 → vrai si exerciseCount=1', () => {
    const stats = { exerciseCount: 1 }
    const cond  = { type: 'exercise_count', operator: 'gte', value: 1 }
    expect(evaluateCondition(cond, stats)).toBe(true)
  })

  test('exercise_count gte 10 → faux si exerciseCount=5', () => {
    const stats = { exerciseCount: 5 }
    const cond  = { type: 'exercise_count', operator: 'gte', value: 10 }
    expect(evaluateCondition(cond, stats)).toBe(false)
  })

  test('exercise_perfect_count gte 1 → vrai si perfectCount=1', () => {
    const stats = { perfectCount: 1 }
    const cond  = { type: 'exercise_perfect_count', operator: 'gte', value: 1 }
    expect(evaluateCondition(cond, stats)).toBe(true)
  })

  test('streak gte 7 → vrai si currentStreak=7', () => {
    const stats = { currentStreak: 7 }
    const cond  = { type: 'streak', operator: 'gte', value: 7 }
    expect(evaluateCondition(cond, stats)).toBe(true)
  })

  test('streak gte 7 → faux si currentStreak=6', () => {
    const stats = { currentStreak: 6 }
    const cond  = { type: 'streak', operator: 'gte', value: 7 }
    expect(evaluateCondition(cond, stats)).toBe(false)
  })

  test('total_xp gte 1000 → vrai si totalXP=1000', () => {
    const stats = { totalXP: 1000 }
    const cond  = { type: 'total_xp', operator: 'gte', value: 1000 }
    expect(evaluateCondition(cond, stats)).toBe(true)
  })

  test('skill_score avec wildcard fraction/* → vrai si score moyen >= seuil', () => {
    const stats = {
      skills: [
        { skill_tag: 'fraction/addition',      score: 0.9,  confidence: 'high'   },
        { skill_tag: 'fraction/simplification', score: 0.85, confidence: 'medium' },
      ]
    }
    const cond = {
      type: 'skill_score', skill_tag: 'fraction/*',
      operator: 'gte', value: 0.8, min_confidence: 'medium'
    }
    expect(evaluateCondition(cond, stats)).toBe(true)
  })

  test('skill_score avec wildcard → faux si confidence=low exclu', () => {
    const stats = {
      skills: [
        { skill_tag: 'fraction/addition', score: 0.9, confidence: 'low' },
      ]
    }
    const cond = {
      type: 'skill_score', skill_tag: 'fraction/*',
      operator: 'gte', value: 0.8, min_confidence: 'medium'
    }
    expect(evaluateCondition(cond, stats)).toBe(false)
  })

  test('skill_score exact match (pas wildcard)', () => {
    const stats = {
      skills: [
        { skill_tag: 'orthographe/dictee', score: 0.85, confidence: 'high' },
      ]
    }
    const cond = {
      type: 'skill_score', skill_tag: 'orthographe/dictee',
      operator: 'gte', value: 0.8, min_confidence: 'medium'
    }
    expect(evaluateCondition(cond, stats)).toBe(true)
  })

  test('skill_score → faux si aucun skill correspondant', () => {
    const stats = { skills: [] }
    const cond  = {
      type: 'skill_score', skill_tag: 'fraction/*',
      operator: 'gte', value: 0.8
    }
    expect(evaluateCondition(cond, stats)).toBe(false)
  })

  test('type inconnu → false', () => {
    const stats = {}
    const cond  = { type: 'unknown_type', operator: 'gte', value: 1 }
    expect(evaluateCondition(cond, stats)).toBe(false)
  })
})
