import { useNavigate, useLocation } from 'react-router-dom'
import homeIconUrl    from '@images/home.svg'
import bookIconUrl    from '@images/book.svg'
import profileIconUrl from '@images/profile.svg'
import { ROUTES } from '../../router/AppRouter'

export default function NavHeader() {
  const navigate = useNavigate()
  const location = useLocation()

  const active = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <header className="nav-header">
      <button
        onClick={() => navigate(ROUTES.MENU)}
        className={`nav-btn ${active(ROUTES.MENU) ? 'nav-btn-active' : ''}`}
        title="Accueil"
      >
        <img src={homeIconUrl} alt="Accueil" className="nav-icon" />
      </button>

      <button
        onClick={() => navigate(ROUTES.SUBJECTS)}
        className={`nav-btn ${active('/subjects') || active('/courses') || active('/steps') || active('/player') ? 'nav-btn-active' : ''}`}
        title="Matières"
      >
        <img src={bookIconUrl} alt="Matières" className="nav-icon" />
      </button>

      <button
        onClick={() => navigate(ROUTES.PROFILE)}
        className={`nav-btn ${active(ROUTES.PROFILE) ? 'nav-btn-active' : ''}`}
        title="Mon profil"
      >
        <img src={profileIconUrl} alt="Profil" className="nav-icon" />
      </button>
    </header>
  )
}
