// THE PRAYER WHEEL. A real 3D drum (24 CSS panels around a cylinder) that turns by drag or by key.
// Every full turn sends one prayer through the ritual (ctx.ritual.pray), paced so the heavens can hear.
// Sunwise (dragging to the left, clockwise seen from above) is the old way; widdershins also works,
// and the wheel says so. A mala of 108 beads counts your turns across every visit.
import { h } from '../../lib/dom.js'
import { glyphText } from '../../lib/glyphs.js'
import { SEEDS, TURN_VOICES, SCROLL } from './lore.js'
import { s, fmt, clamp } from './life.js'

const N = 24
const R = 84
const PW = 2 * R * Math.tan(Math.PI / N)
const TURN = Math.PI * 2
const FRICTION = 0.55 // per second, exponential
const PACE = 2200 // ms between prayers sent; the server allows 30 a minute

function drumStrip() {
  const cell = (cls, ...kids) => h('span', { class: cls }, ...kids)
  return h('div', { class: 'ash-strip' },
    h('div', { class: 'ash-strip-band ash-strip-band--top' },
      [0, 1, 2].map(() => cell('ash-strip-cell', glyphText('all style descends')))),
    h('div', { class: 'ash-strip-band ash-strip-band--mid' },
      ['om', 'lam', 'vam', 'ram', 'yam', 'ham'].map((k) => cell('ash-strip-cell', h('span', { lang: 'sa' }, SEEDS[k].deva)))),
    h('div', { class: 'ash-strip-band ash-strip-band--low' },
      [0, 1, 2, 3].map(() => cell('ash-strip-cell', glyphText('let it descend')))),
  )
}

function capSvg() {
  const g = s('svg', { viewBox: '-50 -50 100 100', 'aria-hidden': 'true', focusable: 'false' })
  let d = ''
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TURN
    const x = Math.sin(a), y = -Math.cos(a)
    const l = Math.sin(a - 0.32), m = -Math.cos(a - 0.32)
    const r2 = Math.sin(a + 0.32), q = -Math.cos(a + 0.32)
    d += `M${(x * 14).toFixed(2)} ${(y * 14).toFixed(2)} Q${(l * 34).toFixed(2)} ${(m * 34).toFixed(2)} ${(x * 44).toFixed(2)} ${(y * 44).toFixed(2)} Q${(r2 * 34).toFixed(2)} ${(q * 34).toFixed(2)} ${(x * 14).toFixed(2)} ${(y * 14).toFixed(2)}`
  }
  g.append(s('circle', { r: 47, class: 'ash-cap-rim' }), s('path', { d, class: 'ash-cap-lotus' }), s('circle', { r: 9, class: 'ash-cap-hub' }))
  return g
}

function malaSvg() {
  const g = s('svg', { viewBox: '-170 -46 340 92', class: 'ash-mala', 'aria-hidden': 'true', focusable: 'false' })
  const beads = []
  const ring = s('g', {})
  for (let i = 0; i < 108; i++) {
    // Bead 0 sits beside the guru bead at the front; the count runs sunwise.
    const a = Math.PI / 2 + ((i + 0.5) / 108) * TURN
    const x = Math.cos(a) * 150
    const y = Math.sin(a) * 30
    const b = s('circle', { cx: x.toFixed(2), cy: y.toFixed(2), r: (2.2 + (y + 30) / 60 * 1.4).toFixed(2), class: 'ash-bead' })
    beads.push(b)
    ring.append(b)
  }
  g.append(
    s('ellipse', { rx: 150, ry: 30, class: 'ash-mala-cord' }),
    ring,
    s('circle', { cx: 0, cy: 30, r: 5.2, class: 'ash-guru-bead' }),
    s('path', { d: 'M0 35 L-4 45 M0 35 L0 46 M0 35 L4 45', class: 'ash-tassel' }),
  )
  return { svg: g, beads }
}

export function buildWheel(A) {
  const { ctx, life, ticker } = A
  let total = Number(ctx.memory?.get?.('ashram.turns', 0)) || 0
  let visitTurns = 0
  let widdershins = 0
  let angle = 0 // radians, sunwise positive
  let omega = 0 // radians per second
  let hi = 0
  let lo = 0
  let queue = 0
  let sent = 0
  let sending = false
  let heard = Number(ctx.ritual?.state?.prayers) || null
  let lastSent = -Infinity // when this drum last sent a prayer; the choir echoes our own back to us
  let lastStranger = -Infinity

  const body = h('div', { class: 'ash-drum-body' })
  for (let i = 0; i < N; i++) {
    const panel = h('div', { class: 'ash-panel' }, drumStrip())
    panel.style.setProperty('--i', String(i))
    body.append(panel)
  }
  body.append(h('div', { class: 'ash-cap' }, capSvg()))
  const weight = h('div', { class: 'ash-weight', 'aria-hidden': 'true' }, h('span', { class: 'ash-chain' }), h('span', { class: 'ash-bob' }))
  body.append(weight)

  const drum = h('div', {
    class: 'ash-drum',
    role: 'button',
    tabindex: '0',
    'aria-label': 'Prayer wheel',
    'aria-describedby': 'ash-wheel-how',
  }, body)
  const { svg: malaEl, beads } = malaSvg()
  const scene = h('div', { class: 'ash-wheel-scene' },
    h('span', { class: 'ash-rod', 'aria-hidden': 'true' }, h('span', { class: 'ash-finial' })),
    drum,
    h('span', { class: 'ash-handle', 'aria-hidden': 'true' }),
    malaEl,
  )
  scene.style.setProperty('--R', `${R}px`)
  scene.style.setProperty('--pw', `${PW.toFixed(3)}px`)
  scene.style.setProperty('--N', String(N))

  const turnsEl = h('span', { class: 'ash-num' })
  const sentEl = h('span', { class: 'ash-num' })
  const heardEl = h('span', { class: 'ash-num' })
  const beadEl = h('span', { class: 'ash-num' })
  const onlineEl = h('span', { class: 'ash-num' })
  const voice = h('p', { class: 'ash-wheel-voice', 'aria-live': 'polite' })
  // What is wound inside the drum, as in the old wheels: one line, written over and over.
  const scroll = h('details', { class: 'ash-scroll' },
    h('summary', {}, 'What is written inside the drum'),
    h('div', { class: 'ash-scroll-body' },
      h('p', {}, `A scroll is wound tight around the axle. It holds one line, written ${SCROLL.times.toLocaleString('en-US')} times in the glyph script, and every turn of the drum counts as reading all of it aloud. The Cascade accepts this, in the same way it accepts a computed value in place of the declaration that produced it.`,
        h('span', { class: 'visually-hidden' }, ` The line reads: ${SCROLL.line}.`)),
      h('div', { class: 'ash-scroll-paper', 'aria-hidden': 'true' },
        Array.from({ length: 9 }, (_, i) => glyphText(Array(4).fill(SCROLL.line).join(' · '), { tag: 'span', className: `ash-scroll-line${i === 4 ? ' is-middle' : ''}` }))),
      h('p', { class: 'ash-scroll-css' }, h('code', {}, `.ash-drum::before { content: "${SCROLL.line}"; /* × ${SCROLL.times} */ }`)),
      h('p', { class: 'ash-scroll-note' }, 'The line is not secret. It is the only thing the Cascade has ever said. Copy the glyphs above and paste them anywhere; they will read as they were written.'),
    ),
  )
  const wallBox = h('div', { class: 'ash-wall', hidden: true })

  const el = h('section', { class: 'ash-wheel-sec', 'aria-labelledby': 'ash-wheel-title' },
    h('div', { class: 'ash-wheel-stage' }, scene),
    h('div', { class: 'ash-wheel-text' },
      h('header', { class: 'ash-sec-head' },
        h('p', { class: 'ash-sec-deva', lang: 'sa', 'aria-hidden': 'true' }, 'चक्र · मणि'),
        h('h2', { id: 'ash-wheel-title' }, 'The Prayer Wheel'),
      ),
      h('p', { id: 'ash-wheel-how', class: 'ash-lede' }, 'Drag the drum sideways, or focus it and use the arrow keys, Enter or Space. Every full turn carries one prayer to the Temple, where all the pilgrims’ prayers are counted together. The old wheels turn sunwise: drag to the left.'),
      h('dl', { class: 'ash-wheel-stats' },
        h('div', {}, h('dt', {}, 'turns this sitting'), h('dd', {}, turnsEl)),
        h('div', {}, h('dt', {}, 'prayers carried'), h('dd', {}, sentEl)),
        h('div', {}, h('dt', {}, 'bead of the mala'), h('dd', {}, beadEl)),
        h('div', {}, h('dt', {}, 'heard by the Temple'), h('dd', {}, heardEl)),
        h('div', {}, h('dt', {}, 'souls in the Cascade'), h('dd', {}, onlineEl)),
      ),
      voice,
      scroll,
      wallBox,
    ),
  )

  // ------------------------------------------------------------ painting
  function paintDrum() {
    body.style.transform = `rotateX(-14deg) rotateY(${(-angle * 180 / Math.PI).toFixed(2)}deg)`
    const swing = clamp(Math.abs(omega) * 9, 0, 62)
    weight.style.setProperty('--swing', `${swing.toFixed(1)}deg`)
  }
  function paintCounts() {
    turnsEl.textContent = fmt(visitTurns)
    sentEl.textContent = fmt(sent) + (queue ? ` (+${queue} rising)` : '')
    const bead = total % 108
    beadEl.textContent = `${bead === 0 && total ? 108 : bead} of 108`
    beads.forEach((b, i) => { b.classList.toggle('is-told', i < bead || (bead === 0 && total > 0)); b.classList.toggle('is-now', i === bead) })
    heardEl.textContent = heard == null ? '—' : fmt(heard)
    const online = Number(ctx.ritual?.state?.online)
    onlineEl.textContent = Number.isFinite(online) && online > 0 ? fmt(online) : '—'
  }
  function say(text) { voice.textContent = text }

  function paintWall() {
    const wall = ctx.ritual?.state?.wall
    const last = Array.isArray(wall) ? wall[wall.length - 1] : null
    const text = typeof last === 'string' ? last : last?.text
    if (!text) { wallBox.hidden = true; return }
    wallBox.hidden = false
    wallBox.replaceChildren(
      h('p', { class: 'ash-kicker' }, 'left on the wall by a stranger'),
      glyphText(String(text).slice(0, 80), { tag: 'p', className: 'ash-wall-text' }),
      h('p', { class: 'ash-wall-note' }, 'It is written in the glyph script. Copy it, and it will read as it was written.'),
    )
  }

  // ------------------------------------------------------------ prayers
  function turned(dir) {
    if (dir > 0) {
      visitTurns++
      total++
      ctx.memory?.set?.('ashram.turns', total)
      queue = Math.min(queue + 1, 12)
      if (total % 108 === 0) {
        say('The mala is complete: one hundred and eight turns. It begins again at the guru bead, as it always does.')
        ctx.memory?.markSecret?.('ashram-mala', { face: 'ashram', turns: total })
      } else if (queue >= 12) say('The wheel turns faster than the heavens can listen. The rest are kept in the drum until they can.')
      else if (TURN_VOICES[visitTurns]) say(TURN_VOICES[visitTurns])
    } else {
      widdershins++
      visitTurns++
      queue = Math.min(queue + 1, 12)
      say(widdershins === 1
        ? 'Widdershins. The prayer rises anyway; the Cascade is not petty about direction.'
        : `Widdershins again (${widdershins}). The old wheels turn the other way, but mercy covers it.`)
      if (widdershins === 3) ctx.hell?.whisper?.('widdershins')
    }
    paintCounts()
    flush()
  }

  async function flush() {
    if (sending || queue <= 0 || life.dead) return
    const ritual = ctx.ritual
    if (!ritual?.pray) {
      // No line to the Temple yet: the drum keeps them, and counts them as carried.
      sent += queue
      queue = 0
      paintCounts()
      return
    }
    sending = true
    lastSent = performance.now()
    queue--
    try {
      const res = await ritual.pray()
      if (res && res.ok === false) {
        queue = Math.min(queue + 1, 12)
        if (res.status === 429) say('The heavens ask for patience. The drum is keeping the rest.')
      } else {
        sent++
        const c = Number(res?.count ?? ritual.state?.prayers)
        if (Number.isFinite(c)) heard = Math.max(heard ?? 0, c)
      }
    } catch (e) {
      queue = Math.min(queue + 1, 12)
    }
    sending = false
    paintCounts()
  }
  life.interval(flush, PACE)

  function checkTurns() {
    const k = Math.floor(angle / TURN)
    while (k > hi) { hi++; turned(1) }
    while (k < lo) { lo--; turned(-1) }
  }

  // ------------------------------------------------------------ motion
  let spinning = false
  let unTick = null
  function spinLoop(dt) {
    if (!drag) {
      angle += omega * dt
      omega *= Math.exp(-FRICTION * dt)
      if (Math.abs(omega) < 0.02) omega = 0
    }
    paintDrum()
    checkTurns()
    if (!drag && omega === 0) stop()
  }
  function go() {
    if (spinning || ctx.mercy?.on) return
    spinning = true
    unTick = ticker.add(spinLoop)
  }
  function stop() {
    spinning = false
    unTick?.()
    unTick = null
  }
  life.add(stop)

  function push(v) {
    if (ctx.mercy?.on) {
      // Under mercy nothing moves on its own: a push is one whole turn, at once.
      angle = (Math.sign(v) > 0 ? Math.floor(angle / TURN) + 1 : Math.ceil(angle / TURN) - 1) * TURN + 0.001 * Math.sign(v)
      omega = 0
      paintDrum()
      checkTurns()
      return
    }
    omega = clamp(omega + v, -14, 14)
    go()
  }

  let drag = null
  life.on(drum, 'pointerdown', (e) => {
    if (e.button !== 0) return
    drag = { x: e.clientX, t: performance.now(), v: 0 }
    omega = 0
    drum.classList.add('is-held')
    try { drum.setPointerCapture(e.pointerId) } catch {}
    go()
  })
  life.on(drum, 'pointermove', (e) => {
    if (!drag) return
    const now = performance.now()
    const dx = e.clientX - drag.x
    const da = -dx / R // dragging left turns it sunwise
    angle += da
    const dt = Math.max(1, now - drag.t) / 1000
    drag.v = drag.v * 0.6 + (da / dt) * 0.4
    drag.x = e.clientX
    drag.t = now
    if (ctx.mercy?.on) { paintDrum(); checkTurns() }
  })
  const release = () => {
    if (!drag) return
    omega = ctx.mercy?.on ? 0 : clamp(drag.v, -14, 14)
    if (performance.now() - drag.t > 120) omega = 0 // it was let go, not thrown
    drag = null
    drum.classList.remove('is-held')
    if (!ctx.mercy?.on) go()
  }
  life.on(drum, 'pointerup', release)
  life.on(drum, 'pointercancel', release)
  life.on(drum, 'keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push(4.2) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); push(1.6) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); push(-1.6) }
  })

  // ------------------------------------------------------------ the Temple's numbers
  const onCount = (d) => {
    const c = Number(d?.count)
    if (Number.isFinite(c)) { heard = Math.max(heard ?? 0, c); paintCounts() }
  }
  life.bus(ctx.bus, 'server:prayer', (d) => {
    onCount(d)
    // Someone else, somewhere, turned a wheel or prayed at an altar. Say so, but not often. (Wait a
    // moment first: the choir may sing our own prayer back before the ritual says it was ours.)
    const c = Number(d?.count)
    if (!Number.isFinite(c) || performance.now() - lastStranger < 45000) return
    life.timeout(() => {
      const now = performance.now()
      if (now - lastSent < 4000 || now - lastStranger < 45000) return
      lastStranger = now
      say(`Somewhere another pilgrim has prayed. The drum felt it: the count is ${fmt(c)} now.`)
    }, 1500)
  })
  life.bus(ctx.bus, 'ritual:prayed', () => { lastSent = performance.now() })
  life.bus(ctx.bus, 'ritual:prayed', onCount)
  life.bus(ctx.bus, 'server:presence', () => paintCounts())
  // The face hears the choir before the ritual layer has written the message down; read it a beat later.
  life.bus(ctx.bus, 'server:wall', () => life.timeout(paintWall, 60))
  life.bus(ctx.bus, 'ritual:inscribed', () => life.timeout(paintWall, 60))
  life.bus(ctx.bus, 'temple:awake', () => {
    const p = Number(ctx.ritual?.state?.prayers)
    if (Number.isFinite(p)) heard = Math.max(heard ?? 0, p)
    paintCounts()
    paintWall()
  })
  life.bus(ctx.bus, 'mercy:change', ({ on }) => { if (on) { omega = 0; stop() } })
  // The ritual layer may load its state after we render; look again a little later.
  life.timeout(() => {
    const p = Number(ctx.ritual?.state?.prayers)
    if (Number.isFinite(p)) heard = Math.max(heard ?? 0, p)
    paintCounts()
    paintWall()
  }, 2500)

  paintDrum()
  paintCounts()
  say(total ? `The mala remembers ${fmt(total)} ${total === 1 ? 'turn' : 'turns'} from your earlier sittings.` : 'The drum is still. It has been waiting for a hand.')

  return { el }
}
