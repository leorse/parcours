import { useNavigate } from 'react-router-dom'
import { Volume2, VolumeX, Play, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import logoImg from '@images/logo.png'
import gribouilleImg from '@images/gribouille_saute.webp'
import PageTransition from '../../components/layout/PageTransition'
import Button from '../../components/ui/Button'
import { useAppContext } from '../../context/AppContext'
import { useProfile } from '../../hooks/useProfile'
import { ROUTES } from '../../router/AppRouter'

export default function MainMenuScreen() {
  const navigate = useNavigate()
  const { musicEnabled, setMusicEnabled } = useAppContext()
  const { pseudo, isAdmin, logout } = useProfile()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.PROFILE_SELECT, { replace: true })
  }

  return (
    <PageTransition className="relative flex flex-col items-center justify-between pb-12 pt-[60px] px-6 bg-app-gradient">
      {/* Son + déconnexion — sous le NavHeader */}
      <div className="absolute top-[56px] right-6 flex gap-2">
        <button
          onClick={() => setMusicEnabled(!musicEnabled)}
          className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
        >
          {musicEnabled
            ? <Volume2 className="text-white w-5 h-5" />
            : <VolumeX className="text-brand-5/60 w-5 h-5" />
          }
        </button>
        <button
          onClick={handleLogout}
          className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
          title="Changer de profil"
        >
          <LogOut className="text-white w-5 h-5" />
        </button>
      </div>

      {/* Logo */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center pt-2"
      >
        <div className="bg-white rounded-2xl shadow-xl px-6 py-4 inline-block mb-3">
          <img
            src={logoImg}
            alt="Logo Parcours"
            className="w-14 h-14 object-contain mx-auto"
          />
        </div>
        <p className="text-brand-5 font-body text-sm">
          {pseudo ? `Bonjour, ${pseudo}${isAdmin ? ' 🔧' : ''} !` : 'Ton aventure d\'apprentissage'}
        </p>
      </motion.div>

      {/* Mascotte — Gribouille */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="relative">
          <img
            src={gribouilleImg}
            alt="Gribouille"
            className="h-52 object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Boutons */}
      <div className="w-full max-w-xs space-y-3">
        <Button
          variant="primary"
          size="xl"
          className="w-full flex items-center justify-center gap-3"
          onClick={() => navigate(ROUTES.SUBJECTS)}
        >
          <Play className="w-5 h-5 fill-brand-7" />
          Jouer
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="w-full flex items-center justify-center gap-3"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Changer de profil
        </Button>
      </div>
    </PageTransition>
  )
}
