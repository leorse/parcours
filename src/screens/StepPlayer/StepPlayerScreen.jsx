import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams }      from 'react-router-dom'
import PageTransition                  from '../../components/layout/PageTransition'
import PlayerFooter                    from '../../components/layout/PlayerFooter'
import LoadingView                     from '../../components/ui/LoadingView'
import Button                          from '../../components/ui/Button'
import LessonRenderer                  from '../../components/lesson/LessonRenderer'
import DialoguePlayer                  from '../../components/personnages/DialoguePlayer'
import MonologuePlayer                 from '../../components/personnages/MonologuePlayer'
import { getStepsFlat, getStepContent } from '../../services/contentService'
import { resolveDialogueRef }          from '../../services/dialogueService'
import { buildRoute }                  from '../../router/AppRouter'
import { useAppContext }               from '../../context/AppContext'
import { useEventEngine }              from '../../hooks/useEventEngine'
import { theme }                       from '../../styles/theme'

const NAV_H = 52

export default function StepPlayerScreen() {
  const navigate = useNavigate()
  const { subjectId, courseId, stepId } = useParams()
  const { currentSubject }              = useAppContext()
  const { trigger }                     = useEventEngine()

  const [step, setStep]       = useState(null)
  const [lecons, setLecons]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const sessionStartRef = useRef(Date.now())

  useEffect(() => {
    sessionStartRef.current = Date.now()
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

  const sessionMinutes = () =>
    Math.round((Date.now() - sessionStartRef.current) / 60000)

  const handlePrevious = () => navigate(buildRoute.player(subjectId, courseId, prevLecon.id))
  const handleBack     = () => navigate(stepsRoute)

  const handleNext = () => {
    trigger('step_complete', {
      step_id:                stepId,
      sessionDurationMinutes: sessionMinutes(),
      session_minutes:        sessionMinutes(),
    })
    if (nextLecon) navigate(buildRoute.player(subjectId, courseId, nextLecon.id))
    else navigate(stepsRoute)
  }

  const isNarrative = step.type === 'dialogue' || step.type === 'monologue'

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

      {/* Contenu */}
      <div className={`flex-1 mt-2 ${isNarrative ? 'overflow-hidden' : 'overflow-y-auto bg-white rounded-t-3xl'}`}>
        {isNarrative ? (
          step.type === 'dialogue'
            ? <DialoguePlayer dialogueRef={resolveDialogueRef(step.content_ref)} onComplete={handleNext} embedded />
            : <MonologuePlayer dialogueRef={resolveDialogueRef(step.content_ref)} onComplete={handleNext} embedded />
        ) : (
          <LessonRenderer blocks={step.content ?? []} />
        )}
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
