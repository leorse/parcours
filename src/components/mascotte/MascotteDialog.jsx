// src/components/mascotte/MascotteDialog.jsx
// Point d'entrée unique pour tous les événements mascotte.
// Monté une seule fois dans AppRouter — toujours présent, affiche la queue.

import { useEffect }               from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEventContext }         from '../../context/EventContext'
import { useAudio }                from '../../hooks/useAudio'
import MascotteAvatar              from './MascotteAvatar'
import MascotteMessage             from './MascotteMessage'
import CelebrationOverlay          from './CelebrationOverlay'
import MonologuePlayer             from '../personnages/MonologuePlayer'
import DialoguePlayer              from '../personnages/DialoguePlayer'

export default function MascotteDialog() {
  const { currentEvent, dismissCurrent } = useEventContext()
  const { playSound } = useAudio()

  useEffect(() => {
    if (currentEvent?.sound) playSound(currentEvent.sound)
  }, [currentEvent?.sound]) // eslint-disable-line react-hooks/exhaustive-deps

  // Les événements "reinforcement" sont auto-dismissés (placeholder jalon 7)
  useEffect(() => {
    if (currentEvent?.type === 'reinforcement') {
      const t = setTimeout(dismissCurrent, 100)
      return () => clearTimeout(t)
    }
  }, [currentEvent, dismissCurrent])

  if (!currentEvent) return null

  switch (currentEvent.type) {

    case 'celebration':
      return (
        <CelebrationOverlay
          animation={currentEvent.animation}
          onComplete={dismissCurrent}
        />
      )

    case 'dialog':
      return (
        <AnimatePresence>
          <motion.div
            className="mascotte-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={e => { if (e.target === e.currentTarget) dismissCurrent() }}
          >
            <motion.div
              className="mascotte-dialog"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            >
              <MascotteAvatar animation={currentEvent.animation} />
              <MascotteMessage
                messages={currentEvent.messages ?? []}
                buttons={currentEvent.buttons}
                onComplete={dismissCurrent}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )

    case 'monologue':
      return (
        <MonologuePlayer
          dialogueRef={currentEvent.dialogueRef}
          onComplete={dismissCurrent}
        />
      )

    case 'dialogue':
      return (
        <DialoguePlayer
          dialogueRef={currentEvent.dialogueRef}
          onComplete={dismissCurrent}
        />
      )

    default:
      return null
  }
}
