import ExerciseEngine from '../../components/exercise/ExerciseEngine'
import { generateCorrectAnswer } from '../utils/answerGenerator'

export default function ExercisePreview({ debug }) {
  const { exerciseData, showAnswers, injectedAnswer, engineKey, loading, reset } = debug

  if (loading)       return <Placeholder text="Chargement…" />
  if (!exerciseData) return <Placeholder text="← Sélectionne un exercice dans l'arbre" />

  return (
    <div>
      {/* Barre de contrôle */}
      <div style={s.toolbar}>
        <label style={s.toggle}>
          <input
            type="checkbox"
            checked={showAnswers}
            onChange={(e) => debug.setShowAnswers(e.target.checked)}
          />
          &nbsp;Afficher les réponses
        </label>
        <button style={s.btnGood} onClick={debug.injectCorrectAnswer}>
          ✅ Bonne réponse
        </button>
        <button style={s.btnBad} onClick={debug.injectWrongAnswer}>
          ❌ Mauvaise réponse
        </button>
        <button style={s.btnReset} onClick={reset}>
          ↺ Reset
        </button>
      </div>

      {/* Overlay réponses correctes */}
      {showAnswers && (
        <div style={s.overlay}>
          <span style={s.overlayLabel}>🔑 Réponses attendues</span>
          <pre style={s.overlayPre}>
            {JSON.stringify(generateCorrectAnswer(exerciseData.exercise), null, 2)}
          </pre>
        </div>
      )}

      {/* L'exercice réel dans un cadre blanc */}
      <div style={s.appFrame}>
        <ExerciseEngine
          key={engineKey}
          exercise={exerciseData}
          injectedAnswer={injectedAnswer}
          debugMode
          onDebugResult={debug.recordDebugResult}
        />
      </div>
    </div>
  )
}

function Placeholder({ text }) {
  return (
    <div style={{ padding: '32px', color: '#8b949e', textAlign: 'center', fontStyle: 'italic' }}>
      {text}
    </div>
  )
}

const s = {
  toolbar: {
    display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
    padding: '8px 0', marginBottom: '8px',
    borderBottom: '1px solid #dee2e6',
  },
  toggle:   { fontSize: '12px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#555', userSelect: 'none' },
  btnGood:  { padding: '4px 10px', background: '#f0f9e8', border: '1px solid #85bb4b', color: '#316735', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace' },
  btnBad:   { padding: '4px 10px', background: '#fff3f1', border: '1px solid #ec6d5c', color: '#c0392b', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace' },
  btnReset: { padding: '4px 10px', background: '#f8f9fa', border: '1px solid #dee2e6', color: '#555', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace', marginLeft: 'auto' },
  overlay: {
    background: '#fffbea', border: '1px solid #e3b341', borderRadius: '6px',
    padding: '8px 12px', marginBottom: '8px',
  },
  overlayLabel: { fontSize: '12px', fontWeight: 'bold', color: '#856404' },
  overlayPre:   { margin: '4px 0 0', fontSize: '11px', color: '#555', fontFamily: 'monospace' },
  appFrame: {
    background: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '8px',
    minHeight: '200px',
  },
}
