import {
  getFrameRect,
  getScaledFrameSize,
  normalizeFrameIndices,
  type FrameRect
} from './sprite-sheet'

const imageCache = new Map<string, Promise<HTMLImageElement>>()

export interface SpriteSheetOptions {
  columns?: number
  rows?: number
  targetHeight?: number
  frameIndices?: readonly number[]
}

export interface PlaybackOptions {
  fps?: number
  loop?: boolean
  onFrame?: (frameIndex: number) => void
}

export function preloadImage(source: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(source)
  if (cached) {
    return cached
  }

  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`无法加载图片：${source}`))
    image.src = source
  })

  imageCache.set(source, pending)
  return pending
}

export class SpritePlayer {
  private image: HTMLImageElement | null = null
  private frameRects: FrameRect[] = []
  private frameIndices: number[] = []
  private frameHandle: number | null = null
  private playbackToken = 0
  private playbackResolve: (() => void) | null = null
  private destinationWidth = 0
  private destinationHeight = 0
  private flipped = false
  private x = 0
  private y = 0

  constructor(private readonly canvas: HTMLCanvasElement) {}

  get width(): number {
    return this.destinationWidth
  }

  get height(): number {
    return this.destinationHeight
  }

  get position(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  async load(source: string, options: SpriteSheetOptions = {}): Promise<void> {
    this.stop()
    this.image = await preloadImage(source)

    const columns = options.columns ?? 5
    const rows = options.rows ?? 3
    const frameCount = columns * rows
    this.frameRects = Array.from({ length: frameCount }, (_, index) =>
      getFrameRect(this.image!.naturalWidth, this.image!.naturalHeight, columns, rows, index)
    )
    this.frameIndices = normalizeFrameIndices(frameCount, options.frameIndices)

    if (this.frameIndices.length === 0) {
      throw new Error(`精灵图没有可播放帧：${source}`)
    }

    const firstFrame = this.frameRects[this.frameIndices[0]]
    const destination = getScaledFrameSize(firstFrame, options.targetHeight ?? 250)
    this.destinationWidth = destination.width
    this.destinationHeight = destination.height

    const scale = window.devicePixelRatio || 1
    this.canvas.width = Math.round(destination.width * scale)
    this.canvas.height = Math.round(destination.height * scale)
    this.canvas.style.width = `${destination.width}px`
    this.canvas.style.height = `${destination.height}px`

    const context = this.canvas.getContext('2d')
    if (!context) {
      throw new Error('当前系统无法创建 Canvas 2D 上下文')
    }
    context.setTransform(scale, 0, 0, scale, 0, 0)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    this.draw(this.frameIndices[0])
  }

  setFlip(flipped: boolean): void {
    this.flipped = flipped
  }

  setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
    this.canvas.style.left = `${x}px`
    this.canvas.style.top = `${y}px`
  }

  show(): void {
    this.canvas.hidden = false
  }

  hide(): void {
    this.canvas.hidden = true
  }

  stop(): void {
    this.playbackToken += 1
    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle)
      this.frameHandle = null
    }
    this.playbackResolve?.()
    this.playbackResolve = null
  }

  play(options: PlaybackOptions = {}): Promise<void> {
    this.stop()
    const token = this.playbackToken
    const fps = options.fps ?? 8
    const loop = options.loop ?? false
    const frameDuration = 1000 / fps
    let sequenceIndex = 0
    let previousTime = performance.now()

    this.draw(this.frameIndices[sequenceIndex])
    options.onFrame?.(this.frameIndices[sequenceIndex])

    return new Promise((resolve) => {
      this.playbackResolve = resolve

      const finish = (): void => {
        if (this.playbackResolve === resolve) {
          this.playbackResolve = null
        }
        this.frameHandle = null
        resolve()
      }

      const tick = (time: number): void => {
        if (token !== this.playbackToken) {
          finish()
          return
        }

        if (time - previousTime >= frameDuration) {
          previousTime = time
          sequenceIndex += 1

          if (sequenceIndex >= this.frameIndices.length) {
            if (!loop) {
              finish()
              return
            }
            sequenceIndex = 0
          }

          const frameIndex = this.frameIndices[sequenceIndex]
          this.draw(frameIndex)
          options.onFrame?.(frameIndex)
        }

        this.frameHandle = requestAnimationFrame(tick)
      }

      this.frameHandle = requestAnimationFrame(tick)
    })
  }

  private draw(frameIndex: number): void {
    if (!this.image) {
      return
    }

    const frame = this.frameRects[frameIndex]
    const context = this.canvas.getContext('2d')
    if (!context) {
      return
    }

    context.clearRect(0, 0, this.destinationWidth, this.destinationHeight)
    context.save()
    if (this.flipped) {
      context.translate(this.destinationWidth, 0)
      context.scale(-1, 1)
    }
    context.drawImage(
      this.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      0,
      0,
      this.destinationWidth,
      this.destinationHeight
    )
    context.restore()
  }
}

