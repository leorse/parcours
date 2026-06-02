---
title: "Jalon 7 — Firebase Auth pour ParcCours"
status: final
created: 2026-05-29
updated: 2026-05-29
---

# PRD — Jalon 7 : Firebase Auth

## 1. Contexte et problème

ParcCours utilise depuis le Jalon 4 une authentification factice : deux profils prédéfinis (`FAKE_USERS`) stockés dans `localStorage`, sans identité réelle. Cette dette permet de développer sans dépendance réseau, mais bloque :

- Toute progression cross-device réelle (uid fake non portable)
- La synchronisation backend (le token est `'fake-token-...'`, ignoré côté FastAPI avec `SKIP_FIREBASE_AUTH=true`)
- L'accès administrateur sécurisé (le rôle `admin` est hardcodé dans `fakeUsers.js`)

Le Jalon 7 remplace ce système par **Firebase Auth avec Google OAuth**, tout en gelant l'interface publique de `profileService.js` pour que les ~15 callsites existants n'aient pas à changer.

---

## 2. Objectifs

- Remplacer l'auth fake (localStorage + FAKE_USERS) par Firebase Auth — Google OAuth
- Préserver sans modification l'interface publique de `profileService.js`
- Activer la vérification réelle des JWT Firebase côté backend FastAPI
- Identifier les admins via Firebase Custom Claims (`role: "admin"`)
- Poser les bases contractuelles pour la compatibilité Jalon 8 Android (token Firebase portable)

---

## 3. Non-objectifs (Jalon 7)

- Anonymous auth / connexion invité
- Email/Password auth
- Google OAuth en mode WebView Android (hors scope Jalon 7 — voir risque R1)
- Migration des données de progression existantes — Jalon 7 repart de zéro
- Firestore, Firebase Storage, Cloud Functions
- Internationalisation des messages d'erreur Firebase

---

## 4. Contrainte critique — interface publique gelée

Les quatre fonctions suivantes dans `src/services/profileService.js` ne changent **pas de signature** ni de sémantique observable :

| Fonction | Signature | Contrat |
|---|---|---|
| `getCurrentUser()` | `() → objet \| null` | Synchrone. Retourne l'utilisateur courant ou `null`. |
| `getFirebaseToken()` | `() → Promise<string \| null>` | Async. Retourne le JWT Firebase (auto-refreshé) ou `null`. |
| `clearCurrentUser()` | `() → Promise` | Déconnecte l'utilisateur. Retournait `void`; retourne désormais une Promise — les appelants qui ne l'awaitent pas ne sont pas impactés. |
| `isAdmin(user)` | `(user) → boolean` | Synchrone. Vrai si `user?.role === 'admin'`. |

`setCurrentUser(userKey)` est **supprimée** — elle n'est pas dans l'interface gelée et n'est appelée que depuis `ProfileSelectScreen` (à réécrire intégralement).

---

## 5. Utilisateurs et parcours clés

### UJ-1 — Première connexion

**Protagoniste :** Léa, professeure des écoles, premier lancement de l'app.

1. **SplashScreen** — l'app détecte qu'aucun utilisateur Firebase n'est en session → redirige vers `ProfileSelectScreen`.
2. **ProfileSelectScreen** — Léa voit un bouton "Se connecter avec Google". Elle clique.
3. **Popup OAuth Google** — Léa sélectionne son compte Google. La popup se ferme.
4. `onAuthStateChanged` se déclenche → `_user` mis à jour dans `profileService` → `useProfile` met à jour l'état React.
5. L'app navigue automatiquement vers `SUBJECTS`.

**Cas d'échec :** Léa ferme la popup sans choisir → message neutre ("Connexion annulée"), elle reste sur `ProfileSelectScreen`. Pas d'erreur technique visible.

---

### UJ-2 — Visite suivante (session persistée)

**Protagoniste :** Léa, qui revient le lendemain.

1. **SplashScreen** — Firebase charge la session depuis IndexedDB (~100-300 ms).
2. L'`AuthProvider` bloque le rendu pendant l'hydratation (spinner ou SplashScreen existant).
3. Une fois l'état connu : `getCurrentUser()` retourne Léa → navigation normale, `ProfileSelectScreen` n'est pas affiché.

---

### UJ-3 — Déconnexion

1. Léa navigue vers `ProfileScreen` → bouton "Déconnexion".
2. `clearCurrentUser()` est appelé → `signOut(auth)` → `onAuthStateChanged` notifie `null`.
3. L'app redirige vers `ProfileSelectScreen`.

---

## 6. Exigences fonctionnelles

### FR-1 : Singleton Firebase (`firebaseService.js`)

**Nouveau fichier :** `src/services/firebaseService.js`

- Appelle `initializeApp(firebaseConfig)` une seule fois au niveau module (singleton ESM).
- Exporte `auth` (instance Firebase Auth obtenue via `getAuth(app)`).
- Lit la configuration depuis les variables d'environnement `VITE_FIREBASE_*`.
- Ne contient aucune logique métier — uniquement l'initialisation.

**Variables d'env requises** (dans `.env.local`, non committé, à documenter dans `.env.example`) :

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Note : ces clés sont publiques par nature — elles se retrouvent dans le bundle JS côté client. La sécurité réelle repose sur les règles Firebase et la vérification backend du JWT.

---

### FR-2 : Contexte Auth React (`AuthContext.jsx`)

**Nouveau fichier :** `src/context/AuthContext.jsx`

- `AuthProvider` s'abonne à `onAuthStateChanged` dans un `useEffect` avec cleanup (`unsubscribe` au démontage — obligatoire en React 18 Strict Mode qui double-exécute les effects en dev).
- État interne : `undefined` (non encore connu) | `null` (déconnecté) | objet FirebaseUser (connecté).
- Tant que l'état est `undefined`, l'`AuthProvider` affiche le SplashScreen existant ou un spinner — **aucun enfant n'est affiché avant que Firebase ait répondu**.
- Exporte `useFirebaseUser()` pour usage interne dans `useProfile.js` (hook React uniquement — `profileService.js` étant un module plain JS, il gère son propre listener `onAuthStateChanged` indépendamment).
- `AuthProvider` est ajouté dans `main.jsx` comme wrapper le plus extérieur, **parent de `<App />`** et donc parent de `AppContext`.

---

### FR-3 : Réécriture de `profileService.js`

**Fichier modifié :** `src/services/profileService.js`

Le service maintient un **cache module-level synchrone** `_user` mis à jour par un listener `onAuthStateChanged` au niveau du module (hors de React, déclenché une seule fois à l'import).

**Mapping Firebase → objet utilisateur (`_mapFirebaseUser`) :**

| Champ retourné | Source Firebase |
|---|---|
| `uid` | `fbUser.uid` |
| `pseudo` | `fbUser.displayName ?? fbUser.email?.split('@')[0]` — conservé dans l'objet même s'il n'est pas encore affiché |
| `role` | `fbUser.customClaims?.role ?? 'student'` |
| `avatar` | Toujours `'avatar-01'` — la photo Google n'est pas utilisée |
| `email` | `fbUser.email` |

**Interface publique gelée :** identique au contrat défini en §4. `getCurrentUser()` retourne le cache synchrone `_user ?? null`.

**Nouvelles fonctions exportées** (hors interface gelée, consommées uniquement par `ProfileSelectScreen` et `useProfile`) :
- `signInWithGoogle()` → `signInWithPopup(auth, new GoogleAuthProvider())`

**Suppressions :** import de `FAKE_USERS`, `setCurrentUser(userKey)`, const `STORAGE_KEY`, lecture de `localStorage`.

---

### FR-4 : Adaptation de `useProfile.js`

**Fichier modifié :** `src/hooks/useProfile.js`

- `useEffect` souscrit à `onAuthStateChanged` pour maintenir l'état React local (`setUser`) en sync avec Firebase — remplace le bloc commenté `// JALON 7`.
- `login(userKey)` supprimé → `ProfileSelectScreen` appelle directement `signInWithGoogle()` depuis `profileService`.
- `logout()` appelle `clearCurrentUser()` (désormais async — compatible fire-and-forget, pas de `await` requis).
- `useState(() => getCurrentUser())` conservé pour l'initialisation synchrone — retourne `null` avant hydratation, mais `AuthProvider` bloque le rendu avant ce point, donc aucun flash de contenu déconnecté.

---

### FR-5 : Réécriture de `ProfileSelectScreen`

**Fichier modifié :** `src/screens/ProfileSelect/ProfileSelectScreen.jsx`

- Suppression complète des deux cartes `FAKE_USERS` (élève / admin) et du bouton "Réinitialiser la progression".
- Unique action principale : bouton **"Se connecter avec Google"** → appelle `signInWithGoogle()` depuis `profileService`.
- État de chargement pendant le popup (bouton désactivé + indicateur visuel).
- **Gestion des erreurs Firebase** à afficher à l'utilisateur :
  - `auth/popup-closed-by-user` ou `auth/user-cancelled` → message neutre, pas d'erreur technique
  - `auth/popup-blocked` → invitation à autoriser les popups dans le navigateur
  - `auth/network-request-failed` → message réseau
  - Autres erreurs → message générique + `console.error` du code Firebase
- Suppression des imports `FAKE_USERS`, `resetProgress`.
- Le bouton "Réinitialiser la progression" est supprimé de cet écran — il migrera vers la future page admin (hors scope Jalon 7).

---

### FR-6 : Backend FastAPI — vérification JWT

**Fichiers modifiés/créés :** `backend/`

- Ajouter `firebase-admin>=6.4.0` dans `backend/requirements.txt`.
- **`backend/firebase_setup.py`** : initialisation `firebase_admin` au démarrage via le lifespan FastAPI. Guard contre double-init (hot-reload uvicorn).
- **`backend/dependencies/auth.py`** : dépendance FastAPI `verify_firebase_token` — `auth.verify_id_token()` appelé via `asyncio.to_thread` pour ne pas bloquer la boucle async. Gestion explicite de `ExpiredIdTokenError`, `RevokedIdTokenError`, `UserDisabledError`, `InvalidIdTokenError`.
- Routes protégées : remplacer le middleware factice par `Depends(verify_firebase_token)`.
- `SKIP_FIREBASE_AUTH=true` conservé en dev pendant la transition — à retirer après validation E2E complète.
- **Variable d'env backend** : `FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json` (dans `backend/.env`, jamais committé).

**Promotion admin :** fournir un script CLI `backend/scripts/set_admin_claim.py` pour attribuer le Custom Claim `{"role": "admin"}` à un uid Firebase via `auth.set_custom_user_claims()`. Le claim est visible dans le JWT après le prochain `getIdToken(true)`.

---

### FR-7 : Nettoyage des artifacts fake

- **Avant toute suppression** : grep de `FAKE_USERS`, `fakeUsers`, `setCurrentUser`, `parcours_current_user` dans `src/` pour recenser tous les callsites.
- `src/data/fakeUsers.js` : conservé **uniquement** si `src/debug/panels/ElevesPanel.jsx` (dashboard debug, DEV uniquement) en a besoin — sinon supprimé.
- Supprimer la clé `localStorage` `parcours_current_user` après connexion Firebase réussie (nettoyage de la session fake résiduelle).
- Supprimer les commentaires `// JALON 7` une fois les blocs correspondants implémentés (règle project-context.md §10).

---

## 7. Exigences non-fonctionnelles

### NFR-1 : Interface publique gelée (critique)

Aucun écran ni composant existant (hors `ProfileSelectScreen` et `useProfile.js`) ne doit être modifié pour consommer l'authentification Firebase. Les callsites hors-service documentés comme dette (`FreeTextExercise.jsx`, `ProfileScreen.jsx`) restent fonctionnels sans changement.

### NFR-2 : Hydratation invisible

L'`AuthProvider` absorbe le délai d'hydratation Firebase (~100-300 ms). L'utilisateur ne voit jamais un flash de contenu "déconnecté" suivi d'une redirection : soit il voit le spinner/SplashScreen, soit il voit directement son contenu.

### NFR-3 : Champ `avatar` — sémantique inchangée

`avatar` est toujours `'avatar-01'` (clé locale). La photo Google n'est pas utilisée. Les composants existants qui affichent l'avatar n'ont pas à changer.

### NFR-4 : Tests sans régression

- `npm test` (Vitest) passe sans modification des tests existants.
- `npm run build` passe (tests + build Vite).
- Les services qui exposent des variantes synchrones pour les tests (`xpService`, `badgeService`) ne sont pas impactés.

### NFR-5 : Frontend sans backend

L'authentification Firebase est entièrement côté client. Le frontend reste fonctionnel sans backend (les appels `progressService` échouent silencieusement). Cette règle core du projet n'est pas modifiée.

### NFR-6 : Sécurité des secrets

- `serviceAccountKey.json` ne doit jamais être committé dans git.
- Les variables `VITE_FIREBASE_*` sont publiques par nature — acceptable, documenté dans `FR-1`.
- Le JWT Firebase n'est jamais stocké dans `localStorage` — Firebase gère sa persistance via IndexedDB.

---

## 8. Risques

| # | Risque | Sévérité | Mitigation |
|---|---|---|---|
| R1 | **Google `signInWithPopup` bloqué en WebView Android** (Jalon 8) | Élevée | Jalon 7 est web-only — acceptable. Pour Jalon 8 : `signInWithRedirect` dans la WebView, ou auth native Kotlin + injection du token via `evaluateJavascript`. À traiter dans le PRD Jalon 8. |
| R2 | **`AppContext.jsx` initialise `user` depuis `getCurrentUser()`** avant hydratation Firebase | Moyenne | `AuthProvider` doit être **parent** de `<App />` dans `main.jsx`, donc parent de `AppContext`. Ordre de wrapping critique. |
| R3 | **Redirections fantômes** si un composant lit `getCurrentUser()` hors du périmètre `AuthProvider` | Faible | `AuthProvider` bloque le rendu. Risque résiduel uniquement si un composant est rendu hors de l'arbre `AuthProvider`. |
| R4 | **`fakeUsers.js` dans le debug dashboard** (`ElevesPanel.jsx`) | Faible | Inspecter avant suppression. Conserver en DEV si nécessaire. |
| R5 | **Accès admin en production** : le Custom Claim `role: admin` doit être attribué manuellement via le script `set_admin_claim.py`. Aucune UI d'administration n'existe encore. | Faible | S'assurer que le script est testé et documenté avant la mise en prod. |

---

## 9. Métriques de succès

| Métrique | Type |
|---|---|
| `npm run build` passe sans erreur | Bloquante |
| `npm test` : zéro régression | Bloquante |
| Token JWT retourné par `getFirebaseToken()` est valide (vérifiable sur jwt.io) | Bloquante |
| Backend : `verify_firebase_token` valide le JWT avec `SKIP_FIREBASE_AUTH=false` | Bloquante |
| Session restaurée depuis IndexedDB après rechargement de page (pas d'écran de connexion) | Bloquante |
| `getCurrentUser()` retourne `null` après `clearCurrentUser()` | Bloquante |
| Aucun callsite hors `profileService.js` modifié (sauf `ProfileSelectScreen` et `useProfile.js`) | Cible qualité |

**Contre-métriques :** aucune régression de temps de démarrage perceptible par l'utilisateur (hydratation Firebase absorbée par le spinner existant).

---

*Artifact : `_bmad-output/planning-artifacts/prds/prd-ParcCours-2026-05-29/prd.md`*
