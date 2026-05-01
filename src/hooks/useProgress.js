// Jalon 1 : stub, retourne des données fictives
// Jalon 4 : connecté à l'API et au localStorage
export const useProgress = () => {
  return {
    getStepStatus: (_stepId) => 'available',
    markStepComplete: (_stepId, _score) => {},
    getCourseProgress: (_courseId) => 0,
  }
}
