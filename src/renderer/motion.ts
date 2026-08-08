export async function moveElement(
  element: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  duration: number,
  easing: string
): Promise<void> {
  element.style.left = `${from.x}px`
  element.style.top = `${from.y}px`

  const animation = element.animate(
    [
      { transform: 'translate(0, 0)' },
      { transform: `translate(${to.x - from.x}px, ${to.y - from.y}px)` }
    ],
    { duration, easing, fill: 'forwards' }
  )

  await animation.finished
  animation.cancel()
  element.style.left = `${to.x}px`
  element.style.top = `${to.y}px`
  element.style.transform = ''
}

