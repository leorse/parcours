# Prompt — Jalon 6b — Événements contextuels, dialogues et personnages

## Contexte

Application éducative React (Vite + Tailwind + Framer Motion).
Jalons 0 à 6 terminés — moteur d'événements global, mascotte Lumio,
célébrations, queue d'événements.

Ce jalon complète et corrige le jalon 6 sur trois points.
La spec technique complète est en pièce jointe.

---

## Les trois changements

### 1. Événements contextuels
Chaque matière et chaque cours peut avoir son propre `events.yaml`
au même niveau que ses fichiers de contenu.
`eventEngine.js` fusionne les events globaux + contextuels selon
les `contextPaths` passés par les écrans de navigation.

### 2. Session validée par exercice
Une session ne compte que si au moins un exercice est complété
dans la journée — pas à la simple connexion.
`markSessionActive()` dans `progressService.js`.

### 3. Monologues et dialogues
Deux nouveaux types de séquences narratives :
- **Monologue** : un personnage seul, image + texte Markdown paginé,
  l'image peut changer à chaque page
- **Dialogue** : deux personnages face à face, répliques alternées,
  chaque réplique a une émotion affichée via spritesheet CSS

Les personnages sont définis dans `personnages.yaml`.
Chaque émotion est une cellule dans un spritesheet (grille 2×3).
`background-position` CSS pour sélectionner la bonne cellule.

---

## Point technique critique — SpriteEmotion

```js
// Calcul background-position pour coords [col, row]
x = -(col * width)   // pixels négatifs
y = -(row * height)

// Avec scale pour adapter la taille d'affichage
backgroundSize = `${cols * width * scale}px ${rows * height * scale}px`
backgroundPosition = `${x * scale}px ${y * scale}px`
```

Tester avec les coords `[1, 2]` → x=-379, y=-758 (sur une grille 379×379).

---

## Ce qu'on ne fait PAS

- Pas de modification du backend
- Pas de Lottie (jalon 8a)
- Pas de modification des events globaux existants
- Pas de chargement de personnages.yaml à chaque rendu
  (cache dans personnageService dès le premier appel)

---

## Livrable attendu

1. Entrer dans les maths → monologue d'intro se déclenche
2. Le dialogue entre Crac et Moggy s'affiche avec les bons sprites
3. L'émotion change à chaque réplique dans le sprite
4. L'image change entre les pages d'un monologue
5. Compléter un exercice → session marquée (pas à la connexion)
6. `contextPaths` passé correctement depuis SubjectSelect et CourseSelect
7. `npm run build` passe

Voir la spec en pièce jointe pour tous les détails.
