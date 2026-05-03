import { generateCorrectAnswer, generateWrongAnswer } from '../utils/answerGenerator'

export default function AnswerInjector({ debug }) {
  const { exerciseData, injectedAnswer } = debug

  if (!exerciseData) return <Empty text="Aucun exercice sélectionné" />

  const correctAnswer = generateCorrectAnswer(exerciseData.exercise)
  const wrongAnswer   = generateWrongAnswer(exerciseData.exercise)

  return (
    <div style={{ overflow: 'auto', flex: 1 }}>
      <PanelHeader title="INJECTEUR DE RÉPONSES" />
      <div style={s.body}>
        <div style={s.label}>BONNE RÉPONSE</div>
        <pre style={s.pre}>{JSON.stringify(correctAnswer, null, 2)}</pre>
        <button style={s.btnGood} onClick={debug.injectCorrectAnswer}>
          ✅ Injecter
        </button>

        <Divider />

        <div style={s.label}>MAUVAISE RÉPONSE</div>
        <pre style={s.pre}>{JSON.stringify(wrongAnswer, null, 2)}</pre>
        <button style={s.btnBad} onClick={debug.injectWrongAnswer}>
          ❌ Injecter
        </button>

        {injectedAnswer !== null && (
          <>
            <Divider />
            <div style={s.label}>RÉPONSE INJECTÉE</div>
            <pre style={{ ...s.pre, borderColor: '#e3b341', color: '#e3b341' }}>
              {JSON.stringify(injectedAnswer, null, 2)}
            </pre>
          </>
        )}
      </div>
    </div>
  )
}

function PanelHeader({ title }) {
  return <div style={s.header}>{title}</div>
}

function Empty({ text }) {
  return <div style={s.empty}>{text}</div>
}

function Divider() {
  return <div style={{ borderTop: '1px solid #21262d', margin: '10px 0' }} />
}

const s = {
  header:  { padding: '8px 12px', fontSize: '10px', color: '#8b949e', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #30363d' },
  body:    { padding: '12px' },
  label:   { color: '#8b949e', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' },
  pre:     { margin: '0 0 8px', background: '#161b22', padding: '8px', borderRadius: '4px', fontSize: '11px', color: '#a5d6ff', overflow: 'auto', maxHeight: '120px', border: '1px solid #30363d' },
  btnGood: { width: '100%', padding: '5px', background: 'transparent', border: '1px solid #3fb950', color: '#3fb950', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace' },
  btnBad:  { width: '100%', padding: '5px', background: 'transparent', border: '1px solid #f85149', color: '#f85149', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace' },
  empty:   { padding: '16px', color: '#8b949e', fontSize: '12px', fontStyle: 'italic' },
}
