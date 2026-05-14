export default function BadgeGrid({ badges }) {
  if (!badges?.length) return null

  return (
    <div className="badge-grid">
      {badges.map(badge => (
        <div
          key={badge.id}
          className={`badge-item ${badge.earned ? 'earned' : 'locked'}`}
          title={badge.description}
        >
          <span className="badge-item-icon">{badge.earned ? badge.icon : '🔒'}</span>
          <span className="badge-item-label">{badge.label}</span>
        </div>
      ))}
    </div>
  )
}
