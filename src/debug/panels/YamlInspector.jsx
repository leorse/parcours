import yaml from 'js-yaml'

export default function YamlInspector({ data }) {
  if (!data) return <Empty text="Aucun exercice sélectionné" />

  const yamlString = yaml.dump(data, { indent: 2, lineWidth: 80 })

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <PanelHeader title="YAML SOURCE" />
      <pre style={s.pre}>
        {yamlString.split('\n').map((line, i) => (
          <div key={i} style={{ color: lineColor(line) }}>{line || ' '}</div>
        ))}
      </pre>
    </div>
  )
}

function lineColor(line) {
  if (/^\s*#/.test(line)) return '#8b949e'
  if (/^\s*[\w-]+:/.test(line)) return '#79c0ff'
  if (/:\s+['"]/.test(line)) return '#a5d6ff'
  if (/:\s+\d/.test(line)) return '#f0883e'
  if (/:\s+(true|false|null)/.test(line)) return '#ff7b72'
  return '#a5d6ff'
}

function Empty({ text }) {
  return <div style={s.empty}>{text}</div>
}

function PanelHeader({ title }) {
  return <div style={s.header}>{title}</div>
}

const s = {
  pre:    { margin: 0, padding: '8px 12px', fontSize: '11px', lineHeight: '1.55', overflow: 'auto', fontFamily: 'monospace', flex: 1 },
  empty:  { padding: '16px', color: '#8b949e', fontSize: '12px', fontStyle: 'italic' },
  header: { padding: '8px 12px', fontSize: '10px', color: '#8b949e', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #30363d', flexShrink: 0 },
}
