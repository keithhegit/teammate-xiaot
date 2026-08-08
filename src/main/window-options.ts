import type { BrowserWindowConstructorOptions, Rectangle } from 'electron'

export function createOverlayWindowOptions(
  bounds: Rectangle,
  preloadPath: string
): BrowserWindowConstructorOptions {
  return {
    ...bounds,
    title: 'MonsterDeleter',
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  }
}

