import type { LaunchSession } from './launch'

export type TargetClaim =
  | { ok: true; targetPath: string }
  | { ok: false; reason: 'spectacle' | 'already-used' }

export type TrashResult = { ok: true } | { ok: false; error: string }

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

export async function trashClaimedTarget(
  session: DeletionSession,
  trashItem: (targetPath: string) => Promise<void>
): Promise<TrashResult> {
  const claim = session.claimTarget()
  if (!claim.ok) {
    return {
      ok: false,
      error: claim.reason === 'spectacle' ? '表演模式没有可删除的目标' : '删除请求已经处理'
    }
  }

  try {
    await trashItem(claim.targetPath)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
