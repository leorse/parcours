// src/services/dialogueService.js
// Charge les fichiers dialogues/monologues à la demande (lazy).
// Cache par chemin — jamais chargé deux fois.

import yaml from 'js-yaml'

const cache = {}

/**
 * @param {string} ref - chemin relatif depuis /content/
 *                        ex: "dialogues/crac_moggy_fractions.yaml"
 */
/**
 * Résout un content_ref court ("crac_moggy_fractions") en chemin complet
 * ("dialogues/crac_moggy_fractions.yaml"). Les refs qui contiennent déjà
 * un "/" ou se terminent par ".yaml" sont retournés tels quels.
 */
export function resolveDialogueRef(contentRef) {
  if (!contentRef) return ''
  if (contentRef.includes('/') || contentRef.endsWith('.yaml')) return contentRef
  return `dialogues/${contentRef}.yaml`
}

export async function loadDialogue(ref) {
  if (cache[ref]) return cache[ref]

  const res = await fetch(`/content/${ref}`)
  if (!res.ok) throw new Error(`Dialogue introuvable : ${ref}`)
  const text = await res.text()
  const data = yaml.load(text).dialogue
  cache[ref] = data
  return data
}
