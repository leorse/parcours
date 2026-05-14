import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageTransition from '../../components/layout/PageTransition'
import PlayerFooter from '../../components/layout/PlayerFooter'
import LoadingView from '../../components/ui/LoadingView'
import Button from '../../components/ui/Button'
import LessonRenderer from '../../components/lesson/LessonRenderer'
import { getStepsFlat, getStepContent } from '../../services/contentService'
import { buildRoute } from '../../router/AppRouter'
import { useAppContext } from '../../context/AppContext'
import { theme } from '../../styles/theme'

const NAV_H = 52  // NavHeader height

export default function StepPlayerScreen() {
  const navigate = useNavigate()
  const { subjectId, courseId, stepId } = useParams()
  const { currentSubject }              = useAppContext()

  const [step, setStep]       = useState(null)
  const [lecons, setLecons]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    Promise.all([
      getStepContent(courseId, subjectId, stepId),
      getStepsFlat(courseId, subjectId),
    ])
      .then(([content, flat]) => {
        setStep(content)
        setLecons(flat)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [courseId, subjectId, stepId])

  if (loading) return <LoadingView />

  if (error || !step) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-app-gradient gap-4 px-6">
        <p className="text-brand-6 font-display font-bold text-lg">Étape introuvable</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Retour</Button>
      </div>
    )
  }

  const subjectColor = theme.colors.subjects[currentSubject?.id] ?? theme.colors.brand[2]
  const currentIndex = lecons.findIndex((l) => l.id === stepId)
  const currentLecon = lecons[currentIndex]
  const prevLecon    = lecons[currentIndex - 1]
  const nextLecon    = lecons[currentIndex + 1]

  const stepsRoute = buildRoute.steps(subjectId, courseId)

  const handlePrevious = () => navigate(buildRoute.player(subjectId, courseId, prevLecon.id))
  const handleNext     = () => navigate(buildRoute.player(subjectId, courseId, nextLecon.id))
  const handleBack     = () => navigate(stepsRoute)

  return (
    <div
      className="flex flex-col bg-app-gradient"
      style={{ height: '100vh', paddingTop: NAV_H }}
    >
      {/* Info leçon */}
      <div className="flex-shrink-0 px-5 py-3">
        <p className="text-brand-5/60 text-xs font-body">
          Leçon {currentIndex + 1} / {lecons.length}
        </p>
        <h1 className="text-sm font-display font-bold text-white leading-tight truncate">
          {currentLecon?.title ?? step.id}
        </h1>
      </div>

      {/* Barre de progression */}
      <div className="w-full h-1 bg-white/10 flex-shrink-0">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${lecons.length > 0 ? ((currentIndex + 1) / lecons.length) * 100 : 0}%`,
            backgroundColor: subjectColor,
          }}
        />
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl mt-2">
        <LessonRenderer blocks={step.content ?? []} />
      </div>

      {/* Footer navigation */}
      <PlayerFooter
        onBack={handleBack}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={currentIndex > 0}
        hasNext={!!nextLecon}
      />
    </div>
  )
}
