---
status: 'decision-record'
completedAt: '2026-06-02'
project_name: 'ParcCours'
user_name: 'Dams'
date: '2026-06-02'
subject: 'Jalon 8 — Portage Android via Capacitor'
replaces: 'Jalon 8 précédemment libellé "Android — Kotlin/Jetpack Compose"'
---

# Architecture Decision Record — Jalon 8 : Portage Android via Capacitor

---

## Contexte & contraintes de Dams

Ces contraintes sont non-négociables et ont dicté toutes les décisions ci-dessous.

| Contrainte | Détail |
|---|---|
| Distribution Android | APK sideloadé manuellement sur le device — **pas de Google Play Store** |
| Outil de build Android | Android Studio installé sur le poste Windows, utilisé **uniquement pour générer l'APK** |
| Émulation | **Impossible** sur ce poste (pas d'émulateur Android Studio, pas de Docker) |
| Test Android | Sur device physique uniquement (smartphone) |
| Test PC | `npm run dev` → Chrome sur Windows — doit rester fonctionnel à tous les jalons |
| Cible | App fonctionnelle sur **Android ET PC**, idéalement un seul codebase |

---

## Décision : abandon de Kotlin/Jetpack Compose

Le Jalon 8 était initialement libellé « Android — Kotlin/Jetpack Compose ». Cette approche est **abandonnée** pour les raisons suivantes :

| Problème | Impact |
|---|---|
| Réécriture complète | 0 % de réutilisation du code existant (YAML engine, gamification, événements, 141 tests) |
| Deux codebases | React (PC) + Kotlin (Android) à maintenir en parallèle indéfiniment |
| Firebase | Web SDK → Android SDK : API différente, logique auth à dupliquer |
| Audio | Howler.js → MediaPlayer/ExoPlayer Kotlin |
| KaTeX, Framer Motion, @dnd-kit | Aucun équivalent direct, tout à réécrire |
| Test sans émulateur | Dev loop Android Studio natif bloqué sans émulation |
| Délai estimé | 3 à 6 mois de travail |

---

## Décision retenue : Capacitor

[Capacitor](https://capacitorjs.com/) (par Ionic) wrape le build Vite existant dans une WebView Android native et génère un APK via Gradle.

### Pourquoi pas PWA ?

| Problème PWA | Détail |
|---|---|
| Ce n'est pas un APK | Installation via "Ajouter à l'écran d'accueil" — peu fiable selon navigateur et version Android |
| Nécessite un hébergement | Une URL publique est requise pour distribuer l'app — l'APK Capacitor est auto-suffisant |
| localStorage evictable | Android peut vider le cache navigateur sous pression mémoire → perte de XP, badges, streak |
| Moins de contrôle | Audio autoplay, TTS, stockage : moins maîtrisables que dans un APK WebView |

### Pourquoi pas React Native ?

React Native ≠ React. Les dépendances clés (Howler.js, KaTeX, Framer Motion, @dnd-kit, recharts) ne fonctionnent pas dans React Native. Ce serait une réécriture presque aussi lourde que Kotlin.

---

## Architecture cible

```
PC (développement)    →  npm run dev       →  Vite dev server →  Chrome localhost:5173
PC (production)       →  npm run build     →  dist/           →  Chrome (fichier local ou hébergé)
Android               →  npx cap sync      →  Copie dist/ dans android/
                      →  Android Studio    →  Gradle build    →  APK
                      →  adb install / copie manuelle         →  Smartphone
```

```
App (APK ou navigateur)
    └── React/Vite (identique)
        └── Firebase Web SDK       ← inchangé
        └── localStorage           ← protégé dans APK (SharedPreferences via Capacitor)
        └── VITE_BACKEND_URL       ← pointe vers Cloudflare en prod
```

```
Backend (Raspberry Pi)
    └── FastAPI + SQLite
        └── cloudflared            ← Cloudflare Tunnel
            └── https://[domaine].trycloudflare.com
```

---

## Déploiement backend : Raspberry Pi + Cloudflare Tunnel

Le backend FastAPI tourne sur un Raspberry Pi à domicile, exposé via **Cloudflare Tunnel** (outil `cloudflared`).

| Avantage | Détail |
|---|---|
| Pas de port forwarding | La box domestique n'a rien à configurer |
| HTTPS automatique | Cloudflare fournit le certificat — Android 9+ exige HTTPS, c'est satisfait d'office |
| Offline gracieux | Si le Pi est éteint, l'app continue (localStorage = source de vérité, backend = fire-and-forget) |

**Variable d'environnement :**
- Dev PC : `VITE_BACKEND_URL=http://localhost:8000` (`.env.local`, non commité)
- Build APK prod : `VITE_BACKEND_URL=https://[domaine-cloudflare]` (`.env.production`, non commité)

---

## Workflow de build APK (Jalon 8)

```bash
# 1. Build Vite avec les variables de prod
npm run build

# 2. Synchroniser les assets web dans le projet Android
npx cap sync

# 3. Ouvrir Android Studio (ou lancer Gradle en CLI)
npx cap open android
# → Build > Generate Signed Bundle/APK > APK

# 4. Installer sur le smartphone
adb install app/build/outputs/apk/debug/app-debug.apk
# ou copie manuelle du fichier .apk sur le device
```

---

## Adaptations requises (delta Jalon 8)

### 1. `ttsService.js` — TTS abstrait (priorité haute)

`DictationExercise.jsx` utilise `window.speechSynthesis` directement. Cette API est absente dans Android WebView.

**Pattern à implémenter :**

```js
// src/services/ttsService.js
// Interface : speak(text, lang)
// Implémentation PC    → window.speechSynthesis (Web Speech API)
// Implémentation APK   → @capacitor/text-to-speech
```

Le composant `DictationExercise.jsx` appellera `speak(text, lang)` via ce service — jamais `window.speechSynthesis` directement.

### 2. `storageService.js` — Clés localStorage centralisées (priorité moyenne)

Mentionné comme dette dans `project-context.md` §12. Avant Jalon 8, centraliser toutes les clés `localStorage` dans un `storageService.js`. Capacitor peut substituer `@capacitor/preferences` en remplacement de `localStorage` pour une meilleure résilience sur Android.

### 3. Configuration Capacitor — Content Security Policy

Dans `capacitor.config.ts` (ou `.js`), déclarer le domaine Cloudflare pour autoriser les requêtes réseau :

```ts
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'fr.parcours.app',
  appName: 'ParcCours',
  webDir: 'dist',
  server: {
    allowNavigation: ['[domaine].trycloudflare.com']
  }
}
```

Et dans `android/app/src/main/AndroidManifest.xml`, autoriser le trafic réseau vers le domaine Cloudflare (HTTPS uniquement — pas de `usesCleartextTraffic`).

### 4. Politiques autoplay audio (priorité basse)

Howler.js fonctionne dans WebView, mais Android peut bloquer l'autoplay audio. Les sons doivent être déclenchés depuis un geste utilisateur explicite. À tester sur device physique.

---

## Plugins Capacitor identifiés

| Besoin | Plugin | Priorité |
|---|---|---|
| TTS (dictée) | `@capacitor/text-to-speech` | Haute |
| Stockage persistant | `@capacitor/preferences` | Moyenne |
| Audio natif (si Howler insuffisant) | `@capacitor/native-audio` | Basse — à évaluer |

---

## Ce qui NE change pas

- L'intégralité du code React existant
- Les 141 tests Vitest (environnement `node`, inchangé)
- Firebase Web SDK — fonctionne dans WebView
- `localStorage` — fonctionne dans WebView (et peut être migré vers `@capacitor/preferences` progressivement)
- Le pattern fire-and-forget backend
- Le workflow dev quotidien : `npm run dev` → Chrome

---

## Séquence d'implémentation suggérée

1. Installer Capacitor dans le projet : `npm install @capacitor/core @capacitor/cli @capacitor/android`
2. Initialiser : `npx cap init ParcCours fr.parcours.app --web-dir=dist`
3. Ajouter Android : `npx cap add android`
4. Premier build de validation : `npm run build` + `npx cap sync` + APK via Android Studio
5. Tester sur device physique (navigation, exercices, localStorage)
6. Implémenter `ttsService.js` + `@capacitor/text-to-speech`
7. Implémenter `storageService.js` + migration progressive vers `@capacitor/preferences`
8. Configurer CSP + `VITE_BACKEND_URL` production (Cloudflare)
9. Tester backend depuis APK sur device physique

---

## Résumé des décisions

| Décision | Choix | Raison principale |
|---|---|---|
| Approche Android | **Capacitor** | Réutilise 100 % du code React existant |
| ~~Kotlin/Jetpack Compose~~ | Abandonné | Réécriture complète, 0 % réutilisation |
| ~~PWA~~ | Écarté | localStorage evictable, pas d'APK, besoin hébergement |
| ~~React Native~~ | Écarté | Dépendances incompatibles, quasi-réécriture |
| Backend Android | **Même FastAPI** via Cloudflare | App déjà conçue fire-and-forget |
| Distribution | **APK sideloadé** | Pas de Play Store, workflow déjà maîtrisé par Dams |
| Test Android | **Device physique** via USB | Émulateur impossible sur ce poste |
| Test PC | **`npm run dev`** identique | Capacitor ne casse pas le workflow web |
