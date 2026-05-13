import MdBlock from './MdBlock'
import MathText from '../../exercise/shared/MathText'

const STYLES = {
  info:       { bg: '#e8f4fd', border: '#3498db', icon: 'ℹ️',  label: 'Info' },
  warning:    { bg: '#fef3cd', border: '#f39c12', icon: '⚠️',  label: 'Attention' },
  danger:     { bg: '#fde8e8', border: '#e74c3c', icon: '🚫',  label: 'Erreur fréquente' },
  tip:        { bg: '#e8f8f0', border: '#27ae60', icon: '💡',  label: 'Astuce' },
  example:    { bg: '#f3e8fd', border: '#9b59b6', icon: '📝',  label: 'Exemple' },
  definition: { bg: '#f8f8f8', border: '#7f8c8d', icon: '📖',  label: null },
  quote:      { bg: 'transparent', border: '#bdc3c7', icon: null, label: null },
}

export default function NoticeBlock({ style = 'info', text, title, author }) {
  const s = STYLES[style] ?? STYLES.info

  return (
    <div
      className={`notice-block notice-${style}`}
      style={{ background: s.bg, borderLeft: `4px solid ${s.border}` }}
    >
      {s.icon && <span className="notice-icon">{s.icon}</span>}
      {(s.label || title) && (
        <strong className="notice-label">
          <MathText text={title ?? s.label} inline />
        </strong>
      )}
      <MdBlock text={text} />
      {author && <cite className="notice-author">— {author}</cite>}
    </div>
  )
}
