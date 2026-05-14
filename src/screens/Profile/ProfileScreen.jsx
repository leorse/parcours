import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import {
  fetchUserXP, getLevelFromXP, getNextLevel, getProgressInLevel
} from '../../services/xpService'
import { fetchUserSkills, getWeakSkills, getStrongSkills } from '../../services/skillService'
import { getBadgesDef } from '../../services/badgeService'
import { getFirebaseToken } from '../../services/profileService'
import XpBar from '../../components/gamification/XpBar'
import StreakDisplay from '../../components/gamification/StreakDisplay'
import SkillRadarChart from '../../components/gamification/RadarChart'
import BadgeGrid from '../../components/gamification/BadgeGrid'
import PageTransition from '../../components/layout/PageTransition'
import { ROUTES } from '../../router/AppRouter'

function LoadingView() {
  return (
    <div className="profile-loading">
      <span>⏳</span>
      <p>Chargement du profil…</p>
    </div>
  )
}

export default function ProfileScreen() {
  const navigate = useNavigate()
  const { uid, pseudo, avatar } = useProfile()
  const [loading,   setLoading]   = useState(true)
  const [xpData,    setXpData]    = useState(null)
  const [levelData, setLevelData] = useState(null)
  const [nextLevel, setNextLevel] = useState(null)
  const [progress,  setProgress]  = useState(0)
  const [skills,    setSkills]    = useState([])
  const [badges,    setBadges]    = useState([])
  const [streak,    setStreak]    = useState(null)

  const BACKEND = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    async function load() {
      try {
        const token = await getFirebaseToken()

        const [xp, skillsRes, badgesRes, streakRes, allBadgesDef] = await Promise.all([
          fetch(`${BACKEND}/api/xp/${uid}?token=${token}`).then(r => r.ok ? r.json() : { total_xp: 0 }),
          fetch(`${BACKEND}/api/skills/${uid}?token=${token}`).then(r => r.ok ? r.json() : { skills: [] }),
          fetch(`${BACKEND}/api/badges/${uid}?token=${token}`).then(r => r.ok ? r.json() : { badges: [] }),
          fetch(`${BACKEND}/api/streak/${uid}?token=${token}`).then(r => r.ok ? r.json() : null),
          getBadgesDef(),
        ])

        const totalXP = xp.total_xp ?? 0
        setXpData(xp)
        setLevelData(await getLevelFromXP(totalXP))
        setNextLevel(await getNextLevel(totalXP))
        setProgress(await getProgressInLevel(totalXP))
        setSkills(skillsRes.skills ?? [])
        setStreak(streakRes)

        const earned = badgesRes.badges?.map(b => b.badge_id) ?? []
        setBadges(allBadgesDef.map(b => ({ ...b, earned: earned.includes(b.id) })))
      } catch (e) {
        console.error('Erreur chargement profil :', e)
      } finally {
        setLoading(false)
      }
    }
    if (uid) load()
    else setLoading(false)
  }, [uid]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingView />

  const weak   = getWeakSkills(skills)
  const strong = getStrongSkills(skills)

  return (
    <PageTransition>
      <div className="profile-screen" style={{ paddingTop: 52 }}>

        <div className="profile-header">
          {avatar && (
            <img
              src={`/assets/avatars/${avatar}.webp`}
              alt={pseudo ?? 'avatar'}
              className="profile-avatar-lg"
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
          <h2 className="profile-pseudo">{pseudo}</h2>
          {streak && (
            <StreakDisplay
              currentStreak={streak.current_streak}
              longestStreak={streak.longest_streak}
            />
          )}
        </div>

        {levelData && (
          <section className="profile-section">
            <h3>Niveau {levelData.level} — {levelData.label}</h3>
            <XpBar
              totalXP={xpData?.total_xp ?? 0}
              levelData={levelData}
              nextLevelData={nextLevel}
              progress={progress}
            />
          </section>
        )}

        {skills.length > 0 && (
          <section className="profile-section">
            <h3>Mes compétences</h3>
            <SkillRadarChart skills={skills} />
            {strong.length > 0 && (
              <div className="skills-strong">
                <strong>Points forts :</strong>
                <div className="skill-tags">
                  {strong.slice(0, 3).map(s => (
                    <span key={s.skill_tag} className="skill-tag skill-tag-strong">
                      {s.skill_tag.split('/').pop()} {Math.round(s.score * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {weak.length > 0 && (
          <section className="profile-section">
            <h3>À travailler</h3>
            {weak.slice(0, 3).map(s => (
              <div key={s.skill_tag} className="weak-skill">
                ⚠️ {s.skill_tag.split('/').pop()} — {Math.round(s.score * 100)}%
              </div>
            ))}
          </section>
        )}

        <section className="profile-section">
          <h3>Badges ({badges.filter(b => b.earned).length} / {badges.length})</h3>
          <BadgeGrid badges={badges} />
        </section>

        <button className="profile-back-btn" onClick={() => navigate(ROUTES.MENU)}>
          ← Retour au menu
        </button>

      </div>
    </PageTransition>
  )
}
