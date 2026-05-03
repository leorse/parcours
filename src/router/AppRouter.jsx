import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import SplashScreen from '../screens/Splash/SplashScreen'
import MainMenuScreen from '../screens/MainMenu/MainMenuScreen'
import SubjectSelectScreen from '../screens/SubjectSelect/SubjectSelectScreen'
import CourseSelectScreen from '../screens/CourseSelect/CourseSelectScreen'
import StepSelectScreen from '../screens/StepSelect/StepSelectScreen'
import StepPlayerScreen from '../screens/StepPlayer/StepPlayerScreen'
import DebugFAB from '../components/debug/DebugFAB'

// Debug dashboard — lazy-loaded, tree-shaken en prod (import.meta.env.DEV = false → dead code)
const DebugDashboard = import.meta.env.DEV
  ? lazy(() => import('../debug/DebugDashboard'))
  : null

export const ROUTES = {
  SPLASH:   '/',
  MENU:     '/menu',
  SUBJECTS: '/subjects',
  COURSES:  '/courses/:subjectId',
  STEPS:    '/steps/:subjectId/:courseId',
  PLAYER:   '/player/:subjectId/:courseId/:stepId',
  ...(import.meta.env.DEV ? { DEBUG: '/debug' } : {}),
}

export const buildRoute = {
  courses: (subjectId) => `/courses/${subjectId}`,
  steps:   (subjectId, courseId) => `/steps/${subjectId}/${courseId}`,
  player:  (subjectId, courseId, stepId) => `/player/${subjectId}/${courseId}/${stepId}`,
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path={ROUTES.SPLASH}   element={<SplashScreen />} />
        <Route path={ROUTES.MENU}     element={<MainMenuScreen />} />
        <Route path={ROUTES.SUBJECTS} element={<SubjectSelectScreen />} />
        <Route path={ROUTES.COURSES}  element={<CourseSelectScreen />} />
        <Route path={ROUTES.STEPS}    element={<StepSelectScreen />} />
        <Route path={ROUTES.PLAYER}   element={<StepPlayerScreen />} />

        {import.meta.env.DEV && DebugDashboard && (
          <Route
            path="/debug"
            element={
              <Suspense fallback={null}>
                <DebugDashboard />
              </Suspense>
            }
          />
        )}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      {import.meta.env.DEV && <DebugFAB />}
    </BrowserRouter>
  )
}
