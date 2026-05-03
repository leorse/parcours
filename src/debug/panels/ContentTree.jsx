import { useState, useEffect } from 'react'
import { getSubjects, getCourses, getExercises } from '../../services/contentService'

const s = {
  title:    { color: '#8b949e', fontSize: '10px', letterSpacing: '1px', padding: '8px 4px 4px', textTransform: 'uppercase' },
  subject:  { color: '#58a6ff', cursor: 'pointer', padding: '4px 4px', fontWeight: 'bold', userSelect: 'none' },
  course:   { color: '#c9d1d9', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none' },
  exercise: { color: '#8b949e', cursor: 'pointer', padding: '2px 8px', borderRadius: '3px', userSelect: 'none' },
  exoType:  { color: '#f0883e', fontSize: '10px', marginRight: '4px' },
  badge:    { marginLeft: 'auto', background: '#30363d', borderRadius: '8px', padding: '0 5px', fontSize: '10px', flexShrink: 0 },
  loading:  { color: '#8b949e', padding: '8px', fontSize: '11px' },
}

export default function ContentTree({ onSelect, selectedId }) {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function buildTree() {
      const subjects = await getSubjects()
      const result = []
      for (const subject of subjects) {
        const courses = await getCourses(subject.id)
        const subjectNode = { ...subject, courses: [] }
        for (const course of courses) {
          const exercises = await getExercises(course.id, subject.id)
          subjectNode.courses.push({ ...course, exercises })
        }
        result.push(subjectNode)
      }
      setTree(result)
      setLoading(false)
    }
    buildTree()
  }, [])

  if (loading) return <div style={s.loading}>Chargement…</div>

  return (
    <div>
      <div style={s.title}>Contenu</div>
      {tree.map((subject) => (
        <TreeSubject key={subject.id} subject={subject} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </div>
  )
}

function TreeSubject({ subject, onSelect, selectedId }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div style={s.subject} onClick={() => setOpen((o) => !o)}>
        {open ? '▼' : '▶'} {subject.label}
      </div>
      {open &&
        subject.courses.map((course) => (
          <TreeCourse
            key={course.id}
            course={course}
            subjectId={subject.id}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
    </div>
  )
}

function TreeCourse({ course, subjectId, onSelect, selectedId }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ paddingLeft: '12px' }}>
      <div style={s.course} onClick={() => setOpen((o) => !o)}>
        <span>{open ? '▼' : '▶'}</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {course.title}
        </span>
        <span style={s.badge}>{course.exercises?.length ?? 0}</span>
      </div>
      {open &&
        course.exercises?.map((exo) => (
          <div
            key={exo.id}
            style={{
              ...s.exercise,
              background: selectedId === exo.id ? '#1f6feb' : 'transparent',
            }}
            onClick={() => onSelect(subjectId, course.id, exo.id)}
          >
            <span style={s.exoType}>{exo.exercise?.type}</span>
            {exo.id}
          </div>
        ))}
    </div>
  )
}
