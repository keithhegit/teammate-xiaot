import type { SpriteSheetOptions } from './sprite-player'

interface MonsterAnimation {
  source: string
  sheet: SpriteSheetOptions
}

const frameRange = (start: number, count: number): number[] =>
  Array.from({ length: count }, (_, index) => start + index)

export const MONSTER_KICK_IMPACT_FRAME = 14

export const MONSTER_ANIMATIONS = {
  walk: {
    source: 'walking_pointing.png',
    sheet: { columns: 6, rows: 7, frameIndices: frameRange(0, 36) }
  },
  point: {
    source: 'walking_pointing.png',
    sheet: { columns: 6, rows: 7, frameIndices: frameRange(36, 6) }
  },
  kick: {
    source: 'kicking_leaving.png',
    sheet: { columns: 8, rows: 9, frameIndices: frameRange(0, 18) }
  },
  leo: {
    source: 'kicking_leaving.png',
    sheet: { columns: 8, rows: 9, frameIndices: frameRange(18, 30) }
  },
  fly: {
    source: 'kicking_leaving.png',
    sheet: { columns: 8, rows: 9, frameIndices: frameRange(48, 24) }
  }
} as const satisfies Record<string, MonsterAnimation>
