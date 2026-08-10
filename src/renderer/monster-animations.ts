import type { SpriteSheetOptions } from './sprite-player'

interface MonsterAnimation {
  source: string
  sheet: SpriteSheetOptions
}

interface Point {
  x: number
  y: number
}

const frameRange = (start: number, count: number): number[] =>
  Array.from({ length: count }, (_, index) => start + index)

export const MONSTER_FPS = 11
export const MONSTER_TARGET_HEIGHT = 250
export const MONSTER_KICK_IMPACT_FRAME = 16
export const MONSTER_APPROACH_DURATION_MS = (42 * 1000) / MONSTER_FPS
export const MONSTER_EXIT_DURATION_MS = 1200
export const MONSTER_POINT_ANCHOR = { x: 98, y: 143 } as const
export const MONSTER_POSITION_OFFSET = { x: -32, y: 22 } as const

export const MONSTER_ANIMATIONS = {
  approachAndPoint: {
    source: 'walking_pointing.png',
    sheet: {
      columns: 6,
      rows: 7,
      targetHeight: MONSTER_TARGET_HEIGHT,
      frameIndices: frameRange(0, 42)
    }
  },
  destroyAndLeave: {
    source: 'kicking_leaving.png',
    sheet: {
      columns: 8,
      rows: 9,
      targetHeight: MONSTER_TARGET_HEIGHT,
      frameIndices: frameRange(0, 72)
    }
  }
} as const satisfies Record<string, MonsterAnimation>

export function getMonsterSequencePositions(
  target: Point,
  monsterWidth: number
): { start: Point; approach: Point } {
  const y = target.y - MONSTER_POINT_ANCHOR.y + MONSTER_POSITION_OFFSET.y

  return {
    start: { x: -monsterWidth, y },
    approach: {
      x: target.x - MONSTER_POINT_ANCHOR.x + MONSTER_POSITION_OFFSET.x,
      y
    }
  }
}

export function getMonsterExitPosition(
  viewportWidth: number,
  monsterWidth: number,
  y: number
): Point {
  return { x: viewportWidth + monsterWidth, y }
}
