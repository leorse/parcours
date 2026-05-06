// Jalon 4  : localStorage
// Jalon 7  : localStorage + sync backend
// L'interface NE CHANGE PAS

import { useCallback } from 'react'
import { useProfile } from './useProfile'
import * as progressService from '../services/progressService'

export function useProgress() {
  const { uid, isAdmin } = useProfile()

  const getStepStatus = useCallback((stepId) => {
    if (isAdmin) return 'available'
    return progressService.getStepStatus(uid, stepId)
  }, [uid, isAdmin])

  const getStepScore = useCallback((stepId) => {
    return progressService.getStepScore(uid, stepId)
  }, [uid])

  const getCourseProgress = useCallback((courseId, steps) => {
    if (isAdmin) return 1.0
    return progressService.getCourseProgress(uid, courseId, steps)
  }, [uid, isAdmin])

  const markStepComplete = useCallback((stepId, score, courseStructure) => {
    if (!uid) return
    progressService.markStepComplete(uid, stepId, score, courseStructure)
  }, [uid])

  const markStepInProgress = useCallback((stepId) => {
    if (!uid || isAdmin) return
    progressService.markStepInProgress(uid, stepId)
  }, [uid, isAdmin])

  const saveExerciseResult = useCallback((exerciseId, result) => {
    if (!uid) return
    progressService.saveExerciseResult(uid, exerciseId, result)
  }, [uid])

  const resetProgress = useCallback(() => {
    if (!uid) return
    progressService.resetProgress(uid)
  }, [uid])

  return {
    getStepStatus,
    getStepScore,
    getCourseProgress,
    markStepComplete,
    markStepInProgress,
    saveExerciseResult,
    resetProgress,
  }
}
