// src/__tests__/contentService.test.js
import { describe, test, expect } from 'vitest'

// On teste la forme des données statiques, pas le service qui fetch du YAML
import { subjects } from '../data/subjects'
import { courses }  from '../data/courses'

describe('Structure subjects', () => {

  test('subjects est un tableau non vide', () => {
    expect(Array.isArray(subjects)).toBe(true)
    expect(subjects.length).toBeGreaterThan(0)
  })

  test('chaque subject a les champs obligatoires', () => {
    subjects.forEach(subject => {
      expect(subject).toHaveProperty('id')
      expect(subject).toHaveProperty('label')
      expect(subject).toHaveProperty('icon')
      expect(subject).toHaveProperty('color')
      expect(typeof subject.id).toBe('string')
      expect(typeof subject.label).toBe('string')
    })
  })

  test('les ids subjects sont uniques', () => {
    const ids = subjects.map(s => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  test('les couleurs sont des hex valides', () => {
    const hexColor = /^#[0-9A-Fa-f]{6}$/
    subjects.forEach(subject => {
      expect(subject.color).toMatch(hexColor)
    })
  })
})

describe('Structure courses', () => {

  test('courses est un objet', () => {
    expect(typeof courses).toBe('object')
    expect(courses).not.toBeNull()
  })

  test('chaque matière a au moins un cours', () => {
    subjects.forEach(subject => {
      const subjectCourses = courses[subject.id]
      expect(Array.isArray(subjectCourses)).toBe(true)
      expect(subjectCourses.length).toBeGreaterThan(0)
    })
  })

  test('chaque cours a les champs obligatoires', () => {
    Object.values(courses).flat().forEach(course => {
      expect(course).toHaveProperty('id')
      expect(course).toHaveProperty('title')
      expect(course).toHaveProperty('status')
      expect(['available', 'locked', 'completed']).toContain(course.status)
    })
  })

  test('les ids cours sont uniques globalement', () => {
    const allIds = Object.values(courses).flat().map(c => c.id)
    const unique = new Set(allIds)
    expect(unique.size).toBe(allIds.length)
  })
})
