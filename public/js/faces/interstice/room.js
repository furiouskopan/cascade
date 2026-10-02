// THE INTERSTICE · one room, built as six CSS planes (floor, ceiling, two side walls, the far wall and one
// prop standing in the room), tinted like the Inspector's box-model overlay: the margin nearest you, dusty
// orange; a narrow band of sallow border; pale green padding; and the far wall, the content box, cold blue.
// Only the current room exists in the page (and, for the length of a step, the one you are leaving).
//
// The slot in the far wall is the room's own div, a real one: real margin, border and padding, painted the
// way the Inspector paints them, and no content, so its content box is 0 pixels high and the slot is shut
// to a hairline. In one room the slot holds a single text node, and the box opens around it.
import { h } from '../../lib/dom.js'
import { addressOf, stepName, keyOf, childCount, parentOf } from './world.js'

const DIR_WORD = { far: 'ahead', left: 'on your left', right: 'on your right' }
const BRAILLE_DIGITS = ['⠚', '⠁', '⠃', '⠉', '⠙', '⠑', '⠋', '⠛', '⠓', '⠊']
export const braille = (n) => `⠼${[...String(n)].map((d) => BRAILLE_DIGITS[d] ?? '').join('')}`

const pct = (x) => `${Math.round(x * 1000) / 10}%`
// Custom properties must be set one by one (style['--x'] = … is not a custom property).
export function setVars(el, map) {
  for (const [k, v] of Object.entries(map)) el.style.setProperty(k, String(v))
  return el
}
const px = (x) => `${Math.round(x)}px`

function svg(markup) {
  const t = document.createElement('template')
  t.innerHTML = markup.trim()
  return t.content.firstElementChild
}

// The fraction of each side wall's depth taken by the margin and the border bands, from the room's box.
function bands(box) {
  const m = 0.14 + (box.margin / 32) * 0.12
  const b = m + 0.012 + (box.border / 6) * 0.03
  return { m, b }
}

function doorLabel(e) {
  const where = e.home ? 'a doorway ahead, back to the temple' : `a doorway ${DIR_WORD[e.dir]}, to ${stepName(e.to)}`
  return `${where}${e.warm ? '; a little warmth comes through it' : ''}${e.grown ? '; it was not there before' : ''}`
}

// A doorway: a dark opening with a reveal, and through it a glimpse of the next room's box (its margin,
// border, padding and content, nested like the Inspector's diagram, which is what a room looks like from
// the door of the room before it).
function door(e, qs, extra = {}) {
  const href = e.home ? `/${qs}` : `${addressOf(e.to)}${qs}`
  const a = h('a', {
    class: `ix-door ix-door--${e.dir === 'far' ? 'far' : 'side'}${e.warm ? ' is-warm' : ''}${e.grown ? ' is-new' : ''}${e.home ? ' is-home' : ''}`,
    href,
    'data-to': e.home ? '/' : addressOf(e.to),
    'data-dir': e.dir,
    'aria-label': doorLabel(e),
    draggable: 'false',
    ...extra,
  },
  h('span', { class: 'ix-door-hole', 'aria-hidden': 'true' }, h('span', { class: 'ix-door-glimpse' })),
  h('span', { class: 'ix-door-plate', 'aria-hidden': 'true' }, h('span', { class: 'ix-plate-first' }, e.home ? '/' : String(e.n)), h('span', { class: 'ix-plate-last' }, e.home ? '/' : String(childCount(parentOf(e.to)) - e.n + 1))))
  return a
}

// The Passable: a doorway behind a wall that looks solid. The wall takes no pointer events (it is only
// painted on); the doorway behind it does. Your cursor finds it before your eye does, and so does Tab.
function hiddenDoor(p, qs) {
  return h('a', {
    class: 'ix-door ix-door--hidden',
    href: `${addressOf(p.to)}${qs}`,
    'data-to': addressOf(p.to),
    'data-dir': p.dir,
    'data-passage': '',
    'aria-label': `a wall that is not quite there; through it, ${stepName(p.to)}`,
    draggable: 'false',
  }, h('span', { class: 'ix-leak', 'aria-hidden': 'true' }))
}

function pencil(text, cls = '', style = {}) {
  return h('span', { class: `ix-pencil ${cls}`.trim(), 'aria-hidden': 'true', style }, text)
}

function damageEl(d) {
  return setVars(h('i', { class: `ix-dmg ix-dmg--${d.kind}`, 'aria-hidden': 'true' }), { '--x': pct(d.x), '--y': pct(d.y), '--s': d.s.toFixed(2) })
}

const CRACK = '<svg class="ix-crack" viewBox="0 0 100 60" aria-hidden="true" focusable="false"><path d="M2 4 L18 15 L14 24 L33 31 L29 40 L52 47 L61 58" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 31 L44 26" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/></svg>'

// A moon drawn from its phase (0 new, 0.5 full), lit limb to the right while waxing.
function moonPath(phase, r) {
  const p = ((phase % 1) + 1) % 1
  const k = Math.cos(p * 2 * Math.PI)
  const rx = Math.abs(k) * r
  const waxing = p < 0.5
  const crescent = k > 0
  const f = (n) => Math.round(n * 100) / 100
  const limb = waxing ? 1 : 0
  const term = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0)
  return `M0 ${f(-r)} A${f(r)} ${f(r)} 0 0 ${limb} 0 ${f(r)} A${f(rx)} ${f(r)} 0 0 ${term} 0 ${f(-r)} Z`
}

function windowEl(sky) {
  const moon = sky?.moon ?? { phase: 0.5, illumination: 1 }
  const night = sky?.has?.('night') || (sky?.hour ?? 23) >= 19 || (sky?.hour ?? 23) < 6
  const lit = moon.illumination > 0.04
  const w = h('span', { class: `ix-window${night ? ' is-night' : ' is-day'}`, 'aria-hidden': 'true' },
    h('span', { class: 'ix-window-sky' }),
    lit ? svg(`<svg class="ix-moon" viewBox="-12 -12 24 24" aria-hidden="true" focusable="false"><circle r="10" class="ix-moon-dark"/><path d="${moonPath(moon.phase, 10)}" class="ix-moon-lit"/></svg>`) : null,
    h('span', { class: 'ix-window-bars' }))
  return w
}

// The Stairwell (/404): body itself. A stair going down past the light, signed with the lowest rung.
function stairwell(far, m, qs) {
  far.append(
    h('span', { class: 'ix-stair', 'aria-hidden': 'true' }, h('span', { class: 'ix-stair-steps' })),
    h('a', { class: 'ix-down', href: '/z/-2147483648', 'aria-label': 'Down the stair: rung −2147483648', draggable: 'false' },
      h('span', { class: 'ix-down-arrow', 'aria-hidden': 'true' }, '↓'), h('span', { class: 'ix-down-num', 'aria-hidden': 'true' }, '−2147483648')),
  )
}

function directory(m) {
  const rows = [['1', 'the first child'], ['404', 'the Lost'], ['−2147483648', 'down the stair'], [':root', 'out, to the temple']]
  const board = h('span', { class: 'ix-directory', 'aria-hidden': 'true' },
    h('span', { class: 'ix-directory-head' }, 'body · directory'),
    ...rows.map(([a, b]) => h('span', { class: 'ix-directory-row' }, h('b', {}, a), h('span', {}, b))))
  const msgs = (m.wall ?? []).slice(-3).reverse()
  const wall = h('span', { class: 'ix-scrawl', 'aria-hidden': 'true' },
    ...msgs.map((x) => h('span', { class: 'ix-scrawl-line glyph', lang: 'x-cascade' }, String(x?.text ?? '').slice(0, 80))))
  return [board, wall]
}

function clock(m) {
  const now = m.now
  const hh = now.getHours() % 12
  const mm = now.getMinutes()
  const ha = (hh + mm / 60) * 30
  const ma = mm * 6
  return h('span', { class: 'ix-clock', 'aria-hidden': 'true' },
    svg(`<svg viewBox="-20 -20 40 40" aria-hidden="true" focusable="false"><circle r="18" class="ix-clock-face"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0 -15.5 V-17" transform="rotate(${i * 30})" class="ix-clock-tick"/>`).join('')}<path d="M0 2 V-9" transform="rotate(${ha.toFixed(1)})" class="ix-clock-hand ix-clock-hand--h"/><path d="M0 3 V-14" transform="rotate(${ma.toFixed(1)})" class="ix-clock-hand"/><circle r="1.2" class="ix-clock-pin"/></svg>`),
    h('span', { class: 'ix-clock-hour' }, `hour of ${m.sky?.planetaryHour?.glyph ?? ''} ${m.sky?.planetaryHour?.planet ?? ''}`))
}

// The waiting room: figures made of placeholder grey in plastic chairs, set out in the row by `order`,
// which is not the order of the tree. Tab walks the tree.
function waitingRoom(m) {
  const n = m.figures
  const order = m.figureOrder
  const row = h('span', { class: 'ix-row' })
  for (let i = 0; i < n; i++) {
    row.append(h('span', {
      class: 'ix-seat',
      style: { order: String(order[i]) },
    },
    h('span', { class: 'ix-chair', 'aria-hidden': 'true' }),
    h('span', {
      class: 'ix-figure',
      tabindex: '0',
      role: 'img',
      'data-i': String(i + 1),
      'aria-label': `figure ${i + 1} of ${n}, waiting for content`,
    }, h('span', { class: 'ix-figure-head' }), h('span', { class: 'ix-figure-line' }), h('span', { class: 'ix-figure-line ix-figure-line--short' }))))
  }
  return row
}

// Build one room. `m` is the face's model of it (interstice.js, model()).
export function buildRoom(m) {
  const { room, fate, qs } = m
  const { m: bm, b: bb } = bands(room.box)
  const lamp = m.solved ? 'all' : m.seed ? 'bulb' : fate.lamp
  const vars = {
    '--m': pct(bm),
    '--b': pct(bb),
    '--seam-w': px(room.seamWidth),
    '--seam-magic': px(room.seam),
    '--deep': room.deep.toFixed(3),
    '--slot': pct(room.slot),
    '--box-m': px(room.box.margin),
    '--box-b': px(room.box.border),
    '--box-p': px(room.box.padding),
    '--tilt': `${fate.tilt.toFixed(2)}deg`,
    '--flick': fate.flick.toFixed(3),
  }
  const roomEl = setVars(h('div', { class: 'ix-room', 'data-lamp': lamp, 'data-kind': m.kind }), vars)
  const plane = (name, label) => h('div', { class: `ix-plane ix-${name}`, 'data-plane': name, ...(label ? {} : { 'aria-hidden': 'true' }) })
  const ceil = plane('ceil')
  const floor = plane('floor')
  const left = plane('left', true)
  const right = plane('right', true)
  const far = plane('far', true)
  left.classList.add('ix-wall')
  right.classList.add('ix-wall')
  far.classList.add('ix-wall')
  left.dataset.wall = 'left'
  right.dataset.wall = 'right'
  far.dataset.wall = 'far'
  if (fate.kept) ({ far, left, right, floor, ceil })[fate.kept]?.classList.add('is-kept')

  // ── the ceiling: a grid of tiles and the light ─────────────────────────────────────────────────
  ceil.append(h('i', { class: 'ix-lamp', 'aria-hidden': 'true' }, h('i', { class: 'ix-lamp-tube' }), h('i', { class: 'ix-lamp-tube' })))
  // ── the floor: the bands, and the dimensions pencilled across them ─────────────────────────────
  floor.append(
    pencil(`margin ${room.box.margin}`, 'ix-pencil--floor ix-pencil--m'),
    pencil(`border ${room.box.border}`, 'ix-pencil--floor ix-pencil--b'),
    pencil(`padding ${room.box.padding}`, 'ix-pencil--floor ix-pencil--p'),
  )
  for (const d of fate.damage) {
    const host = { tile: ceil, stain: d.x < 0.5 ? left : right, peel: d.x < 0.5 ? right : left, crack: far, scuff: floor }[d.kind]
    const el = damageEl(d)
    if (d.kind === 'crack') el.append(svg(CRACK))
    host?.append(el)
  }

  // ── the far wall: the slot (the room's own div), the doorways to its children ──────────────────
  const slot = h('div', { class: 'ix-slot' })
  const holder = h('div', { class: 'ix-slot-holder' }, slot)
  const dimW = pencil('', 'ix-dim ix-dim--w')
  const dimSide = h('span', { class: 'ix-dim-side', 'aria-hidden': 'true' },
    h('span', {}, `m ${room.box.margin}`), h('span', {}, `b ${room.box.border}`), h('span', {}, `p ${room.box.padding}`))
  far.append(holder, dimW, dimSide, pencil(`seams off by ${room.seam}px`, 'ix-pencil--seam'))
  if (m.seed && !m.taken) {
    slot.append(document.createTextNode(m.letter))
    slot.setAttribute('role', 'button')
    slot.setAttribute('tabindex', '0')
    slot.setAttribute('aria-label', 'the open slot in the far wall: one letter lies in it, with no element of its own. Take it')
  }

  const doors = []
  const farOpenings = m.exits.filter((e) => e.dir === 'far')
  if (m.home) farOpenings.push({ dir: 'far', home: true, n: 0, to: [] })
  const passFar = m.passage?.dir === 'far' ? m.passage : null
  const slots = farOpenings.length + (passFar ? 1 : 0)
  const hiddenAt = passFar ? passFar.n % slots : -1
  let at = 0
  let hidden = null
  if (!room.path.length) stairwell(far, m, qs)
  const farX = (i) => (room.path.length ? (i + 1) / (slots + 1) : [0.17, 0.83, 0.5][i] ?? 0.5)
  for (let i = 0; i < slots; i++) {
    let el
    if (i === hiddenAt) {
      el = hidden = hiddenDoor(passFar, qs)
    } else {
      const e = farOpenings[at++]
      el = door(e, qs)
      doors.push({ el, exit: e })
      // A doorway toward the seed lets a little of its warmth out onto this floor.
      if (e.warm) floor.append(setVars(h('i', { class: 'ix-spill ix-spill--far is-soft', 'aria-hidden': 'true' }), { '--at': farX(i).toFixed(3) }))
    }
    el.style.setProperty('--x', farX(i).toFixed(3))
    far.append(el)
  }

  // ── the side walls: a doorway where two margins touch, or a wall that only looks solid ─────────
  for (const [dir, wall] of [['left', left], ['right', right]]) {
    const e = m.exits.find((x) => x.dir === dir)
    if (e) {
      const el = door(e, qs)
      el.style.setProperty('--at', room.side[dir].toFixed(3))
      wall.append(el)
      doors.push({ el, exit: e })
      if (e.warm) floor.append(setVars(h('i', { class: `ix-spill ix-spill--${dir} is-soft`, 'aria-hidden': 'true' }), { '--at': room.side[dir].toFixed(3) }))
    } else if (m.passage?.dir === dir) {
      hidden = hiddenDoor(m.passage, qs)
      hidden.style.setProperty('--at', room.side[dir].toFixed(3))
      wall.append(hidden)
    }
  }
  if (m.passage && !m.solved) {
    const wall = { far, left, right }[m.passage.dir]
    wall.dataset.passable = ''
    // The light from the room behind spills onto the floor in front of the wall that hides it.
    floor.append(setVars(h('i', { class: `ix-spill ix-spill--${m.passage.dir}`, 'aria-hidden': 'true' }), { '--at': (m.passage.dir === 'far' ? (hiddenAt + 1) / (slots + 1) : room.side[m.passage.dir]).toFixed(3) }))
  } else if (m.passage) {
    ({ far, left, right })[m.passage.dir].dataset.passable = ''
  }

  // ── what else stands on the walls ─────────────────────────────────────────────────────────────
  if (m.kind === 'window' && !m.seed) {
    const side = m.exits.some((e) => e.dir === room.windowSide) || m.passage?.dir === room.windowSide ? (room.windowSide === 'left' ? 'right' : 'left') : room.windowSide
    ;({ left, right })[side].append(windowEl(m.sky))
  }
  // The verse somebody pencilled, on whichever side wall has more room for it.
  // In the Stairwell the directory and the clock have the walls; the notice goes up beside the clock.
  const scrawlSide = m.exits.some((e) => e.dir === 'right') && !m.exits.some((e) => e.dir === 'left') ? left : right
  if (room.path.length) scrawlSide.append(h('span', { class: 'ix-graffito', 'aria-hidden': 'true' }, fate.verse.text))
  const noticeSide = room.path.length ? (scrawlSide === left ? right : left) : right
  if (m.notice) noticeSide.append(h('span', { class: 'ix-notice', role: 'note' }, h('b', {}, 'Notice'), ' ', m.notice))
  if (!room.path.length) {
    left.append(...directory(m))
    right.append(clock(m))
  }

  // ── the one thing standing in the room ────────────────────────────────────────────────────────
  let prop = null
  let figures = []
  if (m.seed) {
    prop = plane('prop')
    prop.append(h('i', { class: 'ix-flex' }), h('i', { class: 'ix-bulb' }))
    prop.style.setProperty('--z', '0.36')
  } else if (m.kind === 'waiting') {
    prop = plane('prop', true)
    prop.classList.add('ix-prop--waiting')
    prop.style.setProperty('--z', '0.86')
    const row = waitingRoom(m)
    figures = [...row.querySelectorAll('.ix-figure')]
    prop.append(row)
  } else if (m.wet) {
    prop = plane('prop')
    prop.style.setProperty('--z', '0.3')
    prop.append(h('i', { class: 'ix-wetsign' }, h('b', {}, 'Caution'), h('span', {}, 'overflow: visible')))
  }
  let echo = null
  if (m.kind === 'mirror') {
    far.dataset.glass = ''
    echo = h('i', { class: 'ix-echo', 'aria-hidden': 'true' })
    far.append(h('i', { class: 'ix-glass', 'aria-hidden': 'true' }), echo)
  }

  roomEl.append(ceil, floor, left, far, right)
  if (prop) roomEl.append(prop)
  const persp = h('div', { class: 'ix-persp' }, roomEl)
  const cut = h('div', { class: 'ix-cut', 'data-room': addressOf(room.path), 'data-key': keyOf(room.path) }, persp)
  if (room.upside) cut.dataset.upside = ''
  return { el: cut, room: roomEl, persp, planes: { far, left, right, floor, ceil, prop }, slot, dimW, doors, hidden, figures, echo }
}

// Measure the slot as the browser laid it out (its own box, before any 3D): "812 × 0".
export function measure(slot) {
  const cs = getComputedStyle(slot)
  const w = Math.round(parseFloat(cs.width) || 0)
  const hgt = Math.round(parseFloat(cs.height) || 0)
  return { w, h: hgt, text: `${w} × ${hgt}` }
}
