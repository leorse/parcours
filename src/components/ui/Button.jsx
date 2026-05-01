export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
}) {
  const base =
    'font-display font-bold rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary:   'bg-brand-2 hover:bg-brand-2/80 text-brand-7 shadow-lg shadow-brand-2/30',
    secondary: 'bg-brand-3 hover:bg-brand-3/80 text-brand-7 shadow-lg shadow-brand-3/30',
    ghost:     'bg-white/10 hover:bg-white/20 text-white',
    danger:    'bg-brand-6 hover:bg-brand-6/80 text-white shadow-lg shadow-brand-6/30',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}
