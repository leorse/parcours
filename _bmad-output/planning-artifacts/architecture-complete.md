---
status: 'reference'
version: '1.0'
date: '2026-06-02'
project_name: 'ParcCours'
author: 'Winston (BMAD Architect)'
description: "Architecture complète de l'application — référence vivante à maintenir à jour"
---

# Architecture complète — ParcCours

> **Usage :** Ce document est la référence d'impact. Avant tout ajout ou évolution, consulter la section **Matrice d'impact** pour anticiper les fichiers à modifier et les risques de régression.

---

## 1. Vue d'ensemble du système

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEUR FINAL                    │
└──────────────┬──────────────────┬───────────────────────┘
               │                  │
   ┌───────────▼──────┐  ┌────────▼──────────────────────┐
   │  NAVIGATEUR PC   │  │  SMARTPHONE ANDROID           │
   │  Chrome/Edge     │  │  APK sideloadé (Capacitor)    │
   │  localhost:5173  │  │  WebView natif                │
   └───────────┬──────┘  └────────┬──────────────────────┘
               │                  │
               └────────┬─────────┘
                        │  React 18 + Vite (même code)
                        │
          ┌─────────────▼──────────────────┐
          │        FRONTEND                │
          │  React 18 + Vite + SWC         │
          │  Tailwind CSS + Framer Motion  │
          │  Firebase Web SDK              │
          │  localStorage (source vérité)  │
          └──────────┬─────────────────────┘
                     │ HTTP/HTTPS fire-and-forget
                     │ VITE_BACKEND_URL
                     ▼
          ┌──────────────────────────────┐
          │         BACKEND              │
          │  FastAPI + SQLite            │
          │  Raspberry Pi (prod)         │
          │  Cloudflare Tunnel (HTTPS)   │
          └──────────┬───────────────────┘
                     │
          ┌──────────▼───────────────────┐
          │  SERVICES EXTERNES           │
          │  Firebase Auth (Jalon 7)     │
          │  1min.ai (correction IA)     │
          └──────────────────────────────┘
```

### Principe fondamental

**localStorage = source de vérité locale. Backend = synchronisation best-effort.**
L'app est utilisable sans réseau. Toute mutation d'état passe d'abord par localStorage, puis le backend est notifié en fire-and-forget sans jamais bloquer l'UI.

---

## 2. Architecture frontend — couches

```
┌───────────────────────────────────────────────────────┐
│  SCREENS (8 écrans)                                   │
│  SplashScreen, ProfileSelectScreen, MainMenuScreen,   │
│  SubjectSelectScreen, CourseSelectScreen,             │
│  StepSelectScreen, StepPlayerScreen, ProfileScreen    │
├───────────────────────────────────────────────────────┤
│  COMPONENTS (40+)                                     │
│  layout/ · ui/ · exercise/ · lesson/ ·                │
│  gamification/ · mascotte/ · personnages/ · debug/    │
├───────────────────────────────────────────────────────┤
│  HOOKS (4)                                            │
│  useProfile · useProgress · useEventEngine · useAudio │
├───────────────────────────────────────────────────────┤
│  SERVICES (15)                                        │
│  contentService · profileService · progressService    │
│  scoreService · exerciseService · eventEngine         │
│  badgeService · xpService · streakService · skillService │
│  recommendationService · personnageService            │
│  dialogueService · dynamicExerciseService             │
│  (backendService — Jalon 7)                           │
├───────────────────────────────────────────────────────┤
│  CONTEXTES (2)                                        │
│  AppContext · EventContext                            │
├───────────────────────────────────────────────────────┤
│  ROUTER                                               │
│  AppRouter · ROUTES · buildRoute · RequireAuth        │
└───────────────────────────────────────────────────────┘
```

**Règle topologique (toujours respectée) :**
```
screens/ → components/ → hooks/ → services/ → utils/
```
Un service n'importe jamais un composant. Un hook n'importe jamais un écran. Toute violation crée une dépendance circulaire invisible.

---

## 3. Routing

### Constantes et helpers

```javascript
// src/router/AppRouter.jsx

ROUTES = {
  SPLASH:         '/',
  PROFILE_SELECT: '/profile-select',
  MENU:           '/menu',
  SUBJECTS:       '/subjects',
  COURSES:        '/courses/:subjectId',
  STEPS:          '/steps/:subjectId/:courseId',
  PLAYER:         '/player/:subjectId/:courseId/:stepId',
  PROFILE:        '/profile',
  DEBUG:          '/debug'          // DEV uniquement, lazy-loaded
}

buildRoute = {
  courses: (subjectId)                       → string
  steps:   (subjectId, courseId)             → string
  player:  (subjectId, courseId, stepId)     → string
}
```

### Flux de navigation principal

```
SplashScreen (/)
    → trigger('app_start')
    → isLoggedIn ? SUBJECTS : PROFILE_SELECT

ProfileSelectScreen (/profile-select)
    → login(userKey)
    → navigate(SUBJECTS)

SubjectSelectScreen (/subjects)
    → trigger('subject_enter')
    → navigate(buildRoute.courses(subjectId))

CourseSelectScreen (/courses/:subjectId)
    → trigger('course_enter')
    → navigate(buildRoute.steps(subjectId, courseId))

StepSelectScreen (/steps/:subjectId/:courseId)
    → navigate(buildRoute.player(subjectId, courseId, stepId))

StepPlayerScreen (/player/:subjectId/:courseId/:stepId)
    → trigger('step_complete') / trigger('exercise_complete') / trigger('badge_earned')
    → navigate(back) ou navigate(next step)

ProfileScreen (/profile)
    → accessible depuis MainMenuScreen (icône user)
```

### Guard d'authentification

`RequireAuth` vérifie `useProfile().isLoggedIn`. Si false → redirect vers PROFILE_SELECT.
Protège : MENU, SUBJECTS, COURSES, STEPS, PLAYER, PROFILE.

### Impact — ajouter une route

1. Ajouter la constante dans `ROUTES` (AppRouter.jsx)
2. Ajouter le helper dans `buildRoute` si paramètres
3. Créer l'écran dans `src/screens/`
4. Ajouter la `<Route>` dans `AnimatedRoutes`
5. Décider si elle est protégée par `RequireAuth`
6. Ajouter le trigger d'événement si nécessaire

---

## 4. État global

### AppContext (`src/context/AppContext.jsx`)

| Clé | Type | Usage |
|---|---|---|
| `currentSubject` | objet | Matière sélectionnée (navigation) |
| `currentCourse` | objet | Cours sélectionné |
| `currentStep` | objet | Étape courante |
| `musicEnabled` | bool | Musique fond activée |
| `soundEnabled` | bool | Sons effets activés |
| `user` | objet | `{ uid, pseudo, avatar, role }` |
| `setUser` | fn | Mise à jour user (login/logout) |
| `xp` | number | XP total utilisateur |
| `badges` | array | Badges débloqués |

**Hook d'accès :** `useAppContext()` — ne jamais accéder à AppContext directement.

**Persistance :** `user` et préférences audio dans localStorage. `xp` et `badges` chargés depuis backend au démarrage.

### EventContext (`src/context/EventContext.jsx`)

| Clé | Type | Usage |
|---|---|---|
| `queue` | array | File d'événements en attente |
| `currentEvent` | objet \| null | Événement affiché en ce moment |
| `pushEvents(events[])` | fn | Ajouter à la queue |
| `dismissCurrent()` | fn | Fermer l'événement courant |

**Règle absolue :** jamais deux dialogs simultanés. Tout passe par cette queue FIFO. Auto-consommation avec délai 300ms entre chaque item.

### Impact — ajouter un état global

Très rare. Avant d'ajouter un `createContext` ou une clé dans AppContext :
- Vérifier si un `useState` local dans l'écran suffit
- Vérifier si `useProfile()` ou `useProgress()` couvrent le besoin
- Un nouveau `createContext` est **interdit sans discussion** (règle project-context §9)

---

## 5. Services — carte des dépendances

```
contentService         ← fetch YAML /content/*
                          cache module-scope
                          consommé par : scoreService, badgeService,
                                         xpService, eventEngine,
                                         personnageService (dette)
                                         + tous les screens via hooks

profileService         ← localStorage (Jalon 4) / Firebase Auth (Jalon 7)
                          consommé par : useProfile, backendService,
                                         scoreService, progressService

progressService        ← localStorage + backend fire-and-forget
                          consommé par : useProgress, scoreService

scoreService           ← exerciseService (validation)
                          progressService (sauvegarde)
                          badgeService + xpService + streakService + skillService (gamification)
                          consommé par : ExerciseEngine

exerciseService        ← logique pure de validation
                          consommé par : scoreService, ExerciseEngine

badgeService           ← contentService (badges.yaml, trophies.yaml)
                          consommé par : scoreService

xpService              ← contentService (levels.yaml)
                          consommé par : scoreService, ProfileScreen

streakService          ← backend (POST /streak/check)
                          consommé par : scoreService, SplashScreen

skillService           ← backend (GET /skills/:uid)
                          consommé par : ProfileScreen, recommendationService

recommendationService  ← skillService + contentService
                          consommé par : ProfileScreen

eventEngine            ← contentService (events.yaml) [dette — fetch direct]
                          consommé par : useEventEngine

eventActions           ← consommé par : eventEngine
eventConditions        ← consommé par : eventEngine

dynamicExerciseService ← logique pure (substitution paramètres)
                          consommé par : StepPlayerScreen avant ExerciseEngine

personnageService      ← fetch YAML /content/* [dette — pas via contentService]
                          consommé par : DialoguePlayer, MonologuePlayer

dialogueService        ← consommé par : StepPlayerScreen (étapes dialogue)

backendService         ← (Jalon 7) profileService (token)
(à créer J7)             consommé par : tous les services qui font des appels auth
```

---

## 6. Moteur d'exercices

### EXERCISE_REGISTRY (`src/components/exercise/ExerciseEngine.jsx`)

| Type YAML | Composant | Validation (`exerciseService`) |
|---|---|---|
| `multiple_choice` | MultipleChoiceExercise | validateMultipleChoice |
| `fill_in_the_blanks` | FillInTheBlanksExercise | validateFillInTheBlank |
| `image_tap` | ImageTapExercise | validateImageTap |
| `drag_drop` | DragDropExercise | validateDragDrop |
| `timeline` | TimelineExercise | validateTimeline |
| `matching` | MatchingExercise | validateMatching |
| `free_text` | FreeTextExercise | validateFreeText + IA backend |
| `fraction_tap` | FractionTapExercise | validateFractionTap |
| `dictation` | DictationExercise | validateDictation |

### Interface d'un composant exercice

```jsx
function MonExercise({ exercise, onSubmit, result, exerciseData, courseId }) {
  // exercise     → objet YAML complet
  // onSubmit(userAnswer) → appelé avec la réponse brute
  // result       → null tant que pas soumis, { correct, score, ... } ensuite
  // exerciseData → données pré-validées
  // courseId     → pour les appels backend (FreeText)
}
```

### Flux d'un exercice

```
StepPlayerScreen
    → instantiateExercise(exo) [si generation: dynamique]
    → <ExerciseEngine key={exercise.id} exercise={exo} />
        → EXERCISE_REGISTRY[exercise.type]
        → onSubmit(userAnswer)
            → exerciseService.validateAnswer()
            → scoreService.saveResult()    [fire-and-forget]
                → localStorage
                → POST /progress/exercise  [fire-and-forget]
                → POST /streak/check       [fire-and-forget]
                → checkNewBadges()
            → trigger('exercise_complete', context)
            → trigger('badge_earned', ...) par badge
        → <ExerciseResult> [XpGainAnimation, LevelUpCelebration, BadgeUnlock]
```

### Impact — ajouter un type d'exercice

**3 fichiers obligatoires, dans cet ordre :**
1. `src/components/exercise/exercises/MonNouvelExercise.jsx` — composant
2. `EXERCISE_REGISTRY` dans `ExerciseEngine.jsx` — enregistrement
3. `exerciseService.js` — ajouter `validateMonNouvelType()` dans le switch

**Règle clé :** toujours `key={exercise.id}` sur `<ExerciseEngine>`. Sans ça, le résultat de l'exercice précédent reste affiché.

---

## 7. Contenu YAML — structure

```
public/content/
├── index.yaml                          ← liste des matières (id, name, icon, color)
│
├── events/
│   └── events.yaml                     ← 11 événements déclaratifs (triggers, conditions, actions)
│
├── config/
│   ├── levels.yaml                     ← 7 niveaux XP (0 → 2200)
│   ├── badges.yaml                     ← 10 badges (conditions de déblocage)
│   └── trophies.yaml                   ← 3 trophées
│
└── subjects/{subjectId}/
    ├── subject.yaml                    ← liste des cours du sujet
    └── courses/{courseId}/
        ├── course.yaml                 ← grandes_etapes + steps_content (leçons)
        └── exercises.yaml             ← liste d'exercices

[optionnel par cours]
└── subjects/{subjectId}/courses/{courseId}/
    ├── events.yaml                     ← événements contextuels au cours
    └── dialogues/{id}.yaml            ← dialogues de personnages
```

### Structure d'un exercice YAML

```yaml
- id: exo-001
  difficulty: 2            # 1-3
  xp: 15
  skills: [{ tag: "division", weight: 1.0 }]
  generation: fixe         # ou "dynamique"
  params: []               # si generation: dynamique → liste de paramètres
  exercise:
    type: multiple_choice  # voir EXERCISE_REGISTRY
    question: "..."
    choices: [...]
```

### Structure d'un événement YAML

```yaml
- id: welcome_back
  trigger: app_start
  conditions:
    - type: days_absent_gte
      value: 2
  actions:
    - type: dialog
      character: mascotte
      text: "Bon retour {pseudo} ! Tu étais absent depuis {days_absent} jours."
  once: false
  cooldown_days: 1
```

### Variables disponibles dans les événements

`{pseudo}`, `{days_absent}`, `{subject_name}`, `{course_name}`, `{streak}`, `{xp}`, `{level_name}`

### Impact — ajouter du contenu

| Action | Fichiers impactés |
|---|---|
| Nouvelle matière | `public/content/index.yaml` + dossier `subjects/{id}/` |
| Nouveau cours | `subjects/{id}/subject.yaml` + dossier `courses/{id}/` |
| Nouveau type de leçon | `course.yaml` + `LessonRenderer.jsx` + `src/components/lesson/blocks/` |
| Nouveau badge | `badges.yaml` + `badgeService.js` (si nouvelle condition) |
| Nouveau niveau XP | `levels.yaml` |
| Nouvel événement | `events.yaml` + éventuellement `eventConditions.js` (nouvelle condition) |

---

## 8. Système d'événements et mascotte

### Triggers disponibles

| Trigger | Déclencheur | Contexte passé |
|---|---|---|
| `app_start` | SplashScreen (montage) | streak, xp, skills depuis backend |
| `subject_enter` | SubjectSelectScreen (clic matière) | subject_name |
| `course_enter` | CourseSelectScreen (chargement données) | course_name, subject_name |
| `step_complete` | StepPlayerScreen (clic "Suivant") | duration_sec, step_id |
| `exercise_complete` | ExerciseEngine (après saveResult) | score, xp_earned, correct |
| `badge_earned` | ExerciseEngine (par badge débloqué) | badge_id, badge_name |
| `daily_login` | (disponible, non déclenché) | — |
| `course_complete` | (disponible, non déclenché) | — |

### Types d'actions disponibles

| Type | Effet |
|---|---|
| `dialog` | Affiche dialog mascotte avec message |
| `celebration` | Overlay confettis/feux (auto-dismiss 2.5s) |
| `badge_unlock` | Animation déblocage badge |
| `reinforcement` | Suggère exercices de renforcement (placeholder Jalon 7) |

### Impact — ajouter un trigger

1. Appeler `useEventEngine().trigger('mon_trigger', contexte)` dans l'écran
2. Ajouter le trigger dans la liste de `events.yaml` (nouvelle entrée)
3. Si la condition n'existe pas → ajouter dans `eventConditions.js`

### Impact — ajouter une action

1. Ajouter le handler dans `eventActions.js` (`buildActionPayload`)
2. Ajouter le rendu dans `MascotteDialog.jsx` ou créer un nouveau composant
3. S'assurer que le rendu passe par la queue EventContext (jamais directement)

---

## 9. Gamification

### Pipeline XP

```
ExerciseEngine → scoreService.saveResult()
    → calcScore()           [local]
    → progressService       [localStorage]
    → POST /progress/exercise  [backend, fire-and-forget]
    → xpService.getLevelFromXP()  [avec levels.yaml]
    → checkNewBadges(stats, earnedIds)
        → badgeService      [badges.yaml, trophies.yaml]
    → retourne { newBadges, newTrophies, isFirstToday, sessionStats }
```

### Niveaux (levels.yaml)

7 niveaux de 0 XP (Explorateur) à 2200 XP (Légende). `xpService` calcule le niveau actuel et la progression dans le niveau.

### Badges (badges.yaml)

10 badges. Conditions : `exercise_count`, `streak`, `skill_score`, `perfect`. `badgeService.evaluateCondition()` est exporté pour les tests.

### Trophées (trophies.yaml)

3 trophées. Même mécanique que les badges.

### Streak (streakService)

Calculé côté backend (POST /streak/check). Enregistré dans `UserStreak`. Affiché dans ProfileScreen et potentiellement dans les événements mascotte.

### Impact — ajouter un type de condition de badge

1. Ajouter la condition dans `badgeService.js` (switch `evaluateCondition`)
2. Ajouter le test dans `badgeService.test.js`
3. Utiliser la condition dans `badges.yaml`

---

## 10. Backend API

### Vue d'ensemble des endpoints

```
GET  /health

POST /api/ai/correct               ← correction IA via 1min.ai
                                     Req: { token, exercise_id, student_text, ai_correction }
                                     Res: { score, feedback, points_reussis, a_ameliorer }

POST /progress/step                ← marquer étape in_progress / completed
POST /progress/exercise            ← enregistrer résultat exercice + XP + skills
GET  /progress/{uid}               ← récupérer progression d'un utilisateur

GET  /xp/{uid}                     ← XP total + niveau
GET  /skills/{uid}                 ← scores par tag de compétence
GET  /badges/{uid}                 ← badges débloqués
POST /badges/award                 ← décerner un badge

POST /streak/check                 ← calculer/mettre à jour streak
GET  /streak/{uid}                 ← récupérer streak

POST /events/log                   ← enregistrer un événement déclenché
GET  /events/{uid}                 ← historique événements déclenchés
```

### Authentification (en transition)

| Jalon | Mécanisme | Token |
|---|---|---|
| Jalon 4b–6 | Fake token | `fake-token-{uid}` dans localStorage |
| Jalon 7 | Firebase JWT | `Authorization: Bearer <jwt>` |

**Note :** Le backend accepte actuellement les tokens en `body.token` (JSON). Le Jalon 7 migre vers header `Authorization: Bearer` via `backendService.authenticatedFetch()`.

### Modèle de données (SQLite)

```
User               (uid, pseudo, avatar, role, created_at, last_seen_at)
UserProgress       (uid, step_id, course_id, subject_id, status, score, completed_at)
UserExerciseHistory(uid, exercise_id, course_id, result, score, xp_earned, time_spent_sec)
UserXP             (uid, total_xp, level)
UserSkillScore     (uid, skill_tag, score, attempts, confidence)
UserBadge          (uid, badge_id, earned_at)
UserTrophy         (uid, trophy_id, earned_at)
UserStreak         (uid, current_streak, longest_streak, last_active_date)
UserEventHistory   (uid, event_id, triggered_at)
IACall             (user_id, exercise_id, prompt_*, score_*, feedback_*, tokens_*, ...)
```

### Impact — ajouter un endpoint backend

1. Ajouter la route dans `backend/routers/progress.py` (ou nouveau router)
2. Ajouter le modèle SQLAlchemy dans `database.py` si nouvelle table
3. L'appel côté frontend passe par un service dans `src/services/`
4. Jamais de `fetch` directement dans un composant ou un écran

---

## 11. Android — Capacitor (Jalon 8)

### Principe

Le build Vite (`dist/`) est copié dans un projet Android natif géré par Capacitor. Une WebView Android exécute l'app React. L'APK est généré via Gradle (Android Studio).

### Workflow de build

```bash
npm run build                    # 1. Vite → dist/
npx cap sync                     # 2. Copie dist/ → android/app/src/main/assets/public/
# Ouvrir Android Studio          # 3. Build > Generate APK
adb install app-debug.apk        # 4. Sideload sur device physique
```

### Adaptations requises (delta Jalon 8)

| Composant | Problème | Solution |
|---|---|---|
| `DictationExercise.jsx` | `window.speechSynthesis` absent dans WebView | `ttsService.js` avec `speak(text, lang)` — impl Web Speech API (PC) / `@capacitor/text-to-speech` (Android) |
| Clés localStorage | Dispersées dans plusieurs services | `storageService.js` centralisé → `@capacitor/preferences` |
| Requêtes réseau | Android 9+ exige HTTPS | Cloudflare Tunnel → HTTPS automatique ✓ |
| CSP Capacitor | Domaine Cloudflare à déclarer | `capacitor.config.ts` → `server.allowNavigation` |
| Audio autoplay | Politiques strictes Android WebView | Déclencher uniquement depuis geste utilisateur |

### Variables d'environnement par cible

| Cible | `VITE_BACKEND_URL` | Fichier |
|---|---|---|
| Dev PC | `http://localhost:8000` | `.env.local` |
| APK prod | `https://[domaine].trycloudflare.com` | `.env.production` |

### Ce qui ne change pas avec Capacitor

- Tout le code React (100% réutilisé)
- Firebase Web SDK (fonctionne dans WebView)
- localStorage (fonctionne, migrable vers `@capacitor/preferences`)
- Les 141 tests Vitest
- Le workflow `npm run dev` sur PC

---

## 12. Authentification — état et évolution

### Jalon 4–6 (actuel)

```
ProfileSelectScreen → setCurrentUser(userKey) → localStorage
getCurrentUser() → lit localStorage (synchrone)
getFirebaseToken() → retourne 'fake-token-{uid}'
Backend → accepte ce token via SKIP_FIREBASE_AUTH=true
```

### Jalon 7 (Firebase)

```
ProfileSelectScreen → signInWithGoogle() → Firebase
onAuthStateChanged → profileService._user
getCurrentUser() → synchrone via cache module-level
getFirebaseToken() → auth.currentUser.getIdToken() (async)
Backend → firebase-admin.verify_id_token(jwt)
```

**Interface publique de `profileService` identique avant/après Jalon 7.** Aucun callsite existant ne change.

### Points de changement Jalon 7 (documentés dans architecture.md)

Voir `architecture.md` pour le détail complet (Jalon 7 Firebase Auth). Le fichier `architecture-complete.md` couvre le système entier ; les décisions spécifiques Jalon 7 restent dans `architecture.md`.

---

## 13. Matrice d'impact — évolutions fréquentes

> **Lire cette section avant tout ajout.** Chaque ligne indique ce qui change quand vous touchez une zone.

### Ajouter un type d'exercice

| Fichier | Action |
|---|---|
| `src/components/exercise/exercises/MonType.jsx` | Créer |
| `src/components/exercise/ExerciseEngine.jsx` | Ajouter dans `EXERCISE_REGISTRY` |
| `src/services/exerciseService.js` | Ajouter dans `validateAnswer()` switch |
| `src/__tests__/exerciseService.test.js` | Ajouter tests de validation |
| `public/content/.../exercises.yaml` | Ajouter exercices avec le nouveau type |
| `src/debug/panels/ExerciseBrowser.jsx` | Peut nécessiter preview spécifique |

**Risques :** Un type absent dans `EXERCISE_REGISTRY` échoue silencieusement ("Type inconnu"). Ne jamais utiliser `key={index}` dans les listes de segments.

---

### Ajouter un écran

| Fichier | Action |
|---|---|
| `src/screens/MonEcran/MonEcranScreen.jsx` | Créer |
| `src/router/AppRouter.jsx` | Ajouter constante ROUTES + Route + buildRoute si params |
| `src/router/AppRouter.jsx` | Décider protection RequireAuth |
| Écran appelant | `navigate(ROUTES.MON_ECRAN)` ou `navigate(buildRoute.monEcran(...))` |
| `useEventEngine` | Ajouter trigger si nécessaire |

---

### Ajouter une matière / un cours

| Fichier | Action |
|---|---|
| `public/content/index.yaml` | Ajouter entrée matière (si nouvelle matière) |
| `public/content/subjects/{id}/subject.yaml` | Créer ou modifier |
| `public/content/subjects/{id}/courses/{id}/course.yaml` | Créer |
| `public/content/subjects/{id}/courses/{id}/exercises.yaml` | Créer |

**Aucun code React à modifier.** contentService charge dynamiquement depuis les YAML.

---

### Ajouter un type de bloc de leçon

| Fichier | Action |
|---|---|
| `src/components/lesson/blocks/MonBloc.jsx` | Créer |
| `src/components/lesson/LessonRenderer.jsx` | Enregistrer dans le switch de rendu |
| `course.yaml` | Utiliser le nouveau type dans `steps_content` |

---

### Ajouter un badge ou un trophée

| Fichier | Action |
|---|---|
| `public/content/config/badges.yaml` | Ajouter entrée |
| `src/services/badgeService.js` | Ajouter dans `evaluateCondition()` si nouvelle condition |
| `src/__tests__/badgeService.test.js` | Tester la nouvelle condition |

---

### Ajouter un événement mascotte

| Fichier | Action |
|---|---|
| `public/content/events/events.yaml` | Ajouter entrée |
| `src/services/eventConditions.js` | Si nouvelle condition de déclenchement |
| `src/services/eventActions.js` | Si nouveau type d'action |
| `src/components/mascotte/MascotteDialog.jsx` | Si nouveau rendu d'action |
| `src/__tests__/eventConditions.test.js` | Tester la condition |
| `src/__tests__/eventEngine.test.js` | Tester l'événement bout-en-bout |

---

### Ajouter un endpoint backend

| Fichier | Action |
|---|---|
| `backend/routers/*.py` | Ajouter la route |
| `backend/database.py` | Si nouvelle table SQLAlchemy |
| `src/services/[service].js` | Appel frontend via fire-and-forget |
| Tests | Pas de test backend actuellement — à prévoir |

**Règle :** Jamais de `fetch` dans un composant ou un écran. Toujours via `src/services/`.

---

### Modifier profileService (interface auth)

**Zone la plus sensible du projet.** `getCurrentUser()` est appelé dans ~15 endroits.

- L'interface publique (`getCurrentUser`, `setCurrentUser`, `clearCurrentUser`, `getFirebaseToken`) est **gelée**.
- L'implémentation change au Jalon 7 (Firebase) sans changer les signatures.
- Toute modification doit vérifier l'invariant : `getCurrentUser()` reste synchrone.

---

### Modifier contentService

**Risque : mutation du cache.** Le cache stocke des références brutes.

- **Ne jamais** `.sort()` ou `.push()` sur un objet retourné — toujours cloner : `[...arr]` ou `structuredClone(obj)`.
- **Ne jamais** exposer `clearCache()` (cause de "mon YAML ne se déclenche plus" en HMR).
- Les services `badgeService`, `xpService`, `eventEngine`, `personnageService` font des `fetch` directs plutôt que passer par `contentService` — dette connue, ne pas étendre.

---

## 14. Zones de risque élevé

| Zone | Risque | Mitigation |
|---|---|---|
| `ExerciseEngine` clé manquante | Exercice silencieusement cassé | Toujours `key={exercise.id}` |
| Mutation cache `contentService` | Corruption silencieuse session entière | Toujours cloner les retours |
| `profileService` interface | 15 callsites cassés | Interface gelée, ne pas changer les signatures |
| `EventContext` double dialog | UX incohérente | Tout passe par `useEventEngine().trigger()` |
| `speechSynthesis` sur Android | DictationExercise muet | `ttsService.js` à créer avant Jalon 8 |
| `localStorage` eviction Android | Perte de progression | `storageService.js` + `@capacitor/preferences` |
| Appels backend `await` dans UI | UI bloquée sur réseau | Toujours fire-and-forget |
| Import `getFirebaseToken` dans composant | Token non rafraîchi, dette auth | Uniquement via `backendService` |

---

## 15. Jalons et état du code

| Jalon | Statut | Commentaires dans le code |
|---|---|---|
| 0–3 | ✅ Terminé | — |
| 4 | ✅ Terminé | Auth localStorage, routes de base |
| 4b | ✅ Terminé | Sync backend fire-and-forget |
| 4c | ✅ Terminé | Dictée |
| 5 | ✅ Terminé | XP, badges, streak, gamification |
| 6 | ✅ Terminé | Événements mascotte |
| 6b | ✅ Terminé | Streak, session active |
| 7 | 🔜 À faire | Firebase Auth — commentaires `// JALON 7` dans le code marquent les points de changement |
| 8 | 🔜 À faire | Capacitor Android — voir `architecture-jalon-8-android-capacitor.md` |

### Marqueurs dans le code

Les commentaires `// Jalon X` dans le code marquent l'historique d'évolution — ne pas en ajouter pour les nouvelles features. Les commentaires `// JALON 7` marquent les points de migration Firebase.

---

## 16. Workflow de développement

```bash
# Frontend
npm run dev           # Vite dev server → http://localhost:5173
npm test              # Vitest one-shot (141 tests)
npm run test:watch    # Mode watch
npm run build         # Tests + build Vite (échoue si tests échouent)

# Backend
start-back.bat        # Active venv Python + uvicorn → http://localhost:8000
# ou manuellement :
# cd backend && monenv\Scripts\activate && uvicorn main:app --reload

# Debug
/debug                # Dashboard DEV uniquement (lazy-loaded, tree-shaké en prod)
```

### Variables d'environnement

```
# .env.local (frontend, non commité)
VITE_BACKEND_URL=http://localhost:8000

# .env.production (frontend prod/APK, non commité)
VITE_BACKEND_URL=https://[domaine].trycloudflare.com

# backend/.env (non commité, copier depuis backend/.env.example)
ONEMIN_API_KEY=...
SKIP_FIREBASE_AUTH=true   # en dev
DATABASE_URL=sqlite:///./parcours.db
ENV=development
```

---

## 17. Tests — couverture et conventions

```
src/__tests__/
├── contentService.test.js
├── scoreService.test.js
├── exerciseService.test.js
├── xpService.test.js       (getLevelFromXP_sync, getProgressInLevel_sync)
├── skillService.test.js
├── badgeService.test.js    (evaluateCondition exporté pour tests)
├── streakService.test.js
├── eventConditions.test.js
├── eventEngine.test.js
├── personnageService.test.js
├── progressService.test.js
└── answerGenerator.test.js
```

**141 tests total, tous verts.**

**Règles :**
- Environnement `node` (pas `jsdom`) — pas de `render()` React dans ces tests
- Ne pas mocker `fetch` si un helper `_sync` existe (xpService, badgeService)
- Chaque nouveau service avec logique conditionnelle → fichier de test obligatoire
- `npm run build` échoue si un test est rouge

---

## 18. Références croisées

| Besoin | Document |
|---|---|
| Décisions Jalon 7 (Firebase) | `architecture.md` |
| Décisions Jalon 8 (Capacitor) | `architecture-jalon-8-android-capacitor.md` |
| Règles d'implémentation détaillées | `project-context.md` |
| Anti-patterns critiques | `project-context.md` §12 |
| Patterns React/framework | `project-context.md` §9 |
