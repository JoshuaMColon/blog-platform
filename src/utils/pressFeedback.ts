/**
 * Adds a `data-pressed` attribute to the interactive element under a finger,
 * pen or mouse while it is held down. CSS :active is unreliable on touch
 * (iOS Safari and some Android browsers skip or delay it), so the press style
 * keys off both :active and [data-pressed].
 */
const INTERACTIVE =
  'button, a[href], summary, [role="button"], input[type="submit"], input[type="button"], label[for]'

export const installPressFeedback = () => {
  let pressed: Element | null = null

  const release = () => {
    pressed?.removeAttribute('data-pressed')
    pressed = null
  }

  document.addEventListener(
    'pointerdown',
    e => {
      if (e.button !== 0) return
      const el = (e.target as Element | null)?.closest?.(INTERACTIVE)
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return
      release()
      pressed = el
      el.setAttribute('data-pressed', '')
    },
    { passive: true },
  )
  for (const type of ['pointerup', 'pointercancel', 'dragstart', 'blur'] as const) {
    window.addEventListener(type, release, { passive: true, capture: true })
  }
  document.addEventListener('scroll', release, { passive: true, capture: true })
  // iOS Safari only applies :active styles once a touchstart listener exists.
  document.addEventListener('touchstart', () => {}, { passive: true })
}
