export default function Badge({ children, color = '#4F46E5', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${className}`}
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  )
}
