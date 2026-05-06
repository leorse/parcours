# Jalon 4 — Fake Users, progression locale
## Document technique pour Claude dans VS Code

---

## Objectif

Remplacer les stubs vides de `useProfile` et `useProgress` par une
implémentation fonctionnelle avec de faux utilisateurs et une vraie
progression sauvegardée en `localStorage`.

Permettre de tester toute l'expérience utilisateur — progression,
gamification (jalon 5), événements (jalon 6) — sans Firebase,
sans backend, sans Android.

**À la fin du jalon 4 :**
- Un écran de sélection de profil au démarrage (élève ou admin)
- La progression est sauvegardée localement et persiste entre sessions
- Le parc SVG reflète la vraie progression de l'utilisateur
- Le mode admin déverrouille tout le contenu
- `useProfile` et `useProgress` ont leur interface définitive
  (jalon 7 ne changera que l'implémentation interne, pas l'interface)

**Ce qui ne change pas :** tous les exercices, le parc SVG,
le moteur d'événements (stub), le contenu YAML.

---

## Les deux profils fictifs

```js
// src/data/fakeUsers.js

export const FAKE_USERS = {
  student: {
    uid:         'fake-student-01',
    pseudo:      'Léo',
    role:        'student',
    avatar:      'avatar-01',
    email:       'leo@fake.local',
    // Progression initiale — aucune étape complétée
    // tout est verrouillé sauf le premier cours
  },
  admin: {
    uid:         'fake-admin',
    pseudo:      'Admin',
    role:        'admin',
    avatar:      'avatar-dev',
    email:       'admin@fake.local',
    // Tout déverrouillé, toutes les étapes accessibles
  },
}
```

---

## Écran de sélection de profil

Remplace le bouton "Se connecter" du MainMenu.
S'affiche au premier lancement ou après déconnexion.

```
┌─────────────────────────────────────┐
│                                     │
│         [Logo Parc-Cours]           │
│                                     │
│      Qui utilise l'application ?    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  👦  Léo                    │    │
│  │      Élève — progression    │    │
│  │      normale                │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🔧  Admin / Dev            │    │
│  │      Tous les cours         │    │
│  │      déverrouillés          │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Réinitialiser la progression]     │
│  (lien discret en bas)              │
│                                     │
└─────────────────────────────────────┘
```

Pas de mot de passe, pas de formulaire.
Un tap sur un profil → connexion immédiate → redirect vers SubjectSelect.

---

## Architecture

### Nouveaux fichiers

```
src/
  data/
    fakeUsers.js              ← définition des deux profils
  screens/
    ProfileSelect/
      ProfileSelectScreen.jsx ← écran de sélection
  services/
    progressService.js        ← NOUVEAU — gestion progression localStorage
    profileService.js         ← NOUVEAU — gestion profil localStorage
```

### Fichiers modifiés

```
src/hooks/useProfile.js       ← implémentation réelle (plus un stub)
src/hooks/useProgress.js      ← implémentation réelle (plus un stub)
src/services/scoreService.js  ← saveResult branché sur progressService
src/context/AppContext.jsx    ← user initialisé depuis localStorage
src/router/AppRouter.jsx      ← nouvelle route /profile-select
```

---

## profileService.js — gestion du profil courant

```js
// src/services/profileService.js
// Jalon 4  : stocke le profil fake dans localStorage
// Jalon 7  : remplacé par Firebase Auth
//            L'interface publique NE CHANGE PAS au jalon 7

import { FAKE_USERS } from '../data/fakeUsers'

const STORAGE_KEY = 'parcours_current_user'

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCurrentUser(userKey) {
  // userKey = 'student' | 'admin'
  const user = FAKE_USERS[userKey]
  if (!user) throw new Error(`Profil inconnu : ${userKey}`)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEY)
}

export function isAdmin(user) {
  return user?.role === 'admin'
}

// Jalon 7 : cette fonction appellera Firebase Auth
// L'interface reste identique
export async function getFirebaseToken() {
  // Jalon 4 : retourne un token fictif
  // Jalon 7 : return await firebaseUser.getIdToken()
  return 'fake-token-' + getCurrentUser()?.uid
}
```

---

## progressService.js — gestion de la progression

```js
// src/services/progressService.js
// Jalon 4  : stocke la progression dans localStorage
// Jalon 7  : ajoute la sync backend, garde localStorage comme cache

const STORAGE_KEY = 'parcours_progress'

// ── Lecture ───────────────────────────────────────────────────────────────────

function loadProgress(userId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveProgress(userId, progress) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(progress))
  } catch (e) {
    console.error('Erreur sauvegarde progression', e)
  }
}

// ── Interface publique ────────────────────────────────────────────────────────
// Ces fonctions sont l'interface définitive — jalon 7 ne change que
// l'implémentation interne (ajout sync backend), pas les signatures

export function getStepStatus(userId, stepId) {
  if (!userId) return 'locked'
  const progress = loadProgress(userId)
  return progress[stepId]?.status ?? 'locked'
}

export function getStepScore(userId, stepId) {
  const progress = loadProgress(userId)
  return progress[stepId]?.score ?? null
}

export function getCourseProgress(userId, courseId, steps) {
  // Retourne 0.0 à 1.0
  if (!steps?.length) return 0
  const progress = loadProgress(userId)
  const completed = steps.filter(s =>
    progress[s.id]?.status === 'completed'
  ).length
  return completed / steps.length
}

export function markStepComplete(userId, stepId, score) {
  const progress = loadProgress(userId)
  progress[stepId] = {
    status:       'completed',
    score:        score,
    completedAt:  new Date().toISOString(),
  }
  saveProgress(userId, progress)

  // Jalon 7 : ici on appellera aussi le backend
  // await syncProgressToBackend(userId, stepId, score)
}

export function markStepInProgress(userId, stepId) {
  const progress = loadProgress(userId)
  if (progress[stepId]?.status === 'completed') return  // ne pas rétrograder
  progress[stepId] = {
    ...progress[stepId],
    status: 'in_progress',
  }
  saveProgress(userId, progress)
}

export function saveExerciseResult(userId, exerciseId, result) {
  // result = { score, xpEarned, correct, feedback }
  const progress = loadProgress(userId)
  if (!progress.__exercises) progress.__exercises = {}
  progress.__exercises[exerciseId] = {
    ...result,
    submittedAt: new Date().toISOString(),
  }
  saveProgress(userId, progress)

  // Jalon 7 : sync backend
}

export function resetProgress(userId) {
  localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
}

export function getAllProgress(userId) {
  return loadProgress(userId)
}
```

---

## useProfile.js — implémentation réelle

```js
// src/hooks/useProfile.js
// Jalon 4  : profil fake depuis localStorage
// Jalon 7  : Firebase Auth
// L'interface NE CHANGE PAS

import { useState, useEffect, useCallback } from 'react'
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  isAdmin,
} from '../services/profileService'

export function useProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Charger l'utilisateur au montage
  useEffect(() => {
    const stored = getCurrentUser()
    setUser(stored)
    setLoading(false)
  }, [])

  const login = useCallback((userKey) => {
    // userKey = 'student' | 'admin'
    // Jalon 7 : userKey sera remplacé par le flow Firebase
    const u = setCurrentUser(userKey)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    clearCurrentUser()
    setUser(null)
    // Jalon 7 : await firebaseAuth.signOut()
  }, [])

  return {
    user,
    loading,
    isLoggedIn:  !!user,
    isAdmin:     isAdmin(user),
    login,
    logout,
    // Champs pratiques directement accessibles
    uid:    user?.uid   ?? null,
    pseudo: user?.pseudo ?? null,
    avatar: user?.avatar ?? null,
    role:   user?.role   ?? 'student',
  }
}
```

---

## useProgress.js — implémentation réelle

```js
// src/hooks/useProgress.js
// Jalon 4  : localStorage
// Jalon 7  : localStorage + sync backend
// L'interface NE CHANGE PAS

import { useCallback } from 'react'
import { useProfile } from './useProfile'
import * as progressService from '../services/progressService'

export function useProgress() {
  const { uid, isAdmin } = useProfile()

  const getStepStatus = useCallback((stepId) => {
    // Admin → tout est accessible
    if (isAdmin) return 'available'
    return progressService.getStepStatus(uid, stepId)
  }, [uid, isAdmin])

  const getStepScore = useCallback((stepId) => {
    return progressService.getStepScore(uid, stepId)
  }, [uid])

  const getCourseProgress = useCallback((courseId, steps) => {
    if (isAdmin) return 1.0  // admin → 100% partout
    return progressService.getCourseProgress(uid, courseId, steps)
  }, [uid, isAdmin])

  const markStepComplete = useCallback((stepId, score) => {
    if (!uid) return
    progressService.markStepComplete(uid, stepId, score)
  }, [uid])

  const markStepInProgress = useCallback((stepId) => {
    if (!uid || isAdmin) return
    progressService.markStepInProgress(uid, stepId)
  }, [uid, isAdmin])

  const saveExerciseResult = useCallback((exerciseId, result) => {
    if (!uid) return
    progressService.saveExerciseResult(uid, exerciseId, result)
  }, [uid])

  const resetProgress = useCallback(() => {
    if (!uid) return
    progressService.resetProgress(uid)
  }, [uid])

  return {
    getStepStatus,
    getStepScore,
    getCourseProgress,
    markStepComplete,
    markStepInProgress,
    saveExerciseResult,
    resetProgress,
  }
}
```

---

## scoreService.js — saveResult branché

```js
// src/services/scoreService.js
// Mise à jour de saveResult — plus un stub

import { saveExerciseResult } from './progressService'
import { getCurrentUser } from './profileService'

export function calcScore(validationResult, exerciseData) {
  const xpEarned = Math.round((exerciseData.xp ?? 0) * validationResult.score)
  return {
    score:   validationResult.score,
    xpEarned,
    correct: validationResult.correct,
    // Jalon 5 : skills impactés seront calculés ici
  }
}

export async function saveResult(exerciseId, result, userId) {
  const uid = userId ?? getCurrentUser()?.uid
  if (!uid) return

  // Sauvegarde locale (localStorage)
  saveExerciseResult(uid, exerciseId, result)

  // Jalon 7 : sync backend ici
  // await fetch(`${BACKEND_URL}/api/progress/exercise`, { ... })

  console.log(`[scoreService] Sauvegardé | exo:${exerciseId} | score:${result.score}`)
}
```

---

## Mise à jour de AppContext.jsx

```jsx
// src/context/AppContext.jsx — ajouter l'initialisation du user

import { getCurrentUser } from '../services/profileService'

export const AppProvider = ({ children }) => {
  // Initialiser depuis localStorage au montage
  const [user, setUser] = useState(() => getCurrentUser())

  // ... reste identique
}
```

---

## ProfileSelectScreen.jsx

```jsx
// src/screens/ProfileSelect/ProfileSelectScreen.jsx

import { useNavigate } from 'react-router-dom'
import { useProfile }  from '../../hooks/useProfile'
import { ROUTES }      from '../../router/AppRouter'
import { FAKE_USERS }  from '../../data/fakeUsers'
import PageTransition  from '../../components/layout/PageTransition'

export default function ProfileSelectScreen() {
  const navigate = useNavigate()
  const { login } = useProfile()

  const handleSelect = (userKey) => {
    login(userKey)
    navigate(ROUTES.SUBJECTS)
  }

  return (
    <PageTransition>
      <div className="profile-select">

        <div className="profile-select-header">
          <img src="/assets/logo.webp" alt="Parc-Cours" className="logo" />
          <h2>Qui utilise l'application ?</h2>
        </div>

        <div className="profile-cards">

          <button
            className="profile-card profile-card-student"
            onClick={() => handleSelect('student')}
          >
            <img
              src={`/assets/avatars/${FAKE_USERS.student.avatar}.webp`}
              alt="Avatar élève"
              className="profile-avatar"
            />
            <div className="profile-info">
              <span className="profile-name">{FAKE_USERS.student.pseudo}</span>
              <span className="profile-desc">Élève — progression normale</span>
            </div>
          </button>

          <button
            className="profile-card profile-card-admin"
            onClick={() => handleSelect('admin')}
          >
            <span className="profile-icon">🔧</span>
            <div className="profile-info">
              <span className="profile-name">{FAKE_USERS.admin.pseudo}</span>
              <span className="profile-desc">Tous les cours déverrouillés</span>
            </div>
          </button>

        </div>

        {/* Lien discret pour réinitialiser la progression */}
        <button
          className="reset-link"
          onClick={() => {
            const { resetProgress } = useProgress()
            resetProgress()
            window.location.reload()
          }}
        >
          Réinitialiser la progression
        </button>

      </div>
    </PageTransition>
  )
}
```

---

## Mise à jour du routeur

```jsx
// src/router/AppRouter.jsx

export const ROUTES = {
  SPLASH:          '/',
  PROFILE_SELECT:  '/profile-select',    // ← nouveau
  MENU:            '/menu',
  SUBJECTS:        '/subjects',
  COURSES:         '/courses/:subjectId',
  STEPS:           '/steps/:subjectId/:courseId',
  PLAYER:          '/player/:subjectId/:courseId/:stepId',
  DEBUG:           '/debug',
}

// Garde de route — redirige vers /profile-select si non connecté
function RequireAuth({ children }) {
  const { isLoggedIn, loading } = useProfile()
  if (loading) return null
  if (!isLoggedIn) return <Navigate to={ROUTES.PROFILE_SELECT} />
  return children
}

// Dans <Routes> :
<Route path={ROUTES.PROFILE_SELECT} element={<ProfileSelectScreen />} />
<Route path={ROUTES.MENU} element={
  <RequireAuth><MainMenuScreen /></RequireAuth>
} />
// ... toutes les autres routes wrappées dans RequireAuth
```

---

## Déconnexion — bouton dans MainMenu ou profil

```jsx
// Ajouter dans MainMenuScreen ou un futur écran de profil

const { logout, pseudo, avatar } = useProfile()
const navigate = useNavigate()

const handleLogout = () => {
  logout()
  navigate(ROUTES.PROFILE_SELECT)
}

// Dans le JSX :
<button onClick={handleLogout} className="btn-logout">
  Changer de profil
</button>
```

---

## Comportement du mode Admin

Le mode admin est géré dans `useProgress` via `isAdmin`.
Aucun écran ne vérifie `isAdmin` directement — tout passe par le hook.

```
Admin dans useProgress :
  getStepStatus()     → retourne toujours 'available'
  getCourseProgress() → retourne toujours 1.0

Admin dans useProfile :
  isAdmin = true      → le parc SVG peut afficher un badge 🔧
                      → le dashboard debug affiche des infos supplémentaires
```

---

## Comportement de la progression élève

```
Premier lancement (élève) :
  → Toutes les étapes locked sauf la première grande étape du premier cours
  → La première leçon est 'in_progress'

Après avoir complété une leçon :
  → markStepComplete(stepId, score)
  → La leçon suivante passe à 'in_progress'
  → Si c'était la dernière leçon d'une grande étape
    → La grande étape suivante se déverrouille

Logique de déverrouillage :
  → Gérée dans useProgress.markStepComplete
  → Lit la structure du cours depuis contentService
  → Détermine quelle est l'étape suivante
  → La marque 'in_progress'
```

```js
// Dans progressService.markStepComplete — logique de déverrouillage
// (simplifiée ici, la vraie logique lit les grandes étapes du cours)

export async function markStepComplete(userId, stepId, score, courseStructure) {
  const progress = loadProgress(userId)

  // Marquer l'étape comme complétée
  progress[stepId] = { status: 'completed', score, completedAt: new Date().toISOString() }

  // Trouver l'étape suivante dans la structure du cours
  const nextStep = findNextStep(stepId, courseStructure)
  if (nextStep && !progress[nextStep.id]) {
    progress[nextStep.id] = { status: 'in_progress' }
  }

  saveProgress(userId, progress)
}

function findNextStep(currentStepId, courseStructure) {
  // courseStructure = { grandes_etapes: [{ lessons: [{ id }] }] }
  const allSteps = courseStructure?.grandes_etapes
    ?.flatMap(ge => [{ id: ge.id, type: 'grande_etape' }, ...ge.lessons]) ?? []

  const currentIndex = allSteps.findIndex(s => s.id === currentStepId)
  return currentIndex >= 0 && currentIndex < allSteps.length - 1
    ? allSteps[currentIndex + 1]
    : null
}
```

---

## Mise à jour des tests — progressService

```js
// src/__tests__/progressService.test.js — NOUVEAU fichier

import { describe, test, expect, beforeEach } from 'vitest'
import {
  getStepStatus, markStepComplete, getCourseProgress, resetProgress
} from '../services/progressService'

// Mock localStorage pour les tests
const localStorageMock = (() => {
  let store = {}
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = v },
    removeItem: (k) => { delete store[k] },
    clear:      () => { store = {} },
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

const USER_ID  = 'test-user-01'
const STEP_ID  = 'step-001'
const STEPS    = [
  { id: 'step-001' }, { id: 'step-002' }, { id: 'step-003' }
]

beforeEach(() => {
  localStorageMock.clear()
})

describe('progressService', () => {

  test('étape inconnue → status=locked', () => {
    expect(getStepStatus(USER_ID, STEP_ID)).toBe('locked')
  })

  test('après markStepComplete → status=completed', () => {
    markStepComplete(USER_ID, STEP_ID, 0.8)
    expect(getStepStatus(USER_ID, STEP_ID)).toBe('completed')
  })

  test('score sauvegardé après completion', () => {
    markStepComplete(USER_ID, STEP_ID, 0.75)
    const { getStepScore } = await import('../services/progressService')
    expect(getStepScore(USER_ID, STEP_ID)).toBe(0.75)
  })

  test('getCourseProgress = 0 si aucune étape complétée', () => {
    expect(getCourseProgress(USER_ID, 'course-01', STEPS)).toBe(0)
  })

  test('getCourseProgress = 1/3 si une étape sur trois', () => {
    markStepComplete(USER_ID, 'step-001', 1.0)
    expect(getCourseProgress(USER_ID, 'course-01', STEPS)).toBeCloseTo(1/3)
  })

  test('getCourseProgress = 1.0 si toutes complétées', () => {
    STEPS.forEach(s => markStepComplete(USER_ID, s.id, 1.0))
    expect(getCourseProgress(USER_ID, 'course-01', STEPS)).toBe(1.0)
  })

  test('resetProgress efface tout', () => {
    markStepComplete(USER_ID, STEP_ID, 1.0)
    resetProgress(USER_ID)
    expect(getStepStatus(USER_ID, STEP_ID)).toBe('locked')
  })
})
```

Ajouter ce fichier à la liste des tests — `npm run build` inclut automatiquement
tous les fichiers `*.test.js` dans `src/__tests__/`.

---

## Ce qu'il ne faut PAS faire

```
✗ Ne pas mettre de logique isAdmin dans les composants d'exercices
  → uniquement dans useProgress et useProfile
✗ Ne pas accéder à localStorage directement depuis les composants
  → toujours passer par progressService ou profileService
✗ Ne pas changer l'interface publique de useProfile et useProgress
  → le jalon 7 remplace l'implémentation, pas l'interface
✗ Ne pas oublier RequireAuth sur toutes les routes après /profile-select
✗ Ne pas appeler resetProgress depuis un composant avec useProgress inline
  → le bouton reset appelle profileService.resetProgress directement
     puis recharge la page
```

## Ce qu'il faut absolument faire

```
✓ useProfile et useProgress ont leur interface définitive (jalon 7 ready)
✓ profileService et progressService sont les seuls à toucher localStorage
✓ La progression persiste entre les rechargements du navigateur
✓ Mode admin déverrouille tout sans modifier le contenu YAML
✓ Bouton "Réinitialiser la progression" fonctionnel
✓ RequireAuth protège toutes les routes sauf /profile-select
✓ Le parc SVG reflète la vraie progression de l'élève
✓ Tests progressService ajoutés et passants dans npm run build
✓ scoreService.saveResult n'est plus un stub (sauvegarde localStorage)
```

---

## Résumé des fichiers créés / modifiés

### Nouveaux fichiers

```
src/data/fakeUsers.js
src/services/profileService.js
src/services/progressService.js
src/screens/ProfileSelect/ProfileSelectScreen.jsx
src/__tests__/progressService.test.js
```

### Fichiers modifiés

```
src/hooks/useProfile.js           ← implémentation réelle
src/hooks/useProgress.js          ← implémentation réelle
src/services/scoreService.js      ← saveResult branché
src/context/AppContext.jsx        ← user initialisé depuis localStorage
src/router/AppRouter.jsx          ← route /profile-select + RequireAuth
src/screens/MainMenu/MainMenuScreen.jsx  ← bouton logout + pseudo affiché
```

### Fichiers non touchés

```
Tous les composants d'exercices
ExerciseEngine.jsx
contentService.js
Le parc SVG (ParcView et ses composants)
LessonRenderer et tous les blocs
Les tests existants (exerciseService, scoreService, answerGenerator)
```

---

## Préparer le jalon 7 — commentaires dans le code

Dans chaque fichier modifié, ajouter un commentaire explicite :

```js
// ═══════════════════════════════════════════════════
// JALON 7 — Pour brancher Firebase Auth :
// Remplacer l'implémentation de cette fonction par :
//   const user = await firebaseAuth.currentUser
//   return await user.getIdToken()
// L'interface publique reste identique.
// ═══════════════════════════════════════════════════
```

Ces commentaires guideront Claude au jalon 7 sans qu'il ait besoin
de relire toute l'architecture.
