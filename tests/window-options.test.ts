import { describe, expect, it } from 'vitest'

import { createOverlayWindowOptions } from '../src/main/window-options'

describe('createOverlayWindowOptions', () => {
  it('creates a focusable transparent window on the selected display', () => {
    const options = createOverlayWindowOptions(
      { x: -1920, y: 0, width: 1920, height: 1080 },
      'C:\\app\\out\\preload\\index.js'
    )

    expect(options).toMatchObject({
      x: -1920,
      y: 0,
      width: 1920,
      height: 1080,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: 'C:\\app\\out\\preload\\index.js',
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
  })
})

