import { describe, test, expect, beforeEach } from 'vitest'
import {
  getStepStatus,
  getStepScore,
  markStepComplete,
  getCourseProgress,
  resetProgress,
} from '../services/progressService'

const localStorageMock = (() => {
  let store = {}
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = v },
    removeItem: (k) => { delete store[k] },
    clear:      () => { store = {} },
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

const USER_ID = 'test-user-01'
const STEP_ID = 'step-001'
const STEPS   = [
  { id: 'step-001' },
  { id: 'step-002' },
  { id: 'step-003' },
]

beforeEach(() => {
  localStorageMock.clear()
})

describe('progressService', () => {

  test('étape inconnue → status=locked', () => {
    expect(getStepStatus(USER_ID, STEP_ID)).toBe('locked')
  })

  test('après markStepComplete → status=completed', () => {
    markStepComplete(USER_ID, STEP_ID, 0.8)
    expect(getStepStatus(USER_ID, STEP_ID)).toBe('completed')
  })

  test('score sauvegardé après completion', () => {
    markStepComplete(USER_ID, STEP_ID, 0.75)
    expect(getStepScore(USER_ID, STEP_ID)).toBe(0.75)
  })

  test('getCourseProgress = 0 si aucune étape complétée', () => {
    expect(getCourseProgress(USER_ID, 'course-01', STEPS)).toBe(0)
  })

  test('getCourseProgress = 1/3 si une étape sur trois', () => {
    markStepComplete(USER_ID, 'step-001', 1.0)
    expect(getCourseProgress(USER_ID, 'course-01', STEPS)).toBeCloseTo(1 / 3)
  })

  test('getCourseProgress = 1.0 si toutes complétées', () => {
    STEPS.forEach((s) => markStepComplete(USER_ID, s.id, 1.0))
    expect(getCourseProgress(USER_ID, 'course-01', STEPS)).toBe(1.0)
  })

  test('resetProgress efface tout', () => {
    markStepComplete(USER_ID, STEP_ID, 1.0)
    resetProgress(USER_ID)
    expect(getStepStatus(USER_ID, STEP_ID)).toBe('locked')
  })

})
