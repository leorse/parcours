export default function ReinforcementCard({ skill }) {
  if (!skill) return null

  return (
    <div className="reinforcement-card">
      <span className="reinforcement-icon">⚠️</span>
      <div className="reinforcement-info">
        <span className="reinforcement-skill">{skill.skill_tag.split('/').pop()}</span>
        <span className="reinforcement-score">{Math.round(skill.score * 100)}%</span>
      </div>
    </div>
  )
}
