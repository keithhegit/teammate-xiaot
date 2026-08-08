import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'

import { createContextMenuEntries, createRegistryOperations } from './context-menu'
import { DeletionSession, trashClaimedTarget } from './deletion-session'
import { parseLaunchArgs } from './launch'
import { createOverlayWindowOptions } from './window-options'
import { IPC_CHANNELS } from '../shared/api'

const execFileAsync = promisify(execFile)
const launchSession = parseLaunchArgs(process.argv)
const deletionSession = new DeletionSession(launchSession)

let overlayWindow: BrowserWindow | null = null

async function registerExplorerContextMenu(): Promise<void> {
  if (process.platform !== 'win32') {
    return
  }

  const entries = createContextMenuEntries({
    executablePath: process.execPath,
    appPath: app.getAppPath(),
    packaged: app.isPackaged
  })

  for (const operation of createRegistryOperations(entries)) {
    await execFileAsync('reg.exe', operation, { windowsHide: true })
  }
}

function closeOverlay(): void {
  overlayWindow?.close()
}

function createOverlayWindow(): BrowserWindow {
  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)
  const preloadPath = join(__dirname, '../preload/index.js')
  const window = new BrowserWindow(createOverlayWindowOptions(display.bounds, preloadPath))

  window.setAlwaysOnTop(true, 'screen-saver')
  window.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      event.preventDefault()
      closeOverlay()
    }
  })

  window.once('ready-to-show', () => {
    window.show()
    window.focus()
  })

  window.on('closed', () => {
    overlayWindow = null
    app.quit()
  })

  const rendererUrl = process.env.ELECTRON_RENDERER_URL
  if (rendererUrl) {
    void window.loadURL(rendererUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

ipcMain.handle(IPC_CHANNELS.getSession, () => launchSession)
ipcMain.handle(IPC_CHANNELS.trashTarget, () =>
  trashClaimedTarget(deletionSession, (targetPath) => shell.trashItem(targetPath))
)
ipcMain.on(IPC_CHANNELS.closeOverlay, closeOverlay)

app.whenReady().then(async () => {
  try {
    await registerExplorerContextMenu()
  } catch (error) {
    console.error('Failed to register Explorer context menu:', error)
  }

  overlayWindow = createOverlayWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

