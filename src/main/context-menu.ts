export interface ContextMenuBuildInput {
  executablePath: string
  appPath: string
  packaged: boolean
}

export interface ContextMenuEntry {
  key: string
  label: string
  command: string
  icon: string
}

export type RegistryOperation = string[]

function quoteWindowsArgument(value: string): string {
  return `"${value.replaceAll('"', '\\"')}"`
}

export function createContextMenuEntries(input: ContextMenuBuildInput): ContextMenuEntry[] {
  const executable = quoteWindowsArgument(input.executablePath)
  const application = input.packaged ? '' : ` ${quoteWindowsArgument(input.appPath)}`
  const launchPrefix = `${executable}${application}`
  const targetCommand = `${launchPrefix} --target "%1"`

  return [
    {
      key: 'HKCU\\Software\\Classes\\*\\shell\\SummonMonster',
      label: '召唤大将怪兽摧毁',
      command: targetCommand,
      icon: `${executable},0`
    },
    {
      key: 'HKCU\\Software\\Classes\\Directory\\shell\\SummonMonster',
      label: '召唤大将怪兽摧毁',
      command: targetCommand,
      icon: `${executable},0`
    },
    {
      key: 'HKCU\\Software\\Classes\\Directory\\Background\\shell\\SummonMonster',
      label: '召唤大将怪兽（表演模式）',
      command: `${launchPrefix} --spectacle`,
      icon: `${executable},0`
    }
  ]
}

export function createRegistryOperations(entries: readonly ContextMenuEntry[]): RegistryOperation[] {
  return entries.flatMap((entry) => [
    ['ADD', entry.key, '/ve', '/d', entry.label, '/f'],
    ['ADD', entry.key, '/v', 'Icon', '/d', entry.icon, '/f'],
    ['ADD', `${entry.key}\\command`, '/ve', '/d', entry.command, '/f']
  ])
}
