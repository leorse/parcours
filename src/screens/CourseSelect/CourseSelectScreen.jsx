import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Lock, CheckCircle, Play } from 'lucide-react'
import PageTransition from '../../components/layout/PageTransition'
import LoadingView from '../../components/ui/LoadingView'
import Card from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import Badge from '../../components/ui/Badge'
import { getCourses, getSubjects } from '../../services/contentService'
import { ROUTES, buildRoute } from '../../router/AppRouter'
import { useAppContext } from '../../context/AppContext'
import { useEventEngine } from '../../hooks/useEventEngine'
import { theme } from '../../styles/theme'

export default function CourseSelectScreen() {
  const navigate = useNavigate()
  const { subjectId } = useParams()
  const { setCurrentCourse } = useAppContext()
  const { trigger }          = useEventEngine()

  const [subject, setSubject]   = useState(null)
  const [courses, setCourses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [skills,  setSkills]    = useState([])

  useEffect(() => {
    Promise.all([
      getSubjects().then((subs) => subs.find((s) => s.id === subjectId)),
      getCourses(subjectId),
    ])
      .then(([sub, crs]) => {
        setSubject(sub)
        setCourses(crs)
      })
      .finally(() => setLoading(false))
  }, [subjectId])

  if (loading) return <LoadingView />

  const subjectColor   = theme.colors.subjects[subjectId] ?? theme.colors.brand[2]
  const completedCount = courses.filter((c) => c.status === 'completed').length

  const handleSelect = (course) => {
    if (course.status === 'locked') return
    setCurrentCourse(course)
    const weakSkill = skills.find(s => (s.score ?? 1) < 0.4 && (s.attempts ?? 0) >= 5)
    trigger('course_enter', {
      skills,
      weak_skill_tag:   weakSkill?.skill_tag             ?? '',
      weak_skill_label: weakSkill?.skill_tag?.split('/').pop() ?? '',
    }, [
      `subjects/${subjectId}/events.yaml`,
      `subjects/${subjectId}/courses/${course.id}/events.yaml`,
    ])
    navigate(buildRoute.steps(subjectId, course.id))
  }

  const badgeLabel = { completed: 'Terminé', locked: 'Verrouillé' }
  const badgeColor = {
    available: theme.colors.brand[2],
    completed: theme.colors.status.completed,
    locked:    theme.colors.status.locked,
  }

  return (
    <PageTransition className="px-6 pb-8 pt-[60px] bg-app-gradient">
      <div className="mb-6">
        <p className="text-sm font-body font-bold" style={{ color: subjectColor }}>
          {subject?.label}
        </p>
        <h1 className="text-xl font-display font-bold text-white">Choisir un cours</h1>
      </div>

      {/* Progression globale */}
      <div className="mb-7">
        <div className="flex justify-between items-center mb-2">
          <span className="text-brand-5/70 text-sm font-body">Progression</span>
          <span className="text-white text-sm font-bold">
            {completedCount} / {courses.length} cours
          </span>
        </div>
        <ProgressBar
          value={courses.length > 0 ? completedCount / courses.length : 0}
          color={subjectColor}
        />
      </div>

      {/* Liste des cours */}
      <div className="space-y-4">
        {courses.map((course) => (
          <Card
            key={course.id}
            onClick={() => handleSelect(course)}
            className={`p-4 ${course.status === 'locked' ? 'opacity-55' : ''}`}
          >
            <div className="flex gap-4">
              <div
                className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${subjectColor}18` }}
              >
                {course.status === 'locked' && (
                  <Lock className="w-8 h-8" style={{ color: theme.colors.status.locked }} />
                )}
                {course.status === 'completed' && (
                  <CheckCircle className="w-8 h-8" style={{ color: theme.colors.status.completed }} />
                )}
                {course.status === 'available' && (
                  <Play className="w-8 h-8" style={{ color: subjectColor }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-white font-display font-bold text-base leading-tight">
                    {course.title}
                  </h2>
                  {badgeLabel[course.status] && (
                    <Badge color={badgeColor[course.status]} className="flex-shrink-0 mt-0.5">
                      {badgeLabel[course.status]}
                    </Badge>
                  )}
                </div>

                <p className="text-brand-5/70 text-sm font-body mb-3 truncate">
                  {course.description}
                </p>

                <div className="flex items-center gap-3">
                  <ProgressBar value={course.progress ?? 0} color={subjectColor} className="flex-1" />
                  <span className="text-brand-5/70 text-xs flex-shrink-0">
                    {Math.round((course.progress ?? 0) * 100)} %
                  </span>
                </div>

                <p className="text-brand-5/50 text-xs mt-1 font-body">
                  {course.stepsCount} étapes
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <p className="text-center text-brand-5/60 py-12 font-body">
          Aucun cours disponible pour cette matière.
        </p>
      )}
    </PageTransition>
  )
}
