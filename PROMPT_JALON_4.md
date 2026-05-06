# Prompt — Jalon 4 — Fake Users et progression locale

## Contexte

Application éducative React (Vite + Tailwind).
Jalons 0 à 3quater terminés.
Tous les exercices fonctionnent, les tests unitaires passent.

On remplace les stubs vides de `useProfile` et `useProgress`
par une implémentation fonctionnelle avec de faux utilisateurs
et une vraie progression sauvegardée en `localStorage`.

La spec technique complète est en pièce jointe.

---

## Ce qu'on fait

**Deux profils fictifs** — élève (progression normale) et admin (tout déverrouillé).
Sélecteur de profil au démarrage (pas de mot de passe, juste un tap).
Progression persistée dans `localStorage` entre les sessions.
Protection des routes — non connecté → redirige vers le sélecteur.
Le parc SVG reflète la vraie progression de l'élève.

---

## Règles absolues

**`profileService` et `progressService` sont les seuls à toucher `localStorage`.**
Jamais directement depuis un composant ou un hook.

**L'interface de `useProfile` et `useProgress` est définitive.**
Le jalon 7 remplacera uniquement l'implémentation interne
(Firebase Auth + sync backend) sans changer les signatures.
Ajouter des commentaires `// JALON 7` dans le code pour guider la migration.

**Le mode admin passe uniquement par `useProgress`.**
`getStepStatus()` retourne `'available'` si `isAdmin`.
Aucun composant ne vérifie `isAdmin` directement.

---

## Ce qu'on ne fait PAS

- Pas de Firebase (jalon 7)
- Pas d'appels backend pour la progression (jalon 7)
- Pas d'écran de profil complet avec avatar éditable (jalon 5)
- Pas de gestion multi-utilisateurs sur le même appareil

---

## Livrable attendu

1. `npm run dev` → écran de sélection de profil au premier lancement
2. Tap "Léo" → accès à l'app avec progression verrouillée normalement
3. Tap "Admin" → tous les cours accessibles
4. Compléter une étape → rechargement → étape marquée complétée dans le parc
5. "Réinitialiser la progression" → remet tout à zéro
6. `npm run build` passe avec les nouveaux tests `progressService.test.js`

Voir la spec en pièce jointe pour tous les détails.
