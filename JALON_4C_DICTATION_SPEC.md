# Jalon 4c — Exercice de dictée
## Document technique pour Claude dans VS Code

---

## Objectif

Ajouter le type d'exercice `dictation` — l'élève écoute un mot prononcé
par synthèse vocale et doit l'écrire correctement, sans aide du correcteur
orthographique.

S'intègre dans l'architecture existante en respectant strictement la règle §8 :
4 fichiers à toucher, rien d'autre.

**À la fin du jalon 4c :**
- L'exercice dictée est jouable dans le navigateur Chrome
- La synthèse vocale prononce les mots en français
- Le correcteur orthographique est désactivé sur les champs concernés
- Les tests unitaires couvrent la validation dictée
- `npm run build` passe

**Ce qui ne change pas :** tous les autres exercices, la navigation,
le parc SVG, le backend, les autres services.

---

## Rappel — règle §8 (ajouter un type d'exercice)

```
1. YAML      → définir la structure dans exercises.yaml
2. Composant → créer DictationExercise.jsx dans types/
3. Validation → ajouter case + fonction dans exerciseService.js
4. Registry  → ajouter dans EXERCISE_REGISTRY dans ExerciseEngine.jsx
→ Rien d'autre ne change
```

---

## Étape 1 — Structure YAML

```yaml
# Dans exercises.yaml du cours concerné

- id: "exo-ortho-dictee-001"
  xp: 20
  skills:
    - tag: "orthographe/dictee"
      weight: 1.0
  difficulty: 2
  exercise:
    type: dictation
    disable_spellcheck: true   # toujours true pour ce type
    words:
      - text: "grenouille"
        hint: "un animal qui saute"   # optionnel
      - text: "appareil"
        hint: null
      - text: "chrysanthème"
        hint: "une fleur de la Toussaint"

- id: "exo-ortho-dictee-002"
  xp: 15
  skills:
    - tag: "orthographe/dictee"
      weight: 1.0
  difficulty: 1
  exercise:
    type: dictation
    disable_spellcheck: true
    words:
      - text: "maison"
      - text: "jardin"
      - text: "soleil"
```

---

## Étape 2 — DictationExercise.jsx

```jsx
// src/components/exercise/types/DictationExercise.jsx

import { useState, useEffect, useRef } from 'react'

export default function DictationExercise({ exercise, onSubmit }) {
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [answers,      setAnswers]         = useState([])   // réponses accumulées
  const [input,        setInput]           = useState('')
  const [spoken,       setSpoken]          = useState(false)
  const [speaking,     setSpeaking]        = useState(false)
  const [speechAvailable, setSpeechAvailable] = useState(false)
  const [showHint,     setShowHint]        = useState(false)
  const inputRef = useRef(null)

  const words     = exercise.words ?? []
  const totalWords = words.length
  const currentWord = words[currentIndex]
  const isLast    = currentIndex === totalWords - 1

  // ── Vérifier la disponibilité de la synthèse vocale ────────────────────────
  useEffect(() => {
    const check = () => {
      const available =
        'speechSynthesis' in window &&
        window.speechSynthesis.getVoices().length > 0
      setSpeechAvailable(available)
    }
    // getVoices() est async au premier appel sur certains navigateurs
    window.speechSynthesis?.addEventListener('voiceschanged', check)
    check()
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', check)
      window.speechSynthesis?.cancel()
    }
  }, [])

  // ── Focus automatique sur le champ après avoir écouté ─────────────────────
  useEffect(() => {
    if (spoken) inputRef.current?.focus()
  }, [spoken])

  // ── Synthèse vocale ────────────────────────────────────────────────────────
  const speak = () => {
    if (speaking) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(currentWord.text)
    utterance.lang  = 'fr-FR'
    utterance.rate  = 0.85    // légèrement ralenti pour la dictée

    utterance.onstart = () => setSpeaking(true)
    utterance.onend   = () => {
      setSpeaking(false)
      setSpoken(true)
    }
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // ── Validation d'un mot ────────────────────────────────────────────────────
  const handleValidate = () => {
    if (!input.trim()) return

    const newAnswers = [...answers, input.trim()]
    setAnswers(newAnswers)

    if (isLast) {
      // Tous les mots répondus → soumettre
      onSubmit(newAnswers)
    } else {
      // Mot suivant
      setCurrentIndex(i => i + 1)
      setInput('')
      setSpoken(false)
      setShowHint(false)
    }
  }

  // ── Enter pour valider ─────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim() && spoken) {
      handleValidate()
    }
  }

  // ── Synthèse vocale indisponible ───────────────────────────────────────────
  if (!speechAvailable) {
    return (
      <div className="exercise-dictation-unavailable">
        <span>🔇</span>
        <p>La dictée n'est pas disponible sur ce navigateur.</p>
        <p className="hint-text">Utilise Chrome pour accéder à cet exercice.</p>
      </div>
    )
  }

  return (
    <div className="exercise-dictation">

      {/* Progression dans l'exercice */}
      <div className="dictation-progress">
        Mot {currentIndex + 1} / {totalWords}
      </div>

      {/* Boutons audio */}
      <div className="dictation-audio-buttons">
        <button
          className={`btn-listen ${speaking ? 'speaking' : ''}`}
          onClick={speak}
          disabled={speaking}
        >
          {speaking ? '🔊 ...' : '🔊 Écouter'}
        </button>

        <button
          className="btn-relisten"
          onClick={speak}
          disabled={!spoken || speaking}
        >
          🔁 Réécouter
        </button>
      </div>

      {/* Champ de saisie — correcteur désactivé */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!spoken}
        placeholder={spoken ? 'Écris le mot...' : 'Écoute d\'abord 👆'}
        className="dictation-input"

        // ── Désactivation du correcteur orthographique ──────────────────────
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="text"
        // ───────────────────────────────────────────────────────────────────
      />

      {/* Indice optionnel */}
      {currentWord.hint && (
        <div className="dictation-hint-container">
          {!showHint ? (
            <button
              className="btn-hint"
              onClick={() => setShowHint(true)}
              disabled={!spoken}
            >
              💡 Voir un indice
            </button>
          ) : (
            <p className="dictation-hint">
              Indice : {currentWord.hint}
            </p>
          )}
        </div>
      )}

      {/* Bouton valider */}
      <button
        className="btn-validate"
        disabled={!input.trim() || !spoken}
        onClick={handleValidate}
      >
        {isLast ? '✅ Terminer' : '➡️ Mot suivant'}
      </button>

    </div>
  )
}
```

---

## Étape 3 — exerciseService.js

```js
// Dans exerciseService.js — ajouter le case et la fonction

// Dans le switch de validateAnswer() :
case 'dictation':
  return validateDictation(exercise, userAnswer)

// Nouvelle fonction :
function validateDictation(exercise, userAnswer) {
  // userAnswer = tableau de strings (une réponse par mot)
  // ex: ["grenouille", "apareil", "chrysanthème"]
  if (!Array.isArray(userAnswer) || !userAnswer.length) {
    return { correct: false, score: 0, feedback: null }
  }

  const words   = exercise.words ?? []
  let correct   = 0
  const errors  = []

  words.forEach((word, i) => {
    const expected = word.text
      .toLowerCase()
      .trim()
      .normalize('NFD')    // décompose les accents pour comparaison robuste

    const given = (userAnswer[i] ?? '')
      .toLowerCase()
      .trim()
      .normalize('NFD')

    if (expected === given) {
      correct++
    } else {
      errors.push(`"${userAnswer[i]}" → attendu : "${word.text}"`)
    }
  })

  const score = words.length > 0 ? correct / words.length : 0

  return {
    correct:  correct === words.length,
    score:    Math.round(score * 100) / 100,
    feedback: errors.length > 0
      ? `${correct}/${words.length} mots corrects. ${errors.slice(0, 2).join(', ')}`
      : null,
  }
}
```

---

## Étape 4 — ExerciseEngine.jsx

```js
// Ajouter l'import
import DictationExercise from './types/DictationExercise'

// Ajouter dans EXERCISE_REGISTRY
const EXERCISE_REGISTRY = {
  multiple_choice:   MultipleChoiceExercise,
  fill_in_the_blank: FillInTheBlankExercise,
  image_tap:         ImageTapExercise,
  drag_drop:         DragDropExercise,
  timeline:          TimelineExercise,
  free_text:         FreeTextExercise,
  matching:          MatchingExercise,
  dictation:         DictationExercise,   // ← ajouter ici
}
```

---

## Mise à jour de answerGenerator.js (dashboard debug)

```js
// Dans answerGenerator.js — ajouter le case

case 'dictation':
  // Bonne réponse = tous les mots exacts dans l'ordre
  return (exercise.words ?? []).map(w => w.text)

// Et pour generateWrongAnswer :
case 'dictation':
  // Mauvaise réponse = mots avec fautes typiques
  return (exercise.words ?? []).map(w => w.text + 'x')
```

Le dashboard debug affichera les mots attendus en overlay
au lieu de pouvoir les injecter (la synthèse vocale ne peut pas être simulée).

---

## Mise à jour rétroactive — disable_spellcheck

Appliquer les attributs de désactivation du correcteur dans les composants
qui peuvent recevoir `disable_spellcheck: true` depuis le YAML.

### FillInTheBlankExercise.jsx

```jsx
// Ajouter sur chaque <input> dans les blancs :
const spellcheckProps = exercise.disable_spellcheck ? {
  autoComplete:    "off",
  autoCorrect:     "off",
  autoCapitalize:  "off",
  spellCheck:      false,
  inputMode:       "text",
} : {}

// Dans le JSX :
<input
  type="text"
  value={answers[seg.blank.id] ?? ''}
  onChange={e => setAnswer(seg.blank.id, e.target.value)}
  className="blank-input"
  {...spellcheckProps}
/>
```

### FreeTextExercise.jsx

```jsx
// Même approche sur le <textarea> :
const spellcheckProps = exercise.disable_spellcheck ? {
  autoComplete:   "off",
  autoCorrect:    "off",
  autoCapitalize: "off",
  spellCheck:     false,
} : {}

<textarea
  value={text}
  onChange={e => setText(e.target.value)}
  {...spellcheckProps}
/>
```

---

## Tests unitaires

### exerciseService.test.js — ajouter

```js
// Fixture
const DICTATION_EXERCISE = {
  type: 'dictation',
  disable_spellcheck: true,
  words: [
    { text: 'grenouille', hint: 'un animal qui saute' },
    { text: 'appareil',   hint: null },
    { text: 'chrysanthème', hint: 'une fleur' },
  ],
}

describe('validateAnswer — dictation', () => {

  test('tous les mots corrects → correct=true, score=1', () => {
    const result = validateAnswer(DICTATION_EXERCISE,
      ['grenouille', 'appareil', 'chrysanthème']
    )
    expect(result.correct).toBe(true)
    expect(result.score).toBe(1.0)
  })

  test('tous les mots incorrects → correct=false, score=0', () => {
    const result = validateAnswer(DICTATION_EXERCISE,
      ['grenouille', 'apareil', 'chrisanteme']
    )
    expect(result.correct).toBe(false)
    expect(result.score).toBeCloseTo(1/3)
  })

  test('un mot correct sur trois → score=0.33', () => {
    const result = validateAnswer(DICTATION_EXERCISE,
      ['grenouille', 'apareil', 'chrisanteme']
    )
    expect(result.score).toBeCloseTo(1/3)
  })

  test('insensible à la casse', () => {
    const result = validateAnswer(DICTATION_EXERCISE,
      ['Grenouille', 'APPAREIL', 'Chrysanthème']
    )
    expect(result.correct).toBe(true)
  })

  test('gère les accents via normalize NFD', () => {
    const result = validateAnswer(DICTATION_EXERCISE,
      ['grenouille', 'appareil', 'chrysantheme']   // sans accent
    )
    // "chrysantheme" vs "chrysanthème" → incorrect
    expect(result.correct).toBe(false)
  })

  test('espaces en début/fin ignorés', () => {
    const result = validateAnswer(DICTATION_EXERCISE,
      ['  grenouille  ', '  appareil  ', '  chrysanthème  ']
    )
    expect(result.correct).toBe(true)
  })

  test('réponse vide → score=0', () => {
    const result = validateAnswer(DICTATION_EXERCISE, [])
    expect(result.score).toBe(0)
    expect(result.correct).toBe(false)
  })

  test('réponse null → score=0 sans erreur', () => {
    const result = validateAnswer(DICTATION_EXERCISE, null)
    expect(result.score).toBe(0)
  })

  test('feedback liste les erreurs', () => {
    const result = validateAnswer(DICTATION_EXERCISE,
      ['grenouille', 'apareil', 'chrysanthème']
    )
    expect(result.feedback).toContain('appareil')
  })
})
```

### answerGenerator.test.js — ajouter

```js
describe('dictation — answerGenerator', () => {

  const DICTATION_EXO = {
    type: 'dictation',
    words: [
      { text: 'grenouille' },
      { text: 'appareil' },
    ]
  }

  test('generateCorrectAnswer retourne un tableau de strings', () => {
    const answer = generateCorrectAnswer(DICTATION_EXO)
    expect(Array.isArray(answer)).toBe(true)
    expect(answer).toHaveLength(2)
  })

  test('generateCorrectAnswer retourne les mots exacts', () => {
    const answer = generateCorrectAnswer(DICTATION_EXO)
    expect(answer[0]).toBe('grenouille')
    expect(answer[1]).toBe('appareil')
  })

  test('generateCorrectAnswer valide dans exerciseService', () => {
    const answer = generateCorrectAnswer(DICTATION_EXO)
    const result = validateAnswer(DICTATION_EXO, answer)
    expect(result.correct).toBe(true)
    expect(result.score).toBe(1.0)
  })

  test('generateWrongAnswer retourne un tableau incorrect', () => {
    const answer = generateWrongAnswer(DICTATION_EXO)
    const result = validateAnswer(DICTATION_EXO, answer)
    expect(result.correct).toBe(false)
  })
})
```

---

## Mise à jour skills-tree.yaml

```yaml
# public/content/skills/skills-tree.yaml — ajouter la branche orthographe

- id: "orthographe"
  label: "Orthographe"
  subject: "francais"
  color: "#059669"
  children:

    - id: "orthographe/dictee"
      label: "Dictée"
      description: "Écrire correctement les mots entendus"

    - id: "orthographe/accords"
      label: "Accords"
      description: "Accords en genre et en nombre"

    - id: "orthographe/homophones"
      label: "Homophones"
      description: "Distinguer les homophones (a/à, ou/où...)"
```

---

## Note pour le jalon 8a — Android natif

La Web Speech API n'existe pas en Kotlin/Compose.
Le composant `DictationExercise` aura un équivalent Android natif :

```kotlin
// À implémenter au jalon 8a
val tts = TextToSpeech(context) { status ->
    if (status == TextToSpeech.SUCCESS) {
        tts.language = Locale.FRENCH
        tts.setSpeechRate(0.85f)
        tts.speak(word, TextToSpeech.QUEUE_FLUSH, null, null)
    }
}

// Désactivation correcteur dans Compose
TextField(
    keyboardOptions = KeyboardOptions(
        autoCorrect = false,
        keyboardType = KeyboardType.Text,
    )
)
```

Annoter `DictationExercise.jsx` avec un commentaire :

```jsx
// ═══════════════════════════════════════════════════════
// JALON 8a — Android natif :
// Remplacer window.speechSynthesis par TextToSpeech Android
// Voir : android.speech.tts.TextToSpeech
// Rate  : tts.setSpeechRate(0.85f)
// Lang  : Locale.FRENCH
// ═══════════════════════════════════════════════════════
```

---

## Ce qu'il ne faut PAS faire

```
✗ Ne pas gérer plusieurs mots simultanément dans le state
  → un mot à la fois, index courant, réponses accumulées dans un tableau
✗ Ne pas afficher le mot à l'écran (c'est une dictée !)
✗ Ne pas utiliser Howler.js pour la synthèse vocale
  → Web Speech API native, zéro dépendance externe
✗ Ne pas bloquer l'UI si speechSynthesis est indisponible
  → message d'indisponibilité, pas d'erreur
✗ Ne pas modifier d'autres fichiers que les 4 prévus par la règle §8
  + answerGenerator, tests, skills-tree, disable_spellcheck rétroactif
```

## Ce qu'il faut absolument faire

```
✓ Écoute obligatoire avant de pouvoir saisir (champ disabled tant que !spoken)
✓ Bouton "Réécouter" disponible après première écoute
✓ Indice masqué par défaut, révélé sur demande
✓ Enter pour valider (UX clavier)
✓ Désactivation correcteur : autoComplete/autoCorrect/autoCapitalize/spellCheck
✓ normalize('NFD') dans la validation (accents)
✓ Commentaire JALON 8a dans DictationExercise.jsx
✓ Tous les tests passent dans npm run build
✓ disable_spellcheck appliqué rétroactivement sur FillInTheBlank et FreeText
```

---

## Résumé des fichiers créés / modifiés

### Nouveaux fichiers

```
src/components/exercise/types/DictationExercise.jsx
```

### Fichiers modifiés

```
src/components/exercise/ExerciseEngine.jsx              ← +import +registry
src/services/exerciseService.js                         ← +case +validateDictation
src/debug/utils/answerGenerator.js                      ← +case dictation
src/components/exercise/types/FillInTheBlankExercise.jsx← disable_spellcheck
src/components/exercise/types/FreeTextExercise.jsx      ← disable_spellcheck
src/__tests__/exerciseService.test.js                   ← +tests dictation
src/__tests__/answerGenerator.test.js                   ← +tests dictation
public/content/skills/skills-tree.yaml                  ← +branche orthographe
public/content/exercises/*.yaml                         ← +exercices dictée
```

### Fichiers non touchés

```
Tous les écrans de navigation
ExerciseShell.jsx / ExerciseResult.jsx
useExerciseState.js
contentService.js
progressService.js / scoreService.js
Le parc SVG
Le backend
Les autres types d'exercices
```
