export default function ExerciseBrowser({ debug }) {
  const { exerciseData, selectedSubject, selectedCourse } = debug

  if (!exerciseData) return null

  const ex = exerciseData.exercise
  const diffStars = '★'.repeat(exerciseData.difficulty ?? 1) + '☆'.repeat(3 - (exerciseData.difficulty ?? 1))

  return (
    <div style={s.bar}>
      <div style={s.breadcrumb}>
        <span style={s.crumb}>{selectedSubject}</span>
        <span style={s.sep}>›</span>
        <span style={s.crumb}>{selectedCourse}</span>
        <span style={s.sep}>›</span>
        <span style={{ ...s.crumb, color: '#f0883e' }}>{ex?.type}</span>
      </div>
      <div style={s.meta}>
        <Tag label={exerciseData.id} color="#58a6ff" />
        <Tag label={diffStars} color="#e3b341" />
        <Tag label={`${exerciseData.xp ?? 0} XP`} color="#3fb950" />
        {exerciseData.skills?.map((sk) => (
          <Tag key={sk.tag} label={sk.tag} color="#8b949e" />
        ))}
      </div>
    </div>
  )
}

function Tag({ label, color }) {
  return (
    <span style={{ ...tagS, color, borderColor: color + '44', background: color + '11' }}>
      {label}
    </span>
  )
}

const tagS = {
  fontSize: '11px', padding: '1px 6px', borderRadius: '10px',
  border: '1px solid', fontFamily: 'monospace',
}

const s = {
  bar:        { background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' },
  crumb:      { fontSize: '11px', color: '#8b949e', fontFamily: 'monospace' },
  sep:        { color: '#484f58', fontSize: '11px' },
  meta:       { display: 'flex', flexWrap: 'wrap', gap: '4px' },
}
