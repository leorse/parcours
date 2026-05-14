import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useProfile } from '../hooks/useProfile'
import SplashScreen from '../screens/Splash/SplashScreen'
import MainMenuScreen from '../screens/MainMenu/MainMenuScreen'
import SubjectSelectScreen from '../screens/SubjectSelect/SubjectSelectScreen'
import CourseSelectScreen from '../screens/CourseSelect/CourseSelectScreen'
import StepSelectScreen from '../screens/StepSelect/StepSelectScreen'
import StepPlayerScreen from '../screens/StepPlayer/StepPlayerScreen'
import ProfileSelectScreen from '../screens/ProfileSelect/ProfileSelectScreen'
import ProfileScreen from '../screens/Profile/ProfileScreen'
import NavHeader from '../components/layout/NavHeader'
import DebugFAB from '../components/debug/DebugFAB'

// Debug dashboard — lazy-loaded, tree-shaken en prod (import.meta.env.DEV = false → dead code)
const DebugDashboard = import.meta.env.DEV
  ? lazy(() => import('../debug/DebugDashboard'))
  : null

export const ROUTES = {
  SPLASH:          '/',
  PROFILE_SELECT:  '/profile-select',
  MENU:            '/menu',
  SUBJECTS:        '/subjects',
  COURSES:         '/courses/:subjectId',
  STEPS:           '/steps/:subjectId/:courseId',
  PLAYER:          '/player/:subjectId/:courseId/:stepId',
  PROFILE:         '/profile',
  ...(import.meta.env.DEV ? { DEBUG: '/debug' } : {}),
}

export const buildRoute = {
  courses: (subjectId) => `/courses/${subjectId}`,
  steps:   (subjectId, courseId) => `/steps/${subjectId}/${courseId}`,
  player:  (subjectId, courseId, stepId) => `/player/${subjectId}/${courseId}/${stepId}`,
}

function RequireAuth({ children }) {
  const { isLoggedIn, loading } = useProfile()
  if (loading) return null
  if (!isLoggedIn) return <Navigate to={ROUTES.PROFILE_SELECT} replace />
  return (
    <>
      <NavHeader />
      {children}
    </>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path={ROUTES.SPLASH}          element={<SplashScreen />} />
        <Route path={ROUTES.PROFILE_SELECT}  element={<ProfileSelectScreen />} />
        <Route path={ROUTES.MENU}            element={<RequireAuth><MainMenuScreen /></RequireAuth>} />
        <Route path={ROUTES.SUBJECTS}        element={<RequireAuth><SubjectSelectScreen /></RequireAuth>} />
        <Route path={ROUTES.COURSES}         element={<RequireAuth><CourseSelectScreen /></RequireAuth>} />
        <Route path={ROUTES.STEPS}           element={<RequireAuth><StepSelectScreen /></RequireAuth>} />
        <Route path={ROUTES.PLAYER}          element={<RequireAuth><StepPlayerScreen /></RequireAuth>} />
        <Route path={ROUTES.PROFILE}         element={<RequireAuth><ProfileScreen /></RequireAuth>} />

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
