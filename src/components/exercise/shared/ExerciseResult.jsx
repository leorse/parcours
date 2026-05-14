import { useState, useEffect } from 'react'
import MathText from './MathText'
import XpGainAnimation    from '../../gamification/XpGainAnimation'
import LevelUpCelebration from '../../gamification/LevelUpCelebration'
import BadgeUnlock        from '../../gamification/BadgeUnlock'
import { getLevelFromXP } from '../../../services/xpService'

export default function ExerciseResult({
  result,
  xp,
  onReset,
  newBadges = [],
  xpBefore  = 0,
  xpAfter   = 0,
}) {
  if (!result) return null

  const { correct, score, details, points_reussis, a_ameliorer, flag } = result
  const isIndeterminate = correct === null
  const isSuccess  = !isIndeterminate && score >= 0.5
  const xpEarned   = isIndeterminate ? null : Math.round((xp ?? 0) * (score ?? 0))
  const feedback   = details?.feedback

  const [showXpAnim,   setShowXpAnim]   = useState(xpEarned > 0)
  const [levelUpData,  setLevelUpData]  = useState(null)
  const [badgeQueue,   setBadgeQueue]   = useState(newBadges)
  const [currentBadge, setCurrentBadge] = useState(null)

  useEffect(() => {
    async function checkLevelUp() {
      if (!xpBefore && !xpAfter) return
      if (xpBefore === xpAfter)  return
      const before = await getLevelFromXP(xpBefore)
      const after  = await getLevelFromXP(xpAfter)
      if (after.level > before.level) setLevelUpData(after)
    }
    checkLevelUp()
  }, [xpBefore, xpAfter])

  useEffect(() => {
    if (badgeQueue.length > 0 && !currentBadge) {
      setCurrentBadge(badgeQueue[0])
      setBadgeQueue(q => q.slice(1))
    }
  }, [badgeQueue, currentBadge])

  return (
    <div className={`exercise-result ${isIndeterminate ? 'indeterminate' : isSuccess ? 'correct' : 'incorrect'}`}>

      {xpEarned > 0 && (
        <XpGainAnimation
          xp={xpEarned}
          visible={showXpAnim}
          onComplete={() => setShowXpAnim(false)}
        />
      )}

      <div className="exercise-result-icon">
        {isIndeterminate ? '📝' : isSuccess ? '✅' : '❌'}
      </div>
      <div className="exercise-result-body">
        {!isIndeterminate && (
          <div className="exercise-result-score">
            {Math.round((score ?? 0) * 100)}%
          </div>
        )}
        {feedback && (
          <div className="exercise-result-feedback">
            <MathText text={feedback} />
          </div>
        )}

        {points_reussis?.length > 0 && (
          <div className="result-points-reussis">
            <strong>✅ Ce que tu as bien fait :</strong>
            <ul>{points_reussis.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
        )}
        {a_ameliorer?.length > 0 && (
          <div className="result-ameliorer">
            <strong>💡 Pour progresser :</strong>
            <ul>{a_ameliorer.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
        )}
        {flag === 'inappropriate' && (
          <div className="result-inappropriate">
            ⚠️ Rappel : écris des réponses respectueuses.
          </div>
        )}

        {xpEarned !== null && (
          <div className="exercise-result-xp">+{xpEarned} XP</div>
        )}
      </div>

      {onReset && !isSuccess && !isIndeterminate && (
        <button className="exercise-result-retry" onClick={onReset}>
          Réessayer
        </button>
      )}

      {levelUpData && (
        <LevelUpCelebration
          levelData={levelUpData}
          onClose={() => setLevelUpData(null)}
        />
      )}

      <BadgeUnlock
        badge={currentBadge}
        visible={!!currentBadge}
        onClose={() => setCurrentBadge(null)}
      />
    </div>
  )
}
