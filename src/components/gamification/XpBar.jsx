import { motion } from 'framer-motion'

export default function XpBar({ totalXP, levelData, nextLevelData, progress }) {
  return (
    <div className="xp-bar-container">
      <div className="xp-bar-labels">
        <span>{levelData.icon} {levelData.label}</span>
        <span>{totalXP} XP</span>
      </div>
      <div className="xp-bar-track">
        <motion.div
          className="xp-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${(progress ?? 0) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {nextLevelData && (
        <div className="xp-bar-next">
          Prochain niveau : {nextLevelData.xp_required} XP
        </div>
      )}
    </div>
  )
}
