import { fileURLToPath } from 'node:url'

import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

const rendererRoot = fileURLToPath(new URL('./src/renderer', import.meta.url))
const publicAssets = fileURLToPath(new URL('./assets', import.meta.url))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    root: rendererRoot,
    publicDir: publicAssets
  }
})

