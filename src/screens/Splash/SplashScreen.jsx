import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import logoImg from '@images/logo.png'
import parcoursImg from '@images/parcours.png'
import PageTransition from '../../components/layout/PageTransition'
import { ROUTES } from '../../router/AppRouter'
import { useProfile } from '../../hooks/useProfile'
import { checkStreak } from '../../services/progressService'

export default function SplashScreen() {
  const navigate = useNavigate()
  const { user } = useProfile()

  useEffect(() => {
    // checkStreak une fois par jour — fire and forget
    if (user?.uid) {
      checkStreak()
    }
  }, [user?.uid])

  useEffect(() => {
    const dest = user ? ROUTES.SUBJECTS : ROUTES.PROFILE_SELECT
    const timer = setTimeout(() => navigate(dest), 2800)
    return () => clearTimeout(timer)
  }, [navigate, user])

  return (
    <PageTransition className="flex items-center justify-center bg-app-gradient">
      <div className="text-center px-6">
        {/* Card blanche avec le logo et le titre */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="bg-white rounded-3xl shadow-2xl px-10 py-8 inline-block mb-8"
        >
          <img
            src={logoImg}
            alt="Logo Parcours"
            className="w-24 h-24 object-contain mx-auto mb-4"
          />
          <img
            src={parcoursImg}
            alt="Parcours"
            className="h-9 object-contain mx-auto"
          />
        </motion.div>

        {/* Sous-titre */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-brand-5 font-body text-base mb-10"
        >
          Apprends à ton rythme
        </motion.p>

        {/* Points de chargement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="flex justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-brand-2"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      </div>
    </PageTransition>
  )
}
