import type { LaunchSession } from '../main/launch'
import type { TrashResult } from '../main/deletion-session'

export const IPC_CHANNELS = {
  getSession: 'monster:get-session',
  trashTarget: 'monster:trash-target',
  closeOverlay: 'monster:close-overlay'
} as const

export interface MonsterApi {
  getSession(): Promise<LaunchSession>
  trashTarget(): Promise<TrashResult>
  closeOverlay(): void
}

