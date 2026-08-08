import type { MonsterApi } from '../shared/api'

declare global {
  interface Window {
    monsterApi: MonsterApi
  }
}

export {}

