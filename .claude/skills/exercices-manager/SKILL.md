---
name: exercices-manager
description: Créer ou modifier des exercices interactifs dans l'application Parcours. Utilise ce skill quand l'utilisateur veut ajouter un exercice, créer un nouveau type d'exercice, ou comprendre le fonctionnement du moteur d'exercices React+YAML de ce projet.
---

# Exercices Manager — Parcours

## Architecture du moteur d'exercices

```
course.yaml  (ref: "exo-xxx")
    ↓
exercises.yaml  (objet complet de l'exercice)
    ↓
ExerciseBlock.jsx  — fetch via contentService.getExercise(courseId, subjectId, exoId)
    ↓
ExerciseEngine.jsx  — lit exercise.exercise.type → dispatche via EXERCISE_REGISTRY
    ↓
XxxExercise.jsx  ←→  exerciseService.js  (toute la validation, jamais dans les composants)
                 ←→  scoreService.js     (calcScore + recordResult stub)
```

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `public/content/subjects/<subject>/courses/<courseId>/exercises.yaml` | Source de vérité des exercices |
| `public/content/subjects/<subject>/courses/<courseId>/course.yaml` | Référence les exercices dans les leçons (`type: exercise` + `ref:`) |
| `src/components/exercise/ExerciseEngine.jsx` | Dispatcher + EXERCISE_REGISTRY |
| `src/components/exercise/exercises/` | Un fichier JSX par type d'exercice |
| `src/services/exerciseService.js` | validateAnswer(exercise, userAnswer) — switch sur type |
| `src/services/scoreService.js` | calcScore() + recordResult() stub |
| `src/components/exercise/shared/MathText.jsx` | Rendu Markdown+LaTeX inline (ReactMarkdown+KaTeX) |
| `src/components/exercise/shared/ExerciseResult.jsx` | Carte résultat (✅/❌/📝 + score + XP + Réessayer) |

**Règle absolue** : les composants JSX ne valident rien. Ils reçoivent `onSubmit(answers)` et `result` (null ou objet). La validation est dans `exerciseService.js`.

---

## Interface commune des composants d'exercice

```jsx
function XxxExercise({ exercise, onSubmit, result }) {
  // result === null  → phase réponse (afficher le formulaire)
  // result !== null  → phase révision (couleurs correct/incorrect, pas de Vérifier)
}
```

`onSubmit(userAnswer)` est appelé avec le format propre à chaque type (voir ci-dessous).
`ExerciseEngine` appelle ensuite `validateAnswer`, `calcScore`, `recordResult`, puis passe le résultat à `ExerciseResult`.

---

## Schémas YAML par type d'exercice

### `multiple_choice` — QCM

```yaml
- id: "exo-<abbr>-<n>"
  xp: 15
  skills:
    - tag: "<domaine>/<compétence>"
      weight: 1.0
  difficulty: 1          # 1 facile · 2 moyen · 3 difficile
  exercise:
    type: multiple_choice
    question: |
      Texte Markdown + LaTeX inline : $4 \times 3$.
    choices:
      - id: a
        text: "Réponse correcte"
        correct: true
        feedback: "Feedback affiché après validation."
      - id: b
        text: "Mauvaise réponse"
        correct: false
        feedback: "Explication de l'erreur."
      - id: c
        text: "Autre mauvaise réponse"
        correct: false
        feedback: "Explication."
    settings:
      shuffle: true
```

`userAnswer` = `string` (id du choix). Règles : 1 seul `correct: true`, 2–5 choix.

---

### `fill_in_the_blank` — Texte à trous

```yaml
- id: "exo-<abbr>-<n>"
  xp: 20
  skills:
    - tag: "<domaine>/<compétence>"
      weight: 1.0
  difficulty: 1
  exercise:
    type: fill_in_the_blank
    instruction: "Complète les égalités."       # optionnel
    segments:
      - text: "$6 \\times 3 =$"
      - blank:
          id: b1
          answer: "18"
          accept_variants: ["dix-huit"]          # optionnel
      - text: "et $3 \\times 6 =$"
      - blank:
          id: b2
          answer: "18"
    hint: "Utilise la commutativité !"          # optionnel
    settings:
      case_sensitive: false                       # défaut false
```

`userAnswer` = `{ [blankId]: string }`. Validation : lowercase + trim.

---

### `image_tap` — Zone cliquable

```yaml
- id: "exo-<abbr>-<n>"
  xp: 15
  skills:
    - tag: "<domaine>/<compétence>"
      weight: 1.0
  difficulty: 2
  exercise:
    type: image_tap
    instruction: "Clique sur la bonne zone."
    image: null          # null = grille textuelle ; ou "/content/images/xxx.png"
    zones:
      - id: z1
        label: "Zone A"  # affiché dans grille si image null
        correct: false
        feedback: "Non."
      - id: z2
        label: "Zone B"
        correct: true
        feedback: "Exact !"
        # coords: { x: 10, y: 20, width: 30, height: 25 }  # si image fournie (% du viewBox 0–100)
```

`userAnswer` = `string` (id de la zone). Le clic soumet immédiatement. 1 seule zone `correct: true`.

---

### `drag_drop` — Glisser-déposer

```yaml
- id: "exo-<abbr>-<n>"
  xp: 25
  skills:
    - tag: "<domaine>/<compétence>"
      weight: 1.0
  difficulty: 2
  exercise:
    type: drag_drop
    instruction: "Glisse chaque expression vers son résultat."
    pairs:
      - source:
          id: src1
          tex: "4 \\times 3"       # ou text: "..." pour texte simple
        target:
          id: tgt1
          text: "12"
      - source:
          id: src2
          tex: "5 \\times 6"
        target:
          id: tgt2
          text: "30"
```

`userAnswer` = `{ [sourceId]: targetId }`. Validation : `userAnswer[pair.source.id] === pair.target.id`.

---

### `timeline` — Frise à réordonner

```yaml
- id: "exo-<abbr>-<n>"
  xp: 20
  skills:
    - tag: "<domaine>/<compétence>"
      weight: 1.0
  difficulty: 2
  exercise:
    type: timeline
    instruction: "Remets ces étapes dans le bon ordre."
    items:
      - id: e1
        text: "Première étape"
        correct_position: 1
      - id: e2
        text: "Deuxième étape"
        correct_position: 2
      - id: e3
        text: "Troisième étape"
        correct_position: 3
    settings:
      shuffle: true
```

`userAnswer` = `string[]` (ids dans l'ordre soumis). Score partiel (positions correctes / total).

---

### `matching` — Association

```yaml
- id: "exo-<abbr>-<n>"
  xp: 20
  skills:
    - tag: "<domaine>/<compétence>"
      weight: 1.0
  difficulty: 2
  exercise:
    type: matching
    instruction: "Relie chaque expression à son résultat."
    pairs:
      - left:  { id: l1, text: "$3 \\times 4$" }
        right: { id: r1, text: "12" }
      - left:  { id: l2, text: "$6 \\times 7$" }
        right: { id: r2, text: "42" }
    settings:
      shuffle_right: true
```

`userAnswer` = `{ [leftId]: rightId }`. Validation : `userAnswer[pair.left.id] === pair.right.id`.

---

### `free_text` — Texte libre (placeholder jalon 3bis)

```yaml
- id: "exo-<abbr>-<n>"
  xp: 10
  skills:
    - tag: "<domaine>/<compétence>"
      weight: 1.0
  difficulty: 1
  exercise:
    type: free_text
    instruction: "Explique avec tes propres mots…"
    prompt: "Texte d'invite dans la zone de saisie."
```

Non validé automatiquement. Affiche "disponible prochainement".

---

## Référencer un exercice dans course.yaml

Dans le tableau `content` d'un `steps_content[]` :

```yaml
- type: exercise
  ref: "exo-<abbr>-<n>"    # doit correspondre à l'id dans exercises.yaml
```

---

## Conventions de nommage

| Champ | Convention | Exemple |
|-------|-----------|---------|
| id exercice | `exo-<abbr>-<n>` | `exo-mul-008` |
| skill tag | `<domaine>/<compétence>` | `multiplication/table-7` |
| ids blanks | `b1`, `b2`… | — |
| ids zones image_tap | `z1`, `z2`… | — |
| ids drag_drop sources | `src1`, `src2`… | — |
| ids drag_drop targets | `tgt1`, `tgt2`… | — |
| ids matching left | `l1`, `l2`… | — |
| ids matching right | `r1`, `r2`… | — |
| ids timeline | `e1`, `e2`… | — |

---

## Créer un nouveau type d'exercice (4 étapes)

### Étape 1 — YAML
Définir la structure dans `exercises.yaml` et la référencer dans `course.yaml`.

### Étape 2 — Composant React
Créer `src/components/exercise/exercises/MonTypeExercise.jsx` :

```jsx
import { useState } from 'react'

export default function MonTypeExercise({ exercise, onSubmit, result }) {
  const [answer, setAnswer] = useState(null)
  const isSubmitted = result !== null

  return (
    <div className="exercise-mon-type">
      {/* UI de saisie si !isSubmitted */}
      {/* Affichage résultat (couleurs) si isSubmitted */}
      {!isSubmitted && (
        <button className="exercise-btn-validate" onClick={() => onSubmit(answer)}>
          Vérifier
        </button>
      )}
    </div>
  )
}
```

### Étape 3 — Validation
Dans `src/services/exerciseService.js`, ajouter dans le `switch` :

```js
case 'mon_type':
  return validateMonType(exercise, userAnswer)
```

Et la fonction :

```js
function validateMonType(exercise, userAnswer) {
  // retourne { correct: bool, score: 0..1, details: { feedback: string|null } }
}
```

### Étape 4 — Registre
Dans `src/components/exercise/ExerciseEngine.jsx`, ajouter l'import et l'entrée dans `EXERCISE_REGISTRY` :

```js
import MonTypeExercise from './exercises/MonTypeExercise'

const EXERCISE_REGISTRY = {
  // ...existants...
  mon_type: MonTypeExercise,
}
```

### Étape 5 — Skills tree (si nouveau tag)
Dans `public/content/skills-tree.yaml` :

```yaml
- id: "<domaine>/<compétence>"
  label: "Libellé affiché"
  subject: "<subject>"
  prerequisites: []
```

---

## Checklist après création/modification

- [ ] `id` unique dans `exercises.yaml`
- [ ] Au moins 1 bonne réponse définie
- [ ] Exercice référencé dans `course.yaml` avec `type: exercise` + `ref:`
- [ ] Si nouveau skill tag → ajouté dans `skills-tree.yaml`
- [ ] `node scripts/validate-content.mjs` → ✅
- [ ] `npm run build` → ✅ zéro erreur
