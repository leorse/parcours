# Prompt — Jalon 6 — Événements et mascotte

## Contexte

Application éducative React (Vite + Tailwind + Framer Motion).
Jalons 0 à 5 terminés — gamification complète, dashboard profil,
tous les exercices fonctionnent.

On ajoute le moteur d'événements et la mascotte Lumio.
La spec technique complète est en pièce jointe.

---

## Ce qu'on fait

**Un moteur d'événements piloté par YAML** (`events.yaml`) qui
déclenche des actions selon le comportement de l'élève.

**Une mascotte animée** (Lumio) qui apparaît dans un dialog
en bas de l'écran avec des messages personnalisés.

**Des célébrations** (confettis, feux d'artifice) en CSS pur.

**Une queue d'événements** — jamais deux dialogs simultanément.

---

## Architecture clé

```
events.yaml
    ↓
eventEngine.js (processEvents)
    ↓
eventConditions.js (evaluate)
    ↓
eventActions.js (buildPayload)
    ↓
EventContext (queue)
    ↓
MascotteDialog (rendu)
```

`useEventEngine.trigger()` est appelé à chaque point clé de l'app.
`MascotteDialog` est monté une seule fois dans `App.jsx`.

---

## Règles importantes

**La queue est sacrée.** Jamais deux dialogs simultanément.
Tout passe par `EventContext.pushEvents()`.

**Les événements `once: true` sont loggés en backend.**
`logEvent(eventId)` via `progressService` existant.
La table `user_event_history` existe déjà depuis le jalon 4b.

**Les animations sont en CSS pur** — pas de Lottie.
Ajouter le commentaire `// JALON 8a` dans `MascotteAvatar.jsx`
pour indiquer que les CSS animations seront remplacées par Lottie
sur Android natif.

**Les sons utilisent `useAudio`** — hook existant depuis le jalon 1.

---

## Ce qu'on ne fait PAS

- Pas de Lottie (jalon 8a)
- Pas de modification du backend
- Pas de dialog pendant un exercice en cours
- Pas d'import de EventContext depuis les services

---

## Livrable attendu

1. Premier lancement → dialog mascotte "Bienvenue !"
2. Retour après 3 jours → dialog avec `{days_absent}` résolu
3. Badge débloqué → dialog avec nom du badge
4. Session 30 min → dialog avec boutons "Continuer" / "Pause"
5. Cours complété → confettis + dialog
6. Jamais deux dialogs en même temps
7. `npm run build` passe avec les nouveaux tests

Voir la spec en pièce jointe pour tous les détails.
