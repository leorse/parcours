import { useState, useEffect, useRef } from 'react'
import { motion }                      from 'framer-motion'
import { loadDialogue }                from '../../services/dialogueService'
import { useAudio }                    from '../../hooks/useAudio'
import SpriteEmotion                   from './SpriteEmotion'
import MdBlock                         from '../lesson/blocks/MdBlock'

export default function DialoguePlayer({ dialogueRef, onComplete, embedded = false }) {
  const [dialogue,     setDialogue]     = useState(null)
  const [repIndex,     setRepIndex]     = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [lastEmotions, setLastEmotions] = useState({})
  const bottomRef    = useRef(null)
  const { playSound } = useAudio()

  useEffect(() => {
    loadDialogue(dialogueRef)
      .then(d => { setDialogue(d); setLoading(false) })
      .catch(() => { setLoading(false); onComplete() })
  }, [dialogueRef]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (dialogue?.sound) playSound(dialogue.sound)
  }, [dialogue]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll vers le dernier message à chaque avancée
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [repIndex])

  if (loading || !dialogue) return null

  const repliques   = dialogue.repliques ?? []
  const personnages = dialogue.personnages ?? []
  const current     = repliques[repIndex]
  const isLast      = repIndex === repliques.length - 1

  const leftName  = personnages[0] ?? ''
  const rightName = personnages[1] ?? ''
  const speaker   = current?.personnage ?? leftName

  const goNext = () => {
    if (!isLast) {
      setLastEmotions(prev => ({ ...prev, [speaker]: current?.emotion ?? 'serieux' }))
    }
    if (isLast) onComplete()
    else setRepIndex(i => i + 1)
  }

  const getEmotion = (name) => {
    if (name === speaker) return current?.emotion ?? 'serieux'
    return lastEmotions[name] ?? 'serieux'
  }

  const shownRepliques = repliques.slice(0, repIndex + 1)

  return (
    <div className={`dialogue-overlay${embedded ? ' embedded' : ''}`}>

      {/* Historique SMS scrollable */}
      <div className="dialogue-messages">
        {shownRepliques.map((rep, i) => {
          const isLeft    = rep.personnage === leftName
          const isCurrent = i === repIndex
          return (
            <motion.div
              key={i}
              className={`dialogue-msg${isLeft ? ' left' : ' right'}${isCurrent ? ' current' : ' past'}`}
              initial={isCurrent ? { opacity: 0, y: 14, scale: 0.96 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22 }}
            >
              <MdBlock text={rep.text} />
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Personnages fixes en bas */}
      <div className="dialogue-stage">
        <div className={`dialogue-character left${speaker === leftName ? ' active' : ' inactive'}`}>
          <SpriteEmotion name={leftName} emotion={getEmotion(leftName)} size={100} />
          <span className="character-name">{leftName}</span>
        </div>
        <div className={`dialogue-character right${speaker === rightName ? ' active' : ' inactive'}`}>
          <SpriteEmotion name={rightName} emotion={getEmotion(rightName)} size={100} />
          <span className="character-name">{rightName}</span>
        </div>
      </div>

      {/* Contrôles */}
      <div className="dialogue-controls">
        <div className="dialogue-dots">
          {repliques.map((_, i) => (
            <span key={i} className={`dot${i === repIndex ? ' active' : ''}`} />
          ))}
        </div>
        <button className="btn-dialogue-next" onClick={goNext}>
          {isLast ? 'Allons-y ! 🚀' : '▶'}
        </button>
      </div>

    </div>
  )
}
