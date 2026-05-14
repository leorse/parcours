const BACKEND = import.meta.env.VITE_BACKEND_URL

export async function fetchStreak(uid, token) {
  try {
    const res = await fetch(`${BACKEND}/api/streak/${uid}?token=${token}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function getStreakStatus(streak) {
  if (!streak) return { current: 0, longest: 0, active: false }
  return {
    current: streak.current_streak ?? 0,
    longest: streak.longest_streak ?? 0,
    active:  (streak.current_streak ?? 0) > 0,
  }
}
