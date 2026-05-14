import { describe, test, expect } from 'vitest'
import { getLevelFromXP_sync, getProgressInLevel_sync } from '../services/xpService'

const MOCK_LEVELS = [
  { level: 1, xp_required: 0,   label: 'Explorateur', icon: '🌱' },
  { level: 2, xp_required: 100, label: 'Apprenti',    icon: '📚' },
  { level: 3, xp_required: 300, label: 'Aventurier',  icon: '🧭' },
]

describe('xpService', () => {
  test('0 XP → niveau 1', () => {
    const lvl = getLevelFromXP_sync(0, MOCK_LEVELS)
    expect(lvl.level).toBe(1)
  })

  test('100 XP → niveau 2', () => {
    const lvl = getLevelFromXP_sync(100, MOCK_LEVELS)
    expect(lvl.level).toBe(2)
  })

  test('99 XP → niveau 1 (pas encore 2)', () => {
    const lvl = getLevelFromXP_sync(99, MOCK_LEVELS)
    expect(lvl.level).toBe(1)
  })

  test('299 XP → niveau 2 (pas encore 3)', () => {
    const lvl = getLevelFromXP_sync(299, MOCK_LEVELS)
    expect(lvl.level).toBe(2)
  })

  test('300 XP → niveau 3', () => {
    const lvl = getLevelFromXP_sync(300, MOCK_LEVELS)
    expect(lvl.level).toBe(3)
  })

  test('9999 XP → niveau max (dernier niveau)', () => {
    const lvl = getLevelFromXP_sync(9999, MOCK_LEVELS)
    expect(lvl.level).toBe(3)
  })

  test('progression dans niveau 2 : 200 XP → 50%', () => {
    const p = getProgressInLevel_sync(200, MOCK_LEVELS)
    expect(p).toBeCloseTo(0.5)
  })

  test('progression dans niveau 2 : 150 XP → 25%', () => {
    const p = getProgressInLevel_sync(150, MOCK_LEVELS)
    expect(p).toBeCloseTo(0.25)
  })

  test('niveau max → progression = 1.0', () => {
    const p = getProgressInLevel_sync(9999, MOCK_LEVELS)
    expect(p).toBe(1.0)
  })
})
