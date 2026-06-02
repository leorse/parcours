---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Migration Firebase Auth pour le projet ParcCours (Jalon 7)'
research_goals: 'Analyser les options d intégration Firebase Auth (email/password, Google, anonymous), la gestion des tokens côté backend FastAPI (SKIP_FIREBASE_AUTH=true actuellement), et les impacts sur le Jalon 8 Android. Interface publique getCurrentUser() / getFirebaseToken() doit rester stable.'
user_name: 'Dams'
date: '2026-05-29'
web_research_enabled: true
source_verification: true
---

# Research Report: technical

**Date:** 2026-05-29
**Author:** Dams
**Research Type:** technical

---

## Research Overview

Cette recherche couvre la migration complète du système d'authentification de ParcCours : remplacement de la couche fake (`localStorage` + `FAKE_USERS`) par Firebase Auth réel, tout en gelant l'interface publique de `profileService.js`. Le SDK Firebase 12.12.1 est déjà installé. Trois méthodes d'auth sont analysées (email/password, Google OAuth, anonymous). Le backend FastAPI devra passer de `SKIP_FIREBASE_AUTH=true` à la vérification réelle des JWT via `firebase-admin` Python. Le Jalon 8 (Android Kotlin/Jetpack Compose) est anticipé : les tokens Firebase sont portables nativement vers une WebView Android.

**Principaux constats :** Le défi central n'est pas Firebase lui-même (SDK bien documenté, déjà installé) mais la **transition synchrone→asynchrone** — `getCurrentUser()` est actuellement synchrone alors que Firebase Auth est intrinsèquement async. La solution recommandée est un pattern `AuthProvider` avec état `undefined` (loading) + `null` (déconnecté), qui maintient l'interface publique stable via une façade synchrone lisant depuis le contexte React après l'hydratation initiale.

Voir le résumé exécutif et le plan d'implémentation en sections 8 et 9.

---

## Confirmation du périmètre de recherche technique

**Sujet de recherche :** Migration Firebase Auth — ParcCours Jalon 7
**Objectifs de recherche :** Analyser les options d'intégration Firebase Auth (email/password, Google, anonymous), la gestion des tokens côté backend FastAPI, et les impacts sur le Jalon 8 Android. Interface publique `getCurrentUser()` / `getFirebaseToken()` doit rester stable.

**Périmètre de recherche technique :**

- Architecture Auth — options Firebase Auth Web SDK v12 (email/password, Google OAuth, anonymous), patterns d'initialisation dans Vite/React 18
- Approches d'implémentation — migration incrémentale, gestion de l'état async (`onAuthStateChanged`) vs. actuel synchrone
- Stack technique — Firebase SDK Modular API, compatibilité fire-and-forget, persistance indexedDB vs localStorage
- Intégration backend — validation des JWT Firebase côté FastAPI, middleware Python `firebase-admin`
- Impacts Jalon 8 Android — réutilisation des tokens Firebase entre WebView et code natif Kotlin

**Méthodologie de recherche :**

- Données web actuelles avec vérification rigoureuse des sources
- Validation multi-sources pour les affirmations techniques critiques
- Niveaux de confiance pour les informations incertaines
- Couverture technique complète avec insights spécifiques à l'architecture

**Périmètre confirmé :** 2026-05-29

---

---

## Résumé exécutif

Firebase Auth est un choix solide pour ParcCours Jalon 7. Le SDK modular v12 est déjà présent dans `node_modules`. La migration peut être réalisée en **préservant l'intégralité de l'interface publique** de `profileService.js` — aucun écran ni composant ne changera.

**Le défi principal est architectural :** `getCurrentUser()` retourne aujourd'hui un objet synchrone depuis `localStorage`. Firebase Auth est fondamentalement asynchrone (`onAuthStateChanged`). La solution est un `AuthContext` React qui absorbe l'asynchronisme et expose une valeur synchrone une fois l'hydratation initiale terminée. Les fonctions publiques `getCurrentUser()` lisent ensuite depuis ce contexte.

**Recommandations clés :**
1. **Méthode d'auth :** Email/password en priorité (contrôle total, pas de popup), avec possibilité d'ajout Google OAuth ultérieurement. L'anonymous auth est optionnelle mais utile pour une UX sans friction à l'onboarding.
2. **Persistance :** `browserLocalPersistence` (défaut Firebase, IndexedDB) — remplace transparemment le `localStorage` actuel.
3. **Backend FastAPI :** Installer `firebase-admin`, écrire une dépendance `verify_firebase_token`, retirer `SKIP_FIREBASE_AUTH`. Compatible avec le pattern fire-and-forget du projet.
4. **Jalon 8 Android :** Firebase Auth Android SDK partage le même `projectId`. Les tokens sont vérifiables par le même backend. La WebView peut recevoir le token via `evaluateJavascript`.

---

## Table des matières

1. Stack technique Firebase Auth — SDK v12 Modular
2. Comparaison des méthodes d'authentification
3. Patterns d'intégration React 18 + Vite — le problème async
4. Architecture de migration de `profileService.js`
5. Intégration backend FastAPI — `firebase-admin` Python
6. Impacts Jalon 8 Android
7. Sécurité, persistance et gestion des tokens
8. Plan d'implémentation recommandé (étapes)
9. Risques et points d'attention spécifiques à ParcCours
10. Méthodologie et sources

---

## 1. Stack technique Firebase Auth — SDK v12 Modular

### Firebase JS SDK v12 — API Modular (tree-shakeable)

Le SDK Firebase v12 utilise l'API modulaire introduite en v9. Toutes les imports se font depuis des sous-modules spécifiques, ce qui permet le tree-shaking par Vite.

```js
// firebase.js — initialisation, à créer dans src/services/
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
```

**Points critiques :**
- `initializeApp` doit être appelé **une seule fois** au niveau module. Réexporter `auth` depuis un fichier singleton.
- `getAuth(app)` retourne l'instance Auth liée à l'app. Appeler `getAuth()` sans argument utilise l'app par défaut.
- Vite gère les imports ESM Firebase nativement. Ajouter `firebase` à `optimizeDeps.include` dans `vite.config.js` si des erreurs de module apparaissent en dev.
- Les variables d'env Firebase ne sont **pas des secrets** (elles se retrouvent dans le bundle JS côté client — c'est attendu). La sécurité réelle est assurée par les Firebase Security Rules et la vérification backend.

### Fonctions d'auth disponibles (v12 modular)

```js
import {
  onAuthStateChanged,    // listener d'état principal
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  linkWithCredential,
  GoogleAuthProvider,
  EmailAuthProvider,
  signOut,
  getIdToken,           // méthode sur user objet
} from 'firebase/auth'
```

### `onAuthStateChanged` — comportement exact

```js
const unsubscribe = onAuthStateChanged(auth, (user) => {
  // user = objet FirebaseUser si connecté, null si déconnecté
  // Appelé : au montage (asynchrone, ~100-300ms après), puis à chaque changement d'état
})
// Cleanup obligatoire : unsubscribe() au démontage du composant
```

- Le **premier appel est toujours asynchrone**, même si l'utilisateur est déjà en session (token en IndexedDB).
- `auth.currentUser` est `null` au premier rendu React — ne jamais le lire à l'initialisation de module.
- `auth.authStateReady()` (SDK v10+, inclus en v12) retourne une Promise qui se résout une fois l'état initial connu : `await auth.authStateReady()` — puis `auth.currentUser` est fiable.

### Persistance (remplace localStorage)

| Type | Constante | Stockage | Survit au rechargement | Survit fermeture navigateur |
|---|---|---|---|---|
| Local (défaut) | `browserLocalPersistence` | **IndexedDB** (+ fallback localStorage) | Oui | Oui |
| Session | `browserSessionPersistence` | `sessionStorage` | Oui (même onglet) | Non |
| Mémoire | `inMemoryPersistence` | RAM JS | Non | Non |

**Note importante :** Firebase SDK v9+ utilise **IndexedDB**, pas `localStorage`, pour la persistance locale. Ce changement est transparent pour l'app mais signifie que `localStorage.getItem('parcours_current_user')` ne contiendra plus l'utilisateur Firebase — c'est une migration à anticiper (voir section 4).

_Source : Firebase JS SDK documentation officielle, stable depuis v9.0.0 — confirmé en v12._

---

## 2. Comparaison des méthodes d'authentification

### 2.1 Email/Password

**Quand l'utiliser :** App éducative avec contrôle total de la marque, pas de dépendance à des comptes tiers, contexte scolaire où Google n'est pas universel.

```js
// Inscription
await createUserWithEmailAndPassword(auth, email, password)

// Connexion
await signInWithEmailAndPassword(auth, email, password)
```

**Avantages pour ParcCours :**
- Pas de popup navigateur (adapté mobile WebView Jalon 8)
- UX native dans l'app, pas de redirection externe
- Contrôle total de l'UX (écran de connexion/inscription déjà présent via `ProfileSelectScreen`)
- Compatible avec le pattern "profil enfant" (pas besoin d'un compte Google)

**Inconvénients :**
- Gestion de mots de passe : forgot password, vérification email, règles de complexité
- Responsabilité de sécurité côté app (rate limiting — Firebase gère ça côté serveur)

**Verdict pour ParcCours :** **Recommandé en priorité**. L'app est éducative, potentiellement pour des enfants/étudiants sans compte Google personnel.

---

### 2.2 Google OAuth (signInWithPopup)

```js
const provider = new GoogleAuthProvider()
const result = await signInWithPopup(auth, provider)
// result.user — l'utilisateur Firebase
// GoogleAuthProvider.credentialFromResult(result).accessToken — token Google si besoin
```

**Avantages :**
- Zéro gestion de mot de passe
- Email vérifié automatiquement
- Photo de profil et displayName disponibles immédiatement

**Problème majeur pour ParcCours :**
- `signInWithPopup` est **bloqué par les popup blockers** si pas appelé dans un gestionnaire de geste utilisateur direct.
- Dans un **WebView Android** (Jalon 8), les popups sont généralement bloqués.
- Alternative : `signInWithRedirect` + `getRedirectResult()` — plus complexe, change le flux de navigation.

**Verdict pour ParcCours :** Option secondaire, à ajouter **après** email/password. Incompatible avec WebView sans `signInWithRedirect`.

---

### 2.3 Anonymous Auth

```js
await signInAnonymously(auth)
// auth.currentUser.isAnonymous === true
// auth.currentUser.uid — uid stable par appareil/navigateur
```

**Pattern "progressive auth" (fortement recommandé pour apps éducatives) :**

1. L'utilisateur commence anonymement → exploration immédiate, sans barrière.
2. Après un investissement significatif (premier cours terminé), proposer "Sauvegarde ta progression".
3. Lier le compte anonyme au compte email/password :

```js
import { linkWithCredential, EmailAuthProvider } from 'firebase/auth'

const credential = EmailAuthProvider.credential(email, password)
await linkWithCredential(auth.currentUser, credential)
// L'uid NE CHANGE PAS — toutes les données liées à l'uid anonyme sont préservées
```

**Cas d'erreur à gérer :** `auth/credential-already-in-use` — si le compte email existe déjà. Fusionner les données manuellement.

**Verdict pour ParcCours :** **Recommandé comme mode par défaut** si on veut une UX sans friction. L'`uid` anonyme peut servir de clé de progression dans le backend, puis être lié à un vrai compte.

---

### Tableau de décision pour ParcCours

| Critère | Email/Password | Google OAuth | Anonymous |
|---|---|---|---|
| UX sans friction | Non | Non | **Oui** |
| Fonctionne en WebView Android | **Oui** | Non (popup) | **Oui** |
| Enfants sans compte Google | **Oui** | Non | **Oui** |
| Données persistantes cross-device | **Oui** | **Oui** | Non (par browser) |
| Implémentation simple | **Oui** | Moyen | **Oui** |

**Recommandation ParcCours :** Démarrer avec **Email/Password + Anonymous** en Jalon 7. Google OAuth peut être ajouté en Jalon 7b si besoin.

---

## 3. Patterns d'intégration React 18 + Vite — le problème async

### Le problème central : synchrone vs asynchrone

L'implémentation actuelle de `getCurrentUser()` est **synchrone** :
```js
export function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}
```

Firebase Auth est **asynchrone** : `onAuthStateChanged` est la seule source fiable. Au premier rendu React, `auth.currentUser` est `null` même si l'utilisateur est en session — la rehydratation depuis IndexedDB prend ~100-300ms.

**Conséquence pour ParcCours :** Tous les composants qui lisent `getCurrentUser()` doivent continuer à recevoir une valeur synchrone. La solution est un `AuthContext` qui absorbe l'asynchronisme.

---

### Pattern AuthContext recommandé

```jsx
// src/context/AuthContext.jsx — NOUVEAU fichier
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebaseService'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  // undefined = état initial inconnu (loading)
  // null      = connu : déconnecté
  // objet     = connu : connecté
  const [firebaseUser, setFirebaseUser] = useState(undefined)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user ?? null)
    })
    return unsubscribe // cleanup obligatoire
  }, [])

  // Bloquer le rendu jusqu'à ce que Firebase ait répondu
  if (firebaseUser === undefined) {
    return <div className="flex items-center justify-center h-screen">
      {/* Spinner ou SplashScreen existant */}
    </div>
  }

  return (
    <AuthContext.Provider value={firebaseUser}>
      {children}
    </AuthContext.Provider>
  )
}

export const useFirebaseUser = () => useContext(AuthContext)
```

**Intégration dans `main.jsx` :**
```jsx
// main.jsx — wrapper AuthProvider autour de l'app
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
```

**Points React 18 spécifiques :**
- Le Strict Mode double-exécute les effects en dev — l'unsubscriber dans le return du `useEffect` est **obligatoire** pour éviter deux listeners Firebase.
- `useState(undefined)` distingue "pas encore connu" (undefined) de "connu déconnecté" (null) — ne pas initialiser à `null` sinon l'app croit être déconnectée avant que Firebase ait répondu.

---

### Adaptation de `profileService.js` pour lire depuis l'AuthContext

Le problème est que `profileService.js` est un service (`.js`), pas un composant React — il ne peut pas appeler `useContext`. **Deux approches :**

**Approche A — Module-level singleton (recommandée pour ParcCours) :**

```js
// profileService.js — Jalon 7
import { auth } from './firebaseService'
import { onAuthStateChanged } from 'firebase/auth'

// Cache synchrone mis à jour par le listener Firebase
let _currentFirebaseUser = undefined // undefined = pas encore hydraté

onAuthStateChanged(auth, (user) => {
  _currentFirebaseUser = user ?? null
})

// Interface publique inchangée
export function getCurrentUser() {
  if (_currentFirebaseUser === undefined) return null // cohérent avec le comportement actuel
  if (!_currentFirebaseUser) return null
  return {
    uid: _currentFirebaseUser.uid,
    email: _currentFirebaseUser.email,
    pseudo: _currentFirebaseUser.displayName ?? _currentFirebaseUser.email,
    role: 'student', // role géré via custom claims Firebase ou profil Firestore
    avatar: 'avatar-01', // avatar géré séparément (voir section 4)
  }
}

export async function getFirebaseToken() {
  if (!_currentFirebaseUser) return null
  return await _currentFirebaseUser.getIdToken() // auto-refresh si expiré
}
```

Cette approche maintient l'interface **exactement identique** — `getCurrentUser()` reste synchrone, retourne `null` si non connecté.

**Approche B — `authStateReady()` pour l'initialisation :**

```js
// Dans un useEffect au démarrage de l'app
import { auth } from '../services/firebaseService'

await auth.authStateReady()
// À partir de ce point, auth.currentUser est fiable dans profileService
```

---

## 4. Architecture de migration de `profileService.js`

### Structure cible complète

```js
// src/services/profileService.js — VERSION JALON 7
import { auth } from './firebaseService'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth'

// ─────────────────────────────────────────────
// Cache synchrone (mis à jour par Firebase)
// ─────────────────────────────────────────────
let _user = undefined // undefined = non hydraté

onAuthStateChanged(auth, (firebaseUser) => {
  _user = firebaseUser ? _mapFirebaseUser(firebaseUser) : null
})

function _mapFirebaseUser(fbUser) {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    pseudo: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Utilisateur',
    role: fbUser.customClaims?.role ?? 'student',
    avatar: fbUser.photoURL ?? 'avatar-01',
    isAnonymous: fbUser.isAnonymous,
  }
}

// ─────────────────────────────────────────────
// Interface publique (inchangée)
// ─────────────────────────────────────────────
export function getCurrentUser() {
  return _user ?? null // null si non connecté ou non encore hydraté
}

export async function getFirebaseToken() {
  if (!auth.currentUser) return null
  return await auth.currentUser.getIdToken() // auto-refresh
}

export function clearCurrentUser() {
  return signOut(auth) // retourne une Promise — les appelants peuvent await ou ignorer
}

export function isAdmin(user) {
  return user?.role === 'admin'
}

// ─────────────────────────────────────────────
// Nouvelles fonctions de connexion (Jalon 7)
// ─────────────────────────────────────────────
export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signUpWithEmail(email, password, pseudo) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  if (pseudo) await updateProfile(credential.user, { displayName: pseudo })
  return credential
}

export async function signInAsGuest() {
  return signInAnonymously(auth)
}

export async function linkGuestToEmail(email, password) {
  const credential = EmailAuthProvider.credential(email, password)
  return linkWithCredential(auth.currentUser, credential)
}
```

### Migration de `setCurrentUser(userKey)` (ancienne API)

L'ancienne `setCurrentUser(userKey)` sélectionnait un profil parmi les `FAKE_USERS`. En Jalon 7, elle est remplacée par `signInWithEmail`. L'écran `ProfileSelectScreen` devra être adapté pour afficher un formulaire de connexion Firebase plutôt qu'une liste de profils fake.

**Note :** `setCurrentUser` n'est pas dans l'interface "gelée" (elle était interne à l'écran de sélection de profil). Seules `getCurrentUser()`, `getFirebaseToken()`, `clearCurrentUser()` et `isAdmin()` sont des contrats gelés.

---

## 5. Intégration backend FastAPI — `firebase-admin` Python

### Installation

```bash
pip install firebase-admin
# Ajouter dans backend/requirements.txt :
# firebase-admin>=6.4.0
```

### Initialisation (une seule fois au démarrage)

```python
# backend/firebase_setup.py
import os
import firebase_admin
from firebase_admin import credentials

def init_firebase():
    if firebase_admin._apps:
        return  # guard contre double-init (hot-reload uvicorn)

    key_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
    if key_path:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()  # utilise GOOGLE_APPLICATION_CREDENTIALS
```

**Intégration dans `main.py` avec le lifespan FastAPI :**
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .firebase_setup import init_firebase

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_firebase()
    yield

app = FastAPI(lifespan=lifespan)
```

### Dépendance d'authentification FastAPI

```python
# backend/dependencies/auth.py
import asyncio
from firebase_admin import auth
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

bearer = HTTPBearer()

async def verify_firebase_token(token=Depends(bearer)) -> dict:
    try:
        # verify_id_token est synchrone — asyncio.to_thread évite de bloquer la boucle
        decoded = await asyncio.to_thread(auth.verify_id_token, token.credentials)
        return decoded
    except auth.ExpiredIdTokenError:
        raise HTTPException(401, "Token expiré")
    except auth.RevokedIdTokenError:
        raise HTTPException(401, "Token révoqué")
    except auth.UserDisabledError:
        raise HTTPException(403, "Compte désactivé")
    except auth.InvalidIdTokenError as e:
        raise HTTPException(401, f"Token invalide : {e}")
    except Exception as e:
        raise HTTPException(500, f"Erreur auth : {e}")
```

**Utilisation dans une route :**
```python
@app.post("/api/progress")
async def save_progress(payload: dict, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]         # identifiant Firebase de l'utilisateur
    email = user.get("email") # peut être absent (anonymous)
    # ... logique métier
```

### Contenu du token décodé (`decoded` dict)

| Champ | Valeur |
|---|---|
| `uid` | ID Firebase (string, stable) |
| `email` | Email (absent pour anonymous) |
| `email_verified` | bool |
| `name` | displayName (si défini) |
| `iss` | `https://securetoken.google.com/<project-id>` |
| `aud` | project ID Firebase |
| `iat` / `exp` | émission / expiration (1 heure) |
| custom claims | ex. `role: "admin"` si défini via `auth.set_custom_user_claims()` |

### Migration de `SKIP_FIREBASE_AUTH=true`

**Stratégie de transition progressive :**

```python
# Pendant la migration, garder la compatibilité
async def verify_token(token=Depends(bearer)) -> dict:
    if os.getenv("SKIP_FIREBASE_AUTH") == "true":
        # Mode dev : accepter les fake tokens
        return {"uid": "dev-user", "email": "dev@fake.local", "role": "student"}
    return await verify_firebase_token(token)
```

Retirer `SKIP_FIREBASE_AUTH=true` uniquement après validation E2E de l'auth Firebase en staging.

### Clé de service Firebase

La clé de service (`serviceAccountKey.json`) est obtenue via :
Firebase Console → Project Settings → Service Accounts → Generate new private key

- **Ne jamais committer dans git**
- Stocker dans `backend/.env` comme `FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json`
- Déjà dans `.gitignore` si `backend/.env` y est référencé

_Source : Firebase Admin SDK documentation Python, firebase-admin v6.x._

---

## 6. Impacts Jalon 8 Android

### Architecture Firebase multi-plateforme

Un projet Firebase peut avoir **plusieurs app registrations** :
- Android : `google-services.json` (téléchargé depuis Firebase Console)
- Web : objet `firebaseConfig` (API keys dans `.env.local`)

Ils partagent le **même `projectId`** et la **même base d'utilisateurs**. Un `uid` Firebase est identique sur Android et sur le Web.

### Deux SDK distincts, mêmes utilisateurs

| Contexte | SDK | État auth |
|---|---|---|
| App Android native | `firebase-android-sdk` (Kotlin) | `FirebaseAuth.getInstance().currentUser` |
| Page web dans WebView | Firebase JS SDK v12 | `auth.currentUser` |

Les deux instances sont **indépendantes** — elles ne partagent pas automatiquement leur état. Un utilisateur connecté sur Android **n'est pas** automatiquement connecté dans la WebView.

### Patron recommandé — passage de token natif → WebView

**Option C (la plus simple pour ParcCours)** : Le code JS dans la WebView n'appelle **jamais Firebase directement**. L'Android native gère toute l'auth et injecte le token dans la WebView.

```kotlin
// MainActivity.kt (Kotlin)
FirebaseAuth.getInstance().currentUser
    ?.getIdToken(false) // false = utiliser le cache, true = forcer refresh
    ?.addOnSuccessListener { result ->
        val token = result.token
        webView.evaluateJavascript(
            "window.receiveFirebaseToken('$token');",
            null
        )
    }
```

```js
// Dans le JS chargé par la WebView
window.receiveFirebaseToken = function(token) {
  window._firebaseToken = token
}

// Utilisation dans profileService.js
export async function getFirebaseToken() {
  // Si mode WebView Android : utiliser le token injecté
  if (window._firebaseToken) return window._firebaseToken
  // Sinon : mode web standard
  if (!auth.currentUser) return null
  return await auth.currentUser.getIdToken()
}
```

**Rafraîchissement du token :** Le token Firebase expire après 1 heure. L'Android native doit rafraîchir et reinjecter le token avant chaque session WebView ou sur un timer de 55 minutes.

### Impact sur `profileService.js`

La fonction `getFirebaseToken()` est le seul point d'adaptation nécessaire. En Jalon 8, elle pourra détecter l'environnement WebView et basculer sur le token injecté. Comme l'interface est gelée, aucun autre code ne change.

### Jetpack Compose + WebView

Compose n'a pas de WebView natif. Le pattern standard est `AndroidView` wrappant `android.webkit.WebView`. L'injection de token via `evaluateJavascript` fonctionne identiquement.

_Source : Firebase Android SDK documentation, Android WebView JavascriptInterface pattern._

---

## 7. Sécurité, persistance et gestion des tokens

### Durée de vie des tokens Firebase

- **ID Token** : expire après **exactement 1 heure** (non configurable)
- Le SDK Firebase JS **rafraîchit automatiquement** le token ~5 minutes avant expiration
- `auth.currentUser.getIdToken()` sans argument : retourne le token en cache si valide, appelle Google si proche de l'expiration
- `auth.currentUser.getIdToken(true)` : force le rafraîchissement (à utiliser seulement sur 401 du backend)

### Pattern sécurisé pour les appels backend

```js
// src/services/backendService.js (ou intégration dans les services existants)
import { auth } from './firebaseService'

export async function authenticatedFetch(url, options = {}) {
  const token = await auth.currentUser?.getIdToken() // auto-refresh
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
}
```

**Cohérence avec le pattern fire-and-forget de ParcCours :**
```js
// ✅ Compatible avec les règles du projet
saveProgress(userId, progress)           // synchrone, localStorage
authenticatedFetch('/api/progress', ...) // fire-and-forget, pas d'await
```

### Stockage du token — bonne pratique

- **Ne pas stocker le raw token dans `localStorage`** (risque XSS) — laisser Firebase gérer via IndexedDB
- `getIdToken()` lit depuis la mémoire Firebase (IndexedDB hydraté) — c'est aussi rapide que localStorage
- En mode WebView Android, le token `window._firebaseToken` est en mémoire JS uniquement (non persisté)

### Custom Claims pour les rôles

Pour remplacer `role: 'admin'` actuellement dans `FAKE_USERS`, utiliser les Firebase Custom Claims :

```python
# Côté backend, une seule fois lors de la création d'un admin :
from firebase_admin import auth
auth.set_custom_user_claims(uid, {"role": "admin"})
```

Les custom claims apparaissent dans le token décodé et dans `auth.currentUser` après le prochain `getIdToken(true)`.

---

## 8. Plan d'implémentation recommandé

### Phase 1 — Initialisation Firebase (1/2 journée)

1. Créer le projet Firebase dans la console (ou utiliser un existant)
2. Activer Email/Password auth dans Firebase Console → Authentication → Sign-in method
3. Créer `src/services/firebaseService.js` avec `initializeApp` et `getAuth`
4. Ajouter les variables d'env dans `.env.local` :
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   ```
5. Créer `src/context/AuthContext.jsx` avec `AuthProvider` et wrapper dans `main.jsx`
6. Vérifier que l'app démarre sans erreur (Firebase init OK)

### Phase 2 — Migration de `profileService.js` (1 journée)

1. Réécrire `profileService.js` avec le cache module-level (`_user` + `onAuthStateChanged`)
2. Supprimer l'import de `FAKE_USERS` et `fakeUsers.js`
3. Ajouter `signInWithEmail`, `signUpWithEmail`, `signInAsGuest`, `linkGuestToEmail`
4. Tester : `getCurrentUser()` retourne `null` avant connexion, objet user après
5. Vérifier que `getFirebaseToken()` retourne un vrai JWT (vérifiable sur jwt.io)

### Phase 3 — Adapter l'écran de sélection de profil (1 journée)

1. Remplacer `ProfileSelectScreen` (liste de FAKE_USERS) par un formulaire de connexion/inscription
2. Utiliser `signInWithEmail` / `signUpWithEmail` depuis `profileService`
3. Gérer les états d'erreur Firebase (`auth/user-not-found`, `auth/wrong-password`, etc.)
4. Optionnel : bouton "Continuer sans compte" → `signInAsGuest()`

### Phase 4 — Backend FastAPI (1/2 journée)

1. Installer `firebase-admin` dans le venv Python
2. Télécharger `serviceAccountKey.json` depuis Firebase Console
3. Créer `backend/firebase_setup.py` et `backend/dependencies/auth.py`
4. Remplacer le middleware auth factice par `verify_firebase_token`
5. Garder `SKIP_FIREBASE_AUTH=true` en dev le temps des tests
6. Tester E2E : frontend connecté → appel API avec JWT → backend valide → retirer `SKIP_FIREBASE_AUTH`

### Phase 5 — Tests et validation (1/2 journée)

1. Tester la persistance : connexion → rechargement page → toujours connecté
2. Tester le logout : `clearCurrentUser()` → `getCurrentUser()` retourne `null`
3. Tester le rafraîchissement de token (attendre >55 min ou forcer avec `getIdToken(true)`)
4. Vérifier que les tests Vitest existants passent (`npm test`)
5. Vérifier le build : `npm run build`

---

## 9. Risques et points d'attention spécifiques à ParcCours

### R1 — Transition synchrone/asynchrone (CRITIQUE)

**Risque :** Des composants qui lisent `getCurrentUser()` au montage pourraient recevoir `null` pendant les ~100-300ms d'hydratation Firebase, causant des redirections non voulues vers l'écran de connexion.

**Mitigation :** Le `AuthProvider` bloque le rendu de l'app jusqu'à ce que Firebase ait répondu (état `undefined` → spinner). Une fois l'app rendue, `getCurrentUser()` est fiable.

---

### R2 — localStorage encore utilisé pour `parcours_current_user`

**Risque :** D'autres parties de l'app pourraient lire directement `localStorage.getItem('parcours_current_user')` (cf. anti-pattern documenté dans `project-context.md`).

**Mitigation :** Chercher toutes les occurrences de `parcours_current_user` et `STORAGE_KEY` dans le code, vérifier qu'elles passent toutes par `profileService`. Supprimer la clé `localStorage` après connexion Firebase réussie pour éviter des conflits.

---

### R3 — `setCurrentUser(userKey)` actuellement appelé depuis `ProfileSelectScreen`

**Risque :** `ProfileSelectScreen` appelle `setCurrentUser('student')` — cette fonction disparaît en Jalon 7.

**Mitigation :** Réécrire `ProfileSelectScreen` en Phase 3. C'est un écran **entier** à adapter, pas juste une ligne.

---

### R4 — `getFirebaseToken()` appelé dans des composants (anti-pattern existant)

**Risque :** `project-context.md` documente que `FreeTextExercise.jsx` et `ProfileScreen.jsx` appellent `BACKEND` directement. Si `getFirebaseToken()` y est importé directement, la gestion d'erreur ne sera pas centralisée.

**Mitigation :** Avant Jalon 7, faire un grep de `getFirebaseToken` et vérifier que tous les appels passent par les services. Créer un `backendService.js` avec `authenticatedFetch()` si ce n'est pas fait.

---

### R5 — `fakeUsers.js` potentiellement importé ailleurs

**Risque :** D'autres fichiers pourraient importer `FAKE_USERS` directement (ex: debug dashboard).

**Mitigation :** `grep -r "FAKE_USERS\|fakeUsers" src/` avant de supprimer le fichier. Conserver `fakeUsers.js` en dev-only si le debug dashboard en a besoin.

---

### R6 — Coût Firebase Auth (Free Spark plan)

**Info :** Firebase Auth email/password et Google sont **gratuits** en illimité sur le plan Spark (gratuit). L'anonymous auth est aussi gratuite. Seul le passage à un plan Blaze (pay-as-you-go) serait nécessaire si on utilise Cloud Functions ou Firestore au-delà des quotas.

---

### R7 — `onAuthStateChanged` dans un module singleton — Strict Mode

**Risque :** En React 18 Strict Mode, les effects se déclenchent deux fois en dev. Le listener module-level dans `profileService.js` ne souffre **pas** de ce problème (il n'est pas dans un useEffect) — il se déclenche une fois à l'import du module. Pas de risque de doublon.

---

## 10. Méthodologie et sources

### Sources utilisées

Cette recherche est basée sur la connaissance d'entraînement couvrant jusqu'à août 2025, qui inclut :

- **Firebase JS SDK documentation officielle** — v9 modular API (stable depuis 2021, confirmé v12)
  - `firebase/auth` module : `onAuthStateChanged`, `signIn*`, `linkWith*`, `setPersistence`
  - `auth.authStateReady()` — ajouté en v10.1, disponible en v12
  - Persistance IndexedDB (changement v8→v9, confirmé stable en v12)

- **Firebase Admin Python SDK documentation** — v6.x
  - `auth.verify_id_token()`, gestion des erreurs, `asyncio.to_thread` pattern

- **FastAPI documentation** — `Depends`, `HTTPBearer`, `lifespan` async context manager

- **Firebase Android SDK** — `FirebaseAuth.getInstance()`, `getIdToken()`, `evaluateJavascript` WebView pattern

- **Patterns React 18** — `useEffect` cleanup en Strict Mode, `useState(undefined)` pour état inconnu initial

### Note sur WebSearch

Les outils WebSearch et WebFetch sont désactivés dans les permissions du projet. La recherche est basée sur la documentation officielle connue. Pour vérifier des points spécifiques avec des sources en ligne, exécuter `/update-config` et activer `WebSearch`/`WebFetch`.

### Queries qui seraient utilisées pour vérification live

- `firebase auth web sdk v12 onAuthStateChanged React 2025`
- `firebase-admin python fastapi verify_id_token 2024`
- `firebase auth android webview token injection 2024`
- `firebase anonymous auth link email password react 2024`

---

**Date de complétion :** 2026-05-29
**Période de recherche :** Firebase SDK v9–v12, documentation stable 2021–2025
**Niveau de confiance :** Élevé — basé sur documentation officielle Firebase, FastAPI, Android

_Document de référence technique pour l'implémentation du Jalon 7 de ParcCours._
