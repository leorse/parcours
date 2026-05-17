import { describe, test, expect, vi, beforeEach } from 'vitest'
import { resolveVariables, processEvents } from '../services/eventEngine'

// ── resolveVariables ────────────────────────────────────────────────────────

describe('resolveVariables', () => {
  test('remplace {pseudo} par la valeur du contexte', () => {
    expect(resolveVariables('Bonjour {pseudo} !', { pseudo: 'Léo' })).toBe('Bonjour Léo !')
  })

  test('laisse les variables inconnues intactes', () => {
    expect(resolveVariables('Tu as {xp_earned} XP', {})).toBe('Tu as {xp_earned} XP')
  })

  test('remplace plusieurs variables dans un message', () => {
    const result = resolveVariables('Ça fait {days_absent} jours {pseudo} !', {
      days_absent: 3,
      pseudo: 'Zoé',
    })
    expect(result).toBe('Ça fait 3 jours Zoé !')
  })

  test('convertit les valeurs numériques en string', () => {
    expect(resolveVariables('{score} pts', { score: 42 })).toBe('42 pts')
  })

  test('retourne le texte intact si aucune variable', () => {
    expect(resolveVariables('Texte simple', { pseudo: 'X' })).toBe('Texte simple')
  })
})

// ── processEvents ────────────────────────────────────────────────────────────

const MOCK_EVENTS = [
  {
    id: 'evt-once-test',
    once: true,
    trigger: { on: 'app_start' },
    conditions: [{ type: 'session_count', operator: 'eq', value: 1 }],
    actions: [{ type: 'show_dialog', messages: ['Bienvenue !'] }],
  },
  {
    id: 'evt-cooldown-test',
    once: false,
    cooldown_days: 1,
    trigger: { on: 'app_start' },
    conditions: [],
    actions: [{ type: 'show_dialog', messages: ['Retour !'] }],
  },
  {
    id: 'evt-wrong-trigger',
    once: false,
    trigger: { on: 'course_enter' },
    conditions: [],
    actions: [{ type: 'show_dialog', messages: ['Cours'] }],
  },
]

// Mock du fetch pour loadEvents
beforeEach(() => {
  vi.resetModules()
  global.fetch = vi.fn().mockResolvedValue({
    text: () => Promise.resolve(`
events:
  - id: "evt-once-test"
    once: true
    trigger:
      on: "app_start"
    conditions:
      - type: "session_count"
        operator: "eq"
        value: 1
    actions:
      - type: "show_dialog"
        messages:
          - "Bienvenue !"
  - id: "evt-cooldown-test"
    once: false
    cooldown_days: 1
    trigger:
      on: "app_start"
    conditions: []
    actions:
      - type: "show_dialog"
        messages:
          - "Retour !"
  - id: "evt-wrong-trigger"
    once: false
    trigger:
      on: "course_enter"
    conditions: []
    actions:
      - type: "show_dialog"
        messages:
          - "Cours"
`),
  })
})

describe('processEvents — filtrage', () => {
  test('ne déclenche pas si le trigger ne correspond pas', async () => {
    const { processEvents: pe } = await import('../services/eventEngine')
    const result = await pe('subject_enter', { sessionCount: 1 }, [], {})
    expect(result).toHaveLength(0)
  })

  test('ne déclenche pas un événement once déjà déclenché', async () => {
    const { processEvents: pe } = await import('../services/eventEngine')
    const result = await pe('app_start', { sessionCount: 1 }, ['evt-once-test'], {})
    // evt-once-test ignoré, evt-cooldown-test déclenché
    expect(result.every(r => r.eventId !== 'evt-once-test')).toBe(true)
  })

  test('déclenche si toutes les conditions sont remplies', async () => {
    const { processEvents: pe } = await import('../services/eventEngine')
    const result = await pe('app_start', { sessionCount: 1 }, [], {})
    expect(result.some(r => r.eventId === 'evt-once-test')).toBe(true)
  })

  test('ne déclenche pas si une condition échoue', async () => {
    const { processEvents: pe } = await import('../services/eventEngine')
    const result = await pe('app_start', { sessionCount: 5 }, [], {})
    // sessionCount 5 !== 1, evt-once-test doit être ignoré
    expect(result.every(r => r.eventId !== 'evt-once-test')).toBe(true)
  })

  test('respecte le cooldown', async () => {
    const { processEvents: pe } = await import('../services/eventEngine')
    const recentDate = new Date().toISOString()
    const result = await pe('app_start', { sessionCount: 99 }, [], {
      'evt-cooldown-test': recentDate,
    })
    expect(result.every(r => r.eventId !== 'evt-cooldown-test')).toBe(true)
  })
})
