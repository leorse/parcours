import { describe, test, expect } from 'vitest'
import { getSpritePosition } from '../services/personnageService'

const MOCK_PERSONNAGE = {
  name: 'Crac',
  width: 379, height: 379, cols: 2, rows: 3,
  emotions: [
    { name: 'content',       coords: [0, 0] },
    { name: 'serieux',       coords: [1, 0] },
    { name: 'interrogation', coords: [0, 1] },
    { name: 'moue',          coords: [1, 1] },
    { name: 'sur',           coords: [0, 2] },
    { name: 'parle',         coords: [1, 2] },
  ],
}

describe('getSpritePosition', () => {
  test('émotion [0,0] → {x:0, y:0}', () => {
    const pos = getSpritePosition(MOCK_PERSONNAGE, 'content')
    expect(pos.x).toBe(0)
    expect(pos.y).toBe(0)
  })

  test('émotion [1,0] → {x:-379, y:0}', () => {
    const pos = getSpritePosition(MOCK_PERSONNAGE, 'serieux')
    expect(pos.x).toBe(-379)
    expect(pos.y).toBe(0)
  })

  test('émotion [0,1] → {x:0, y:-379}', () => {
    const pos = getSpritePosition(MOCK_PERSONNAGE, 'interrogation')
    expect(pos.x).toBe(0)
    expect(pos.y).toBe(-379)
  })

  test('émotion [1,2] → {x:-379, y:-758}', () => {
    const pos = getSpritePosition(MOCK_PERSONNAGE, 'parle')
    expect(pos.x).toBe(-379)
    expect(pos.y).toBe(-758)
  })

  test('émotion inconnue → {x:0, y:0}', () => {
    const pos = getSpritePosition(MOCK_PERSONNAGE, 'inexistante')
    expect(pos.x).toBe(0)
    expect(pos.y).toBe(0)
  })
})
