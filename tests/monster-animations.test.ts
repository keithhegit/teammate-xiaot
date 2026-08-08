import { describe, expect, it } from 'vitest'

import { MONSTER_ANIMATIONS } from '../src/renderer/monster-animations'
import { normalizeFrameIndices } from '../src/renderer/sprite-sheet'

describe('MONSTER_ANIMATIONS', () => {
  it('uses a 4 x 4 fly sheet while the other monster actions remain 5 x 3', () => {
    const { fly, ...otherActions } = MONSTER_ANIMATIONS

    expect(fly.sheet).toMatchObject({ columns: 4, rows: 4 })
    expect(
      Object.values(otherActions).map(({ sheet }) => ({
        columns: sheet.columns,
        rows: sheet.rows
      }))
    ).toEqual(
      Array.from({ length: 4 }, () => ({ columns: 5, rows: 3 }))
    )
    expect(MONSTER_ANIMATIONS.point.sheet.frameIndices).toEqual([11, 12, 13, 14])
    expect(fly.sheet).not.toHaveProperty('frameIndices')
    expect(normalizeFrameIndices(fly.sheet.columns * fly.sheet.rows)).toEqual(
      Array.from({ length: 16 }, (_, index) => index)
    )
  })
})
