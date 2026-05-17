import MdBlock       from './blocks/MdBlock'
import MathBlock     from './blocks/MathBlock'
import ImageBlock    from './blocks/ImageBlock'
import NoticeBlock   from './blocks/NoticeBlock'
import ExerciseBlock from './blocks/ExerciseBlock'

export default function LessonRenderer({ blocks = [] }) {
  return (
    <div className="lesson-content">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'md':       return <MdBlock       key={i} {...block} />
          case 'math':     return <MathBlock     key={i} {...block} />
          case 'image':    return <ImageBlock    key={i} {...block} />
          case 'notice':   return <NoticeBlock   key={i} {...block} />
          case 'exercise': return <ExerciseBlock key={i} exercise_id={block.ref} />
          case 'break':    return null
          default:
            console.warn(`Type de bloc inconnu : ${block.type}`)
            return null
        }
      })}
    </div>
  )
}
