import { describe, expect, it } from 'vitest'

import { createContextMenuEntries } from '../src/main/context-menu'

describe('createContextMenuEntries', () => {
  it('builds packaged file and folder commands with a target argument', () => {
    const entries = createContextMenuEntries({
      executablePath: 'C:\\Program Files\\MonsterDeleter\\MonsterDeleter.exe',
      appPath: 'C:\\unused',
      packaged: true
    })

    expect(entries[0].command).toBe(
      '"C:\\Program Files\\MonsterDeleter\\MonsterDeleter.exe" --target "%1"'
    )
    expect(entries[1].command).toBe(entries[0].command)
  })

  it('builds a safe spectacle-only background command', () => {
    const entries = createContextMenuEntries({
      executablePath: 'C:\\Apps\\MonsterDeleter.exe',
      appPath: 'C:\\unused',
      packaged: true
    })

    expect(entries[2]).toMatchObject({
      key: 'HKCU\\Software\\Classes\\Directory\\Background\\shell\\SummonMonster',
      label: '召唤大将怪兽（表演模式）',
      command: '"C:\\Apps\\MonsterDeleter.exe" --spectacle'
    })
    expect(entries[2].command).not.toContain('%1')
  })

  it('includes the project path when running through electron.exe', () => {
    const entries = createContextMenuEntries({
      executablePath: 'C:\\node_modules\\electron\\dist\\electron.exe',
      appPath: 'C:\\Projects\\Monster Deleter',
      packaged: false
    })

    expect(entries[0].command).toBe(
      '"C:\\node_modules\\electron\\dist\\electron.exe" "C:\\Projects\\Monster Deleter" --target "%1"'
    )
    expect(entries[2].command).toBe(
      '"C:\\node_modules\\electron\\dist\\electron.exe" "C:\\Projects\\Monster Deleter" --spectacle'
    )
  })
})

