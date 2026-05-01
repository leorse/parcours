export default function ProgressBar({ value = 0, color = '#4F46E5', className = '' }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div className={`h-2 bg-white/20 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}
