import { useState, useMemo } from 'react'
import MathText from '../shared/MathText'

export default function MatchingExercise({ exercise, onSubmit, result }) {
  const [matches, setMatches] = useState({})   // { leftId: rightId }
  const [selectedLeft, setSelectedLeft] = useState(null)
  const isSubmitted = result !== null

  const rightItems = useMemo(() => {
    const list = exercise.pairs.map((p) => p.right)
    if (exercise.settings?.shuffle_right !== false) list.sort(() => Math.random() - 0.5)
    return list
  }, [exercise])

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleLeftClick = (leftId) => {
    if (isSubmitted) return
    if (matches[leftId]) return              // déjà matché → non cliquable
    if (selectedLeft === leftId) {
      setSelectedLeft(null)                  // désélectionner
    } else {
      setSelectedLeft(leftId)               // sélectionner
    }
  }

  const handleRightClick = (rightId) => {
    if (isSubmitted) return

    const matchedLeftId = Object.entries(matches).find(([, rId]) => rId === rightId)?.[0]

    if (matchedLeftId) {
      // Clic sur un élément déjà matché → libérer la paire
      setMatches((prev) => {
        const next = { ...prev }
        delete next[matchedLeftId]
        return next
      })
      if (selectedLeft === matchedLeftId) setSelectedLeft(null)
      return
    }

    // Clic sur un élément libre → matcher avec le gauche sélectionné
    if (!selectedLeft) return
    setMatches((prev) => ({ ...prev, [selectedLeft]: rightId }))
    setSelectedLeft(null)
  }

  // ─── Classes ────────────────────────────────────────────────────────────────

  const getLeftClass = (leftId) => {
    if (isSubmitted) {
      const pair = exercise.pairs.find((p) => p.left.id === leftId)
      return matches[leftId] === pair?.right.id ? 'correct' : 'incorrect'
    }
    if (selectedLeft === leftId) return 'active'
    if (matches[leftId])         return 'matched'
    if (selectedLeft !== null)   return 'dimmed'   // une sélection est en cours → non cliquable
    return 'available'
  }

  const getRightClass = (rightId) => {
    if (isSubmitted) {
      const pair       = exercise.pairs.find((p) => p.right.id === rightId)
      const leftId     = Object.entries(matches).find(([, rId]) => rId === rightId)?.[0]
      if (!leftId) return 'unmatched'
      return leftId === pair?.left.id ? 'correct' : 'incorrect'
    }
    const isMatched = Object.values(matches).includes(rightId)
    if (isMatched)              return 'matched'
    if (selectedLeft !== null)  return 'available'   // une sélection active → cliquable
    return 'inactive'
  }

  const getMatchedRightText = (leftId) => {
    const rightId = matches[leftId]
    return rightItems.find((r) => r.id === rightId)?.text ?? null
  }

  const allMatched = exercise.pairs.every((p) => matches[p.left.id])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="exercise-matching">
      {exercise.instruction && (
        <div className="exercise-instruction"><MathText text={exercise.instruction} /></div>
      )}

      {!isSubmitted && !selectedLeft && (
        <p className="matching-hint">Clique sur un élément à gauche pour commencer.</p>
      )}
      {!isSubmitted && selectedLeft && (
        <p className="matching-hint matching-hint-active">Sélectionne la correspondance à droite.</p>
      )}

      <div className="matching-grid">
        {/* Colonne gauche */}
        <div className="matching-left">
          {exercise.pairs.map((pair) => {
            const cls = getLeftClass(pair.left.id)
            const matchedText = getMatchedRightText(pair.left.id)
            return (
              <button
                key={pair.left.id}
                className={`matching-item matching-item-left ${cls}`}
                onClick={() => handleLeftClick(pair.left.id)}
                disabled={isSubmitted || cls === 'dimmed' || cls === 'matched'}
              >
                <MathText text={pair.left.text} inline />
                {matchedText && !isSubmitted && (
                  <span className="matching-matched-label">
                    → <MathText text={matchedText} inline />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Colonne droite */}
        <div className="matching-right">
          {rightItems.map((right) => {
            const cls = getRightClass(right.id)
            return (
              <button
                key={right.id}
                className={`matching-item matching-item-right ${cls}`}
                onClick={() => handleRightClick(right.id)}
                disabled={isSubmitted || cls === 'inactive'}
              >
                <MathText text={right.text} inline />
                {cls === 'matched' && !isSubmitted && (
                  <span className="matching-cancel-hint">✕</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {!isSubmitted && (
        <button
          className="exercise-btn-validate"
          disabled={!allMatched}
          onClick={() => onSubmit(matches)}
        >
          Vérifier
        </button>
      )}
    </div>
  )
}
