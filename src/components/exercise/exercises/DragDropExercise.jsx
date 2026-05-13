import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core'
import MathText from '../shared/MathText'

function DraggableItem({ id, children, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
  })
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`drag-item ${isDragging ? 'dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}

function DroppableTarget({ id, children, dropped, correct, isSubmitted, onCancel }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const cls = [
    'drop-target',
    isOver && !isSubmitted ? 'over' : '',
    dropped ? 'has-item' : '',
    dropped && !isSubmitted ? 'cancellable' : '',
    isSubmitted && dropped ? (correct ? 'correct' : 'incorrect') : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div ref={setNodeRef} className={cls} onClick={!isSubmitted && dropped ? onCancel : undefined}>
      {children}
      {dropped && !isSubmitted && (
        <span className="drop-target-cancel" title="Annuler">×</span>
      )}
    </div>
  )
}

export default function DragDropExercise({ exercise, onSubmit, result }) {
  const [pairs, setPairs] = useState({})
  const [activeId, setActiveId] = useState(null)
  const isSubmitted = result !== null

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    setPairs((prev) => {
      // Si la cible est déjà occupée par un autre item, libérer l'ancien
      const displaced = Object.entries(prev).find(
        ([srcId, tId]) => tId === over.id && srcId !== active.id
      )
      const next = displaced
        ? Object.fromEntries(Object.entries(prev).filter(([srcId]) => srcId !== displaced[0]))
        : { ...prev }
      return { ...next, [active.id]: over.id }
    })
  }

  const handleCancel = (targetId) => {
    setPairs((prev) => {
      const srcId = Object.entries(prev).find(([, tId]) => tId === targetId)?.[0]
      if (!srcId) return prev
      const next = { ...prev }
      delete next[srcId]
      return next
    })
  }

  const allPaired = exercise.pairs.every((p) => pairs[p.source.id])

  const isTargetCorrect = (targetId) => {
    const pair = exercise.pairs.find((p) => p.target.id === targetId)
    const sourceId = Object.entries(pairs).find(([, tId]) => tId === targetId)?.[0]
    if (!pair || !sourceId) return false
    return sourceId === pair.source.id
  }

  const droppedInTarget = (targetId) =>
    Object.entries(pairs).find(([, tId]) => tId === targetId)?.[0]

  return (
    <div className="exercise-drag-drop">
      {exercise.instruction && (
        <div className="exercise-instruction"><MathText text={exercise.instruction} /></div>
      )}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={handleDragEnd}
      >
        <div className="drag-drop-layout">
          <div className="drag-sources">
            <div className="drag-column-label">À placer</div>
            {exercise.pairs.map((pair) => {
              const isPlaced = pairs[pair.source.id]
              return (
                <DraggableItem
                  key={pair.source.id}
                  id={pair.source.id}
                  disabled={isSubmitted || !!isPlaced}
                >
                  <span className={isPlaced ? 'placed' : ''}>
                    {pair.source.tex ? (
                      <MathText text={`$${pair.source.tex}$`} inline />
                    ) : (
                      <MathText text={pair.source.text} inline />
                    )}
                  </span>
                </DraggableItem>
              )
            })}
          </div>
          <div className="drag-targets">
            <div className="drag-column-label">Cibles</div>
            {exercise.pairs.map((pair) => {
              const droppedSourceId = droppedInTarget(pair.target.id)
              const droppedSource = exercise.pairs.find((p) => p.source.id === droppedSourceId)
              return (
                <DroppableTarget
                  key={pair.target.id}
                  id={pair.target.id}
                  dropped={!!droppedSourceId}
                  correct={isTargetCorrect(pair.target.id)}
                  isSubmitted={isSubmitted}
                  onCancel={() => handleCancel(pair.target.id)}
                >
                  <div className="drop-target-label">
                    <MathText text={pair.target.text} inline />
                  </div>
                  {droppedSource && (
                    <div className="drop-target-item">
                      {droppedSource.source.tex ? (
                        <MathText text={`$${droppedSource.source.tex}$`} inline />
                      ) : (
                        <MathText text={droppedSource.source.text} inline />
                      )}
                    </div>
                  )}
                </DroppableTarget>
              )
            })}
          </div>
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="drag-item dragging-overlay">
              {(() => {
                const src = exercise.pairs.find((p) => p.source.id === activeId)?.source
                return src?.tex ? (
                  <MathText text={`$${src.tex}$`} inline />
                ) : (
                  <MathText text={src?.text ?? ''} inline />
                )
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {!isSubmitted && (
        <button
          className="exercise-btn-validate"
          disabled={!allPaired}
          onClick={() => onSubmit(pairs)}
        >
          Vérifier
        </button>
      )}
    </div>
  )
}
