import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageTransition from '../../components/layout/PageTransition'
import Button from '../../components/ui/Button'
import LoadingView from '../../components/ui/LoadingView'
import LessonRenderer from '../../components/lesson/LessonRenderer'
import { getStepsFlat, getStepContent } from '../../services/contentService'
import { buildRoute } from '../../router/AppRouter'
import { useAppContext } from '../../context/AppContext'
import { theme } from '../../styles/theme'

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
  const nextLecon    = lecons[currentIndex + 1]

  const handleNext = () => {
    if (nextLecon) {
      navigate(buildRoute.player(subjectId, courseId, nextLecon.id))
    } else {
      navigate(buildRoute.steps(subjectId, courseId))
    }
  }

  return (
    <PageTransition className="flex flex-col bg-app-gradient min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-8 pb-4 flex-shrink-0">
        <button
          onClick={() => navigate(buildRoute.steps(subjectId, courseId))}
          className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="text-white w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-brand-5/60 text-sm font-body">
            Leçon {currentIndex + 1} / {lecons.length}
          </p>
          <h1 className="text-base font-display font-bold text-white leading-tight truncate">
            {currentLecon?.title ?? step.id}
          </h1>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full h-1.5 bg-white/10 flex-shrink-0">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${lecons.length > 0 ? ((currentIndex + 1) / lecons.length) * 100 : 0}%`,
            backgroundColor: subjectColor,
          }}
        />
      </div>

      {/* Contenu de la leçon */}
      <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl mt-4">
        <LessonRenderer blocks={step.content ?? []} />
      </div>

      {/* Navigation */}
      <div className="flex gap-3 px-6 py-5 bg-white flex-shrink-0">
        <Button
          variant="ghost"
          size="lg"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={() => navigate(buildRoute.steps(subjectId, courseId))}
        >
          <ChevronLeft className="w-5 h-5" />
          Retour
        </Button>

        <Button
          variant="primary"
          size="lg"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleNext}
        >
          {nextLecon ? 'Suivant' : 'Terminer'}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </PageTransition>
  )
}
