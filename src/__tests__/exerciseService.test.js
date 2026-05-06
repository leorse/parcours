// src/__tests__/exerciseService.test.js
import { describe, test, expect } from 'vitest'
import { validateAnswer } from '../services/exerciseService'

// ─────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────

const MCQ_EXERCISE = {
  type: 'multiple_choice',
  question: 'Que représente $3 \\times 4$ ?',
  choices: [
    { id: 'a', text: 'Trois fois quatre',  correct: true,  feedback: 'Bravo !' },
    { id: 'b', text: 'Quatre moins trois', correct: false, feedback: 'Non.' },
    { id: 'c', text: 'Trois plus quatre',  correct: false, feedback: 'Non.' },
  ],
  settings: { shuffle: false },
}

const FITB_EXERCISE = {
  type: 'fill_in_the_blank',
  segments: [
    { text: 'La capitale de la France est' },
    { blank: { id: 'b1', answer: 'Paris', accept_variants: ['paris', 'PARIS'] } },
    { text: 'et sa superficie est' },
    { blank: { id: 'b2', answer: '105', accept_variants: [] } },
  ],
  settings: { case_sensitive: false },
}

const FITB_CASE_SENSITIVE = {
  type: 'fill_in_the_blank',
  segments: [
    { blank: { id: 'b1', answer: 'Python', accept_variants: [] } },
  ],
  settings: { case_sensitive: true },
}

const IMAGE_TAP_EXERCISE = {
  type: 'image_tap',
  instruction: 'Clique sur la bonne zone.',
  image: null,
  zones: [
    { id: 'z1', correct: false, feedback: 'Non.' },
    { id: 'z2', correct: true,  feedback: 'Oui !' },
    { id: 'z3', correct: false, feedback: 'Non.' },
  ],
}

const DRAG_DROP_EXERCISE = {
  type: 'drag_drop',
  pairs: [
    { source: { id: 's1', text: '1/2' }, target: { id: 't1', text: 'moitié' } },
    { source: { id: 's2', text: '1/4' }, target: { id: 't2', text: 'quart' } },
    { source: { id: 's3', text: '3/4' }, target: { id: 't3', text: 'trois quarts' } },
  ],
}

const TIMELINE_EXERCISE = {
  type: 'timeline',
  items: [
    { id: 't1', label: 'Révolution française',     correct_position: 1 },
    { id: 't2', label: 'Première guerre mondiale',  correct_position: 2 },
    { id: 't3', label: 'Chute du mur de Berlin',   correct_position: 3 },
  ],
  settings: { shuffle: true },
}

const MATCHING_EXERCISE = {
  type: 'matching',
  pairs: [
    { left: { id: 'l1', text: 'Numérateur' },  right: { id: 'r1', text: 'Nombre du haut' } },
    { left: { id: 'l2', text: 'Dénominateur' }, right: { id: 'r2', text: 'Nombre du bas' } },
  ],
}

// ─────────────────────────────────────────────────────────────
// multiple_choice
// ─────────────────────────────────────────────────────────────

describe('validateAnswer — multiple_choice', () => {

  test('bonne réponse → correct=true, score=1', () => {
    const result = validateAnswer(MCQ_EXERCISE, 'a')
    expect(result.correct).toBe(true)
    expect(result.score).toBe(1.0)
  })

  test('mauvaise réponse → correct=false, score=0', () => {
    const result = validateAnswer(MCQ_EXERCISE, 'b')
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0.0)
  })

  test('le feedback du choix est retourné dans details', () => {
    const result = validateAnswer(MCQ_EXERCISE, 'a')
    expect(result.details.feedback).toBe('Bravo !')
  })

  // Cas limite : id inexistant — ne doit pas lever d'exception
  test('choix inexistant → correct=false', () => {
    const result = validateAnswer(MCQ_EXERCISE, 'z')
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0.0)
  })

  // Cas limite : réponse null
  test('réponse null → correct=false', () => {
    const result = validateAnswer(MCQ_EXERCISE, null)
    expect(result.correct).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────
// fill_in_the_blank
// ─────────────────────────────────────────────────────────────

describe('validateAnswer — fill_in_the_blank', () => {

  test('toutes les bonnes réponses → correct=true, score=1', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: 'Paris', b2: '105' })
    expect(result.correct).toBe(true)
    expect(result.score).toBe(1.0)
  })

  test('toutes mauvaises → correct=false, score=0', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: 'Lyon', b2: '999' })
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0.0)
  })

  test('une bonne sur deux → score=0.5', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: 'Paris', b2: '999' })
    expect(result.correct).toBe(false)
    expect(result.score).toBeCloseTo(0.5)
  })

  test('insensible à la casse par défaut', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: 'paris', b2: '105' })
    expect(result.correct).toBe(true)
  })

  test('variantes acceptées', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: 'PARIS', b2: '105' })
    expect(result.correct).toBe(true)
  })

  test('sensible à la casse si case_sensitive=true', () => {
    const correct = validateAnswer(FITB_CASE_SENSITIVE, { b1: 'Python' })
    expect(correct.correct).toBe(true)

    // Même chaîne en minuscule → refusée
    const wrong = validateAnswer(FITB_CASE_SENSITIVE, { b1: 'python' })
    expect(wrong.correct).toBe(false)
  })

  test('espaces en début/fin ignorés', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: '  Paris  ', b2: '105' })
    expect(result.correct).toBe(true)
  })

  test('feedback liste les réponses attendues', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: 'Lyon', b2: '999' })
    expect(result.details.feedback).toContain('Paris')
  })

  // Cas limite : blanc vide → compte comme incorrect
  test('blanc non rempli → incorrect pour ce blanc', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: '', b2: '105' })
    expect(result.score).toBeCloseTo(0.5)
  })
})

// ─────────────────────────────────────────────────────────────
// image_tap  (réponse = id de zone, chaîne unique)
// ─────────────────────────────────────────────────────────────

describe('validateAnswer — image_tap', () => {

  test('zone correcte → correct=true, score=1', () => {
    const result = validateAnswer(IMAGE_TAP_EXERCISE, 'z2')
    expect(result.correct).toBe(true)
    expect(result.score).toBe(1.0)
  })

  test('zone incorrecte → correct=false, score=0', () => {
    const result = validateAnswer(IMAGE_TAP_EXERCISE, 'z1')
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0.0)
  })

  // Cas limite : id de zone inexistant
  test('zone inexistante → correct=false', () => {
    const result = validateAnswer(IMAGE_TAP_EXERCISE, 'z99')
    expect(result.correct).toBe(false)
  })

  test('le feedback de la zone est retourné dans details', () => {
    const result = validateAnswer(IMAGE_TAP_EXERCISE, 'z2')
    expect(result.details.feedback).toBe('Oui !')
  })
})

// ─────────────────────────────────────────────────────────────
// drag_drop
// ─────────────────────────────────────────────────────────────

describe('validateAnswer — drag_drop', () => {

  test('toutes les paires correctes → correct=true, score=1', () => {
    const result = validateAnswer(DRAG_DROP_EXERCISE, { s1: 't1', s2: 't2', s3: 't3' })
    expect(result.correct).toBe(true)
    expect(result.score).toBe(1.0)
  })

  test('toutes les paires incorrectes → correct=false, score=0', () => {
    const result = validateAnswer(DRAG_DROP_EXERCISE, { s1: 't2', s2: 't3', s3: 't1' })
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0.0)
  })

  test('une paire correcte sur trois → score≈0.33', () => {
    const result = validateAnswer(DRAG_DROP_EXERCISE, { s1: 't1', s2: 't3', s3: 't2' })
    expect(result.correct).toBe(false)
    expect(result.score).toBeCloseTo(1 / 3)
  })

  // Cas limite : réponse vide
  test('paires vides → score=0', () => {
    const result = validateAnswer(DRAG_DROP_EXERCISE, {})
    expect(result.score).toBe(0)
  })

  // Cas limite : exercice sans paires
  test('exercice sans paires → score=0', () => {
    const empty = { ...DRAG_DROP_EXERCISE, pairs: [] }
    const result = validateAnswer(empty, {})
    expect(result.score).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// timeline
// ─────────────────────────────────────────────────────────────

describe('validateAnswer — timeline', () => {

  test('ordre correct → correct=true, score=1', () => {
    const result = validateAnswer(TIMELINE_EXERCISE, ['t1', 't2', 't3'])
    expect(result.correct).toBe(true)
    expect(result.score).toBe(1.0)
  })

  // t2 reste en position centrale → 1 item sur 3 correct
  test('ordre complètement inversé → correct=false, score≈0.33', () => {
    const result = validateAnswer(TIMELINE_EXERCISE, ['t3', 't2', 't1'])
    expect(result.correct).toBe(false)
    expect(result.score).toBeCloseTo(1 / 3)
  })

  // Seul t1 est à la bonne place (index 0)
  test('ordre partiellement incorrect → score partiel', () => {
    const result = validateAnswer(TIMELINE_EXERCISE, ['t1', 't3', 't2'])
    expect(result.correct).toBe(false)
    expect(result.score).toBeCloseTo(1 / 3)
  })

  // Cas limite : tableau vide
  test('liste vide → score=0', () => {
    const result = validateAnswer(TIMELINE_EXERCISE, [])
    expect(result.score).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// matching
// ─────────────────────────────────────────────────────────────

describe('validateAnswer — matching', () => {

  test('tous les matches corrects → correct=true, score=1', () => {
    const result = validateAnswer(MATCHING_EXERCISE, { l1: 'r1', l2: 'r2' })
    expect(result.correct).toBe(true)
    expect(result.score).toBe(1.0)
  })

  test('matches inversés → correct=false, score=0', () => {
    const result = validateAnswer(MATCHING_EXERCISE, { l1: 'r2', l2: 'r1' })
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0.0)
  })

  test('matches partiels → score=0.5', () => {
    const result = validateAnswer(MATCHING_EXERCISE, { l1: 'r1', l2: 'r99' })
    expect(result.score).toBeCloseTo(0.5)
  })
})

// ─────────────────────────────────────────────────────────────
// free_text
// ─────────────────────────────────────────────────────────────

const FREE_TEXT_EXERCISE = {
  type: 'free_text',
  instruction: 'Explique la commutativité.',
  min_words: 10,
  max_words: 80,
  ai_correction: { score_max: 10 },
}

describe('validateAnswer — free_text', () => {

  test('réponse IA avec score ≥ 0.5 → correct=true', () => {
    const result = validateAnswer(FREE_TEXT_EXERCISE, {
      type: 'ai_result', score: 0.8, feedback: 'Bravo !',
      points_reussis: ['Bonne structure'], a_ameliorer: [], flag: null,
    })
    expect(result.correct).toBe(true)
    expect(result.score).toBe(0.8)
  })

  test('réponse IA avec score < 0.5 → correct=false', () => {
    const result = validateAnswer(FREE_TEXT_EXERCISE, {
      type: 'ai_result', score: 0.3, feedback: 'À revoir',
      points_reussis: [], a_ameliorer: ['Développe davantage'], flag: null,
    })
    expect(result.correct).toBe(false)
  })

  // Le flag inappropriate doit être propagé dans le résultat
  test('flag inappropriate → correct=false, score=0, flag propagé', () => {
    const result = validateAnswer(FREE_TEXT_EXERCISE, {
      type: 'ai_result', score: 0, feedback: 'Réponse non appropriée.',
      points_reussis: [], a_ameliorer: [], flag: 'inappropriate',
    })
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0)
    expect(result.flag).toBe('inappropriate')
  })

  // Cas limite : réponse brute (sans traitement IA) — ne doit pas planter
  test('réponse sans type ai_result → score=0', () => {
    const result = validateAnswer(FREE_TEXT_EXERCISE, 'texte brut sans traitement')
    expect(result.score).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// type inconnu
// ─────────────────────────────────────────────────────────────

describe('validateAnswer — type inconnu', () => {

  // Cas limite : ne doit pas lever d'exception et retourner correct=false
  test("type inconnu → correct=false, score=0, pas d'erreur", () => {
    const result = validateAnswer({ type: 'nouveau_type_inexistant' }, 'réponse')
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0)
    expect(result.details?.feedback ?? null).toBeNull()
  })
})
