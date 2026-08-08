import { describe, expect, it } from 'vitest'

import {
  getFrameRect,
  getScaledFrameSize,
  normalizeFrameIndices
} from '../src/renderer/sprite-sheet'

describe('getFrameRect', () => {
  it('returns the first frame rectangle in a 5 x 3 sheet', () => {
    expect(getFrameRect(1125, 1200, 5, 3, 0)).toEqual({
      x: 0,
      y: 0,
      width: 225,
      height: 400
    })
  })

  it('returns the final frame rectangle in a 5 x 3 sheet', () => {
    expect(getFrameRect(1125, 1200, 5, 3, 14)).toEqual({
      x: 900,
      y: 800,
      width: 225,
      height: 400
    })
  })

  it('rejects an out-of-range frame index', () => {
    expect(() => getFrameRect(1125, 1200, 5, 3, 15)).toThrow(RangeError)
  })
})

describe('normalizeFrameIndices', () => {
  it('keeps selected pointing frames ordered', () => {
    expect(normalizeFrameIndices(15, [11, 12, 13, 14])).toEqual([11, 12, 13, 14])
  })

  it('uses every frame when no selection is supplied', () => {
    expect(normalizeFrameIndices(4)).toEqual([0, 1, 2, 3])
  })

  it('drops invalid selected frames', () => {
    expect(normalizeFrameIndices(4, [-1, 0, 3, 4])).toEqual([0, 3])
  })
})

describe('getScaledFrameSize', () => {
  it('preserves aspect ratio at the requested height', () => {
    expect(getScaledFrameSize({ width: 225, height: 400 }, 250)).toEqual({
      width: 141,
      height: 250
    })
  })
})
