// src/components/mascotte/MascotteMessage.jsx
// Messages paginés avec indicateur de progression et boutons custom.

import { useState }    from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES }      from '../../router/AppRouter'

export default function MascotteMessage({ messages = [], buttons, onComplete }) {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()
  const isLast   = index === messages.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setIndex(i => i + 1)
    }
  }

  const handleButton = (action) => {
    onComplete()
    if (action === 'go_to_menu') navigate(ROUTES.MENU)
    // "dismiss" → onComplete suffit
  }

  return (
    <div className="mascotte-message">
      <p className="mascotte-text">{messages[index]}</p>

      {messages.length > 1 && (
        <div className="mascotte-dots">
          {messages.map((_, i) => (
            <span key={i} className={`mascotte-dot${i === index ? ' active' : ''}`} />
          ))}
        </div>
      )}

      {isLast && buttons ? (
        <div className="mascotte-buttons">
          {buttons.map(btn => (
            <button
              key={btn.action}
              className="btn-mascotte"
              onClick={() => handleButton(btn.action)}
            >
              {btn.label}
            </button>
          ))}
        </div>
      ) : (
        <button className="btn-mascotte-next" onClick={handleNext}>
          {isLast ? '👍 OK !' : 'Suivant →'}
        </button>
      )}
    </div>
  )
}
