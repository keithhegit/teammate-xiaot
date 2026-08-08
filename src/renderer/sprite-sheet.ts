export interface FrameRect {
  x: number
  y: number
  width: number
  height: number
}

export function getFrameRect(
  sheetWidth: number,
  sheetHeight: number,
  columns: number,
  rows: number,
  frameIndex: number
): FrameRect {
  const frameCount = columns * rows
  if (frameIndex < 0 || frameIndex >= frameCount) {
    throw new RangeError(`Frame ${frameIndex} is outside a ${frameCount}-frame sheet`)
  }

  const width = sheetWidth / columns
  const height = sheetHeight / rows

  return {
    x: (frameIndex % columns) * width,
    y: Math.floor(frameIndex / columns) * height,
    width,
    height
  }
}

export function normalizeFrameIndices(
  frameCount: number,
  selected?: readonly number[]
): number[] {
  const indices = selected ?? Array.from({ length: frameCount }, (_, index) => index)
  return indices.filter((index) => index >= 0 && index < frameCount)
}

