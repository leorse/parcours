# Jalon 3 — Moteur d'exercices
## Document technique pour Claude dans VS Code

---

## Objectif du jalon

Implémenter le moteur de rendu des exercices interactifs.
Remplacer les `ExerciseBlock` placeholder du jalon 2 par de vrais composants jouables.
Implémenter tous les types d'exercices définis dans le YAML.
Gérer la validation des réponses, le feedback, et préparer les hooks pour le score (jalon 4).

**À la fin du jalon 3 :** tous les types d'exercices sont jouables dans le navigateur,
les réponses sont validées localement, le feedback s'affiche, le score est calculé
mais pas encore sauvegardé (jalon 4).

**Ce qui ne change pas :** les écrans de navigation, le parc SVG, le LessonRenderer,
le contentService. Seul `ExerciseBlock` est remplacé par le vrai moteur.

---

## Principe architectural — le moteur d'exercices

Le moteur repose sur un **dispatcher** : il lit le champ `type` du YAML
et instancie le bon composant. Ajouter un nouveau type d'exercice
= ajouter un composant + déclarer le type dans le dispatcher.
**Rien d'autre ne change.**

```
ExerciseBlock (jalon 2 — placeholder)
    ↓ remplacé par
ExerciseEngine (jalon 3 — dispatcher)
    ├── MultipleChoiceExercise     type: multiple_choice
    ├── FillInTheBlankExercise     type: fill_in_the_blank
    ├── ImageTapExercise           type: image_tap
    ├── DragDropExercise           type: drag_drop
    ├── TimelineExercise           type: timeline
    └── FreeTextExercise           type: free_text  (placeholder → jalon 3bis)
```

---

## Structure des fichiers

```
src/
  components/
    lesson/
      blocks/
        ExerciseBlock.jsx     ← remplacé : devient un wrapper vers ExerciseEngine

    exercise/
      ExerciseEngine.jsx      ← dispatcher principal (nouveau)
      ExerciseShell.jsx       ← coquille commune (header, XP, progression)
      ExerciseResult.jsx      ← écran résultat après validation

      types/
        MultipleChoiceExercise.jsx
        FillInTheBlankExercise.jsx
        ImageTapExercise.jsx
        DragDropExercise.jsx
        TimelineExercise.jsx
        FreeTextExercise.jsx   ← placeholder jalon 3bis

      hooks/
        useExerciseState.js   ← état interne d'un exercice
        useExerciseScore.js   ← calcul du score (stub → branché jalon 4)

  services/
    exerciseService.js        ← chargement et validation des exercices
    scoreService.js           ← calcul score + XP (stub → branché jalon 4)
```

---

## ExerciseEngine.jsx — le dispatcher

```jsx
// src/components/exercise/ExerciseEngine.jsx

import MultipleChoiceExercise from './types/MultipleChoiceExercise'
import FillInTheBlankExercise from './types/FillInTheBlankExercise'
import ImageTapExercise       from './types/ImageTapExercise'
import DragDropExercise       from './types/DragDropExercise'
import TimelineExercise       from './types/TimelineExercise'
import FreeTextExercise       from './types/FreeTextExercise'
import ExerciseResult         from './ExerciseResult'
import { useExerciseState }   from './hooks/useExerciseState'

// Registre des types — ajouter ici pour un nouveau type
const EXERCISE_REGISTRY = {
  multiple_choice:   MultipleChoiceExercise,
  fill_in_the_blank: FillInTheBlankExercise,
  image_tap:         ImageTapExercise,
  drag_drop:         DragDropExercise,
  timeline:          TimelineExercise,
  free_text:         FreeTextExercise,
}

export default function ExerciseEngine({ exerciseData, onComplete }) {
  // exerciseData = objet parsé depuis le YAML (exercise + métadonnées)
  const { state, submit, retry } = useExerciseState(exerciseData)

  // Type inconnu — afficher un warning visible
  const Component = EXERCISE_REGISTRY[exerciseData.exercise.type]
  if (!Component) {
    console.warn(`Type d'exercice inconnu : ${exerciseData.exercise.type}`)
    return (
      <div className="exercise-unknown">
        Type inconnu : <code>{exerciseData.exercise.type}</code>
      </div>
    )
  }

  // Résultat affiché après validation
  if (state.submitted) {
    return (
      <ExerciseResult
        score={state.score}
        xp={exerciseData.xp}
        feedback={state.feedback}
        onContinue={() => onComplete(state.score)}
        onRetry={retry}
      />
    )
  }

  return (
    <ExerciseShell exerciseData={exerciseData}>
      <Component
        exercise={exerciseData.exercise}
        onSubmit={submit}
      />
    </ExerciseShell>
  )
}
```

---

## ExerciseShell.jsx — coquille commune

Tout exercice est enveloppé dans cette coquille qui affiche :
- Le numéro et titre de l'exercice
- La jauge de difficulté
- Les étoiles XP en jeu
- Le bouton Valider (déclenché par le composant enfant)

```jsx
export default function ExerciseShell({ exerciseData, children }) {
  return (
    <div className="exercise-shell">
      <div className="exercise-header">
        <DifficultyStars level={exerciseData.difficulty} />
        <XpBadge xp={exerciseData.xp} />
      </div>
      <div className="exercise-body">
        {children}
      </div>
    </div>
  )
}
```

---

## useExerciseState.js — état interne

```js
// src/components/exercise/hooks/useExerciseState.js
import { useState } from 'react'
import { validateAnswer } from '../../../services/exerciseService'
import { calcScore }      from '../../../services/scoreService'

export function useExerciseState(exerciseData) {
  const [answer, setAnswer]     = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore]       = useState(0)
  const [feedback, setFeedback] = useState(null)

  const submit = (userAnswer) => {
    const result   = validateAnswer(exerciseData.exercise, userAnswer)
    const computed = calcScore(result, exerciseData)

    setAnswer(userAnswer)
    setScore(computed.score)
    setFeedback(result.feedback)
    setSubmitted(true)

    // Jalon 4 : ici on appellera progressService.saveResult(...)
  }

  const retry = () => {
    setAnswer(null)
    setSubmitted(false)
    setScore(0)
    setFeedback(null)
  }

  return {
    state: { answer, submitted, score, feedback },
    submit,
    retry,
  }
}
```

---

## exerciseService.js — validation des réponses

```js
// src/services/exerciseService.js
// Contient toute la logique de validation pour chaque type
// PAS de logique dans les composants visuels

export function validateAnswer(exercise, userAnswer) {
  switch (exercise.type) {
    case 'multiple_choice':
      return validateMultipleChoice(exercise, userAnswer)
    case 'fill_in_the_blank':
      return validateFillInTheBlank(exercise, userAnswer)
    case 'image_tap':
      return validateImageTap(exercise, userAnswer)
    case 'drag_drop':
      return validateDragDrop(exercise, userAnswer)
    case 'timeline':
      return validateTimeline(exercise, userAnswer)
    default:
      return { correct: false, score: 0, feedback: null }
  }
}

function validateMultipleChoice(exercise, userAnswer) {
  // userAnswer = id du choix sélectionné (ex: "a")
  const choice = exercise.choices.find(c => c.id === userAnswer)
  return {
    correct: choice?.correct ?? false,
    score: choice?.correct ? 1.0 : 0.0,
    feedback: choice?.feedback ?? null,
  }
}

function validateFillInTheBlank(exercise, userAnswer) {
  // userAnswer = { b1: "valeur", b2: "valeur" }
  let correct = 0
  let total = 0
  const feedbacks = []

  exercise.segments
    .filter(s => s.blank)
    .forEach(s => {
      total++
      const expected = s.blank.answer.toLowerCase()
      const variants = (s.blank.accept_variants ?? []).map(v => v.toLowerCase())
      const given    = (userAnswer[s.blank.id] ?? '').toLowerCase().trim()
      const isCaseSensitive = exercise.settings?.case_sensitive ?? false

      const match = isCaseSensitive
        ? given === s.blank.answer || variants.includes(given)
        : given === expected || variants.includes(given)

      if (match) correct++
      else feedbacks.push(`Attendu : "${s.blank.answer}"`)
    })

  return {
    correct: correct === total,
    score: total > 0 ? correct / total : 0,
    feedback: feedbacks.length > 0 ? feedbacks.join(' — ') : null,
  }
}

function validateImageTap(exercise, userAnswer) {
  // userAnswer = id de la zone cliquée (ex: "z2")
  const zone = exercise.zones.find(z => z.id === userAnswer)
  return {
    correct: zone?.correct ?? false,
    score: zone?.correct ? 1.0 : 0.0,
    feedback: zone?.feedback ?? null,
  }
}

function validateDragDrop(exercise, userAnswer) {
  // userAnswer = { sourceId: targetId, ... }
  let correct = 0
  exercise.pairs.forEach(pair => {
    if (userAnswer[pair.source.id] === pair.target.id) correct++
  })
  return {
    correct: correct === exercise.pairs.length,
    score: exercise.pairs.length > 0 ? correct / exercise.pairs.length : 0,
    feedback: null,
  }
}

function validateTimeline(exercise, userAnswer) {
  // userAnswer = [id1, id2, id3] dans l'ordre donné par l'élève
  const expected = [...exercise.items]
    .sort((a, b) => a.correct_position - b.correct_position)
    .map(item => item.id)

  const allCorrect = userAnswer.every((id, i) => id === expected[i])
  let correctCount = userAnswer.filter((id, i) => id === expected[i]).length

  return {
    correct: allCorrect,
    score: exercise.items.length > 0 ? correctCount / exercise.items.length : 0,
    feedback: null,
  }
}
```

---

## scoreService.js — calcul XP (stub jalon 3, branché jalon 4)

```js
// src/services/scoreService.js
// Jalon 3 : calcule localement, n'envoie rien
// Jalon 4 : appellera le backend pour sauvegarder

export function calcScore(validationResult, exerciseData) {
  const xpEarned = Math.round(exerciseData.xp * validationResult.score)
  return {
    score: validationResult.score,
    xpEarned,
    correct: validationResult.correct,
  }
}

// Stub — sera remplacé au jalon 4
export async function saveResult(exerciseId, result, userId) {
  console.log('[scoreService] saveResult stub —', exerciseId, result)
  // Jalon 4 : POST /api/progress/exercise
}
```

---

## Les composants d'exercices

### MultipleChoiceExercise.jsx

```jsx
export default function MultipleChoiceExercise({ exercise, onSubmit }) {
  const [selected, setSelected] = useState(null)

  // Mélanger les choix si shuffle: true
  const choices = useMemo(() => {
    const list = [...exercise.choices]
    if (exercise.settings?.shuffle) list.sort(() => Math.random() - 0.5)
    return list
  }, [exercise])

  return (
    <div className="exercise-mcq">
      <MdBlock text={exercise.question} />
      <div className="choices-list">
        {choices.map(choice => (
          <button
            key={choice.id}
            className={`choice-btn ${selected === choice.id ? 'selected' : ''}`}
            onClick={() => setSelected(choice.id)}
          >
            <MdBlock text={choice.text} />
          </button>
        ))}
      </div>
      <button
        className="btn-validate"
        disabled={selected === null}
        onClick={() => onSubmit(selected)}
      >
        Valider
      </button>
    </div>
  )
}
```

### FillInTheBlankExercise.jsx

```jsx
export default function FillInTheBlankExercise({ exercise, onSubmit }) {
  const [answers, setAnswers] = useState({})

  const setAnswer = (blankId, value) =>
    setAnswers(prev => ({ ...prev, [blankId]: value }))

  const allFilled = exercise.segments
    .filter(s => s.blank)
    .every(s => answers[s.blank.id]?.trim())

  return (
    <div className="exercise-fitb">
      {exercise.instruction && <p className="instruction">{exercise.instruction}</p>}
      <div className="segments">
        {exercise.segments.map((seg, i) => {
          if (seg.text) return <MdBlock key={i} text={seg.text} inline />
          if (seg.blank) return (
            <input
              key={i}
              type="text"
              value={answers[seg.blank.id] ?? ''}
              onChange={e => setAnswer(seg.blank.id, e.target.value)}
              className="blank-input"
              style={{ width: `${Math.max(seg.blank.answer.length * 14, 60)}px` }}
            />
          )
          return null
        })}
      </div>
      {exercise.hint && (
        <HintButton hint={exercise.hint} />
      )}
      <button
        className="btn-validate"
        disabled={!allFilled}
        onClick={() => onSubmit(answers)}
      >
        Valider
      </button>
    </div>
  )
}
```

### ImageTapExercise.jsx

```jsx
export default function ImageTapExercise({ exercise, onSubmit }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className="exercise-image-tap">
      <p className="instruction">{exercise.instruction}</p>
      <div className="image-container" style={{ position: 'relative' }}>
        {exercise.image
          ? <img src={exercise.image} alt="Exercice" style={{ width: '100%' }} />
          : <div className="image-placeholder">Image : {exercise.image}</div>
        }
        {/* Zones cliquables en SVG overlay */}
        <svg
          viewBox="0 0 100 100"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          preserveAspectRatio="none"
        >
          {exercise.zones.map(zone => (
            <rect
              key={zone.id}
              x={zone.coords.x} y={zone.coords.y}
              width={zone.coords.width} height={zone.coords.height}
              fill={selected === zone.id ? 'rgba(79,70,229,0.3)' : 'transparent'}
              stroke={selected === zone.id ? '#4F46E5' : 'transparent'}
              strokeWidth="0.5"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelected(zone.id)}
            />
          ))}
        </svg>
      </div>
      <button
        className="btn-validate"
        disabled={selected === null}
        onClick={() => onSubmit(selected)}
      >
        Valider
      </button>
    </div>
  )
}
```

### DragDropExercise.jsx

```jsx
// Utiliser @dnd-kit/core pour le drag and drop
// npm install @dnd-kit/core @dnd-kit/sortable

import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'

export default function DragDropExercise({ exercise, onSubmit }) {
  const [pairs, setPairs] = useState({})  // { sourceId: targetId }

  const handleDrop = ({ active, over }) => {
    if (over) setPairs(prev => ({ ...prev, [active.id]: over.id }))
  }

  const allPaired = exercise.pairs.every(p => pairs[p.source.id])

  return (
    <DndContext onDragEnd={handleDrop}>
      <p className="instruction">{exercise.instruction}</p>
      <div className="drag-drop-grid">
        <div className="sources">
          {exercise.pairs.map(pair => (
            <DraggableItem key={pair.source.id} id={pair.source.id}>
              {pair.source.tex
                ? <MathInline tex={pair.source.tex} />
                : pair.source.text
              }
            </DraggableItem>
          ))}
        </div>
        <div className="targets">
          {exercise.pairs.map(pair => (
            <DroppableTarget key={pair.target.id} id={pair.target.id}>
              {pair.target.image
                ? <img src={pair.target.image} alt="" />
                : pair.target.text
              }
            </DroppableTarget>
          ))}
        </div>
      </div>
      <button
        className="btn-validate"
        disabled={!allPaired}
        onClick={() => onSubmit(pairs)}
      >
        Valider
      </button>
    </DndContext>
  )
}
```

### TimelineExercise.jsx

```jsx
// Réutilise @dnd-kit/sortable pour le réordonnement
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable'

export default function TimelineExercise({ exercise, onSubmit }) {
  const [items, setItems] = useState(() => {
    const list = [...exercise.items]
    if (exercise.settings?.shuffle) list.sort(() => Math.random() - 0.5)
    return list
  })

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      setItems(arrayMove(items, oldIndex, newIndex))
    }
  }

  return (
    <div className="exercise-timeline">
      <p className="instruction">{exercise.instruction}</p>
      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)}>
          {items.map((item, index) => (
            <SortableTimelineItem key={item.id} item={item} index={index} />
          ))}
        </SortableContext>
      </DndContext>
      <button
        className="btn-validate"
        onClick={() => onSubmit(items.map(i => i.id))}
      >
        Valider
      </button>
    </div>
  )
}
```

### FreeTextExercise.jsx — placeholder jalon 3bis

```jsx
export default function FreeTextExercise({ exercise }) {
  // Jalon 3 : placeholder visible
  // Jalon 3bis : implémentation complète avec appel backend IA
  return (
    <div className="exercise-placeholder">
      <span>✏️</span>
      <span>Exercice texte libre — disponible prochainement</span>
    </div>
  )
}
```

---

## ExerciseResult.jsx — écran de résultat

```jsx
export default function ExerciseResult({ score, xp, feedback, onContinue, onRetry }) {
  const xpEarned = Math.round(xp * score)
  const isSuccess = score >= 0.5

  return (
    <div className={`exercise-result ${isSuccess ? 'success' : 'fail'}`}>
      <div className="result-icon">
        {isSuccess ? '🎉' : '💪'}
      </div>
      <div className="result-score">
        {Math.round(score * 100)}%
      </div>
      {feedback && (
        <div className="result-feedback">
          <MdBlock text={feedback} />
        </div>
      )}
      <div className="result-xp">
        +{xpEarned} XP
        {/* Jalon 5 : animation XP ici */}
      </div>
      <div className="result-actions">
        {!isSuccess && (
          <button className="btn-secondary" onClick={onRetry}>
            Réessayer
          </button>
        )}
        <button className="btn-primary" onClick={onContinue}>
          Continuer
        </button>
      </div>
    </div>
  )
}
```

---

## Mise à jour de ExerciseBlock — plus un placeholder

```jsx
// src/components/lesson/blocks/ExerciseBlock.jsx
// Jalon 2 : placeholder
// Jalon 3 : charge et affiche le vrai exercice

import { useState, useEffect } from 'react'
import { getExercise } from '../../../services/contentService'
import ExerciseEngine from '../../exercise/ExerciseEngine'

export default function ExerciseBlock({ ref: exoRef, courseId, subjectId }) {
  const [exerciseData, setExerciseData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExercise(courseId, subjectId, exoRef)
      .then(setExerciseData)
      .finally(() => setLoading(false))
  }, [exoRef, courseId, subjectId])

  if (loading) return <div className="exercise-loading">Chargement...</div>
  if (!exerciseData) return <div className="exercise-error">Exercice introuvable : {exoRef}</div>

  return (
    <ExerciseEngine
      exerciseData={exerciseData}
      onComplete={(score) => {
        // Jalon 4 : progressService.saveResult() ici
        console.log(`Exercice ${exoRef} terminé, score: ${score}`)
      }}
    />
  )
}
```

---

## Nouvelle dépendance

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## ══════════════════════════════════════════════════════
## CRÉER UN NOUVEAU TYPE D'EXERCICE — GUIDE COMPLET
## ══════════════════════════════════════════════════════

Exemple : on ajoute un exercice **"Relier les éléments"** (`matching`).
Voici exactement ce qu'il faut faire, de A à Z.

---

### Étape 1 — Définir le YAML

Ajouter la structure dans `exercises.yaml` du cours concerné :

```yaml
- id: "exo-match-001"
  xp: 25
  skills:
    - tag: "vocabulaire/association"
      weight: 1.0
  difficulty: 2
  exercise:
    type: matching              # ← le nouveau type
    instruction: "Relie chaque mot à sa définition."
    pairs:
      - left:  { id: l1, text: "Numérateur" }
        right: { id: r1, text: "Nombre du haut dans une fraction" }
      - left:  { id: l2, text: "Dénominateur" }
        right: { id: r2, text: "Nombre du bas dans une fraction" }
      - left:  { id: l3, text: "Fraction irréductible" }
        right: { id: r3, text: "Ne peut plus être simplifiée" }
    settings:
      shuffle_right: true
```

---

### Étape 2 — Créer le composant React

```jsx
// src/components/exercise/types/MatchingExercise.jsx

import { useState } from 'react'

export default function MatchingExercise({ exercise, onSubmit }) {
  // userAnswer = { leftId: rightId, ... }
  const [matches, setMatches] = useState({})
  const [selectedLeft, setSelectedLeft] = useState(null)

  const rightItems = useMemo(() => {
    const list = [...exercise.pairs.map(p => p.right)]
    if (exercise.settings?.shuffle_right) list.sort(() => Math.random() - 0.5)
    return list
  }, [exercise])

  const handleLeftClick = (leftId) => setSelectedLeft(leftId)

  const handleRightClick = (rightId) => {
    if (!selectedLeft) return
    setMatches(prev => ({ ...prev, [selectedLeft]: rightId }))
    setSelectedLeft(null)
  }

  const allMatched = exercise.pairs.every(p => matches[p.left.id])

  return (
    <div className="exercise-matching">
      <p className="instruction">{exercise.instruction}</p>
      <div className="matching-grid">
        <div className="matching-left">
          {exercise.pairs.map(pair => (
            <button
              key={pair.left.id}
              className={`match-item ${selectedLeft === pair.left.id ? 'active' : ''} ${matches[pair.left.id] ? 'matched' : ''}`}
              onClick={() => handleLeftClick(pair.left.id)}
            >
              {pair.left.text}
            </button>
          ))}
        </div>
        <div className="matching-right">
          {rightItems.map(right => (
            <button
              key={right.id}
              className={`match-item ${Object.values(matches).includes(right.id) ? 'matched' : ''}`}
              onClick={() => handleRightClick(right.id)}
            >
              {right.text}
            </button>
          ))}
        </div>
      </div>
      <button
        className="btn-validate"
        disabled={!allMatched}
        onClick={() => onSubmit(matches)}
      >
        Valider
      </button>
    </div>
  )
}
```

---

### Étape 3 — Ajouter la validation dans exerciseService.js

```js
// Dans exerciseService.js — ajouter le case et la fonction

// Dans le switch de validateAnswer() :
case 'matching':
  return validateMatching(exercise, userAnswer)

// Nouvelle fonction :
function validateMatching(exercise, userAnswer) {
  // userAnswer = { leftId: rightId, ... }
  let correct = 0
  exercise.pairs.forEach(pair => {
    if (userAnswer[pair.left.id] === pair.right.id) correct++
  })
  return {
    correct: correct === exercise.pairs.length,
    score: exercise.pairs.length > 0 ? correct / exercise.pairs.length : 0,
    feedback: null,
  }
}
```

---

### Étape 4 — Déclarer dans ExerciseEngine.jsx

```js
// Dans ExerciseEngine.jsx — ajouter dans EXERCISE_REGISTRY :
import MatchingExercise from './types/MatchingExercise'

const EXERCISE_REGISTRY = {
  multiple_choice:   MultipleChoiceExercise,
  fill_in_the_blank: FillInTheBlankExercise,
  image_tap:         ImageTapExercise,
  drag_drop:         DragDropExercise,
  timeline:          TimelineExercise,
  free_text:         FreeTextExercise,
  matching:          MatchingExercise,   // ← ajouter ici
}
```

---

### Étape 5 — Définir le skill dans skills-tree.yaml

```yaml
# public/content/skills/skills-tree.yaml

skills:
  - id: "vocabulaire"
    label: "Vocabulaire"
    subject: "francais"
    color: "#059669"
    children:

      - id: "vocabulaire/association"
        label: "Association mot-définition"
        description: "Relier un mot à sa définition ou son équivalent"
        # Ce skill sera alimenté par tous les exercices taggés
        # skills: [{tag: "vocabulaire/association", weight: X}]
```

Le skill est déclaré une seule fois dans `skills-tree.yaml`.
Tous les exercices qui référencent ce tag alimenteront automatiquement
le score de compétence de l'élève (implémenté au jalon 5).

---

### Récapitulatif — ce qu'il faut faire pour un nouveau type

```
✅ 1. YAML    → définir la structure dans exercises.yaml
✅ 2. Composant → créer MonTypeExercise.jsx dans types/
✅ 3. Validation → ajouter case + fonction dans exerciseService.js
✅ 4. Registry → ajouter dans EXERCISE_REGISTRY dans ExerciseEngine.jsx
✅ 5. Skill   → déclarer le tag dans skills-tree.yaml si nouveau skill

C'est tout. Aucun autre fichier n'est modifié.
```

---

## Ce qu'il ne faut PAS faire au jalon 3

```
✗ Ne pas sauvegarder la progression (stub console.log suffit → jalon 4)
✗ Ne pas implémenter FreeTextExercise (placeholder → jalon 3bis)
✗ Ne pas implémenter l'animation XP (placeholder → jalon 5)
✗ Ne pas mettre de logique de validation dans les composants visuels
  → toute la validation est dans exerciseService.js
✗ Ne pas importer exerciseService depuis les composants directement
  → passer par useExerciseState qui fait l'intermédiaire
```

## Ce qu'il faut absolument faire

```
✓ ExerciseEngine extensible par simple ajout dans EXERCISE_REGISTRY
✓ Toute la validation dans exerciseService.js, zéro logique dans les JSX
✓ scoreService.js créé même en stub (interface stable pour jalon 4)
✓ ExerciseResult avec score, XP calculé, feedback, boutons retry/continue
✓ Tester chaque type avec un vrai exercice YAML
✓ FreeTextExercise en placeholder visible (pas null, pas d'erreur)
✓ skills-tree.yaml créé avec au moins les skills des exercices de test
✓ @dnd-kit installé pour DragDrop et Timeline
```

---

## Résumé des fichiers créés / modifiés

### Nouveaux fichiers

```
src/components/exercise/ExerciseEngine.jsx
src/components/exercise/ExerciseShell.jsx
src/components/exercise/ExerciseResult.jsx
src/components/exercise/hooks/useExerciseState.js
src/components/exercise/types/MultipleChoiceExercise.jsx
src/components/exercise/types/FillInTheBlankExercise.jsx
src/components/exercise/types/ImageTapExercise.jsx
src/components/exercise/types/DragDropExercise.jsx
src/components/exercise/types/TimelineExercise.jsx
src/components/exercise/types/FreeTextExercise.jsx   ← placeholder
src/services/exerciseService.js
src/services/scoreService.js                         ← stub
public/content/skills/skills-tree.yaml
```

### Fichiers modifiés

```
src/components/lesson/blocks/ExerciseBlock.jsx  ← remplace le placeholder
```

### Fichiers non touchés

```
Tous les écrans (Splash, Menu, SubjectSelect, CourseSelect, StepSelect/Parc)
LessonRenderer.jsx et les autres blocs (MdBlock, NoticeBlock...)
contentService.js
AppContext.jsx
useProgress.js / useProfile.js / useAudio.js
AppRouter.jsx
theme.js
```
