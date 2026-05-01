import yaml from 'js-yaml'

const BASE = '/content'
const cache = {}

async function fetchYaml(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(`${BASE}/${path}`)
  if (!res.ok) throw new Error(`YAML non trouvé : ${path}`)
  const text = await res.text()
  const data = yaml.load(text)
  cache[path] = data
  return data
}

async function getCourseData(courseId, subjectId) {
  const courses = await getCourses(subjectId)
  const course = courses.find((c) => c.id === courseId)
  if (!course) return null
  return fetchYaml(course.path)
}

// ─── Interface publique ───────────────────────────────────────────────────────

export async function getSubjects() {
  const data = await fetchYaml('index.yaml')
  return data.subjects
}

export async function getCourses(subjectId) {
  const subjects = await getSubjects()
  const subject = subjects.find((s) => s.id === subjectId)
  if (!subject) return []
  const data = await fetchYaml(subject.path)
  return data.courses
}

export async function getSteps(courseId, subjectId) {
  const data = await getCourseData(courseId, subjectId)
  return data?.course?.grandes_etapes ?? []
}

export async function getStepsFlat(courseId, subjectId) {
  const grandeEtapes = await getSteps(courseId, subjectId)
  return grandeEtapes.flatMap((ge) => ge.lessons)
}

export async function getStepContent(courseId, subjectId, stepId) {
  const data = await getCourseData(courseId, subjectId)
  const stepsContent = data?.course?.steps_content ?? []
  return stepsContent.find((s) => s.id === stepId) ?? null
}

export async function getExercises(courseId, subjectId) {
  const courses = await getCourses(subjectId)
  const course = courses.find((c) => c.id === courseId)
  if (!course) return []
  const exercisePath = course.path.replace('course.yaml', 'exercises.yaml')
  const data = await fetchYaml(exercisePath)
  return data?.exercises ?? []
}

export async function getExercise(courseId, subjectId, exoId) {
  const exercises = await getExercises(courseId, subjectId)
  return exercises.find((e) => e.id === exoId) ?? null
}
