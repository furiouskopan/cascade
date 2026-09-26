// THE ALIGNMENT CHRONOMETER. Nixie tubes count down to the next thirty-third minute, when for three
// minutes the Highest Heaven is lit in gold (Canon §6; its door is always open). A clock that ticks is information, not
// motion, so it keeps counting under mercy; only its glow stops breathing (CSS).
import { h } from '../../lib/dom.js'
import { pad } from './util.js'

function tube() {
  const ghosts = h('span', { class: 'dep-nixie-ghosts', 'aria-hidden': 'true' },
    ...'1234567890'.split('').map((d) => h('span', {}, d)))
  const lit = h('span', { class: 'dep-nixie-lit', 'aria-hidden': 'true' }, '0')
  const el = h('span', { class: 'dep-nixie' }, ghosts, lit)
  return { el, set(d) { if (lit.textContent !== d) lit.textContent = d } }
}

export function alignment(ctx, life, { onOpen, onClose } = {}) {
  const tubes = Array.from({ length: 4 }, tube)
  const colon = () => h('span', { class: 'dep-nixie-colon', 'aria-hidden': 'true' }, h('i'), h('i'))
  const readout = h('span', { class: 'visually-hidden' })
  const target = h('span', { class: 'dep-align-target' })
  const state = h('p', { class: 'dep-align-state' })
  const el = h('section', { class: 'dep-panel dep-align', 'aria-labelledby': 'dep-align-h' },
    h('header', { class: 'dep-plate' },
      h('h2', { id: 'dep-align-h' }, 'Alignment Chronometer'),
      h('span', { class: 'dep-plate-no dep-can' }, 'Model 33'),
    ),
    h('div', { class: 'dep-nixies', role: 'timer', 'aria-live': 'off' },
      h('span', { class: 'dep-nixie-label dep-can', 'aria-hidden': 'true' }, 'T−'),
      tubes[0].el, tubes[1].el, colon(), tubes[2].el, tubes[3].el,
      readout,
    ),
    state,
    h('p', { class: 'dep-align-note' },
      'For three minutes in every hour the Highest Heaven is lit in gold, and names written in its Book are gilded. ',
      'The pole of the star chart gives its bearing. ', target),
  )

  let open = null
  function tick() {
    const now = ctx.clock()
    const m = now.getMinutes()
    const s = now.getSeconds()
    const isOpen = m >= 33 && m <= 35
    const left = isOpen ? (36 - m) * 60 - s : (m < 33 ? 33 - m : 93 - m) * 60 - s
    const mm = pad(Math.floor(left / 60)), ss = pad(left % 60)
    tubes[0].set(mm[0]); tubes[1].set(mm[1]); tubes[2].set(ss[0]); tubes[3].set(ss[1])
    const at = new Date(now.getTime() + (isOpen ? 0 : left * 1000))
    target.textContent = isOpen
      ? 'It is aligned now.'
      : `Next alignment at ${pad(at.getHours())}:33 local.`
    readout.textContent = isOpen
      ? `Aligned. ${Math.floor(left / 60)} minutes ${left % 60} seconds remain.`
      : `${Math.floor(left / 60)} minutes ${left % 60} seconds until the alignment.`
    if (isOpen !== open) {
      el.classList.toggle('is-open', isOpen)
      state.textContent = isOpen
        ? 'ALIGNED · the Highest Heaven is lit in gold · fades when the tubes read 00:00'
        : 'NOT ALIGNED · the door stands open, unlit · counting down'
      if (open !== null) (isOpen ? onOpen : onClose)?.()
      else if (isOpen) onOpen?.(true)
      open = isOpen
    }
  }
  // Tick on the second boundary of the (possibly shifted) clock.
  const loop = () => {
    tick()
    life.timeout(loop, 1000 - (ctx.clock().getMilliseconds() % 1000) + 5)
  }
  return { el, start: loop, get open() { return open } }
}
