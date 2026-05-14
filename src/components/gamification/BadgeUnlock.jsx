import { motion, AnimatePresence } from 'framer-motion'

export default function BadgeUnlock({ badge, visible, onClose }) {
  return (
    <AnimatePresence>
      {visible && badge && (
        <motion.div
          className="badge-unlock-overlay"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
        >
          <div className="badge-unlock-card">
            <p className="badge-unlock-title">Badge débloqué !</p>
            <div className="badge-icon-large">{badge.icon}</div>
            <h3>{badge.label}</h3>
            <p>{badge.description}</p>
            <button onClick={onClose}>OK</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
