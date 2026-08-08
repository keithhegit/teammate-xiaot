import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const stylesheet = readFileSync(
  fileURLToPath(new URL('../src/renderer/style.css', import.meta.url)),
  'utf8'
)

describe('renderer cursor styles', () => {
  it('restores a visible pointer after the target position is chosen', () => {
    expect(stylesheet).toMatch(/body\.sequence-started\s*\{[^}]*cursor:\s*default\s*;/s)
  })
})
