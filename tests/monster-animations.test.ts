import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  MONSTER_ANIMATIONS,
  MONSTER_KICK_IMPACT_FRAME
} from '../src/renderer/monster-animations'

const rendererSource = readFileSync(resolve(import.meta.dirname, '../src/renderer/main.ts'), 'utf8')

describe('MONSTER_ANIMATIONS', () => {
  it('splits the two combined sheets into five ordered actions', () => {
    expect(MONSTER_ANIMATIONS.walk).toEqual({
      source: 'walking_pointing.png',
      sheet: { columns: 6, rows: 7, frameIndices: Array.from({ length: 36 }, (_, index) => index) }
    })
    expect(MONSTER_ANIMATIONS.point).toEqual({
      source: 'walking_pointing.png',
      sheet: { columns: 6, rows: 7, frameIndices: [36, 37, 38, 39, 40, 41] }
    })
    expect(MONSTER_ANIMATIONS.kick).toEqual({
      source: 'kicking_leaving.png',
      sheet: { columns: 8, rows: 9, frameIndices: Array.from({ length: 18 }, (_, index) => index) }
    })
    expect(MONSTER_ANIMATIONS.leo).toEqual({
      source: 'kicking_leaving.png',
      sheet: { columns: 8, rows: 9, frameIndices: Array.from({ length: 30 }, (_, index) => index + 18) }
    })
    expect(MONSTER_ANIMATIONS.fly).toEqual({
      source: 'kicking_leaving.png',
      sheet: { columns: 8, rows: 9, frameIndices: Array.from({ length: 24 }, (_, index) => index + 48) }
    })
    expect(MONSTER_KICK_IMPACT_FRAME).toBe(14)
  })

  it('uses the combined sources and their explicit kick impact frame in the renderer', () => {
    expect(rendererSource).toContain('IMAGES.walkingPointing')
    expect(rendererSource).toContain('IMAGES.kickingLeaving')
    expect(rendererSource).toContain('frameIndex !== MONSTER_KICK_IMPACT_FRAME')
  })

  it.each([
    ['walking_pointing.png', 1920, 2240],
    ['kicking_leaving.png', 2560, 2880]
  ] as const)('keeps %s compact on disk and after decode', (name, expectedWidth, expectedHeight) => {
    const png = readFileSync(resolve(import.meta.dirname, `../assets/${name}`))
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR')
    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    expect(width).toBe(expectedWidth)
    expect(height).toBe(expectedHeight)
    expect(png.length).toBeLessThanOrEqual(1_000_000)
    expect(width * height * 4).toBeLessThanOrEqual(30_000_000)
  })
})
