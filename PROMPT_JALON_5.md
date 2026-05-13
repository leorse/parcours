# Prompt — Jalon 5 — Gamification

## Contexte

Application éducative React (Vite + Tailwind + Framer Motion).
Jalons 0 à 4c terminés — fake users, progression complète en backend,
tous les exercices fonctionnent y compris la dictée.

On ajoute la couche de gamification.
Le backend est **entièrement en place** depuis le jalon 4b —
toutes les tables existent, tous les endpoints répondent.
Ce jalon est uniquement du frontend + des fichiers YAML de config.

La spec technique complète est en pièce jointe.

---

## Ce qu'on fait

**Nouveaux fichiers YAML** : `levels.yaml`, `badges.yaml`, `trophies.yaml`

**Nouveaux services** : `xpService`, `skillService`, `badgeService`,
`recommendationService`

**Nouvelles animations** : XP qui monte, célébration de niveau,
dialog de déblocage de badge (en queue, jamais deux en même temps)

**Nouvel écran** : `ProfileScreen` — XP, niveau, barre de progression,
radar chart des compétences, badges, streak, suggestions de renforcement

---

## Règles importantes

**Les animations ne bloquent jamais le résultat.**
Le résultat de l'exercice s'affiche immédiatement.
L'évaluation des badges se fait en arrière-plan.
Les badges apparaissent en queue après le résultat.

**Le radar chart ne s'affiche que si `skills.length > 0`.**
Un élève qui vient de commencer n'a pas encore de données.

**Les badges se vérifient uniquement après `saveResult`.**
Pas de recalcul à chaque render.

---

## Ce qu'on ne fait PAS

- Pas de modification du backend
- Pas d'édition du profil (pseudo, avatar — jalon 7)
- Pas d'animations Lottie complexes (jalon 6)
- Pas de classements entre utilisateurs

---

## Livrable attendu

1. Compléter un exercice → animation "+15 XP" visible
2. Franchir un niveau → célébration plein écran
3. Débloquer un badge → dialog animé
4. `/profile` accessible depuis le menu → affiche XP, niveau, streak,
   radar chart, badges, suggestions
5. `npm run build` passe avec les nouveaux tests

Voir la spec en pièce jointe pour tous les détails.
