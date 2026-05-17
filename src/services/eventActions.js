// src/services/eventActions.js
// Traduit les actions YAML en objets exploitables par MascotteDialog.

export function buildActionPayload(action, context, resolveVars) {
  switch (action.type) {

    case 'show_dialog':
      return {
        type:      'dialog',
        character: action.character,
        animation: action.animation,
        sound:     action.sound ?? null,
        messages:  (action.messages ?? []).map(m => resolveVars(m, context)),
        buttons:   action.buttons ?? null,
      }

    case 'show_celebration':
      return {
        type:      'celebration',
        animation: action.animation,   // "confetti" | "fireworks"
        sound:     action.sound ?? null,
      }

    case 'show_reinforcement':
      return {
        type:     'reinforcement',
        skillTag: action.skill_tag ? resolveVars(action.skill_tag, context) : null,
        max:      action.max ?? 3,
      }

    case 'show_monologue':
      return {
        type:        'monologue',
        dialogueRef: action.ref,
        sound:       action.sound ?? null,
      }

    case 'show_dialogue':
      return {
        type:        'dialogue',
        dialogueRef: action.ref,
        sound:       action.sound ?? null,
      }

    default:
      console.warn(`[EventEngine] Action inconnue : ${action.type}`)
      return null
  }
}
