---
title: "ParcCours — PRD Application Complète"
status: reference
version: "1.0"
date: "2026-06-08"
scope: "Jalons 0 → 6b (produit livré) + Jalons 7 et 8 (feuille de route)"
author: "Damien MESSNER"
---

# PRD — ParcCours : Application éducative pour enfants

> **Usage :** Ce document décrit le produit dans son ensemble — vision, utilisateurs, fonctionnalités livrées et feuille de route. Les spécifications techniques détaillées de chaque jalon futur sont dans des PRDs dédiés (voir §6).

---

## 1. Contexte et vision produit

### Problème

Les enfants en âge scolaire (6–12 ans) ont besoin d'un outil d'entraînement pédagogique qui :
- Couvre plusieurs matières (maths, français, histoire, sciences)
- Motive sur la durée sans l'ennui des exercices statiques
- Fonctionne hors connexion sur des appareils modestes
- Peut être utilisé à la maison, sous la supervision d'un parent/enseignant

Les solutions existantes (Duolingo, Khan Academy, etc.) sont en anglais ou inadaptées au programme scolaire français.

### Vision

**ParcCours** est une application éducative mobile-first, offline-first, qui accompagne l'enfant dans son parcours d'apprentissage via :
- Un contenu 100% déclaratif (YAML) — aucun redéploiement pour ajouter un cours
- Un moteur d'exercices extensible (9 types interactifs)
- Une mascotte pédagogique (Gribouille) pilotée par un moteur d'événements déclaratif
- Une gamification intrinsèque (XP, niveaux, badges, streak) intégrée dans le flux naturel

### Positionnement

| Axe | Choix |
|---|---|
| Cible principale | Élève (6–12 ans), utilisateur direct |
| Cible secondaire | Enseignant / parent, rôle admin (déblocage, supervision) |
| Plateforme initiale | Navigateur PC (développement) |
| Plateforme cible | APK Android sideloadé (pas de Play Store) |
| Réseau | Offline-first — localStorage = source de vérité |
| Contenu | Déclaratif YAML, versionnés dans le dépôt |

---

## 2. Utilisateurs et rôles

### Élève (`role: student`)

- Navigue dans les matières et les cours
- Complète des exercices interactifs
- Accumule XP et badges
- Voit sa progression (niveaux, compétences, streak)
- Interagit avec la mascotte Gribouille

**Contraintes UX :** textes courts, navigation tactile, feedback immédiat, animations encourageantes.

### Admin / Enseignant (`role: admin`)

- Accès à tous les cours (aucun cours verrouillé)
- Peut réinitialiser la progression (Jalon 4, via ProfileSelectScreen en dev)
- Futur : panneau d'administration des élèves (hors scope actuel)

**Accès admin actuel (Jalon 4-6) :** sélection du profil "Admin" sur l'écran de sélection. Remplacé au Jalon 7 par un Firebase Custom Claim `role: "admin"` attribué manuellement.

---

## 3. Périmètre fonctionnel livré (Jalons 0 → 6b)

### 3.1 Navigation et structure du contenu

L'application est organisée en 4 niveaux hiérarchiques, entièrement pilotés par les fichiers YAML :

```
Matières (5)
  └─ Cours (N par matière)
       └─ Grandes étapes (N par cours)
            └─ Leçons / exercices (N par grande étape)
```

**Matières déclarées :** Mathématiques, Français, Histoire, Sciences, Tests (zone de développement).

**Cours implémentés (exemple math) :** fractions, multiplication, diviseurs, multiples, géométrie.

**Flux de navigation :**
```
SplashScreen → ProfileSelectScreen (si non connecté)
             → SubjectSelectScreen
             → CourseSelectScreen
             → StepSelectScreen
             → StepPlayerScreen
```

Chaque étape de navigation déclenche un trigger du moteur d'événements (§3.5).

### 3.2 Types de leçons

#### Leçons textuelles (blocs YAML dans `steps_content`)

Un `step_content` est une liste de blocs rendus séquentiellement par `LessonRenderer`. Les blocs `break` créent des pages supplémentaires (pagination côté `StepPlayerScreen`).

| Type de bloc | Rendu | Description |
|---|---|---|
| `md` | `MdBlock` | Markdown étendu (GFM, remark-gfm) avec support formules via `react-markdown` |
| `math` | `MathBlock` | Formule LaTeX rendue via KaTeX |
| `image` | `ImageBlock` | Image depuis `/public/content/images/` |
| `notice` | `NoticeBlock` | Encadré de mise en valeur (info, avertissement) |
| `exercise` | `ExerciseBlock` | Exercice interactif inséré dans le flux leçon (référence par `ref`) |
| `break` | (pas de rendu) | Saut de page — découpe le contenu en pages navigables |

#### Leçons narratives (dialogues / monologues)

Les étapes de type `dialogue` ou `monologue` dans `grandes_etapes.lessons` déclenchent un lecteur de personnages plutôt que `LessonRenderer` :

| Type | Composant | Description |
|---|---|---|
| `dialogue` | `DialoguePlayer` | Échange entre deux personnages (bulles alternées) |
| `monologue` | `MonologuePlayer` | Un seul personnage s'adresse à l'élève |

Les personnages sont définis dans `personnages.yaml` (voir §3.6). Les dialogues sont des fichiers YAML dans `public/content/dialogues/`.

### 3.3 Moteur d'exercices

9 types d'exercices interactifs, chacun avec composant React + validation pure dans `exerciseService.js` :

| Type YAML | Composant | Mécanisme de validation |
|---|---|---|
| `multiple_choice` | `MultipleChoiceExercise` | Choix unique — `choice.correct` |
| `fill_in_the_blank` | `FillInTheBlanksExercise` | Texte à trous — comparaison normalisée + variantes acceptées |
| `image_tap` | `ImageTapExercise` | Zone cliquable sur image — `zone.correct` |
| `drag_drop` | `DragDropExercise` | Glisser-déposer paire source→cible |
| `timeline` | `TimelineExercise` | Remise en ordre chronologique |
| `matching` | `MatchingExercise` | Association gauche↔droite |
| `free_text` | `FreeTextExercise` | Texte libre — correction via API IA (1min.ai) |
| `fraction_tap` | `FractionTapExercise` | Sélection de N parts d'une fraction visuelle |
| `dictation` | `DictationExercise` | Dictée — Text-to-Speech + saisie mots |

**Score :** chaque exercice retourne `{ correct: bool, score: 0.0–1.0, details: {} }`. Le score est normalisé : 1.0 = parfait, 0.0 = tout faux. Les exercices multi-éléments (drag_drop, timeline, matching, fill_in_the_blank) retournent un score partiel.

**Exercices dynamiques :** un exercice peut déclarer `generation: dynamique` avec une liste de `params` (entiers, flottants, formules, choix). `dynamicExerciseService.instantiateExercise()` génère une instance aléatoire à chaque affichage.

**Correction IA (free_text) :** le backend appelle l'API 1min.ai avec le texte de l'élève et les critères de l'exercice. La réponse inclut `{ score, feedback, points_reussis, a_ameliorer }`.

### 3.4 Gamification

#### XP et niveaux

Chaque exercice rapporte des XP définis dans le YAML (`xp: 15`). L'XP est pondéré par le score : `xpEarned = xp × score`.

7 niveaux définis dans `levels.yaml` :

| Niveau | XP requis | Label | Icône |
|---|---|---|---|
| 1 | 0 | Explorateur | 🌱 |
| 2 | 100 | Apprenti | 📚 |
| 3 | 300 | Aventurier | 🧭 |
| 4 | 600 | Expert | ⭐ |
| 5 | 1000 | Maître | 🏆 |
| 6 | 1500 | Champion | 👑 |
| 7 | 2200 | Légende | 🌟 |

`xpService` calcule le niveau actuel et la progression dans le niveau courant (barre XP).

#### Badges

10 badges définis dans `badges.yaml`, évalués après chaque exercice :

| Badge | Condition |
|---|---|
| Premier pas | 1 exercice complété |
| En route ! | 10 exercices complétés |
| Premier cours | 1 cours terminé |
| 3 jours d'affilée 🔥 | streak ≥ 3 jours |
| Une semaine ! 🔥🔥 | streak ≥ 7 jours |
| Maître des fractions | score fractions ≥ 80% |
| As de la multiplication | score multiplication ≥ 80% |
| Petit écrivain | score dictée ≥ 80% |
| Parfait ! | 1 exercice à 100% |
| Excellence | 5 exercices à 100% |

#### Trophées

3 trophées définis dans `trophies.yaml` (même mécanique que les badges, conditions plus exigeantes).

#### Streak

Le streak est calculé côté backend (POST `/api/streak/check` après chaque session). Il représente le nombre de jours consécutifs avec au moins un exercice complété. Affiché dans `ProfileScreen`.

#### Profil gamifié (`ProfileScreen`)

Accessible depuis le menu principal. Affiche :
- Avatar + pseudo + streak
- Barre XP avec niveau actuel/suivant
- Radar chart des compétences (recharts)
- Points forts / à travailler (top 3)
- Grille des badges (obtenus / à obtenir)

### 3.5 Système d'événements et mascotte

#### Mascotte Gribouille

La mascotte est un personnage animé (CSS) présent dans `MascotteDialog`, monté une seule fois dans `AppRouter` (toujours présent, affiche la queue d'événements). Le sprite est défini dans `personnages.yaml` sous le nom `Lumio`.

Animations disponibles : `wave`, `happy`, `thinking`, `proud` (+ autres CSS dans `mascotte.css`).

#### Moteur d'événements

Entièrement déclaratif — les événements sont définis dans des fichiers YAML, sans code React supplémentaire.

**Architecture du moteur :**
```
useEventEngine.trigger(name, ctx, contextPaths)
    ↓
eventEngine.processEvents(name, ctx, triggeredIds, lastTriggered, contextPaths)
    → loadGlobalEvents()      ← /content/events/events.yaml
    → loadContextualEvents()  ← /content/subjects/.../events.yaml
    → filtre par trigger / once / cooldown / conditions
    ↓
eventActions.buildActionPayload(action, ctx, resolveVariables)
    ↓
EventContext.pushEvents(payloads)    ← queue FIFO
    ↓
MascotteDialog (rendu)
```

**Triggers actifs dans l'application :**

| Trigger | Déclencheur | Contexte passé |
|---|---|---|
| `app_start` | `SplashScreen` au montage (si utilisateur connecté) | sessionCount, daysSinceLastSession, currentStreak, skills |
| `subject_enter` | `SubjectSelectScreen` au clic sur une matière | subject_name, subjectAttempts |
| `course_enter` | `CourseSelectScreen` au clic sur un cours | skills, weak_skill_tag, weak_skill_label |
| `step_complete` | `StepPlayerScreen` au clic "Suivant" (dernière page) | step_id, sessionDurationMinutes |
| `exercise_complete` | `ExerciseEngine` après `saveResult()` | xp_earned, score |
| `daily_login` | `ExerciseEngine` si premier exercice du jour | currentStreak, sessionCount |
| `badge_earned` | `ExerciseEngine` pour chaque badge débloqué | badge_label, badge_icon |

**Types d'actions disponibles :**

| Type | Effet |
|---|---|
| `show_dialog` | Dialog mascotte animé avec messages paginés et boutons optionnels |
| `show_celebration` | Overlay confettis ou feux d'artifice (auto-dismiss 2.5s) |
| `show_reinforcement` | Exercices de renforcement (placeholder — auto-dismiss Jalon 6b) |
| `show_monologue` | Déclenche un `MonologuePlayer` depuis MascotteDialog |
| `show_dialogue` | Déclenche un `DialoguePlayer` depuis MascotteDialog |

**Historique local :** stocké dans `localStorage` (`parcours_event_history_{uid}`) — liste des événements `once` déclenchés + timestamp du dernier déclenchement par événement.

**11 événements globaux définis** dans `events.yaml` : premier lancement, retour après absence, connexion quotidienne, première matière, premier cours complété, streak 7 jours, badge débloqué, compétence faible détectée, session longue, exercice parfait, exercice difficile.

**Événements contextuels :** chaque cours peut avoir ses propres `events.yaml`. Chargés et fusionnés avec les événements globaux lors du déclenchement des triggers `course_enter` / `subject_enter`.

#### Garantie de non-collision

**Règle absolue :** un seul dialog/overlay affiché à la fois. `EventContext` maintient une queue FIFO avec auto-consommation avec délai 300ms entre chaque item. Jamais d'appel direct à un composant mascotte — tout passe par `useEventEngine().trigger()`.

### 3.6 Personnages

3 personnages définis dans `personnages.yaml` :

| Nom | Usage | Spritesheet | Émotions |
|---|---|---|---|
| Crac | Dialogues pédagogiques (lapin) | `personnages/tete_lapin.png` | content, serieux, interrogation, moue, sur, parle |
| Moggy | Dialogues pédagogiques (chat) | `personnages/tete_chat.png` | content, serieux, interrogation, moue, sur, parle |
| Lumio | Mascotte Gribouille | `personnages/lumio.png` | wave, happy, thinking, proud |

Chaque personnage est un spritesheet (grille cols × rows). `personnageService.getSpritePosition(personnage, emotion)` calcule les coordonnées CSS `background-position`.

### 3.7 Authentification (Jalon 4-6b, actuel)

**Mécanisme fake :** deux profils prédéfinis (`FAKE_USERS`) stockés dans `localStorage`. Pas d'identité réelle, uid non portable entre appareils.

```javascript
FAKE_USERS = {
  student: { uid: 'fake-student-01', pseudo: 'Léo', role: 'student', ... },
  admin:   { uid: 'fake-admin',      pseudo: 'Admin', role: 'admin', ... },
}
```

**Interface publique de `profileService` (gelée) :**
- `getCurrentUser()` → synchrone, retourne l'utilisateur ou `null`
- `getFirebaseToken()` → async, retourne `'fake-token-{uid}'` (remplacé au Jalon 7)
- `clearCurrentUser()` → déconnecte
- `isAdmin(user)` → `user?.role === 'admin'`

Cette interface ne changera pas au Jalon 7 — seule l'implémentation change.

### 3.8 Synchronisation backend (fire-and-forget)

**Principe :** `localStorage = source de vérité locale`. Toute mutation passe d'abord par localStorage, puis le backend est notifié en `fire-and-forget` sans jamais bloquer l'UI. L'app est 100% fonctionnelle sans réseau.

**Backend :** FastAPI + SQLite sur Raspberry Pi, exposé via Cloudflare Tunnel (HTTPS automatique).

**Endpoints consommés côté frontend :**

| Endpoint | Sens | Usage |
|---|---|---|
| `POST /api/progress/step` | frontend → backend | Étape complétée |
| `POST /api/progress/exercise` | frontend → backend | Résultat exercice + XP + skills |
| `GET /api/progress/{uid}` | backend → frontend | Hydratation cross-device au login |
| `GET /api/xp/{uid}` | backend → frontend | XP total pour ProfileScreen |
| `GET /api/skills/{uid}` | backend → frontend | Compétences pour radar chart |
| `GET /api/badges/{uid}` | backend → frontend | Badges pour grille |
| `POST /api/badges/award` | frontend → backend | Déclarer un badge gagné |
| `POST /api/streak/check` | frontend → backend | Calculer/mettre à jour streak |
| `GET /api/streak/{uid}` | backend → frontend | Streak courant |
| `POST /api/events/log` | frontend → backend | Log historique événements |
| `POST /api/ai/correct` | frontend → backend | Correction IA texte libre (1min.ai) |

**Modèle de données SQLite :**

| Table | Clé | Description |
|---|---|---|
| `User` | uid | Profil utilisateur |
| `UserProgress` | uid + step_id | Progression par étape |
| `UserExerciseHistory` | uid + exercise_id | Historique résultats |
| `UserXP` | uid | XP total + niveau calculé |
| `UserSkillScore` | uid + skill_tag | Score par compétence |
| `UserBadge` | uid + badge_id | Badges débloqués |
| `UserTrophy` | uid + trophy_id | Trophées débloqués |
| `UserStreak` | uid | Streak courant / record |
| `UserEventHistory` | uid + event_id | Historique déclenchements |
| `IACall` | user_id + exercise_id | Logs appels API 1min.ai |

### 3.9 Arbre de compétences (`skills-tree.yaml`)

Chaque exercice peut déclarer des `skills` : `[{ tag: "multiplication/table-2", weight: 1.0 }]`. Ces tags sont définis dans `skills-tree.yaml` avec des prérequis.

**Compétences définies :**
- Mathématiques : multiplication/sens, multiplication/calcul, multiplication/table-2/3/5, multiplication/revision
- Français : orthographe/dictee, orthographe/accords, orthographe/homophones

**Suivi backend :** après chaque exercice, `UserSkillScore` est mis à jour avec score + attempts + confidence. Ces données alimentent le radar chart du profil et la détection des compétences faibles pour la mascotte.

### 3.10 Outils de développement (DEV uniquement)

Un dashboard de debug complet, accessible sur `/debug` (lazy-loaded, tree-shaké en prod) :

| Panneau | Fonction |
|---|---|
| `ContentTree` | Arbre du contenu YAML chargé |
| `YamlInspector` | Inspecteur YAML brut |
| `EngineState` | État du moteur d'exercices |
| `ExerciseBrowser` | Liste et preview des exercices |
| `AnswerInjector` | Soumission automatique de réponses |
| `ExercisePreview` | Rendu live d'un exercice |

`DebugFAB` — bouton flottant DEV pour accéder au dashboard sans navigation.

---

## 4. Exigences non-fonctionnelles

### NFR-1 : Offline-first

L'app est 100% fonctionnelle sans réseau. Toutes les interactions backend sont des best-effort silencieux. `localStorage` ne manque jamais de contenu critique.

### NFR-2 : Performance mobile

- Premier rendu < 2s sur un Android mid-range avec cache chaud
- Animations 60fps (Framer Motion + CSS natif)
- Bundle prod tree-shaké (debug dashboard exclu)
- YAML chargés à la demande avec cache module-scope (jamais rechargés)

### NFR-3 : Extensibilité du contenu

Ajouter un cours, une matière ou un exercice ne nécessite **aucune modification de code React**. Seuls les fichiers YAML sont édités.

### NFR-4 : Extensibilité des exercices

Ajouter un nouveau type d'exercice nécessite exactement 3 fichiers : composant, entrée dans `EXERCISE_REGISTRY`, validation dans `exerciseService`. Aucun autre fichier.

### NFR-5 : Testabilité

Chaque service avec logique conditionnelle a un fichier de tests `__tests__/*.test.js`. Les services exposent des variantes synchrones (`_sync`) pour les tests sans `fetch`. `npm run build` échoue si un test est rouge.

**141 tests, tous verts** (périmètre : services purs, pas de rendu React).

### NFR-6 : Sécurité

- Aucun secret dans le code source
- JWT Firebase (Jalon 7) jamais dans localStorage — géré par IndexedDB Firebase
- `serviceAccountKey.json` dans `.gitignore`
- Contenu enfant uniquement — aucune donnée personnelle exposée côté client

---

## 5. Feuille de route

### Jalon 7 — Firebase Auth (prochain)

**Objectif :** remplacer l'auth fake par Firebase Auth (Google OAuth). Voir PRD dédié : `prds/prd-ParcCours-2026-05-29/prd.md`.

**Points clés :**
- Interface publique `profileService` inchangée — zéro régression sur les ~15 callsites
- `onAuthStateChanged` dans `useProfile` remplace le profil statique localStorage
- Backend : `firebase-admin` + `verify_id_token`, suppression de `SKIP_FIREBASE_AUTH`
- `ProfileSelectScreen` réécrit avec bouton Google OAuth
- Nouveaux fichiers : `firebaseService.js` (singleton), `AuthContext.jsx` (hydratation)

**Risque majeur :** `signInWithPopup` bloqué dans les WebViews Android — à traiter au Jalon 8.

### Jalon 8 — Android (Capacitor)

**Objectif :** générer un APK Android sideloadé depuis le build Vite existant.

**Décision :** Capacitor (pas Kotlin/Jetpack Compose). La WebView exécute le code React sans modification.

**Adaptations requises :**
- `ttsService.js` : abstraction TTS (Web Speech API sur PC, `@capacitor/text-to-speech` sur Android)
- `storageService.js` : abstraction localStorage → `@capacitor/preferences` (éviter l'éviction Android)
- `capacitor.config.ts` : domaine Cloudflare dans `server.allowNavigation`
- Politique audio Android : déclencher uniquement sur geste utilisateur

**Ce qui ne change pas :** 100% du code React, Firebase Web SDK, les 141 tests.

---

## 6. Documents de référence

| Document | Chemin | Contenu |
|---|---|---|
| Architecture complète | `planning-artifacts/architecture-complete.md` | Référence technique exhaustive |
| PRD Jalon 7 (Firebase) | `planning-artifacts/prds/prd-ParcCours-2026-05-29/prd.md` | Spécification détaillée Jalon 7 |
| Architecture Jalon 8 (Capacitor) | `planning-artifacts/architecture-jalon-8-android-capacitor.md` | Décisions Jalon 8 |
| Contexte projet (règles IA) | `project-context.md` | Règles d'implémentation, anti-patterns |
| Recherche Firebase | `planning-artifacts/research/technical-migration-firebase-auth-*` | Étude technique Jalon 7 |

---

*Document généré le 2026-06-08 — Damien MESSNER*
