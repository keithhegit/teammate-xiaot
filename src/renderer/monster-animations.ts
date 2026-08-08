import type { SpriteSheetOptions } from './sprite-player'

interface MonsterAnimation {
  source: string
  sheet: SpriteSheetOptions
}

export const MONSTER_ANIMATIONS = {
  walk: {
    source: '走路动效_spritesheet_transparent.png',
    sheet: { columns: 5, rows: 3 }
  },
  point: {
    source: '指着文件_spritesheet_transparent.png',
    sheet: { columns: 5, rows: 3, frameIndices: [11, 12, 13, 14] }
  },
  kick: {
    source: '踹文件动效_spritesheet_transparent.png',
    sheet: { columns: 5, rows: 3 }
  },
  leo: {
    source: '雷欧登场_spritesheet_transparent.png',
    sheet: { columns: 5, rows: 3 }
  },
  fly: {
    source: '出场飞行动效_spritesheet_transparent.png',
    sheet: { columns: 4, rows: 4 }
  }
} as const satisfies Record<string, MonsterAnimation>
