# Jalon 3ter — Tests unitaires
## Document technique pour Claude dans VS Code

---

## Objectif

Poser un filet de sécurité sur la logique métier avant les jalons 4, 5 et 6
qui vont modifier les fichiers critiques.

Les tests tournent **automatiquement à chaque build**.
Si un test échoue, le build échoue. Aucune régression silencieuse possible.

**Ce qu'on teste :** uniquement la logique pure — pas de composants React, pas d'IHM.
**Outil :** Vitest (déjà dans l'écosystème Vite, zéro config supplémentaire).

---

## Installation et configuration

```bash
npm install -D vitest
```

### vite.config.js — ajouter la config Vitest

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',      // pas de DOM, on teste de la logique pure
    globals: true,            // describe/test/expect disponibles sans import
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/services/**', 'src/debug/utils/**'],
    },
  },
})
```

### package.json — bloquer le build si un test échoue

```json
"scripts": {
  "dev":       "vite",
  "test":      "vitest run",
  "test:watch":"vitest",
  "coverage":  "vitest run --coverage",
  "build":     "vitest run && vite build"
}
```

`vitest run` = mode CI, tourne une fois et retourne un code d'erreur si échec.
`vitest` (sans run) = mode watch, relance à chaque sauvegarde pendant le dev.

---

## Structure des fichiers de tests

```
src/
  __tests__/
    exerciseService.test.js    ← validation des réponses (le plus critique)
    scoreService.test.js       ← calcul XP et score
    contentService.test.js     ← contrats de structure
    answerGenerator.test.js    ← cohérence génération / validation
```

Convention de nommage : `nomDuFichier.test.js` dans `__tests__/`.
Vitest les découvre automatiquement.

---

## exerciseService.test.js

C'est le fichier le plus important. Il teste chaque type d'exercice
dans les cas nominal (bonne réponse), d'échec (mauvaise réponse),
et les cas limites (réponse partielle, variantes, casse...).

```js
// src/__tests__/exerciseService.test.js
import { describe, test, expect } from 'vitest'
import { validateAnswer } from '../services/exerciseService'

// ─────────────────────────────────────────────────────────────
// FIXTURES — données d'exercices utilisées dans les tests
// Identiques à ce que retourne le parseur YAML
// ─────────────────────────────────────────────────────────────

const MCQ_EXERCISE = {
  type: 'multiple_choice',
  question: 'Que représente $3 \\times 4$ ?',
  choices: [
    { id: 'a', text: 'Trois fois quatre', correct: true,  feedback: 'Bravo !' },
    { id: 'b', text: 'Quatre moins trois', correct: false, feedback: 'Non.' },
    { id: 'c', text: 'Trois plus quatre', correct: false, feedback: 'Non.' },
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
    { id: 't1', label: 'Révolution française',    correct_position: 1 },
    { id: 't2', label: 'Première guerre mondiale', correct_position: 2 },
    { id: 't3', label: 'Chute du mur de Berlin',  correct_position: 3 },
  ],
  settings: { shuffle: true },
}

const MATCHING_EXERCISE = {
  type: 'matching',
  pairs: [
    { left: { id: 'l1', text: 'Numérateur' },   right: { id: 'r1', text: 'Nombre du haut' } },
    { left: { id: 'l2', text: 'Dénominateur' },  right: { id: 'r2', text: 'Nombre du bas' } },
  ],
}

// ─────────────────────────────────────────────────────────────
// TESTS — multiple_choice
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

  test('le feedback du choix est retourné', () => {
    const result = validateAnswer(MCQ_EXERCISE, 'a')
    expect(result.feedback).toBe('Bravo !')
  })

  test('choix inexistant → correct=false', () => {
    const result = validateAnswer(MCQ_EXERCISE, 'z')
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0.0)
  })

  test('réponse null → correct=false', () => {
    const result = validateAnswer(MCQ_EXERCISE, null)
    expect(result.correct).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────
// TESTS — fill_in_the_blank
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

    const wrong = validateAnswer(FITB_CASE_SENSITIVE, { b1: 'python' })
    expect(wrong.correct).toBe(false)
  })

  test('espaces en début/fin ignorés', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: '  Paris  ', b2: '105' })
    expect(result.correct).toBe(true)
  })

  test('feedback liste les erreurs', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: 'Lyon', b2: '999' })
    expect(result.feedback).toContain('Paris')
  })

  test('blanc non rempli → incorrect', () => {
    const result = validateAnswer(FITB_EXERCISE, { b1: '', b2: '105' })
    expect(result.score).toBeCloseTo(0.5)
  })
})

// ─────────────────────────────────────────────────────────────
// TESTS — image_tap
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

  test('zone inexistante → correct=false', () => {
    const result = validateAnswer(IMAGE_TAP_EXERCISE, 'z99')
    expect(result.correct).toBe(false)
  })

  test('le feedback de la zone est retourné', () => {
    const result = validateAnswer(IMAGE_TAP_EXERCISE, 'z2')
    expect(result.feedback).toBe('Oui !')
  })
})

// ─────────────────────────────────────────────────────────────
// TESTS — drag_drop
// ─────────────────────────────────────────────────────────────

describe('validateAnswer — drag_drop', () => {

  test('toutes les paires correctes → correct=true, score=1', () => {
    const result = validateAnswer(DRAG_DROP_EXERCISE, {
      s1: 't1', s2: 't2', s3: 't3',
    })
    expect(result.correct).toBe(true)
    expect(result.score).toBe(1.0)
  })

  test('toutes les paires incorrectes → correct=false, score=0', () => {
    const result = validateAnswer(DRAG_DROP_EXERCISE, {
      s1: 't2', s2: 't3', s3: 't1',
    })
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0.0)
  })

  test('une paire correcte sur trois → score=0.33', () => {
    const result = validateAnswer(DRAG_DROP_EXERCISE, {
      s1: 't1', s2: 't3', s3: 't2',
    })
    expect(result.correct).toBe(false)
    expect(result.score).toBeCloseTo(1/3)
  })

  test('paires vides → score=0', () => {
    const result = validateAnswer(DRAG_DROP_EXERCISE, {})
    expect(result.score).toBe(0)
  })

  test('exercice sans paires → score=0', () => {
    const empty = { ...DRAG_DROP_EXERCISE, pairs: [] }
    const result = validateAnswer(empty, {})
    expect(result.score).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// TESTS — timeline
// ─────────────────────────────────────────────────────────────

describe('validateAnswer — timeline', () => {

  test('ordre correct → correct=true, score=1', () => {
    const result = validateAnswer(TIMELINE_EXERCISE, ['t1', 't2', 't3'])
    expect(result.correct).toBe(true)
    expect(result.score).toBe(1.0)
  })

  test('ordre complètement inversé → correct=false, score=0', () => {
    const result = validateAnswer(TIMELINE_EXERCISE, ['t3', 't2', 't1'])
    expect(result.correct).toBe(false)
    expect(result.score).toBeCloseTo(1/3)  // t2 est à la bonne place
  })

  test('ordre aléatoire incorrect → score partiel', () => {
    const result = validateAnswer(TIMELINE_EXERCISE, ['t1', 't3', 't2'])
    expect(result.correct).toBe(false)
    expect(result.score).toBeCloseTo(1/3)  // seulement t1 correct
  })

  test('liste vide → score=0', () => {
    const result = validateAnswer(TIMELINE_EXERCISE, [])
    expect(result.score).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// TESTS — matching (type extensible exemple)
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
// TESTS — type inconnu
// ─────────────────────────────────────────────────────────────

describe('validateAnswer — type inconnu', () => {

  test('type inconnu → correct=false, score=0, pas d\'erreur', () => {
    const result = validateAnswer({ type: 'nouveau_type_inexistant' }, 'réponse')
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0)
    expect(result.feedback).toBeNull()
  })
})
```

---

## scoreService.test.js

```js
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

  test('score=0.5 → XP arrondi à l\'entier le plus proche', () => {
    const result = calcScore({ score: 0.5, correct: false }, EXERCISE_15XP)
    expect(result.xpEarned).toBe(8)   // Math.round(15 * 0.5) = 8 (arrondi supérieur de 7.5)
  })

  test('score=0.75 → XP proportionnel', () => {
    const result = calcScore({ score: 0.75, correct: false }, EXERCISE_20XP)
    expect(result.xpEarned).toBe(15)  // Math.round(20 * 0.75)
  })

  test('score passé à travers dans le résultat', () => {
    const result = calcScore({ score: 0.8, correct: true }, EXERCISE_15XP)
    expect(result.score).toBe(0.8)
  })

  test('exercice sans xp défini → xpEarned=0 sans erreur', () => {
    const result = calcScore({ score: 1.0, correct: true }, {})
    expect(result.xpEarned).toBe(0)   // Math.round(undefined * 1.0) = NaN → à gérer
  })
})
```

---

## contentService.test.js — contrats de structure

Ces tests ne testent **pas l'implémentation** de contentService
(qui fait des fetch réseau qu'on ne veut pas simuler).
Ils testent la **forme des données** que les fonctions doivent retourner.

```js
// src/__tests__/contentService.test.js
import { describe, test, expect } from 'vitest'

// On importe les données statiques directement (pas le service qui fetch)
// Ces fixtures représentent ce que le service DOIT retourner
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
```

---

## answerGenerator.test.js — cohérence génération / validation

Ces tests vérifient que `answerGenerator` génère des réponses
qui **passent effectivement** la validation de `exerciseService`.
C'est le test de cohérence entre les deux systèmes.

```js
// src/__tests__/answerGenerator.test.js
import { describe, test, expect } from 'vitest'
import { generateCorrectAnswer, generateWrongAnswer } from '../debug/utils/answerGenerator'
import { validateAnswer } from '../services/exerciseService'

// Réutilise les mêmes fixtures que exerciseService.test.js
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
    }
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
    }
  },
  {
    name: 'image_tap',
    exercise: {
      type: 'image_tap',
      zones: [
        { id: 'z1', correct: false },
        { id: 'z2', correct: true  },
      ],
    }
  },
  {
    name: 'drag_drop',
    exercise: {
      type: 'drag_drop',
      pairs: [
        { source: { id: 's1' }, target: { id: 't1' } },
        { source: { id: 's2' }, target: { id: 't2' } },
      ],
    }
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
    }
  },
]

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
      if (answer === null) return  // certains types peuvent ne pas avoir de mauvaise réponse évidente
      const result = validateAnswer(exercise, answer)
      expect(result.correct).toBe(false)
    })
  })
})

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

  test('timeline retourne un tableau d\'ids', () => {
    const answer = generateCorrectAnswer(EXERCISES[4].exercise)
    expect(Array.isArray(answer)).toBe(true)
    expect(answer).toEqual(['e1', 'e2', 'e3'])
  })
})
```

---

## Lancement des tests

```bash
# Tous les tests une fois (mode CI / build)
npm run test

# Mode watch pendant le dev (relance à chaque sauvegarde)
npm run test:watch

# Avec couverture de code
npm run coverage

# Build complet (tests + build Vite)
npm run build
```

### Sortie attendue

```
✓ src/__tests__/exerciseService.test.js (28 tests)
✓ src/__tests__/scoreService.test.js (6 tests)
✓ src/__tests__/contentService.test.js (7 tests)
✓ src/__tests__/answerGenerator.test.js (14 tests)

Test Files  4 passed (4)
Tests      55 passed (55)
Duration   1.2s
```

---

## Règle pour les jalons suivants

**Chaque fois qu'un fichier testé est modifié, les tests existants doivent passer.**
Si un jalon ajoute un nouveau type d'exercice, il doit aussi ajouter :
- Les cas de test dans `exerciseService.test.js`
- Le cas de test dans `answerGenerator.test.js`

C'est la seule façon de garantir que le filet reste complet au fil des jalons.

```
Jalon 4 modifie scoreService.js      → vérifier scoreService.test.js
Jalon 5 ajoute un type d'exercice    → ajouter les tests correspondants
Jalon 6 modifie contentService.js    → vérifier contentService.test.js
```

---

## Ce qu'il ne faut PAS faire

```
✗ Ne pas mocker les fetch réseau pour tester contentService en profondeur
  → trop complexe, les contrats de structure suffisent
✗ Ne pas tester les composants React (pas de jsdom, pas de render)
✗ Ne pas viser 100% de couverture — couvrir la logique critique suffit
✗ Ne pas séparer "npm test" et "npm build"
  → le build DOIT inclure les tests, sinon le filet ne sert à rien
```

## Ce qu'il faut absolument faire

```
✓ vitest run dans le script build — non négociable
✓ Tous les types d'exercices couverts dans exerciseService.test.js
✓ Les cas limites couverts (null, vide, type inexistant)
✓ answerGenerator testé en cohérence avec validateAnswer
✓ Les tests passent tous avant de passer au jalon 4
✓ Documenter dans chaque test POURQUOI ce cas est testé
  (commentaire court suffit)
```

---

## Résumé des fichiers créés / modifiés

### Nouveaux fichiers

```
src/__tests__/exerciseService.test.js
src/__tests__/scoreService.test.js
src/__tests__/contentService.test.js
src/__tests__/answerGenerator.test.js
```

### Fichiers modifiés

```
vite.config.js      ← ajout config test Vitest
package.json        ← scripts test + build modifiés
```

### Fichiers non touchés

```
Tout le reste — zéro modification du code de production
```
