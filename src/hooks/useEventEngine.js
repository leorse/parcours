// src/hooks/useEventEngine.js
// Hook principal pour déclencher les triggers depuis n'importe quel écran.
// L'historique des événements est stocké en localStorage (source de vérité locale)
// et synchronisé en backend via logEvent() en fire-and-forget.

import { useCallback }                        from 'react'
import { useProfile }                         from './useProfile'
import { useEventContext }                    from '../context/EventContext'
import { processEvents, resolveVariables }    from '../services/eventEngine'
import { buildActionPayload }                 from '../services/eventActions'
import { logEvent }                           from '../services/progressService'

const HISTORY_KEY = 'parcours_event_history'

function getLocalHistory(uid) {
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}_${uid}`)
    return raw ? JSON.parse(raw) : { triggeredOnce: [], lastTriggered: {} }
  } catch {
    return { triggeredOnce: [], lastTriggered: {} }
  }
}

function saveLocalHistory(uid, history) {
  try {
    localStorage.setItem(`${HISTORY_KEY}_${uid}`, JSON.stringify(history))
  } catch {}
}

export function useEventEngine() {
  const { uid, pseudo } = useProfile()
  const { pushEvents }  = useEventContext()

  /**
   * @param {string}   triggerName   - ex: "subject_enter"
   * @param {object}   extraContext  - données contextuelles additionnelles
   * @param {string[]} contextPaths  - chemins events.yaml contextuels à fusionner
   *                                   ex: ["subjects/mathematiques/events.yaml"]
   */
  const trigger = useCallback(async (triggerName, extraContext = {}, contextPaths = []) => {
    if (!uid) return

    const history       = getLocalHistory(uid)
    const triggeredIds  = history.triggeredOnce  ?? []
    const lastTriggered = history.lastTriggered   ?? {}

    const context = { uid, pseudo, ...extraContext }

    let toFire
    try {
      toFire = await processEvents(triggerName, context, triggeredIds, lastTriggered, contextPaths)
    } catch (e) {
      console.warn('[useEventEngine] Erreur moteur événements :', e.message)
      return
    }

    if (!toFire.length) return

    const payloads = toFire.flatMap(({ eventId, once, actions, context: ctx }) => {
      if (once) {
        if (!history.triggeredOnce.includes(eventId)) {
          history.triggeredOnce.push(eventId)
          logEvent(eventId)
        }
      } else {
        history.lastTriggered[eventId] = new Date().toISOString()
      }

      return actions
        .map(action => buildActionPayload(action, ctx, resolveVariables))
        .filter(Boolean)
        .map(payload => ({ ...payload, eventId }))
    })

    saveLocalHistory(uid, history)

    if (payloads.length) pushEvents(payloads)
  }, [uid, pseudo, pushEvents])

  return { trigger }
}
