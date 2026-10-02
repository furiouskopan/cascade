// THE ENVELOPE. Letters travelled inside an envelope of clay, rolled with the sender's seal and addressed
// on its face. Press and hold to crack it (or press it again and again); when the clay gives, the two
// halves fall away and the hour's letter to the king is there underneath.
import { h } from '../../lib/dom.js'
import { glyphText } from '../../lib/glyphs.js'
import { letterFor } from './letter.js'
import { s } from './life.js'

const HOLD_MS = 1400

export function buildEnvelope(O) {
  const { ctx, life, rng, say } = O
  let progress = 0
  let open = false
  let hold = null

  // A jagged split, shared by the two halves so that together they are whole.
  const split = []
  for (let k = 0; k <= 8; k++) split.push([Math.round(rng.float(43, 57) * 10) / 10, k * 12.5])
  const left = `polygon(0 0, ${split.map(([x, y]) => `${x}% ${y}%`).join(', ')}, 0 100%)`
  const right = `polygon(100% 0, ${split.map(([x, y]) => `${x}% ${y}%`).join(', ')}, 100% 100%)`

  const face = () => h('span', { class: 'om-env-face' },
    glyphText('to the king my lord', { className: 'om-env-address' }),
    h('span', { class: 'om-env-rolled' }),
    glyphText('your servant', { className: 'om-env-from' }))
  const a = h('span', { class: 'om-env-half om-env-half--a', 'aria-hidden': 'true', style: `clip-path:${left}` }, face())
  const b = h('span', { class: 'om-env-half om-env-half--b', 'aria-hidden': 'true', style: `clip-path:${right}` }, face())

  // Cracks radiate from where the thumb presses.
  const cracks = s('svg', { class: 'om-env-cracks', viewBox: '0 0 200 130', preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' })
  for (let i = 0; i < 6; i++) {
    let x = 100, y = 65
    let ang = (i / 6) * Math.PI * 2 + rng.float(-0.3, 0.3)
    const pts = [[x, y]]
    for (let k = 0; k < 6; k++) {
      ang += rng.float(-0.5, 0.5)
      const len = rng.float(8, 16)
      x += Math.cos(ang) * len
      y += Math.sin(ang) * len * 0.75
      pts.push([x, y])
    }
    const d = 'M' + pts.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(' L')
    cracks.append(s('path', { d, pathLength: 100, class: 'om-env-crack-lip' }),
      s('path', { d, pathLength: 100, class: 'om-env-crack' }))
  }

  const btn = h('button', { type: 'button', class: 'om-env-btn', 'aria-describedby': 'om-env-help' },
    a, b, cracks, h('span', { class: 'visually-hidden' }, 'Break the clay envelope: press and hold, or press it again and again.'))
  const letterH = h('h3', { id: 'om-letter-h', class: 'om-letter-h', tabindex: '-1' }, 'A letter to the king, for this hour')
  const letterBody = h('div', { class: 'om-letter-body' })
  const letter = h('article', { class: 'om-letter om-clay', 'aria-labelledby': 'om-letter-h', hidden: true }, letterH, letterBody)
  const stage = h('div', { class: 'om-env-stage', 'data-hell': 'spare' }, letter, btn)
  const el = h('section', { class: 'om-obj om-env', 'aria-labelledby': 'om-env-h' },
    h('h2', { id: 'om-env-h', class: 'om-obj-h' }, 'A letter in its envelope'),
    stage,
    h('p', { class: 'om-label', id: 'om-env-help' }, 'Letters travelled in envelopes of clay, rolled with the sender’s seal. Press and hold to crack it. Inside is this hour’s letter to the king.'))

  function paint() { btn.style.setProperty('--crack', progress.toFixed(3)) }

  function write() {
    const st = O.state?.() ?? {}
    const sky = ctx.readSky?.() ?? ctx.sky
    const x = {
      sky,
      width: document.documentElement.clientWidth || innerWidth,
      height: innerHeight,
      visits: Number(ctx.visit?.visits) || 1,
      holding: st.holding ?? 0,
      lit: st.lit ?? [],
    }
    const L = letterFor(ctx.rng.fork(`omens/letter/${sky.hour}`), x)
    letterBody.replaceChildren(...L.paras.map((p, i) => h('p', { class: i === 0 ? 'om-letter-p om-letter-p--open' : 'om-letter-p' }, p)))
  }

  function breakOpen(byKey) {
    if (open) return
    open = true
    progress = 1
    paint()
    write()
    letter.hidden = false
    stage.classList.add('is-open')
    life.timeout(() => { btn.hidden = true }, ctx.mercy?.on ? 0 : 1300)
    if (byKey) letterH.focus({ preventScroll: true })
    ctx.memory?.markSecret?.('omens-envelope', { face: 'omens' })
    say('The envelope cracks and falls away. The letter to the king is underneath.')
    O.onOpened?.()
  }

  function tick() {
    if (!hold || open) return
    const t = performance.now() - hold.t0
    const p = Math.min(1, hold.from + t / HOLD_MS)
    if (!ctx.mercy?.on) { progress = p; paint() }
    if (p >= 1) { hold = null; return breakOpen(false) }
    hold.timer = life.timeout(tick, 50)
  }
  const start = (e) => {
    if (open || hold) return
    if (e.button != null && e.button !== 0) return
    hold = { t0: performance.now(), from: progress, id: e.pointerId }
    btn.classList.add('is-held')
    hold.timer = life.timeout(tick, 50)
  }
  const stop = () => {
    if (!hold) return
    life.clear(hold.timer)
    if (!ctx.mercy?.on) progress = Math.min(1, hold.from + (performance.now() - hold.t0) / HOLD_MS)
    hold = null
    btn.classList.remove('is-held')
    paint()
  }
  life.on(btn, 'pointerdown', start)
  life.on(btn, 'pointerup', stop)
  life.on(btn, 'pointercancel', stop)
  life.on(btn, 'pointerleave', stop)
  life.on(btn, 'contextmenu', (e) => e.preventDefault())
  // From the keyboard (or a screen reader), each press cracks it a third of the way.
  life.on(btn, 'click', (e) => {
    if (open || e.detail > 0) return
    progress = Math.min(1, progress + 0.34)
    paint()
    if (progress >= 1) breakOpen(true)
  })
  paint()
  return { el, get open() { return open } }
}
