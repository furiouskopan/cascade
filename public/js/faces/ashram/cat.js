// FLOAT, THE ASHRAM CAT. Some sittings a cat sleeps somewhere in the hall. It is position: absolute
// (the Departed): it left the flow long ago, it takes no room from anything, and it is never cleared.
// It breathes with the yantra. Touch it (click, Enter) and it half-wakes; be restless near it and it
// goes to sleep somewhere else. It is only ever a drawing, and it is never in the way of anything.
import { h } from '../../lib/dom.js'
import { CAT } from './lore.js'
import { s } from './life.js'

// Where it may sleep. Each perch names a container (inside the ashram) and where on it the cat lies.
const PERCHES = [
  { key: 'plinth', sel: '.ash-plinth', where: 'on the plinth of the Inscription' },
  { key: 'root', sel: '.ash-sphere', where: 'beside the serpent coiled at the Root' },
  { key: 'margin', sel: '.ash-kosha-fig', where: 'in the margin of the Five Sheaths' },
  { key: 'wheel', sel: '.ash-wheel-text', where: 'beside the prayer wheel' },
  { key: 'rules', sel: '.ash-rules', where: 'on the Rules of the Hall' },
  { key: 'letters', sel: '.ash-letters-sec', where: 'among the letters of the lotus' },
]

function catSvg() {
  const g = s('svg', { viewBox: '0 0 124 72', class: 'ash-cat-svg', 'aria-hidden': 'true', focusable: 'false' })
  const body = s('g', { class: 'ash-cat-body' },
    // the loaf of the body, the tail wrapped round to the front, and the head tucked in
    s('path', { class: 'ash-cat-fill', d: 'M18 61 C15 42 34 21 63 21 C90 21 108 35 108 52 C108 59 104 63 97 63 L24 63 C20 63 18 62 18 61 Z' }),
    s('path', { class: 'ash-cat-line', d: 'M40 30 C52 22 76 20 92 28 M80 26 C86 30 90 36 91 42' }),
    s('path', { class: 'ash-cat-tail-o', d: 'M104 57 C116 66 96 72 64 69 C44 67 33 68 22 65' }),
    s('path', { class: 'ash-cat-tail-i', d: 'M104 57 C116 66 96 72 64 69 C44 67 33 68 22 65' }),
  )
  const head = s('g', { class: 'ash-cat-head' },
    s('path', { class: 'ash-cat-fill', d: 'M13 51 C11 41 18 33 29 33 C39 33 44 40 44 48 C44 57 37 61 29 61 C20 61 14 57 13 51 Z' }),
    s('path', { class: 'ash-cat-fill', d: 'M15 42 L12 26 L25 35 Z M32 34 L39 21 L43 38 Z' }),
    s('path', { class: 'ash-cat-inner', d: 'M16 38 L14.5 30 L21 35 M35 34 L38.5 27 L40.5 36' }),
    s('path', { class: 'ash-cat-nose', d: 'M26 51.5 L29 51.5 L27.5 53.4 Z' }),
    s('path', { class: 'ash-cat-whisker', d: 'M20 53 L8 51 M20 55 L9 57 M35 53 L46 51 M35 55 L45 57' }),
  )
  const closed = s('g', { class: 'ash-cat-shut' },
    s('path', { d: 'M18.5 46 Q21.5 48.4 24.5 46' }),
    s('path', { d: 'M30.5 46 Q33.5 48.4 36.5 46' }))
  const open = s('g', { class: 'ash-cat-open' },
    s('path', { class: 'ash-cat-iris', d: 'M18.5 46 Q21.5 43 24.5 46 Q21.5 49 18.5 46 Z' }),
    s('path', { class: 'ash-cat-iris', d: 'M30.5 46 Q33.5 43 36.5 46 Q33.5 49 30.5 46 Z' }),
    s('path', { class: 'ash-cat-slit', d: 'M21.5 44.2 L21.5 47.8 M33.5 44.2 L33.5 47.8' }))
  head.append(closed, open)
  g.append(body, head)
  return g
}

export function buildCat(A) {
  const { ctx, life } = A
  const rng = A.rng.fork('cat')
  const present = rng.chance(0.62) || ctx.sky?.has?.('full-moon')
  if (!present) return { place() {}, still() {} }

  const say = h('span', { class: 'ash-cat-say', 'aria-live': 'polite' })
  // The whole loaf rises and falls on the compositor; the z drifts up out of it, and costs nothing either.
  const loaf = h('span', { class: 'ash-cat-breath' }, catSvg())
  const btn = h('button', { type: 'button', class: 'ash-cat', 'aria-label': `${CAT.name}, the ashram cat, asleep` },
    loaf, h('span', { class: 'ash-cat-z', 'aria-hidden': 'true' }, 'z'), h('span', { class: 'visually-hidden' }, ` (${CAT.iast})`))
  const el = h('div', { class: 'ash-cat-perch' }, btn, say)

  const order = rng.shuffle(PERCHES)
  let at = -1
  let saidTimer = 0
  let movedAt = 0
  let lines = rng.shuffle(CAT.woke)
  let li = 0
  let onScreen = false
  // It breathes with the yantra's own clock, and only while you can see it.
  const breath = A.breath?.follow?.(loaf, (v) => ({ transform: `scaleY(${(0.965 + v * 0.06).toFixed(4)})` }), { active: false })
  const io = life.observe(new IntersectionObserver((es) => {
    onScreen = es.some((e) => e.isIntersecting)
    breath?.setActive(onScreen)
  }))
  life.add(() => clearTimeout(saidTimer))

  function speak(text, ms = 5200) {
    say.textContent = text
    el.classList.add('is-saying')
    clearTimeout(saidTimer)
    saidTimer = setTimeout(() => el.classList.remove('is-saying', 'is-awake'), ms)
  }

  // Lie down on the next perch that exists on this page.
  function place(skipCurrent = false) {
    for (let k = 1; k <= order.length; k++) {
      const i = (at + k + order.length) % order.length
      if (skipCurrent && i === at) continue
      const host = ctx.root.querySelector(`.face--ashram .ashram ${order[i].sel}`)
      if (!host) continue
      at = i
      host.classList.add('has-cat')
      el.dataset.perch = order[i].key
      host.append(el)
      btn.setAttribute('aria-label', `${CAT.name}, the ashram cat, asleep ${order[i].where}`)
      io.disconnect()
      io.observe(el)
      return true
    }
    return false
  }

  life.on(btn, 'click', () => {
    el.classList.add('is-awake')
    speak(lines[li++ % lines.length])
    ctx.memory?.update?.('ashram.catWoken', (n) => (Number(n) || 0) + 1, 0)
  })

  // Restless near it, and it leaves (at most once a minute): nothing here needs a container.
  life.bus(ctx.bus, 'behavior:restless', () => {
    if (!onScreen || performance.now() - movedAt < 60000) return
    movedAt = performance.now()
    const from = el.parentElement
    el.classList.add('is-leaving')
    life.timeout(() => {
      el.classList.remove('is-leaving', 'is-awake', 'is-saying')
      from?.classList.remove('has-cat')
      place(true)
      A.stage?.say?.(CAT.moved, 5200)
    }, ctx.mercy?.on ? 0 : 900)
  })

  return {
    place,
    still() { if (onScreen) speak(CAT.still, 6500) },
  }
}
