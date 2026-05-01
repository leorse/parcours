# Jalon 1bis — Le Parc : écran des étapes d'un cours

## Objectif

Remplacer l'écran `StepSelectScreen` (liste plate d'étapes) par une vue immersive :
un **parc en SVG** avec un sentier de terre qui relie les étapes du cours,
des grandes étapes (gros ronds) et des leçons (petits ronds),
séparées par un ruisseau franchi via un ponton.
L'ensemble est scrollable verticalement.

Ce composant s'intègre dans le jalon 1 existant sans rien casser.
Il remplace uniquement `StepSelectScreen.jsx`.

---

## Concept visuel

```
[ végétation, arbres, buissons, bancs, réverbères ]

    ●  Grande étape 3 — VERROUILLÉE  (grand rond, cadenas)
    │  sentier
    ~~~~~~~~~~~~~~~~~~~~  ruisseau
    ═══  ponton
    │  sentier
    ●  Grande étape 2 — COMPLÉTÉE    (grand rond, check)
    │
    ○  Leçon 2.3 — complétée         (petit rond)
    │
    ○  Leçon 2.2 — en cours          (petit rond, surligné)
    │
    ○  Leçon 2.1 — complétée         (petit rond)
    │
    ●  Grande étape 1 — EN COURS     (grand rond, pulsant)
    │  sentier
    ▼  (scroll vers le bas = vers le début)
```

Le bas du SVG = le début du parcours. On remonte vers le haut au fil de la progression.
Le scroll commence en bas (position initiale = début du parcours).

---

## Architecture du composant

```
StepSelectScreen.jsx
  └── ParcView.jsx                   ← composant principal SVG scrollable
        ├── ParcBackground.jsx       ← fond herbe + décorations (arbres, buissons...)
        ├── ParcPath.jsx             ← sentier SVG
        ├── ParcStream.jsx           ← ruisseau(x) + ponton(s)
        ├── GrandeEtapeNode.jsx      ← nœud grand rond (grande étape)
        ├── LeconNode.jsx            ← nœud petit rond (leçon)
        └── ParcLegend.jsx           ← légende (optionnelle, en overlay)
```

---

## Structure de données attendue

Le composant reçoit les données depuis `contentService.getSteps(courseId)`.
La structure doit évoluer dès maintenant pour supporter les grandes étapes et leçons :

```js
// src/data/steps.js — nouvelle structure jalon 1bis
export const steps = {
  "histoire-antiquite-01": [

    {
      id: "grande-etape-rome",
      type: "grande_etape",          // ← nouveau type
      title: "Rome antique",
      icon: "🏛",
      color: "#2484e0",
      status: "in_progress",         // completed | in_progress | locked
      lessons: [
        {
          id: "lecon-rome-01",
          type: "lecon",
          title: "La fondation",
          status: "completed",
        },
        {
          id: "lecon-rome-02",
          type: "lecon",
          title: "L'empire",
          status: "in_progress",
        },
        {
          id: "lecon-rome-03",
          type: "lecon",
          title: "La chute",
          status: "locked",
        },
      ]
    },

    {
      id: "grande-etape-grece",
      type: "grande_etape",
      title: "Grèce antique",
      icon: "🏺",
      color: "#9c50c8",
      status: "locked",
      lessons: [
        {
          id: "lecon-grece-01",
          type: "lecon",
          title: "La cité-état",
          status: "locked",
        },
        {
          id: "lecon-grece-02",
          type: "lecon",
          title: "Les dieux grecs",
          status: "locked",
        },
      ]
    },

  ]
}
```

**Important :** mettre à jour `contentService.js` pour exposer cette structure.
Les composants ne lisent jamais `steps.js` directement.

---

## Le SVG — principes techniques

### Approche : SVG dans un conteneur scrollable

```jsx
// ParcView.jsx — structure générale
<div style={{ overflowY: 'auto', height: '100vh' }}>
  <svg
    width="100%"
    viewBox={`0 0 400 ${totalHeight}`}
    preserveAspectRatio="xMidYMin meet"
  >
    {/* tout le parc ici */}
  </svg>
</div>
```

Le SVG est **adaptatif en largeur** (`width="100%"`) et sa hauteur est calculée
dynamiquement selon le nombre d'étapes.

### Calcul de la hauteur totale

```js
const GRANDE_ETAPE_HEIGHT = 140   // espace vertical pour une grande étape
const LECON_HEIGHT = 90           // espace vertical pour une leçon
const STREAM_HEIGHT = 60          // hauteur du ruisseau + ponton
const PADDING_TOP = 80
const PADDING_BOTTOM = 100

function calcTotalHeight(grandesEtapes) {
  let h = PADDING_TOP + PADDING_BOTTOM
  grandesEtapes.forEach((ge, i) => {
    h += GRANDE_ETAPE_HEIGHT
    h += ge.lessons.length * LECON_HEIGHT
    if (i < grandesEtapes.length - 1) {
      h += STREAM_HEIGHT   // ruisseau entre chaque grande étape
    }
  })
  return h
}
```

### Coordonnées — système de placement

Le SVG a une largeur de référence de **400px** (viewBox).
Le centre du sentier est toujours à **x = 200**.

```js
const CENTER_X = 200

// Positions X des éléments décoratifs
const LEFT_DECO_X  = 60    // arbres, buissons, bancs côté gauche
const RIGHT_DECO_X = 340   // arbres, buissons côté droit
```

---

## Les éléments SVG

### 1. Fond herbe

```jsx
// Fond principal
<rect width="400" height={totalHeight} fill="#6abf69"/>

// Zones latérales légèrement plus claires
<rect x="0" y="0" width="80" height={totalHeight} fill="#7acc6e" opacity="0.4"/>
<rect x="320" y="0" width="80" height={totalHeight} fill="#7acc6e" opacity="0.4"/>
```

### 2. Le sentier

Un `<path>` SVG légèrement sinueux centré sur x=200.
Le sentier est dessiné en **deux couches** pour simuler la terre :

```jsx
// Couche principale (terre)
<path
  d={sentierPath}
  stroke="#c4964a"
  strokeWidth="28"
  fill="none"
  strokeLinecap="round"
/>
// Couche claire par-dessus (reflet)
<path
  d={sentierPath}
  stroke="#d4a85a"
  strokeWidth="18"
  fill="none"
  strokeLinecap="round"
  opacity="0.5"
/>
```

Le path est généré dynamiquement avec de légères sinuosités :

```js
function generateSentierPath(segments) {
  // segments = liste de {yStart, yEnd, hasSinuosite}
  // Génère un chemin avec de légères courbes de Bézier
  // pour que le sentier ne soit pas parfaitement droit
  return segments.map(seg =>
    `M ${CENTER_X} ${seg.yStart} C ${CENTER_X + seg.offset} ${seg.yMid} ${CENTER_X - seg.offset} ${seg.yMid2} ${CENTER_X} ${seg.yEnd}`
  ).join(' ')
}
```

### 3. Le ruisseau + ponton

Placé entre chaque grande étape.

```jsx
// Ruisseau — path ondulé horizontal
<path
  d={`M 0 ${streamY} Q 100 ${streamY-8} 200 ${streamY} Q 300 ${streamY+8} 400 ${streamY}`}
  stroke="#5bb8f5"
  strokeWidth="24"
  fill="none"
  opacity="0.8"
/>
// Reflet eau
<path
  d={`M 0 ${streamY} Q 100 ${streamY-8} 200 ${streamY} Q 300 ${streamY+8} 400 ${streamY}`}
  stroke="#82ccf7"
  strokeWidth="14"
  fill="none"
  opacity="0.6"
/>
// Petits reflets statiques
<path d={`M 60 ${streamY-3} Q 90 ${streamY-7} 120 ${streamY-3}`}
      stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>

// Ponton — planche en bois au centre
<rect x={CENTER_X - 20} y={streamY - 14} width="40" height="28"
      fill="#8B5E3C" rx="3" opacity="0.92"/>
// Lames du ponton
{[0, 7, 14].map(offset => (
  <rect x={CENTER_X - 16} y={streamY - 11 + offset}
        width="32" height="3" fill="#a0703d" rx="1" key={offset}/>
))}
// Poteaux
<rect x={CENTER_X - 18} y={streamY - 18} width="4" height="36"
      fill="#6B4226" rx="1"/>
<rect x={CENTER_X + 14} y={streamY - 18} width="4" height="36"
      fill="#6B4226" rx="1"/>
```

### 4. Grande étape (gros rond)

Rayon : **38px**

```jsx
function GrandeEtapeNode({ x, y, step }) {
  const isLocked = step.status === 'locked'
  const isCompleted = step.status === 'completed'
  const isInProgress = step.status === 'in_progress'

  return (
    <g
      onClick={() => !isLocked && onStepClick(step)}
      style={{ cursor: isLocked ? 'default' : 'pointer' }}
    >
      {/* Ombre portée */}
      <circle cx={x} cy={y+4} r={38} fill="black" opacity="0.15"/>

      {/* Cercle principal */}
      <circle cx={x} cy={y} r={38}
              fill={isLocked ? '#aaa' : step.color}
              opacity={isLocked ? 0.6 : 0.95}/>

      {/* Bordure */}
      <circle cx={x} cy={y} r={38}
              fill="none" stroke="white" strokeWidth="3"
              strokeDasharray={isLocked ? "8 4" : "none"}/>

      {/* Icône */}
      {!isLocked && (
        <text x={x} y={y-6} textAnchor="middle" fontSize="20">{step.icon}</text>
      )}

      {/* Cadenas si verrouillé */}
      {isLocked && (
        <text x={x} y={y+6} textAnchor="middle" fontSize="22">🔒</text>
      )}

      {/* Check si complété */}
      {isCompleted && (
        <circle cx={x+28} cy={y-28} r={13} fill="#4caf50"/>
        <text x={x+28} y={y-23} textAnchor="middle" fontSize="14" fill="white">✓</text>
      )}

      {/* Titre sous le rond */}
      <rect x={x-70} y={y+46} width="140" height="24"
            fill="white" rx="12" opacity="0.9"/>
      <text x={x} y={y+62} textAnchor="middle"
            fontFamily="sans-serif" fontSize="12" fontWeight="600"
            fill={isLocked ? '#9B9B9B' : step.color}>
        {step.title}
      </text>
    </g>
  )
}
```

**Animation pulse pour l'étape en cours :**

```jsx
// Uniquement si status === 'in_progress'
{isInProgress && (
  <circle cx={x} cy={y} r={38} fill="none"
          stroke={step.color} strokeWidth="4" opacity="0.5">
    <animate attributeName="r" values="38;50;38" dur="2s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
  </circle>
)}
```

### 5. Leçon (petit rond)

Rayon : **22px**

```jsx
function LeconNode({ x, y, lecon }) {
  const colors = {
    completed:   { fill: '#4caf50', label: '✓' },
    in_progress: { fill: '#f5a623', label: '▶' },
    locked:      { fill: '#ccc',    label: '🔒' },
  }
  const { fill, label } = colors[lecon.status]

  return (
    <g onClick={() => lecon.status !== 'locked' && onLeconClick(lecon)}
       style={{ cursor: lecon.status === 'locked' ? 'default' : 'pointer' }}>

      <circle cx={x} cy={y} r={22} fill={fill} opacity={lecon.status === 'locked' ? 0.6 : 0.95}/>
      <circle cx={x} cy={y} r={22} fill="none" stroke="white" strokeWidth="2.5"/>
      <text x={x} y={y+4} textAnchor="middle" fontSize="12" fill="white">{label}</text>

      {/* Titre à côté du rond (alterné gauche/droite pour lisibilité) */}
      <text x={x + 30} y={y+4} textAnchor="start"
            fontFamily="sans-serif" fontSize="12" fill="white"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
        {lecon.title}
      </text>
    </g>
  )
}
```

### 6. Décorations — arbres, buissons, bancs, réverbères

Les décorations sont **placées aléatoirement mais de manière déterministe**
(seed basé sur l'id du cours) pour ne pas changer à chaque rendu.

```js
// Générateur pseudo-aléatoire déterministe
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateDecorations(courseId, totalHeight) {
  const rng = seededRandom(courseId.charCodeAt(0) + courseId.length)
  const decos = []

  // Arbres
  const treeCount = Math.floor(totalHeight / 200)
  for (let i = 0; i < treeCount; i++) {
    const side = rng() > 0.5 ? 'left' : 'right'
    decos.push({
      type: 'tree',
      x: side === 'left' ? 30 + rng() * 60 : 310 + rng() * 60,
      y: 80 + rng() * (totalHeight - 160),
    })
  }

  // Buissons
  // Bancs
  // Réverbères
  // ... même logique

  return decos
}
```

**Arbre SVG :**

```jsx
function TreeDeco({ x, y }) {
  return (
    <g>
      <rect x={x-4} y={y} width="8" height="24" fill="#8B5E3C" rx="2"/>
      <circle cx={x} cy={y} r="18" fill="#2d8a2d"/>
      <circle cx={x-8} cy={y+6} r="13" fill="#34a034"/>
      <circle cx={x+8} cy={y+4} r="11" fill="#2d8a2d"/>
    </g>
  )
}
```

**Buisson SVG :**

```jsx
function BuissonDeco({ x, y }) {
  return (
    <g fill="#228B22" opacity="0.85">
      <ellipse cx={x} cy={y} rx="20" ry="12"/>
      <ellipse cx={x-12} cy={y+3} rx="14" ry="9"/>
      <ellipse cx={x+10} cy={y+2} rx="12" ry="8"/>
    </g>
  )
}
```

**Banc SVG :**

```jsx
function BancDeco({ x, y }) {
  return (
    <g>
      <rect x={x} y={y} width="28" height="5" fill="#8B5E3C" rx="2"/>
      <rect x={x+2} y={y+5} width="4" height="9" fill="#6B4226" rx="1"/>
      <rect x={x+22} y={y+5} width="4" height="9" fill="#6B4226" rx="1"/>
    </g>
  )
}
```

**Réverbère SVG :**

```jsx
function ReverbereDeco({ x, y }) {
  return (
    <g>
      <rect x={x} y={y} width="3" height="28" fill="#555" rx="1"/>
      <path d={`M${x+1} ${y} Q${x+8} ${y-9} ${x+13} ${y-6}`}
            stroke="#555" strokeWidth="2" fill="none"/>
      <circle cx={x+13} cy={y-7} r="4" fill="#ffe066" opacity="0.9"/>
    </g>
  )
}
```

---

## Gestion du scroll — position initiale

Au chargement, le scroll doit se positionner automatiquement sur l'étape en cours.
Utiliser un `useEffect` avec `scrollIntoView` ou un calcul de `scrollTop` :

```js
useEffect(() => {
  const currentStepY = calcCurrentStepY(steps)  // position Y de l'étape en cours
  const container = containerRef.current
  if (container) {
    // Centrer l'étape en cours dans la vue
    container.scrollTop = currentStepY - window.innerHeight / 2
  }
}, [])
```

---

## Gestion du clic sur un nœud

```jsx
const handleStepClick = (step) => {
  if (step.status === 'locked') return

  // Navigation vers le StepPlayer
  navigate(ROUTES.PLAYER
    .replace(':courseId', courseId)
    .replace(':stepId', step.id)
  )
}
```

---

## Intégration dans le projet existant

### Fichiers à créer

```
src/
  screens/
    StepSelect/
      StepSelectScreen.jsx       ← modifier (wrapper vers ParcView)
      ParcView.jsx               ← composant principal
      components/
        ParcBackground.jsx
        ParcPath.jsx
        ParcStream.jsx
        GrandeEtapeNode.jsx
        LeconNode.jsx
        decorations/
          TreeDeco.jsx
          BuissonDeco.jsx
          BancDeco.jsx
          ReverbereDeco.jsx
```

### Fichiers à modifier

```
src/data/steps.js              ← nouvelle structure grande_etape / lecon
src/services/contentService.js ← adapter getSteps() si besoin
```

### Ce qui NE change pas

```
✓ AppRouter.jsx               → routes inchangées
✓ AppContext.jsx              → contexte inchangé
✓ contentService.js (interface) → getSteps() existe toujours
✓ Tous les autres écrans      → non affectés
✓ useProgress.js              → stub inchangé
✓ theme.js                   → couleurs inchangées
```

---

## Ce qu'il ne faut PAS faire dans ce jalon 1bis

```
✗ Ne pas animer le déplacement d'un personnage sur le sentier (jalon 6)
✗ Ne pas calculer la vraie progression (jalon 4)
✗ Ne pas charger les décorations depuis un fichier externe (jalon 2)
✗ Ne pas faire un SVG statique avec des coordonnées en dur
  → les positions doivent être calculées dynamiquement selon le nombre d'étapes
✗ Ne pas utiliser de bibliothèque SVG tierce (D3, Konva...)
  → SVG natif uniquement, c'est suffisant et plus léger
```

---

## Ce qu'il faut absolument faire

```
✓ SVG 100% dynamique — calculé depuis les données, pas codé en dur
✓ Responsive — fonctionne sur toutes les largeurs d'écran
✓ Scroll positionné sur l'étape en cours au chargement
✓ Décorations déterministes (même seed = même disposition)
✓ Animation pulse sur l'étape en cours
✓ Clic fonctionnel sur les étapes non verrouillées
✓ Structure de données compatible avec le jalon 2 (YAML → même structure)
✓ Ruisseau + ponton entre chaque grande étape
```

---

## Palette couleurs par matière (suggestion)

À intégrer dans `theme.js` :

```js
export const subjectStepColors = {
  mathematiques: {
    grandeEtape: ["#2484e0", "#9c50c8", "#e05c24", "#24a0a0"],  // une couleur par grande étape
  },
  histoire: {
    grandeEtape: ["#2484e0", "#9c50c8", "#c0392b", "#27ae60"],
  },
  francais: {
    grandeEtape: ["#27ae60", "#2484e0", "#e05c24", "#9c50c8"],
  },
}
```

Chaque grande étape prend la couleur suivante dans le tableau,
de bas en haut (début du parcours = première couleur).
