// src/components/personnages/MonologuePlayer.jsx
// Un personnage seul, image plein écran + texte Markdown paginé.
// L'image peut changer à chaque page.
// Clic sur le fond ou bouton "Suivant" pour avancer.

import { useState, useEffect }     from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadDialogue }            from '../../services/dialogueService'
import { useAudio }                from '../../hooks/useAudio'
import MdBlock                     from '../lesson/blocks/MdBlock'

export default function MonologuePlayer({ dialogueRef, onComplete, embedded = false }) {
  const [dialogue,  setDialogue]  = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [loading,   setLoading]   = useState(true)
  const { playSound } = useAudio()

  useEffect(() => {
    loadDialogue(dialogueRef)
      .then(d => { setDialogue(d); setLoading(false) })
      .catch(() => { setLoading(false); onComplete() })
  }, [dialogueRef]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (dialogue?.sound) playSound(dialogue.sound)
  }, [dialogue]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !dialogue) return null

  const pages   = dialogue.pages ?? []
  const current = pages[pageIndex]
  const isLast  = pageIndex === pages.length - 1

  const goNext = () => {
    if (isLast) onComplete()
    else setPageIndex(i => i + 1)
  }

  return (
    <div className={`monologue-overlay${embedded ? ' embedded' : ''}`} onClick={embedded ? undefined : goNext}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pageIndex}
          className="monologue-page"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          onClick={e => e.stopPropagation()}
        >
          {current.image && (
            <div className="monologue-image-container">
              <img
                src={`/assets/${current.image}`}
                alt="Personnage"
                className="monologue-image"
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>
          )}

          <div className="monologue-text-box">
            <MdBlock text={current.text} />

            <div className="monologue-footer">
              <div className="monologue-dots">
                {pages.map((_, i) => (
                  <span key={i} className={`dot${i === pageIndex ? ' active' : ''}`} />
                ))}
              </div>
              <button className="btn-monologue-next" onClick={goNext}>
                {isLast ? 'Commencer ! 🚀' : 'Suivant →'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
