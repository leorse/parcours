import { motion, AnimatePresence } from 'framer-motion'

export default function XpGainAnimation({ xp, visible, onComplete }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="xp-gain"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -60 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          onAnimationComplete={onComplete}
        >
          +{xp} XP ⭐
        </motion.div>
      )}
    </AnimatePresence>
  )
}
