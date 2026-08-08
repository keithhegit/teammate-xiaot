export type LaunchSession =
  | { mode: 'target'; targetPath: string }
  | { mode: 'spectacle' }

export function parseLaunchArgs(argv: readonly string[]): LaunchSession {
  if (argv.includes('--spectacle')) {
    return { mode: 'spectacle' }
  }

  const targetFlagIndex = argv.indexOf('--target')
  const targetPath = argv[targetFlagIndex + 1]
  if (targetFlagIndex >= 0 && targetPath && !targetPath.startsWith('--')) {
    return { mode: 'target', targetPath }
  }

  return { mode: 'spectacle' }
}

