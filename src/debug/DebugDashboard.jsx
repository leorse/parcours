import { useState } from 'react'
import ContentTree    from './panels/ContentTree'
import ExerciseBrowser from './panels/ExerciseBrowser'
import ExercisePreview from './panels/ExercisePreview'
import YamlInspector  from './panels/YamlInspector'
import EngineState    from './panels/EngineState'
import AnswerInjector from './panels/AnswerInjector'
import { useDebugExercise } from './hooks/useDebugExercise'

const TABS = ['YAML', 'État', 'Réponses']

export default function DebugDashboard() {
  const [activeTab, setActiveTab] = useState('État')
  const debug = useDebugExercise()

  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.header}>
        <span style={s.logo}>🐛 Debug Console — Parc-Cours</span>
        <span style={s.env}>DEV · {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Layout 3 colonnes */}
      <div style={s.body}>

        {/* Colonne gauche — arbre */}
        <div style={s.sidebar}>
          <ContentTree
            onSelect={debug.loadExercise}
            selectedId={debug.exerciseData?.id}
          />
        </div>

        {/* Colonne centre — exercice */}
        <div style={s.main}>
          <ExerciseBrowser debug={debug} />
          <ExercisePreview debug={debug} />
        </div>

        {/* Colonne droite — inspecteurs */}
        <div style={s.inspector}>
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
          {activeTab === 'YAML'     && <YamlInspector data={debug.exerciseData} />}
          {activeTab === 'État'     && <EngineState state={debug.lastResult} />}
          {activeTab === 'Réponses' && <AnswerInjector debug={debug} />}
        </div>

      </div>
    </div>
  )
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={tabS.bar}>
      {tabs.map((tab) => (
        <button
          key={tab}
          style={{ ...tabS.tab, ...(active === tab ? tabS.active : {}) }}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

const s = {
  container: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', background: '#0d1117', color: '#c9d1d9',
    fontFamily: 'monospace', fontSize: '13px', overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 16px', background: '#161b22',
    borderBottom: '1px solid #30363d', flexShrink: 0,
  },
  logo:  { color: '#00ff88', fontWeight: 'bold', fontSize: '14px' },
  env:   { color: '#8b949e', fontSize: '11px' },
  body:  { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar:   { width: '230px', borderRight: '1px solid #30363d', overflow: 'auto', padding: '4px 8px', flexShrink: 0 },
  main:      { flex: 1, overflow: 'auto', padding: '12px 16px', background: '#f6f8fa' },
  inspector: { width: '310px', borderLeft: '1px solid #30363d', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 },
}

const tabS = {
  bar:    { display: 'flex', borderBottom: '1px solid #30363d', flexShrink: 0 },
  tab:    { flex: 1, padding: '7px 4px', background: 'transparent', borderTop: 'none', borderRight: 'none', borderLeft: 'none', borderBottom: '2px solid transparent', color: '#8b949e', cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px' },
  active: { color: '#00ff88', borderBottomColor: '#00ff88' },
}
