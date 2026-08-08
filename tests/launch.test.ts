import { describe, expect, it } from 'vitest'

import { parseLaunchArgs } from '../src/main/launch'

describe('parseLaunchArgs', () => {
  it('reads an explicit target path', () => {
    expect(parseLaunchArgs(['electron.exe', '.', '--target', 'C:\\Temp\\old file.txt'])).toEqual({
      mode: 'target',
      targetPath: 'C:\\Temp\\old file.txt'
    })
  })

  it('reads spectacle mode', () => {
    expect(parseLaunchArgs(['MonsterDeleter.exe', '--spectacle'])).toEqual({ mode: 'spectacle' })
  })

  it('falls back to spectacle mode when --target has no value', () => {
    expect(parseLaunchArgs(['MonsterDeleter.exe', '--target'])).toEqual({ mode: 'spectacle' })
  })

  it('ignores unrelated Electron arguments', () => {
    expect(parseLaunchArgs(['electron.exe', '.', '--inspect=9229'])).toEqual({ mode: 'spectacle' })
  })

  it('prefers the safer spectacle mode when both modes are supplied', () => {
    expect(
      parseLaunchArgs(['MonsterDeleter.exe', '--target', 'C:\\Temp\\old.txt', '--spectacle'])
    ).toEqual({ mode: 'spectacle' })
  })
})

