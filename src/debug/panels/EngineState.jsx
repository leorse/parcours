export default function EngineState({ state }) {
  if (!state) return <Empty text="Lance une validation pour voir l'état du moteur." />

  const { validation, score, userAnswer, xpMax, timestamp } = state
  const scorePercent = Math.round((score.score ?? 0) * 100)
  const isCorrect = validation.correct

  return (
    <div style={{ overflow: 'auto', flex: 1 }}>
      <PanelHeader title="ÉTAT MOTEUR" />
      <div style={s.body}>
        <Row label="Heure"    value={timestamp instanceof Date ? timestamp.toLocaleTimeString() : '–'} />
        <Row label="Correct"  value={isCorrect === null ? '📝 N/A' : isCorrect ? '✅ OUI' : '❌ NON'} color={isCorrect === null ? '#8b949e' : isCorrect ? '#3fb950' : '#f85149'} />
        <Row label="Score"    value={`${scorePercent}%`} color={scorePercent >= 50 ? '#3fb950' : '#f85149'} />
        <Row label="XP gagné" value={`${score.xpEarned} / ${xpMax ?? '?'}`} color="#e3b341" />
        {validation.details?.feedback && (
          <>
            <Divider />
            <div style={s.label}>FEEDBACK</div>
            <div style={s.feedback}>{validation.details.feedback}</div>
          </>
        )}
        <Divider />
        <div style={s.label}>RÉPONSE SOUMISE</div>
        <pre style={s.pre}>{JSON.stringify(userAnswer, null, 2)}</pre>
        <Divider />
        <div style={{ ...s.label, color: '#484f58' }}>Skills → disponible au jalon 5</div>
      </div>
    </div>
  )
}

function Row({ label, value, color }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={{ ...s.rowValue, color: color ?? '#c9d1d9' }}>{value}</span>
    </div>
  )
}

function Divider() {
  return <div style={s.divider} />
}

function PanelHeader({ title }) {
  return <div style={s.header}>{title}</div>
}

function Empty({ text }) {
  return <div style={s.empty}>{text}</div>
}

const s = {
  header:   { padding: '8px 12px', fontSize: '10px', color: '#8b949e', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #30363d' },
  body:     { padding: '12px' },
  row:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' },
  rowLabel: { color: '#8b949e', fontSize: '11px' },
  rowValue: { fontSize: '12px', fontWeight: 'bold' },
  divider:  { borderTop: '1px solid #21262d', margin: '8px 0' },
  label:    { color: '#8b949e', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' },
  feedback: { color: '#c9d1d9', fontSize: '11px', background: '#161b22', padding: '6px 8px', borderRadius: '4px', marginBottom: '4px' },
  pre:      { margin: 0, background: '#161b22', padding: '8px', borderRadius: '4px', fontSize: '11px', color: '#a5d6ff', overflow: 'auto', maxHeight: '180px' },
  empty:    { padding: '16px', color: '#8b949e', fontSize: '12px', fontStyle: 'italic' },
}
