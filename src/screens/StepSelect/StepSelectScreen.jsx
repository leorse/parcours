import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getSteps, getCourses } from '../../services/contentService'
import { useAppContext } from '../../context/AppContext'
import LoadingView from '../../components/ui/LoadingView'
import ParcView from './ParcView'

export default function StepSelectScreen() {
  const { subjectId, courseId }             = useParams()
  const { currentSubject, setCurrentStep }  = useAppContext()

  const [grandeEtapes, setGrandeEtapes] = useState([])
  const [course, setCourse]             = useState(null)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    Promise.all([
      getSteps(courseId, subjectId),
      getCourses(subjectId).then((crs) => crs.find((c) => c.id === courseId)),
    ])
      .then(([ges, crs]) => {
        setGrandeEtapes(ges)
        setCourse(crs)
      })
      .finally(() => setLoading(false))
  }, [courseId, subjectId])

  if (loading) return <LoadingView />

  return (
    <ParcView
      courseId={courseId}
      subjectId={subjectId}
      course={course}
      grandeEtapes={grandeEtapes}
      currentSubject={currentSubject}
      setCurrentStep={setCurrentStep}
    />
  )
}
