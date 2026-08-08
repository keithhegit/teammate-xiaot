import { describe, expect, it } from 'vitest'

import { DeletionSession } from '../src/main/deletion-session'

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

