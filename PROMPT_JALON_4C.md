# Prompt — Jalon 4c — Exercice de dictée

## Contexte

Application éducative React (Vite + Tailwind).
Jalons 0 à 4b terminés — fake users, progression complète sur backend.
On ajoute un nouveau type d'exercice : **la dictée**.

La spec technique complète est en pièce jointe.

---

## Ce qu'on fait

Ajouter le type `dictation` — l'élève écoute un mot via synthèse vocale
(Web Speech API native, zéro dépendance) et l'écrit correctement.
Le correcteur orthographique est désactivé sur tous les champs concernés.

---

## Règle §8 — 4 fichiers principaux

```
1. DictationExercise.jsx    → à créer dans types/
2. exerciseService.js       → +case validateDictation
3. ExerciseEngine.jsx       → +import +EXERCISE_REGISTRY
4. answerGenerator.js       → +case dictation
```

Plus les fichiers de tests, skills-tree, et disable_spellcheck rétroactif
sur FillInTheBlank et FreeText.

---

## Points critiques

**Le mot ne s'affiche jamais à l'écran** — c'est une dictée.

**Écoute obligatoire avant saisie** — le champ est `disabled` tant que
`spoken === false`.

**normalize('NFD')** dans la validation — indispensable pour comparer
les accents de manière robuste (`chrysanthème` vs `chrysantheme`).

**Commentaire JALON 8a** dans `DictationExercise.jsx` — indiquer que
`window.speechSynthesis` sera remplacé par `TextToSpeech` Android natif.

---

## Ce qu'on ne fait PAS

- Pas de fallback audio MP3
- Pas de Howler.js (Web Speech API suffit)
- Pas d'affichage du mot à deviner
- Pas de modification du backend

---

## Livrable attendu

1. L'exercice dictée est jouable dans Chrome
2. La synthèse vocale prononce les mots en français à 0.85x
3. Le champ de saisie n'a pas de correcteur orthographique
4. Compléter tous les mots → ExerciseResult avec score
5. `npm run build` passe avec tous les nouveaux tests

Voir la spec en pièce jointe pour tous les détails.
