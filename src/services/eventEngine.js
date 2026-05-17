// src/services/eventEngine.js
// Moteur principal : charge les events.yaml globaux + contextuels,
// filtre ceux à déclencher selon trigger, conditions, once et cooldown.

import yaml from 'js-yaml'
import { evaluateCondition } from './eventConditions'

let globalEventsCache      = null
const contextualEventsCache = {}   // clé = path, valeur = events[]

async function loadGlobalEvents() {
  if (globalEventsCache) return globalEventsCache
  const res  = await fetch('/content/events/events.yaml')
  const text = await res.text()
  globalEventsCache = yaml.load(text).events ?? []
  return globalEventsCache
}

async function loadContextualEvents(paths = []) {
  const all = []
  for (const path of paths) {
    if (contextualEventsCache[path]) {
      all.push(...contextualEventsCache[path])
      continue
    }
    try {
      const res = await fetch(`/content/${path}`)
      if (!res.ok) continue
      const text   = await res.text()
      const events = yaml.load(text).events ?? []
      contextualEventsCache[path] = events
      all.push(...events)
    } catch {
      // Pas d'events.yaml pour ce contexte — normal
    }
  }
  return all
}

/**
 * Filtre et retourne les événements à déclencher.
 *
 * @param {string}   triggerName   - ex: "subject_enter"
 * @param {object}   context       - données contextuelles (uid, score, streak…)
 * @param {string[]} triggeredIds  - IDs des événements `once` déjà déclenchés
 * @param {object}   lastTriggered - map eventId → ISO date du dernier déclenchement
 * @param {string[]} contextPaths  - chemins relatifs des events.yaml contextuels
 *                                   ex: ["subjects/mathematiques/events.yaml"]
 */
export async function processEvents(
  triggerName,
  context,
  triggeredIds  = [],
  lastTriggered = {},
  contextPaths  = [],
) {
  const [globalEvents, contextualEvents] = await Promise.all([
    loadGlobalEvents(),
    loadContextualEvents(contextPaths),
  ])

  // Globaux en premier, contextuels en priorité (peuvent s'ajouter aux globaux)
  const allEvents = [...globalEvents, ...contextualEvents]

  const result = []
  const now    = new Date()

  for (const event of allEvents) {
    if (event.trigger.on !== triggerName) continue
    if (event.once && triggeredIds.includes(event.id)) continue

    if (!event.once && (event.cooldown_days ?? 0) > 0) {
      const last = lastTriggered[event.id]
      if (last) {
        const daysSince = (now - new Date(last)) / (1000 * 60 * 60 * 24)
        if (daysSince < event.cooldown_days) continue
      }
    }

    const allMet = (event.conditions ?? []).every(cond =>
      evaluateCondition(cond, context)
    )
    if (!allMet) continue

    result.push({
      eventId: event.id,
      once:    event.once ?? false,
      actions: event.actions ?? [],
      context,
    })
  }

  return result
}

/**
 * Résout les variables {key} dans un texte depuis le contexte.
 * Les clés inconnues sont laissées intactes.
 */
export function resolveVariables(text, context) {
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const val = context[key]
    return val !== undefined ? String(val) : `{${key}}`
  })
}
