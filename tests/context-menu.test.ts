import { describe, expect, it } from 'vitest'

import { createContextMenuEntries, createRegistryOperations } from '../src/main/context-menu'

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

  it('uses the stable portable launcher instead of the temporary extracted executable', () => {
    const entries = createContextMenuEntries({
      executablePath: 'C:\\Users\\Og\\AppData\\Local\\Temp\\portable\\MonsterDeleter.exe',
      portableExecutablePath: 'C:\\Users\\Og\\Downloads\\MonsterDeleter 1.0.0.exe',
      appPath: 'C:\\unused',
      packaged: true
    })

    expect(entries[0].command).toBe(
      '"C:\\Users\\Og\\Downloads\\MonsterDeleter 1.0.0.exe" --target "%1"'
    )
    expect(entries[2].command).toBe(
      '"C:\\Users\\Og\\Downloads\\MonsterDeleter 1.0.0.exe" --spectacle'
    )
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

describe('createRegistryOperations', () => {
  it('creates label, icon, and command writes for every menu entry', () => {
    const entries = createContextMenuEntries({
      executablePath: 'C:\\Apps\\MonsterDeleter.exe',
      appPath: 'C:\\unused',
      packaged: true
    })

    const operations = createRegistryOperations(entries)

    expect(operations).toHaveLength(9)
    expect(operations.slice(-3)).toEqual([
      [
        'ADD',
        'HKCU\\Software\\Classes\\Directory\\Background\\shell\\SummonMonster',
        '/ve',
        '/d',
        '召唤大将怪兽（表演模式）',
        '/f'
      ],
      [
        'ADD',
        'HKCU\\Software\\Classes\\Directory\\Background\\shell\\SummonMonster',
        '/v',
        'Icon',
        '/d',
        '"C:\\Apps\\MonsterDeleter.exe",0',
        '/f'
      ],
      [
        'ADD',
        'HKCU\\Software\\Classes\\Directory\\Background\\shell\\SummonMonster\\command',
        '/ve',
        '/d',
        '"C:\\Apps\\MonsterDeleter.exe" --spectacle',
        '/f'
      ]
    ])
  })
})
