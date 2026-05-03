import { useNavigate, useLocation } from 'react-router-dom'

export default function DebugFAB() {
  if (!import.meta.env.DEV) return null

  const navigate  = useNavigate()
  const location  = useLocation()
  const isOnDebug = location.pathname === '/debug'

  return (
    <button
      onClick={() => navigate(isOnDebug ? -1 : '/debug')}
      title="Debug console"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        background: '#1a1a2e',
        color: '#00ff88',
        border: '1px solid #00ff88',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        fontSize: '20px',
        cursor: 'pointer',
        fontFamily: 'monospace',
        boxShadow: '0 0 12px rgba(0,255,136,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      {isOnDebug ? '✕' : '🐛'}
    </button>
  )
}
