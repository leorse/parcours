import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, BookOpen, Landmark, FlaskConical, ChevronLeft } from 'lucide-react'
import fondMathImg from '@images/fond_mathématique.webp'
import fondHistoireImg from '@images/fond_histoire.webp'
import PageTransition from '../../components/layout/PageTransition'
import LoadingView from '../../components/ui/LoadingView'
import { getSubjects } from '../../services/contentService'
import { ROUTES, buildRoute } from '../../router/AppRouter'
import { useAppContext } from '../../context/AppContext'

const ICON_MAP = {
  'calculator':    Calculator,
  'book-open':     BookOpen,
  'landmark':      Landmark,
  'flask-conical': FlaskConical,
}

const FOND_MAP = {
  mathematiques: fondMathImg,
  histoire:      fondHistoireImg,
}

export default function SubjectSelectScreen() {
  const navigate = useNavigate()
  const { setCurrentSubject } = useAppContext()

  const [subjects, setSubjects] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getSubjects()
      .then(setSubjects)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingView />

  const handleSelect = (subject) => {
    setCurrentSubject(subject)
    navigate(buildRoute.courses(subject.id))
  }

  return (
    <PageTransition className="px-6 pb-8 pt-[60px] bg-app-gradient">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white">Choisir une matière</h1>
        <p className="text-brand-5/70 text-sm font-body">
          Qu&apos;est-ce qu&apos;on apprend aujourd&apos;hui ?
        </p>
      </div>

      {/* Grille des matières */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {subjects.map((subject) => {
          const Icon = ICON_MAP[subject.icon] ?? BookOpen
          const fondImg = FOND_MAP[subject.id]

          return (
            <div
              key={subject.id}
              onClick={() => handleSelect(subject)}
              className="relative rounded-2xl overflow-hidden border border-white/20 cursor-pointer
                         hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              style={fondImg ? {
                backgroundImage: `url(${fondImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {}}
            >
              {/* Fond : gradient sombre sur image, ou verre dépoli */}
              <div
                className={`absolute inset-0 ${
                  fondImg
                    ? 'bg-gradient-to-br from-black/55 via-black/40 to-black/70'
                    : 'bg-white/10 backdrop-blur-sm'
                }`}
              />

              {/* Contenu */}
              <div className="relative z-10 p-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${subject.color}${fondImg ? '50' : '25'}` }}
                >
                  <Icon className="w-7 h-7" style={{ color: fondImg ? 'white' : subject.color }} />
                </div>

                <h2 className="text-lg font-display font-bold text-white mb-1">
                  {subject.label}
                </h2>
                <p className="text-brand-5/80 text-sm font-body mb-4">
                  {subject.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-5/60 font-body">
                    {subject.coursesCount} cours
                  </span>
                  <ChevronLeft
                    className="w-4 h-4 rotate-180 text-white/70"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </PageTransition>
  )
}
