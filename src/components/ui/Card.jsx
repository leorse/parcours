export default function Card({ children, className = '', onClick }) {
  const interactive = onClick
    ? 'cursor-pointer hover:bg-white/20 active:scale-[0.98] transition-all duration-200'
    : ''

  return (
    <div
      onClick={onClick}
      className={`bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 ${interactive} ${className}`}
    >
      {children}
    </div>
  )
}
