# Jalon 1 — Squelette visuel
## Document technique pour Claude dans VS Code

---

## Objectif du jalon

Créer une application React navigable avec tous les écrans de l'app, des données en dur (pas de YAML, pas de backend), des transitions entre pages, et une base de code conçue pour évoluer sans refactoring majeur aux jalons suivants.

**À la fin du jalon 1 :** on peut naviguer dans toute l'app, voir tous les écrans, tester les cinématiques et transitions. Aucune donnée réelle, aucun backend, aucun auth.

---

## Stack technique

```
React 18          → framework UI
Vite              → bundler (rapide, simple sur Windows)
React Router v6   → navigation entre écrans
Tailwind CSS      → styles utilitaires
Framer Motion     → animations et transitions entre pages
Howler.js         → gestion audio (musique, sons)
Lucide React      → icônes
```

### Installation

```bash
npm create vite@latest mon-appli-edu -- --template react
cd mon-appli-edu
npm install
npm install react-router-dom
npm install framer-motion
npm install howler
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configuration Tailwind (tailwind.config.js)

```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### Ajouter dans src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Structure des dossiers

```
src/
  assets/                   ← médias statiques (images, sons, musiques)
    sounds/
    music/
    icons/
    backgrounds/

  components/               ← composants réutilisables UI
    ui/
      Button.jsx
      Card.jsx
      ProgressBar.jsx
      Badge.jsx
    layout/
      PageTransition.jsx    ← wrapper animation entre pages
      AppShell.jsx          ← structure commune (header, etc.)

  screens/                  ← un dossier par écran
    Splash/
      SplashScreen.jsx
    MainMenu/
      MainMenuScreen.jsx
    SubjectSelect/
      SubjectSelectScreen.jsx
    CourseSelect/
      CourseSelectScreen.jsx
    StepSelect/
      StepSelectScreen.jsx
    StepPlayer/
      StepPlayerScreen.jsx

  data/                     ← données en dur pour le jalon 1
    subjects.js             ← liste des matières
    courses.js              ← liste des cours par matière
    steps.js                ← liste des étapes par cours

  hooks/                    ← hooks React custom (à enrichir aux jalons suivants)
    useAudio.js             ← gestion musique/sons
    useProgress.js          ← progression (stub vide pour l'instant)
    useProfile.js           ← profil utilisateur (stub vide pour l'instant)

  context/                  ← état global partagé entre écrans
    AppContext.jsx           ← contexte principal (profil, progression, audio)

  router/
    AppRouter.jsx           ← définition de toutes les routes

  styles/
    theme.js                ← couleurs, typographie, constantes visuelles

  App.jsx
  main.jsx
```

---

## Points d'évolution — ce qu'il ne faut PAS câbler en dur

Ces éléments sont en dur pour le jalon 1, mais ils **seront remplacés** aux jalons suivants. Il faut les isoler proprement dès maintenant.

### 1. Les données → dossier `src/data/`

Pour le jalon 1, les matières, cours et étapes sont des tableaux JS statiques. Aux jalons 2 et 3, ce sera du YAML parsé. Il faut que les écrans ne connaissent **jamais** la source des données, seulement la structure.

```js
// src/data/subjects.js  ← jalon 1 : données en dur
// src/services/contentService.js  ← jalon 2 : remplacera subjects.js

// Structure à respecter dès maintenant dans subjects.js :
export const subjects = [
  {
    id: "mathematiques",
    label: "Mathématiques",
    icon: "calculator",        // nom d'icône Lucide
    color: "#4F46E5",
    description: "Nombres, calcul, géométrie",
    coursesCount: 8,
  },
  {
    id: "francais",
    label: "Français",
    icon: "book-open",
    color: "#059669",
    description: "Lecture, écriture, grammaire",
    coursesCount: 6,
  },
]

// src/data/courses.js
export const courses = {
  mathematiques: [
    {
      id: "math-multiplication-01",
      title: "La multiplication",
      thumbnail: null,          // null pour l'instant, URL image au jalon 2
      description: "Tables et propriétés",
      stepsCount: 5,
      progress: 0,              // 0 à 1, stub pour l'instant
      status: "available",      // available | locked | completed
    },
    {
      id: "math-fractions-01",
      title: "Les fractions",
      thumbnail: null,
      description: "Numérateur, dénominateur, opérations",
      stepsCount: 7,
      progress: 0,
      status: "locked",
    },
  ]
}

// src/data/steps.js
export const steps = {
  "math-multiplication-01": [
    {
      id: "step-001",
      title: "Qu'est-ce que la multiplication ?",
      type: "lesson",
      status: "completed",      // completed | current | locked
      score: null,
    },
    {
      id: "step-002",
      title: "La commutativité",
      type: "lesson",
      status: "current",
      score: null,
    },
    {
      id: "step-003",
      title: "Exercices — Tables de 2 et 3",
      type: "exercise",
      status: "locked",
      score: null,
    },
  ]
}
```

**Règle :** Les composants écran importent depuis `src/services/contentService.js`, pas directement depuis `src/data/`. Créer ce fichier dès le jalon 1 comme proxy :

```js
// src/services/contentService.js
// Jalon 1 : retourne les données statiques
// Jalon 2 : sera remplacé par le parseur YAML
import { subjects } from '../data/subjects'
import { courses } from '../data/courses'
import { steps } from '../data/steps'

export const getSubjects = () => subjects
export const getCourses = (subjectId) => courses[subjectId] ?? []
export const getSteps = (courseId) => steps[courseId] ?? []
```

---

### 2. La progression → hook `useProgress`

Pour le jalon 1, la progression est fictive (données en dur). Au jalon 4, ce sera une vraie sync avec le backend. Isoler dans un hook dès maintenant :

```js
// src/hooks/useProgress.js
// Jalon 1 : stub, retourne des données fictives
// Jalon 4 : connecté à l'API et au localStorage

export const useProgress = () => {
  return {
    getStepStatus: (stepId) => "available",   // stub
    markStepComplete: (stepId, score) => {},   // stub
    getCourseProgress: (courseId) => 0,        // stub
  }
}
```

---

### 3. Le profil utilisateur → hook `useProfile`

Pour le jalon 1, un profil fictif. Au jalon 4, connecté à Firebase Auth.

```js
// src/hooks/useProfile.js
// Jalon 1 : profil fictif
// Jalon 4 : Firebase Auth

export const useProfile = () => {
  return {
    user: { id: "dev-user", pseudo: "Léo", avatar: "avatar-01" },
    isLoggedIn: true,          // toujours true au jalon 1
    login: () => {},            // stub
    logout: () => {},           // stub
  }
}
```

---

### 4. L'audio → hook `useAudio`

L'audio est réel dès le jalon 1. Mais le hook doit déjà avoir la bonne interface pour le jalon 6 (événements qui déclenchent des sons).

```js
// src/hooks/useAudio.js
import { Howl } from 'howler'
import { useRef, useEffect } from 'react'

export const useAudio = () => {
  const musicRef = useRef(null)

  const playMusic = (src, { loop = true, volume = 0.5 } = {}) => {
    if (musicRef.current) musicRef.current.stop()
    musicRef.current = new Howl({ src: [src], loop, volume })
    musicRef.current.play()
  }

  const stopMusic = () => musicRef.current?.stop()

  const playSound = (src) => {
    new Howl({ src: [src], volume: 0.8 }).play()
  }

  return { playMusic, stopMusic, playSound }
}
```

---

### 5. Le contexte global → `AppContext`

Contient tout ce qui est partagé entre les écrans. Prévoir les slots pour les jalons suivants dès maintenant :

```jsx
// src/context/AppContext.jsx
import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  // Jalon 1
  const [currentSubject, setCurrentSubject] = useState(null)
  const [currentCourse, setCurrentCourse] = useState(null)
  const [currentStep, setCurrentStep] = useState(null)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Jalon 4 — sera rempli par Firebase Auth
  const [user, setUser] = useState(null)

  // Jalon 5 — sera rempli par le backend
  const [xp, setXp] = useState(0)
  const [badges, setBadges] = useState([])

  // Jalon 6 — moteur d'événements
  const [pendingEvent, setPendingEvent] = useState(null)

  return (
    <AppContext.Provider value={{
      currentSubject, setCurrentSubject,
      currentCourse, setCurrentCourse,
      currentStep, setCurrentStep,
      musicEnabled, setMusicEnabled,
      soundEnabled, setSoundEnabled,
      user, setUser,
      xp, badges,
      pendingEvent, setPendingEvent,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
```

---

## Le routeur

```jsx
// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SplashScreen from '../screens/Splash/SplashScreen'
import MainMenuScreen from '../screens/MainMenu/MainMenuScreen'
import SubjectSelectScreen from '../screens/SubjectSelect/SubjectSelectScreen'
import CourseSelectScreen from '../screens/CourseSelect/CourseSelectScreen'
import StepSelectScreen from '../screens/StepSelect/StepSelectScreen'
import StepPlayerScreen from '../screens/StepPlayer/StepPlayerScreen'

export const ROUTES = {
  SPLASH: '/',
  MENU: '/menu',
  SUBJECTS: '/subjects',
  COURSES: '/courses/:subjectId',
  STEPS: '/steps/:courseId',
  PLAYER: '/player/:courseId/:stepId',
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.SPLASH}    element={<SplashScreen />} />
        <Route path={ROUTES.MENU}      element={<MainMenuScreen />} />
        <Route path={ROUTES.SUBJECTS}  element={<SubjectSelectScreen />} />
        <Route path={ROUTES.COURSES}   element={<CourseSelectScreen />} />
        <Route path={ROUTES.STEPS}     element={<StepSelectScreen />} />
        <Route path={ROUTES.PLAYER}    element={<StepPlayerScreen />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Les transitions entre pages

Créer un composant wrapper à utiliser dans **chaque écran** :

```jsx
// src/components/layout/PageTransition.jsx
import { motion } from 'framer-motion'

const variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -24 },
}

export default function PageTransition({ children, className = "" }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`min-h-screen ${className}`}
    >
      {children}
    </motion.div>
  )
}
```

Chaque écran l'utilise comme wrapper racine :

```jsx
export default function SubjectSelectScreen() {
  return (
    <PageTransition>
      {/* contenu de l'écran */}
    </PageTransition>
  )
}
```

Pour que les transitions fonctionnent à la sortie, ajouter `AnimatePresence` dans le routeur :

```jsx
import { AnimatePresence } from 'framer-motion'
// Wrapper autour de <Routes> dans AppRouter
```

---

## Le thème visuel

Définir les constantes visuelles une seule fois. Ne jamais câbler les couleurs en dur dans les composants.

```js
// src/styles/theme.js
export const theme = {
  colors: {
    // Palette principale — à choisir selon l'identité de l'appli
    primary:    "#4F46E5",   // indigo
    secondary:  "#F59E0B",   // ambre
    success:    "#10B981",   // vert
    danger:     "#EF4444",   // rouge
    warning:    "#F97316",   // orange

    // Matières — une couleur par matière
    subjects: {
      mathematiques: "#4F46E5",
      francais:       "#059669",
      histoire:       "#B45309",
      sciences:       "#0891B2",
    },

    // Statuts des étapes
    status: {
      completed: "#10B981",
      current:   "#4F46E5",
      locked:    "#9CA3AF",
    }
  },

  // Typographie
  fonts: {
    display: "'Nunito', sans-serif",   // titres, gros textes
    body:    "'Inter', sans-serif",    // corps de texte
    mono:    "'JetBrains Mono', monospace",  // formules, code
  },
}
```

---

## Les écrans — ce qu'ils doivent faire

### SplashScreen
- Affiche logo + nom de l'appli
- Animation d'entrée (fade in)
- Redirige automatiquement vers `/menu` après 2-3 secondes
- Lance la musique du menu

### MainMenuScreen
- Image de fond plein écran
- Musique d'ambiance (Howler)
- Titre de l'appli
- Bouton "Jouer" → navigue vers `/subjects`
- Bouton "Se connecter" → placeholder, désactivé (jalon 4)
- Bouton réglages son (activer/désactiver musique)

### SubjectSelectScreen
- Liste des matières depuis `contentService.getSubjects()`
- Chaque matière : icône + couleur + titre + description
- Tap → navigue vers `/courses/:subjectId`
- Bouton retour → `/menu`

### CourseSelectScreen
- Récupère `subjectId` depuis `useParams()`
- Liste des cours depuis `contentService.getCourses(subjectId)`
- Chaque cours : thumbnail (placeholder si null) + titre + barre de progression
- Statut visuel : disponible / verrouillé / complété
- Tap → navigue vers `/steps/:courseId`
- Bouton retour → `/subjects`

### StepSelectScreen
- Récupère `courseId` depuis `useParams()`
- Liste des étapes depuis `contentService.getSteps(courseId)`
- Chaque étape : numéro + titre + type (leçon/exercice) + statut
- Bouton "Commencer" ou "Reprendre" sur l'étape courante
- Tap → navigue vers `/player/:courseId/:stepId`
- Bouton retour → `/courses/:subjectId`

### StepPlayerScreen (coquille vide au jalon 1)
- Récupère `courseId` et `stepId` depuis `useParams()`
- Affiche le titre de l'étape
- Zone de contenu vide avec placeholder "Contenu du cours ici"
- Bouton "Étape suivante" → étape suivante ou retour à StepSelect
- Bouton retour → `/steps/:courseId`

---

## Ce qu'il ne faut PAS faire au jalon 1

```
✗ Ne pas connecter de vrai backend
✗ Ne pas implémenter Firebase Auth
✗ Ne pas parser de YAML
✗ Ne pas implémenter le calcul de progression réel
✗ Ne pas créer les composants d'exercices
✗ Ne pas implémenter le moteur d'événements
✗ Ne pas câbler les couleurs en dur dans les JSX
  (toujours passer par theme.js ou des classes Tailwind)
✗ Ne pas importer les données directement depuis data/
  (toujours passer par contentService.js)
```

---

## Ce qu'il faut absolument faire au jalon 1

```
✓ Respecter la structure de dossiers dès le début
✓ Créer contentService.js même s'il retourne des données statiques
✓ Créer useProgress.js et useProfile.js même s'ils sont des stubs vides
✓ Créer AppContext.jsx avec tous les slots prévus pour les jalons suivants
✓ Utiliser PageTransition sur tous les écrans
✓ Définir theme.js et ne jamais câbler les couleurs en dur
✓ Définir ROUTES dans AppRouter.jsx et toujours naviguer via ces constantes
✓ Utiliser useNavigate() + ROUTES, jamais de strings en dur dans navigate()
```

---

## Commandes utiles

```bash
# Lancer le projet
npm run dev
# → http://localhost:5173

# Build de production (pour tester)
npm run build
npm run preview
```

---

## Résumé des dépendances à installer

```bash
npm install react-router-dom framer-motion howler lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Polices Google Fonts (à ajouter dans index.html)

```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```
