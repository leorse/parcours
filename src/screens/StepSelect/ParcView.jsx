import { useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { buildRoute, ROUTES } from '../../router/AppRouter'
import ParcBackground from './components/ParcBackground'
import ParcPath from './components/ParcPath'
import ParcStream from './components/ParcStream'
import GrandeEtapeNode from './components/GrandeEtapeNode'
import LeconNode from './components/LeconNode'
import CourseFooter from '../../components/layout/CourseFooter'

// ─── Constantes de layout ────────────────────────────────────────────────────
const SVG_WIDTH          = 400
const CENTER_X           = 200
const GRANDE_ETAPE_HEIGHT = 140
const LECON_HEIGHT        = 90
const STREAM_HEIGHT       = 60
const PADDING_TOP         = 80
const PADDING_BOTTOM      = 100

/**
 * Calcule les positions Y de chaque élément du parc.
 * Le SVG est dessiné top→bottom, l'ordre 1 apparaît en haut (début du scroll).
 */
function computeLayout(grandeEtapes) {
  const items = []
  let currentY    = PADDING_TOP
  let leconCounter = 0

  const sorted = [...grandeEtapes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  for (let i = 0; i < sorted.length; i++) {
    const ge  = sorted[i]
    const geY = currentY + GRANDE_ETAPE_HEIGHT / 2

    items.push({ type: 'grande_etape', data: ge, y: geY })
    currentY += GRANDE_ETAPE_HEIGHT

    const sortedLessons = [...ge.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    for (let j = 0; j < sortedLessons.length; j++) {
      const leconY = currentY + LECON_HEIGHT / 2
      items.push({
        type:        'lecon',
        data:        sortedLessons[j],
        y:           leconY,
        parentColor: ge.color,
        leconIndex:  leconCounter++,
      })
      currentY += LECON_HEIGHT
    }

    // Ruisseau entre deux grandes étapes (pas après la dernière)
    if (i < sorted.length - 1) {
      items.push({ type: 'stream', y: currentY + STREAM_HEIGHT / 2 })
      currentY += STREAM_HEIGHT
    }
  }

  return { items, totalHeight: currentY + PADDING_BOTTOM }
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ParcView({ courseId, subjectId, course, grandeEtapes, currentSubject, setCurrentStep }) {
  const navigate     = useNavigate()
  const containerRef = useRef(null)

  const { items, totalHeight } = useMemo(
    () => computeLayout(grandeEtapes),
    [grandeEtapes]
  )

  const streamYs  = items.filter((i) => i.type === 'stream').map((i) => i.y)
  const backRoute = currentSubject ? buildRoute.courses(currentSubject.id) : null

  // Scroll initial centré sur l'étape en cours
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const inProgress = items.find(
      (item) => item.data?.status === 'in_progress'
    )
    if (!inProgress) return

    const scale     = container.clientWidth / SVG_WIDTH
    const pixelY    = inProgress.y * scale
    container.scrollTop = Math.max(0, pixelY - window.innerHeight * 0.45)
  }, [items])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLeconClick = (lecon) => {
    if (lecon.status === 'locked') return
    setCurrentStep(lecon)
    navigate(buildRoute.player(subjectId, courseId, lecon.id))
  }

  const handleGrandeEtapeClick = (ge) => {
    if (ge.status === 'locked') return
    const target =
      ge.lessons.find((l) => l.status === 'in_progress') ??
      ge.lessons.find((l) => l.status !== 'locked') ??
      ge.lessons[0]
    if (target) {
      setCurrentStep(target)
      navigate(buildRoute.player(subjectId, courseId, target.id))
    }
  }

  const NAV_H    = 52   // NavHeader height
  const FOOT_H   = 60  // CourseFooter height

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Espace réservé au NavHeader */}
      <div style={{ height: NAV_H, flexShrink: 0 }} />

      {/* ── Conteneur scroll ── */}
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {/* Titre flottant en overlay */}
        <div
          className="absolute top-0 left-0 right-0 z-10 px-4 pt-3 pb-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
        >
          <p className="text-white/70 text-xs font-body">{currentSubject?.label}</p>
          <h1 className="text-white font-display font-bold text-sm leading-tight drop-shadow">
            {course?.title ?? courseId}
          </h1>
        </div>

        <svg
          width="100%"
          viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
          preserveAspectRatio="xMidYMin meet"
          style={{ display: 'block' }}
        >
          <ParcBackground totalHeight={totalHeight} courseId={courseId} streamYs={streamYs} />
          <ParcPath totalHeight={totalHeight} />

          {items.map((item, idx) => {
            if (item.type === 'stream') {
              return <ParcStream key={`stream-${idx}`} y={item.y} />
            }
            if (item.type === 'grande_etape') {
              return (
                <GrandeEtapeNode
                  key={item.data.id}
                  x={CENTER_X} y={item.y}
                  step={item.data}
                  onClick={() => handleGrandeEtapeClick(item.data)}
                />
              )
            }
            if (item.type === 'lecon') {
              return (
                <LeconNode
                  key={item.data.id}
                  x={CENTER_X} y={item.y}
                  lecon={item.data}
                  leconIndex={item.leconIndex}
                  parentColor={item.parentColor}
                  onClick={() => handleLeconClick(item.data)}
                />
              )
            }
            return null
          })}
        </svg>
      </div>

      {/* ── Footer ── */}
      <CourseFooter onBack={() => (backRoute ? navigate(backRoute) : navigate(-1))} />
    </motion.div>
  )
}
