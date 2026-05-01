import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  // Jalon 1
  const [currentSubject, setCurrentSubject] = useState(null)
  const [currentCourse, setCurrentCourse] = useState(null)
  const [currentStep, setCurrentStep] = useState(null)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Jalon 4 — sera rempli par Firebase Auth
  const [user, setUser] = useState(null)

  // Jalon 5 — sera rempli par le backend
  const [xp, setXp] = useState(0)
  const [badges, setBadges] = useState([])

  // Jalon 6 — moteur d'événements
  const [pendingEvent, setPendingEvent] = useState(null)

  return (
    <AppContext.Provider
      value={{
        currentSubject, setCurrentSubject,
        currentCourse, setCurrentCourse,
        currentStep, setCurrentStep,
        musicEnabled, setMusicEnabled,
        soundEnabled, setSoundEnabled,
        user, setUser,
        xp, badges,
        pendingEvent, setPendingEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
