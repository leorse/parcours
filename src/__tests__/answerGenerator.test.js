// src/__tests__/answerGenerator.test.js
import { describe, test, expect } from 'vitest'
import { generateCorrectAnswer, generateWrongAnswer } from '../debug/utils/answerGenerator'
import { validateAnswer } from '../services/exerciseService'

// Réutilise les mêmes structures que exerciseService.test.js
const EXERCISES = [
  {
    name: 'multiple_choice',
    exercise: {
      type: 'multiple_choice',
      choices: [
        { id: 'a', correct: true,  feedback: 'Bravo', text: 'Bonne' },
        { id: 'b', correct: false, feedback: 'Non',   text: 'Mauvaise' },
      ],
      settings: {},
    },
  },
  {
    name: 'fill_in_the_blank',
    exercise: {
      type: 'fill_in_the_blank',
      segments: [
        { blank: { id: 'b1', answer: 'Paris', accept_variants: [] } },
        { blank: { id: 'b2', answer: '75',    accept_variants: [] } },
      ],
      settings: { case_sensitive: false },
    },
  },
  {
    name: 'image_tap',
    exercise: {
      type: 'image_tap',
      zones: [
        { id: 'z1', correct: false },
        { id: 'z2', correct: true  },
      ],
    },
  },
  {
    name: 'drag_drop',
    exercise: {
      type: 'drag_drop',
      pairs: [
        { source: { id: 's1' }, target: { id: 't1' } },
        { source: { id: 's2' }, target: { id: 't2' } },
      ],
    },
  },
  {
    name: 'timeline',
    exercise: {
      type: 'timeline',
      items: [
        { id: 'e1', correct_position: 1 },
        { id: 'e2', correct_position: 2 },
        { id: 'e3', correct_position: 3 },
      ],
    },
  },
]

// ─────────────────────────────────────────────────────────────
// Cohérence génération / validation
// ─────────────────────────────────────────────────────────────

describe('answerGenerator — cohérence avec validateAnswer', () => {

  EXERCISES.forEach(({ name, exercise }) => {

    test(`${name} : generateCorrectAnswer → validation correct=true`, () => {
      const answer = generateCorrectAnswer(exercise)
      expect(answer).not.toBeNull()
      const result = validateAnswer(exercise, answer)
      expect(result.correct).toBe(true)
      expect(result.score).toBe(1.0)
    })

    test(`${name} : generateWrongAnswer → validation correct=false`, () => {
      const answer = generateWrongAnswer(exercise)
      if (answer === null) return  // certains types peuvent ne pas avoir de mauvaise réponse
      const result = validateAnswer(exercise, answer)
      expect(result.correct).toBe(false)
    })
  })
})

// ─────────────────────────────────────────────────────────────
// Forme des valeurs retournées
// ─────────────────────────────────────────────────────────────

describe('answerGenerator — valeurs retournées', () => {

  test('multiple_choice retourne un id string', () => {
    const answer = generateCorrectAnswer(EXERCISES[0].exercise)
    expect(typeof answer).toBe('string')
  })

  test('fill_in_the_blank retourne un objet avec les ids des blancs', () => {
    const answer = generateCorrectAnswer(EXERCISES[1].exercise)
    expect(typeof answer).toBe('object')
    expect(answer).toHaveProperty('b1')
    expect(answer).toHaveProperty('b2')
  })

  test('drag_drop retourne un objet source→target', () => {
    const answer = generateCorrectAnswer(EXERCISES[3].exercise)
    expect(answer).toHaveProperty('s1', 't1')
    expect(answer).toHaveProperty('s2', 't2')
  })

  test("timeline retourne un tableau d'ids dans le bon ordre", () => {
    const answer = generateCorrectAnswer(EXERCISES[4].exercise)
    expect(Array.isArray(answer)).toBe(true)
    expect(answer).toEqual(['e1', 'e2', 'e3'])
  })
})
