import { useState, useEffect, useCallback } from 'react'
import yaml from 'js-yaml'
import { FAKE_USERS }          from '../../data/fakeUsers'
import { getAllProgress, getSessionStats, resetProgress } from '../../services/progressService'
import { getLevelFromXP_sync, getProgressInLevel_sync } from '../../services/xpService'

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeXP(progress) {
  const fromExos = Object.values(progress.__exercises ?? {})
    .reduce((sum, e) => sum + (e.xpEarned ?? 0), 0)
  return fromExos + (progress.__xp_override ?? 0)
}

function aggregateSkills(progress) {
  const map = {}
  for (const exo of Object.values(progress.__exercises ?? {})) {
    const score = exo.score ?? 0
    for (const s of (exo.skills ?? [])) {
      if (!map[s.tag]) map[s.tag] = { tag: s.tag, total: 0, attempts: 0 }
      map[s.tag].total += score
      map[s.tag].attempts++
    }
  }
  return Object.values(map)
    .map(s => ({ tag: s.tag, score: s.total / s.attempts, attempts: s.attempts }))
    .sort((a, b) => a.score - b.score)
}

function writeXPOverride(uid, overrideValue) {
  const key = `parcours_progress_${uid}`
  let progress = {}
  try { progress = JSON.parse(localStorage.getItem(key) ?? '{}') } catch {}
  progress.__xp_override = overrideValue
  localStorage.setItem(key, JSON.stringify(progress))
}

function statusColor(s) {
  return s === 'completed' ? '#3fb950' : s === 'in_progress' ? '#f5a623' : '#8b949e'
}
function statusIcon(s) {
  return s === 'completed' ? '✓' : s === 'in_progress' ? '▶' : '○'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ElevesPanel() {
  const students = Object.values(FAKE_USERS)
  const [selectedUid, setSelectedUid] = useState(students[0].uid)
  const [progress,    setProgress]    = useState({})
  const [session,     setSession]     = useState({})
  const [levels,      setLevels]      = useState([])
  const [xpInput,     setXpInput]     = useState('')

  useEffect(() => {
    fetch('/content/config/levels.yaml')
      .then(r => r.text())
      .then(text => setLevels(yaml.load(text).levels ?? []))
      .catch(() => {})
  }, [])

  const reload = useCallback((uid) => {
    setProgress(getAllProgress(uid))
    setSession(getSessionStats(uid))
  }, [])

  useEffect(() => { reload(selectedUid) }, [selectedUid, reload])

  const student = students.find(u => u.uid === selectedUid)
  const totalXP  = computeXP(progress)
  const level    = levels.length ? getLevelFromXP_sync(totalXP, levels)           : null
  const levelPct = levels.length ? getProgressInLevel_sync(totalXP, levels) * 100 : 0
  const nextLevel = levels.find(l => l.xp_required > totalXP)

  const steps      = Object.entries(progress).filter(([k]) => !k.startsWith('__'))
  const completed  = steps.filter(([, v]) => v.status === 'completed').length
  const inProgress = steps.filter(([, v]) => v.status === 'in_progress').length
  const exercises  = Object.entries(progress.__exercises ?? {})
    .sort((a, b) => new Date(b[1].submittedAt ?? 0) - new Date(a[1].submittedAt ?? 0))
  const skills     = aggregateSkills(progress)
  const weak       = skills.filter(s => s.score < 0.6)
  const strong     = skills.filter(s => s.score >= 0.75)
  const mid        = skills.filter(s => s.score >= 0.6 && s.score < 0.75)

  const handleAddXP = (delta) => {
    const fromExos = Object.values(progress.__exercises ?? {})
      .reduce((sum, e) => sum + (e.xpEarned ?? 0), 0)
    const newOverride = (progress.__xp_override ?? 0) + delta
    writeXPOverride(selectedUid, newOverride)
    reload(selectedUid)
  }

  const handleSetXP = () => {
    const val = parseInt(xpInput, 10)
    if (isNaN(val) || val < 0) return
    const fromExos = Object.values(progress.__exercises ?? {})
      .reduce((sum, e) => sum + (e.xpEarned ?? 0), 0)
    writeXPOverride(selectedUid, val - fromExos)
    setXpInput('')
    reload(selectedUid)
  }

  const handleSetLevel = (lvl) => {
    const target = levels.find(l => l.level === lvl)
    if (!target) return
    const fromExos = Object.values(progress.__exercises ?? {})
      .reduce((sum, e) => sum + (e.xpEarned ?? 0), 0)
    writeXPOverride(selectedUid, target.xp_required - fromExos)
    reload(selectedUid)
  }

  const handleReset = () => {
    if (!window.confirm(`Réinitialiser toute la progression de ${student?.pseudo} ?`)) return
    resetProgress(selectedUid)
    reload(selectedUid)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Sidebar élèves ── */}
      <div style={{ width: 170, borderRight: '1px solid #30363d', overflowY: 'auto', flexShrink: 0 }}>
        <div style={sLabel}>Profils ({students.length})</div>
        {students.map(u => (
          <div
            key={u.uid}
            onClick={() => setSelectedUid(u.uid)}
            style={{
              padding: '8px 12px', cursor: 'pointer',
              background:   selectedUid === u.uid ? '#0d2027' : 'transparent',
              borderLeft:   selectedUid === u.uid ? '2px solid #00ff88' : '2px solid transparent',
              color:        selectedUid === u.uid ? '#c9d1d9' : '#8b949e',
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: 12 }}>{u.pseudo}</div>
            <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>{u.role} · {u.uid.slice(0, 14)}</div>
          </div>
        ))}
      </div>

      {/* ── Détail élève ── */}
      {student && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{student.role === 'admin' ? '🛡️' : '🎓'}</span>
            <div>
              <div style={{ color: '#c9d1d9', fontSize: 15, fontWeight: 'bold' }}>{student.pseudo}</div>
              <div style={{ color: '#8b949e', fontSize: 10 }}>{student.uid}</div>
            </div>
            <button onClick={() => reload(selectedUid)} style={{ ...btn, marginLeft: 'auto' }}>↻ Actualiser</button>
          </div>

          {/* Niveau & XP */}
          <Section title="Niveau & XP">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{level?.icon ?? '🌱'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#c9d1d9', fontWeight: 'bold' }}>
                  Niv. {level?.level ?? 1} — {level?.label ?? 'Explorateur'}
                </div>
                <div style={{ marginTop: 5, height: 6, background: '#30363d', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${levelPct}%`, background: '#00ff88', borderRadius: 3, transition: 'width .3s' }} />
                </div>
                <div style={{ color: '#8b949e', fontSize: 10, marginTop: 3 }}>
                  {totalXP} XP{nextLevel ? ` — ${nextLevel.xp_required - totalXP} XP jusqu'au niv. ${nextLevel.level}` : ' — Max !'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
              <button onClick={() => handleAddXP(50)}   style={btn}>+50 XP</button>
              <button onClick={() => handleAddXP(200)}  style={btn}>+200 XP</button>
              <button onClick={() => handleAddXP(-50)}  style={{ ...btn, color: '#f85149' }}>−50 XP</button>
              <input
                type="number" placeholder="XP exact" value={xpInput}
                onChange={e => setXpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetXP()}
                style={{ ...inp, width: 80 }}
              />
              <button onClick={handleSetXP} style={btn}>Définir</button>
            </div>

            {levels.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {levels.map(l => (
                  <button
                    key={l.level} onClick={() => handleSetLevel(l.level)}
                    style={{
                      ...btn, fontSize: 10,
                      background:   level?.level === l.level ? '#0d2027' : 'transparent',
                      borderColor:  level?.level === l.level ? '#00ff88' : '#30363d',
                      color:        level?.level === l.level ? '#00ff88' : '#8b949e',
                    }}
                    title={`${l.xp_required} XP requis`}
                  >
                    {l.icon} {l.level}
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* Stats */}
          <Section title="Statistiques">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <StatBox label="Étapes ok"   value={completed}              color="#00ff88" />
              <StatBox label="En cours"    value={inProgress}             color="#f5a623" />
              <StatBox label="Exercices"   value={exercises.length}       color="#58a6ff" />
              <StatBox label="Sessions"    value={session.sessionCount ?? 0}   color="#8b949e" />
              <StatBox label="Auj."        value={session.exercisesToday ?? 0} color="#8b949e" />
              <StatBox label="Dernière"    value={session.lastSessionDate ?? '—'} color="#8b949e" small />
            </div>
          </Section>

          {/* Compétences */}
          {skills.length > 0 && (
            <Section title={`Compétences (${skills.length})`}>
              {weak.length > 0 && (
                <>
                  <SubLabel color="#f85149">⚠ Faiblesses</SubLabel>
                  {weak.map(s => <SkillRow key={s.tag} skill={s} />)}
                </>
              )}
              {mid.length > 0 && (
                <>
                  <SubLabel color="#f5a623" mt={weak.length > 0}>En progression</SubLabel>
                  {mid.map(s => <SkillRow key={s.tag} skill={s} />)}
                </>
              )}
              {strong.length > 0 && (
                <>
                  <SubLabel color="#3fb950" mt={weak.length > 0 || mid.length > 0}>✓ Points forts</SubLabel>
                  {strong.map(s => <SkillRow key={s.tag} skill={s} />)}
                </>
              )}
            </Section>
          )}

          {/* Exercices récents */}
          {exercises.length > 0 && (
            <Section title={`Exercices récents (${exercises.length})`}>
              {exercises.slice(0, 12).map(([id, e]) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid #21262d', fontSize: 11 }}>
                  <span style={{ color: e.correct ? '#3fb950' : '#f85149', width: 14 }}>{e.correct ? '✓' : '✗'}</span>
                  <span style={{ flex: 1, color: '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{id}</span>
                  <span style={{ color: scoreColor(e.score), width: 32, textAlign: 'right' }}>{Math.round((e.score ?? 0) * 100)}%</span>
                  <span style={{ color: '#8b949e', width: 40, textAlign: 'right' }}>+{e.xpEarned ?? 0} xp</span>
                </div>
              ))}
            </Section>
          )}

          {/* Étapes */}
          {steps.length > 0 && (
            <Section title={`Étapes (${steps.length})`}>
              {steps.map(([id, s]) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 11 }}>
                  <span style={{ color: statusColor(s.status) }}>
                    {statusIcon(s.status)} <span style={{ color: '#8b949e' }}>{id}</span>
                  </span>
                  {s.score != null && (
                    <span style={{ color: scoreColor(s.score) }}>{Math.round(s.score * 100)}%</span>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Danger zone */}
          <Section title="Actions">
            <button onClick={handleReset} style={{ ...btn, color: '#f85149', borderColor: '#f85149' }}>
              🗑 Réinitialiser toute la progression
            </button>
          </Section>

        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div>
      <div style={{ color: '#8b949e', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: 6, borderBottom: '1px solid #21262d', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function SubLabel({ children, color, mt }) {
  return (
    <div style={{ color, fontSize: 10, textTransform: 'uppercase', marginBottom: 4, marginTop: mt ? 8 : 0 }}>
      {children}
    </div>
  )
}

function StatBox({ label, value, color, small }) {
  return (
    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 4, padding: '8px 10px' }}>
      <div style={{ color, fontSize: small ? 11 : 17, fontWeight: 'bold' }}>{value}</div>
      <div style={{ color: '#8b949e', fontSize: 10, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function SkillRow({ skill }) {
  const pct   = Math.round(skill.score * 100)
  const color = scoreColor(skill.score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 11 }}>
      <span style={{ color: '#8b949e', width: 20, textAlign: 'right', flexShrink: 0 }}>{skill.attempts}×</span>
      <span style={{ flex: 1, color: '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.tag}</span>
      <div style={{ width: 60, height: 4, background: '#30363d', borderRadius: 2, flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ color, width: 32, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
    </div>
  )
}

function scoreColor(score) {
  const p = (score ?? 0) * 100
  return p >= 75 ? '#3fb950' : p >= 50 ? '#f5a623' : '#f85149'
}

const sLabel = {
  padding: '8px 12px 6px', color: '#8b949e',
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px',
}

const btn = {
  background: 'transparent', border: '1px solid #30363d', borderRadius: 4,
  color: '#c9d1d9', cursor: 'pointer', fontSize: 11,
  fontFamily: 'monospace', padding: '4px 10px',
}

const inp = {
  background: '#161b22', border: '1px solid #30363d', borderRadius: 4,
  color: '#c9d1d9', fontSize: 11, fontFamily: 'monospace',
  padding: '4px 8px', outline: 'none',
}
