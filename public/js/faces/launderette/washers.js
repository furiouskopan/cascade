// THE MACHINES. Five front-loaders, each labelled with a CSS-wide keyword. A cycle really applies
// `all: <keyword>` to the garment in its drum: group by group as the drum turns (the dye runs, the seams let
// go, the colour bleeds...), then the whole immersion. The machine then prints a care label: the computed
// values before and after, as the browser itself reports them.
import { h } from '../../lib/dom.js'
import { glyphText } from '../../lib/glyphs.js'
import { WASHES, GROUPS, SAYS } from './lore.js'
import { segDisplay, mss } from './life.js'
import { dissolve, immerse, snapshot, trembling } from './garments.js'

const TIMING = {
  normal: { fill: 900, step: 650, rinse: 700, spin: 1700 },
  mercy: { fill: 160, step: 120, rinse: 120, spin: 100 },
}

export function makeWashers(A) {
  const { ctx, life, fast } = A
  const labels = makeLabels(A)
  const machines = WASHES.map((w, i) => build(w, i))
  const row = h('div', { class: 'lnd-row' }, machines.map((m) => m.el))
  const washedWith = new Set()

  function build(w, i) {
    const seg = segDisplay('-:--')
    const title = h('h3', { class: 'lnd-dymo', id: `lnd-m-${w.kw}` }, w.label)
    const led = h('span', { class: 'lnd-led', 'aria-hidden': 'true' })
    const panel = h('div', { class: 'lnd-panel' }, title, h('span', { class: 'lnd-seg-wrap' }, seg.el), led)
    const cloth = h('div', { class: 'lnd-cloth', 'aria-hidden': 'true' })
    const tumble = h('div', { class: 'lnd-tumble' }, cloth)
    const drum = h('div', { class: 'lnd-drum', 'aria-hidden': 'true' }, h('i', { class: 'lnd-baffle' }), h('i', { class: 'lnd-baffle' }), h('i', { class: 'lnd-baffle' }))
    const water = h('div', { class: 'lnd-water', 'aria-hidden': 'true' })
    const suds = h('div', { class: 'lnd-suds', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'))
    const ticker = h('p', { class: 'lnd-ticker', 'aria-hidden': 'true' })
    const glass = h('div', { class: 'lnd-glass' }, drum, water, tumble, suds, ticker)
    const door = h('div', { class: 'lnd-door' }, glass)
    const status = h('span', { class: 'visually-hidden', id: `lnd-m-${w.kw}-s` }, 'empty')
    const go = h('button', { type: 'button', class: 'lnd-go', 'aria-describedby': `lnd-m-${w.kw}-s` }, 'Load')
    // Shown only while a garment waits in the drum (launderette.css keeps its room, so the row stays level).
    const out = h('button', { type: 'button', class: 'lnd-out' }, 'take it out')
    const plastic = w.plastic
      ? h('div', { class: 'lnd-plastic', 'aria-hidden': 'true' }, h('span', { class: 'lnd-plastic-sticker' }, h('b', {}, 'NEW'), h('small', {}, 'since 2022'), h('small', {}, 'still in its plastic')))
      : null
    const el = h('article', { class: `lnd-washer lnd-washer--${w.kw}`, 'data-kw': w.kw, 'data-state': 'empty', 'aria-labelledby': title.id },
      panel,
      h('p', { class: 'lnd-wash' }, h('span', { class: 'lnd-wash-name' }, w.wash), h('code', {}, `all: ${w.kw}`)),
      door,
      h('div', { class: 'lnd-controls' }, go, out, status),
      h('span', { class: 'lnd-toe', 'aria-hidden': 'true' }),
      plastic)
    const m = { w, i, el, seg, cloth, tumble, glass, door, go, out, status, ticker, plastic, state: 'empty', garment: null }
    life.on(go, 'click', () => act(m))
    life.on(door, 'click', () => act(m))
    life.on(out, 'click', () => takeOut(m, true))
    return m
  }

  // ── What the main button means in each state ──────────────────────────────────────────────────────
  function paint(m) {
    const g = m.garment
    const held = A.hand.g
    m.el.dataset.state = m.state
    let text
    let busy = false
    if (m.state === 'empty') {
      text = held ? `Load ${held.short}` : 'Load'
      m.status.textContent = held ? `empty; you are holding ${held.name}` : 'empty'
      m.seg.set('-:--')
    } else if (m.state === 'loaded') {
      text = 'START'
      m.status.textContent = `${g.name} is in the drum`
      m.seg.set('PUSH')
    } else if (m.state === 'running' || m.state === 'self') {
      text = m.state === 'self' ? 'Washing nothing' : 'Washing'
      m.status.textContent = m.state === 'self' ? 'running by itself, empty' : `washing ${g.name}`
      busy = true
    } else if (m.state === 'done') {
      text = `Take out ${g.short}`
      m.status.textContent = `finished; ${g.name} is clean, by its own lights`
      m.seg.set('End')
    }
    m.go.textContent = text
    m.go.setAttribute('aria-disabled', String(busy))
  }
  const paintAll = () => machines.forEach(paint)

  function act(m) {
    if (m.state === 'empty') {
      const g = A.hand.g
      if (!g) {
        A.say(SAYS.empty)
        A.basket?.beckon()
        return
      }
      load(m, g)
    } else if (m.state === 'loaded') {
      start(m)
    } else if (m.state === 'done') {
      takeOut(m, true)
    } else {
      A.say(SAYS.busy)
    }
  }

  function load(m, g) {
    if (m.state !== 'empty' || g.where) return false
    A.hand.drop(true)
    m.cloth.append(g.el)
    g.where = m
    m.garment = g
    m.state = 'loaded'
    A.basket?.update(g)
    paintAll()
    A.say(SAYS.load(g.name, m.w.label))
    A.onLoad?.(m, g)
    return true
  }

  function takeOut(m, speak) {
    const g = m.garment
    if (!g || m.state === 'running') return
    m.garment = null
    m.state = 'empty'
    g.where = null
    A.basket?.home(g)
    m.ticker.textContent = ''
    paintAll()
    if (speak) A.say(SAYS.out(g.name))
  }

  // ── The cycle ─────────────────────────────────────────────────────────────────────────────────────
  async function start(m, { self = false, seconds = 0 } = {}) {
    if (m.state !== 'loaded' && !(self && m.state === 'empty')) return
    const g = self ? null : m.garment
    const kw = m.w.kw
    const T = { ...(ctx.mercy?.on ? TIMING.mercy : TIMING.normal) }
    if (fast) for (const k of Object.keys(T)) T[k] = Math.round(T[k] * 0.2)
    if (self && seconds) {
      // An empty machine that starts by itself runs its own long, slow programme.
      const k = (seconds * 1000) / (T.fill + T.step * GROUPS.length + T.rinse + T.spin)
      for (const key of Object.keys(T)) T[key] = Math.round(T[key] * k)
    }
    const total = T.fill + T.step * GROUPS.length + T.rinse + T.spin
    const began = performance.now()
    m.state = self ? 'self' : 'running'
    paint(m)
    const tick = () => m.seg.set(mss((total - (performance.now() - began)) / 1000))
    tick()
    const stopTick = life.interval(tick, 250)
    if (!self) A.say(SAYS.start(m.w.label))
    const before = g ? snapshot(g.el) : null
    // Whatever was ironed on before this wash is about to be unsaid by it.
    const ironed = g?.ironed?.length ? g.ironed.slice() : null

    const phase = (p) => { if (p) m.el.dataset.phase = p; else delete m.el.dataset.phase }
    phase('fill')
    if (!(await life.wait(T.fill))) return
    phase('wash')
    for (const grp of GROUPS) {
      if (g) {
        dissolve(g.el, grp.props, kw)
        m.ticker.textContent = `− ${grp.says}`
      } else {
        m.ticker.textContent = '· nothing ·'
      }
      if (!(await life.wait(T.step))) return
    }
    if (g) immerse(g.el, kw)
    m.ticker.textContent = `all: ${kw}`
    phase('rinse')
    if (!(await life.wait(T.rinse))) return
    phase('spin')
    if (!(await life.wait(T.spin))) return
    phase(null)
    stopTick()
    m.ticker.textContent = ''
    ctx.audio?.bell?.({ kind: 'gm', freq: 207.65, gain: 0.05, decay: 0.45 })

    if (self) {
      m.state = 'empty'
      paintAll()
      m.seg.set('End')
      life.timeout(() => { if (m.state === 'empty') m.seg.set('-:--') }, 4000)
      return
    }
    const after = snapshot(g.el)
    g.washes.push(kw)
    g.ironed = []
    m.state = 'done'
    paintAll()
    if (m.plastic && !m.plastic.classList.contains('is-torn')) m.plastic.classList.add('is-torn')
    washedWith.add(kw)
    labels.print({ m, g, before, after, ironed })
    A.say(SAYS.done(g.name, m.w.label))
    A.onWashed?.({ m, g, kw, before, after, every: washedWith.size === WASHES.length })
  }

  // A drop from the drag: the machine under the pointer, if it can take a garment.
  function machineAt(x, y) {
    const el = document.elementFromPoint(x, y)?.closest?.('.lnd-washer')
    return machines.find((m) => m.el === el) ?? null
  }

  // At 33 seconds of stillness a washer starts by itself: an empty one, if there is one.
  function selfStart(rng) {
    const idle = machines.filter((m) => m.state === 'empty')
    if (!idle.length) return null
    const m = rng.pick(idle)
    start(m, { self: true, seconds: 33 })
    return m
  }

  return { row, labels, machines, paint: paintAll, load, start, takeOut, machineAt, selfStart, byKw: (kw) => machines.find((m) => m.w.kw === kw) }
}

// ── The care labels ────────────────────────────────────────────────────────────────────────────────
function makeLabels(A) {
  const list = h('ol', { class: 'lnd-labels', reversed: true })
  const empty = h('p', { class: 'lnd-labels-empty' }, 'No labels yet. Wash something and the machine will print one here.')
  const el = h('section', { class: 'lnd-rail', 'aria-labelledby': 'lnd-rail-h', 'data-secrets-skip': '', 'data-hell': 'spare' },
    h('h2', { id: 'lnd-rail-h', class: 'lnd-plate' }, 'Care labels'),
    empty, list)
  let n = 0

  function print({ m, g, before, after, ironed }) {
    n++
    const kw = m.w.kw
    const rows = before.map((b, i) => {
      const a = after[i]
      const changed = b.value !== a.value
      return h('tr', { class: changed ? 'is-changed' : null },
        h('th', { scope: 'row' }, b.prop),
        h('td', { class: 'lnd-before' }, b.value),
        h('td', { class: 'lnd-after' }, a.value))
    })
    const changed = before.filter((b, i) => b.value !== after[i].value).length
    const was = (p) => before.find((r) => r.prop === p)?.value
    const now = (p) => after.find((r) => r.prop === p)?.value
    const notes = []
    if (g.stained && trembling(g.el)) {
      notes.push(h('p', { class: 'lnd-label-stamp' }, 'STAIN NOT REMOVED', h('small', {}, `animation-name: ${now('animation-name')}, before and after`)))
    }
    if (kw === 'initial' && g.tagName === 'div' && was('display') !== 'inline' && now('display') === 'inline') {
      notes.push(h('p', { class: 'lnd-label-note' }, `display: ${was('display')} → inline. "Block" was never its nature, only the Old Law's gift.`))
    }
    if (!changed) notes.push(h('p', { class: 'lnd-label-note' }, 'No change at all. It was already dressed in the Heaven this machine returns it to.'))
    if (ironed?.length) {
      notes.push(h('p', { class: 'lnd-label-note' }, `Came off in the wash: ${ironed.map(([p, v]) => `${p}: ${v}`).join('; ')}. It was ironed on first, and all: ${kw} was spoken after it.`))
    }
    notes.push(h('p', { class: 'lnd-label-note lnd-label-dir' }, `direction: ${now('direction')}. all never touches direction or unicode-bidi: no wash changes which way you read.`))
    const item = h('li', { class: `lnd-label lnd-label--${kw}` },
      h('header', {},
        h('p', { class: 'lnd-label-kicker' }, `Care label No. ${String(n).padStart(4, '0')} · ${g.heresy}`),
        h('h3', {}, `${g.name}, washed in ${m.w.label}`),
        h('p', { class: 'lnd-label-what' }, h('code', {}, `<${g.tagName}>`), ' · ', h('code', {}, `all: ${kw}`), ` · ${changed} of ${before.length} changed`)),
      h('table', {},
        h('caption', { class: 'visually-hidden' }, `Computed style of ${g.name} before and after all: ${kw}`),
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'property'), h('th', { scope: 'col' }, 'before'), h('th', { scope: 'col' }, 'after'))),
        h('tbody', {}, rows)),
      ...notes,
      h('p', { class: 'lnd-label-doctrine' }, m.w.doctrine),
      h('p', { class: 'lnd-label-marks' }, h('span', {}, 'care marks'), glyphText(kw.replace('-', ' '), { className: 'lnd-label-glyphs' })))
    list.prepend(item)
    while (list.children.length > 3) list.lastElementChild.remove()
    empty.hidden = true
    return item
  }

  return { el, print, get count() { return n } }
}
