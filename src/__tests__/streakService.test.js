import { describe, test, expect } from 'vitest'
import { getStreakStatus } from '../services/streakService'

describe('streakService', () => {
  test('getStreakStatus null → defaults à zéro, inactive', () => {
    const s = getStreakStatus(null)
    expect(s.current).toBe(0)
    expect(s.longest).toBe(0)
    expect(s.active).toBe(false)
  })

  test('getStreakStatus undefined → defaults', () => {
    const s = getStreakStatus(undefined)
    expect(s.current).toBe(0)
    expect(s.active).toBe(false)
  })

  test('getStreakStatus avec streak courant', () => {
    const s = getStreakStatus({ current_streak: 5, longest_streak: 10 })
    expect(s.current).toBe(5)
    expect(s.longest).toBe(10)
    expect(s.active).toBe(true)
  })

  test('getStreakStatus streak=0 → inactive', () => {
    const s = getStreakStatus({ current_streak: 0, longest_streak: 7 })
    expect(s.current).toBe(0)
    expect(s.active).toBe(false)
  })

  test('getStreakStatus streak=1 → active', () => {
    const s = getStreakStatus({ current_streak: 1, longest_streak: 1 })
    expect(s.active).toBe(true)
  })
})
