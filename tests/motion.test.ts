import { describe, expect, it } from 'vitest'

import { moveElement } from '../src/renderer/motion'

describe('moveElement', () => {
  it('cancels the filled transform before committing the final coordinates', async () => {
    let cancelled = false
    let keyframes: Keyframe[] | null = null
    const style = { left: '', top: '', transform: '' }
    const animation = {
      finished: Promise.resolve(),
      cancel: () => {
        cancelled = true
      }
    } as unknown as Animation
    const element = {
      style,
      animate: (frames: Keyframe[]) => {
        keyframes = frames
        return animation
      }
    } as unknown as HTMLElement

    await moveElement(element, { x: -140, y: 300 }, { x: 900, y: 300 }, 4500, 'ease-out')

    expect(keyframes).toEqual([
      { transform: 'translate(0, 0)' },
      { transform: 'translate(1040px, 0px)' }
    ])
    expect(cancelled).toBe(true)
    expect(style).toEqual({ left: '900px', top: '300px', transform: '' })
  })
})

