import './style.css'

import type { LaunchSession } from '../main/launch'
import type { TrashResult } from '../main/deletion-session'
import {
  getMonsterExitPosition,
  getMonsterSequencePositions,
  MONSTER_ANIMATIONS,
  MONSTER_APPROACH_DURATION_MS,
  MONSTER_EXIT_DURATION_MS,
  MONSTER_FPS,
  MONSTER_KICK_IMPACT_FRAME,
  MONSTER_POINT_ANCHOR
} from './monster-animations'
import { moveElement } from './motion'
import { preloadImage, SpritePlayer } from './sprite-player'

const assetUrl = (relativePath: string): string =>
  new URL(`./${relativePath}`, window.location.href).href

const IMAGES = {
  background: assetUrl('选择界面/选择界面.png'),
  walkingPointing: assetUrl(MONSTER_ANIMATIONS.approachAndPoint.source),
  kickingLeaving: assetUrl(MONSTER_ANIMATIONS.destroyAndLeave.source),
  explosion: assetUrl('爆炸_spritesheet_transparent.png')
} as const

const AUDIO = {
  bgm: assetUrl('音频/bgm(1).mp3'),
  voice: assetUrl('音频/怪兽说话.mp3'),
  explosion: assetUrl('音频/爆炸.MP4')
} as const

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`缺少界面元素：${id}`)
  }
  return element as T
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function createAudio(source: string, volume: number, loop = false): HTMLAudioElement {
  const audio = new Audio(source)
  audio.preload = 'auto'
  audio.volume = volume
  audio.loop = loop
  audio.load()
  return audio
}

function playAudio(audio: HTMLAudioElement): void {
  audio.pause()
  audio.currentTime = 0
  void audio.play().catch((error) => console.warn('Audio playback failed:', error))
}

const stage = requiredElement<HTMLElement>('stage')
const instruction = requiredElement<HTMLElement>('instruction')
const instructionTitle = requiredElement<HTMLElement>('instruction-title')
const instructionDetail = requiredElement<HTMLElement>('instruction-detail')
const reticle = requiredElement<HTMLElement>('reticle')
const monsterCanvas = requiredElement<HTMLCanvasElement>('monster-canvas')
const explosionCanvas = requiredElement<HTMLCanvasElement>('explosion-canvas')
const bubble = requiredElement<HTMLElement>('bubble')
const choices = requiredElement<HTMLElement>('choices')
const primaryButton = requiredElement<HTMLButtonElement>('confirm-primary')
const secondaryButton = requiredElement<HTMLButtonElement>('confirm-secondary')
const status = requiredElement<HTMLElement>('status')

const monster = new SpritePlayer(monsterCanvas)
const explosion = new SpritePlayer(explosionCanvas)
const bgm = createAudio(AUDIO.bgm, 0.5, true)
const voice = createAudio(AUDIO.voice, 1)
const explosionSound = createAudio(AUDIO.explosion, 0.3)

let launchSession: LaunchSession = { mode: 'spectacle' }
let sequenceStarted = false

async function prepareAnimationAssets(): Promise<void> {
  await Promise.all([
    preloadImage(IMAGES.walkingPointing),
    preloadImage(IMAGES.kickingLeaving),
    explosion.load(IMAGES.explosion, { targetHeight: 150 })
  ])
  explosion.hide()
}

document.documentElement.style.setProperty('--background-image', `url("${IMAGES.background}")`)
const animationAssetsReady = prepareAnimationAssets()
void animationAssetsReady.catch((error) => console.warn('Image preload failed:', error))

function updateReticle(event: MouseEvent): void {
  if (sequenceStarted) {
    return
  }
  reticle.style.left = `${event.clientX}px`
  reticle.style.top = `${event.clientY}px`
}

function waitForConfirmation(): Promise<void> {
  bubble.hidden = false
  choices.hidden = false

  return new Promise((resolve) => {
    const confirm = (): void => {
      primaryButton.removeEventListener('click', confirm)
      secondaryButton.removeEventListener('click', confirm)
      bubble.hidden = true
      choices.hidden = true
      resolve()
    }

    primaryButton.addEventListener('click', confirm)
    secondaryButton.addEventListener('click', confirm)
  })
}

function placeConfirmation(): void {
  const position = monster.position
  bubble.style.left = `${position.x + MONSTER_POINT_ANCHOR.x - 80}px`
  bubble.style.top = `${position.y + MONSTER_POINT_ANCHOR.y - 140}px`
  choices.style.left = `${position.x + MONSTER_POINT_ANCHOR.x - 130}px`
  choices.style.top = `${position.y + MONSTER_POINT_ANCHOR.y + 45}px`
}

async function playExplosion(target: { x: number; y: number }): Promise<void> {
  playAudio(explosionSound)
  explosion.setPosition(target.x - explosion.width / 2, target.y - explosion.height / 2 - 40)
  explosion.show()
  await explosion.play({ fps: MONSTER_FPS })
  explosion.hide()
}

async function runMonsterSequence(target: { x: number; y: number }): Promise<void> {
  await animationAssetsReady
  playAudio(bgm)

  await monster.load(IMAGES.walkingPointing, MONSTER_ANIMATIONS.approachAndPoint.sheet)
  const { start, approach } = getMonsterSequencePositions(target, monster.width)
  monster.setFlip(false)
  monster.setPosition(start.x, start.y)
  monster.show()

  const phaseOnePlayback = monster.play({ fps: MONSTER_FPS })
  const movement = moveElement(
    monsterCanvas,
    start,
    approach,
    MONSTER_APPROACH_DURATION_MS,
    'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  )
  await Promise.all([phaseOnePlayback, movement])
  monster.setPosition(approach.x, approach.y)

  playAudio(voice)
  placeConfirmation()
  await waitForConfirmation()

  await monster.load(IMAGES.kickingLeaving, MONSTER_ANIMATIONS.destroyAndLeave.sheet)
  let explosionTriggered = false
  let explosionTask: Promise<void> = Promise.resolve()
  let trashTask: Promise<TrashResult> = Promise.resolve({ ok: true })

  await monster.play({
    fps: MONSTER_FPS,
    onFrame: (frameIndex) => {
      if (frameIndex !== MONSTER_KICK_IMPACT_FRAME || explosionTriggered) {
        return
      }
      explosionTriggered = true
      explosionTask = playExplosion(target)
      if (launchSession.mode === 'target') {
        trashTask = window.monsterApi.trashTarget()
      }
    }
  })

  const exitStart = monster.position
  const exitEnd = getMonsterExitPosition(window.innerWidth, monster.width, exitStart.y)
  await moveElement(
    monsterCanvas,
    exitStart,
    exitEnd,
    MONSTER_EXIT_DURATION_MS,
    'cubic-bezier(0.7, 0, 0.84, 0)'
  )

  await explosionTask
  const trashResult = await trashTask
  bgm.pause()

  if (!trashResult.ok) {
    status.textContent = `没有删除任何内容：${trashResult.error}`
    status.hidden = false
    await delay(2800)
  }

  window.monsterApi.closeOverlay()
}

async function startAtTarget(event: MouseEvent): Promise<void> {
  if (sequenceStarted || event.button !== 0) {
    return
  }

  sequenceStarted = true
  document.body.classList.add('sequence-started')
  instruction.setAttribute('aria-hidden', 'true')
  const target = { x: event.clientX, y: event.clientY }

  await delay(500)
  try {
    await runMonsterSequence(target)
  } catch (error) {
    bgm.pause()
    status.textContent = `动画未能完成：${error instanceof Error ? error.message : String(error)}`
    status.hidden = false
    await delay(3200)
    window.monsterApi.closeOverlay()
  }
}

window.addEventListener('mousemove', updateReticle)
stage.addEventListener('mousedown', (event) => void startAtTarget(event))
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    window.monsterApi.closeOverlay()
  }
})

window.monsterApi
  .getSession()
  .then((session) => {
    launchSession = session
    if (session.mode === 'spectacle') {
      instructionTitle.textContent = '选择怪兽登场的位置'
      instructionDetail.textContent = '表演模式不会删除任何文件 · 按 Esc 退出'
    } else {
      instructionTitle.textContent = '请选择要摧毁的位置'
      instructionDetail.textContent = '目标会被移入回收站 · 按 Esc 退出'
    }
    requestAnimationFrame(() => document.body.classList.add('is-armed'))
  })
  .catch((error) => {
    status.textContent = `无法读取启动参数：${error instanceof Error ? error.message : String(error)}`
    status.hidden = false
    requestAnimationFrame(() => document.body.classList.add('is-armed'))
  })
