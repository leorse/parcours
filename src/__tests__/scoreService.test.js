// src/__tests__/scoreService.test.js
import { describe, test, expect } from 'vitest'
import { calcScore } from '../services/scoreService'

const EXERCISE_15XP = { xp: 15 }
const EXERCISE_20XP = { xp: 20 }

describe('calcScore', () => {

  test('score=1.0 → XP total accordé', () => {
    const result = calcScore({ score: 1.0, correct: true }, EXERCISE_15XP)
    expect(result.xpEarned).toBe(15)
    expect(result.correct).toBe(true)
  })

  test('score=0.0 → 0 XP', () => {
    const result = calcScore({ score: 0.0, correct: false }, EXERCISE_15XP)
    expect(result.xpEarned).toBe(0)
    expect(result.correct).toBe(false)
  })

  // Math.round(15 * 0.5) = Math.round(7.5) = 8
  test("score=0.5 → XP arrondi à l'entier le plus proche", () => {
    const result = calcScore({ score: 0.5, correct: false }, EXERCISE_15XP)
    expect(result.xpEarned).toBe(8)
  })

  test('score=0.75 → XP proportionnel', () => {
    const result = calcScore({ score: 0.75, correct: false }, EXERCISE_20XP)
    expect(result.xpEarned).toBe(15) // Math.round(20 * 0.75)
  })

  test('score passé à travers dans le résultat', () => {
    const result = calcScore({ score: 0.8, correct: true }, EXERCISE_15XP)
    expect(result.score).toBe(0.8)
  })

  // xp ?? 0 dans l'implémentation évite NaN
  test('exercice sans xp défini → xpEarned=0 sans erreur', () => {
    const result = calcScore({ score: 1.0, correct: true }, {})
    expect(result.xpEarned).toBe(0)
  })
})
