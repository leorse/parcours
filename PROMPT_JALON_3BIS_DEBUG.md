# Prompt — Jalon 3bis-debug

## Contexte

Application éducative React (Vite + Tailwind + Framer Motion).
Jalons 0 à 3 terminés — tous les exercices sont jouables.
On ajoute une **console de débogage** pour tester les exercices efficacement.

La spec technique complète est en pièce jointe.

---

## Ce qu'on fait

Une route `/debug` accessible uniquement en `import.meta.env.DEV`.
Un dashboard 3 colonnes :
- **Gauche** : arbre de tout le contenu (matières → cours → exercices)
- **Centre** : l'exercice rendu réellement, avec une barre de contrôle debug
- **Droite** : inspecteurs (YAML brut, état moteur, injecteur de réponses)

Un bouton flottant 🐛 visible sur toutes les pages en DEV pour y accéder rapidement.

---

## Règle absolue

**Le code debug ne doit jamais être importé depuis le code métier.**
`src/debug/` dépend de `src/components/` et `src/services/`.
Jamais l'inverse.

Les seules modifications dans le code existant :
- `ExerciseEngine.jsx` : 2 props optionnelles (`injectedAnswer`, `debugMode`)
  toutes les deux avec des valeurs par défaut qui préservent le comportement normal
- `AppRouter.jsx` : une route conditionnelle
- `App.jsx` : un composant `<DebugFAB />`

---

## Fonctionnalités à valider à la fin

```
✓ http://localhost:5173/debug accessible
✓ L'arbre charge tout le vrai contenu YAML
✓ Cliquer sur un exercice l'affiche dans le centre
✓ "Afficher les réponses" montre les bonnes réponses en overlay
✓ "Injecter bonne réponse" pré-remplit l'exercice
✓ Valider → EngineState affiche score, correct, XP, feedback
✓ "Injecter mauvaise réponse" → valider → EngineState affiche ❌
✓ Reset remet l'exercice vierge
✓ YamlInspector affiche le YAML colorisé de l'exercice courant
✓ En prod (npm run build + npm run preview) : /debug → 404, bouton 🐛 invisible
```

Voir la spec en pièce jointe pour tous les détails.
