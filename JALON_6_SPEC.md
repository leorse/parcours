# Jalon 6 — Événements et mascotte
## Document technique pour Claude dans VS Code

---

## Objectif

Rendre l'app vivante et personnalisée grâce à un moteur d'événements
piloté par un fichier YAML et une mascotte animée qui porte les messages.

L'app réagit au comportement de l'élève : premier lancement, retour
après absence, badge débloqué, session longue, compétence faible détectée...

**À la fin du jalon 6 :**
- La mascotte apparaît au bon moment avec le bon message
- Les messages contiennent les vraies données de l'élève
  (`{pseudo}`, `{days_absent}`, `{xp_earned}`...)
- Les événements ne se redéclenchent pas (historique en backend)
- Les sons associés aux événements jouent via Howler.js
- Les célébrations (confettis) fonctionnent
- `npm run build` passe

**Ce qui ne change pas :** les exercices, le parc SVG, les services
de gamification, le backend.

---

## Nouveau fichier de config YAML

### public/content/events/events.yaml

```yaml
events:

  # ── Premier lancement ────────────────────────────────────────────────────────
  - id: "evt-first-launch"
    once: true              # se déclenche une seule fois dans toute la vie de l'app
    trigger:
      on: "app_start"
    conditions:
      - type: "session_count"
        operator: "eq"
        value: 1
    actions:
      - type: "show_dialog"
        character: "mascotte"
        animation: "wave"
        sound: "sounds/welcome.mp3"
        messages:
          - "Bienvenue ! Je m'appelle Lumio 👋"
          - "Je vais t'accompagner dans ton apprentissage."
          - "Choisis une matière pour commencer !"

  # ── Retour après absence ─────────────────────────────────────────────────────
  - id: "evt-long-absence"
    once: false             # peut se redéclencher (mais pas le même jour)
    cooldown_days: 1        # minimum 1 jour entre deux déclenchements
    trigger:
      on: "app_start"
    conditions:
      - type: "days_since_last_session"
        operator: "gte"
        value: 3
    actions:
      - type: "show_dialog"
        character: "mascotte"
        animation: "concerned"
        sound: "sounds/comeback.mp3"
        messages:
          - "Ça fait {days_absent} jours qu'on ne s'est pas vus !"
          - "Voici quelques exercices pour se remettre dans le bain :"
      - type: "show_reinforcement"
        max: 3

  # ── Premier jour de streak ───────────────────────────────────────────────────
  - id: "evt-daily-login"
    once: false
    cooldown_days: 1
    trigger:
      on: "daily_login"
    conditions: []           # toujours déclenché (une fois par jour)
    actions:
      - type: "show_dialog"
        character: "mascotte"
        animation: "happy"
        messages:
          - "Bonjour {pseudo} ! 🌟"
          - "Tu es là depuis {current_streak} jours d'affilée !"

  # ── Première matière ─────────────────────────────────────────────────────────
  - id: "evt-first-subject"
    once: true
    trigger:
      on: "subject_enter"
    conditions:
      - type: "subject_attempts"
        operator: "eq"
        value: 1
    actions:
      - type: "show_dialog"
        character: "mascotte"
        animation: "excited"
        messages:
          - "Tu commences {subject_name} pour la première fois !"
          - "Prends ton temps, on y va étape par étape. 😊"

  # ── Premier cours complété ────────────────────────────────────────────────────
  - id: "evt-first-course-complete"
    once: true
    trigger:
      on: "course_complete"
    conditions:
      - type: "total_courses_completed"
        operator: "eq"
        value: 1
    actions:
      - type: "show_celebration"
        animation: "confetti"
        sound: "sounds/victory.mp3"
      - type: "show_dialog"
        character: "mascotte"
        animation: "proud"
        messages:
          - "Bravo ! Tu viens de finir ton premier cours ! 🎉"
          - "Tu as gagné {xp_earned} points d'expérience !"

  # ── Streak 7 jours ────────────────────────────────────────────────────────────
  - id: "evt-streak-7"
    once: true
    trigger:
      on: "app_start"
    conditions:
      - type: "streak"
        operator: "gte"
        value: 7
    actions:
      - type: "show_celebration"
        animation: "fireworks"
        sound: "sounds/streak.mp3"
      - type: "show_dialog"
        character: "mascotte"
        animation: "amazed"
        messages:
          - "7 jours d'affilée ! Tu es incroyable {pseudo} ! 🔥🔥🔥"

  # ── Badge débloqué ────────────────────────────────────────────────────────────
  - id: "evt-badge-earned"
    once: false             # se déclenche à chaque nouveau badge
    trigger:
      on: "badge_earned"
    conditions: []
    actions:
      - type: "show_dialog"
        character: "mascotte"
        animation: "celebrate"
        sound: "sounds/badge.mp3"
        messages:
          - "Tu as débloqué le badge {badge_label} {badge_icon} !"

  # ── Compétence faible détectée ────────────────────────────────────────────────
  - id: "evt-weak-skill"
    once: false
    cooldown_days: 3        # max une fois tous les 3 jours
    trigger:
      on: "course_enter"
    conditions:
      - type: "has_weak_skill"
        min_score: 0.4
        min_attempts: 5
    actions:
      - type: "show_dialog"
        character: "mascotte"
        animation: "thinking"
        messages:
          - "J'ai remarqué que tu galères un peu sur {weak_skill_label}."
          - "Je te propose quelques exercices de renforcement ! 💪"
      - type: "show_reinforcement"
        skill_tag: "{weak_skill_tag}"
        max: 3

  # ── Session longue ────────────────────────────────────────────────────────────
  - id: "evt-long-session"
    once: false
    cooldown_days: 0        # peut se déclencher plusieurs fois par jour
    trigger:
      on: "step_complete"
    conditions:
      - type: "session_duration_minutes"
        operator: "gte"
        value: 30
    actions:
      - type: "show_dialog"
        character: "mascotte"
        animation: "sleepy"
        messages:
          - "Tu travailles depuis {session_minutes} minutes !"
          - "Tu veux faire une petite pause ?"
        buttons:
          - label: "Continuer"
            action: "dismiss"
          - label: "Faire une pause"
            action: "go_to_menu"
```

---

## Architecture du moteur d'événements

```
src/
  services/
    eventEngine.js          ← moteur principal
    eventConditions.js      ← évaluation des conditions
    eventActions.js         ← exécution des actions
  components/
    mascotte/
      MascotteDialog.jsx    ← dialog principal avec la mascotte
      MascotteAvatar.jsx    ← avatar animé (CSS animations)
      MascotteMessage.jsx   ← messages paginés avec bouton suivant
      CelebrationOverlay.jsx← confettis / feux d'artifice
  context/
    EventContext.jsx         ← état global du moteur (event en cours, queue)
  hooks/
    useEventEngine.js        ← hook pour déclencher les triggers
```

---

## eventEngine.js — le moteur principal

```js
// src/services/eventEngine.js

import yaml from 'js-yaml'
import { evaluateCondition } from './eventConditions'

let eventsCache = null

async function loadEvents() {
  if (eventsCache) return eventsCache
  const res  = await fetch('/content/events/events.yaml')
  const text = await res.text()
  eventsCache = yaml.load(text).events
  return eventsCache
}

/**
 * Point d'entrée principal du moteur.
 * Appelé à chaque point clé de l'app via useEventEngine.
 *
 * @param triggerName  - le nom du trigger (ex: "app_start")
 * @param context      - données contextuelles (uid, pseudo, stats...)
 * @param triggeredIds - ids des événements déjà déclenchés (depuis backend)
 * @returns            - liste des actions à exécuter
 */
export async function processEvents(triggerName, context, triggeredIds = []) {
  const events  = await loadEvents()
  const actions = []
  const now     = new Date()

  for (const event of events) {
    // Mauvais trigger
    if (event.trigger.on !== triggerName) continue

    // Événement once déjà déclenché
    if (event.once && triggeredIds.includes(event.id)) continue

    // Cooldown
    if (!event.once && event.cooldown_days > 0) {
      const lastTriggered = context.eventLastTriggered?.[event.id]
      if (lastTriggered) {
        const daysSince = (now - new Date(lastTriggered)) / (1000 * 60 * 60 * 24)
        if (daysSince < event.cooldown_days) continue
      }
    }

    // Évaluer toutes les conditions (toutes doivent être vraies)
    const allMet = event.conditions.every(cond =>
      evaluateCondition(cond, context)
    )
    if (!allMet) continue

    // Cet événement se déclenche
    actions.push({
      eventId:  event.id,
      once:     event.once,
      actions:  event.actions,
      context,
    })
  }

  return actions
}

/**
 * Résout les variables dynamiques dans les messages.
 * "{pseudo}" → "Léo", "{days_absent}" → "3"...
 */
export function resolveVariables(text, context) {
  return text.replace(/\{(\w+)\}/g, (_, key) => context[key] ?? `{${key}}`)
}
```

---

## eventConditions.js — évaluation des conditions

```js
// src/services/eventConditions.js

export function evaluateCondition(condition, context) {
  const { type, operator, value, min_score, min_attempts } = condition

  const ops = {
    eq:  (a, b) => a === b,
    gte: (a, b) => a >= b,
    gt:  (a, b) => a > b,
    lt:  (a, b) => a < b,
    lte: (a, b) => a <= b,
  }
  const compare = ops[operator] ?? ops.gte

  switch (type) {

    case 'session_count':
      return compare(context.sessionCount ?? 0, value)

    case 'days_since_last_session':
      return compare(context.daysSinceLastSession ?? 0, value)

    case 'streak':
      return compare(context.currentStreak ?? 0, value)

    case 'subject_attempts':
      return compare(context.subjectAttempts ?? 0, value)

    case 'total_courses_completed':
      return compare(context.totalCoursesCompleted ?? 0, value)

    case 'session_duration_minutes':
      return compare(context.sessionDurationMinutes ?? 0, value)

    case 'has_weak_skill': {
      const weak = (context.skills ?? []).find(s =>
        s.score < (min_score ?? 0.5) &&
        s.attempts >= (min_attempts ?? 3)
      )
      return !!weak
    }

    default:
      console.warn(`[EventEngine] Condition inconnue : ${type}`)
      return false
  }
}
```

---

## eventActions.js — exécution des actions

```js
// src/services/eventActions.js
// Ce module traduit les actions YAML en objets exploitables par les composants

export function buildActionPayload(action, context, resolveVars) {
  switch (action.type) {

    case 'show_dialog':
      return {
        type:      'dialog',
        character: action.character,
        animation: action.animation,
        sound:     action.sound ?? null,
        messages:  action.messages.map(m => resolveVars(m, context)),
        buttons:   action.buttons ?? null,
      }

    case 'show_celebration':
      return {
        type:      'celebration',
        animation: action.animation,   // "confetti" | "fireworks"
        sound:     action.sound ?? null,
      }

    case 'show_reinforcement':
      return {
        type:      'reinforcement',
        skillTag:  action.skill_tag ? resolveVars(action.skill_tag, context) : null,
        max:       action.max ?? 3,
      }

    default:
      console.warn(`[EventEngine] Action inconnue : ${action.type}`)
      return null
  }
}
```

---

## EventContext.jsx — état global

```jsx
// src/context/EventContext.jsx

import { createContext, useContext, useState, useCallback } from 'react'

const EventContext = createContext(null)

export function EventProvider({ children }) {
  // File d'attente des événements à afficher
  const [queue,        setQueue]        = useState([])
  const [currentEvent, setCurrentEvent] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const pushEvents = useCallback((events) => {
    setQueue(q => [...q, ...events])
  }, [])

  const consumeNext = useCallback(() => {
    setQueue(q => {
      if (q.length === 0) {
        setCurrentEvent(null)
        return q
      }
      const [next, ...rest] = q
      setCurrentEvent(next)
      return rest
    })
  }, [])

  const dismissCurrent = useCallback(() => {
    setCurrentEvent(null)
    // Déclencher le suivant après un court délai
    setTimeout(consumeNext, 300)
  }, [consumeNext])

  return (
    <EventContext.Provider value={{
      queue,
      currentEvent,
      isProcessing,
      pushEvents,
      consumeNext,
      dismissCurrent,
    }}>
      {children}
    </EventContext.Provider>
  )
}

export const useEventContext = () => useContext(EventContext)
```

Ajouter `<EventProvider>` dans `App.jsx` autour de `<AppRouter />`.

---

## useEventEngine.js — hook principal

```js
// src/hooks/useEventEngine.js

import { useCallback }        from 'react'
import { useProfile }         from './useProfile'
import { useEventContext }    from '../context/EventContext'
import { processEvents, resolveVariables } from '../services/eventEngine'
import { buildActionPayload } from '../services/eventActions'
import { logEvent }           from '../services/progressService'
import { getFirebaseToken }   from '../services/profileService'

export function useEventEngine() {
  const { uid, pseudo }   = useProfile()
  const { pushEvents }    = useEventContext()

  const trigger = useCallback(async (triggerName, extraContext = {}) => {
    if (!uid) return

    // Récupérer les événements déjà déclenchés depuis le backend
    const token = await getFirebaseToken()
    const BACKEND = import.meta.env.VITE_BACKEND_URL
    let triggeredIds = []
    let eventLastTriggered = {}

    try {
      const res  = await fetch(`${BACKEND}/api/events/${uid}?token=${token}`)
      const data = await res.json()
      triggeredIds = data.events ?? []
    } catch { /* silencieux */ }

    // Construire le contexte complet
    const context = {
      uid,
      pseudo,
      ...extraContext,
      triggeredIds,
      eventLastTriggered,
    }

    // Chercher les événements à déclencher
    const toFire = await processEvents(triggerName, context, triggeredIds)
    if (!toFire.length) return

    // Construire les payloads d'actions
    const payloads = toFire.flatMap(({ eventId, once, actions, context: ctx }) => {
      // Logger l'événement en backend si once: true
      if (once) logEvent(eventId)

      return actions
        .map(action => buildActionPayload(action, ctx, resolveVariables))
        .filter(Boolean)
        .map(payload => ({ ...payload, eventId }))
    })

    // Pousser dans la queue
    if (payloads.length) pushEvents(payloads)

  }, [uid, pseudo, pushEvents])

  return { trigger }
}
```

---

## Points de déclenchement dans l'app

Chaque écran ou action clé appelle `trigger()` au bon moment.

```js
// SplashScreen.jsx — au chargement
const { trigger } = useEventEngine()
useEffect(() => {
  trigger('app_start', {
    sessionCount:          stats.sessionCount,
    daysSinceLastSession:  stats.daysSinceLastSession,
    currentStreak:         streak.current_streak,
  })
}, [])

// SubjectSelectScreen.jsx — à l'entrée
trigger('subject_enter', {
  subjectAttempts: stats.subjectAttempts,
  subject_name:    subject.label,
})

// CourseSelectScreen.jsx
trigger('course_enter', {
  skills: userSkills,
  // weak_skill_tag et weak_skill_label résolus dans le contexte
})

// StepPlayerScreen.jsx — après completion d'une étape
trigger('step_complete', {
  sessionDurationMinutes: sessionDuration,
  xp_earned:              result.xpEarned,
})

// ExerciseEngine.jsx — après completion d'un exercice
trigger('exercise_complete', {
  xp_earned: result.xpEarned,
  score:     result.score,
})

// scoreService.js — après déblocage d'un badge
trigger('badge_earned', {
  badge_label: badge.label,
  badge_icon:  badge.icon,
})
```

---

## La mascotte — composants

### MascotteDialog.jsx — dialog principal

```jsx
// src/components/mascotte/MascotteDialog.jsx

import { useState }        from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEventContext } from '../../context/EventContext'
import MascotteAvatar      from './MascotteAvatar'
import MascotteMessage     from './MascotteMessage'
import CelebrationOverlay  from './CelebrationOverlay'
import { useAudio }        from '../../hooks/useAudio'

export default function MascotteDialog() {
  const { currentEvent, dismissCurrent } = useEventContext()
  const { playSound } = useAudio()

  if (!currentEvent) return null

  // Celebration (confetti / fireworks) — pas de dialog
  if (currentEvent.type === 'celebration') {
    if (currentEvent.sound) playSound(currentEvent.sound)
    return (
      <CelebrationOverlay
        animation={currentEvent.animation}
        onComplete={dismissCurrent}
      />
    )
  }

  // Dialog standard
  if (currentEvent.type === 'dialog') {
    if (currentEvent.sound) playSound(currentEvent.sound)
    return (
      <AnimatePresence>
        <motion.div
          className="mascotte-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="mascotte-dialog"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <MascotteAvatar animation={currentEvent.animation} />
            <MascotteMessage
              messages={currentEvent.messages}
              buttons={currentEvent.buttons}
              onComplete={dismissCurrent}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
}
```

### MascotteAvatar.jsx — animations CSS

```jsx
// src/components/mascotte/MascotteAvatar.jsx
// Utilise des classes CSS pour les animations — pas de Lottie au jalon 6
// Lottie sera intégré au jalon 8a (Android natif)

const ANIMATION_CLASSES = {
  wave:      'mascotte-wave',
  happy:     'mascotte-bounce',
  excited:   'mascotte-jump',
  concerned: 'mascotte-shake',
  thinking:  'mascotte-tilt',
  proud:     'mascotte-grow',
  celebrate: 'mascotte-spin',
  amazed:    'mascotte-pulse',
  sleepy:    'mascotte-sway',
}

export default function MascotteAvatar({ animation = 'wave' }) {
  const animClass = ANIMATION_CLASSES[animation] ?? 'mascotte-wave'

  return (
    <div className={`mascotte-avatar ${animClass}`}>
      <img
        src="/assets/mascotte/lumio.webp"
        alt="Lumio la mascotte"
        className="mascotte-img"
      />
    </div>
  )
}
```

### MascotteMessage.jsx — messages paginés

```jsx
// src/components/mascotte/MascotteMessage.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../router/AppRouter'

export default function MascotteMessage({ messages = [], buttons, onComplete }) {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()
  const isLast   = index === messages.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setIndex(i => i + 1)
    }
  }

  const handleButton = (action) => {
    onComplete()
    if (action === 'go_to_menu') navigate(ROUTES.MENU)
    // "dismiss" → juste fermer (onComplete déjà appelé)
  }

  return (
    <div className="mascotte-message">
      <p className="mascotte-text">{messages[index]}</p>

      {/* Indicateur de pagination */}
      {messages.length > 1 && (
        <div className="mascotte-dots">
          {messages.map((_, i) => (
            <span key={i} className={`dot ${i === index ? 'active' : ''}`} />
          ))}
        </div>
      )}

      {/* Boutons custom (pause, continuer...) ou bouton suivant/fermer */}
      {isLast && buttons ? (
        <div className="mascotte-buttons">
          {buttons.map(btn => (
            <button
              key={btn.action}
              className="btn-mascotte"
              onClick={() => handleButton(btn.action)}
            >
              {btn.label}
            </button>
          ))}
        </div>
      ) : (
        <button className="btn-mascotte-next" onClick={handleNext}>
          {isLast ? '👍 OK !' : 'Suivant →'}
        </button>
      )}
    </div>
  )
}
```

### CelebrationOverlay.jsx — confettis et feux d'artifice

```jsx
// src/components/mascotte/CelebrationOverlay.jsx
// CSS animations uniquement — pas de bibliothèque externe

import { useEffect, useState } from 'react'

const CONFETTI_COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#F97316']

function generateConfetti(count = 40) {
  return Array.from({ length: count }, (_, i) => ({
    id:    i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left:  `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    size:  `${6 + Math.random() * 6}px`,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }))
}

export default function CelebrationOverlay({ animation, onComplete }) {
  const [pieces] = useState(() => generateConfetti(animation === 'fireworks' ? 60 : 40))

  useEffect(() => {
    // Auto-dismiss après 2.5 secondes
    const t = setTimeout(onComplete, 2500)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div className="celebration-overlay" onClick={onComplete}>
      {pieces.map(p => (
        <div
          key={p.id}
          className={`confetti-piece ${p.shape}`}
          style={{
            left:            p.left,
            backgroundColor: p.color,
            width:           p.size,
            height:          p.size,
            animationDelay:  p.delay,
          }}
        />
      ))}
    </div>
  )
}
```

Styles CSS à ajouter dans `src/styles/mascotte.css` :

```css
/* Confetti */
.celebration-overlay {
  position: fixed; inset: 0; pointer-events: all;
  z-index: 9998; overflow: hidden;
}
.confetti-piece {
  position: absolute; top: -20px;
  animation: confetti-fall 2.5s ease-in forwards;
  border-radius: 2px;
}
.confetti-piece.circle { border-radius: 50%; }
@keyframes confetti-fall {
  0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}

/* Mascotte dialog */
.mascotte-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: flex-end; justify-content: center;
  z-index: 9990; padding-bottom: 20px;
}
.mascotte-dialog {
  background: white; border-radius: 20px 20px 0 0;
  padding: 24px; max-width: 480px; width: 100%;
  display: flex; gap: 16px; align-items: flex-start;
}
.mascotte-img { width: 80px; height: 80px; object-fit: contain; }

/* Animations mascotte */
.mascotte-wave    { animation: wave 0.8s ease-in-out infinite alternate; }
.mascotte-bounce  { animation: bounce 0.5s ease-in-out infinite alternate; }
.mascotte-jump    { animation: jump 0.4s ease-in-out 3; }
.mascotte-shake   { animation: shake 0.3s ease-in-out 3; }
.mascotte-tilt    { animation: tilt 1s ease-in-out infinite alternate; }
.mascotte-grow    { animation: grow 0.6s ease-out; }
.mascotte-spin    { animation: spin 0.6s ease-in-out; }
.mascotte-pulse   { animation: pulse 0.5s ease-in-out infinite alternate; }
.mascotte-sway    { animation: sway 2s ease-in-out infinite; }

@keyframes wave   { from { transform: rotate(-10deg); } to { transform: rotate(10deg); } }
@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }
@keyframes jump   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
@keyframes shake  { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
@keyframes tilt   { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
@keyframes grow   { from { transform: scale(0.8); } to { transform: scale(1); } }
@keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse  { from { transform: scale(1); } to { transform: scale(1.15); } }
@keyframes sway   { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
```

---

## Intégration globale — App.jsx

```jsx
// src/App.jsx

import { EventProvider }   from './context/EventContext'
import MascotteDialog      from './components/mascotte/MascotteDialog'

export default function App() {
  return (
    <AppProvider>
      <EventProvider>
        <AppRouter />
        <MascotteDialog />   {/* toujours monté, affiche ce qui est dans la queue */}
        <DebugFAB />
      </EventProvider>
    </AppProvider>
  )
}
```

---

## Contexte à enrichir au démarrage

Au lancement, l'app doit construire le contexte complet pour les conditions.
Ces données viennent des endpoints backend déjà existants.

```js
// src/screens/Splash/SplashScreen.jsx
// Charger le contexte au démarrage avant de déclencher app_start

async function buildStartContext(uid, token) {
  const BACKEND = import.meta.env.VITE_BACKEND_URL

  const [streakRes, xpRes, skillsRes] = await Promise.allSettled([
    fetch(`${BACKEND}/api/streak/${uid}?token=${token}`).then(r => r.json()),
    fetch(`${BACKEND}/api/xp/${uid}?token=${token}`).then(r => r.json()),
    fetch(`${BACKEND}/api/skills/${uid}?token=${token}`).then(r => r.json()),
  ])

  const streak = streakRes.status === 'fulfilled' ? streakRes.value : {}
  const xp     = xpRes.status    === 'fulfilled' ? xpRes.value    : {}
  const skills = skillsRes.status === 'fulfilled' ? skillsRes.value.skills ?? [] : []

  // Calculer days_since_last_session depuis streak.last_active_date
  const lastActive      = streak.last_active_date
  const daysSinceLast   = lastActive
    ? Math.floor((Date.now() - new Date(lastActive)) / (1000 * 60 * 60 * 24))
    : 999

  return {
    sessionCount:         xp.total_xp > 0 ? 2 : 1,  // simplifié : 1 si premier lancement
    daysSinceLastSession: daysSinceLast,
    days_absent:          daysSinceLast,              // variable pour les messages
    currentStreak:        streak.current_streak ?? 0,
    current_streak:       streak.current_streak ?? 0,
    totalXP:              xp.total_xp ?? 0,
    skills,
  }
}
```

---

## Gestion du contexte par trigger

Chaque trigger reçoit des données contextuelles différentes :

```
app_start         → sessionCount, daysSinceLastSession, currentStreak
daily_login       → currentStreak, pseudo
subject_enter     → subjectAttempts, subject_name
course_enter      → skills (pour has_weak_skill)
course_complete   → xp_earned, totalCoursesCompleted
step_complete     → sessionDurationMinutes, xp_earned
exercise_complete → xp_earned, score
badge_earned      → badge_label, badge_icon
```

---

## Nouveaux tests unitaires

```
src/__tests__/
  eventEngine.test.js      ← processEvents, resolveVariables
  eventConditions.test.js  ← évaluation de chaque type de condition
```

### eventConditions.test.js

```js
describe('eventConditions', () => {

  test('session_count eq 1 → vrai si sessionCount=1', () => {
    const cond = { type: 'session_count', operator: 'eq', value: 1 }
    expect(evaluateCondition(cond, { sessionCount: 1 })).toBe(true)
    expect(evaluateCondition(cond, { sessionCount: 2 })).toBe(false)
  })

  test('days_since_last_session gte 3 → vrai si 5 jours', () => {
    const cond = { type: 'days_since_last_session', operator: 'gte', value: 3 }
    expect(evaluateCondition(cond, { daysSinceLastSession: 5 })).toBe(true)
    expect(evaluateCondition(cond, { daysSinceLastSession: 2 })).toBe(false)
  })

  test('has_weak_skill → vrai si skill < min_score avec assez d\'essais', () => {
    const cond = { type: 'has_weak_skill', min_score: 0.5, min_attempts: 3 }
    const ctx  = {
      skills: [
        { skill_tag: 'fraction/addition', score: 0.3, attempts: 5 },
      ]
    }
    expect(evaluateCondition(cond, ctx)).toBe(true)
  })

  test('has_weak_skill → faux si pas assez d\'essais', () => {
    const cond = { type: 'has_weak_skill', min_score: 0.5, min_attempts: 5 }
    const ctx  = {
      skills: [{ skill_tag: 'fraction/addition', score: 0.3, attempts: 2 }]
    }
    expect(evaluateCondition(cond, ctx)).toBe(false)
  })

  test('condition inconnue → false sans erreur', () => {
    const cond = { type: 'type_inexistant', operator: 'gte', value: 1 }
    expect(evaluateCondition(cond, {})).toBe(false)
  })
})
```

### eventEngine.test.js

```js
describe('resolveVariables', () => {

  test('remplace {pseudo} par la valeur du contexte', () => {
    const result = resolveVariables('Bonjour {pseudo} !', { pseudo: 'Léo' })
    expect(result).toBe('Bonjour Léo !')
  })

  test('laisse les variables inconnues intactes', () => {
    const result = resolveVariables('Tu as {xp_earned} XP', {})
    expect(result).toBe('Tu as {xp_earned} XP')
  })

  test('remplace plusieurs variables dans un message', () => {
    const result = resolveVariables(
      'Ça fait {days_absent} jours {pseudo} !',
      { days_absent: 3, pseudo: 'Zoé' }
    )
    expect(result).toBe('Ça fait 3 jours Zoé !')
  })
})

describe('processEvents — filtrage', () => {

  test('ne déclenche pas un événement once déjà déclenché', async () => {
    // Mock loadEvents avec un événement once: true
    // triggeredIds contient l'id → aucune action retournée
  })

  test('ne déclenche pas si le trigger ne correspond pas', async () => {
    // Événement sur "app_start", trigger "course_enter" → aucune action
  })

  test('déclenche si toutes les conditions sont remplies', async () => {
    // Événement avec condition session_count eq 1, context session_count=1 → déclenché
  })
})
```

---

## Note JALON 8a — Lottie sur Android

Les animations de la mascotte sont en CSS pur au jalon 6.
Sur Android natif (jalon 8a), elles seront remplacées par des fichiers Lottie :

```jsx
// ═══════════════════════════════════════════════════════
// JALON 8a — Android natif :
// Remplacer les animations CSS par des fichiers Lottie
// Dossier : assets/animations/mascotte-{animation}.json
// Lib     : com.airbnb.android:lottie-compose
// ═══════════════════════════════════════════════════════
```

Annoter `MascotteAvatar.jsx` avec ce commentaire.

---

## Ce qu'il ne faut PAS faire

```
✗ Ne pas déclencher plusieurs dialogs simultanément
  → tout passe par la queue de EventContext
✗ Ne pas appeler trigger() dans un useEffect sans conditions
  → risque de boucle infinie si le contexte change
✗ Ne pas bloquer la navigation en attendant les événements
  → les événements sont asynchrones, la navigation continue
✗ Ne pas afficher le dialog mascotte par-dessus un exercice en cours
  → uniquement sur les écrans de navigation (Splash, Menu, SubjectSelect,
    CourseSelect, StepSelect) et après un exercice complété
✗ Ne pas importer EventContext depuis les services
  → seulement depuis les composants et hooks
```

## Ce qu'il faut absolument faire

```
✓ EventProvider wrappé autour de AppRouter dans App.jsx
✓ MascotteDialog monté une seule fois dans App.jsx
✓ resolveVariables couvre toutes les variables des messages events.yaml
✓ Commentaire JALON 8a dans MascotteAvatar.jsx (Lottie)
✓ Queue respectée — jamais deux dialogs simultanés
✓ Événement once loggé en backend via logEvent()
✓ Son joué via Howler.js (useAudio hook existant)
✓ Tests unitaires eventConditions et eventEngine
✓ npm run build passe
```

---

## Résumé des fichiers créés / modifiés

### Nouveaux fichiers YAML

```
public/content/events/events.yaml
```

### Nouveaux services

```
src/services/eventEngine.js
src/services/eventConditions.js
src/services/eventActions.js
```

### Nouveau contexte

```
src/context/EventContext.jsx
```

### Nouveau hook

```
src/hooks/useEventEngine.js
```

### Nouveaux composants

```
src/components/mascotte/MascotteDialog.jsx
src/components/mascotte/MascotteAvatar.jsx
src/components/mascotte/MascotteMessage.jsx
src/components/mascotte/CelebrationOverlay.jsx
```

### Nouveaux styles

```
src/styles/mascotte.css
```

### Nouveaux tests

```
src/__tests__/eventEngine.test.js
src/__tests__/eventConditions.test.js
```

### Fichiers modifiés

```
src/App.jsx                                  ← EventProvider + MascotteDialog
src/screens/Splash/SplashScreen.jsx          ← trigger app_start + buildStartContext
src/screens/SubjectSelect/SubjectSelectScreen.jsx ← trigger subject_enter
src/screens/CourseSelect/CourseSelectScreen.jsx   ← trigger course_enter
src/screens/StepPlayer/StepPlayerScreen.jsx       ← trigger step_complete
src/components/exercise/ExerciseEngine.jsx        ← trigger exercise_complete
src/services/scoreService.js                      ← trigger badge_earned
src/main.jsx                                      ← import mascotte.css
```

### Fichiers non touchés

```
Tous les composants d'exercices
Le parc SVG
Le backend (user_event_history existe déjà depuis jalon 4b)
contentService.js
progressService.js / profileService.js
useProfile.js / useProgress.js
Les tests existants
Les services de gamification (jalon 5)
```
