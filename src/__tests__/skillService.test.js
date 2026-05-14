import { describe, test, expect } from 'vitest'
import { getWeakSkills, getStrongSkills } from '../services/skillService'

const SKILLS = [
  { skill_tag: 'fraction/addition',   score: 0.3, attempts: 5, confidence: 'medium' },
  { skill_tag: 'multiplication/base', score: 0.9, attempts: 12, confidence: 'high'  },
  { skill_tag: 'geometrie/aires',     score: 0.2, attempts: 2, confidence: 'low'    },
  { skill_tag: 'fraction/division',   score: 0.4, attempts: 4, confidence: 'medium' },
  { skill_tag: 'algebre/equations',   score: 0.6, attempts: 1, confidence: 'medium' },
]

describe('skillService', () => {
  test('getWeakSkills retourne les skills < 0.5 avec assez d\'essais', () => {
    const weak = getWeakSkills(SKILLS)
    expect(weak.map(s => s.skill_tag)).toContain('fraction/addition')
    expect(weak.map(s => s.skill_tag)).toContain('fraction/division')
  })

  test('getWeakSkills exclut les skills confidence=low', () => {
    const weak = getWeakSkills(SKILLS)
    expect(weak.map(s => s.skill_tag)).not.toContain('geometrie/aires')
  })

  test('getWeakSkills exclut les skills avec trop peu d\'essais', () => {
    const weak = getWeakSkills(SKILLS, 3)
    expect(weak.map(s => s.skill_tag)).not.toContain('algebre/equations')
  })

  test('getWeakSkills triés du plus faible au plus fort', () => {
    const weak = getWeakSkills(SKILLS)
    for (let i = 1; i < weak.length; i++) {
      expect(weak[i].score).toBeGreaterThanOrEqual(weak[i - 1].score)
    }
  })

  test('getStrongSkills retourne les skills >= 0.75', () => {
    const strong = getStrongSkills(SKILLS)
    expect(strong.map(s => s.skill_tag)).toContain('multiplication/base')
    expect(strong.every(s => s.score >= 0.75)).toBe(true)
  })

  test('getStrongSkills exclut les skills confidence=low', () => {
    const skills = [{ skill_tag: 'x/y', score: 0.9, attempts: 5, confidence: 'low' }]
    const strong = getStrongSkills(skills)
    expect(strong).toHaveLength(0)
  })

  test('getStrongSkills triés du plus fort au plus faible', () => {
    const strong = getStrongSkills(SKILLS)
    for (let i = 1; i < strong.length; i++) {
      expect(strong[i].score).toBeLessThanOrEqual(strong[i - 1].score)
    }
  })
})
