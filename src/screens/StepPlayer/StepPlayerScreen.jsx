import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams }               from 'react-router-dom'
import PageTransition                           from '../../components/layout/PageTransition'
import PlayerFooter                             from '../../components/layout/PlayerFooter'
import LoadingView                              from '../../components/ui/LoadingView'
import Button                                   from '../../components/ui/Button'
import LessonRenderer                           from '../../components/lesson/LessonRenderer'
import DialoguePlayer                           from '../../components/personnages/DialoguePlayer'
import MonologuePlayer                          from '../../components/personnages/MonologuePlayer'
import { getStepsFlat, getStepContent }         from '../../services/contentService'
import { resolveDialogueRef }                   from '../../services/dialogueService'
import { buildRoute }                           from '../../router/AppRouter'
import { useAppContext }                        from '../../context/AppContext'
import { useEventEngine }                       from '../../hooks/useEventEngine'
import { theme }                                from '../../styles/theme'

const NAV_H = 52

export default function StepPlayerScreen() {
  const navigate = useNavigate()
  const { subjectId, courseId, stepId } = useParams()
  const { currentSubject }              = useAppContext()
  const { trigger }                     = useEventEngine()

  const [step,      setStep]      = useState(null)
  const [lecons,    setLecons]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [pageIndex, setPageIndex] = useState(0)

  const sessionStartRef = useRef(Date.now())

  useEffect(() => {
    sessionStartRef.current = Date.now()
    setPageIndex(0)
    Promise.all([
      getStepContent(courseId, subjectId, stepId),
      getStepsFlat(courseId, subjectId),
    ])
      .then(([content, flat]) => { setStep(content); setLecons(flat) })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [courseId, subjectId, stepId])

  // Hooks avant tout return conditionnel (Rules of Hooks)
  const isNarrative = step?.type === 'dialogue' || step?.type === 'monologue'

  const pages = useMemo(() => {
    if (isNarrative || !step?.content) return []
    const result = []
    let current = []
    for (const block of step.content) {
      if (block.type === 'break') {
        if (current.length) result.push(current)
        current = []
      } else {
        current.push(block)
      }
    }
    if (current.length) result.push(current)
    return result.length ? result : [[]]
  }, [step, isNarrative])

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
  const stepsRoute   = buildRoute.steps(subjectId, courseId)

  const currentPage = pages[pageIndex] ?? []
  const isLastPage  = pageIndex === pages.length - 1

  const sessionMinutes = () => Math.round((Date.now() - sessionStartRef.current) / 60000)

  const completeStep = () => {
    trigger('step_complete', {
      step_id:                stepId,
      sessionDurationMinutes: sessionMinutes(),
      session_minutes:        sessionMinutes(),
    })
    const nextLecon = currentLecon?.on_exit === 'next' ? lecons[currentIndex + 1] : null
    if (nextLecon) {
      navigate(buildRoute.player(subjectId, courseId, nextLecon.id))
    } else {
      navigate(stepsRoute)
    }
  }

  const handleBack     = () => navigate(stepsRoute)
  const handlePrevious = () => setPageIndex(i => i - 1)
  const handleNext     = () => {
    if (isLastPage) completeStep()
    else setPageIndex(i => i + 1)
  }

  const progressPct = pages.length > 0
    ? ((pageIndex + 1) / pages.length) * 100
    : 100

  const pageLabel = pages.length > 1
    ? `Page ${pageIndex + 1} / ${pages.length}`
    : `Leçon ${currentIndex + 1} / ${lecons.length}`

  return (
    <div className="flex flex-col bg-app-gradient" style={{ height: '100vh', paddingTop: NAV_H }}>

      {/* En-tête */}
      <div className="flex-shrink-0 px-5 py-3">
        <p className="text-brand-5/60 text-xs font-body">{pageLabel}</p>
        <h1 className="text-sm font-display font-bold text-white leading-tight truncate">
          {currentLecon?.title ?? step.id}
        </h1>
      </div>

      {/* Barre de progression */}
      <div className="w-full h-1 bg-white/10 flex-shrink-0">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progressPct}%`, backgroundColor: subjectColor }}
        />
      </div>

      {/* Contenu */}
      <div className={`flex-1 mt-2 ${isNarrative ? 'overflow-hidden' : 'overflow-y-auto bg-white rounded-t-3xl'}`}>
        {isNarrative ? (
          step.type === 'dialogue'
            ? <DialoguePlayer  dialogueRef={resolveDialogueRef(step.content_ref)} onComplete={completeStep} embedded />
            : <MonologuePlayer dialogueRef={resolveDialogueRef(step.content_ref)} onComplete={completeStep} embedded />
        ) : (
          <LessonRenderer blocks={currentPage} />
        )}
      </div>

      {/* Footer */}
      <PlayerFooter
        onBack={handleBack}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={!isNarrative && pageIndex > 0}
        hasNext={!isNarrative}
      />

    </div>
  )
}
