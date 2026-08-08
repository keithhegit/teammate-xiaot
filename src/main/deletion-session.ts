import type { LaunchSession } from './launch'

export type TargetClaim =
  | { ok: true; targetPath: string }
  | { ok: false; reason: 'spectacle' | 'already-used' }

export class DeletionSession {
  private claimed = false

  constructor(private readonly session: LaunchSession) {}

  claimTarget(): TargetClaim {
    if (this.session.mode === 'spectacle') {
      return { ok: false, reason: 'spectacle' }
    }

    if (this.claimed) {
      return { ok: false, reason: 'already-used' }
    }

    this.claimed = true
    return { ok: true, targetPath: this.session.targetPath }
  }
}

