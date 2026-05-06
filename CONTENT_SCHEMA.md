# Schéma des fichiers de contenu — Parcours

Ce document décrit la structure et le schéma de tous les fichiers YAML qui définissent les matières, cours et exercices de l'application Parcours.

---

## Architecture des fichiers

```
public/content/
├── index.yaml                              # Index global des matières
└── subjects/
    └── {subject-id}/
        ├── index.yaml                      # Index des cours de la matière
        └── courses/
            └── {course-id}/
                ├── course.yaml             # Structure et contenu du cours
                └── exercises.yaml          # Exercices du cours
```

Les chemins dans les fichiers index sont relatifs à `public/content/`.

---

## 1. Index global — `index.yaml`

Liste toutes les matières disponibles dans l'application.

```yaml
subjects:
  - id: string              # Identifiant unique, snake_case (ex: "mathematiques")
    label: string           # Nom affiché (ex: "Mathématiques")
    icon: string            # Nom d'icône Lucide (ex: "calculator", "book-open")
    color: string           # Couleur hexadécimale (ex: "#4F46E5")
    description: string     # Courte description affichée sous le titre
    coursesCount: integer   # Nombre de cours (indicatif, non vérifié à runtime)
    path: string            # Chemin vers le subject index (relatif à public/content/)
```

**Exemple :**
```yaml
subjects:
  - id: "mathematiques"
    label: "Mathématiques"
    icon: "calculator"
    color: "#4F46E5"
    description: "Nombres, calcul, géométrie"
    coursesCount: 8
    path: "subjects/mathematiques/index.yaml"
```

---

## 2. Index d'une matière — `subjects/{subject-id}/index.yaml`

Liste les cours d'une matière, dans l'ordre d'affichage.

```yaml
subject_id: string          # Doit correspondre à l'id dans l'index global

courses:
  - id: string              # Identifiant unique du cours (ex: "math-multiplication-01")
    title: string           # Titre affiché
    thumbnail: string|null  # Chemin vers l'image miniature, ou null
    description: string     # Courte description
    stepsCount: integer     # Nombre total d'étapes (lessons)
    progress: float         # Progression entre 0.0 et 1.0
    status: string          # "available" | "locked" | "completed"
    order: integer          # Ordre d'affichage (commence à 1)
    path: string            # Chemin vers le course.yaml (relatif à public/content/)
```

**Statuts possibles :**

| Valeur | Signification |
|--------|--------------|
| `available` | Cours accessible à l'élève |
| `locked` | Cours verrouillé (prérequis non remplis) |
| `completed` | Cours terminé |

---

## 3. Fichier de cours — `courses/{course-id}/course.yaml`

Définit la structure pédagogique du cours : grandes étapes, leçons, et contenu de chaque leçon.

### Structure de haut niveau

```yaml
course:
  id: string              # Identifiant du cours
  version: string         # Version du fichier (ex: "1.0")
  title: string           # Titre du cours
  subject: string         # Matière parente (ex: "mathematiques")
  domain: string          # Domaine thématique (ex: "calcul", "geometrie")
  thumbnail: string|null  # Chemin vers miniature, ou null
  xp_total: integer       # XP total attribuable dans le cours

  grandes_etapes: [...]   # Chapitres du cours (voir ci-dessous)
  steps_content: [...]    # Contenu de chaque leçon (voir ci-dessous)
```

### `grandes_etapes` — Chapitres

Chaque grande étape regroupe plusieurs leçons.

```yaml
grandes_etapes:
  - id: string            # Identifiant unique (ex: "ge-mult-tables-base")
    title: string         # Titre du chapitre
    icon: string          # Emoji ou nom d'icône
    color: string         # Couleur hexadécimale
    order: integer        # Ordre d'affichage
    status: string        # "available" | "locked" | "in_progress" | "completed"

    lessons:
      - id: string        # Identifiant unique de la leçon
        title: string     # Titre affiché
        type: string      # "lesson" | "exercise_set"
        order: integer    # Ordre dans le chapitre
        status: string    # "available" | "locked" | "in_progress" | "completed"
        content_ref: string  # Référence vers un id dans steps_content
```

### `steps_content` — Contenu des leçons

Chaque entrée correspond à une leçon référencée par son `id`.

```yaml
steps_content:
  - id: string            # Correspond à un content_ref d'une lesson
    content:
      - type: string      # Type de bloc (voir section "Blocs de contenu")
        # ... propriétés spécifiques au type
```

---

## 4. Blocs de contenu d'une leçon

### `md` — Texte Markdown

Contenu textuel avec support Markdown et LaTeX inline (`$...$`).

```yaml
- type: md
  text: string            # Texte en Markdown (supporte $...$  pour LaTeX inline)
```

### `notice` — Encart coloré

Encart visuel pour mettre en valeur une information.

```yaml
- type: notice
  style: string           # Voir styles ci-dessous
  title: string           # (optionnel) Titre de l'encart
  text: string            # Contenu (Markdown + LaTeX inline)
  author: string          # (optionnel) Auteur, pour style "quote"
```

**Styles disponibles :**

| Style | Usage |
|-------|-------|
| `info` | Information générale (fond bleu) |
| `tip` | Astuce pratique (fond vert) |
| `warning` | Avertissement (fond orange) |
| `danger` | Erreur fréquente ou point critique (fond rouge) |
| `example` | Exemple concret (fond gris) |
| `definition` | Définition d'un terme (fond violet) |
| `quote` | Citation (avec champ `author`) |

### `math` — Formule LaTeX

Bloc d'équation mathématique.

```yaml
- type: math
  display: string         # "block" (centré, grande taille) | "inline"
  tex: string             # Formule LaTeX (sans délimiteurs $)
  caption: string         # (optionnel) Légende sous la formule
```

### `image` — Image illustrative

```yaml
- type: image
  src: string|null        # Chemin vers l'image (relatif à public/), ou null
  caption: string         # (optionnel) Légende
  alt: string             # Texte alternatif (accessibilité)
```

### `exercise` — Référence à un exercice

Insère un exercice dans le flux de la leçon.

```yaml
- type: exercise
  ref: string             # id d'un exercice dans exercises.yaml
```

---

## 5. Fichier d'exercices — `courses/{course-id}/exercises.yaml`

Contient la liste de tous les exercices du cours.

### Structure commune à tous les exercices

```yaml
exercises:
  - id: string            # Identifiant unique (ex: "exo-mul-001")
    xp: integer           # Points d'expérience attribués si réussi
    difficulty: integer   # Difficulté : 1 (facile), 2 (moyen), 3 (difficile)
    skills:
      - tag: string       # Compétence ciblée (ex: "mathematiques/fractions")
        weight: float     # Pondération (0.0 – 1.0)
    exercise:
      type: string        # Type d'exercice (voir ci-dessous)
      # ... propriétés spécifiques au type
```

---

## 6. Types d'exercices

### `multiple_choice` — QCM

L'élève choisit une ou plusieurs réponses parmi une liste.

```yaml
exercise:
  type: multiple_choice
  question: string          # Énoncé (Markdown + LaTeX)
  visual:                   # (optionnel) Illustration associée
    type: string            # "pizza" | "gauge" | ...
    numerator: integer
    denominator: integer
  choices:
    - id: string            # Identifiant de la réponse (ex: "a")
      text: string          # Texte affiché (Markdown + LaTeX)
      correct: boolean      # true si c'est la bonne réponse
      feedback: string      # Message affiché après sélection
  settings:
    shuffle: boolean        # true = mélanger l'ordre des choix
```

---

### `fill_in_the_blank` — Texte à trous

L'élève complète des blancs dans une phrase.

```yaml
exercise:
  type: fill_in_the_blank
  instruction: string       # Consigne (Markdown + LaTeX)
  visual:                   # (optionnel) Illustration associée
    type: string            # "pizza" | "gauge" | ...
    numerator: integer
    denominator: integer
  segments:                 # Séquence de textes et de blancs
    - text: string          # Fragment de texte fixe (Markdown + LaTeX)
    - blank:
        id: string          # Identifiant du champ
        answer: string      # Réponse attendue (exacte)
        accept_variants:    # (optionnel) Variantes acceptées
          - string
  hint: string              # (optionnel) Indice affiché à la demande
```

---

### `free_text` — Réponse libre avec correction IA

L'élève rédige une réponse libre. La correction est effectuée par un LLM.

```yaml
exercise:
  type: free_text
  instruction: string       # Consigne
  placeholder: string       # Texte grisé dans le champ vide
  min_words: integer        # Nombre minimum de mots requis
  max_words: integer        # Nombre maximum de mots acceptés
  ai_correction:
    context: string         # Consigne donnée à l'IA pour corriger
    scoring_guide: string   # Grille de notation pour l'IA
    score_max: integer      # Score maximal attribuable
    age_target: integer     # Âge cible de l'élève (adapte le niveau du feedback)
    language: string        # Langue de la correction (ex: "fr")
```

---

### `image_tap` — Clic sur une zone d'image

L'élève clique sur la bonne zone d'une image.

```yaml
exercise:
  type: image_tap
  instruction: string       # Consigne (Markdown)
  image: string             # Chemin vers l'image de fond (relatif à public/)
  svg_zones: string         # (optionnel) Chemin vers un SVG définissant les zones
  zones:
    - id: string            # Identifiant de la zone
      label: string         # (optionnel) Étiquette affichée sur la zone
      correct: boolean      # true si c'est la bonne zone
      feedback: string      # Message affiché après clic

      # Géométrie — deux formes possibles :

      # Forme rectangulaire (coords) :
      coords:
        x: float            # Position horizontale (% de la largeur image, 0–100)
        y: float            # Position verticale (% de la hauteur image, 0–100)
        width: float        # Largeur (%)
        height: float       # Hauteur (%)

      # Forme polygonale :
      shape: "polygon"
      points: string        # Points SVG viewBox en % : "x1,y1 x2,y2 ..."
```

> Une zone utilise soit `coords`, soit `shape: polygon` + `points`. Les coordonnées sont exprimées en pourcentage de la taille de l'image (viewBox 0–100).

---

### `fraction_tap` — Sélection de parts de fraction

L'élève sélectionne le bon nombre de parts pour représenter une fraction.

```yaml
exercise:
  type: fraction_tap
  question: string           # Énoncé (Markdown + LaTeX)
  target_numerator: integer  # Numérateur cible
  target_denominator: integer # Dénominateur cible
  shape: string              # Forme visuelle : "pizza" | "chocolate"
  pieces: integer            # Nombre total de parts affichées
  feedback:
    correct: string          # Message si réussi
    incorrect: string        # Message si raté ({expected} = nombre de parts attendu)
```

---

### `drag_drop` — Glisser-déposer

L'élève glisse des éléments vers leur cible correspondante.

```yaml
exercise:
  type: drag_drop
  instruction: string        # Consigne
  pairs:
    - source:
        id: string           # Identifiant de l'élément source
        text: string         # Texte de l'élément (ou utiliser tex:)
        tex: string          # (optionnel) Formule LaTeX à la place de text
      target:
        id: string           # Identifiant de la cible
        text: string         # Texte de la cible
```

---

### `matching` — Correspondance (relier)

L'élève relie chaque élément gauche à son équivalent droit.

```yaml
exercise:
  type: matching
  instruction: string        # Consigne
  pairs:
    - left:
        id: string           # Identifiant gauche
        text: string         # Texte (Markdown + LaTeX)
      right:
        id: string           # Identifiant droit
        text: string         # Texte (Markdown + LaTeX)
  settings:
    shuffle_right: boolean   # true = mélanger l'ordre des éléments droits
```

---

### `timeline` — Remise en ordre chronologique

L'élève remet des étapes dans le bon ordre.

```yaml
exercise:
  type: timeline
  instruction: string        # Consigne
  items:
    - id: string             # Identifiant de l'étape
      text: string           # Texte de l'étape (Markdown + LaTeX)
      correct_position: integer  # Position correcte (commence à 1)
  settings:
    shuffle: boolean         # true = mélanger au départ
```

---

## 7. Champs LaTeX et Markdown

Dans les champs `text`, `question`, `instruction`, `feedback` :

- **Markdown** : gras `**...**`, italique `*...*`, listes, titres `###`
- **LaTeX inline** : `$formule$` (rendu par KaTeX)
- **LaTeX block** : uniquement via le bloc `type: math` dans `steps_content`

---

## 8. Conventions de nommage des `id`

| Entité | Convention | Exemple |
|--------|-----------|---------|
| Matière | `{matiere}` | `mathematiques` |
| Cours | `{matiere}-{theme}-{nn}` | `math-multiplication-01` |
| Grande étape | `ge-{theme}-{slug}` | `ge-mult-tables-base` |
| Leçon | `lec-{theme}-{nnn}` | `lec-mult-001` |
| Exercice | `exo-{theme}-{type?}-{nnn}` | `exo-mul-drag-001` |
| Compétence | `{matiere}/{domaine}` | `mathematiques/fractions` |

---

## 9. Tableau récapitulatif des types d'exercices

| Type | Interaction | Correction | Visuel |
|------|------------|-----------|--------|
| `multiple_choice` | Cliquer sur une réponse | Automatique | Optionnel (fraction) |
| `fill_in_the_blank` | Saisir du texte dans des blancs | Exacte ou variantes | Optionnel (fraction) |
| `free_text` | Rédiger un paragraphe | IA (LLM) | Non |
| `image_tap` | Cliquer sur une zone d'image | Automatique | Image + zones |
| `fraction_tap` | Sélectionner des parts | Automatique | Pizza / chocolat |
| `drag_drop` | Glisser vers une cible | Automatique | Texte/LaTeX |
| `matching` | Relier gauche↔droite | Automatique | Texte/LaTeX |
| `timeline` | Ordonner des étapes | Automatique | Texte/LaTeX |
