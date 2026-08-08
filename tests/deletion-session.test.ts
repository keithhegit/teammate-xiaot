import { describe, expect, it } from 'vitest'

import { DeletionSession, trashClaimedTarget } from '../src/main/deletion-session'

describe('DeletionSession', () => {
  it('authorizes a target exactly once', () => {
    const session = new DeletionSession({ mode: 'target', targetPath: 'C:\\Temp\\old.txt' })

    expect(session.claimTarget()).toEqual({ ok: true, targetPath: 'C:\\Temp\\old.txt' })
    expect(session.claimTarget()).toEqual({ ok: false, reason: 'already-used' })
  })

  it('never authorizes spectacle mode', () => {
    const session = new DeletionSession({ mode: 'spectacle' })

    expect(session.claimTarget()).toEqual({ ok: false, reason: 'spectacle' })
  })
})

describe('trashClaimedTarget', () => {
  it('awaits the recycle-bin operation for a target session', async () => {
    const trashed: string[] = []
    const session = new DeletionSession({ mode: 'target', targetPath: 'C:\\Temp\\old.txt' })

    const result = await trashClaimedTarget(session, async (targetPath) => {
      trashed.push(targetPath)
    })

    expect(result).toEqual({ ok: true })
    expect(trashed).toEqual(['C:\\Temp\\old.txt'])
  })

  it('rejects a spectacle session without calling the recycle bin', async () => {
    let called = false
    const session = new DeletionSession({ mode: 'spectacle' })

    const result = await trashClaimedTarget(session, async () => {
      called = true
    })

    expect(result).toEqual({ ok: false, error: '表演模式没有可删除的目标' })
    expect(called).toBe(false)
  })

  it('returns the recycle-bin error message', async () => {
    const session = new DeletionSession({ mode: 'target', targetPath: 'C:\\Temp\\locked.txt' })

    const result = await trashClaimedTarget(session, async () => {
      throw new Error('Access denied')
    })

    expect(result).toEqual({ ok: false, error: 'Access denied' })
  })
})

