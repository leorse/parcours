// src/context/EventContext.jsx
// File d'attente globale pour les événements mascotte.
// Garantit qu'un seul dialog est affiché à la fois.

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const EventContext = createContext(null)

export function EventProvider({ children }) {
  const [queue,        setQueue]        = useState([])
  const [currentEvent, setCurrentEvent] = useState(null)

  const pushEvents = useCallback((events) => {
    setQueue(q => [...q, ...events])
  }, [])

  const consumeNext = useCallback(() => {
    setQueue(q => {
      if (q.length === 0) return q
      const [next, ...rest] = q
      setCurrentEvent(next)
      return rest
    })
  }, [])

  const dismissCurrent = useCallback(() => {
    setCurrentEvent(null)
  }, [])

  // Auto-consomme le suivant dans la queue dès que currentEvent devient null
  useEffect(() => {
    if (!currentEvent && queue.length > 0) {
      const timer = setTimeout(consumeNext, 300)
      return () => clearTimeout(timer)
    }
  }, [currentEvent, queue.length, consumeNext])

  return (
    <EventContext.Provider value={{
      queue,
      currentEvent,
      pushEvents,
      dismissCurrent,
    }}>
      {children}
    </EventContext.Provider>
  )
}

export const useEventContext = () => useContext(EventContext)
