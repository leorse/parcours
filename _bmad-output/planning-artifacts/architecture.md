---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-05-29'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-ParcCours-2026-05-29/prd.md
  - _bmad-output/planning-artifacts/research/technical-migration-firebase-auth-parcours-jalon-7-research-2026-05-29.md
  - _bmad-output/project-context.md
workflowType: 'architecture'
project_name: 'ParcCours'
user_name: 'Dams'
date: '2026-05-29'
---

# Architecture Decision Document — Jalon 7 : Firebase Auth

_Ce document construit collaborativement les décisions architecturales pour le Jalon 7 de ParcCours. Sections ajoutées au fil des étapes._

---

## Analyse du contexte projet

### Aperçu des exigences

**Exigences fonctionnelles (7) :**

| ID | Périmètre | Enjeu architectural |
|---|---|---|
| FR-1 | `firebaseService.js` — singleton ESM | Initialisation Firebase une seule fois, export `auth` |
| FR-2 | `AuthContext.jsx` — hydratation async | 3 états (undefined/null/user), bloque le rendu |
| FR-3 | `profileService.js` — réécriture | Interface gelée, listener module-level |
| FR-4 | `useProfile.js` — adaptation | Souscription `onAuthStateChanged` React |
| FR-5 | `ProfileSelectScreen` — rewrite | Google OAuth, gestion erreurs popup |
| FR-6 | Backend FastAPI — JWT réel | `firebase-admin`, `verify_id_token`, lifespan |
| FR-7 | Nettoyage artifacts fake | grep avant suppression, localStorage cleanup |

**Exigences non-fonctionnelles (6) :**

- **NFR-1 (critique)** : Interface publique gelée — aucun callsite hors `ProfileSelectScreen` et `useProfile.js` ne change
- **NFR-2** : Hydratation invisible — `AuthProvider` absorbe le délai Firebase, zéro flash déconnecté
- **NFR-3** : `avatar` toujours `'avatar-01'` — photo Google ignorée
- **NFR-4** : `npm test` + `npm run build` passent sans régression
- **NFR-5** : Frontend fonctionnel sans backend (règle core inchangée)
- **NFR-6** : `serviceAccountKey.json` jamais commité, JWT Firebase via IndexedDB (pas localStorage)

**Échelle & Complexité :**

- Domaine primaire : full-stack (React 18 Vite + FastAPI + Firebase Auth)
- Niveau de complexité : **moyen** — migration d'interface bornée, contrat gelé explicite
- Composants architecturaux estimés : 5 (2 nouveaux : `firebaseService.js`, `AuthContext.jsx` ; 3 modifiés : `profileService.js`, `useProfile.js`, `backend/auth.py`)

### Contraintes techniques et dépendances

- Firebase SDK 12.12.1 déjà installé dans `node_modules`
- JavaScript uniquement (pas TypeScript) — pas de typage des Firebase types
- ESM strict (`type: module`) — imports modulaires Firebase tree-shakeable compatibles
- React 18 Strict Mode — double-exécution des effects : cleanup `unsubscribe` obligatoire dans `AuthContext`
- `onAuthStateChanged` en module-level dans `profileService.js` : immune au Strict Mode (hors useEffect)
- Backend FastAPI existant utilise `body.token` (JSON) — **migration vers header `Authorization: Bearer` nécessaire pour tous les appelants frontend**
- Venv Python backend dans `backend/monenv/` — `firebase-admin` à installer dans ce venv

### Préoccupations transverses identifiées

1. **Ordre de wrapping** : `AuthProvider` → `<App />` → `AppContext` — invariant critique
2. **Transport du token** : passage de JSON body (`body.token`) à `Authorization: Bearer` — impact sur tous les services frontend qui font des appels backend authentifiés
3. **Hydratation synchrone** : `getCurrentUser()` reste synchrone via cache module-level `_user`
4. **Nettoyage localStorage** : clé `parcours_current_user` à purger au premier login Firebase réussi
5. **Compatibilité Jalon 8** : `getFirebaseToken()` devra détecter le mode WebView et basculer sur `window._firebaseToken` injecté depuis Kotlin

---

## Fondation technique existante — Baseline Jalon 7

### Domaine primaire

Migration full-stack sur projet existant (React 18 + Vite + FastAPI + Firebase Auth à activer)

### Pas de starter template

Le projet ParcCours est opérationnel depuis le Jalon 4. La question n'est pas "quel template utiliser" mais "quels nouveaux fichiers créer et quels fichiers modifier dans la stack existante".

### Stack en place

**Frontend :**

- React 18.3.1 + Vite 5.3.4 (SWC plugin) — ESM strict, `.jsx`/`.js`
- Tailwind CSS 3.4.6 — classes brand dans `tailwind.config.js`
- Framer Motion 11.3.0 — animations de page via `<PageTransition>`
- Firebase SDK 12.12.1 — **installé, non encore initialisé**
- React Router DOM 6.24.1 — `ROUTES` / `buildRoute` systématiques

**Backend :**

- FastAPI + SQLite (`parcours.db`) + venv Python dans `backend/monenv/`
- `firebase-admin` : **non installé** — à ajouter dans `requirements.txt`
- Système auth actuel : `backend/auth.py` avec `verify_token()` fake (commentaire `JALON 7` en place)

**Tests :**

- Vitest 4.1.5, environnement `node`, tests dans `src/__tests__/`

### Empreinte des changements Jalon 7

| Fichier | Action | Impact |
|---|---|---|
| `src/services/firebaseService.js` | **Créer** | Nouveau singleton |
| `src/context/AuthContext.jsx` | **Créer** | Nouveau contexte |
| `src/services/profileService.js` | **Réécrire** | Interface gelée |
| `src/hooks/useProfile.js` | **Modifier** | Souscription Firebase |
| `src/screens/ProfileSelect/ProfileSelectScreen.jsx` | **Réécrire** | Google OAuth |
| `backend/auth.py` | **Réécrire** | `firebase-admin` |
| `backend/firebase_setup.py` | **Créer** | Init lifespan |
| `backend/dependencies/auth.py` | **Créer** | `HTTPBearer` dep |
| `backend/scripts/set_admin_claim.py` | **Créer** | CLI admin |
| `main.jsx` | **Modifier** | Wrapping `AuthProvider` |
| `backend/requirements.txt` | **Modifier** | `firebase-admin>=6.4.0` |

---

## Décisions architecturales — Jalon 7

### Analyse des priorités

**Décisions critiques (bloquent l'implémentation) :**
- D1 : Migration complète Authorization Bearer header sur tous les endpoints
- D2 : Création de `backendService.js` avec `authenticatedFetch()`

**Décisions importantes (façonnent l'architecture) :**
- D3 : Suppression de `fakeUsers.js` après grep de confirmation
- D4 : Migration de `@app.on_event("startup")` vers `lifespan=`

**Décisions différées :**
- `storageService.js` centralisé (préparation Jalon 8) — hors scope Jalon 7

---

### Authentification & Sécurité

**D1 — Transport du token : `Authorization: Bearer` header**
- Décision : **A** — migration complète sur tous les endpoints en Jalon 7
- Rationale : `body.token` dans un modèle Pydantic = token dans le payload métier, structurellement faux. L'API standard HTTP (Bearer header) prépare Jalon 8 Android WebView sans hack supplémentaire.
- Impact backend : retirer `token: str` de chaque Pydantic model dans `progress.py` et `ai_correction.py` ; centraliser dans `Depends(verify_firebase_token)` via `HTTPBearer`
- Impact frontend : tous les appels backend passent par `backendService.authenticatedFetch()` (voir D2)

**Custom Claims Firebase pour les rôles admin**
- Décision : Firebase Custom Claims (`role: "admin"`)
- Script CLI : `backend/scripts/set_admin_claim.py`
- Propagation : visible dans le JWT après `getIdToken(true)`

**Secrets : jamais committés**
- `serviceAccountKey.json` : `backend/.env` uniquement
- Variables `VITE_FIREBASE_*` : publiques par nature (dans le bundle JS), documentées dans `.env.example`

---

### Architecture frontend

**D2 — `backendService.js` avec `authenticatedFetch()`**
- Décision : **A** — créer `src/services/backendService.js` en Jalon 7
- Interface :
  ```js
  authenticatedFetch(url, options)
    // récupère le token via getFirebaseToken() depuis profileService
    // injecte header Authorization: Bearer <jwt>
    // console.warn sur 401 (fire-and-forget, ne bloque pas l'UI)
  ```
- Rationale : conforme à la règle "toute communication réseau dans `src/services/`". Point unique de modification pour Jalon 8 WebView.

**Ordre de wrapping dans `main.jsx` (invariant critique)**
- `AuthProvider` → `<App />` → `AppContext`
- `AuthProvider` bloque le rendu pendant l'hydratation Firebase (~100-300ms)
- Si inversé : `AppContext` initialise `user` via `getCurrentUser()` avant Firebase → redirections fantômes

**Cache module-level dans `profileService.js`**
- `let _user = undefined` dans `profileService.js` (hors React, hors `useEffect`)
- Immune au double-fire React 18 Strict Mode
- `getCurrentUser()` retourne `_user ?? null` — synchrone, stable

---

### Architecture backend

**D4 — Migration FastAPI `lifespan=`**
- Décision : **A** — migrer `@app.on_event("startup")` vers `lifespan=` en Jalon 7
- Rationale : `@app.on_event` est déprécié depuis FastAPI 0.93. Empiler un second handler = ordre non garanti + warnings en prod. `lifespan=` consolide startup Firebase + logging en un seul endroit ordonné.
- Fichier : `backend/main.py`

**Nouveaux fichiers backend**
- `backend/firebase_setup.py` : init `firebase_admin` avec guard double-init (hot-reload uvicorn)
- `backend/dependencies/auth.py` : dépendance `verify_firebase_token` via `HTTPBearer` + `asyncio.to_thread`
- `backend/scripts/set_admin_claim.py` : CLI attribution Custom Claim admin
- `SKIP_FIREBASE_AUTH=true` conservé pendant la transition, retiré après validation E2E

---

### Nettoyage des artifacts fake

**D3 — Suppression de `fakeUsers.js`**
- Décision : **A** — grep + suppression
- Procédure : `grep -r "fakeUsers\|FAKE_USERS" src/` avant toute suppression
- Si `ElevesPanel.jsx` (debug dashboard) en dépend → story séparée, pas un bloqueur
- Clé `localStorage` `parcours_current_user` : purger après premier login Firebase réussi

---

### Séquence d'implémentation

1. `firebaseService.js` + variables d'env `.env.local`
2. `AuthContext.jsx` + wrapping `main.jsx`
3. `profileService.js` (réécriture, interface gelée)
4. `backendService.js` (`authenticatedFetch`)
5. `useProfile.js` (adaptation)
6. `ProfileSelectScreen` (rewrite Google OAuth)
7. `backend/firebase_setup.py` + `dependencies/auth.py`
8. Migration `lifespan=` dans `main.py`
9. Migration Bearer header dans tous les routers
10. Suppression `fakeUsers.js` (après grep)
11. `set_admin_claim.py`

### Dépendances entre décisions

- D1 (Bearer header) dépend de D2 (`backendService.js`) — D2 doit être implémenté avant que D1 soit activé côté frontend
- `AuthContext` doit exister avant la réécriture de `profileService` (import `firebaseService` partagé)
- La migration `lifespan=` (D4) doit précéder l'ajout de `firebase_setup` dans le startup

---

## Patterns d'implémentation & règles de cohérence

**Points de conflit identifiés : 7 zones** où des agents pourraient faire des choix incompatibles.

---

### Pattern 1 — Initialisation Firebase

**Règle :** `src/services/firebaseService.js` est le **seul** fichier autorisé à appeler `initializeApp()`.

```js
// ✅ Correct — importer auth depuis le singleton
import { auth } from './firebaseService'

// ❌ Interdit — double init Firebase
import { initializeApp } from 'firebase/app'
const app = initializeApp(config)
```

`firebaseService.js` exporte uniquement `auth`. Aucune logique métier dans ce fichier.

---

### Pattern 2 — Mapping utilisateur Firebase

**Règle :** `_mapFirebaseUser` existe uniquement dans `profileService.js`. Champs canoniques :

| Champ | Source | Règle |
|---|---|---|
| `uid` | `fbUser.uid` | Obligatoire |
| `pseudo` | `fbUser.displayName ?? fbUser.email?.split('@')[0]` | Fallback email |
| `role` | `fbUser.customClaims?.role ?? 'student'` | Défaut student |
| `avatar` | Toujours `'avatar-01'` | **Jamais `fbUser.photoURL`** |
| `email` | `fbUser.email` | Peut être null |

`avatar` est **toujours** `'avatar-01'` — la photo Google n'est jamais utilisée.

---

### Pattern 3 — `authenticatedFetch` dans `backendService.js`

**Règle :** token toujours en header `Authorization: Bearer`, jamais en body ni en query param.

```js
// ✅ Correct
headers: { 'Authorization': `Bearer ${token}` }

// ❌ Interdit — anciens patterns supprimés
body: JSON.stringify({ token, ...payload })
headers: { 'Authorization': token }  // manque le prefix Bearer
```

**Quand `getFirebaseToken()` retourne `null` :** fire-and-forget, `console.warn`, ne bloque pas l'UI.

```js
if (!token) {
  console.warn('authenticatedFetch : token null, appel ignoré')
  return
}
```

---

### Pattern 4 — 3 états de l'`AuthProvider` (critique)

**Règle :** initialiser à `undefined`, jamais à `null`.

| Valeur | Signification | Comportement |
|---|---|---|
| `undefined` | Firebase pas encore répondu | Spinner — **aucun enfant rendus** |
| `null` | Connu : déconnecté | App affichée, navigation gère |
| objet FirebaseUser | Connu : connecté | App affichée normalement |

```js
// ✅ Correct
const [firebaseUser, setFirebaseUser] = useState(undefined)

// ❌ Interdit — confond "pas encore connu" et "déconnecté"
const [firebaseUser, setFirebaseUser] = useState(null)
```

---

### Pattern 5 — Gestion erreurs OAuth dans `ProfileSelectScreen`

**Règle :** jamais afficher `err.code` ou `err.message` Firebase brut dans l'UI.

| Code Firebase | Message utilisateur | Log |
|---|---|---|
| `auth/popup-closed-by-user`, `auth/user-cancelled` | Message neutre | Aucun |
| `auth/popup-blocked` | "Autorisez les popups dans votre navigateur" | `console.warn` |
| `auth/network-request-failed` | "Vérifiez votre connexion réseau" | `console.warn` |
| Autres | Message générique | `console.error(err.code, err.message)` |

---

### Pattern 6 — `clearCurrentUser()` sans await dans le chemin critique

```js
// ✅ Correct — fire-and-forget, onAuthStateChanged met _user à null
logout()
navigate(ROUTES.PROFILE_SELECT)

// ❌ Interdit dans le chemin de navigation
await clearCurrentUser()
navigate(ROUTES.PROFILE_SELECT)
```

---

### Pattern 7 — Cleanup localStorage au premier login Firebase

**Règle :** purger `parcours_current_user` dans `profileService.js` uniquement, dans le listener `onAuthStateChanged`.

```js
onAuthStateChanged(auth, (firebaseUser) => {
  if (firebaseUser) {
    localStorage.removeItem('parcours_current_user')  // purge clé fake
  }
  _user = firebaseUser ? _mapFirebaseUser(firebaseUser) : null
})
```

Aucun autre fichier n'accède à `parcours_current_user`.

---

### Règles obligatoires — tous les agents

**MUST :**
- Importer `auth` depuis `./firebaseService` uniquement
- Utiliser `getCurrentUser()`, jamais `localStorage.getItem('parcours_current_user')`
- Passer par `backendService.authenticatedFetch()` pour tout appel authentifié
- Distinguer `undefined` / `null` / objet dans les états auth
- Mapper les codes Firebase avant tout affichage utilisateur

**MUST NOT :**
- Jamais lire `fbUser.photoURL` pour l'avatar
- Jamais passer le token en `body.token` (pattern supprimé)
- Jamais appeler `initializeApp()` hors de `firebaseService.js`
- Jamais importer `getFirebaseToken()` dans un composant
- Jamais initialiser l'état Firebase à `null` (utiliser `undefined`)

---

## Structure du projet & frontières — Jalon 7

### Arborescence — delta Jalon 7

```
src/
├── services/
│   ├── firebaseService.js          ← NOUVEAU — singleton Firebase
│   ├── profileService.js           ← MODIFIÉ — réécriture complète, interface gelée
│   ├── backendService.js           ← NOUVEAU — authenticatedFetch(url, options)
│   └── ...                         (autres services inchangés)
│
├── context/
│   ├── AuthContext.jsx             ← NOUVEAU — AuthProvider + useFirebaseUser()
│   └── ...                         (AppContext, EventContext inchangés)
│
├── hooks/
│   ├── useProfile.js               ← MODIFIÉ — souscription onAuthStateChanged
│   └── ...
│
├── screens/
│   └── ProfileSelect/
│       └── ProfileSelectScreen.jsx ← MODIFIÉ — rewrite Google OAuth
│
├── data/
│   └── fakeUsers.js               ← SUPPRIMÉ (après grep de confirmation)
│
└── main.jsx                       ← MODIFIÉ — AuthProvider comme wrapper racine

backend/
├── main.py                        ← MODIFIÉ — migration lifespan=
├── auth.py                        ← MODIFIÉ — réécriture verify_token → Firebase
├── firebase_setup.py              ← NOUVEAU — init firebase_admin
├── requirements.txt               ← MODIFIÉ — firebase-admin>=6.4.0
├── .env.example                   ← MODIFIÉ — FIREBASE_SERVICE_ACCOUNT_KEY
├── dependencies/
│   ├── __init__.py                ← NOUVEAU
│   └── auth.py                    ← NOUVEAU — verify_firebase_token via HTTPBearer
├── routers/
│   ├── progress.py                ← MODIFIÉ — retirer body.token, Depends(verify_firebase_token)
│   └── ai_correction.py           ← MODIFIÉ — idem
└── scripts/
    └── set_admin_claim.py         ← NOUVEAU — CLI Custom Claims admin
```

### Frontières architecturales

**Frontière 1 — Initialisation Firebase**
```
firebaseService.js
    └── initializeApp() ← point d'entrée unique
    └── export auth     ← consommé par profileService.js et AuthContext.jsx
```

**Frontière 2 — Identité utilisateur (lecture)**
```
FirebaseAuth (IndexedDB)
    └── onAuthStateChanged → profileService.js (_user cache module-level)
                          → AuthContext.jsx (firebaseUser state React)

profileService.js
    └── getCurrentUser()   → useProfile.js, screens, services
    └── getFirebaseToken() → backendService.js uniquement
```

**Frontière 3 — Appels backend authentifiés**
```
services/*.js
    └── backendService.authenticatedFetch(url, options)
            └── profileService.getFirebaseToken()
            └── fetch(url, { headers: { Authorization: 'Bearer <jwt>' } })

backend/dependencies/auth.py
    └── verify_firebase_token(Depends(bearer))
            └── asyncio.to_thread(firebase_admin.auth.verify_id_token, token)
```

**Frontière 4 — Cycle de vie React (invariant critique)**
```
main.jsx
└── <AuthProvider>       ← bloque le rendu, état undefined → null/user
    └── <App />
        └── <AppContext> ← s'initialise après Firebase, getCurrentUser() fiable
            └── <Routes>
```

### Mapping exigences → fichiers

| FR | Fichiers |
|---|---|
| FR-1 | `src/services/firebaseService.js` |
| FR-2 | `src/context/AuthContext.jsx`, `main.jsx` |
| FR-3 | `src/services/profileService.js` |
| FR-4 | `src/hooks/useProfile.js` |
| FR-5 | `src/screens/ProfileSelect/ProfileSelectScreen.jsx` |
| FR-6 | `backend/firebase_setup.py`, `backend/dependencies/auth.py`, `backend/auth.py`, `backend/routers/*.py`, `backend/main.py` |
| FR-7 | `src/data/fakeUsers.js` (supprimé), `profileService.js` (purge localStorage) |
| D2 | `src/services/backendService.js` |

### Flux de données — première connexion

```
1. AuthProvider → état undefined → SplashScreen affiché
2. Firebase hydrate IndexedDB (~100-300ms)
3. onAuthStateChanged → AuthProvider → null (déconnecté)
4. App rend → ProfileSelectScreen
5. signInWithGoogle() → signInWithPopup() → popup OAuth
6. onAuthStateChanged → AuthProvider → FirebaseUser
   ├── profileService._user mis à jour
   └── localStorage.removeItem('parcours_current_user')
7. useProfile.setUser() → navigate(ROUTES.SUBJECTS)
```

### Flux de données — appel backend authentifié

```
progressService.saveStep()
    └── backendService.authenticatedFetch('/api/progress/step', options)
        ├── getFirebaseToken() → auth.currentUser.getIdToken() (auto-refresh)
        └── fetch(url, { Authorization: 'Bearer <jwt>' })
            └── verify_firebase_token → firebase_admin.auth.verify_id_token()
                └── retourne { uid, email, role }
```

---

## Validation de l'architecture

### Cohérence — Compatibilité des décisions

| Vérification | Résultat |
|---|---|
| Firebase SDK 12.12.1 + React 18 + Vite 5 ESM | ✅ |
| `onAuthStateChanged` module-level vs React 18 Strict Mode | ✅ Immune (hors `useEffect`) |
| `HTTPBearer` + `asyncio.to_thread` + FastAPI async | ✅ |
| `lifespan=` disponible (FastAPI ≥ 0.93) | ✅ |
| `firebase-admin>=6.4.0` + venv Python existant | ✅ |
| Nommage : `firebaseService.js`, `backendService.js` (camelCase, `.js`) | ✅ |
| `AuthContext.jsx` (PascalCase, `.jsx`) | ✅ Contient du JSX |

### Couverture des exigences

| Exigence | Statut |
|---|---|
| FR-1 à FR-7 | ✅ Tous couverts |
| NFR-1 Interface gelée | ✅ 4 fonctions gelées documentées |
| NFR-2 Hydratation invisible | ✅ `undefined` → spinner |
| NFR-3 Avatar stable | ✅ `'avatar-01'` toujours |
| NFR-4 Tests sans régression | ⚠️ Gap documenté ci-dessous |
| NFR-5 Frontend sans backend | ✅ Fire-and-forget, `warn` si token null |
| NFR-6 Sécurité secrets | ✅ `.env.example` documenté |

### Gap Analysis

**Gap documenté — NFR-4 : mock Firebase pour Vitest**

`profileService.js` appelle `onAuthStateChanged(auth, ...)` au niveau module. Dans Vitest (environnement `node`), l'import de `firebaseService.js` sans variables d'env → erreur. Pattern de mock obligatoire dans tout test qui importe un service dépendant de `profileService` :

```js
vi.mock('../services/firebaseService', () => ({
  auth: { currentUser: null }
}))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => { cb(null); return () => {} }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  GoogleAuthProvider: vi.fn(),
}))
```

À documenter dans `project-context.md` §8 après Jalon 7.

**Gap mineur — `ai_correction.py`**

Non inspecté — l'agent d'implémentation doit vérifier et appliquer la migration Bearer header de la même façon que `progress.py`.

### Checklist de complétude

- [x] Contexte projet analysé
- [x] Échelle et complexité évaluées
- [x] Contraintes techniques identifiées
- [x] Préoccupations transverses cartographiées
- [x] Décisions critiques documentées
- [x] Stack technique spécifiée
- [x] Patterns d'intégration définis
- [x] Sécurité couverte
- [x] Conventions de nommage établies
- [x] Patterns de structure définis
- [x] Patterns de communication spécifiés
- [x] Patterns de processus documentés
- [x] Arborescence complète définie
- [x] Frontières entre composants établies
- [x] Points d'intégration cartographiés
- [x] Mapping exigences → fichiers complet

### Évaluation de maturité

**Statut : PRÊT POUR L'IMPLÉMENTATION** — gap NFR-4 documenté, non bloquant (mock pattern fourni)

**Niveau de confiance : Élevé**

**Points forts :**
- Interface gelée strictement respectée — zéro impact sur les ~15 callsites existants
- Pattern `undefined/null/objet` élimine le flash déconnecté
- `backendService.js` prépare Jalon 8 Android (point unique de modification)
- Migration Bearer header propre — dette nulle introduite

**À traiter après Jalon 7 :**
- Mettre à jour `project-context.md` §8 avec le pattern de mock Firebase
- Inspecter `ai_correction.py` avant implémentation
- Planifier `storageService.js` avant Jalon 8
