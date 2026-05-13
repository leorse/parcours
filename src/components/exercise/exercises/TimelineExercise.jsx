import { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import MathText from '../shared/MathText'

function SortableItem({ item, index, isSubmitted, expectedIndex }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: isSubmitted,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const isCorrect = isSubmitted && index === expectedIndex
  const isIncorrect = isSubmitted && index !== expectedIndex

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'timeline-item',
        isDragging ? 'dragging' : '',
        isCorrect ? 'correct' : '',
        isIncorrect ? 'incorrect' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...attributes}
      {...(isSubmitted ? {} : listeners)}
    >
      <span className="timeline-handle">{isSubmitted ? (isCorrect ? '✓' : '✗') : '⠿'}</span>
      <span className="timeline-text"><MathText text={item.text} inline /></span>
    </div>
  )
}

export default function TimelineExercise({ exercise, onSubmit, result }) {
  const initialItems = useMemo(() => {
    const list = [...exercise.items]
    if (exercise.settings?.shuffle !== false) list.sort(() => Math.random() - 0.5)
    return list
  }, [exercise])

  const [items, setItems] = useState(initialItems)
  const isSubmitted = result !== null

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const expectedOrder = useMemo(
    () =>
      [...exercise.items]
        .sort((a, b) => a.correct_position - b.correct_position)
        .map((i) => i.id),
    [exercise]
  )

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      setItems(arrayMove(items, oldIndex, newIndex))
    }
  }

  return (
    <div className="exercise-timeline">
      {exercise.instruction && (
        <div className="exercise-instruction"><MathText text={exercise.instruction} /></div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={index}
              isSubmitted={isSubmitted}
              expectedIndex={expectedOrder.indexOf(item.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
      {!isSubmitted && (
        <button
          className="exercise-btn-validate"
          onClick={() => onSubmit(items.map((i) => i.id))}
        >
          Vérifier
        </button>
      )}
    </div>
  )
}
