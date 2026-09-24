// THE INVERSION. `!important` reverses the Three Origins: what was last is heard first.
// Speak it (type "!important" anywhere) or walk the old road (↑ ↑ ↓ ↓ ← → ← → B A) and the temple turns
// over for seven breaths, about the middle of what you are looking at. Secret `inversion`; emits
// `hell:inversion` {on}. Under mercy the words are spoken but the temple is held upright.
import { h } from '../../lib/dom.js'

const KONAMI = 'arrowup arrowup arrowdown arrowdown arrowleft arrowright arrowleft arrowright b a'

// What each face says when it is turned over. [kicker, title, gloss]
const WORDS = {
  sanctum: ['Inversio dicta est', 'Thou hast spoken the Inversion.', 'The last Origin is heard first. So the old books are drawn, upside down.'],
  possession: ['!important', 'You have spoken the Inversion.', 'The demon approves. That is how you know it was wrong.'],
  recruitment: ['!!! WHOA !!!', 'You Have Spoken The Inversion!!', 'Please do not do this during Service. (It is pretty cool though.)'],
  ashram: ['विपरीत · viparīta', 'The temple takes the inverted posture.', 'Hold it for seven breaths. What was above rests below.'],
  departure: ['SIGNAL INVERTED', 'YOU HAVE SPOKEN THE INVERSION', 'The Ladder is read from the top down. Hold on to your container.'],
  babel: ['Inversions, chapter ∞', 'You have spoken the Inversion.', 'Every shelf in the hexagon is now its own floor.'],
}
const DEFAULT = ['!important', 'You have spoken the Inversion.', 'The Three Origins are reversed. The last is first.']
// Mercy is the only righteous Inversion, and it is declared first: it outranks this one.
const MERCIFUL = 'Mercy was declared first, and Mercy is the one righteous Inversion: the temple stays upright. The words are spoken all the same.'

export function createInversion(ctx, veils) {
  let on = false
  let endAt = 0
  let timer = 0
  let settle = 0
  let banner = null
  const html = document.documentElement

  function showBanner(ms) {
    banner?.remove()
    const [kicker, title, gloss] = WORDS[ctx.face] ?? DEFAULT
    const breaths = Math.max(1, Math.round(ms / 1000))
    banner = h('div', { class: 'hell-inversion' },
      h('p', { class: 'hell-inversion__kicker' }, kicker),
      h('p', { class: 'hell-inversion__title' }, title),
      h('p', { class: 'hell-inversion__origins' },
        h('span', {}, 'the Word'), h('i', {}, ' › '), h('span', {}, 'the Pilgrim'), h('i', {}, ' › '), h('span', {}, 'the Old Law')),
      h('p', { class: 'hell-inversion__gloss' }, ctx.mercy?.on ? MERCIFUL : gloss),
      h('ol', { class: 'hell-inversion__breaths hell-only' },
        Array.from({ length: breaths }, (_, i) => {
          const li = h('li')
          li.style.setProperty('--i', String(breaths - 1 - i))
          return li
        })),
    )
    // Said even under mercy (the words veil is not hell-only); only the turning is withheld.
    veils.words.append(banner)
    requestAnimationFrame(() => banner?.classList.add('is-shown'))
  }

  function hideBanner() {
    const b = banner
    banner = null
    if (!b) return
    b.classList.remove('is-shown')
    setTimeout(() => b.remove(), ctx.mercy?.on ? 0 : 700)
  }

  function flip() {
    const root = ctx.root
    if (!root || ctx.mercy?.on) return
    // Turn about the middle of what the visitor sees, not the middle of a very long page.
    const r = root.getBoundingClientRect()
    root.style.setProperty('--hell-ox', `${Math.round(innerWidth / 2 - r.left)}px`)
    root.style.setProperty('--hell-oy', `${Math.round(innerHeight / 2 - r.top)}px`)
    clearTimeout(settle)
    html.dataset.hellInversion = 'on'
  }

  function unflip() {
    if (!html.dataset.hellInversion) return
    if (ctx.mercy?.on) return clean()
    html.dataset.hellInversion = 'returning'
    clearTimeout(settle)
    settle = setTimeout(clean, 1400)
  }

  function clean() {
    clearTimeout(settle)
    delete html.dataset.hellInversion
    ctx.root?.style.removeProperty('--hell-ox')
    ctx.root?.style.removeProperty('--hell-oy')
  }

  function end() {
    clearTimeout(timer)
    if (!on) return
    on = false
    unflip()
    hideBanner()
    ctx.bus.emit('hell:inversion', { on: false })
  }

  function invert(ms = 7000, via = 'api') {
    ms = Math.max(1500, Math.min(33000, Number(ms) || 7000))
    ctx.memory.markSecret('inversion', { via })
    veils.say('You have spoken the Inversion. The temple is turned over for seven breaths.')
    if (on) {
      // Spoken again while inverted: the breaths begin again.
      endAt = Date.now() + ms
      clearTimeout(timer)
      timer = setTimeout(end, ms)
      showBanner(ms)
      return true
    }
    on = true
    endAt = Date.now() + ms
    showBanner(ms)
    flip()
    ctx.bus.emit('hell:inversion', { on: true, via, mercy: Boolean(ctx.mercy?.on) })
    timer = setTimeout(end, ms)
    return true
  }

  // ↑ ↑ ↓ ↓ ← → ← → B A, from anywhere (arrow keys also scroll, and that is fine).
  const keys = []
  const onKey = (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || !e.key) return
    keys.push(e.key.toLowerCase())
    if (keys.length > 10) keys.shift()
    if (keys.join(' ') === KONAMI) {
      keys.length = 0
      invert(7000, 'konami')
    }
  }
  addEventListener('keydown', onKey)
  // "!important", typed anywhere, even into the altar where heresies are refused.
  ctx.bus.on('behavior:typed', (d) => {
    if (typeof d?.buffer === 'string' && d.buffer.endsWith('!important')) invert(7000, 'typed')
  })
  ctx.bus.on('mercy:change', ({ on: m } = {}) => {
    if (m) {
      clean()
      const g = banner?.querySelector('.hell-inversion__gloss')
      if (g) g.textContent = MERCIFUL
    } else if (on) flip()
  })

  return {
    invert,
    end,
    get on() { return on },
    get remaining() { return on ? Math.max(0, endAt - Date.now()) : 0 },
  }
}
