export default function LoadingView({ message = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app-gradient gap-4">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-brand-2 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-brand-5/60 text-sm font-body">{message}</p>
    </div>
  )
}
