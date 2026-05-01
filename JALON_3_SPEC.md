# Prompt — Jalon 3

## Contexte

Application éducative React (Vite + Tailwind + Framer Motion).
Jalons 0, 1, 1bis et 2 terminés.
Le contenu YAML est en place, les leçons s'affichent avec Markdown et KaTeX.
Les exercices sont actuellement des placeholders (`ExerciseBlock` affiche juste l'id).

On passe au **jalon 3 : le moteur d'exercices**.
La spec technique complète est en pièce jointe.

---

## Ce qu'on fait dans ce jalon

Implémenter tous les types d'exercices interactifs :
- `multiple_choice` — QCM
- `fill_in_the_blank` — texte à trou
- `image_tap` — zones cliquables sur image
- `drag_drop` — glisser-déposer
- `timeline` — frise chronologique à réordonner
- `free_text` — placeholder uniquement (implémenté au jalon 3bis)

Le tout via un **dispatcher central** (`ExerciseEngine`) qui lit le `type`
dans le YAML et instancie le bon composant.

---

## Règles absolues

**Toute la logique de validation est dans `exerciseService.js`.**
Les composants visuels ne savent pas si une réponse est correcte.
Ils reçoivent `onSubmit` en prop et appellent juste cette fonction.

**Le moteur est extensible par convention.**
Ajouter un type = 1 composant + 1 case dans `exerciseService.js`
+ 1 entrée dans `EXERCISE_REGISTRY`. Rien d'autre.

**La progression n'est pas sauvegardée.**
`scoreService.js` est créé mais en stub (`console.log` uniquement).
La vraie sauvegarde est au jalon 4.

---

## Ce qu'on ne fait PAS

- Pas de sauvegarde backend (stub seulement)
- Pas d'implémentation de `free_text` (placeholder visible)
- Pas d'animation XP (placeholder → jalon 5)
- Pas de modification des écrans de navigation

---

## Point d'attention — dnd-kit

Pour `DragDropExercise` et `TimelineExercise` :
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Livrable attendu

1. Tous les types d'exercices jouables dans le navigateur
2. Validation correcte des réponses
3. Écran de résultat avec score et XP calculé (non sauvegardé)
4. `skills-tree.yaml` créé avec les skills des exercices de test
5. Le guide "créer un nouveau type" en pièce jointe doit être applicable
   — vérifier en créant un exercice `matching` comme exemple

Voir la spec en pièce jointe pour tous les détails.
