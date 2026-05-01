import { readFileSync, readdirSync, statSync } from 'fs'
import { load } from 'js-yaml'
import { join } from 'path'

const CONTENT_DIR = './public/content'
let errors = 0

function err(msg) {
  console.error(`❌ ${msg}`)
  errors++
}

function validateCourse(filePath) {
  let raw
  try {
    raw = readFileSync(filePath, 'utf8')
  } catch {
    err(`${filePath} : impossible de lire le fichier`)
    return
  }

  let data
  try {
    data = load(raw)
  } catch (e) {
    err(`${filePath} : YAML invalide — ${e.message}`)
    return
  }

  const course = data?.course
  if (!course?.id)    err(`${filePath} : course.id manquant`)
  if (!course?.title) err(`${filePath} : course.title manquant`)
  if (!course?.grandes_etapes?.length) {
    err(`${filePath} : course.grandes_etapes vide ou absent`)
    return
  }

  const stepIds = (course.steps_content ?? []).map((s) => s.id)

  for (const ge of course.grandes_etapes) {
    if (!ge.id)    err(`${filePath} : grande_etape sans id`)
    if (!ge.title) err(`${filePath} : grande_etape sans title`)
    for (const lesson of ge.lessons ?? []) {
      if (!lesson.id)          err(`${filePath} : leçon sans id dans ge "${ge.id}"`)
      if (!lesson.content_ref) err(`${filePath} : leçon "${lesson.id}" sans content_ref`)
      else if (!stepIds.includes(lesson.content_ref)) {
        err(`${filePath} : content_ref "${lesson.content_ref}" introuvable dans steps_content`)
      }
    }
  }

  console.log(`  ✓ ${filePath}`)
}

function walkDir(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walkDir(full)
    } else if (entry === 'course.yaml') {
      validateCourse(full)
    }
  }
}

console.log('Validation des fichiers YAML…\n')

// Valider index.yaml racine
try {
  const root = load(readFileSync(join(CONTENT_DIR, 'index.yaml'), 'utf8'))
  if (!root?.subjects?.length) err('index.yaml : subjects vide ou absent')
  else console.log(`  ✓ index.yaml (${root.subjects.length} matières)`)
} catch (e) {
  err(`index.yaml : ${e.message}`)
}

// Valider tous les course.yaml
walkDir(CONTENT_DIR)

if (errors > 0) {
  console.error(`\n${errors} erreur(s) trouvée(s).`)
  process.exit(1)
} else {
  console.log('\n✅ Tout est valide.')
}
