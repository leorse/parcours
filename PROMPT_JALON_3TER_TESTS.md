# Prompt — Jalon 3ter — Tests unitaires

## Contexte

Application éducative React (Vite + Tailwind).
Jalons 0 à 3bis-debug terminés.
On ajoute un filet de sécurité avant les jalons 4, 5 et 6
qui vont modifier les fichiers critiques.

**Outil :** Vitest uniquement. Pas de tests IHM, pas de Playwright.
La spec complète est en pièce jointe.

---

## Règle absolue — le build inclut les tests

```json
"build": "vitest run && vite build"
```

Si un test échoue, le build échoue. Non négociable.

---

## Ce qu'on teste

```
exerciseService.js    → validation des réponses pour chaque type
scoreService.js       → calcul XP
contentService.js     → contrats de structure des données
answerGenerator.js    → cohérence génération / validation
```

Uniquement de la logique pure. Pas de composants React, pas de fetch réseau.

---

## Ce qu'on ne fait PAS

- Pas de jsdom, pas de render de composants
- Pas de mock réseau complexe
- Pas de viser 100% de couverture
- Zéro modification du code de production

---

## Livrable attendu

```bash
npm run test
```

```
✓ exerciseService.test.js  (28 tests)
✓ scoreService.test.js     (6 tests)
✓ contentService.test.js   (7 tests)
✓ answerGenerator.test.js  (14 tests)

Tests  55 passed
```

```bash
npm run build   # doit inclure les tests ET builder sans erreur
```

---

## Point d'attention — cas limites

Bien couvrir les cas limites dans `exerciseService.test.js` :
- Réponse `null`
- Réponse vide `{}`
- Type d'exercice inconnu
- Exercice sans paires / sans items

Ce sont exactement les cas qui cassent silencieusement lors d'une refactorisation.

Voir la spec en pièce jointe pour tous les détails et les fixtures complètes.
