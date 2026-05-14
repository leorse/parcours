# Manuel de l'application Parcours

---

## Sommaire

1. [Pour l'utilisateur — naviguer dans l'application](#1-pour-lutilisateur)
   - [Se connecter](#11-se-connecter)
   - [Choisir une matière et un cours](#12-choisir-une-matière-et-un-cours)
   - [Parcourir une leçon](#13-parcourir-une-leçon)
   - [Faire un exercice](#14-faire-un-exercice)
   - [Résultats et XP](#15-résultats-et-xp)
   - [Mon profil et ma progression](#16-mon-profil-et-ma-progression)

2. [Pour le créateur de contenu — créer des cours](#2-pour-le-créateur-de-contenu)
   - [Structure des fichiers](#21-structure-des-fichiers)
   - [Créer un nouveau cours](#22-créer-un-nouveau-cours)
   - [Rédiger le contenu d'une leçon](#23-rédiger-le-contenu-dune-leçon)
   - [Créer des exercices](#24-créer-des-exercices)
   - [Déclarer les compétences](#25-déclarer-les-compétences)

---

## 1. Pour l'utilisateur

### 1.1 Se connecter

Au démarrage, l'application affiche un écran de sélection de profil. Chaque profil est représenté par un prénom et un avatar. Il suffit de toucher son profil pour entrer.

Il n'y a pas de mot de passe : le profil retient automatiquement toute la progression.

---

### 1.2 Choisir une matière et un cours

Après connexion, le menu principal apparaît. Le bouton **Jouer** mène à la liste des matières disponibles (Mathématiques, Histoire, Français, Sciences…).

En touchant une matière, on arrive sur la liste des cours disponibles pour cette matière. Chaque cours affiche :
- son titre
- le nombre de XP qu'il rapporte au total
- son état (disponible ou verrouillé)

On touche un cours pour l'ouvrir.

---

### 1.3 Parcourir une leçon

Un cours est divisé en **grandes étapes** (par exemple « Divisibilité », « Multiples », « Nombres premiers »). Chaque grande étape contient des **leçons** et des **séries d'exercices**.

À l'intérieur d'une leçon, le contenu défile verticalement :
- des **textes** avec définitions, exemples, tableaux
- des **formules mathématiques** rendues proprement
- des **encadrés colorés** (définition, exemple, astuce, attention, info)
- des **exercices interactifs** intégrés directement dans le texte

On lit la leçon de haut en bas et on fait les exercices au fil du texte. Il n'y a pas de bouton "page suivante" : tout est sur une même page à faire défiler.

---

### 1.4 Faire un exercice

Plusieurs types d'exercices existent dans l'application.

#### Choix multiple
Une question est posée, plusieurs réponses sont proposées. On touche la réponse choisie, puis on touche **Vérifier**. Un retour immédiat indique si c'est correct, avec une explication.

> Certains exercices acceptent plusieurs réponses correctes. Dans ce cas, toutes les bonnes réponses doivent être sélectionnées avant de vérifier.

#### Texte à trous
Une phrase incomplète s'affiche avec des cases vides à remplir. On touche une case, on tape sa réponse, puis on valide. Des variantes d'orthographe peuvent être acceptées (ex. « est un diviseur de » et « divise » pour la même case).

#### Formule à trous
Comme le texte à trous, mais les cases s'insèrent directement à l'intérieur d'une formule mathématique (par exemple dans un numérateur ou dénominateur de fraction). On clique dans la case, on tape le chiffre.

#### Glisser-déposer
Des éléments sont à relier par paires. On fait glisser chaque élément de gauche vers son correspondant à droite (ou l'inverse selon l'exercice).

#### Cliquer sur une image
Une image ou une carte géographique est affichée. On touche la zone correspondant à la bonne réponse (un portrait, une région sur une carte, etc.). Un retour visuel indique immédiatement si c'est correct.

#### Fractions visuelles
Une pizza ou un gâteau est divisé en parts. On touche les parts pour atteindre la fraction demandée, puis on valide.

#### Frise chronologique
Des événements sont à placer dans l'ordre chronologique en les déplaçant sur une ligne de temps.

#### Correspondances
Des colonnes d'éléments sont à relier par paires en les faisant glisser les uns vers les autres.

#### Texte libre
Une question ouverte est posée, on tape une réponse libre. La correction est effectuée automatiquement.

#### Dictée
Un bouton audio 🔊 permet d'écouter un mot ou une phrase prononcé à voix haute. On écoute, puis on tape ce qu'on a entendu dans le champ de saisie. Un indice optionnel peut être affiché si besoin.

> La dictée nécessite que le navigateur supporte la synthèse vocale (Chrome recommandé).

---

### 1.5 Résultats et XP

Après avoir validé un exercice, un récapitulatif s'affiche :
- une icône ✅ (correct) ou ❌ (incorrect)
- le score en pourcentage
- un retour explicatif (pourquoi c'est juste ou faux)
- les **XP gagnés** (points d'expérience)

Les XP dépendent du score obtenu et de la difficulté de l'exercice. Un exercice raté rapporte peu ou pas de XP ; un exercice réussi rapporte la totalité.

Si un exercice est raté, un bouton **Réessayer** permet de recommencer.

Si un nouveau badge est débloqué après un exercice, une notification apparaît en bas de l'écran avec le badge obtenu et sa description.

---

### 1.6 Mon profil et ma progression

Depuis le menu principal, le bouton **profil** (icône silhouette en haut à droite) ouvre l'écran de profil. On y trouve :

#### Niveau et barre d'XP
Le niveau actuel (de 1 « Explorateur » à 7 « Légende ») et la progression vers le niveau suivant. La barre se remplit au fil des exercices complétés.

| Niveau | Nom | XP requis |
|--------|-----|-----------|
| 1 | Explorateur 🌱 | 0 |
| 2 | Apprenti 📚 | 100 |
| 3 | Aventurier 🧭 | 300 |
| 4 | Expert ⭐ | 600 |
| 5 | Maître 🏆 | 1000 |
| 6 | Champion 👑 | 1500 |
| 7 | Légende 🌟 | 2200 |

#### Série de jours (streak)
Si l'application est utilisée plusieurs jours de suite, un compteur de flamme 🔥 indique le nombre de jours consécutifs.

#### Radar des compétences
Un graphique en toile d'araignée représente les différentes compétences travaillées. Plus une branche est longue, plus la compétence est maîtrisée.

#### Points forts et points à travailler
L'application identifie automatiquement les compétences les mieux maîtrisées (en vert) et celles qui nécessitent encore de la pratique (en orange).

#### Badges
Une grille de badges affiche ceux déjà débloqués (en couleur) et ceux encore à obtenir (verrou 🔒). Les badges peuvent être obtenus en :
- complétant un certain nombre d'exercices
- maintenant une série de jours
- atteignant un bon score sur une compétence
- obtenant des scores parfaits

---

## 2. Pour le créateur de contenu

Tout le contenu de l'application (cours, leçons, exercices) est défini dans des fichiers **YAML**, rangés dans le dossier `public/content/`. Aucun code à écrire : on crée des fichiers texte avec une syntaxe simple.

### 2.1 Structure des fichiers

```
public/content/
├── index.yaml                          ← liste des matières
├── skills-tree.yaml                    ← arbre des compétences
├── config/
│   ├── levels.yaml                     ← définition des niveaux XP
│   ├── badges.yaml                     ← définition des badges
│   └── trophies.yaml                   ← définition des trophées
└── subjects/
    └── mathematiques/
        ├── index.yaml                  ← description de la matière
        └── courses/
            └── math-fractions-01/
                ├── course.yaml         ← structure du cours (étapes, leçons)
                └── exercises.yaml      ← tous les exercices du cours
```

Chaque cours vit dans son propre dossier. L'identifiant du dossier (`math-fractions-01`) doit être unique dans toute l'application.

---

### 2.2 Créer un nouveau cours

#### Étape 1 — Créer le dossier

Créer un dossier dans `public/content/subjects/<matière>/courses/<id-du-cours>/`.

Exemple pour un cours de géographie :
```
public/content/subjects/histoire/courses/hist-geographie-01/
```

#### Étape 2 — Déclarer le cours dans l'index de la matière

Dans `public/content/subjects/histoire/index.yaml`, ajouter le cours à la liste :

```yaml
courses:
  - id: "hist-antiquite-01"
    title: "L'Antiquité"
    # ... cours existants ...
  - id: "hist-geographie-01"
    title: "La géographie de la France"
```

#### Étape 3 — Écrire le fichier `course.yaml`

Ce fichier décrit la structure du cours : ses grandes étapes et les leçons à l'intérieur.

```yaml
course:
  id: "hist-geographie-01"
  version: "1.0"
  title: "La géographie de la France"
  subject: "histoire"
  domain: "geographie"
  thumbnail: null
  xp_total: 150          # total XP disponible dans ce cours

  grandes_etapes:

    - id: "ge-geo-regions"
      title: "Les régions"
      icon: "🗺️"
      color: "#2484e0"    # couleur de l'étape (hexadécimal)
      order: 1
      status: "available" # "available" = accessible, "locked" = verrouillé

      lessons:
        - id: "lec-geo-001"
          title: "Les grandes régions"
          type: "lesson"            # "lesson" ou "exercise_set"
          order: 1
          status: "available"
          content_ref: "lec-geo-001"  # référence au contenu dans steps_content

        - id: "lec-geo-002"
          title: "Exercices — Régions"
          type: "exercise_set"
          order: 2
          status: "available"
          content_ref: "lec-geo-exo-001"

  steps_content:

    - id: "lec-geo-001"
      content:
        - type: md
          text: |
            ## Les grandes régions de France

            La France métropolitaine est divisée en **13 régions** depuis 2016...
        - type: exercise
          ref: "exo-geo-mc-001"

    - id: "lec-geo-exo-001"
      content:
        - type: md
          text: "## Entraînement — Régions de France"
        - type: exercise
          ref: "exo-geo-mc-001"
        - type: exercise
          ref: "exo-geo-map-001"
```

**Règles importantes :**
- Chaque `content_ref` dans une leçon doit correspondre à un `id` dans `steps_content`.
- Chaque `ref` d'exercice doit exister dans `exercises.yaml`.
- Les `id` doivent être uniques dans tout le cours.

---

### 2.3 Rédiger le contenu d'une leçon

Le contenu d'une leçon est une liste de blocs. Plusieurs types de blocs sont disponibles.

#### Bloc texte Markdown (`md`)

Le texte le plus courant. Supporte le Markdown standard : titres, listes, gras, italique, tableaux.

```yaml
- type: md
  text: |
    ## Mon titre

    Un paragraphe avec du **gras** et de *l'italique*.

    | Colonne A | Colonne B |
    |-----------|-----------|
    | Valeur 1  | Valeur 2  |
```

Les formules mathématiques s'écrivent entre `$` (en ligne) ou `$$` (bloc centré) :

```yaml
- type: md
  text: |
    La formule $a^2 + b^2 = c^2$ s'appelle le théorème de Pythagore.

    $$\frac{a}{b} = \frac{c}{d}$$
```

#### Bloc formule (`math`)

Pour afficher une formule mathématique seule, avec une légende optionnelle.

```yaml
- type: math
  display: "block"       # "block" = centré sur sa ligne, "inline" = dans le texte
  tex: "E = mc^2"
  caption: "La formule d'Einstein"
```

#### Bloc encadré (`notice`)

Un encadré coloré pour mettre en valeur une définition, un exemple, une astuce ou un avertissement.

```yaml
- type: notice
  style: definition    # ou : example, tip, warning, info
  title: "Définition — Nombre premier"
  text: |
    Un entier est **premier** s'il n'a que deux diviseurs : 1 et lui-même.
```

Les styles disponibles et leur apparence :
| Style | Usage | Couleur |
|-------|-------|---------|
| `definition` | Définitions formelles | Bleu |
| `example` | Exemples illustrés | Vert |
| `tip` | Astuces et méthodes | Jaune |
| `warning` | Erreurs fréquentes, attention | Orange |
| `info` | Informations générales | Gris bleu |

#### Bloc exercice (`exercise`)

Insère un exercice à cet endroit de la leçon.

```yaml
- type: exercise
  ref: "exo-geo-mc-001"    # doit exister dans exercises.yaml
```

---

### 2.4 Créer des exercices

Tous les exercices d'un cours sont dans le fichier `exercises.yaml`. Chaque exercice a une structure commune :

```yaml
- id: "exo-geo-mc-001"        # identifiant unique dans tout l'application
  xp: 20                      # XP gagnés si 100% correct
  difficulty: 1               # 1 = facile, 2 = moyen, 3 = difficile
  skills:
    - tag: "histoire/geographie"   # compétence travaillée (voir skills-tree.yaml)
      weight: 1.0
  exercise:
    type: multiple_choice     # type d'exercice
    # ... paramètres selon le type ...
```

Voici tous les types disponibles avec leurs paramètres.

---

#### Type `multiple_choice` — Choix multiple

```yaml
exercise:
  type: multiple_choice
  question: |
    Quelle est la capitale de la France ?
    *(Une seule réponse correcte)*
  choices:
    - id: "a"
      text: "Lyon"
      correct: false
      feedback: "Non, Lyon est la deuxième ville de France mais pas la capitale."
    - id: "b"
      text: "Paris"
      correct: true
      feedback: "Exact ! Paris est la capitale depuis des siècles."
    - id: "c"
      text: "Marseille"
      correct: false
      feedback: "Marseille est la grande ville du Sud, pas la capitale."
    - id: "d"
      text: "Bordeaux"
      correct: false
      feedback: "Bordeaux est célèbre pour ses vins, pas pour être la capitale."
  settings:
    shuffle: true    # mélange l'ordre des réponses à chaque fois
```

Quand **plusieurs réponses sont correctes**, il suffit de mettre `correct: true` sur plusieurs choix. L'utilisateur devra toutes les sélectionner.

---

#### Type `fill_in_the_blank` — Texte à trous

Une phrase découpée en segments de texte et de cases vides.

```yaml
exercise:
  type: fill_in_the_blank
  instruction: |
    Complète la phrase suivante sur la France.
  segments:
    - text: "La France compte "
    - blank:
        id: "b1"
        answer: "13"
    - text: " régions métropolitaines depuis "
    - blank:
        id: "b2"
        answer: "2016"
        accept_variants:
          - "deux mille seize"   # variantes orthographiques acceptées
    - text: "."
  hint: "La réforme territoriale a eu lieu dans les années 2010."
```

> Le champ `hint` est optionnel. Si présent, l'utilisateur peut choisir de l'afficher.

---

#### Type `fill_in_the_blank` avec segment `formula` — Formule à trous

Pour insérer des cases directement dans une formule mathématique.

```yaml
exercise:
  type: fill_in_the_blank
  instruction: |
    Simplifie cette fraction en utilisant PGCD(36, 84) = 12.
  segments:
    - formula: "$\\frac{36}{84} = \\frac{36 \\div [b1]}{84 \\div [b2]} = \\frac{[b3]}{[b4]}$"
      blanks:
        - { id: "b1", answer: "12" }
        - { id: "b2", answer: "12" }
        - { id: "b3", answer: "3" }
        - { id: "b4", answer: "7" }
```

Les marqueurs `[b1]`, `[b2]`… dans la formule sont remplacés par des cases de saisie positionnées à l'intérieur de la formule.

> Un même exercice peut mélanger des segments `text`/`blank` classiques et des segments `formula`.

---

#### Type `drag_drop` — Glisser-déposer (associer des paires)

```yaml
exercise:
  type: drag_drop
  instruction: |
    Relie chaque capitale à son pays.
  pairs:
    - source:
        id: "s1"
        text: "Paris"
      target:
        id: "t1"
        text: "France"
    - source:
        id: "s2"
        text: "Rome"
      target:
        id: "t2"
        text: "Italie"
    - source:
        id: "s3"
        text: "Madrid"
      target:
        id: "t3"
        text: "Espagne"
```

---

#### Type `image_tap` — Cliquer sur une image

Deux variantes selon le type d'image.

**Avec une image SVG prédécoupée en zones nommées :**

```yaml
exercise:
  type: image_tap
  instruction: "Clique sur le portrait de **Beethoven**."
  image: "/content/images/compositeurs.jpg"
  svg_zones: "/content/images/compositeurs.svg"   # fichier SVG avec des zones id="bet", "moz"...
  zones:
    - id: bet
      correct: true
      feedback: "Oui ! Ludwig van Beethoven (1770–1827)."
    - id: moz
      correct: false
      feedback: "Non, c'est Mozart."
```

**Avec des coordonnées en pourcentage sur l'image :**

```yaml
exercise:
  type: image_tap
  instruction: "Clique sur la région qui correspond à l'**Égypte** antique."
  image: "/content/images/carte-mediterranee.svg"
  zones:
    - id: egypte
      coords: { x: 70, y: 53, width: 30, height: 40 }   # en % de la largeur/hauteur
      correct: true
      feedback: "Oui ! L'Égypte antique, sur les rives du Nil."
    - id: grece
      shape: polygon
      points: "55,19 70,18 72.5,43 60,47"               # points en % de l'image
      correct: false
      feedback: "C'est la Grèce antique."
```

---

#### Type `fraction_tap` — Cliquer sur des parts de fraction

```yaml
exercise:
  type: fraction_tap
  question: "Sélectionne **3/4** de la pizza."
  target_numerator: 3
  target_denominator: 4
  shape: pizza         # "pizza" ou "chocolate"
  pieces: 8            # nombre total de parts affichées
  feedback:
    correct: "Bravo ! 6 parts sur 8 font bien 3/4."
    incorrect: "Pas tout à fait... Il fallait {expected} parts."
```

---

#### Type `matching` — Relier des colonnes

```yaml
exercise:
  type: matching
  instruction: "Relie chaque souverain à son siècle."
  pairs:
    - left:  { id: "l1", text: "Charlemagne" }
      right: { id: "r1", text: "IXe siècle" }
    - left:  { id: "l2", text: "Louis XIV" }
      right: { id: "r2", text: "XVIIe siècle" }
    - left:  { id: "l3", text: "Napoléon" }
      right: { id: "r3", text: "XIXe siècle" }
```

---

#### Type `timeline` — Remettre dans l'ordre chronologique

```yaml
exercise:
  type: timeline
  instruction: "Remets ces événements dans l'ordre chronologique."
  events:
    - id: "e1"
      text: "Chute de Rome"
      year: 476
    - id: "e2"
      text: "Croisades"
      year: 1095
    - id: "e3"
      text: "Révolution française"
      year: 1789
```

---

#### Type `free_text` — Réponse libre

```yaml
exercise:
  type: free_text
  question: |
    Explique en quelques phrases pourquoi Rome est tombée.
  expected_keywords:
    - "barbares"
    - "déclin"
    - "empire"
  max_length: 500
```

> La réponse est évaluée automatiquement par un modèle de langage. Le feedback sera personnalisé.

---

#### Type `dictation` — Dictée

```yaml
exercise:
  type: dictation
  disable_spellcheck: true    # désactive la correction automatique du navigateur
  words:
    - text: "Charlemagne"
      hint: "roi des Francs couronné en 800"
    - text: "cathédrale"
      hint: "grande église gothique"
    - text: "chevalier"
      # hint est optionnel
```

Chaque mot est lu à voix haute par le navigateur. L'utilisateur l'écoute puis le tape. Le champ `hint` est optionnel : si présent, l'utilisateur peut choisir de l'afficher.

On peut aussi dicter des phrases entières :

```yaml
words:
  - text: "les chevaliers partent en croisade"
  - text: "le roi signe la charte"
```

---

### 2.5 Déclarer les compétences

Chaque exercice est associé à une ou plusieurs compétences via le champ `skills`. Ces compétences doivent exister dans `public/content/skills-tree.yaml`.

```yaml
# Dans exercises.yaml
skills:
  - tag: "histoire/geographie"
    weight: 1.0
```

Pour ajouter une nouvelle compétence, ouvrir `public/content/skills-tree.yaml` et ajouter une entrée dans la matière correspondante :

```yaml
skills:
  - subject: "histoire"
    color: "#B45309"
    children:
      - id: "histoire/antiquite"
        label: "Antiquité"
      - id: "histoire/moyen-age"
        label: "Moyen Âge"
      - id: "histoire/geographie"    # ← nouvelle compétence
        label: "Géographie"
```

Le tag suit la convention `<matière>/<domaine>`. Le `weight` (entre 0 et 1) indique dans quelle mesure cet exercice travaille cette compétence. La plupart du temps, on met `1.0`.

---

### Récapitulatif — Checklist pour créer un cours

- [ ] Créer le dossier `public/content/subjects/<matière>/courses/<id-cours>/`
- [ ] Déclarer le cours dans `public/content/subjects/<matière>/index.yaml`
- [ ] Écrire `course.yaml` avec les grandes étapes et les leçons
- [ ] Écrire `exercises.yaml` avec tous les exercices
- [ ] Vérifier que chaque `content_ref` a son entrée dans `steps_content`
- [ ] Vérifier que chaque `ref` d'exercice existe dans `exercises.yaml`
- [ ] Vérifier que les compétences utilisées existent dans `skills-tree.yaml`
- [ ] Calculer et mettre à jour `xp_total` dans `course.yaml` (somme des XP de tous les exercices)
