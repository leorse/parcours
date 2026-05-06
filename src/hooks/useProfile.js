// Jalon 4  : profil fake depuis localStorage
// Jalon 7  : Firebase Auth — l'interface NE CHANGE PAS

import { useState, useEffect, useCallback } from 'react'
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  isAdmin,
} from '../services/profileService'

export function useProfile() {
  // Initialisation synchrone depuis localStorage pour éviter le flash au montage
  const [user, setUser]       = useState(() => getCurrentUser())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // ═══════════════════════════════════════════════════
    // JALON 7 — S'abonner aux changements Firebase Auth :
    //   const unsub = firebaseAuth.onAuthStateChanged(fbUser => {
    //     setUser(fbUser ? mapFirebaseUser(fbUser) : null)
    //     setLoading(false)
    //   })
    //   return unsub
    // ═══════════════════════════════════════════════════
  }, [])

  const login = useCallback((userKey) => {
    // Jalon 7 : userKey sera remplacé par le flow Firebase
    const u = setCurrentUser(userKey)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    clearCurrentUser()
    setUser(null)
    // Jalon 7 : await firebaseAuth.signOut()
  }, [])

  return {
    user,
    loading,
    isLoggedIn: !!user,
    isAdmin:    isAdmin(user),
    login,
    logout,
    uid:    user?.uid    ?? null,
    pseudo: user?.pseudo ?? null,
    avatar: user?.avatar ?? null,
    role:   user?.role   ?? 'student',
  }
}
