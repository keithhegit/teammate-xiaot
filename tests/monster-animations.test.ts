import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  getMonsterExitPosition,
  getMonsterSequencePositions,
  MONSTER_ANIMATIONS,
  MONSTER_APPROACH_DURATION_MS,
  MONSTER_EXIT_DURATION_MS,
  MONSTER_FPS,
  MONSTER_KICK_IMPACT_FRAME,
  MONSTER_POINT_ANCHOR,
  MONSTER_POSITION_OFFSET,
  MONSTER_TARGET_HEIGHT
} from '../src/renderer/monster-animations'

const rendererSource = readFileSync(resolve(import.meta.dirname, '../src/renderer/main.ts'), 'utf8')
const rendererHtml = readFileSync(resolve(import.meta.dirname, '../src/renderer/index.html'), 'utf8')

describe('MONSTER_ANIMATIONS', () => {
  it('plays the two combined sheets as two uninterrupted phases', () => {
    expect(MONSTER_ANIMATIONS.approachAndPoint).toEqual({
      source: 'walking_pointing.png',
      sheet: {
        columns: 6,
        rows: 7,
        targetHeight: 250,
        frameIndices: Array.from({ length: 42 }, (_, index) => index)
      }
    })
    expect(MONSTER_ANIMATIONS.destroyAndLeave).toEqual({
      source: 'kicking_leaving.png',
      sheet: {
        columns: 8,
        rows: 9,
        targetHeight: 250,
        frameIndices: Array.from({ length: 72 }, (_, index) => index)
      }
    })
    expect(MONSTER_FPS).toBe(11)
    expect(MONSTER_TARGET_HEIGHT).toBe(250)
    expect(MONSTER_KICK_IMPACT_FRAME).toBe(16)
    expect(MONSTER_APPROACH_DURATION_MS).toBeCloseTo(3818.18, 2)
    expect(MONSTER_EXIT_DURATION_MS).toBe(1200)
  })

  it('keeps the calibrated point left and below the explosion target', () => {
    expect(MONSTER_POINT_ANCHOR).toEqual({ x: 98, y: 143 })
    expect(MONSTER_POSITION_OFFSET).toEqual({ x: -32, y: 22 })
    expect(getMonsterSequencePositions({ x: 500, y: 400 }, 250)).toEqual({
      start: { x: -250, y: 279 },
      approach: { x: 370, y: 279 }
    })
  })

  it('moves the entire character canvas beyond the right screen edge', () => {
    expect(getMonsterExitPosition(1920, 250, 279)).toEqual({ x: 2170, y: 279 })
  })

  it('runs movement, playback, explosion, and deletion without splitting phase two', () => {
    expect(rendererSource).toContain('IMAGES.walkingPointing')
    expect(rendererSource).toContain('IMAGES.kickingLeaving')
    expect(rendererSource).toContain('Promise.all([phaseOnePlayback, movement])')
    expect(rendererSource).toContain('frameIndex !== MONSTER_KICK_IMPACT_FRAME')
    expect(rendererSource).toContain('explosionTask = playExplosion(target)')
    expect(rendererSource).toContain('trashTask = window.monsterApi.trashTarget()')
    expect(rendererSource).not.toContain('MONSTER_ANIMATIONS.leo')
    expect(rendererSource).not.toContain('MONSTER_ANIMATIONS.fly')
  })

  it('keeps both confirmation choices and the final approved copy', () => {
    expect(rendererHtml).toContain('id="confirm-primary"')
    expect(rendererHtml).toContain('id="confirm-secondary"')
    expect(rendererHtml).toContain('嘿嘿嘿，就是它')
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
    expect(png.length).toBeLessThanOrEqual(1_500_000)
    expect(width * height * 4).toBeLessThanOrEqual(30_000_000)
  })
})
