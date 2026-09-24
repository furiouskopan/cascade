// Mercy. When on, all motion stops, nothing flashes and nothing moves on its own.
// On by default when the OS asks for reduced motion. Every layer must honour it (docs/CANON.md §9).
import { bus } from './bus.js'
import { memory } from './memory.js'

const media = matchMedia('(prefers-reduced-motion: reduce)')

export const mercy = {
  get on() {
    return document.documentElement.dataset.mercy === 'on'
  },
  set(on) {
    document.documentElement.dataset.mercy = on ? 'on' : 'off'
    memory.set('mercy', on)
    bus.emit('mercy:change', { on })
  },
  toggle() {
    mercy.set(!mercy.on)
  },
}

export function initMercy(params) {
  const stored = memory.get('mercy', null)
  const on = params.has('mercy') ? params.get('mercy') !== '0' : stored ?? media.matches
  document.documentElement.dataset.mercy = on ? 'on' : 'off'
  media.addEventListener('change', (e) => { if (memory.get('mercy', null) === null) mercy.set(e.matches) })
  const button = document.getElementById('mercy')
  if (button) {
    const sync = () => button.setAttribute('aria-pressed', String(mercy.on))
    sync()
    button.addEventListener('click', () => mercy.toggle())
    bus.on('mercy:change', sync)
  }
  return mercy
}
