import { useState, useRef, useLayoutEffect, useMemo } from 'react'
import katex from 'katex'
import MathText from '../shared/MathText'

function FormulaWithBlanks({ formula, blanks, answers, setAnswer, isSubmitted, getBlankClass }) {
  const containerRef = useRef(null)
  const [positions, setPositions] = useState({})

  const katexHtml = useMemo(() => {
    let f = formula.replace(/^\$|\$$/g, '')
    blanks.forEach((b) => {
      const ans = b.answer ?? '0'
      const phantom = ans.length < 2 ? ans.padEnd(2, '0') : ans
      f = f.replace(`[${b.id}]`, `{\\htmlClass{fitb-${b.id}}{\\phantom{${phantom}}}}`)
    })
    return katex.renderToString(f, { trust: true, throwOnError: false, output: 'html' })
  }, [formula, blanks])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const base = container.getBoundingClientRect()
    const newPos = {}
    blanks.forEach((b) => {
      const el = container.querySelector(`.fitb-${b.id}`)
      if (el) {
        const r = el.getBoundingClientRect()
        newPos[b.id] = {
          top: r.top - base.top,
          left: r.left - base.left,
          width: r.width,
          height: r.height,
        }
      }
    })
    setPositions(newPos)
  }, [katexHtml, blanks])

  return (
    <span ref={containerRef} className="formula-with-blanks">
      <span dangerouslySetInnerHTML={{ __html: katexHtml }} />
      {blanks.map((b) => {
        const pos = positions[b.id]
        if (!pos) return null
        const cls = getBlankClass(b.id)
        return (
          <span key={b.id}>
            <input
              type="text"
              className={`exercise-blank formula-blank ${cls}`}
              style={{
                position: 'absolute',
                top: pos.top,
                left: pos.left,
                width: pos.width,
                height: pos.height,
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
              value={answers[b.id] ?? ''}
              onChange={(e) => setAnswer(b.id, e.target.value)}
              disabled={isSubmitted}
            />
            {isSubmitted && cls === 'incorrect' && (
              <span
                className="exercise-blank-answer"
                style={{ position: 'absolute', top: pos.top + pos.height + 2, left: pos.left }}
              >
                {b.answer}
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

const spellcheckOff = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
  inputMode: 'text',
}

export default function FillInTheBlanksExercise({ exercise, onSubmit, result }) {
  const [answers, setAnswers] = useState({})
  const isSubmitted = result !== null

  const setAnswer = (blankId, value) =>
    setAnswers((prev) => ({ ...prev, [blankId]: value }))

  const allBlanks = exercise.segments.flatMap((s) =>
    s.blank ? [s.blank] : s.formula ? (s.blanks ?? []) : []
  )
  const allFilled = allBlanks.every((b) => answers[b.id]?.trim())

  const getBlankClass = (blankId) => {
    if (!isSubmitted || !result?.details) return ''
    const fromBlank = exercise.segments.find((s) => s.blank?.id === blankId)?.blank
    const fromFormula = exercise.segments.flatMap((s) => s.blanks ?? []).find((b) => b.id === blankId)
    const expected = (fromBlank ?? fromFormula)?.answer ?? ''
    const given = (answers[blankId] ?? '').trim()
    const isCaseSensitive = exercise.settings?.case_sensitive ?? false
    const normalize = (v) => (isCaseSensitive ? v : v.toLowerCase())
    return normalize(given) === normalize(expected) ? 'correct' : 'incorrect'
  }

  return (
    <div className="exercise-fitb">
      {exercise.instruction && (
        <div className="exercise-instruction"><MathText text={exercise.instruction} /></div>
      )}
      <div className="exercise-segments">
        {exercise.segments.map((seg, i) => {
          if (seg.formula) {
            return (
              <div key={i} className="exercise-formula-segment">
                <FormulaWithBlanks
                  formula={seg.formula}
                  blanks={seg.blanks ?? []}
                  answers={answers}
                  setAnswer={setAnswer}
                  isSubmitted={isSubmitted}
                  getBlankClass={getBlankClass}
                />
              </div>
            )
          }
          if (seg.text) {
            return (
              <span key={i} className="exercise-segment-text">
                <MathText text={seg.text} inline />
              </span>
            )
          }
          if (seg.blank) {
            const blankClass = getBlankClass(seg.blank.id)
            return (
              <span key={i} className="exercise-blank-wrap">
                <input
                  type="text"
                  className={`exercise-blank ${blankClass}`}
                  value={answers[seg.blank.id] ?? ''}
                  onChange={(e) => setAnswer(seg.blank.id, e.target.value)}
                  disabled={isSubmitted}
                  style={{ width: `${Math.max((seg.blank.answer?.length ?? 4) * 14, 60)}px` }}
                  {...(exercise.disable_spellcheck ? spellcheckOff : {})}
                />
                {isSubmitted && blankClass === 'incorrect' && (
                  <span className="exercise-blank-answer">{seg.blank.answer}</span>
                )}
              </span>
            )
          }
          return null
        })}
      </div>
      {exercise.hint && !isSubmitted && (
        <p className="exercise-hint">💡 {exercise.hint}</p>
      )}
      {!isSubmitted && (
        <button
          className="exercise-btn-validate"
          disabled={!allFilled}
          onClick={() => onSubmit(answers)}
        >
          Vérifier
        </button>
      )}
    </div>
  )
}
