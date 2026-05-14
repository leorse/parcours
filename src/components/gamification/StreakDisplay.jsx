export default function StreakDisplay({ currentStreak, longestStreak }) {
  if (!currentStreak) return null

  return (
    <div className="streak-display">
      <span className="streak-flame">🔥</span>
      <span className="streak-count">{currentStreak}</span>
      <span className="streak-label">
        {currentStreak === 1 ? 'jour' : 'jours'}
      </span>
    </div>
  )
}
