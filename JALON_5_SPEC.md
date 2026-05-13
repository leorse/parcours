# Jalon 5 — Gamification
## Document technique pour Claude dans VS Code

---

## Objectif

Rendre l'app engageante et donner des raisons de revenir.
Brancher les données de progression (déjà en base depuis le jalon 4b)
sur une couche de gamification visible : XP animé, niveaux, badges,
trophées, streak, radar chart des compétences, suggestions de renforcement,
dashboard de profil complet.

**À la fin du jalon 5 :**
- Chaque exercice complété déclenche une animation XP visible
- Les niveaux montent avec une célébration
- Les badges se débloquent automatiquement selon les conditions YAML
- Le streak est affiché et récompensé
- Un écran de profil montre tout : XP, niveau, compétences, badges, streak
- Les suggestions de renforcement identifient les skills faibles
- `npm run build` passe avec les nouveaux tests

**Ce qui ne change pas :** les exercices, le parc SVG, le moteur de cours,
le backend (toutes les tables existent déjà depuis le jalon 4b).

---

## Nouvelles dépendances

```bash
# recharts est déjà installé depuis le jalon 1
# Vérifier qu'il est bien présent, sinon :
npm install recharts
```

Pas de nouvelle dépendance majeure — tout ce jalon est de la logique
et de l'UI React + des appels aux endpoints déjà existants.

---

## Nouveaux fichiers de config YAML

### public/content/config/levels.yaml

```yaml
levels:
  - level: 1
    xp_required: 0
    label: "Explorateur"
    icon: "🌱"

  - level: 2
    xp_required: 100
    label: "Apprenti"
    icon: "📚"

  - level: 3
    xp_required: 300
    label: "Aventurier"
    icon: "🧭"

  - level: 4
    xp_required: 600
    label: "Expert"
    icon: "⭐"

  - level: 5
    xp_required: 1000
    label: "Maître"
    icon: "🏆"

  - level: 6
    xp_required: 1500
    label: "Champion"
    icon: "👑"

  - level: 7
    xp_required: 2200
    label: "Légende"
    icon: "🌟"
```

### public/content/config/badges.yaml

```yaml
badges:

  # ── Premiers pas ────────────────────────────────────────────────────────────
  - id: "badge-first-exercise"
    label: "Premier pas"
    description: "Complète ton premier exercice"
    icon: "🎯"
    category: "progression"
    condition:
      type: "exercise_count"
      operator: "gte"
      value: 1

  - id: "badge-first-course"
    label: "Premier cours"
    description: "Termine un cours complet"
    icon: "📖"
    category: "progression"
    condition:
      type: "course_complete_count"
      operator: "gte"
      value: 1

  - id: "badge-ten-exercises"
    label: "En route !"
    description: "Complète 10 exercices"
    icon: "🚀"
    category: "progression"
    condition:
      type: "exercise_count"
      operator: "gte"
      value: 10

  # ── Streak ───────────────────────────────────────────────────────────────────
  - id: "badge-streak-3"
    label: "3 jours d'affilée"
    description: "Reviens 3 jours de suite"
    icon: "🔥"
    category: "streak"
    condition:
      type: "streak"
      operator: "gte"
      value: 3

  - id: "badge-streak-7"
    label: "Une semaine !"
    description: "Reviens 7 jours de suite"
    icon: "🔥🔥"
    category: "streak"
    condition:
      type: "streak"
      operator: "gte"
      value: 7

  # ── Compétences ──────────────────────────────────────────────────────────────
  - id: "badge-fraction-master"
    label: "Maître des fractions"
    description: "Atteins 80% sur toutes les compétences fractions"
    icon: "½"
    category: "skill"
    condition:
      type: "skill_score"
      skill_tag: "fraction/*"
      operator: "gte"
      value: 0.8
      min_confidence: "medium"

  - id: "badge-multiplication-master"
    label: "As de la multiplication"
    description: "Atteins 80% en multiplication"
    icon: "✖️"
    category: "skill"
    condition:
      type: "skill_score"
      skill_tag: "multiplication/*"
      operator: "gte"
      value: 0.8
      min_confidence: "medium"

  - id: "badge-dictee-master"
    label: "Petit écrivain"
    description: "Atteins 80% en dictée"
    icon: "✍️"
    category: "skill"
    condition:
      type: "skill_score"
      skill_tag: "orthographe/dictee"
      operator: "gte"
      value: 0.8
      min_confidence: "medium"

  # ── Score parfait ─────────────────────────────────────────────────────────────
  - id: "badge-perfect-score"
    label: "Parfait !"
    description: "Obtiens 100% à un exercice"
    icon: "💯"
    category: "performance"
    condition:
      type: "exercise_perfect_count"
      operator: "gte"
      value: 1

  - id: "badge-five-perfect"
    label: "Excellence"
    description: "Obtiens 5 scores parfaits"
    icon: "✨"
    category: "performance"
    condition:
      type: "exercise_perfect_count"
      operator: "gte"
      value: 5
```

### public/content/config/trophies.yaml

```yaml
trophies:

  - id: "trophy-streak-30"
    label: "Un mois sans relâche"
    description: "30 jours consécutifs"
    icon: "🏅"
    condition:
      type: "streak"
      operator: "gte"
      value: 30

  - id: "trophy-all-badges"
    label: "Collectionneur"
    description: "Obtiens tous les badges"
    icon: "🎖️"
    condition:
      type: "badge_count"
      operator: "gte"
      value: 9   # total des badges définis

  - id: "trophy-xp-1000"
    label: "Mille points"
    description: "Atteins 1000 XP"
    icon: "💎"
    condition:
      type: "total_xp"
      operator: "gte"
      value: 1000
```

---

## Structure des nouveaux services frontend

```
src/services/
  xpService.js              ← XP total, niveau, calcul progression dans niveau
  skillService.js           ← scores compétences, hydratation depuis backend
  badgeService.js           ← évaluation conditions, déblocage
  streakService.js          ← lecture streak depuis backend
  recommendationService.js  ← exercices de renforcement ciblés
```

---

## xpService.js

```js
// src/services/xpService.js

import yaml from 'js-yaml'

let levelsCache = null

async function getLevels() {
  if (levelsCache) return levelsCache
  const res  = await fetch('/content/config/levels.yaml')
  const text = await res.text()
  levelsCache = yaml.load(text).levels
  return levelsCache
}

export async function getLevelFromXP(totalXP) {
  const levels = await getLevels()
  let current  = levels[0]
  for (const lvl of levels) {
    if (totalXP >= lvl.xp_required) current = lvl
    else break
  }
  return current
}

export async function getNextLevel(totalXP) {
  const levels = await getLevels()
  return levels.find(l => l.xp_required > totalXP) ?? null
}

export async function getProgressInLevel(totalXP) {
  // Retourne 0.0 à 1.0 — progression dans le niveau courant
  const levels  = await getLevels()
  const current = await getLevelFromXP(totalXP)
  const next    = await getNextLevel(totalXP)

  if (!next) return 1.0   // niveau max atteint

  const xpInLevel  = totalXP - current.xp_required
  const xpForLevel = next.xp_required - current.xp_required
  return Math.min(xpInLevel / xpForLevel, 1.0)
}

export async function fetchUserXP(uid, token) {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/xp/${uid}?token=${token}`
  )
  if (!res.ok) return null
  return res.json()   // { uid, total_xp, level }
}
```

---

## skillService.js

```js
// src/services/skillService.js

const BACKEND = import.meta.env.VITE_BACKEND_URL

export async function fetchUserSkills(uid, token) {
  try {
    const res = await fetch(`${BACKEND}/api/skills/${uid}?token=${token}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.skills ?? []
  } catch {
    return []
  }
}

export function getWeakSkills(skills, minAttempts = 3, maxScore = 0.5) {
  // Retourne les skills faibles avec assez d'essais pour être fiables
  return skills
    .filter(s =>
      s.score < maxScore &&
      s.attempts >= minAttempts &&
      s.confidence !== 'low'
    )
    .sort((a, b) => a.score - b.score)
}

export function getStrongSkills(skills, minScore = 0.75) {
  return skills
    .filter(s => s.score >= minScore && s.confidence !== 'low')
    .sort((a, b) => b.score - a.score)
}

export function groupSkillsBySubject(skills, skillsTree) {
  // Regroupe les skills par matière pour le radar chart
  // skillsTree = contenu de skills-tree.yaml
  const groups = {}
  skills.forEach(skill => {
    const subject = skillsTree.find(s =>
      s.children?.some(c => c.id === skill.skill_tag)
    )
    if (subject) {
      if (!groups[subject.id]) groups[subject.id] = []
      groups[subject.id].push(skill)
    }
  })
  return groups
}
```

---

## badgeService.js

```js
// src/services/badgeService.js

import yaml from 'js-yaml'

let badgesCache  = null
let trophiesCache = null

async function getBadgesDef() {
  if (badgesCache) return badgesCache
  const res  = await fetch('/content/config/badges.yaml')
  const text = await res.text()
  badgesCache = yaml.load(text).badges
  return badgesCache
}

async function getTrophiesDef() {
  if (trophiesCache) return trophiesCache
  const res  = await fetch('/content/config/trophies.yaml')
  const text = await res.text()
  trophiesCache = yaml.load(text).trophies
  return trophiesCache
}

// ── Évaluation d'une condition ────────────────────────────────────────────────

function matchesWildcard(tag, pattern) {
  // "fraction/*" match "fraction/addition", "fraction/simplification"...
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2)
    return tag.startsWith(prefix + '/')
  }
  return tag === pattern
}

function evaluate(condition, stats) {
  const { type, operator, value, skill_tag, min_confidence } = condition
  const ops = {
    gte: (a, b) => a >= b,
    gt:  (a, b) => a > b,
    eq:  (a, b) => a === b,
    lt:  (a, b) => a < b,
  }
  const compare = ops[operator] ?? ops.gte

  switch (type) {
    case 'exercise_count':
      return compare(stats.exerciseCount ?? 0, value)

    case 'exercise_perfect_count':
      return compare(stats.perfectCount ?? 0, value)

    case 'course_complete_count':
      return compare(stats.courseCompleteCount ?? 0, value)

    case 'streak':
      return compare(stats.currentStreak ?? 0, value)

    case 'total_xp':
      return compare(stats.totalXP ?? 0, value)

    case 'badge_count':
      return compare(stats.earnedBadgeCount ?? 0, value)

    case 'skill_score': {
      const matchingSkills = (stats.skills ?? []).filter(s =>
        matchesWildcard(s.skill_tag, skill_tag) &&
        (!min_confidence || s.confidence !== 'low')
      )
      if (!matchingSkills.length) return false
      const avgScore = matchingSkills.reduce((acc, s) => acc + s.score, 0) / matchingSkills.length
      return compare(avgScore, value)
    }

    default:
      return false
  }
}

// ── Vérifier quels badges sont nouvellement débloqués ─────────────────────────

export async function checkNewBadges(stats, earnedBadgeIds) {
  const all     = await getBadgesDef()
  const newOnes = []

  for (const badge of all) {
    if (earnedBadgeIds.includes(badge.id)) continue   // déjà obtenu
    if (evaluate(badge.condition, stats)) {
      newOnes.push(badge)
    }
  }
  return newOnes
}

export async function checkNewTrophies(stats, earnedTrophyIds) {
  const all     = await getTrophiesDef()
  const newOnes = []

  for (const trophy of all) {
    if (earnedTrophyIds.includes(trophy.id)) continue
    if (evaluate(trophy.condition, stats)) {
      newOnes.push(trophy)
    }
  }
  return newOnes
}

export { getBadgesDef, getTrophiesDef }
```

---

## recommendationService.js

```js
// src/services/recommendationService.js

import { getWeakSkills } from './skillService'
import { getExercises }  from './contentService'

export async function getReinforcementExercises(skills, allCourses, recentExerciseIds = [], maxResults = 5) {
  const weak = getWeakSkills(skills)
  if (!weak.length) return []

  const recommendations = []

  for (const skill of weak) {
    for (const course of allCourses) {
      const exercises = await getExercises(course.id, course.subjectId)

      const matching = exercises.filter(exo => {
        const tags   = exo.skills?.map(s => s.tag) ?? []
        const recent = recentExerciseIds.includes(exo.id)
        return tags.includes(skill.skill_tag) && !recent
      })

      // Trier par difficulté adaptée au score actuel
      const difficulty = skill.score < 0.3 ? 1 : skill.score < 0.6 ? 2 : 3
      const sorted = matching
        .filter(e => e.difficulty <= difficulty)
        .sort((a, b) => a.difficulty - b.difficulty)

      recommendations.push(...sorted)
    }
  }

  // Dédupliquer et limiter
  const unique = [...new Map(recommendations.map(e => [e.id, e])).values()]
  return unique.slice(0, maxResults)
}
```

---

## Mise à jour de scoreService.js

```js
// src/services/scoreService.js
// Après saveResult, déclencher l'évaluation des badges

import { saveExerciseResult }         from './progressService'
import { getCurrentUser }             from './profileService'
import { checkNewBadges, checkNewTrophies } from './badgeService'
import { getFirebaseToken }           from './profileService'

export async function saveResult(exerciseId, result, userId) {
  const uid   = userId ?? getCurrentUser()?.uid
  if (!uid) return { newBadges: [], newTrophies: [] }

  // 1. Sauvegarder le résultat
  await saveExerciseResult(uid, exerciseId, {
    score:        result.score,
    xpEarned:     result.xpEarned,
    correct:      result.correct,
    skills:       result.skills ?? [],
    timeSpentSec: result.timeSpentSec ?? null,
  })

  // 2. Vérifier les nouveaux badges (fire and forget si erreur)
  try {
    const token        = await getFirebaseToken()
    const [xpData, skillsData, badgesData, streakData] = await Promise.all([
      fetch(`${BACKEND}/api/xp/${uid}?token=${token}`).then(r => r.json()),
      fetch(`${BACKEND}/api/skills/${uid}?token=${token}`).then(r => r.json()),
      fetch(`${BACKEND}/api/badges/${uid}?token=${token}`).then(r => r.json()),
      fetch(`${BACKEND}/api/streak/${uid}?token=${token}`).then(r => r.json()),
    ])

    const stats = {
      totalXP:            xpData.total_xp      ?? 0,
      skills:             skillsData.skills     ?? [],
      currentStreak:      streakData.current_streak ?? 0,
      earnedBadgeCount:   badgesData.badges?.length ?? 0,
      exerciseCount:      0,   // simplifié — à enrichir
      perfectCount:       result.score >= 1.0 ? 1 : 0,
      courseCompleteCount: 0,  // simplifié — à enrichir
    }

    const earnedIds   = badgesData.badges?.map(b => b.badge_id) ?? []
    const newBadges   = await checkNewBadges(stats, earnedIds)
    const newTrophies = await checkNewTrophies(stats, [])

    // Sauvegarder les nouveaux badges en backend
    for (const badge of newBadges) {
      await fetch(`${BACKEND}/api/badges/award`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, badge_id: badge.id }),
      })
    }

    return { newBadges, newTrophies }
  } catch (e) {
    console.warn('[scoreService] Évaluation badges échouée :', e.message)
    return { newBadges: [], newTrophies: [] }
  }
}
```

---

## Nouveaux composants UI

### Structure

```
src/components/
  gamification/
    XpBar.jsx              ← barre XP avec animation
    XpGainAnimation.jsx    ← "+15 XP" qui monte et disparaît
    LevelUpCelebration.jsx ← écran plein écran montée de niveau
    BadgeUnlock.jsx        ← dialog déblocage badge
    StreakDisplay.jsx      ← flamme + nombre de jours
    RadarChart.jsx         ← graphe radar recharts
    BadgeGrid.jsx          ← grille des badges (obtenus + verrouillés)
    ReinforcementCard.jsx  ← carte exercice suggéré
```

### XpBar.jsx

```jsx
import { motion } from 'framer-motion'

export default function XpBar({ totalXP, levelData, nextLevelData, progress }) {
  // progress = 0.0 à 1.0 dans le niveau courant

  return (
    <div className="xp-bar-container">
      <div className="xp-bar-labels">
        <span>{levelData.icon} {levelData.label}</span>
        <span>{totalXP} XP</span>
      </div>
      <div className="xp-bar-track">
        <motion.div
          className="xp-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {nextLevelData && (
        <div className="xp-bar-next">
          Prochain niveau : {nextLevelData.xp_required} XP
        </div>
      )}
    </div>
  )
}
```

### XpGainAnimation.jsx

```jsx
import { motion, AnimatePresence } from 'framer-motion'

export default function XpGainAnimation({ xp, visible, onComplete }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="xp-gain"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -60 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          onAnimationComplete={onComplete}
        >
          +{xp} XP ⭐
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### LevelUpCelebration.jsx

```jsx
import { motion } from 'framer-motion'

export default function LevelUpCelebration({ levelData, onClose }) {
  return (
    <motion.div
      className="levelup-overlay"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
    >
      <div className="levelup-content">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 0.6 }}
          className="levelup-icon"
        >
          {levelData.icon}
        </motion.div>
        <h2>Niveau supérieur !</h2>
        <p>Tu es maintenant <strong>{levelData.label}</strong></p>
        <button onClick={onClose}>🎉 Super !</button>
      </div>
    </motion.div>
  )
}
```

### BadgeUnlock.jsx

```jsx
import { motion, AnimatePresence } from 'framer-motion'

export default function BadgeUnlock({ badge, visible, onClose }) {
  return (
    <AnimatePresence>
      {visible && badge && (
        <motion.div
          className="badge-unlock-overlay"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
        >
          <div className="badge-unlock-card">
            <p className="badge-unlock-title">Badge débloqué !</p>
            <div className="badge-icon-large">{badge.icon}</div>
            <h3>{badge.label}</h3>
            <p>{badge.description}</p>
            <button onClick={onClose}>OK</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### StreakDisplay.jsx

```jsx
export default function StreakDisplay({ currentStreak, longestStreak }) {
  if (!currentStreak) return null

  return (
    <div className="streak-display">
      <span className="streak-flame">🔥</span>
      <span className="streak-count">{currentStreak}</span>
      <span className="streak-label">
        {currentStreak === 1 ? 'jour' : 'jours'}
      </span>
    </div>
  )
}
```

### RadarChart.jsx

```jsx
import {
  Radar, RadarChart, PolarGrid,
  PolarAngleAxis, ResponsiveContainer
} from 'recharts'

export default function SkillRadarChart({ skills, subjectColor }) {
  if (!skills?.length) return (
    <div className="radar-empty">
      Fais des exercices pour voir tes compétences !
    </div>
  )

  const data = skills.map(s => ({
    skill: s.label ?? s.skill_tag.split('/').pop(),
    score: Math.round(s.score * 100),
    fullMark: 100,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
        <Radar
          name="Compétences"
          dataKey="score"
          stroke={subjectColor ?? '#4F46E5'}
          fill={subjectColor ?? '#4F46E5'}
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
```

---

## Mise à jour de ExerciseResult.jsx

Après un exercice, afficher l'animation XP et déclencher les badges.

```jsx
// src/components/exercise/ExerciseResult.jsx
// Ajouter les états pour l'animation gamification

import { useState, useEffect } from 'react'
import { getLevelFromXP, getNextLevel, getProgressInLevel } from '../../services/xpService'
import XpGainAnimation   from '../gamification/XpGainAnimation'
import LevelUpCelebration from '../gamification/LevelUpCelebration'
import BadgeUnlock        from '../gamification/BadgeUnlock'

export default function ExerciseResult({
  score, xp, feedback, onContinue, onRetry,
  newBadges = [],    // passé depuis ExerciseEngine après saveResult
  xpBefore = 0,     // XP avant l'exercice
  xpAfter = 0,      // XP après l'exercice
}) {
  const xpEarned = Math.round(xp * score)
  const isSuccess = score >= 0.5

  const [showXpAnim,   setShowXpAnim]   = useState(true)
  const [levelUpData,  setLevelUpData]  = useState(null)
  const [badgeQueue,   setBadgeQueue]   = useState(newBadges)
  const [currentBadge, setCurrentBadge] = useState(null)

  // Vérifier si un niveau a été franchi
  useEffect(() => {
    async function checkLevelUp() {
      if (xpBefore === xpAfter || !xpEarned) return
      const before = await getLevelFromXP(xpBefore)
      const after  = await getLevelFromXP(xpAfter)
      if (after.level > before.level) setLevelUpData(after)
    }
    checkLevelUp()
  }, [xpBefore, xpAfter])

  // Afficher les badges un par un
  useEffect(() => {
    if (badgeQueue.length > 0 && !currentBadge) {
      setCurrentBadge(badgeQueue[0])
      setBadgeQueue(q => q.slice(1))
    }
  }, [badgeQueue, currentBadge])

  return (
    <div className={`exercise-result ${isSuccess ? 'success' : 'fail'}`}>

      {/* Animation XP */}
      <XpGainAnimation
        xp={xpEarned}
        visible={showXpAnim && xpEarned > 0}
        onComplete={() => setShowXpAnim(false)}
      />

      <div className="result-icon">{isSuccess ? '🎉' : '💪'}</div>
      <div className="result-score">{Math.round(score * 100)}%</div>

      {feedback && <div className="result-feedback">{feedback}</div>}

      <div className="result-xp">+{xpEarned} XP</div>

      <div className="result-actions">
        {!isSuccess && (
          <button className="btn-secondary" onClick={onRetry}>Réessayer</button>
        )}
        <button className="btn-primary" onClick={onContinue}>Continuer</button>
      </div>

      {/* Célébration montée de niveau */}
      {levelUpData && (
        <LevelUpCelebration
          levelData={levelUpData}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {/* Queue de badges */}
      <BadgeUnlock
        badge={currentBadge}
        visible={!!currentBadge}
        onClose={() => setCurrentBadge(null)}
      />
    </div>
  )
}
```

---

## Nouvel écran — ProfileScreen

```
src/screens/Profile/ProfileScreen.jsx
```

Accessible depuis le MainMenu (bouton profil ou avatar en haut).
Route à ajouter : `/profile`

```jsx
// src/screens/Profile/ProfileScreen.jsx

import { useState, useEffect }   from 'react'
import { useProfile }            from '../../hooks/useProfile'
import { fetchUserXP, getLevelFromXP, getNextLevel, getProgressInLevel }
  from '../../services/xpService'
import { fetchUserSkills, getWeakSkills, getStrongSkills }
  from '../../services/skillService'
import { getBadgesDef }          from '../../services/badgeService'
import { getFirebaseToken }      from '../../services/profileService'
import XpBar                     from '../../components/gamification/XpBar'
import StreakDisplay              from '../../components/gamification/StreakDisplay'
import SkillRadarChart           from '../../components/gamification/RadarChart'
import BadgeGrid                 from '../../components/gamification/BadgeGrid'
import ReinforcementSection      from '../../components/gamification/ReinforcementCard'
import PageTransition            from '../../components/layout/PageTransition'

export default function ProfileScreen() {
  const { uid, pseudo, avatar } = useProfile()
  const [loading,  setLoading]  = useState(true)
  const [xpData,   setXpData]   = useState(null)
  const [levelData, setLevelData] = useState(null)
  const [nextLevel, setNextLevel] = useState(null)
  const [progress, setProgress] = useState(0)
  const [skills,   setSkills]   = useState([])
  const [badges,   setBadges]   = useState([])
  const [streak,   setStreak]   = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const token = await getFirebaseToken()
        const BACKEND = import.meta.env.VITE_BACKEND_URL

        const [xp, skillsRes, badgesRes, streakRes, allBadgesDef] = await Promise.all([
          fetch(`${BACKEND}/api/xp/${uid}?token=${token}`).then(r => r.json()),
          fetch(`${BACKEND}/api/skills/${uid}?token=${token}`).then(r => r.json()),
          fetch(`${BACKEND}/api/badges/${uid}?token=${token}`).then(r => r.json()),
          fetch(`${BACKEND}/api/streak/${uid}?token=${token}`).then(r => r.json()),
          getBadgesDef(),
        ])

        const totalXP = xp.total_xp ?? 0
        setXpData(xp)
        setLevelData(await getLevelFromXP(totalXP))
        setNextLevel(await getNextLevel(totalXP))
        setProgress(await getProgressInLevel(totalXP))
        setSkills(skillsRes.skills ?? [])
        setStreak(streakRes)

        // Fusionner badges obtenus avec définitions
        const earned = badgesRes.badges?.map(b => b.badge_id) ?? []
        setBadges(allBadgesDef.map(b => ({
          ...b,
          earned: earned.includes(b.id),
        })))
      } catch (e) {
        console.error('Erreur chargement profil :', e)
      } finally {
        setLoading(false)
      }
    }
    if (uid) load()
  }, [uid])

  if (loading) return <LoadingView />

  const weak   = getWeakSkills(skills)
  const strong = getStrongSkills(skills)

  return (
    <PageTransition>
      <div className="profile-screen">

        {/* Header profil */}
        <div className="profile-header">
          <img src={`/assets/avatars/${avatar}.webp`} alt={pseudo} className="profile-avatar-lg" />
          <h2>{pseudo}</h2>
          {streak && <StreakDisplay currentStreak={streak.current_streak} longestStreak={streak.longest_streak} />}
        </div>

        {/* XP + niveau */}
        {levelData && (
          <section className="profile-section">
            <h3>Niveau {levelData.level} — {levelData.label}</h3>
            <XpBar
              totalXP={xpData?.total_xp ?? 0}
              levelData={levelData}
              nextLevelData={nextLevel}
              progress={progress}
            />
          </section>
        )}

        {/* Compétences */}
        {skills.length > 0 && (
          <section className="profile-section">
            <h3>Mes compétences</h3>
            <SkillRadarChart skills={skills} />
            {strong.length > 0 && (
              <div className="skills-strong">
                <strong>Points forts :</strong>
                {strong.slice(0, 3).map(s => (
                  <span key={s.skill_tag} className="skill-tag skill-strong">
                    {s.skill_tag.split('/').pop()} {Math.round(s.score * 100)}%
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Exercices de renforcement */}
        {weak.length > 0 && (
          <section className="profile-section">
            <h3>À travailler</h3>
            {weak.slice(0, 3).map(s => (
              <div key={s.skill_tag} className="weak-skill">
                ⚠️ {s.skill_tag.split('/').pop()} — {Math.round(s.score * 100)}%
              </div>
            ))}
          </section>
        )}

        {/* Badges */}
        <section className="profile-section">
          <h3>Badges ({badges.filter(b => b.earned).length} / {badges.length})</h3>
          <BadgeGrid badges={badges} />
        </section>

      </div>
    </PageTransition>
  )
}
```

---

## Mise à jour du routeur

```js
// src/router/AppRouter.jsx — ajouter

export const ROUTES = {
  // ... routes existantes ...
  PROFILE: '/profile',
}

// Dans <Routes> :
<Route path={ROUTES.PROFILE} element={
  <RequireAuth><ProfileScreen /></RequireAuth>
} />
```

---

## Nouveaux tests unitaires

```
src/__tests__/
  xpService.test.js
  skillService.test.js
  badgeService.test.js
  streakService.test.js
```

### xpService.test.js

```js
// Mock fetch pour getLevels
describe('xpService', () => {

  const MOCK_LEVELS = [
    { level: 1, xp_required: 0,    label: 'Explorateur', icon: '🌱' },
    { level: 2, xp_required: 100,  label: 'Apprenti',    icon: '📚' },
    { level: 3, xp_required: 300,  label: 'Aventurier',  icon: '🧭' },
  ]

  test('0 XP → niveau 1', async () => {
    const lvl = getLevelFromXP_sync(0, MOCK_LEVELS)
    expect(lvl.level).toBe(1)
  })

  test('100 XP → niveau 2', async () => {
    const lvl = getLevelFromXP_sync(100, MOCK_LEVELS)
    expect(lvl.level).toBe(2)
  })

  test('299 XP → niveau 2 (pas encore 3)', async () => {
    const lvl = getLevelFromXP_sync(299, MOCK_LEVELS)
    expect(lvl.level).toBe(2)
  })

  test('progression dans niveau 2 : 200 XP → 50%', () => {
    const p = getProgressInLevel_sync(200, MOCK_LEVELS)
    expect(p).toBeCloseTo(0.5)
  })
})
```

### badgeService.test.js

```js
describe('badgeService — evaluate conditions', () => {

  test('exercise_count gte 1 → vrai si exerciseCount=1', () => {
    const stats = { exerciseCount: 1 }
    const cond  = { type: 'exercise_count', operator: 'gte', value: 1 }
    expect(evaluateCondition(cond, stats)).toBe(true)
  })

  test('exercise_count gte 10 → faux si exerciseCount=5', () => {
    const stats = { exerciseCount: 5 }
    const cond  = { type: 'exercise_count', operator: 'gte', value: 10 }
    expect(evaluateCondition(cond, stats)).toBe(false)
  })

  test('skill_score avec wildcard fraction/* → vrai si score moyen >= seuil', () => {
    const stats = {
      skills: [
        { skill_tag: 'fraction/addition',       score: 0.9, confidence: 'high' },
        { skill_tag: 'fraction/simplification',  score: 0.85, confidence: 'medium' },
      ]
    }
    const cond = {
      type: 'skill_score', skill_tag: 'fraction/*',
      operator: 'gte', value: 0.8, min_confidence: 'medium'
    }
    expect(evaluateCondition(cond, stats)).toBe(true)
  })

  test('skill_score avec wildcard → faux si confidence=low exclu', () => {
    const stats = {
      skills: [
        { skill_tag: 'fraction/addition', score: 0.9, confidence: 'low' },
      ]
    }
    const cond = {
      type: 'skill_score', skill_tag: 'fraction/*',
      operator: 'gte', value: 0.8, min_confidence: 'medium'
    }
    expect(evaluateCondition(cond, stats)).toBe(false)
  })

  test('streak gte 7 → vrai si currentStreak=7', () => {
    const stats = { currentStreak: 7 }
    const cond  = { type: 'streak', operator: 'gte', value: 7 }
    expect(evaluateCondition(cond, stats)).toBe(true)
  })
})
```

### skillService.test.js

```js
describe('skillService', () => {

  const SKILLS = [
    { skill_tag: 'fraction/addition',    score: 0.3, attempts: 5, confidence: 'medium' },
    { skill_tag: 'multiplication/base',  score: 0.9, attempts: 12, confidence: 'high' },
    { skill_tag: 'geometrie/aires',      score: 0.2, attempts: 2, confidence: 'low' },
    { skill_tag: 'fraction/division',    score: 0.4, attempts: 4, confidence: 'medium' },
  ]

  test('getWeakSkills retourne les skills < 0.5 avec assez d\'essais', () => {
    const weak = getWeakSkills(SKILLS)
    expect(weak.map(s => s.skill_tag)).toContain('fraction/addition')
    expect(weak.map(s => s.skill_tag)).not.toContain('geometrie/aires')  // confidence low
  })

  test('getWeakSkills triés du plus faible au plus fort', () => {
    const weak = getWeakSkills(SKILLS)
    for (let i = 1; i < weak.length; i++) {
      expect(weak[i].score).toBeGreaterThanOrEqual(weak[i-1].score)
    }
  })

  test('getStrongSkills retourne les skills >= 0.75', () => {
    const strong = getStrongSkills(SKILLS)
    expect(strong.map(s => s.skill_tag)).toContain('multiplication/base')
    expect(strong.every(s => s.score >= 0.75)).toBe(true)
  })
})
```

---

## Ce qu'il ne faut PAS faire

```
✗ Ne pas bloquer l'affichage du résultat en attendant les badges
  → évaluation badges en arrière-plan, résultat affiché immédiatement
✗ Ne pas afficher plusieurs animations en même temps
  → queue pour les badges (un par un)
✗ Ne pas recalculer les badges à chaque render
  → uniquement après saveResult
✗ Ne pas modifier le backend — toutes les tables existent déjà
✗ Ne pas viser 100% de couverture — couvrir evaluate() et les services
  de calcul (xpService, skillService)
```

## Ce qu'il faut absolument faire

```
✓ XpGainAnimation visible après chaque exercice réussi
✓ LevelUpCelebration si un niveau est franchi
✓ BadgeUnlock en queue (jamais deux en même temps)
✓ ProfileScreen accessible depuis le MainMenu
✓ RadarChart affiché uniquement si skills.length > 0
✓ Suggestions de renforcement basées sur les vrais scores backend
✓ Streak affiché dans le profil
✓ Tests unitaires pour xpService, skillService, badgeService
✓ npm run build passe
```

---

## Résumé des fichiers créés / modifiés

### Nouveaux fichiers YAML

```
public/content/config/levels.yaml
public/content/config/badges.yaml
public/content/config/trophies.yaml
```

### Nouveaux services

```
src/services/xpService.js
src/services/skillService.js
src/services/badgeService.js
src/services/recommendationService.js
```

### Nouveaux composants

```
src/components/gamification/XpBar.jsx
src/components/gamification/XpGainAnimation.jsx
src/components/gamification/LevelUpCelebration.jsx
src/components/gamification/BadgeUnlock.jsx
src/components/gamification/StreakDisplay.jsx
src/components/gamification/RadarChart.jsx
src/components/gamification/BadgeGrid.jsx
src/components/gamification/ReinforcementCard.jsx
src/screens/Profile/ProfileScreen.jsx
```

### Nouveaux tests

```
src/__tests__/xpService.test.js
src/__tests__/skillService.test.js
src/__tests__/badgeService.test.js
src/__tests__/streakService.test.js
```

### Fichiers modifiés

```
src/services/scoreService.js          ← évaluation badges après saveResult
src/components/exercise/ExerciseResult.jsx ← animations XP + badges
src/router/AppRouter.jsx              ← route /profile
src/screens/MainMenu/MainMenuScreen.jsx ← bouton vers profil
```

### Fichiers non touchés

```
Tous les exercices
Le parc SVG
Le backend (toutes les tables existent déjà)
contentService.js
progressService.js / profileService.js
useProfile.js / useProgress.js
Les tests existants
```
