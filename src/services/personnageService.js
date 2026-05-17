// src/services/personnageService.js
// Charge personnages.yaml et calcule les positions spritesheet.
// Cache dès le premier appel — ne jamais appeler fetch à chaque rendu.

import yaml from 'js-yaml'

let cache = null

export async function getPersonnages() {
  if (cache) return cache
  const res  = await fetch('/content/personnages.yaml')
  const text = await res.text()
  cache = yaml.load(text).personnages ?? []
  return cache
}

export async function getPersonnage(name) {
  const all = await getPersonnages()
  return all.find(p => p.name === name) ?? null
}

/**
 * Calcule la position background-position CSS pour une émotion donnée.
 * Retourne des valeurs en pixels bruts (avant scaling).
 *
 * @param {object} personnage - objet issu de personnages.yaml
 * @param {string} emotionName
 * @returns {{ x: number, y: number }}
 */
export function getSpritePosition(personnage, emotionName) {
  const emotion = personnage.emotions.find(e => e.name === emotionName)
  if (!emotion) return { x: 0, y: 0 }

  const [col, row] = emotion.coords
  return {
    x: -(col * personnage.width) || 0,
    y: -(row * personnage.height) || 0,
  }
}
