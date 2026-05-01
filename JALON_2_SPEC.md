# Jalon 2 — Contenu
## Document technique pour Claude dans VS Code

---

## Objectif du jalon

Remplacer toutes les données en dur du jalon 1 par de vrais fichiers YAML.
Écrire un parseur, afficher les leçons avec Markdown enrichi et formules KaTeX,
gérer les blocs typés (notice, image, math...) et les références aux exercices.

**À la fin du jalon 2 :** on peut lire un vrai cours complet du début à la fin,
avec du texte formaté, des formules mathématiques, des blocs d'attention,
des images, et des exercices référencés (affichés en placeholder, implémentés au jalon 3).

**Ce qui ne change pas :** tous les écrans du jalon 1, la navigation, les transitions,
le parc SVG du jalon 1bis. Seule la source des données change.

---

## Nouvelles dépendances à installer

```bash
npm install js-yaml
npm install react-markdown
npm install rehype-katex
npm install remark-math
npm install katex
```

Ajouter dans `index.html` ou importer dans `main.jsx` :
```js
import 'katex/dist/katex.min.css'
```

---

## Ce qui change par rapport au jalon 1

### Avant (jalon 1)
```
src/data/subjects.js     → tableaux JS statiques
src/data/courses.js      → tableaux JS statiques
src/data/steps.js        → tableaux JS statiques
contentService.js        → retourne ces tableaux directement
StepPlayerScreen.jsx     → affiche un placeholder vide
```

### Après (jalon 2)
```
public/content/          → fichiers YAML servis statiquement par Vite
contentService.js        → fetch + parse YAML, même interface qu'avant
StepPlayerScreen.jsx     → affiche le vrai contenu via LessonRenderer
```

**L'interface de `contentService.js` ne change pas.**
Les écrans continuent d'appeler `getSubjects()`, `getCourses()`, `getSteps()`.
Seul l'intérieur du service change.

---

## Organisation des fichiers YAML

Placer dans `public/content/` pour que Vite les serve statiquement :

```
public/
  content/
    index.yaml                        ← liste de toutes les matières
    subjects/
      mathematiques/
        index.yaml                    ← liste des cours de la matière
        courses/
          math-multiplication-01/
            course.yaml               ← structure du cours + étapes
            exercises.yaml            ← exercices du cours
          math-fractions-01/
            course.yaml
            exercises.yaml
      histoire/
        index.yaml
        courses/
          histoire-antiquite-01/
            course.yaml
            exercises.yaml
```

---

## Format des fichiers YAML

### index.yaml (racine)

```yaml
subjects:
  - id: "mathematiques"
    label: "Mathématiques"
    icon: "calculator"
    color: "#4F46E5"
    description: "Nombres, calcul, géométrie"
    path: "subjects/mathematiques/index.yaml"

  - id: "histoire"
    label: "Histoire"
    icon: "book-open"
    color: "#B45309"
    description: "De l'Antiquité à nos jours"
    path: "subjects/histoire/index.yaml"
```

### subjects/mathematiques/index.yaml

```yaml
subject_id: "mathematiques"
courses:
  - id: "math-multiplication-01"
    title: "La multiplication"
    description: "Tables et propriétés fondamentales"
    thumbnail: null
    order: 1
    status: "available"
    path: "subjects/mathematiques/courses/math-multiplication-01/course.yaml"

  - id: "math-fractions-01"
    title: "Les fractions"
    description: "Numérateur, dénominateur, opérations"
    thumbnail: null
    order: 2
    status: "locked"
    path: "subjects/mathematiques/courses/math-fractions-01/course.yaml"
```

### course.yaml — structure complète

```yaml
course:
  id: "math-multiplication-01"
  version: "1.0"
  title: "La multiplication"
  subject: "mathematiques"
  domain: "calcul"
  thumbnail: null
  xp_total: 120

  # Grandes étapes du cours (pour le parc SVG)
  grandes_etapes:

    - id: "ge-tables-base"
      title: "Les tables de base"
      icon: "✖️"
      color: "#2484e0"
      order: 1

      lessons:
        - id: "step-001"
          title: "Qu'est-ce que la multiplication ?"
          type: "lesson"
          order: 1
          content_ref: "step-001"   # référence au bloc content ci-dessous

        - id: "step-002"
          title: "La commutativité"
          type: "lesson"
          order: 2
          content_ref: "step-002"

        - id: "step-003"
          title: "Exercices — Tables de 2 et 3"
          type: "exercise_set"
          order: 3
          content_ref: "step-003"

    - id: "ge-tables-avancees"
      title: "Tables avancées"
      icon: "🧮"
      color: "#9c50c8"
      order: 2

      lessons:
        - id: "step-004"
          title: "Tables de 4 à 6"
          type: "lesson"
          order: 4
          content_ref: "step-004"

        - id: "step-005"
          title: "Exercices de révision"
          type: "exercise_set"
          order: 5
          content_ref: "step-005"

  # Contenu détaillé de chaque étape
  steps_content:

    - id: "step-001"
      content:

        - type: md
          text: |
            La multiplication est une manière rapide d'effectuer une **addition répétée** du même nombre.

        - type: notice
          style: example
          text: |
            Si tu as 3 paquets de 4 bonbons, au lieu de faire $4+4+4$, on écrit :
            $$4 \times 3 = 12$$

        - type: md
          text: |
            ### Propriété importante : La commutativité
            Peu importe l'ordre des nombres, le résultat est le même.

        - type: math
          display: block
          tex: "a \\times b = b \\times a"
          caption: "La propriété de commutativité"

        - type: notice
          style: warning
          text: "Attention, la commutativité **ne fonctionne pas** pour la soustraction !"

        - type: exercise
          ref: "exo-mul-001"

    - id: "step-002"
      content:

        - type: md
          text: |
            ### Les tables de multiplication
            Connaître les tables par cœur te fait **gagner beaucoup de temps**.

        - type: image
          src: null
          caption: "La table de multiplication de 1 à 10"
          alt: "Table de multiplication"

        - type: notice
          style: tip
          text: |
            **Astuce mémo :** Pour la table de 9, le chiffre des dizaines est toujours $n-1$
            et les deux chiffres font toujours 9.
            Exemple : $9 \times 7 = 63$ → $6+3=9$ ✓

        - type: notice
          style: definition
          title: "Facteur"
          text: "Les nombres qu'on multiplie entre eux s'appellent des **facteurs**.
                 Dans $4 \times 3$, les facteurs sont 4 et 3."

        - type: exercise
          ref: "exo-mul-002"

    - id: "step-003"
      content:
        - type: md
          text: "Entraîne-toi avec ces exercices sur les tables de 2 et 3."
        - type: exercise
          ref: "exo-mul-003"
        - type: exercise
          ref: "exo-mul-004"
```

### exercises.yaml

```yaml
exercises:

  - id: "exo-mul-001"
    xp: 15
    skills:
      - tag: "multiplication/sens"
        weight: 1.0
    difficulty: 1
    exercise:
      type: multiple_choice
      question: |
        Que représente $3 \times 4$ ?
      choices:
        - id: a
          text: "Trois fois quatre"
          correct: true
          feedback: "Oui ! $3 \\times 4$ c'est 4 répété 3 fois."
        - id: b
          text: "Quatre moins trois"
          correct: false
          feedback: "Non, ça c'est une soustraction."
        - id: c
          text: "Trois plus quatre"
          correct: false
          feedback: "Non, $3+4=7$, alors que $3 \\times 4 = 12$."
      settings:
        shuffle: true

  - id: "exo-mul-002"
    xp: 20
    skills:
      - tag: "multiplication/calcul"
        weight: 1.0
    difficulty: 1
    exercise:
      type: fill_in_the_blank
      instruction: "Complète les égalités."
      segments:
        - text: "$6 \\times 3 =$"
        - blank:
            id: b1
            answer: "18"
        - text: "et $3 \\times 6 =$"
        - blank:
            id: b2
            answer: "18"
      hint: "Utilise la commutativité !"
```

---

## Le service de contenu — contentService.js

Réécriture complète de l'intérieur, **interface publique identique** :

```js
// src/services/contentService.js

import yaml from 'js-yaml'

const BASE = '/content'
const cache = {}   // cache mémoire simple pour éviter les fetch répétés

async function fetchYaml(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(`${BASE}/${path}`)
  if (!res.ok) throw new Error(`YAML non trouvé : ${path}`)
  const text = await res.text()
  const data = yaml.load(text)
  cache[path] = data
  return data
}

// ─── Interface publique — identique au jalon 1 ───────────────────────────────

export async function getSubjects() {
  const data = await fetchYaml('index.yaml')
  return data.subjects
}

export async function getCourses(subjectId) {
  const subjects = await getSubjects()
  const subject = subjects.find(s => s.id === subjectId)
  if (!subject) return []
  const data = await fetchYaml(subject.path)
  return data.courses
}

export async function getCourse(courseId, subjectId) {
  const courses = await getCourses(subjectId)
  const course = courses.find(c => c.id === courseId)
  if (!course) return null
  return fetchYaml(course.path)
}

export async function getGrandesEtapes(courseId, subjectId) {
  const data = await getCourse(courseId, subjectId)
  return data?.course?.grandes_etapes ?? []
}

export async function getStepContent(courseId, subjectId, stepId) {
  const data = await getCourse(courseId, subjectId)
  const stepsContent = data?.course?.steps_content ?? []
  return stepsContent.find(s => s.id === stepId) ?? null
}

export async function getExercises(courseId, subjectId) {
  const courses = await getCourses(subjectId)
  const course = courses.find(c => c.id === courseId)
  if (!course) return []
  const exercisePath = course.path.replace('course.yaml', 'exercises.yaml')
  const data = await fetchYaml(exercisePath)
  return data?.exercises ?? []
}

export async function getExercise(courseId, subjectId, exoId) {
  const exercises = await getExercises(courseId, subjectId)
  return exercises.find(e => e.id === exoId) ?? null
}
```

**Important :** les écrans qui appelaient les fonctions de manière synchrone
doivent maintenant gérer des Promises. Utiliser `useEffect` + `useState` :

```jsx
// Pattern standard pour tous les écrans qui chargent du contenu
const [subjects, setSubjects] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  getSubjects()
    .then(setSubjects)
    .catch(setError)
    .finally(() => setLoading(false))
}, [])
```

---

## Le moteur de rendu de leçon — LessonRenderer

C'est le composant central du jalon 2.
Il reçoit un tableau de blocs YAML et affiche chacun selon son type.

```
src/
  components/
    lesson/
      LessonRenderer.jsx        ← dispatcher principal
      blocks/
        MdBlock.jsx             ← markdown + katex inline
        MathBlock.jsx           ← formule KaTeX centrée
        ImageBlock.jsx          ← image avec caption
        NoticeBlock.jsx         ← info / warning / tip / example / definition / quote
        ExerciseBlock.jsx       ← placeholder exercice (implémenté jalon 3)
```

### LessonRenderer.jsx

```jsx
import MdBlock       from './blocks/MdBlock'
import MathBlock     from './blocks/MathBlock'
import ImageBlock    from './blocks/ImageBlock'
import NoticeBlock   from './blocks/NoticeBlock'
import ExerciseBlock from './blocks/ExerciseBlock'

export default function LessonRenderer({ blocks = [] }) {
  return (
    <div className="lesson-content">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'md':       return <MdBlock       key={i} {...block} />
          case 'math':     return <MathBlock     key={i} {...block} />
          case 'image':    return <ImageBlock    key={i} {...block} />
          case 'notice':   return <NoticeBlock   key={i} {...block} />
          case 'exercise': return <ExerciseBlock key={i} {...block} />
          default:
            console.warn(`Type de bloc inconnu : ${block.type}`)
            return null
        }
      })}
    </div>
  )
}
```

**Règle d'extension :** pour ajouter un nouveau type de bloc plus tard,
on ajoute un `case` ici et un fichier dans `blocks/`. Rien d'autre ne change.

---

### MdBlock.jsx — Markdown + KaTeX inline

```jsx
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export default function MdBlock({ text }) {
  return (
    <div className="md-block">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
```

### MathBlock.jsx — Formule KaTeX bloc centré

```jsx
import { BlockMath, InlineMath } from 'react-katex'
// ou via ReactMarkdown avec display: block

export default function MathBlock({ tex, display = 'block', caption }) {
  return (
    <div className="math-block">
      <BlockMath math={tex} />
      {caption && (
        <p className="math-caption">{caption}</p>
      )}
    </div>
  )
}
```

Alternative sans `react-katex` (utiliser ReactMarkdown avec les délimiteurs `$$`) :

```jsx
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export default function MathBlock({ tex, caption }) {
  return (
    <div className="math-block">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {`$$${tex}$$`}
      </ReactMarkdown>
      {caption && <p className="math-caption">{caption}</p>}
    </div>
  )
}
```

### ImageBlock.jsx

```jsx
export default function ImageBlock({ src, caption, alt }) {
  return (
    <figure className="image-block">
      {src
        ? <img src={src} alt={alt ?? caption ?? ''} />
        : <div className="image-placeholder">{alt ?? 'Image'}</div>
      }
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
```

### NoticeBlock.jsx — tous les styles

```jsx
const STYLES = {
  info:       { bg: '#e8f4fd', border: '#3498db', icon: 'ℹ️',  label: 'Info' },
  warning:    { bg: '#fef3cd', border: '#f39c12', icon: '⚠️',  label: 'Attention' },
  danger:     { bg: '#fde8e8', border: '#e74c3c', icon: '🚫',  label: 'Erreur fréquente' },
  tip:        { bg: '#e8f8f0', border: '#27ae60', icon: '💡',  label: 'Astuce' },
  example:    { bg: '#f3e8fd', border: '#9b59b6', icon: '📝',  label: 'Exemple' },
  definition: { bg: '#f8f8f8', border: '#7f8c8d', icon: '📖',  label: null },
  quote:      { bg: 'transparent', border: '#bdc3c7', icon: null, label: null },
}

export default function NoticeBlock({ style = 'info', text, title, author }) {
  const s = STYLES[style] ?? STYLES.info

  return (
    <div className={`notice-block notice-${style}`}
         style={{ background: s.bg, borderLeft: `4px solid ${s.border}` }}>
      {s.icon && <span className="notice-icon">{s.icon}</span>}
      {(s.label || title) && (
        <strong className="notice-label">{title ?? s.label}</strong>
      )}
      <MdBlock text={text} />
      {author && <cite className="notice-author">— {author}</cite>}
    </div>
  )
}
```

### ExerciseBlock.jsx — placeholder jalon 2

```jsx
export default function ExerciseBlock({ ref: exoRef }) {
  // Jalon 2 : placeholder visuel
  // Jalon 3 : remplacé par le vrai moteur d'exercices
  return (
    <div className="exercise-placeholder">
      <span className="exercise-placeholder-icon">✏️</span>
      <span>Exercice : <code>{exoRef}</code></span>
      <span className="exercise-placeholder-badge">À venir</span>
    </div>
  )
}
```

---

## Mise à jour de StepPlayerScreen

```jsx
// src/screens/StepPlayer/StepPlayerScreen.jsx

import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getStepContent } from '../../services/contentService'
import LessonRenderer from '../../components/lesson/LessonRenderer'
import PageTransition from '../../components/layout/PageTransition'

export default function StepPlayerScreen() {
  const { courseId, stepId, subjectId } = useParams()
  const [step, setStep] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStepContent(courseId, subjectId, stepId)
      .then(setStep)
      .finally(() => setLoading(false))
  }, [courseId, stepId, subjectId])

  if (loading) return <LoadingView />
  if (!step)   return <ErrorView message="Étape introuvable" />

  return (
    <PageTransition>
      <div className="step-player">
        <LessonRenderer blocks={step.content} />
        <StepNavBar courseId={courseId} stepId={stepId} />
      </div>
    </PageTransition>
  )
}
```

---

## Mise à jour de AppRouter — subjectId dans les routes

Le `subjectId` est nécessaire pour charger le bon fichier YAML.
Mettre à jour les routes pour l'inclure :

```js
// src/router/AppRouter.jsx — routes mises à jour
export const ROUTES = {
  SPLASH:    '/',
  MENU:      '/menu',
  SUBJECTS:  '/subjects',
  COURSES:   '/courses/:subjectId',
  STEPS:     '/steps/:subjectId/:courseId',
  PLAYER:    '/player/:subjectId/:courseId/:stepId',
}
```

---

## Styles CSS pour le contenu de leçon

Ajouter dans `src/styles/lesson.css` (importer dans `main.jsx`) :

```css
.lesson-content {
  max-width: 680px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  line-height: 1.7;
  font-size: 1rem;
}

/* Markdown */
.md-block h3 { font-size: 1.2rem; font-weight: 700; margin: 1.5rem 0 0.5rem; }
.md-block p  { margin: 0.75rem 0; }
.md-block strong { font-weight: 700; }

/* KaTeX */
.math-block        { text-align: center; margin: 1.5rem 0; }
.math-caption      { text-align: center; font-size: 0.85rem; color: #666; margin-top: 0.5rem; }

/* Image */
.image-block       { margin: 1.5rem 0; text-align: center; }
.image-block img   { max-width: 100%; border-radius: 8px; }
.image-placeholder { background: #f0f0f0; border-radius: 8px; padding: 2rem;
                     color: #aaa; font-style: italic; }
figcaption         { font-size: 0.85rem; color: #666; margin-top: 0.5rem; }

/* Notice */
.notice-block      { padding: 1rem 1rem 1rem 1.25rem; margin: 1.25rem 0;
                     border-radius: 0 8px 8px 0; }
.notice-icon       { font-size: 1.1rem; margin-right: 0.5rem; }
.notice-label      { display: block; margin-bottom: 0.4rem; font-size: 0.9rem; }
.notice-quote      { border-left: 4px solid #bdc3c7; padding-left: 1rem; font-style: italic; }
.notice-author     { display: block; margin-top: 0.5rem; font-size: 0.85rem; color: #888; }

/* Exercice placeholder */
.exercise-placeholder {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1rem 1.25rem; margin: 1.25rem 0;
  background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px;
  color: #6c757d;
}
.exercise-placeholder-badge {
  margin-left: auto; font-size: 0.75rem; background: #e9ecef;
  padding: 0.2rem 0.6rem; border-radius: 12px;
}
```

---

## Validation des fichiers YAML

Créer un script de validation à lancer depuis le terminal avant de committer :

```js
// scripts/validate-content.mjs
import { readFileSync, readdirSync } from 'fs'
import { load } from 'js-yaml'
import { join } from 'path'

const CONTENT_DIR = './public/content'
let errors = 0

function validateCourse(path) {
  const raw = readFileSync(path, 'utf8')
  const data = load(raw)
  const course = data?.course

  if (!course?.id)     { console.error(`❌ ${path} : id manquant`) ; errors++ }
  if (!course?.title)  { console.error(`❌ ${path} : title manquant`) ; errors++ }
  if (!course?.grandes_etapes?.length) {
    console.error(`❌ ${path} : grandes_etapes vide`) ; errors++
  }

  // Vérifier que tous les content_ref existent dans steps_content
  const stepIds = (course?.steps_content ?? []).map(s => s.id)
  course?.grandes_etapes?.forEach(ge => {
    ge.lessons?.forEach(lesson => {
      if (!stepIds.includes(lesson.content_ref)) {
        console.error(`❌ ${path} : content_ref "${lesson.content_ref}" introuvable`)
        errors++
      }
    })
  })

  console.log(`✓ ${path}`)
}

// Lancer sur tous les course.yaml
// ... (parcourir récursivement CONTENT_DIR)

if (errors > 0) {
  console.error(`\n${errors} erreur(s) trouvée(s)`)
  process.exit(1)
} else {
  console.log('\n✅ Tout est valide')
}
```

```bash
node scripts/validate-content.mjs
```

---

## Ce qu'il ne faut PAS faire au jalon 2

```
✗ Ne pas modifier l'interface publique de contentService.js
  (getSubjects, getCourses, getSteps — mêmes signatures)
✗ Ne pas implémenter les exercices (juste le placeholder ExerciseBlock)
✗ Ne pas connecter de backend (tout est dans /public/content/)
✗ Ne pas stocker la progression (jalon 4)
✗ Ne pas modifier les écrans du jalon 1 sauf StepPlayerScreen et les
  appels async là où c'était synchrone
✗ Ne pas utiliser de bibliothèque de parsing YAML autre que js-yaml
```

## Ce qu'il faut absolument faire

```
✓ Écrire au moins 1 cours complet avec 2 grandes étapes et 4+ leçons
✓ Couvrir tous les types de blocs dans ce cours de test
  (md, math, image, notice×6 styles, exercise ref)
✓ LessonRenderer extensible par simple ajout de case + fichier
✓ ExerciseBlock en placeholder propre avec l'id de l'exercice visible
✓ Script de validation YAML fonctionnel
✓ Styles CSS de leçon lisibles sur mobile (max-width + padding)
✓ Gestion du loading et de l'erreur dans StepPlayerScreen
✓ KaTeX qui s'affiche correctement (vérifier l'import CSS)
```

---

## Résumé des fichiers créés / modifiés

### Nouveaux fichiers

```
public/content/index.yaml
public/content/subjects/mathematiques/index.yaml
public/content/subjects/mathematiques/courses/math-multiplication-01/course.yaml
public/content/subjects/mathematiques/courses/math-multiplication-01/exercises.yaml
src/components/lesson/LessonRenderer.jsx
src/components/lesson/blocks/MdBlock.jsx
src/components/lesson/blocks/MathBlock.jsx
src/components/lesson/blocks/ImageBlock.jsx
src/components/lesson/blocks/NoticeBlock.jsx
src/components/lesson/blocks/ExerciseBlock.jsx
src/styles/lesson.css
scripts/validate-content.mjs
```

### Fichiers modifiés

```
src/services/contentService.js    ← réécriture interne, même interface
src/screens/StepPlayer/StepPlayerScreen.jsx  ← affichage réel
src/router/AppRouter.jsx          ← ajout subjectId dans les routes
src/main.jsx                      ← import katex/dist/katex.min.css
```

### Fichiers non touchés

```
Tous les autres écrans (Splash, Menu, SubjectSelect, CourseSelect, StepSelect/Parc)
AppContext.jsx
useProgress.js
useProfile.js
useAudio.js
theme.js
Tous les composants UI (Button, Card, PageTransition...)
```
