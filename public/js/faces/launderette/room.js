// THE ROOM. Humming tubes (one of them dims, never more than once every four seconds), a window onto the
// real sky (noon outside a 3:33 a.m. interior is quietly wrong; at night the real moon hangs in it), a clock
// that has said 3:33 since 1996, a floor laid a magic number off true, lint that gathers while you stay, the
// machine at the back that is always nearly done, the change machine (a coin in the slot summons the sound)
// and a stack of dryers tumbling the other faces' styles.
import { h } from '../../lib/dom.js'
import { verse, planetName } from '../../lib/scripture.js'
import { FACE_NAMES, faceInfo } from '../../lib/faces.js'
import { DRYER_SHEETS, ENDLESS, SAYS } from './lore.js'
import { s, moonPath, f2, pad, segDisplay } from './life.js'

// ── What the window sees ───────────────────────────────────────────────────────────────────────────────
export function outsideOf(sky) {
  const t = sky.hour + sky.minute / 60
  return t >= 22 || t < 5 ? 'night' : t < 7 ? 'dawn' : t < 17 ? 'day' : t < 20 ? 'dusk' : 'evening'
}
const SKIES = {
  night: ['#03050d', '#0a1330', '#17234c'],
  dawn: ['#262150', '#9b5a7c', '#f0a46c'],
  day: ['#3a84d4', '#8cc1ee', '#dcf0fb'],
  dusk: ['#29295a', '#bf5d5b', '#f4a85b'],
  evening: ['#0b0e30', '#24275c', '#4e3b6c'],
}

export function makeWindow(A, sky = A.ctx.sky) {
  const { rng } = A
  const out = outsideOf(sky)
  const dark = out === 'night' || out === 'evening'
  const [c0, c1, c2] = SKIES[out]
  const W = 400
  const H = 170
  const grad = s('linearGradient', { id: 'lnd-sky-grad', x1: 0, y1: 0, x2: 0, y2: 1 },
    s('stop', { offset: 0, 'stop-color': c0 }), s('stop', { offset: 0.62, 'stop-color': c1 }), s('stop', { offset: 1, 'stop-color': c2 }))
  const glow = s('radialGradient', { id: 'lnd-sky-glow' },
    s('stop', { offset: 0, 'stop-color': '#fff6cf', 'stop-opacity': 0.95 }), s('stop', { offset: 0.35, 'stop-color': '#ffe7a0', 'stop-opacity': 0.5 }), s('stop', { offset: 1, 'stop-color': '#ffe7a0', 'stop-opacity': 0 }))
  const lamp = s('radialGradient', { id: 'lnd-sky-lamp' },
    s('stop', { offset: 0, 'stop-color': '#ffb347', 'stop-opacity': 0.75 }), s('stop', { offset: 1, 'stop-color': '#ffb347', 'stop-opacity': 0 }))
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid slice', class: 'lnd-sky', 'aria-hidden': 'true', focusable: 'false' },
    s('defs', {}, grad, glow, lamp),
    s('rect', { width: W, height: H, fill: 'url(#lnd-sky-grad)' }))

  // Stars, only when it is dark enough. Three of them are allowed to twinkle.
  if (dark || out === 'dawn') {
    const n = out === 'dawn' ? 9 : 34
    for (let i = 0; i < n; i++) {
      svg.append(s('circle', { cx: f2(rng.float(4, W - 4)), cy: f2(rng.float(3, H * 0.62)), r: f2(rng.float(0.35, 1.15)), class: i < 3 ? 'lnd-star is-twinkle' : 'lnd-star', style: i < 3 ? `--tw:${f2(rng.float(3.5, 7))}s` : null }))
    }
  }
  // The moon, as it really is tonight. By day only a pale one, if it is bright enough to be seen.
  const moon = sky.moon
  const moonShown = !sky.has('new-moon') && (dark || out === 'dawn' || out === 'dusk' || moon.illumination > 0.35)
  if (moonShown) {
    const r = sky.has('full-moon') ? 17 : 13
    const mx = f2(rng.float(W * 0.58, W * 0.86))
    const my = f2(rng.float(28, 52))
    svg.append(s('g', { class: `lnd-moon${dark ? '' : ' is-pale'}`, transform: `translate(${mx} ${my})` },
      s('circle', { r: r + 9, fill: 'url(#lnd-sky-glow)', opacity: dark ? 0.45 : 0.2 }),
      s('circle', { r, class: 'lnd-moon-dark' }),
      s('path', { d: moonPath(moon.phase, r), class: 'lnd-moon-lit' })))
  }
  // The sun, by day. On the day of an eclipse it is covered.
  if (out === 'day' || out === 'dawn' || out === 'dusk') {
    const sx = out === 'dawn' ? W * 0.16 : out === 'dusk' ? W * 0.8 : W * 0.3
    const sy = out === 'day' ? 34 : H * 0.6
    const eclipse = sky.has('eclipse')
    svg.append(s('g', { class: `lnd-sun${eclipse ? ' is-eclipsed' : ''}`, transform: `translate(${f2(sx)} ${f2(sy)})` },
      s('circle', { r: 42, fill: 'url(#lnd-sky-glow)' }),
      s('circle', { r: 13, class: 'lnd-sun-disc' }),
      eclipse ? s('circle', { r: 12.4, class: 'lnd-sun-moon' }) : null))
  }
  // Rooftops across the road, and a few windows still awake.
  let x = -4
  let d = `M-4 ${H}`
  const lit = []
  while (x < W + 4) {
    const w = rng.int(26, 64)
    const top = H - rng.int(26, 66)
    d += ` L${x} ${top} L${x + w} ${top}`
    if (rng.chance(0.3)) d += ` L${x + w * 0.5} ${top - rng.int(6, 14)}`
    if (dark || out === 'dawn') {
      for (let k = 0; k < 2; k++) if (rng.chance(0.35)) lit.push([x + rng.int(4, Math.max(5, w - 10)), top + rng.int(8, 20)])
    }
    x += w
  }
  d += ` L${W + 4} ${H} Z`
  svg.append(s('path', { d, class: 'lnd-roofs' }))
  for (const [lx, ly] of lit.slice(0, 7)) svg.append(s('rect', { x: lx, y: ly, width: 4, height: 5, class: 'lnd-litwin' }))
  // A street lamp, burning sodium when it is dark.
  const px = f2(rng.float(W * 0.06, W * 0.2))
  svg.append(s('g', { class: `lnd-lamp${dark || out === 'dawn' ? ' is-on' : ''}`, transform: `translate(${px} 0)` },
    s('circle', { cx: 9, cy: 60, r: 34, fill: 'url(#lnd-sky-lamp)', class: 'lnd-lamp-glow' }),
    s('path', { d: `M0 ${H} L0 58 Q0 52 8 52 L14 52`, class: 'lnd-lamp-pole' }),
    s('rect', { x: 8, y: 52, width: 10, height: 4, rx: 1.5, class: 'lnd-lamp-head' })))

  // With no moon and no daylight the glass gives the room back: the tubes, reflected.
  const mirror = sky.has('new-moon') && dark
  const moonWords = sky.has('new-moon')
    ? (mirror ? 'there is no moon tonight; the glass is only a mirror' : 'the moon is new; there is none to see')
    : `the moon is ${moon.name}, ${Math.round(moon.illumination * 100)}% lit`
  const ph = sky.planetaryHour
  const caption = h('p', { class: 'lnd-window-caption' },
    h('span', {}, out === 'day' ? 'Daylight outside, which is wrong.' : out === 'night' ? 'Night outside, which is right.' : `It is ${out} outside.`),
    ' ', h('span', {}, `${moonWords[0].toUpperCase()}${moonWords.slice(1)}.`),
    ' ', h('span', {}, `Hour of ${ph.glyph} ${planetName(ph.planet)}.`))
  const el = h('figure', { class: `lnd-window is-${out}${mirror ? ' is-mirror' : ''}` },
    h('div', { class: 'lnd-pane' }, svg,
      mirror ? h('span', { class: 'lnd-reflection', 'aria-hidden': 'true' }) : null,
      h('p', { class: 'lnd-vinyl', 'aria-hidden': 'true' }, h('span', {}, 'LAUNDERETTE'), h('span', {}, 'OPEN ALL NIGHT · SERVICE WASH')),
      h('span', { class: 'lnd-glare', 'aria-hidden': 'true' })),
    h('figcaption', {}, caption))
  return { el, out }
}

// ── The tubes ──────────────────────────────────────────────────────────────────────────────────────────
export function makeTubes(A) {
  const { rng } = A
  const n = 3
  const dim = rng.int(0, n - 1)
  // One dip per period, and the period is never shorter than four seconds (CANON §9: no flashing). The room's
  // light dips with the same tube, so the period and its phase are set on the room (--dim-period, --dim-delay).
  const period = f2(rng.float(5.2, 9.4))
  const delay = f2(rng.float(0, period))
  const tubes = Array.from({ length: n }, (_, i) => h('span', { class: `lnd-fixture${i === dim ? ' is-dim' : ''}` }, h('i', { class: 'lnd-tube' })))
  const el = h('div', { class: 'lnd-ceiling', 'aria-hidden': 'true' }, tubes)
  return { el, period, vars: `--dim-period: ${period}s; --dim-delay: -${delay}s` }
}

// ── The clock that says 3:33 ───────────────────────────────────────────────────────────────────────────
export function makeClock(A) {
  const { ctx, life } = A
  const ticks = []
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    const r0 = i % 5 ? 41 : 37
    ticks.push(s('line', { x1: f2(Math.sin(a) * r0), y1: f2(-Math.cos(a) * r0), x2: f2(Math.sin(a) * 44), y2: f2(-Math.cos(a) * 44), class: i % 5 ? 'lnd-tick' : 'lnd-tick is-hour' }))
  }
  const nums = [12, 3, 6, 9].map((n, i) => s('text', { x: [0, 30, 0, -30][i], y: [-27, 0, 29, 0][i], class: 'lnd-clock-num', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(n)))
  const sec = ctx.clock().getSeconds()
  const svg = s('svg', { viewBox: '-50 -50 100 100', class: 'lnd-clock-face', 'aria-hidden': 'true', focusable: 'false' },
    s('circle', { r: 48, class: 'lnd-clock-rim' }), s('circle', { r: 45, class: 'lnd-clock-dial' }),
    ...ticks, ...nums,
    s('text', { y: 16, class: 'lnd-clock-brand', 'text-anchor': 'middle' }, 'EST. 1996'),
    s('line', { x1: 0, y1: 4, x2: 0, y2: -22, class: 'lnd-hand-h', transform: `rotate(${f2((3 + 33 / 60) * 30)})` }),
    s('line', { x1: 0, y1: 6, x2: 0, y2: -36, class: 'lnd-hand-m', transform: 'rotate(198)' }),
    s('g', { class: 'lnd-hand-s', style: `--sec: -${sec}s` }, s('line', { x1: 0, y1: 9, x2: 0, y2: -39 }), s('circle', { r: 2.2 })),
    s('circle', { r: 2.6, class: 'lnd-clock-pin' }))
  const real = h('span', { class: 'lnd-clock-real' })
  const paint = () => {
    const now = ctx.clock()
    const hh = now.getHours()
    const said = `outside it is ${pad(hh)}:${pad(now.getMinutes())}`
    if (hh % 12 === 3 && now.getMinutes() === 33) real.textContent = 'and, for once, so is the world'
    else real.textContent = hh === 3 ? `${said}, which is close` : said
  }
  paint()
  life.interval(paint, 20000)
  const el = h('figure', { class: 'lnd-clock' }, svg,
    h('figcaption', {}, h('span', { class: 'lnd-clock-said' }, 'It is 3:33 here.'), ' ', real))
  return { el }
}

// ── The floor, and the lint that gathers on it ───────────────────────────────────────────────────────
export function makeFloor(A) {
  const { ctx, life, rng } = A
  // The tiles sit off true by a magic number that changes each visit.
  const magic = rng.pick([7, 11, 13, 17, 19, 23, 29, 31, 37])
  const lint = h('div', { class: 'lnd-lint', 'aria-hidden': 'true' })
  const broom = h('button', { type: 'button', class: 'lnd-broom', hidden: true }, 'Sweep the lint')
  const el = h('div', { class: 'lnd-tiles', style: `--off: ${magic}px` },
    lint,
    h('p', { class: 'lnd-tiles-note' }, `floor laid ${magic}px off true, 1996`),
    broom)
  const pieces = []
  const MAX = 18
  const r = rng.fork('lint')
  function add() {
    const p = h('span', {
      class: 'lnd-fluff',
      style: `left: ${f2(r.float(1, 97))}%; top: ${f2(r.float(8, 70))}%; --s: ${r.int(7, 15)}px; rotate: ${r.int(0, 359)}deg`,
    })
    lint.append(p)
    pieces.push(p)
    broom.hidden = false
    broom.textContent = `Sweep the lint (${pieces.length})`
  }
  function gather() {
    if (!ctx.mercy?.on && !document.hidden && pieces.length < MAX) add()
    const rest = ctx.behavior?.restlessness ?? 0
    life.timeout(gather, r.int(14000, 26000) * (1 - 0.4 * rest))
  }
  life.timeout(gather, r.int(7000, 12000))
  function sweep() {
    if (!pieces.length) return
    const gone = pieces.splice(0)
    broom.hidden = true
    A.say(SAYS.lint)
    if (ctx.mercy?.on) { gone.forEach((p) => p.remove()); return }
    gone.forEach((p, i) => { p.style.setProperty('--i', String(i)); p.classList.add('is-swept') })
    life.timeout(() => gone.forEach((p) => p.remove()), 900)
  }
  life.on(lint, 'click', sweep)
  life.on(broom, 'click', sweep)
  return { el, magic, sweep, get count() { return pieces.length } }
}

// ── The machine at the back, always nearly done ─────────────────────────────────────────────────────
export function makeEndless(A) {
  const { life, rng } = A
  const seg = segDisplay('0:01')
  const holds = rng.pick(ENDLESS)
  const result = h('p', { class: 'lnd-endless-result', role: 'status' })
  const reach = h('button', { type: 'button', class: 'lnd-reach', disabled: true }, 'Reach inside')
  const inside = h('div', { class: 'lnd-endless-inside' }, h('span', { class: 'lnd-endless-shape', 'aria-hidden': 'true' }), reach)
  const door = h('div', { class: 'lnd-endless-door', 'aria-hidden': 'true' },
    h('div', { class: 'lnd-endless-glass' }, h('div', { class: 'lnd-endless-drum' }, h('i', { class: 'lnd-baffle' }), h('i', { class: 'lnd-baffle' }), h('i', { class: 'lnd-baffle' }), h('span', { class: 'lnd-endless-thing' }))))
  const el = h('article', { class: 'lnd-endless', 'aria-labelledby': 'lnd-endless-h', 'data-hell': 'spare' },
    h('div', { class: 'lnd-panel lnd-panel--old' },
      h('h3', { class: 'lnd-dymo lnd-dymo--black', id: 'lnd-endless-h' }, h('span', { class: 'lnd-nearly' }, 'NEARLY'), ' DONE'),
      h('span', { class: 'lnd-seg-wrap lnd-seg-wrap--green' }, seg.el)),
    h('div', { class: 'lnd-endless-bay' }, inside, door),
    h('p', { class: 'lnd-endless-note' }, h('span', { class: 'lnd-marker' }, 'PLEASE DO NOT OPEN.'), ' ', h('span', { class: 'lnd-marker' }, 'IT OPENS.')),
    h('p', { class: 'lnd-endless-since' }, 'Running since before you arrived. It has one minute left, as it always has.'),
    result)
  let breathing = false
  let finished = false
  life.on(reach, 'click', () => {
    if (finished) return
    result.textContent = `Inside, warm and folded: ${holds}`
    el.classList.add('is-found')
    A.onEndless?.(holds)
  })
  // At 108 seconds of stillness the door unlatches for one breath.
  function breathe(ms = 8000) {
    if (breathing || finished) return
    breathing = true
    el.classList.add('is-open')
    reach.disabled = false
    A.say(SAYS.breath)
    life.timeout(() => {
      breathing = false
      if (finished) return
      const hadFocus = document.activeElement === reach
      el.classList.remove('is-open')
      reach.disabled = true
      // A disabled button cannot keep the keyboard: hand it to the note on the door.
      if (hadFocus) {
        const note = el.querySelector('.lnd-endless-note')
        note?.setAttribute('tabindex', '-1')
        note?.focus({ preventScroll: true })
      }
      A.say(SAYS.shut)
    }, ms)
  }
  // The riddle solved: for the first time, it finishes.
  function finish(content) {
    finished = true
    breathing = false
    el.classList.add('is-open', 'is-finished')
    el.classList.remove('is-found')
    seg.set('End')
    reach.hidden = true
    inside.replaceChildren(content)
    el.querySelector('.lnd-endless-since').textContent = 'It has finished. Nobody here has seen it finish before.'
  }
  return { el, breathe, finish, get finished() { return finished }, holds }
}

// ── The change machine: a coin in the slot ─────────────────────────────────────────────────────────────
export function makeChanger(A) {
  const { ctx, life, rng } = A
  const receipts = h('ol', { class: 'lnd-receipts', reversed: true })
  const coin = h('span', { class: 'lnd-coin', 'aria-hidden': 'true' })
  const display = h('p', { class: 'lnd-changer-led', 'aria-hidden': 'true' }, 'INSERT COIN')
  const slot = h('button', { type: 'button', class: 'lnd-coinslot' }, h('span', { class: 'lnd-coinslot-mouth', 'aria-hidden': 'true' }), h('span', { class: 'lnd-coinslot-label' }, 'Put a coin in the slot'))
  const el = h('aside', { class: 'lnd-changer', 'aria-labelledby': 'lnd-changer-h' },
    h('h3', { class: 'lnd-changer-plate', id: 'lnd-changer-h' }, 'CHANGE', h('small', {}, 'tokens · soap · sound')),
    display, h('div', { class: 'lnd-changer-face' }, slot, coin),
    h('p', { class: 'lnd-changer-note' }, 'One coin wakes the machines\' voices. Each token comes with a receipt.'),
    receipts)
  let n = 0
  life.on(slot, 'click', () => {
    n++
    ctx.audio?.summon?.()
    coin.classList.remove('is-dropping')
    void coin.offsetWidth
    coin.classList.add('is-dropping')
    display.textContent = n === 1 ? 'THANK YOU' : `TOKEN ${n}`
    const v = verse(rng.fork(`receipt/${n}`), { fragmentChance: 0 })
    const ph = ctx.readSky?.().planetaryHour ?? ctx.sky.planetaryHour
    receipts.prepend(h('li', { class: 'lnd-receipt' },
      h('p', { class: 'lnd-receipt-head' }, `TOKEN No. ${pad(n, 3)} · ${ph.glyph}`),
      h('p', { class: 'lnd-receipt-verse' }, v.text),
      h('p', { class: 'lnd-receipt-ref' }, v.ref),
      h('p', { class: 'lnd-receipt-foot' }, 'THANK YOU · KEEP THIS RECEIPT')))
    while (receipts.children.length > 3) receipts.lastElementChild.remove()
    A.say(SAYS.coin)
    A.onCoin?.(n)
  })
  return { el, slot }
}

// ── The dryers, tumbling what the other faces wear ──────────────────────────────────────────────────────
export function makeDryers(A) {
  const { ctx, rng } = A
  const seen = new Set(ctx.memory?.get?.('facesSeen', []) ?? [])
  const faces = FACE_NAMES.filter((f) => f !== 'launderette')
  const dryers = faces.map((face, i) => {
    const known = seen.has(face)
    const lines = DRYER_SHEETS[face] ?? [`/* ${faceInfo(face)?.title ?? face} */`]
    const sheet = h('div', { class: `lnd-sheet${known ? '' : ' is-blank'}`, style: `--spin: ${f2(rng.float(5.5, 11))}s; --dir: ${rng.chance(0.5) ? 'normal' : 'reverse'}; --tilt: ${rng.int(-30, 30)}deg` },
      known ? h('code', {}, lines.join('\n')) : null)
    return h('li', { class: `lnd-dryer${known ? ' is-known' : ''}` },
      h('div', { class: 'lnd-dryer-glass', 'aria-hidden': 'true' }, sheet),
      h('p', { class: 'lnd-dryer-label' }, h('span', { class: 'lnd-dryer-no' }, `D${i + 1}`), ' ', known ? faceInfo(face)?.title ?? face : 'a blank sheet'),
      known ? h('p', { class: 'visually-hidden' }, `Tumbling: ${lines.join(' ')}`) : null)
  })
  const el = h('section', { class: 'lnd-dryers', 'aria-labelledby': 'lnd-dryers-h' },
    h('h2', { id: 'lnd-dryers-h', class: 'lnd-plate' }, 'Dryers'),
    h('p', { class: 'lnd-dryers-note' }, 'Each tumbles a little of another face\'s style. A face you have not met yet tumbles as a blank white sheet.'),
    h('ul', { class: 'lnd-dryer-stack' }, dryers))
  return { el }
}
