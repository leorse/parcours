// Jalon 4  : profil fake stocké dans localStorage
// Jalon 7  : remplacé par Firebase Auth — l'interface publique NE CHANGE PAS

import { FAKE_USERS } from '../data/fakeUsers'

const STORAGE_KEY = 'parcours_current_user'

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCurrentUser(userKey) {
  const user = FAKE_USERS[userKey]
  if (!user) throw new Error(`Profil inconnu : ${userKey}`)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEY)
}

export function isAdmin(user) {
  return user?.role === 'admin'
}

// ═══════════════════════════════════════════════════
// JALON 7 — Pour brancher Firebase Auth :
//   return await firebaseAuth.currentUser.getIdToken()
// L'interface publique reste identique.
// ═══════════════════════════════════════════════════
export async function getFirebaseToken() {
  return 'fake-token-' + getCurrentUser()?.uid
}
