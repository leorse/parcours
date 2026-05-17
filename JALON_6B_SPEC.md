# Jalon 6b — Événements contextuels, dialogues et personnages
## Document technique pour Claude dans VS Code

---

## Objectif

Compléter et corriger le jalon 6 sur trois points :

1. **Événements contextuels** — chaque matière et chaque cours peut avoir
   son propre `events.yaml` chargé selon le contexte de navigation
2. **Session validée par exercice** — une session ne compte que si au moins
   un exercice est complété dans la journée
3. **Dialogues et monologues** — deux nouveaux types de séquences narratives
   avec personnages animés via spritesheets

**Ce qui ne change pas :** le moteur d'événements global, la queue,
`MascotteDialog`, les célébrations, les conditions existantes,
les composants d'exercices, le parc SVG, le backend.

---

## Partie 1 — Événements contextuels

### Nouvelle organisation des fichiers

```
public/content/
  events/
    events.yaml                        ← événements GLOBAUX (inchangé)

  subjects/
    mathematiques/
      index.yaml
      events.yaml                      ← événements spécifiques aux maths
      courses/
        math-multiplication-01/
          course.yaml
          exercises.yaml
          events.yaml                  ← événements spécifiques à ce cours

    histoire/
      index.yaml
      events.yaml
      courses/
        histoire-antiquite-01/
          course.yaml
          exercises.yaml
          events.yaml
```

### Format d'un events.yaml contextuel

Même format que l'events.yaml global. La différence est dans le trigger :
les triggers contextuels utilisent `subject_enter` ou `course_enter`
et le moteur ne les charge que dans le bon contexte.

```yaml
# subjects/mathematiques/events.yaml

events:

  - id: "evt-math-first-enter"
    once: true
    trigger:
      on: "subject_enter"
      # Pas besoin de filtrer par subject_id — ce fichier
      # n'est chargé que quand on entre dans les maths
    conditions: []
    actions:
      - type: "show_monologue"
        ref: "dialogues/math_intro.yaml"

  - id: "evt-math-weak-fraction"
    once: false
    cooldown_days: 7
    trigger:
      on: "course_enter"
    conditions:
      - type: "has_weak_skill"
        skill_tag: "fraction/*"
        min_score: 0.4
        min_attempts: 5
    actions:
      - type: "show_dialogue"
        ref: "dialogues/crac_moggy_fractions.yaml"
```

```yaml
# subjects/mathematiques/courses/math-multiplication-01/events.yaml

events:

  - id: "evt-mul-course-intro"
    once: true
    trigger:
      on: "course_enter"
    conditions: []
    actions:
      - type: "show_monologue"
        ref: "dialogues/mul_intro.yaml"
```

### Chargement des événements contextuels dans eventEngine.js

```js
// src/services/eventEngine.js — mise à jour

let globalEventsCache  = null
const contextualCache  = {}   // clé = path, valeur = events[]

async function loadGlobalEvents() {
  if (globalEventsCache) return globalEventsCache
  const res  = await fetch('/content/events/events.yaml')
  const text = await res.text()
  globalEventsCache = yaml.load(text).events ?? []
  return globalEventsCache
}

async function loadContextualEvents(paths = []) {
  const all = []
  for (const path of paths) {
    if (contextualCache[path]) {
      all.push(...contextualCache[path])
      continue
    }
    try {
      const res  = await fetch(`/content/${path}`)
      if (!res.ok) continue
      const text = await res.text()
      const events = yaml.load(text).events ?? []
      contextualCache[path] = events
      all.push(...events)
    } catch {
      // Pas d'events.yaml pour ce contexte — normal
    }
  }
  return all
}

/**
 * processEvents — version mise à jour
 *
 * @param triggerName    - ex: "subject_enter"
 * @param context        - données contextuelles
 * @param triggeredIds   - événements déjà déclenchés
 * @param contextPaths   - chemins des events.yaml contextuels à charger
 *                         ex: ["subjects/mathematiques/events.yaml",
 *                              "subjects/mathematiques/courses/math-mul-01/events.yaml"]
 */
export async function processEvents(triggerName, context, triggeredIds = [], contextPaths = []) {
  const [globalEvents, contextualEvents] = await Promise.all([
    loadGlobalEvents(),
    loadContextualEvents(contextPaths),
  ])

  // Fusionner : globaux + contextuels
  // Les contextuels sont prioritaires (peuvent override des globaux)
  const allEvents = [...globalEvents, ...contextualEvents]

  const actions = []
  const now     = new Date()

  for (const event of allEvents) {
    if (event.trigger.on !== triggerName) continue
    if (event.once && triggeredIds.includes(event.id)) continue

    if (!event.once && event.cooldown_days > 0) {
      const lastTriggered = context.eventLastTriggered?.[event.id]
      if (lastTriggered) {
        const daysSince = (now - new Date(lastTriggered)) / (1000 * 60 * 60 * 24)
        if (daysSince < event.cooldown_days) continue
      }
    }

    const allMet = (event.conditions ?? []).every(cond =>
      evaluateCondition(cond, context)
    )
    if (!allMet) continue

    actions.push({ eventId: event.id, once: event.once, actions: event.actions, context })
  }

  return actions
}
```

### Mise à jour de useEventEngine.js — passer les contextPaths

```js
// src/hooks/useEventEngine.js — mise à jour de trigger()

const trigger = useCallback(async (triggerName, extraContext = {}, contextPaths = []) => {
  // ...
  const toFire = await processEvents(
    triggerName,
    context,
    triggeredIds,
    contextPaths    // ← nouveau paramètre
  )
  // ...
}, [uid, pseudo, pushEvents])
```

### Appel depuis les écrans avec les contextPaths

```js
// SubjectSelectScreen.jsx — quand on entre dans une matière
const { trigger } = useEventEngine()

const handleSubjectClick = (subject) => {
  trigger('subject_enter', {
    subject_name:    subject.label,
    subjectAttempts: stats.subjectAttempts,
  }, [
    `subjects/${subject.id}/events.yaml`,   // ← events contextuels de la matière
  ])
  navigate(ROUTES.COURSES.replace(':subjectId', subject.id))
}

// CourseSelectScreen.jsx — quand on entre dans un cours
const handleCourseClick = (course) => {
  trigger('course_enter', {
    skills: userSkills,
  }, [
    `subjects/${subjectId}/events.yaml`,
    `subjects/${subjectId}/courses/${course.id}/events.yaml`,
  ])
  navigate(ROUTES.STEPS.replace(':subjectId', subjectId).replace(':courseId', course.id))
}
```

---

## Partie 2 — Session validée par exercice

### Principe

Une session n'est comptabilisée que quand au moins un exercice est complété
dans la journée. La connexion seule ne compte pas.

```
Avant (jalon 6)  : session = connexion à l'app
Après (jalon 6b) : session = premier exercice complété du jour
```

### Mise à jour de progressService.js

```js
// src/services/progressService.js — ajouter

const SESSION_KEY = 'parcours_session'

export function markSessionActive(userId) {
  /**
   * Appelé quand un exercice est complété.
   * Valide la session du jour si pas encore fait.
   * Retourne true si c'est la première session du jour.
   */
  const today    = new Date().toISOString().slice(0, 10)   // "2026-05-15"
  const stored   = localStorage.getItem(`${SESSION_KEY}_${userId}`)
  const data     = stored ? JSON.parse(stored) : {}

  if (data.lastSessionDate === today) {
    // Déjà validée aujourd'hui
    data.exercisesToday = (data.exercisesToday ?? 0) + 1
    localStorage.setItem(`${SESSION_KEY}_${userId}`, JSON.stringify(data))
    return false
  }

  // Première session du jour
  const previousDate     = data.lastSessionDate ?? null
  const daysSinceLast    = previousDate
    ? Math.floor((Date.now() - new Date(previousDate)) / (1000 * 60 * 60 * 24))
    : 999

  data.lastSessionDate   = today
  data.exercisesToday    = 1
  data.sessionCount      = (data.sessionCount ?? 0) + 1
  data.daysSinceLast     = daysSinceLast
  localStorage.setItem(`${SESSION_KEY}_${userId}`, JSON.stringify(data))

  // Sync backend (streak check)
  backendPost('/api/streak/check', {})

  return true   // première session du jour → déclencher daily_login
}

export function getSessionStats(userId) {
  const stored = localStorage.getItem(`${SESSION_KEY}_${userId}`)
  const data   = stored ? JSON.parse(stored) : {}
  return {
    sessionCount:         data.sessionCount         ?? 0,
    exercisesToday:       data.exercisesToday        ?? 0,
    daysSinceLastSession: data.daysSinceLast         ?? 999,
    lastSessionDate:      data.lastSessionDate       ?? null,
  }
}
```

### Mise à jour de scoreService.js — déclencher daily_login

```js
// src/services/scoreService.js — dans saveResult, après sauvegarde

import { markSessionActive, getSessionStats } from './progressService'

export async function saveResult(exerciseId, result, userId) {
  const uid = userId ?? getCurrentUser()?.uid
  if (!uid) return { newBadges: [], newTrophies: [] }

  await saveExerciseResult(uid, exerciseId, { ... })

  // Valider la session si premier exercice du jour
  const isFirstToday = markSessionActive(uid)
  if (isFirstToday) {
    // Déclencher daily_login
    const stats = getSessionStats(uid)
    trigger('daily_login', {
      pseudo,
      currentStreak: stats.currentStreak,
      current_streak: stats.currentStreak,
      sessionCount:  stats.sessionCount,
    })
  }

  // ... reste de la logique badges
}
```

### Mise à jour du contexte app_start

```js
// SplashScreen.jsx — buildStartContext
// Remplacer session_count basé sur la connexion
// par session_count basé sur les vraies sessions avec exercices

async function buildStartContext(uid) {
  const stats = getSessionStats(uid)   // depuis localStorage
  // ...
  return {
    sessionCount:         stats.sessionCount,
    daysSinceLastSession: stats.daysSinceLastSession,
    days_absent:          stats.daysSinceLastSession,
    // ...
  }
}
```

---

## Partie 3 — Personnages et spritesheets

### public/content/personnages.yaml

```yaml
personnages:

  - name: "Crac"
    spritesheet: "personnages/tete_lapin.webp"
    width: 379       # largeur d'une cellule en px
    height: 379      # hauteur d'une cellule en px
    cols: 2          # nombre de colonnes dans le spritesheet
    rows: 3          # nombre de lignes
    emotions:
      - name: "content"
        coords: [0, 0]   # [col, row] — 0-based
      - name: "serieux"
        coords: [1, 0]
      - name: "interrogation"
        coords: [0, 1]
      - name: "moue"
        coords: [1, 1]
      - name: "sur"
        coords: [0, 2]
      - name: "parle"
        coords: [1, 2]

  - name: "Moggy"
    spritesheet: "personnages/tete_chat.webp"
    width: 379
    height: 379
    cols: 2
    rows: 3
    emotions:
      - name: "content"
        coords: [0, 0]
      - name: "serieux"
        coords: [1, 0]
      - name: "interrogation"
        coords: [0, 1]
      - name: "moue"
        coords: [1, 1]
      - name: "sur"
        coords: [0, 2]
      - name: "parle"
        coords: [1, 2]

  - name: "Lumio"
    spritesheet: "personnages/lumio.webp"
    width: 200
    height: 200
    cols: 2
    rows: 2
    emotions:
      - name: "wave"
        coords: [0, 0]
      - name: "happy"
        coords: [1, 0]
      - name: "thinking"
        coords: [0, 1]
      - name: "proud"
        coords: [1, 1]
```

### Service de chargement des personnages

```js
// src/services/personnageService.js

import yaml from 'js-yaml'

let cache = null

export async function getPersonnages() {
  if (cache) return cache
  const res  = await fetch('/content/personnages.yaml')
  const text = await res.text()
  cache = yaml.load(text).personnages ?? []
  return cache
}

export async function getPersonnage(name) {
  const all = await getPersonnages()
  return all.find(p => p.name === name) ?? null
}

/**
 * Calcule le background-position CSS pour une émotion donnée.
 * Le spritesheet est une grille cols×rows d'images identiques.
 */
export function getSpritePosition(personnage, emotionName) {
  const emotion = personnage.emotions.find(e => e.name === emotionName)
  if (!emotion) return { x: 0, y: 0 }

  const [col, row] = emotion.coords
  return {
    x: -(col * personnage.width),
    y: -(row * personnage.height),
  }
}
```

---

## Partie 4 — Format des fichiers dialogues

### Organisation

```
public/content/
  dialogues/
    math_intro.yaml                   ← monologue intro maths
    mul_intro.yaml                    ← monologue intro multiplication
    crac_moggy_fractions.yaml         ← dialogue entre personnages
    ...
```

### Format monologue

```yaml
# public/content/dialogues/mul_intro.yaml

dialogue:
  id: "mul_intro"
  type: "monologue"
  sound: "sounds/intro_music.mp3"    # optionnel
  pages:
    - text: |
        Bienvenue dans ton parcours de **Mathématiques**.
        Un voyage au cœur de la base de toutes les **sciences**.
      image: "personnages/gribouille_coucou.webp"

    - text: |
        On a un beau programme devant nous, conçu pour faire
        de toi un expert de la **précision**.
      image: "personnages/gribouille_coucou.webp"

    - text: |
        **Les bases du calcul** : Maîtriser les nombres relatifs
        et les fractions pour ne plus jamais douter de tes résultats.
      image: "personnages/gribouille_coucou.webp"

    - text: |
        Mais avant de commencer, on va revoir les bases
        avec les **multiplications**.
      image: "personnages/gribouille_doigt_leve.webp"
```

### Format dialogue

```yaml
# public/content/dialogues/crac_moggy_fractions.yaml

dialogue:
  id: "crac_moggy_fractions"
  type: "dialogue"
  sound: null
  personnages:
    - "Crac"
    - "Moggy"
  repliques:
    - personnage: "Crac"
      text: "Coucou Moggy, ça va ?"
      emotion: "parle"

    - personnage: "Moggy"
      text: "Impec Crac et toi ?"
      emotion: "parle"

    - personnage: "Crac"
      text: "On va revoir les bases avec les **multiplications** !"
      emotion: "content"

    - personnage: "Moggy"
      text: "Oh oui j'ai hâte !"
      emotion: "content"

    - personnage: "Moggy"
      text: "mais je suis pas très forte en maths..."
      emotion: "interrogation"

    - personnage: "Crac"
      text: "Pas de problème, on va revoir ça ensemble !"
      emotion: "content"
```

### Service de chargement des dialogues

```js
// src/services/dialogueService.js

import yaml from 'js-yaml'

const cache = {}

export async function loadDialogue(ref) {
  // ref = chemin relatif depuis /content/
  // ex: "dialogues/crac_moggy_fractions.yaml"
  if (cache[ref]) return cache[ref]

  const res  = await fetch(`/content/${ref}`)
  if (!res.ok) throw new Error(`Dialogue introuvable : ${ref}`)
  const text = await res.text()
  const data = yaml.load(text).dialogue
  cache[ref] = data
  return data
}
```

---

## Partie 5 — Nouveaux types d'action dans eventActions.js

```js
// src/services/eventActions.js — ajouter les deux nouveaux types

case 'show_monologue':
  return {
    type:  'monologue',
    ref:   action.ref,      // chemin vers le fichier dialogue YAML
    sound: action.sound ?? null,
  }

case 'show_dialogue':
  return {
    type:  'dialogue',
    ref:   action.ref,
    sound: action.sound ?? null,
  }
```

---

## Partie 6 — Nouveaux composants

### SpriteEmotion.jsx — rendu d'une émotion via spritesheet

```jsx
// src/components/personnages/SpriteEmotion.jsx

import { useState, useEffect } from 'react'
import { getPersonnage, getSpritePosition } from '../../services/personnageService'

export default function SpriteEmotion({
  name,           // nom du personnage ex: "Crac"
  emotion,        // nom de l'émotion ex: "content"
  size = 120,     // taille d'affichage en px
  className = '',
}) {
  const [personnage, setPersonnage] = useState(null)

  useEffect(() => {
    getPersonnage(name).then(setPersonnage)
  }, [name])

  if (!personnage) return <div style={{ width: size, height: size }} />

  const { x, y } = getSpritePosition(personnage, emotion)
  const scale    = size / personnage.width   // facteur d'échelle

  return (
    <div
      className={`sprite-emotion ${className}`}
      style={{
        width:           size,
        height:          size,
        backgroundImage: `url(/assets/${personnage.spritesheet})`,
        backgroundSize:  `${personnage.cols * personnage.width * scale}px
                          ${personnage.rows * personnage.height * scale}px`,
        backgroundPosition: `${x * scale}px ${y * scale}px`,
        backgroundRepeat:   'no-repeat',
        imageRendering:     'pixelated',   // pour les sprites pixel art
        flexShrink: 0,
      }}
      role="img"
      aria-label={`${name} - ${emotion}`}
    />
  )
}
```

### MonologuePlayer.jsx — image plein écran + texte paginé

```jsx
// src/components/personnages/MonologuePlayer.jsx

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadDialogue }  from '../../services/dialogueService'
import { useAudio }      from '../../hooks/useAudio'
import MdBlock           from '../lesson/blocks/MdBlock'

export default function MonologuePlayer({ ref: dialogueRef, onComplete }) {
  const [dialogue, setDialogue] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [loading,   setLoading]   = useState(true)
  const { playSound } = useAudio()

  useEffect(() => {
    loadDialogue(dialogueRef)
      .then(d => { setDialogue(d); setLoading(false) })
      .catch(() => { setLoading(false); onComplete() })
  }, [dialogueRef])

  useEffect(() => {
    if (dialogue?.sound) playSound(dialogue.sound)
  }, [dialogue])

  if (loading || !dialogue) return null

  const pages    = dialogue.pages ?? []
  const current  = pages[pageIndex]
  const isLast   = pageIndex === pages.length - 1

  const goNext = () => {
    if (isLast) onComplete()
    else setPageIndex(i => i + 1)
  }

  return (
    <div className="monologue-overlay" onClick={goNext}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pageIndex}
          className="monologue-page"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Image du personnage */}
          <div className="monologue-image-container">
            <img
              src={`/assets/${current.image}`}
              alt="Personnage"
              className="monologue-image"
            />
          </div>

          {/* Texte Markdown */}
          <div className="monologue-text-box" onClick={e => e.stopPropagation()}>
            <MdBlock text={current.text} />

            {/* Pagination */}
            <div className="monologue-footer">
              <div className="monologue-dots">
                {pages.map((_, i) => (
                  <span key={i} className={`dot ${i === pageIndex ? 'active' : ''}`} />
                ))}
              </div>
              <button className="btn-monologue-next" onClick={goNext}>
                {isLast ? 'Commencer ! 🚀' : 'Suivant →'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

### DialoguePlayer.jsx — conversation entre personnages

```jsx
// src/components/personnages/DialoguePlayer.jsx

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadDialogue }  from '../../services/dialogueService'
import { useAudio }      from '../../hooks/useAudio'
import SpriteEmotion     from './SpriteEmotion'
import MdBlock           from '../lesson/blocks/MdBlock'

export default function DialoguePlayer({ ref: dialogueRef, onComplete }) {
  const [dialogue,   setDialogue]   = useState(null)
  const [repIndex,   setRepIndex]   = useState(0)
  const [loading,    setLoading]    = useState(true)
  const { playSound } = useAudio()

  useEffect(() => {
    loadDialogue(dialogueRef)
      .then(d => { setDialogue(d); setLoading(false) })
      .catch(() => { setLoading(false); onComplete() })
  }, [dialogueRef])

  useEffect(() => {
    if (dialogue?.sound) playSound(dialogue.sound)
  }, [dialogue])

  if (loading || !dialogue) return null

  const repliques  = dialogue.repliques ?? []
  const current    = repliques[repIndex]
  const isLast     = repIndex === repliques.length - 1
  const personnages = dialogue.personnages ?? []

  // Le personnage qui parle est à droite, l'autre à gauche (ou inversé)
  // Premier personnage = gauche, deuxième = droite
  const leftName  = personnages[0] ?? ''
  const rightName = personnages[1] ?? ''
  const speaker   = current.personnage

  const goNext = () => {
    if (isLast) onComplete()
    else setRepIndex(i => i + 1)
  }

  return (
    <div className="dialogue-overlay">
      <div className="dialogue-stage">

        {/* Personnage gauche */}
        <div className={`dialogue-character left ${speaker === leftName ? 'active' : 'inactive'}`}>
          <SpriteEmotion
            name={leftName}
            emotion={speaker === leftName ? current.emotion : 'serieux'}
            size={140}
          />
          <span className="character-name">{leftName}</span>
        </div>

        {/* Bulle de dialogue */}
        <AnimatePresence mode="wait">
          <motion.div
            key={repIndex}
            className={`dialogue-bubble ${speaker === leftName ? 'left' : 'right'}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <span className="bubble-speaker">{speaker}</span>
            <MdBlock text={current.text} />
          </motion.div>
        </AnimatePresence>

        {/* Personnage droite */}
        <div className={`dialogue-character right ${speaker === rightName ? 'active' : 'inactive'}`}>
          <SpriteEmotion
            name={rightName}
            emotion={speaker === rightName ? current.emotion : 'serieux'}
            size={140}
          />
          <span className="character-name">{rightName}</span>
        </div>

      </div>

      {/* Contrôles */}
      <div className="dialogue-controls">
        <div className="dialogue-dots">
          {repliques.map((_, i) => (
            <span key={i} className={`dot ${i === repIndex ? 'active' : ''}`} />
          ))}
        </div>
        <button className="btn-dialogue-next" onClick={goNext}>
          {isLast ? 'Allons-y ! 🚀' : '▶'}
        </button>
      </div>

    </div>
  )
}
```

---

## Partie 7 — Mise à jour de MascotteDialog.jsx

Ajouter les nouveaux types dans le switch de rendu :

```jsx
// src/components/mascotte/MascotteDialog.jsx — mise à jour

import MonologuePlayer from '../personnages/MonologuePlayer'
import DialoguePlayer  from '../personnages/DialoguePlayer'

export default function MascotteDialog() {
  const { currentEvent, dismissCurrent } = useEventContext()
  const { playSound } = useAudio()

  if (!currentEvent) return null

  switch (currentEvent.type) {

    case 'celebration':
      if (currentEvent.sound) playSound(currentEvent.sound)
      return <CelebrationOverlay animation={currentEvent.animation} onComplete={dismissCurrent} />

    case 'dialog':
      if (currentEvent.sound) playSound(currentEvent.sound)
      return (
        <AnimatePresence>
          <motion.div className="mascotte-overlay" ...>
            <MascotteAvatar animation={currentEvent.animation} />
            <MascotteMessage messages={currentEvent.messages} buttons={currentEvent.buttons} onComplete={dismissCurrent} />
          </motion.div>
        </AnimatePresence>
      )

    case 'monologue':
      // Charge le fichier ref et affiche le monologue
      return (
        <MonologuePlayer
          ref={currentEvent.ref}
          onComplete={dismissCurrent}
        />
      )

    case 'dialogue':
      // Charge le fichier ref et affiche le dialogue
      return (
        <DialoguePlayer
          ref={currentEvent.ref}
          onComplete={dismissCurrent}
        />
      )

    default:
      return null
  }
}
```

---

## Nouveaux styles CSS — src/styles/dialogue.css

```css
/* ── Monologue ──────────────────────────────────────────────────────────────── */
.monologue-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex; align-items: center; justify-content: center;
  z-index: 9995; padding: 20px;
}
.monologue-page {
  display: flex; flex-direction: column; align-items: center;
  max-width: 500px; width: 100%; gap: 20px;
}
.monologue-image {
  max-height: 280px; object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
}
.monologue-text-box {
  background: white; border-radius: 16px;
  padding: 20px 24px; width: 100%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.monologue-footer {
  display: flex; justify-content: space-between;
  align-items: center; margin-top: 16px;
}
.btn-monologue-next {
  background: var(--color-primary, #4F46E5);
  color: white; border: none; border-radius: 20px;
  padding: 8px 20px; cursor: pointer; font-weight: 600;
}

/* ── Dialogue ───────────────────────────────────────────────────────────────── */
.dialogue-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex; flex-direction: column;
  justify-content: flex-end; z-index: 9995;
}
.dialogue-stage {
  display: flex; align-items: flex-end; justify-content: space-around;
  padding: 0 16px; gap: 12px; min-height: 200px;
  position: relative;
}
.dialogue-character {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  transition: opacity 0.3s, transform 0.3s;
}
.dialogue-character.inactive {
  opacity: 0.4;
  transform: scale(0.9);
}
.dialogue-character.active {
  opacity: 1;
  transform: scale(1);
}
.character-name {
  color: white; font-size: 12px; font-weight: 600;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}
.dialogue-bubble {
  flex: 1; background: white; border-radius: 16px;
  padding: 16px; margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  max-width: 280px;
}
.bubble-speaker {
  display: block; font-size: 11px; font-weight: 700;
  color: var(--color-primary, #4F46E5);
  margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;
}
.dialogue-controls {
  background: rgba(0,0,0,0.6); padding: 12px 24px;
  display: flex; justify-content: space-between; align-items: center;
}
.btn-dialogue-next {
  background: var(--color-primary, #4F46E5);
  color: white; border: none; border-radius: 20px;
  padding: 8px 24px; cursor: pointer; font-size: 16px;
}

/* ── Sprite ─────────────────────────────────────────────────────────────────── */
.sprite-emotion {
  border-radius: 50%;
  overflow: hidden;
}

/* ── Points de pagination ───────────────────────────────────────────────────── */
.dialogue-dots, .monologue-dots {
  display: flex; gap: 6px; align-items: center;
}
.dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.3); transition: background 0.2s;
}
.dot.active { background: white; }
```

Importer dans `main.jsx` :
```js
import './styles/dialogue.css'
```

---

## Nouveaux tests unitaires

### personnageService.test.js

```js
import { getSpritePosition } from '../services/personnageService'

const MOCK_PERSONNAGE = {
  name: 'Crac',
  width: 379, height: 379, cols: 2, rows: 3,
  emotions: [
    { name: 'content',      coords: [0, 0] },
    { name: 'interrogation', coords: [0, 1] },
    { name: 'parle',        coords: [1, 2] },
  ]
}

describe('getSpritePosition', () => {

  test('émotion [0,0] → position {x:0, y:0}', () => {
    const pos = getSpritePosition(MOCK_PERSONNAGE, 'content')
    expect(pos.x).toBe(0)
    expect(pos.y).toBe(0)
  })

  test('émotion [0,1] → x=0, y=-379', () => {
    const pos = getSpritePosition(MOCK_PERSONNAGE, 'interrogation')
    expect(pos.x).toBe(0)
    expect(pos.y).toBe(-379)
  })

  test('émotion [1,2] → x=-379, y=-758', () => {
    const pos = getSpritePosition(MOCK_PERSONNAGE, 'parle')
    expect(pos.x).toBe(-379)
    expect(pos.y).toBe(-758)
  })

  test('émotion inconnue → {x:0, y:0}', () => {
    const pos = getSpritePosition(MOCK_PERSONNAGE, 'inexistante')
    expect(pos.x).toBe(0)
    expect(pos.y).toBe(0)
  })
})
```

### progressService.test.js — ajouter tests session

```js
describe('markSessionActive', () => {

  test('première fois → retourne true', () => {
    localStorageMock.clear()
    const result = markSessionActive('user-01')
    expect(result).toBe(true)
  })

  test('deuxième fois le même jour → retourne false', () => {
    markSessionActive('user-01')
    const result = markSessionActive('user-01')
    expect(result).toBe(false)
  })

  test('getSessionStats retourne sessionCount correct', () => {
    localStorageMock.clear()
    markSessionActive('user-01')
    const stats = getSessionStats('user-01')
    expect(stats.sessionCount).toBe(1)
    expect(stats.exercisesToday).toBe(1)
  })
})
```

---

## Ce qu'il ne faut PAS faire

```
✗ Ne pas charger personnages.yaml à chaque rendu
  → mis en cache dans personnageService dès le premier appel
✗ Ne pas charger les dialogues à l'avance
  → chargés à la demande quand l'event se déclenche
✗ Ne pas afficher DialoguePlayer et MonologuePlayer en dehors de MascotteDialog
  → ils passent toujours par la queue EventContext
✗ Ne pas compter une session à la simple connexion
  → uniquement au premier exercice complété du jour
✗ Ne pas modifier la structure des events.yaml globaux
  → les contextuels s'ajoutent par fusion, ils ne remplacent pas
```

## Ce qu'il faut absolument faire

```
✓ getSpritePosition calcule background-position en pixels négatifs
✓ Le personnage inactif est atténué (opacity 0.4) dans DialoguePlayer
✓ Le texte des repliques/pages supporte le Markdown (via MdBlock)
✓ MonologuePlayer : l'image change à chaque page
✓ DialoguePlayer : l'émotion change à chaque réplique
✓ Session validée uniquement au premier exercice du jour
✓ contextPaths passé correctement depuis SubjectSelect et CourseSelect
✓ Commentaire JALON 8a dans MascotteAvatar.jsx existant (déjà présent)
✓ Tests personnageService + progressService session
✓ npm run build passe
```

---

## Résumé des fichiers créés / modifiés

### Nouveaux fichiers YAML

```
public/content/personnages.yaml
public/content/dialogues/math_intro.yaml      ← exemple monologue
public/content/dialogues/mul_intro.yaml       ← exemple monologue
public/content/dialogues/crac_moggy_fractions.yaml ← exemple dialogue
public/content/subjects/mathematiques/events.yaml  ← events contextuels
public/content/subjects/mathematiques/courses/math-multiplication-01/events.yaml
```

### Nouveaux services

```
src/services/personnageService.js
src/services/dialogueService.js
```

### Nouveaux composants

```
src/components/personnages/SpriteEmotion.jsx
src/components/personnages/MonologuePlayer.jsx
src/components/personnages/DialoguePlayer.jsx
```

### Nouveaux styles

```
src/styles/dialogue.css
```

### Nouveaux tests

```
src/__tests__/personnageService.test.js
```

### Fichiers modifiés

```
src/services/eventEngine.js          ← chargement events contextuels
src/services/eventActions.js         ← +case show_monologue/show_dialogue
src/services/progressService.js      ← markSessionActive, getSessionStats
src/services/scoreService.js         ← trigger daily_login au premier exercice
src/hooks/useEventEngine.js          ← contextPaths dans trigger()
src/components/mascotte/MascotteDialog.jsx ← +case monologue/dialogue
src/screens/SubjectSelect/SubjectSelectScreen.jsx ← contextPaths
src/screens/CourseSelect/CourseSelectScreen.jsx   ← contextPaths
src/screens/Splash/SplashScreen.jsx               ← buildStartContext mis à jour
src/__tests__/progressService.test.js             ← +tests session
src/main.jsx                                      ← import dialogue.css
```

### Fichiers non touchés

```
Tous les composants d'exercices
Le parc SVG
Le backend
Les services de gamification (jalon 5)
eventConditions.js
EventContext.jsx
MascotteAvatar.jsx / MascotteMessage.jsx / CelebrationOverlay.jsx
```
