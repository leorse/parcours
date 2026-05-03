# Jalon 3bis-debug — Console de débogage
## Document technique pour Claude dans VS Code

---

## Objectif

Créer un dashboard de débogage accessible uniquement en mode développement (`import.meta.env.DEV`).
Il permet de naviguer dans tous les exercices, voir les réponses, injecter des réponses,
inspecter le YAML brut et observer l'état du moteur en temps réel.

**Complètement invisible en production.** Zéro impact sur l'app finale.

---

## Accès

```
URL : http://localhost:5173/debug
Visible : uniquement si import.meta.env.DEV === true
En build prod : la route n'existe pas, URL → 404
```

---

## Intégration dans le routeur

```jsx
// src/router/AppRouter.jsx

export const ROUTES = {
  // ... routes existantes ...
  DEBUG: '/debug',   // ajouté uniquement en DEV
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* routes normales existantes */}
        <Route path={ROUTES.SPLASH}   element={<SplashScreen />} />
        <Route path={ROUTES.MENU}     element={<MainMenuScreen />} />
        {/* ... */}

        {/* Route debug — DEV uniquement */}
        {import.meta.env.DEV && (
          <Route path={ROUTES.DEBUG} element={<DebugDashboard />} />
        )}
      </Routes>
    </BrowserRouter>
  )
}
```

Ajouter aussi un **bouton flottant** visible sur toutes les pages en DEV :

```jsx
// src/components/debug/DebugFAB.jsx
// FAB = Floating Action Button

import { useNavigate, useLocation } from 'react-router-dom'

export default function DebugFAB() {
  if (!import.meta.env.DEV) return null   // invisible en prod

  const navigate = useNavigate()
  const location = useLocation()
  const isOnDebug = location.pathname === '/debug'

  return (
    <button
      onClick={() => navigate(isOnDebug ? -1 : '/debug')}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        background: '#1a1a2e',
        color: '#00ff88',
        border: '1px solid #00ff88',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        fontSize: '20px',
        cursor: 'pointer',
        fontFamily: 'monospace',
        boxShadow: '0 0 12px rgba(0,255,136,0.3)',
      }}
      title="Debug console"
    >
      {isOnDebug ? '✕' : '🐛'}
    </button>
  )
}
```

Ajouter `<DebugFAB />` dans `App.jsx` :

```jsx
// App.jsx
export default function App() {
  return (
    <>
      <AppRouter />
      <DebugFAB />   {/* toujours là en DEV, invisible en prod */}
    </>
  )
}
```

---

## Structure des fichiers

```
src/
  debug/
    DebugDashboard.jsx        ← page principale /debug
    panels/
      ExerciseBrowser.jsx     ← sélecteur matière/cours/exercice
      ExercisePreview.jsx     ← affichage de l'exercice + contrôles debug
      AnswerInjector.jsx      ← injecteur de réponses
      YamlInspector.jsx       ← YAML brut de l'exercice
      EngineState.jsx         ← état du moteur après validation
      ContentTree.jsx         ← arbre de tout le contenu disponible
    hooks/
      useDebugExercise.js     ← état global du debug
    utils/
      answerGenerator.js      ← génère les réponses correctes/incorrectes
  components/
    debug/
      DebugFAB.jsx            ← bouton flottant
```

---

## DebugDashboard.jsx — layout principal

```jsx
// src/debug/DebugDashboard.jsx

import { useState } from 'react'
import ExerciseBrowser from './panels/ExerciseBrowser'
import ExercisePreview from './panels/ExercisePreview'
import YamlInspector   from './panels/YamlInspector'
import EngineState     from './panels/EngineState'
import ContentTree     from './panels/ContentTree'
import { useDebugExercise } from './hooks/useDebugExercise'

export default function DebugDashboard() {
  const [activePanel, setActivePanel] = useState('exercise')
  const debug = useDebugExercise()

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>🐛 Debug Console — Parc-Cours</span>
        <span style={styles.env}>DEV · {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Layout 3 colonnes */}
      <div style={styles.body}>

        {/* Colonne gauche — navigation */}
        <div style={styles.sidebar}>
          <ContentTree
            onSelect={debug.loadExercise}
            selectedId={debug.exerciseData?.id}
          />
        </div>

        {/* Colonne centre — exercice */}
        <div style={styles.main}>
          <ExerciseBrowser debug={debug} />
          <ExercisePreview debug={debug} />
        </div>

        {/* Colonne droite — inspecteurs */}
        <div style={styles.inspector}>
          <TabBar
            tabs={['YAML', 'État', 'Réponses']}
            active={activePanel}
            onChange={setActivePanel}
          />
          {activePanel === 'YAML'     && <YamlInspector data={debug.exerciseData} />}
          {activePanel === 'État'     && <EngineState state={debug.lastResult} />}
          {activePanel === 'Réponses' && <AnswerInjector debug={debug} />}
        </div>

      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', background: '#0d1117', color: '#c9d1d9',
    fontFamily: 'monospace', fontSize: '13px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 16px', background: '#161b22',
    borderBottom: '1px solid #30363d',
  },
  logo:  { color: '#00ff88', fontWeight: 'bold', fontSize: '14px' },
  env:   { color: '#8b949e', fontSize: '11px' },
  body:  { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar:   { width: '220px', borderRight: '1px solid #30363d', overflow: 'auto', padding: '8px' },
  main:      { flex: 1, overflow: 'auto', padding: '16px', background: '#f6f8fa' },
  inspector: { width: '320px', borderLeft: '1px solid #30363d', overflow: 'auto', display: 'flex', flexDirection: 'column' },
}
```

---

## useDebugExercise.js — état global du debug

```js
// src/debug/hooks/useDebugExercise.js

import { useState, useCallback } from 'react'
import { getSubjects, getCourses, getExercise } from '../../services/contentService'
import { validateAnswer } from '../../services/exerciseService'
import { calcScore }      from '../../services/scoreService'
import { generateCorrectAnswer, generateWrongAnswer } from '../utils/answerGenerator'

export function useDebugExercise() {
  const [selectedSubject,  setSelectedSubject]  = useState(null)
  const [selectedCourse,   setSelectedCourse]   = useState(null)
  const [exerciseData,     setExerciseData]     = useState(null)
  const [showAnswers,      setShowAnswers]      = useState(false)
  const [lastResult,       setLastResult]       = useState(null)
  const [injectedAnswer,   setInjectedAnswer]   = useState(null)
  const [loading,          setLoading]          = useState(false)

  const loadExercise = useCallback(async (subjectId, courseId, exerciseId) => {
    setLoading(true)
    setLastResult(null)
    setInjectedAnswer(null)
    try {
      const data = await getExercise(courseId, subjectId, exerciseId)
      setExerciseData(data)
      setSelectedSubject(subjectId)
      setSelectedCourse(courseId)
    } finally {
      setLoading(false)
    }
  }, [])

  const injectCorrectAnswer = useCallback(() => {
    if (!exerciseData) return
    const answer = generateCorrectAnswer(exerciseData.exercise)
    setInjectedAnswer(answer)
  }, [exerciseData])

  const injectWrongAnswer = useCallback(() => {
    if (!exerciseData) return
    const answer = generateWrongAnswer(exerciseData.exercise)
    setInjectedAnswer(answer)
  }, [exerciseData])

  const submitAnswer = useCallback((userAnswer) => {
    if (!exerciseData) return
    const validation = validateAnswer(exerciseData.exercise, userAnswer)
    const score      = calcScore(validation, exerciseData)
    setLastResult({ validation, score, userAnswer, timestamp: new Date() })
    setInjectedAnswer(null)
  }, [exerciseData])

  const reset = useCallback(() => {
    setLastResult(null)
    setInjectedAnswer(null)
  }, [])

  return {
    selectedSubject, selectedCourse,
    exerciseData, showAnswers, setShowAnswers,
    lastResult, injectedAnswer,
    loading,
    loadExercise,
    injectCorrectAnswer,
    injectWrongAnswer,
    submitAnswer,
    reset,
  }
}
```

---

## ContentTree.jsx — arbre de navigation gauche

```jsx
// src/debug/panels/ContentTree.jsx
// Charge tout le contenu et l'affiche sous forme d'arbre cliquable

import { useState, useEffect } from 'react'
import { getSubjects, getCourses, getExercises } from '../../services/contentService'

export default function ContentTree({ onSelect, selectedId }) {
  const [tree, setTree] = useState([])

  useEffect(() => {
    async function buildTree() {
      const subjects = await getSubjects()
      const result = []

      for (const subject of subjects) {
        const courses = await getCourses(subject.id)
        const subjectNode = { ...subject, courses: [] }

        for (const course of courses) {
          const exercises = await getExercises(course.id, subject.id)
          subjectNode.courses.push({ ...course, exercises })
        }
        result.push(subjectNode)
      }
      setTree(result)
    }
    buildTree()
  }, [])

  return (
    <div>
      <div style={treeStyles.title}>CONTENU</div>
      {tree.map(subject => (
        <TreeSubject
          key={subject.id}
          subject={subject}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  )
}

function TreeSubject({ subject, onSelect, selectedId }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div style={treeStyles.subject} onClick={() => setOpen(o => !o)}>
        {open ? '▼' : '▶'} {subject.label}
      </div>
      {open && subject.courses.map(course => (
        <TreeCourse key={course.id} course={course}
                    subjectId={subject.id} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </div>
  )
}

function TreeCourse({ course, subjectId, onSelect, selectedId }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ paddingLeft: '12px' }}>
      <div style={treeStyles.course} onClick={() => setOpen(o => !o)}>
        {open ? '▼' : '▶'} {course.title}
        <span style={treeStyles.badge}>{course.exercises?.length ?? 0}</span>
      </div>
      {open && course.exercises?.map(exo => (
        <div
          key={exo.id}
          style={{
            ...treeStyles.exercise,
            background: selectedId === exo.id ? '#1f6feb' : 'transparent',
          }}
          onClick={() => onSelect(subjectId, course.id, exo.id)}
        >
          <span style={treeStyles.exoType}>{exo.exercise?.type}</span>
          {exo.id}
        </div>
      ))}
    </div>
  )
}

const treeStyles = {
  title:    { color: '#8b949e', fontSize: '10px', letterSpacing: '1px', padding: '8px 4px 4px' },
  subject:  { color: '#58a6ff', cursor: 'pointer', padding: '3px 4px', fontWeight: 'bold' },
  course:   { color: '#c9d1d9', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '4px' },
  exercise: { color: '#8b949e', cursor: 'pointer', padding: '2px 8px', borderRadius: '3px' },
  exoType:  { color: '#f0883e', fontSize: '10px', marginRight: '4px' },
  badge:    { marginLeft: 'auto', background: '#30363d', borderRadius: '8px', padding: '0 5px', fontSize: '10px' },
}
```

---

## ExercisePreview.jsx — affichage de l'exercice avec overlay debug

```jsx
// src/debug/panels/ExercisePreview.jsx

import ExerciseEngine from '../../components/exercise/ExerciseEngine'

export default function ExercisePreview({ debug }) {
  const { exerciseData, showAnswers, injectedAnswer, submitAnswer, reset, loading } = debug

  if (loading)        return <DebugPlaceholder text="Chargement..." />
  if (!exerciseData)  return <DebugPlaceholder text="← Sélectionne un exercice" />

  return (
    <div>
      {/* Barre de contrôle debug */}
      <div style={previewStyles.toolbar}>
        <label style={previewStyles.toggle}>
          <input
            type="checkbox"
            checked={showAnswers}
            onChange={e => debug.setShowAnswers(e.target.checked)}
          />
          &nbsp;Afficher les réponses
        </label>
        <button style={previewStyles.btn} onClick={debug.injectCorrectAnswer}>
          ✅ Injecter bonne réponse
        </button>
        <button style={previewStyles.btnWrong} onClick={debug.injectWrongAnswer}>
          ❌ Injecter mauvaise réponse
        </button>
        <button style={previewStyles.btnReset} onClick={reset}>
          ↺ Reset
        </button>
      </div>

      {/* Overlay réponses si showAnswers */}
      {showAnswers && (
        <AnswerOverlay exercise={exerciseData.exercise} />
      )}

      {/* L'exercice réel — dans un cadre blanc simulant l'app */}
      <div style={previewStyles.appFrame}>
        <ExerciseEngine
          exerciseData={exerciseData}
          injectedAnswer={injectedAnswer}    // prop debug — ignorée en prod
          debugMode={true}                   // prop debug — ignorée en prod
          onComplete={(score) => {
            // En debug onComplete ne navigue pas, reste sur la page
            console.log('[DEBUG] Exercise complete, score:', score)
          }}
        />
      </div>
    </div>
  )
}

// Overlay qui affiche les bonnes réponses par-dessus l'exercice
function AnswerOverlay({ exercise }) {
  const answers = generateCorrectAnswer(exercise)  // depuis answerGenerator

  return (
    <div style={overlayStyles.container}>
      <span style={overlayStyles.label}>🔑 Réponses attendues</span>
      <pre style={overlayStyles.pre}>
        {JSON.stringify(answers, null, 2)}
      </pre>
    </div>
  )
}
```

---

## YamlInspector.jsx — YAML brut

```jsx
// src/debug/panels/YamlInspector.jsx
import yaml from 'js-yaml'

export default function YamlInspector({ data }) {
  if (!data) return <Empty text="Aucun exercice sélectionné" />

  const yamlString = yaml.dump(data, { indent: 2 })

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <PanelHeader title="YAML SOURCE" />
      <pre style={inspectorStyles.pre}>
        <SyntaxHighlight yaml={yamlString} />
      </pre>
    </div>
  )
}

// Colorisation syntaxique minimaliste
function SyntaxHighlight({ yaml }) {
  return yaml.split('\n').map((line, i) => {
    const isKey   = /^\s*[\w-]+:/.test(line)
    const isValue = /:\s+.+/.test(line)
    const color   = isKey ? '#79c0ff' : '#a5d6ff'
    return <div key={i} style={{ color }}>{line}</div>
  })
}

const inspectorStyles = {
  pre: { margin: 0, padding: '12px', fontSize: '11px', lineHeight: '1.5', overflow: 'auto' }
}
```

---

## EngineState.jsx — état après validation

```jsx
// src/debug/panels/EngineState.jsx

export default function EngineState({ state }) {
  if (!state) return <Empty text="Lance une validation pour voir l'état" />

  const { validation, score, userAnswer, timestamp } = state
  const scorePercent = Math.round(score.score * 100)

  return (
    <div style={{ padding: '12px' }}>
      <PanelHeader title="ÉTAT MOTEUR" />

      <DebugRow label="Heure"    value={timestamp.toLocaleTimeString()} />
      <DebugRow label="Correct"  value={validation.correct ? '✅ OUI' : '❌ NON'} />
      <DebugRow label="Score"    value={`${scorePercent}%`} color={scorePercent >= 50 ? '#3fb950' : '#f85149'} />
      <DebugRow label="XP gagné" value={`${score.xpEarned} / ${score.xp ?? '?'}`} />

      {validation.feedback && (
        <>
          <Divider />
          <DebugRow label="Feedback" value={validation.feedback} />
        </>
      )}

      <Divider />
      <div style={stateStyles.label}>RÉPONSE SOUMISE</div>
      <pre style={stateStyles.pre}>
        {JSON.stringify(userAnswer, null, 2)}
      </pre>

      {/* Jalon 5 : skills impactés seront affichés ici */}
      <Divider />
      <div style={{ color: '#8b949e', fontSize: '11px' }}>
        Skills impactés → disponible au jalon 5
      </div>
    </div>
  )
}
```

---

## answerGenerator.js — génère des réponses de test

```js
// src/debug/utils/answerGenerator.js
// Génère automatiquement des réponses correctes et incorrectes
// pour chaque type d'exercice — utilisé par le dashboard debug

export function generateCorrectAnswer(exercise) {
  switch (exercise.type) {

    case 'multiple_choice':
      const correctChoice = exercise.choices.find(c => c.correct)
      return correctChoice?.id ?? null

    case 'fill_in_the_blank':
      return Object.fromEntries(
        exercise.segments
          .filter(s => s.blank)
          .map(s => [s.blank.id, s.blank.answer])
      )

    case 'image_tap':
      const correctZone = exercise.zones.find(z => z.correct)
      return correctZone?.id ?? null

    case 'drag_drop':
      return Object.fromEntries(
        exercise.pairs.map(p => [p.source.id, p.target.id])
      )

    case 'timeline':
      return [...exercise.items]
        .sort((a, b) => a.correct_position - b.correct_position)
        .map(item => item.id)

    case 'matching':
      return Object.fromEntries(
        exercise.pairs.map(p => [p.left.id, p.right.id])
      )

    default:
      return null
  }
}

export function generateWrongAnswer(exercise) {
  switch (exercise.type) {

    case 'multiple_choice':
      const wrongChoice = exercise.choices.find(c => !c.correct)
      return wrongChoice?.id ?? null

    case 'fill_in_the_blank':
      return Object.fromEntries(
        exercise.segments
          .filter(s => s.blank)
          .map(s => [s.blank.id, 'MAUVAISE_RÉPONSE'])
      )

    case 'image_tap':
      const wrongZone = exercise.zones.find(z => !z.correct)
      return wrongZone?.id ?? null

    case 'drag_drop':
      // Inverser toutes les paires
      const pairs = exercise.pairs
      return Object.fromEntries(
        pairs.map((p, i) => [p.source.id, pairs[(i + 1) % pairs.length].target.id])
      )

    case 'timeline':
      // Inverser l'ordre
      return [...exercise.items]
        .sort((a, b) => a.correct_position - b.correct_position)
        .map(item => item.id)
        .reverse()

    default:
      return null
  }
}
```

---

## Modifier ExerciseEngine pour accepter les props debug

Les composants d'exercices ne changent pas. Seul `ExerciseEngine` accepte
deux props optionnelles ignorées en dehors du debug :

```jsx
// src/components/exercise/ExerciseEngine.jsx

export default function ExerciseEngine({
  exerciseData,
  onComplete,
  injectedAnswer = null,    // ← debug only, null en prod
  debugMode = false,        // ← debug only, false en prod
}) {
  const { state, submit, retry } = useExerciseState(exerciseData, injectedAnswer)

  // En debugMode : après résultat, ne pas appeler onComplete (rester sur la page)
  const handleComplete = (score) => {
    if (!debugMode) onComplete(score)
  }

  // ...reste du composant identique
}
```

```js
// useExerciseState.js — accepter l'injection de réponse
export function useExerciseState(exerciseData, injectedAnswer = null) {
  // Si injectedAnswer change → mettre à jour l'état interne
  useEffect(() => {
    if (injectedAnswer !== null) {
      // Signaler aux composants qu'une réponse a été injectée
      // via un state partagé ou un event
    }
  }, [injectedAnswer])

  // ...reste identique
}
```

**Note :** la transmission de `injectedAnswer` aux composants enfants
est la partie la plus délicate. Le plus simple est de passer `injectedAnswer`
en prop à chaque composant d'exercice et de laisser chaque composant
décider quoi en faire (pré-remplir ses champs). Les composants ignorent
cette prop en prod puisqu'elle vaut toujours `null`.

---

## Ce qu'il ne faut PAS faire

```
✗ Ne pas conditionner du code métier sur debugMode
  → debugMode n'affecte que la navigation après résultat
✗ Ne pas importer quoi que ce soit de src/debug/ depuis src/components/
  → le debug dépend de l'app, jamais l'inverse
✗ Ne pas oublier le guard import.meta.env.DEV sur la route
✗ Ne pas inclure src/debug/ dans le build de prod
  → Vite le fera automatiquement si la route est conditionnée sur DEV
```

## Ce qu'il faut absolument faire

```
✓ DebugFAB visible sur toutes les pages en DEV
✓ ContentTree charge tout le contenu réel (pas de données en dur)
✓ answerGenerator couvre tous les types d'exercices existants
✓ YamlInspector affiche le YAML brut lisible
✓ EngineState affiche score, XP, feedback et réponse soumise
✓ Injecter bonne réponse → valider → voir ✅ dans EngineState
✓ Injecter mauvaise réponse → valider → voir ❌ dans EngineState
✓ Reset remet l'exercice dans son état initial
✓ Quand jalon 3bis-IA sera fait : ajouter FreeText dans answerGenerator
✓ Quand jalon 5 sera fait : afficher les skills impactés dans EngineState
```

---

## Résumé des fichiers créés / modifiés

### Nouveaux fichiers

```
src/debug/DebugDashboard.jsx
src/debug/panels/ExerciseBrowser.jsx
src/debug/panels/ExercisePreview.jsx
src/debug/panels/YamlInspector.jsx
src/debug/panels/EngineState.jsx
src/debug/panels/ContentTree.jsx
src/debug/hooks/useDebugExercise.js
src/debug/utils/answerGenerator.js
src/components/debug/DebugFAB.jsx
```

### Fichiers modifiés (modifications minimales)

```
src/router/AppRouter.jsx              ← ajout route /debug conditionnelle
src/App.jsx                           ← ajout <DebugFAB />
src/components/exercise/ExerciseEngine.jsx  ← ajout props injectedAnswer + debugMode
src/components/exercise/hooks/useExerciseState.js  ← gestion injectedAnswer
```

### Fichiers non touchés

```
Tous les composants d'exercices (MultipleChoice, FillInTheBlank, etc.)
exerciseService.js
scoreService.js
contentService.js
Tous les écrans de navigation
Le parc SVG
```
