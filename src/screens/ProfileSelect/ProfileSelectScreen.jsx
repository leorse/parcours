import { useNavigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import { ROUTES } from '../../router/AppRouter'
import { FAKE_USERS } from '../../data/fakeUsers'
import { resetProgress } from '../../services/progressService'
import PageTransition from '../../components/layout/PageTransition'
import logoImg from '@images/logo.png'

export default function ProfileSelectScreen() {
  const navigate = useNavigate()
  const { login } = useProfile()

  const handleSelect = (userKey) => {
    login(userKey)
    navigate(ROUTES.SUBJECTS)
  }

  const handleReset = () => {
    const uid = FAKE_USERS.student.uid
    resetProgress(uid)
    window.location.reload()
  }

  return (
    <PageTransition className="flex flex-col items-center justify-between py-12 px-6 min-h-screen bg-app-gradient">

      <div className="flex flex-col items-center gap-3 pt-4">
        <div className="bg-white rounded-2xl shadow-xl px-6 py-4 inline-block">
          <img src={logoImg} alt="Parc-Cours" className="w-14 h-14 object-contain mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-white mt-2">Qui utilise l&apos;application ?</h2>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs my-8">
        <button
          className="profile-card profile-card-student"
          onClick={() => handleSelect('student')}
        >
          <span className="profile-icon text-3xl">👦</span>
          <div className="profile-info">
            <span className="profile-name">{FAKE_USERS.student.pseudo}</span>
            <span className="profile-desc">Élève — progression normale</span>
          </div>
        </button>

        <button
          className="profile-card profile-card-admin"
          onClick={() => handleSelect('admin')}
        >
          <span className="profile-icon text-3xl">🔧</span>
          <div className="profile-info">
            <span className="profile-name">{FAKE_USERS.admin.pseudo}</span>
            <span className="profile-desc">Tous les cours déverrouillés</span>
          </div>
        </button>
      </div>

      <button className="reset-link" onClick={handleReset}>
        Réinitialiser la progression
      </button>

    </PageTransition>
  )
}
