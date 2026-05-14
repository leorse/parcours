import { motion } from 'framer-motion'

export default function LevelUpCelebration({ levelData, onClose }) {
  return (
    <motion.div
      className="levelup-overlay"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
    >
      <div className="levelup-content">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 0.6 }}
          className="levelup-icon"
        >
          {levelData.icon}
        </motion.div>
        <h2>Niveau supérieur !</h2>
        <p>Tu es maintenant <strong>{levelData.label}</strong></p>
        <button onClick={onClose}>Super !</button>
      </div>
    </motion.div>
  )
}
