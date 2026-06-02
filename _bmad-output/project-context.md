---
project_name: ParcCours
user_name: Dams
date: '2026-05-29'
status: complete
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
optimized_for_llm: true
---

# Contexte projet pour les agents IA

_Ce fichier contient les règles critiques et les patterns que les agents IA doivent respecter
lors de l'implémentation. Il se concentre sur les détails non-évidents qui pourraient être manqués._

---

## Stack technique & versions

| Outil | Version |
|---|---|
| React | 18.3.1 |
| Vite (+SWC plugin) | 5.3.4 |
| React Router DOM | 6.24.1 |
| Tailwind CSS | 3.4.6 |
| Framer Motion | 11.3.0 |
| js-yaml | 4.1.1 |
| Howler.js | 2.2.4 |
| Lucide React | 0.408.0 |
| KaTeX | 0.16.45 |
| recharts | 3.8.1 |
| firebase | 12.12.1 |
| @dnd-kit/core | 6.3.1 |
| react-markdown | 10.1.0 |
| Vitest | 4.1.5 |

- **Langage :** JavaScript (pas TypeScript). Pas de `.ts`/`.tsx`, uniquement `.js`/`.jsx`.
- **Extension :** `.jsx` uniquement si le fichier contient du JSX. Tout fichier sans JSX (services, hooks, utilitaires) = `.js`.
- **Module system :** ESM (`"type": "module"` dans package.json). Toujours `import`/`export`, jamais `require`.
- **Tests :** Vitest, environment `node`, globals activés. Tests dans `src/__tests__/`.
- **Images :** Utiliser l'alias `@images/fichier.png` (configuré dans `vite.config.js`). Ne jamais utiliser de chemins relatifs pour les images.
- **React Router :** Version 6 uniquement. API obligatoire : `<Routes>`, `<Route>`, `useNavigate()`, `<Navigate>`. Ne jamais utiliser les équivalents v5 (`<Switch>`, `useHistory`, `<Redirect>`) — ils n'existent pas en v6 et ne causent pas d'erreur TypeScript visible.

---

## Règles critiques d'implémentation

### 1. Navigation — toujours passer par ROUTES et buildRoute

**Ne jamais** écrire des paths en dur comme `navigate('/courses/math')`.
Utiliser systématiquement les constantes et builders définis dans [src/router/AppRouter.jsx](src/router/AppRouter.jsx) :

```js
import { ROUTES, buildRoute } from '../router/AppRouter'

navigate(ROUTES.MENU)
navigate(buildRoute.courses(subjectId))
navigate(buildRoute.steps(subjectId, courseId))
navigate(buildRoute.player(subjectId, courseId, stepId))
```

Routes disponibles : `SPLASH`, `PROFILE_SELECT`, `MENU`, `SUBJECTS`, `COURSES`, `STEPS`, `PLAYER`, `PROFILE`.
La route `/debug` n'existe qu'en `import.meta.env.DEV`.

### 2. Contenu — contentService est le seul point d'entrée

Les écrans et composants n'importent **jamais** directement depuis `src/data/` ou `public/content/`.
Tout accès au contenu YAML passe par [src/services/contentService.js](src/services/contentService.js) :

```js
import { getSubjects, getCourses, getSteps, getStepContent, getExercises, getExercise } from '../services/contentService'
```

Le service gère le cache interne. Ne pas refaire de `fetch` ou de `yaml.load` dans les composants.

### 3. Auth — interface stable, implémentation changeante (Jalon 7)

L'authentification est actuellement fake (localStorage + `FAKE_USERS`).
Le **Jalon 7** remplacera `profileService.js` par Firebase Auth **sans changer l'interface publique**.

Toujours passer par [src/services/profileService.js](src/services/profileService.js) :

```js
import { getCurrentUser, getFirebaseToken } from '../services/profileService'
```

Ne jamais accéder directement à `localStorage` pour le profil utilisateur, ni importer `FAKE_USERS`.

### 4. Backend — fire-and-forget, localStorage = source de vérité

**Règle comportementale critique :** toute mutation d'état passe d'abord par `localStorage`, l'appel backend suit sans `await` dans le chemin critique. Ne jamais bloquer l'UI sur une réponse serveur.

```js
// ✅ Correct — localStorage d'abord, puis backend en arrière-plan
saveProgress(userId, progress)        // synchrone, localStorage
backendPost('/api/...', payload)      // fire-and-forget, pas d'await

// ❌ Interdit — bloque l'UI, crée une dépendance réseau
const data = await fetch(BACKEND + '/api/...')
setState(data)
```

`localStorage` est la source de vérité pour l'affichage. Le backend est synchronisé en arrière-plan.
Variable d'env : `VITE_BACKEND_URL` (fallback : `http://localhost:8000`).

### 5. Système d'événements — passer par useEventEngine, jamais directement

Pour déclencher des événements mascotte depuis un écran :

```js
import { useEventEngine } from '../hooks/useEventEngine'

const { trigger } = useEventEngine()
trigger('subject_enter', { subject_name: 'Mathématiques' })
```

**Ne jamais** appeler `processEvents`, `buildActionPayload` ou `EventContext` directement depuis un écran.
La file d'attente FIFO dans `EventContext` garantit qu'il n'y a jamais deux dialogs simultanés.

Triggers disponibles : `app_start`, `subject_enter`, `course_enter`, `step_complete`,
`exercise_complete`, `badge_earned`, `daily_login`, `course_complete`.

### 6. Moteur d'exercices — enregistrement dans EXERCISE_REGISTRY

Pour ajouter un nouveau type d'exercice :

1. Créer `src/components/exercise/exercises/MonNouvelExercise.jsx`
2. L'ajouter dans `EXERCISE_REGISTRY` dans [src/components/exercise/ExerciseEngine.jsx](src/components/exercise/ExerciseEngine.jsx) :

```js
const EXERCISE_REGISTRY = {
  // ...
  mon_nouveau_type: MonNouvelExercise,
}
```

3. Ajouter la validation dans [src/services/exerciseService.js](src/services/exerciseService.js) (switch `validateAnswer`)

Chaque composant exercice reçoit : `{ exercise, onSubmit, result, exerciseData, courseId }`.
`onSubmit(userAnswer)` est appelé avec la réponse brute de l'utilisateur.

### 7. Exercices dynamiques — utiliser instantiateExercise

Pour les exercices avec `generation: 'dynamique'` (paramètres variables), appeler
`instantiateExercise(exo)` depuis [src/services/dynamicExerciseService.js](src/services/dynamicExerciseService.js)
**avant** de passer l'exercice à `ExerciseEngine`.

Substitution des variables : `{{nom_param}}` dans les chaînes YAML.

**Ne pas modifier l'évaluation de formules dans ce service.** L'évaluation utilise `new Function()` de façon intentionnelle et isolée pour évaluer des expressions mathématiques issues du YAML (ex : `"a * b"`). Ne pas remplacer par `eval()`, ne pas reproduire ce pattern ailleurs, ne pas introduire de lib externe pour ça.

### 8. Tests — règles Vitest

**L'environnement Vitest est `node`, pas `jsdom`.** Ne pas écrire de tests qui font du rendu DOM (pas de `render()` depuis `@testing-library/react`) sauf si le fichier déclare explicitement `// @vitest-environment jsdom` en première ligne.

Les tests dans `src/__tests__/` testent de la logique pure (services, validations, moteurs). Pas de tests de composants React dans ce dossier.

Les services qui font des appels réseau exportent des variantes synchrones pour les tests :
- `xpService.js` → `getLevelFromXP_sync`, `getProgressInLevel_sync`
- `badgeService.js` → `evaluateCondition` (exporté directement)

Dans les tests, **ne pas mocker `fetch`** si un helper sync existe. Utiliser le helper sync.

Convention de nommage : `nomDuService.test.js`.

### 9. Règles React & framework

- **Contextes :** `useAppContext()` pour subject/course/step/user/audio. `useEventContext()` existe mais ne jamais l'appeler directement depuis un écran — passer par `useEventEngine()`.
- **Pas de state management externe.** Pas de Redux, Zustand, Jotai, ni nouveau `createContext` maison. État local = `useState`, état global = les deux contextes existants.
- **Animations de page :** `<PageTransition>` ou `<AnimatePresence>` (Framer Motion). Ne pas introduire d'autres systèmes d'animation.
- **Icônes :** Lucide React uniquement (`lucide-react`). Ne pas ajouter d'autres librairies d'icônes.
- **Styles :** Tailwind CSS + fichiers `.css` dans `src/styles/`. Pas de CSS-in-JS, pas de styled-components. Les couleurs de la charte sont dans `tailwind.config.js` sous `theme.extend.colors.brand`.
- **Math dans le texte :** utiliser `<MathText>` ou `<MathBlock>` (wrappeurs KaTeX existants). Ne pas importer KaTeX directement dans les composants.

### 10. Qualité de code & style

**Commentaires :**
- Pas de JSDoc, pas de blocs descriptifs sur les fonctions. Commenter uniquement le WHY non-évident (une ligne max).
- Les commentaires `// Jalon X` existants marquent l'historique d'évolution — ne pas en ajouter pour les nouvelles features.

**Logs :**
- `console.error` dans les blocs `catch` pour erreurs inattendues.
- `console.warn` pour dégradation gracieuse attendue (ex : sync backend échouée).
- Zéro `console.log` dans le code livré.

**Nommage :**
- PascalCase pour les composants React (`.jsx`) et leurs dossiers.
- camelCase pour services, hooks, utilitaires (`.js`).

**Ordre des imports :**
```js
// 1. React
import { useState } from 'react'
// 2. Librairies externes
import { useNavigate } from 'react-router-dom'
// 3. Alias (@images/...)
import logo from '@images/logo.png'
// 4. Imports relatifs
import { getSubjects } from '../services/contentService'
// 5. CSS / assets
import './MonComposant.css'
```

**Structure des composants :**
- Un bloc JSX logique > ~40 lignes ou répété 2 fois → extraire en composant dans le même dossier.
- Pas de PropTypes. Pas de typage défensif.
- Zéro code commenté, zéro import inutilisé dans un fichier livré.

**Direction des dépendances (règle topologique critique) :**
```
screens/ → components/ → hooks/ → services/ → utils/
```
Un service n'importe jamais un composant ou un écran. Un hook n'importe jamais un écran. Toute violation crée une dépendance circulaire.

**Ce qu'on n'ajoute pas sans discussion :**
- Pas de nouvelles dépendances npm.
- Pas de nouveau `createContext`.
- Pas d'appel `fetch` hors des services (`src/services/`).

### 11. Workflow de développement

**Lancer le frontend :** `npm run dev` (ou `start-front.bat`) → Vite dev server sur http://localhost:5173

**Lancer le backend :** `start-back.bat` → active le venv Python (`backend/monenv/`) et lance uvicorn sur http://localhost:8000. Backend = FastAPI + SQLite (`parcours.db`).

**Le frontend fonctionne sans backend.** Les appels réseau échouent silencieusement, localStorage reste la source de vérité. Ne jamais rendre une feature dépendante du backend pour fonctionner.

**Tests :** `npm test` (vitest one-shot). `npm run test:watch` pour le mode watch. `npm run build` = tests + build Vite — le build échoue si les tests échouent.

**Variables d'environnement frontend** (`.env.local`, non commité) :
- `VITE_BACKEND_URL=http://localhost:8000`

**Variables d'environnement backend** (`backend/.env`, non commité, copier depuis `backend/.env.example`) :
- `ONEMIN_API_KEY` — clé API 1min.ai (correction IA des exercices `free_text`)
- `SKIP_FIREBASE_AUTH=true` en dev (accepte les fake tokens)
- `DATABASE_URL=sqlite:///./parcours.db`
- `ENV=development`

**Debug :** dashboard `/debug` (DEV uniquement) — injecter des réponses, parcourir le contenu YAML, tester le moteur d'événements sans passer par l'UI.

### 12. Anti-patterns critiques

**Moteur d'exercices :**
- Ne jamais créer un type d'exercice sans l'enregistrer dans `EXERCISE_REGISTRY` (ExerciseEngine.jsx) ET ajouter sa validation dans `exerciseService.js`. Un type absent échoue silencieusement avec "Type inconnu".
- L'appelant de `<ExerciseEngine>` doit toujours poser `key={exercise.id}` pour forcer le démontage entre deux exercices. Sans ça, le `result` de l'exercice précédent reste visible et `fireAndForgetSave` s'exécute avec un `id` périmé.
- Ne jamais utiliser `key={index}` dans les listes de segments d'exercice — utiliser l'identifiant sémantique (`item.id`, `blank.id`). Voir `FillInTheBlanksExercise.jsx` comme contre-exemple existant.

**Cache de contenu :**
- Ne jamais muter un objet retourné par `contentService` — le cache stocke la référence brute. Un `.sort()` en place ou un `.push()` corrompt le cache pour toute la session sans erreur visible. Toujours cloner : `[...arr]` ou `structuredClone(obj)`. Voir `validateTimeline` et `TimelineExercise` pour le bon pattern.
- Ne jamais exposer de fonction `clearCache()` depuis `contentService` ou `eventEngine` — ces caches module-scope ne doivent pas être invalidés depuis l'extérieur (cause n°1 de "mon YAML ne se déclenche plus" en HMR dev).
- `badgeService`, `xpService`, `eventEngine`, `personnageService` font des `fetch('/content/...')` directs plutôt que passer par `contentService`. C'est une dette connue et maîtrisée — ne pas l'étendre. Toute nouvelle consommation de YAML passe par `contentService`.

**Async et lifecycle React :**
- Ne jamais appeler `saveResult()` avec `await` dans le chemin de rendu — c'est du fire-and-forget.
- Tout `.then()` qui appelle `setXxx` ou `trigger()` doit être protégé par un guard `mounted` dans le `useEffect` parent, pour éviter les dialogs mascotte orphelins après navigation rapide.

**Couplage et communication réseau :**
- Ne jamais déclarer `const BACKEND = import.meta.env.VITE_BACKEND_URL` dans un composant — `FreeTextExercise.jsx` et `ProfileScreen.jsx` le font (dette existante). Toute communication réseau passe par un service dans `src/services/`.
- Ne jamais importer `getFirebaseToken()` directement dans un composant — quand Firebase Auth arrive (Jalon 7), la gestion des erreurs de token doit être centralisée dans les services.

**Événements mascotte :**
- Ne jamais afficher deux dialogs mascotte simultanément. Tout passe par la queue FIFO de `EventContext` via `useEventEngine().trigger()`. Ne jamais appeler `processEvents` ou `buildActionPayload` directement depuis un écran.

**Profil et stockage :**
- Ne jamais accéder à `localStorage` directement pour le profil utilisateur — utiliser `getCurrentUser()` depuis `profileService.js`.
- Ne jamais construire des clés `localStorage` inline dans du nouveau code — les services existants utilisent des conventions légèrement différentes (dette connue). Prévoir un `storageService` centralisé avant le Jalon 8 Android.

**Port Android (Jalon 8) :**
- Ne jamais tester `'speechSynthesis' in window` comme condition booléenne absolue dans du nouveau code. Sur Android WebView, cette API sera absente. La logique TTS de `DictationExercise.jsx` devra migrer vers un `ttsService.js` avec interface `speak(text, lang)` substituable.

**Divers :**
- Ne jamais utiliser `import.meta.env.DEV` dans de la logique métier — réservé au lazy-loading du dashboard debug et aux routes de debug.
- Ne jamais importer `DebugDashboard` ou les panels `src/debug/` depuis du code de production.

---

## Structure des fichiers YAML de contenu

```
public/content/
├── index.yaml                    ← liste des matières
├── subjects/{id}/
│   └── subject.yaml              ← liste des cours
└── subjects/{id}/courses/{id}/
    ├── course.yaml               ← grandes_etapes + steps_content
    └── exercises.yaml            ← liste des exercices
```

Structure d'un exercice YAML :

```yaml
- id: exo-001
  difficulty: 2          # 1-3
  xp: 15
  skills: [{ tag: "division", weight: 1.0 }]
  generation: fixe       # ou "dynamique"
  params: []             # uniquement si generation: dynamique
  exercise:
    type: multiple_choice  # voir EXERCISE_REGISTRY
    question: "..."
    choices: [...]
```

---

## Structure des composants

| Dossier | Contenu |
|---|---|
| `src/screens/` | Écrans principaux (un dossier par écran) |
| `src/components/exercise/` | Moteur + types d'exercices |
| `src/components/gamification/` | XP, badges, streak |
| `src/components/mascotte/` | Dialog, avatar, messages |
| `src/components/lesson/` | Blocs de leçon (Markdown, Math, Image…) |
| `src/components/layout/` | AppShell, NavHeader, footer |
| `src/components/ui/` | Composants UI génériques |
| `src/services/` | Toute la logique métier |
| `src/hooks/` | `useProfile`, `useProgress`, `useAudio`, `useEventEngine` |
| `src/context/` | `AppContext`, `EventContext` |
| `src/debug/` | Dashboard debug (DEV uniquement) |

---

## Debug dashboard

Accessible sur `/debug` uniquement en mode développement.
Lazy-loadé et tree-shaké en production (`import.meta.env.DEV`).
Ne jamais importer `DebugDashboard` ou les panels `src/debug/` depuis du code de production.

---

## Jalons à venir

| Jalon | Contenu | Commentaires |
|---|---|---|
| 7 | Firebase Auth | Remplace `profileService.js` fake. Interface publique identique. Commentaires `JALON 7` dans le code marquent les points de changement. |
| 8 | Android — Capacitor | Wrape le build Vite dans une WebView Android. Génère un APK via Gradle/Android Studio. Voir `_bmad-output/planning-artifacts/architecture-jalon-8-android-capacitor.md`. |

---

## Utilisation

**Pour les agents IA :** lire ce fichier avant toute implémentation. Respecter toutes les règles telles que documentées. En cas de doute, choisir l'option la plus restrictive.

**Pour les humains :** mettre à jour quand la stack ou les patterns évoluent. Supprimer les règles devenues évidentes. Réviser après chaque jalon majeur.

_Dernière mise à jour : 2026-05-29_
