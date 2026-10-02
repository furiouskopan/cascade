// THE INTERSTICE: Rooms Between the Boxes (docs/ROADMAP.md §4.3; route face, registry route '*').
//
// Every address the temple does not know drops you here, into a room made of one real, empty <div>: a
// box with margin, border and padding and no content, drawn as six CSS planes tinted like the Inspector's
// box-model overlay (margin a dusty orange, border a sallow yellow, padding a pale green, the empty content
// a cold blue), with its dimensions pencilled on and a plaque naming it by its selector. You step through
// doorways (click, arrow keys, WASD, a swipe) in short cuts; the address bar becomes the room's address
// (/404/6/12) by replaceState only, so Back leaves in one press; an automap draws the tree you have walked.
// The page itself is served as a real 404.
//
// THE RIDDLE: every room is :empty except one, a few rooms from where you came in, behind a wall that
// looks solid and is not (pointer-events: none, the Passable). In it, the slot in the far wall holds one
// letter that has no element of its own (a bare text node). Take it: interstice-riddle.
//
// Instant weirdness: the page opens on the Inspector's flat box-model diagram, which turns out to be a
// room seen from far away; you are carried into it, and the light comes on. Your mistake is written on
// the plaque, on a strip of masking tape.
//
// Summon: the light cord (top left). Stillness: at 7 s the hum dips; at 33 s the far wall grows a doorway;
// at 108 s every panel goes dark but one and the plaques count from the other end (:nth-last-child).
// Its own small weirdness, none of it under mercy: wallpaper seams off by a per-room magic number, one more
// doorway after you come back from another tab, nth-child(404) hanging upside down, plaques possessed by a
// doctrine for a moment, panels that dim (at most once every 4 to 7 s, never by more than 20%).
// Rare rooms: windows that show the real moon, the Waiting Room (figures set out by `order`, while Tab
// walks the tree) and the Mirror Room (a dark glass that replays your pointer from 33 s ago).
//
// Secrets: interstice-riddle, interstice-passable, interstice-stairwell, interstice-404, interstice-mended,
// interstice-dark, interstice-mirror, interstice-tab-order, interstice-xyzzy; and stillness (33 s).
import { h } from '../lib/dom.js'
import { inscription, rosetta, ALPHABET } from '../lib/glyphs.js'
import { makeRng } from '../kernel/rng.js'
import { makeLife } from './interstice/life.js'
import * as W from './interstice/world.js'
import { fateOf, notice as noticeOf } from './interstice/fate.js'
import { buildRoom, measure, braille, setVars } from './interstice/room.js'
import { makePlan } from './interstice/map.js'
import * as T from './interstice/words.js'

// For the witness tool, and only with ?debug=interstice: the live instance of this face (where the seed
// lies, and the hands to walk there). Without the parameter it stays empty, so it gives nothing away.
export const debug = {}

// Links and the address bar carry the temple's own test parameters onward, never ?reset (it would wipe the
// visitor's memory at every step) nor ?face (here the address decides the face).
const KEEP = ['seed', 'at', 'mercy', 'debug', 'hell']
function keepQuery(search) {
  const p = new URLSearchParams(search)
  for (const k of [...p.keys()]) if (!KEEP.includes(k)) p.delete(k)
  const s = p.toString()
  return s ? `?${s}` : ''
}
// The part of the query that belongs to the mistake (everything that is not the temple's).
function mistakeQuery(search) {
  const p = new URLSearchParams(search)
  for (const k of [...p.keys()]) if ([...KEEP, 'face', 'reset'].includes(k)) p.delete(k)
  const s = p.toString()
  return s ? `?${s}` : ''
}

const HOME = new Set(['', '/', '/index', '/index.html'])
const DIRS = { ArrowUp: 'far', ArrowDown: 'back', ArrowLeft: 'left', ArrowRight: 'right', w: 'far', s: 'back', a: 'left', d: 'right' }
const WASD = new Set(['w', 'a', 's', 'd'])

// A small grain for the plaster, baked once per visit from the visit's own fate.
function grain(rng) {
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 96
    const g = c.getContext('2d')
    const img = g.createImageData(96, 96)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rng() < 0.5 ? 0 : 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = Math.floor(rng() * 22)
    }
    g.putImageData(img, 0, 0)
    return `url("${c.toDataURL('image/png')}")`
  } catch {
    return 'none'
  }
}

export function render(ctx) {
  const life = makeLife()
  const visit = ctx.rng.fork('interstice')
  const sky = ctx.sky
  const mercy = () => Boolean(ctx.mercy?.on)
  const originalTitle = document.title
  const originalPath = location.pathname
  const originalSearch = location.search
  const QS = keepQuery(location.search)

  // ── where the visitor came in ─────────────────────────────────────────────────────────────────
  // A reload keeps the walk (history.state); an unknown address is a mistake, written on the plaque and
  // turned into the room it drops you in; a room's own address is that room; the root is the Stairwell.
  const prev = history.state && typeof history.state === 'object' ? history.state.interstice : null
  const prevAt = prev && prev.v === 1 && prev.at === location.pathname ? W.parseAddress(prev.at) : null
  const prevOrigin = prevAt ? W.parseAddress(prev.origin) : null
  let origin
  let here
  let mistake = null
  let raw = null
  if (prevAt && prevOrigin) {
    origin = prevOrigin
    here = prevAt
    mistake = typeof prev.mistake === 'string' ? prev.mistake.slice(0, 80) : null
    raw = typeof prev.raw === 'string' ? prev.raw.slice(0, 400) : null
  } else {
    const asRoom = W.parseAddress(location.pathname)
    if (asRoom) origin = asRoom
    else if (HOME.has(location.pathname.replace(/\/+$/, ''))) origin = []
    else {
      raw = location.pathname
      mistake = W.readable(location.pathname, mistakeQuery(location.search))
      let decoded = location.pathname
      try { decoded = decodeURIComponent(decoded) } catch {}
      origin = W.originFor(decoded)
    }
    here = origin
  }
  const plan = W.plantSeed(origin)
  // A near miss of a real shelf (/vrse/…) dropped one letter of it: that is the letter in the slot.
  const mended = raw ? W.mend(raw) : null
  const letter = mended?.letter ?? W.strayLetter(mistake ?? '', origin)
  const noticeText = noticeOf(visit, sky)
  const S = {
    here,
    origin,
    plan,
    letter,
    mended,
    mistake,
    raw,
    solved: Boolean(prev?.solved && prevOrigin),
    grown: new Map(), // room key -> [child indices that grew]
    fresh: null, // the doorway that has just grown (it fades in)
    switched: new Map(), // room key -> the lamp the visitor pulled the cord to
    bump: null,
    knocks: 0,
    busy: false,
    queued: null, // a step asked for while the last one was still being taken
    dark: false,
    cur: null, // the room built now
    model: null,
    arrived: false,
    tabbed: [],
  }
  const debugging = ctx.params?.get?.('debug') === 'interstice'
  if (debugging) {
    debug.state = S
    debug.plan = { origin: W.addressOf(origin), trail: plan.trail.map(W.addressOf), A: W.addressOf(plan.A), S: W.addressOf(plan.S), dir: plan.dir, letter }
  }

  // ── the page ──────────────────────────────────────────────────────────────────────────────────
  const root = h('div', { class: 'ix', 'data-sky': sky.has('night') ? 'night' : 'day' })
  setVars(root, { '--ix-grain': grain(visit.fork('grain')) })
  if (sky.has('witching')) root.dataset.witching = ''
  if (sky.has('full-moon')) root.dataset.moon = 'full'
  if (sky.has('new-moon')) root.dataset.moon = 'new'
  if (S.solved) root.dataset.solved = ''

  const view = h('section', { class: 'ix-view', 'aria-label': 'The room you are standing in', tabindex: '-1', 'data-hell': 'spare' })
  const veil = h('div', { class: 'ix-veil', 'aria-hidden': 'true' })
  // The first thing anyone sees: the Inspector's box-model diagram, which is a room seen from far away.
  const tip = h('span', { class: 'ix-tip' }, h('b', {}, 'div'), h('span', { class: 'ix-tip-size' }))
  const diagram = h('div', { class: 'ix-diagram', 'aria-hidden': 'true' },
    tip,
    h('span', { class: 'ix-diagram-l ix-diagram-l--m' }, 'margin'),
    h('span', { class: 'ix-diagram-l ix-diagram-l--b' }, 'border'),
    h('span', { class: 'ix-diagram-l ix-diagram-l--p' }, 'padding'),
    h('span', { class: 'ix-diagram-l ix-diagram-l--c' }))
  view.append(veil, diagram)

  // The plaque, hanging from the ceiling on two wires.
  const signSel = h('code', { class: 'ix-sign-sel' })
  const signPath = h('span', { class: 'ix-sign-path' })
  const signBraille = h('span', { class: 'ix-braille', 'aria-hidden': 'true' })
  const signTape = h('span', { class: 'ix-tape', 'aria-hidden': 'true' })
  const signTapeReal = h('span', { class: 'visually-hidden' })
  const signGhost = h('span', { class: 'ix-sign-ghost', 'aria-hidden': 'true' })
  const signHour = h('span', { class: 'ix-sign-hour' }, `${sky.planetaryHour.glyph} ${sky.clock} · moon ${sky.moon.name}`)
  const sign = h('header', { class: 'ix-sign', 'data-hell': 'spare' },
    h('span', { class: 'ix-sign-wire ix-sign-wire--l', 'aria-hidden': 'true' }),
    h('span', { class: 'ix-sign-wire ix-sign-wire--r', 'aria-hidden': 'true' }),
    h('div', { class: 'ix-sign-plate' },
      h('p', { class: 'ix-sign-kicker' }, h('span', {}, 'The Interstice'), signHour),
      h('h1', { class: 'ix-sign-h' }, h('span', { class: 'visually-hidden' }, 'The Interstice, room '), signSel, signGhost),
      h('p', { class: 'ix-sign-addr' }, signPath, signBraille, signTapeReal),
      signTape,
    ))

  // The light cord: the summon.
  const cord = h('button', { class: 'ix-cord', type: 'button', 'aria-label': 'Pull the light cord', title: 'Pull the light cord' },
    h('span', { class: 'ix-cord-line', 'aria-hidden': 'true' }), h('span', { class: 'ix-cord-pull', 'aria-hidden': 'true' }))

  // What you see, as words.
  const sayEl = h('p', { class: 'ix-say', 'aria-live': 'polite' })
  const eventEl = h('p', { class: 'ix-event', 'aria-live': 'polite' })
  const humEl = h('p', { class: 'ix-hum', 'aria-hidden': 'true' })
  const pencilEl = h('p', { class: 'ix-note' })
  const log = h('section', { class: 'ix-log', 'aria-label': 'What you see' }, eventEl, sayEl, pencilEl, humEl)

  // The lift panel: four ways, a call button that asks for a hint, and the maker's plate.
  const exitLink = h('a', { class: 'ix-exit', href: '/', draggable: 'false' }, h('span', { class: 'ix-exit-word', 'aria-hidden': 'true' }, 'Exit'), h('span', { class: 'ix-exit-to' }))
  const key = (dir, glyph, label) => h('button', { class: `ix-key ix-key--${dir}`, type: 'button', 'data-dir': dir, 'aria-label': label }, h('span', { 'aria-hidden': 'true' }, glyph))
  const keys = { far: key('far', '▲', 'Step forward'), left: key('left', '◀', 'Step left'), right: key('right', '▶', 'Step right'), back: key('back', '▼', 'Step back') }
  const call = h('button', { class: 'ix-call', type: 'button', 'aria-label': 'Call for help (a hint)' }, h('span', { class: 'ix-call-icon', 'aria-hidden': 'true' }, '☏'), h('span', {}, 'help'))
  const plate = h('div', { class: 'ix-plate' }, inscription({ className: 'ix-inscription' }))
  const lift = h('nav', { class: 'ix-lift', 'aria-label': 'Ways out' },
    exitLink,
    h('div', { class: 'ix-pad', role: 'group', 'aria-label': 'Step' }, keys.far, keys.left, keys.right, keys.back),
    call,
    plate)

  // The plan of the floor, with its key (the Rosetta fragment).
  const planSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  planSvg.setAttribute('class', 'ix-plan-map')
  planSvg.setAttribute('aria-hidden', 'true')
  planSvg.setAttribute('focusable', 'false')
  const planCap = h('figcaption', { class: 'ix-plan-cap' })
  const planFig = h('figure', { class: 'ix-plan' },
    h('div', { class: 'ix-plan-head', 'aria-hidden': 'true' }, h('span', {}, 'Plan of this floor'), h('span', { class: 'ix-plan-you' }, 'you are here')),
    planSvg,
    planCap,
    h('div', { class: 'ix-plan-key' }, h('span', { class: 'ix-plan-key-h' }, 'Key'), rosetta('interstice', { className: 'ix-rosetta' })))

  // The pocket: what you carry out of the one room that was not :empty.
  const pocketLetter = h('span', { class: 'ix-pocket-letter' })
  const pocketGlyph = h('span', { class: 'ix-pocket-glyph glyph', lang: 'x-cascade', 'aria-hidden': 'true' })
  const pocketName = h('span', { class: 'ix-pocket-name' })
  const pocketMend = h('a', { class: 'ix-pocket-mend', hidden: true })
  const pocket = h('aside', { class: 'ix-pocket', 'aria-label': 'What you carry', hidden: true },
    h('span', { class: 'ix-pocket-h' }, 'In your hand'), pocketGlyph, pocketLetter, pocketName, pocketMend)

  root.append(view, sign, cord, log, lift, planFig, pocket)
  ctx.root.append(root)

  // ── the size of the world ──────────────────────────────────────────────────────────────────────
  // The room is drawn at the size of the view; how far the far wall stands (and so how wide the lens)
  // depends on the shape of the screen, so a phone held upright still sees the far wall.
  function fit() {
    const w = Math.max(240, view.clientWidth)
    const hh = Math.max(240, view.clientHeight)
    const tall = hh > w * 1.05
    const P = Math.round(Math.max(w, hh) * (tall ? 0.95 : 0.66))
    const ratio = tall ? 0.56 : 0.45
    S.vw = w
    S.vh = hh
    setVars(view, { '--vw': `${w}px`, '--vh': `${hh}px`, '--persp': `${P}px`, '--depth': `${Math.round(P * (1 / ratio - 1))}px` })
  }
  fit()
  let fitRaf = 0
  const ro = life.observe(new ResizeObserver(() => {
    cancelAnimationFrame(fitRaf)
    fitRaf = requestAnimationFrame(() => { fit(); measureSlot() })
  }))
  ro.observe(view)
  life.add(() => cancelAnimationFrame(fitRaf))

  // ── the model of a room, for the builder and the words ─────────────────────────────────────────
  function model(path) {
    const room = W.roomOf(path)
    const k = W.keyOf(path)
    const seed = W.same(path, plan.S)
    const passage = plan.passage(path)
    const warmTo = S.solved ? null : plan.warmth(path)
    const exits = W.exitsOf(path, plan).map((e) => ({ ...e, warm: Boolean(warmTo && W.same(warmTo, e.to)) }))
    for (const c of S.grown.get(k) ?? []) {
      if (!exits.some((e) => e.dir === 'far' && e.n === c)) exits.push({ dir: 'far', to: [...path, c], n: c, grown: S.fresh === `${k}/${c}` })
    }
    const RANK = { far: 0, left: 1, right: 2 }
    exits.sort((a, b) => (RANK[a.dir] - RANK[b.dir]) || (a.n - b.n))
    const fate = fateOf(visit, path, sky)
    const lamp = S.switched.get(k)
    if (lamp) fate.lamp = lamp
    let kind = room.kind
    if ((seed || passage) && (kind === 'waiting' || kind === 'mirror')) kind = 'plain'
    const wr = makeRng(`interstice/waiting/${k}`)
    const figures = wr.int(4, 7)
    return {
      path,
      room,
      kind,
      fate,
      qs: QS,
      exits,
      passage,
      seed,
      taken: S.solved,
      solved: S.solved,
      home: seed && S.solved,
      letter: S.letter,
      warmBack: Boolean(warmTo && path.length && W.same(warmTo, W.parentOf(path))),
      sky,
      mercy: mercy(),
      now: ctx.clock(),
      wall: ctx.ritual?.state?.wall ?? [],
      notice: W.same(path, origin) ? noticeText : null,
      wet: sky.has('witching') && W.same(path, origin) && !seed,
      figures,
      figureOrder: wr.shuffle(Array.from({ length: figures }, (_, i) => i + 1)),
    }
  }

  // ── speaking ──────────────────────────────────────────────────────────────────────────────────
  let eventTimer = 0
  function event(text, ms = 9000) {
    eventEl.textContent = text
    life.clear(eventTimer)
    if (ms) eventTimer = life.timeout(() => { eventEl.textContent = '' }, ms)
  }
  function quiet() {
    life.clear(eventTimer)
    eventEl.textContent = ''
  }
  function hum(text) {
    humEl.textContent = text
  }

  function measureSlot() {
    const cur = S.cur
    if (!cur?.slot?.isConnected) return
    const m = measure(cur.slot)
    cur.dimW.textContent = `${m.w} × ${m.h}`
    cur.slot.dataset.size = m.text
  }

  // ── the plaque ────────────────────────────────────────────────────────────────────────────────
  let ghostTimer = 0
  function plaque(m) {
    const path = m.path
    const steps = W.selectorOf(path, { last: S.dark, short: true }).split(' > ')
    signSel.replaceChildren(...steps.flatMap((x, i) => [i ? ' > ' : '', h('span', { class: 'ix-step' }, x)]))
    signSel.title = W.selectorOf(path, { last: S.dark })
    signPath.textContent = W.addressOf(path)
    signBraille.textContent = path.length ? braille(W.indexOf(path)) : '⠃⠕⠙⠽'
    const taped = Boolean(S.mistake && W.same(path, origin))
    sign.toggleAttribute('data-taped', taped)
    signTape.textContent = taped ? S.mistake : ''
    signTapeReal.textContent = taped ? `, where the address you typed, ${S.mistake}, is taped over the plaque` : ''
    // Sometimes a plaque is possessed for a moment and reads a doctrine instead of a selector.
    life.clear(ghostTimer)
    sign.removeAttribute('data-possessed')
    if (m.fate.possessed && !mercy() && !S.dark && !taped) {
      signGhost.textContent = m.fate.possessed.meaning
      sign.setAttribute('data-possessed', '')
      ghostTimer = life.timeout(() => sign.removeAttribute('data-possessed'), 2600)
    }
  }

  // ── the lift panel and the exit ───────────────────────────────────────────────────────────────
  function panel(m) {
    for (const dir of ['far', 'left', 'right']) {
      const has = m.exits.some((e) => e.dir === dir)
      keys[dir].classList.toggle('is-lit', has)
      const e = m.exits.filter((x) => x.dir === dir)
      keys[dir].setAttribute('aria-label', has
        ? `Step ${dir === 'far' ? 'forward' : dir}, to ${W.stepName(e[Math.floor((e.length - 1) / 2)].to)}`
        : `Step ${dir === 'far' ? 'forward' : dir} (no doorway that way)`)
    }
    const top = !m.path.length
    keys.back.classList.toggle('is-lit', !top)
    keys.back.setAttribute('aria-label', top ? 'Step back (the way out is the exit sign)' : `Step back, to ${W.stepName(W.parentOf(m.path))}`)
    exitLink.href = top ? `/${QS}` : `${W.addressOf(W.parentOf(m.path))}${QS}`
    exitLink.dataset.to = top ? '/' : W.addressOf(W.parentOf(m.path))
    exitLink.classList.toggle('is-out', top)
    exitLink.classList.toggle('is-warm', m.warmBack)
    exitLink.lastChild.textContent = top ? 'to the temple' : `back to ${W.stepName(W.parentOf(m.path))}`
    exitLink.setAttribute('aria-label', top ? 'Exit: leave the Interstice for the temple' : `Exit: back to ${W.stepName(W.parentOf(m.path))}`)
  }

  // ── the plan ──────────────────────────────────────────────────────────────────────────────────
  const map = makePlan()
  const walked = []
  function walkTo(from, to) {
    map.walk(from, to)
    const a = W.addressOf(to)
    if (walked[walked.length - 1] !== a) walked.push(a)
    if (walked.length > 64) walked.splice(0, walked.length - 64)
  }
  function drawPlan(m) {
    map.draw(planSvg, { here: m.path, origin, seed: S.solved ? plan.S : null, exits: m.exits })
    const n = map.count
    planCap.textContent = `You have walked ${n === 1 ? 'one room' : `${n} rooms`}. You are in ${W.stepName(m.path)}${W.same(m.path, origin) ? ', the room you came in by.' : '.'}`
  }
  if (prevAt && prevOrigin && Array.isArray(prev.walked)) {
    let last = null
    for (const a of prev.walked.slice(-64)) {
      const p = W.parseAddress(a)
      if (!p) continue
      walkTo(last, p)
      last = p
    }
  }

  // ── the address bar ───────────────────────────────────────────────────────────────────────────
  function syncAddress() {
    const st = history.state && typeof history.state === 'object' ? history.state : {}
    const kept = { v: 1, at: W.addressOf(S.here), origin: W.addressOf(origin), mistake: S.mistake, raw: S.raw, solved: S.solved, walked: walked.slice(-64) }
    try { history.replaceState({ ...st, interstice: kept }, '', kept.at + QS + location.hash) } catch {}
  }

  // ── showing a room ────────────────────────────────────────────────────────────────────────────
  function show(path, how = null) {
    const m = model(path)
    const built = buildRoom(m)
    const old = S.cur
    S.cur = built
    S.model = m
    S.fresh = null
    view.insertBefore(built.el, veil)
    measureSlot()
    if (old) cut(old, built, how)
    plaque(m)
    panel(m)
    drawPlan(m)
    const lines = [T.describe(m)]
    sayEl.textContent = lines.join(' ')
    pencilEl.textContent = T.pencilled(m.fate.verse)
    if (!S.arrived) {
      S.arrived = true
      const a = T.arrival({ mistake: S.mistake })
      if (a) event(a, 0) // it stays until the first step
    }
    document.title = `${W.addressOf(path)} · The Interstice`
    syncAddress()
    root.toggleAttribute('data-upside', m.room.upside)
    if (!path.length) ctx.memory.markSecret('interstice-stairwell')
    if (m.room.upside) {
      ctx.memory.markSecret('interstice-404')
      event(mercy() ? T.UPSIDE_MERCY : T.UPSIDE)
    }
    mirror(built, m)
    waitingRoom(built, m)
  }

  // Rebuild the room you stand in, in place (a doorway grew, the way home opened). No step is taken.
  function refresh() {
    if (!S.cur) return
    const hadFocus = S.cur.el.contains(document.activeElement)
    const old = S.cur
    const m = model(S.here)
    const built = buildRoom(m)
    S.cur = built
    S.model = m
    S.fresh = null
    view.insertBefore(built.el, veil)
    old.el.remove()
    measureSlot()
    panel(m)
    drawPlan(m)
    sayEl.textContent = T.describe(m)
    mirror(built, m)
    waitingRoom(built, m)
    if (hadFocus) view.focus({ preventScroll: true })
  }

  // A step is a cut of about 300 ms, never a walk; under mercy it is instant.
  const CUTS = {
    far: [[{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.45)', opacity: 0 }], [{ transform: 'scale(0.82)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }]],
    back: [[{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.78)', opacity: 0 }], [{ transform: 'scale(1.25)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }]],
    left: [[{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(24%)', opacity: 0 }], [{ transform: 'translateX(-18%)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }]],
    right: [[{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-24%)', opacity: 0 }], [{ transform: 'translateX(18%)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }]],
  }
  function cut(old, next, how) {
    const hadFocus = old.el.contains(document.activeElement)
    const done = () => {
      old.el.remove()
      S.busy = false
      // A step asked for during the cut is taken as soon as the cut is over.
      const q = S.queued
      S.queued = null
      if (q) go(...q)
    }
    if (hadFocus) view.focus({ preventScroll: true })
    if (mercy() || !how) { done(); return }
    S.busy = true
    const [out, inn] = CUTS[how] ?? CUTS.far
    const a = life.animate(old.el, out, { duration: 230, easing: 'cubic-bezier(.55,0,.9,.45)', fill: 'forwards' })
    const b = life.animate(next.el, inn, { duration: 300, delay: 30, easing: 'cubic-bezier(.15,.65,.3,1)', fill: 'backwards' })
    let finished = false
    const end = () => { if (!finished) { finished = true; done() } }
    Promise.all([a?.finished, b?.finished]).then(end, end)
    life.timeout(end, 480) // a hidden or throttled tab may never finish an animation; the step is over anyway
  }

  function go(to, how, { through = false } = {}) {
    if (life.dead) return
    if (S.busy) { S.queued = [to, how, { through }]; return }
    const from = S.here
    S.here = to
    S.bump = null
    walkTo(from, to)
    if (through) {
      ctx.memory.markSecret('interstice-passable')
      event(T.THROUGH(how))
    } else if (!S.dark) quiet()
    show(to, how)
  }

  // A step asked for by direction (arrows, WASD, the lift panel, a swipe).
  function step(dir) {
    if (!S.model) return
    if (S.busy) { S.queued = null; life.timeout(() => step(dir), 120); return }
    const m = S.model
    if (dir === 'back') {
      if (!m.path.length) {
        event('Behind you is the way out of the Interstice: the exit sign leads to the temple.')
        return
      }
      go(W.parentOf(m.path), 'back')
      return
    }
    const ways = m.exits.filter((e) => e.dir === dir)
    if (ways.length) {
      go(ways[Math.floor((ways.length - 1) / 2)].to, dir)
      return
    }
    const p = m.passage
    if (p && p.dir === dir) {
      if (S.bump?.dir === dir && performance.now() - S.bump.at < 6000) { go(p.to, dir, { through: true }); return }
      S.bump = { dir, at: performance.now() }
      event(T.GIVE(dir))
      return
    }
    S.bump = null
    event(T.solid(dir, S.knocks++), 5000)
  }

  // ── the intro: the Inspector's diagram, seen from far away, is a room; you are carried into it ──
  function intro(built) {
    if (mercy()) { diagram.remove(); return }
    root.setAttribute('data-intro', '')
    const D = 3000
    const size = built.slot.dataset.size ?? ''
    tip.lastChild.textContent = size
    diagram.lastChild.textContent = size
    // where the room's opening stands at the start of the arrival, for the labels
    const P = parseFloat(getComputedStyle(view).getPropertyValue('--persp')) || 800
    setVars(view, { '--s0': (P / (P + 2600)).toFixed(4) })
    life.animate(diagram, [{ opacity: 1 }, { opacity: 1, offset: 0.33 }, { opacity: 0, offset: 0.46 }, { opacity: 0 }], { duration: D, fill: 'forwards' })?.finished.then(() => diagram.remove(), () => diagram.remove())
    const a = life.animate(built.room, [
      { transform: 'translateZ(-2600px)' },
      { transform: 'translateZ(-2600px)', offset: 0.36 },
      { transform: 'translateZ(0px)' },
    ], { duration: D, easing: 'cubic-bezier(.5,0,.25,1)' })
    life.animate(veil, [
      { opacity: 0.5 }, { opacity: 0.5, offset: 0.62 }, { opacity: 0.12, offset: 0.7 }, { opacity: 0.4, offset: 0.77 }, { opacity: 0 },
    ], { duration: D + 500, easing: 'linear', fill: 'backwards' })
    const end = () => root.removeAttribute('data-intro')
    a?.finished.then(end, end)
    // Any key or touch hurries the arrival.
    const hurry = () => { if (root.hasAttribute('data-intro')) life.finishAll() }
    life.on(window, 'pointerdown', hurry, { once: true, passive: true })
    life.on(window, 'keydown', hurry, { once: true })
  }

  // ── taking the letter ─────────────────────────────────────────────────────────────────────────
  function take() {
    const m = S.model
    if (!m?.seed) { event(T.NOTHING_TO_TAKE, 6000); return }
    if (S.solved) return
    const slot = S.cur.slot
    const node = [...slot.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)
    if (!node) return
    // The very text node leaves the slot: the slot is :empty again, and its content box shuts to 0.
    pocketLetter.append(node)
    slot.removeAttribute('role')
    slot.removeAttribute('tabindex')
    slot.removeAttribute('aria-label')
    S.solved = true
    root.setAttribute('data-solved', '')
    measureSlot()
    const info = ALPHABET[S.letter]
    pocketGlyph.textContent = S.letter
    pocketName.textContent = info ? `${info.name}, ${info.sign}: ${info.gloss}` : ''
    if (S.mended) {
      pocketMend.hidden = false
      pocketMend.href = S.mended.to
      pocketMend.textContent = `put it back: ${S.mended.to}`
    }
    pocket.hidden = false
    ctx.memory.markSecret('interstice-riddle', { letter: S.letter, entry: S.mistake ?? W.addressOf(origin) })
    if (S.mended) ctx.memory.markSecret('interstice-mended', { to: S.mended.to })
    event(T.taken({ letter: S.letter, mistake: S.mistake, mended: S.mended }), 0)
    const audio = ctx.audio
    if (audio?.summoned) {
      try {
        audio.bell?.({ kind: 'glass', freq: 783.99, gain: 0.06 })
        audio.bell?.({ kind: 'glass', freq: 987.77, gain: 0.05, delay: 0.32 })
        audio.bell?.({ kind: 'glass', freq: 1174.66, gain: 0.05, delay: 0.64 })
      } catch {}
    }
    syncAddress()
    life.timeout(() => {
      if (!W.same(S.here, plan.S) || S.busy) return
      refresh()
      eventEl.textContent = `${eventEl.textContent} ${T.WAY_HOME}`
    }, mercy() ? 0 : 1400)
    drawPlan(S.model)
  }

  // ── doorways that grow ────────────────────────────────────────────────────────────────────────
  function grow(path) {
    if (S.busy) return false
    const k = W.keyOf(path)
    const m = S.model
    const R = W.roomOf(path)
    const have = new Set(m.exits.filter((e) => e.dir === 'far').map((e) => e.n))
    const grown = S.grown.get(k) ?? []
    const r = visit.fork(`grow/${k}/${grown.length}`)
    const sealed = W.same(W.parentOf(plan.S), path) ? W.indexOf(plan.S) : -1 // never a doorway into the seed's room
    const free = []
    for (let c = 1; c <= R.n; c++) if (!have.has(c) && c !== sealed && !grown.includes(c)) free.push(c)
    if (!free.length || have.size + grown.length >= 4) return false
    const c = r.pick(free)
    S.grown.set(k, [...grown, c])
    S.fresh = `${k}/${c}`
    refresh()
    return true
  }

  // ── the Mirror Room: a dark glass that replays your pointer from 33 s ago ─────────────────────
  const trace = [] // [t, x, y] in view fractions
  let lastTrace = 0
  life.on(window, 'pointermove', (e) => {
    const t = performance.now()
    if (t - lastTrace < 60) return
    lastTrace = t
    trace.push([t, e.clientX / innerWidth, e.clientY / innerHeight])
    while (trace.length && t - trace[0][0] > 40000) trace.shift()
    if (!echoRaf && S.model?.kind === 'mirror' && S.cur?.echo) mirror(S.cur, S.model)
  }, { passive: true })
  let echoRaf = 0
  let echoSeen = false
  function mirror(built, m) {
    cancelAnimationFrame(echoRaf)
    echoRaf = 0
    if (m.kind !== 'mirror' || !built.echo) return
    const echo = built.echo
    let lastX = null
    const tick = () => {
      echoRaf = 0
      if (life.dead || S.cur !== built || mercy()) return
      // Nothing to replay: the visitor has not moved for 33 s. Sleep until the pointer moves again.
      if (!trace.length || trace[trace.length - 1][0] < performance.now() - 33500) {
        const last = trace[trace.length - 1]
        if (last) echo.style.transform = `translate(${((1 - last[1]) * S.vw).toFixed(1)}px, ${(last[2] * S.vh).toFixed(1)}px)`
        return
      }
      if (!document.hidden) {
        const then = performance.now() - 33000
        let p = null
        for (let i = trace.length - 1; i >= 0; i--) if (trace[i][0] <= then) { p = trace[i]; break }
        if (p) {
          const x = 1 - p[1] // a mirror turns you round
          if (lastX !== null && Math.abs(x - lastX) > 0.002 && !echoSeen) {
            echoSeen = true
            ctx.memory.markSecret('interstice-mirror')
            event(T.MIRROR)
          }
          lastX = x
          echo.style.transform = `translate(${(x * S.vw).toFixed(1)}px, ${(p[2] * S.vh).toFixed(1)}px)`
          echo.classList.add('is-on')
        }
      }
      echoRaf = requestAnimationFrame(tick)
    }
    echoRaf = requestAnimationFrame(tick)
  }
  life.add(() => cancelAnimationFrame(echoRaf))

  // ── the Waiting Room: the row is set out by `order`; Tab walks the tree ─────────────────────────
  function waitingRoom(built, m) {
    if (m.kind !== 'waiting' || !built.figures.length) return
    S.tabbed = []
    const n = built.figures.length
    for (const f of built.figures) {
      f.addEventListener('focus', () => {
        const i = Number(f.dataset.i)
        const at = [...f.parentElement.parentElement.children].map((s) => Number(s.style.order)).sort((a, b) => a - b).indexOf(Number(f.parentElement.style.order)) + 1
        event(T.waiting(i, n, at), 6000)
        if (S.tabbed[S.tabbed.length - 1] !== i) S.tabbed.push(i)
        const run = S.tabbed.slice(-n)
        if (run.length === n && run.every((x, j) => x === j + 1)) {
          if (ctx.memory.markSecret('interstice-tab-order')) event(T.WAITING_DONE, 9000)
          built.el.querySelector('.ix-row')?.setAttribute('data-nodded', '')
        }
      })
    }
  }

  // ── input ─────────────────────────────────────────────────────────────────────────────────────
  life.on(view, 'click', (e) => {
    if (S.swiped && performance.now() - S.swiped < 400) { e.preventDefault(); return }
    const t = e.target instanceof Element ? e.target : null
    if (!t) return
    const a = t.closest('a.ix-door, a.ix-down')
    if (a) {
      if (a.classList.contains('ix-down') || a.classList.contains('is-home')) return // real links: let them go
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return // a new tab is a new arrival
      e.preventDefault()
      const to = W.parseAddress(a.dataset.to)
      if (!to) return
      const through = a.hasAttribute('data-passage')
      go(to, a.dataset.dir === 'far' && through ? 'far' : a.dataset.dir || 'far', { through })
      return
    }
    if (t.closest('.ix-slot')) { take(); return }
    const wall = t.closest('.ix-wall')
    if (wall && !t.closest('.ix-figure')) event(T.solid(wall.dataset.wall, S.knocks++), 5000)
  })
  life.on(view, 'keydown', (e) => {
    const t = e.target instanceof Element ? e.target : null
    if (t?.classList.contains('ix-slot') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      take()
    }
  })
  life.on(exitLink, 'click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (!S.here.length) return // the way out is a real link
    e.preventDefault()
    step('back')
  })
  for (const [dir, b] of Object.entries(keys)) life.on(b, 'click', () => step(dir))
  life.on(call, 'click', () => {
    const x = ctx.secrets?.hint?.(S.solved ? undefined : 'face')
    if (!x) { event('The intercom hisses. Nobody is at the desk yet; try again in a moment.'); return }
    event(`The intercom crackles. ${x.title}, hint ${x.tier + 1} of ${x.of}: ${x.text}`, 30000)
  })

  // Arrows and WASD, anywhere on the page that is not a field. A letter of WASD typed in the middle of
  // a word (amen, ajna, take) is a word, not a step.
  let typingUntil = 0
  let pending = 0
  life.on(window, 'keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
    const t = e.target instanceof Element ? e.target : null
    if (t?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], #altar, dialog')) return
    if (ctx.audio?.eyeOpen) return
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
    const now = performance.now()
    if (/^[a-z]$/.test(k)) {
      // Another letter hard on the heels of the last one: somebody is typing a word, not walking.
      if (pending) { life.clear(pending); pending = 0; typingUntil = now + 1200 }
      if (e.repeat) return
      if (!WASD.has(k) || now < typingUntil || e.shiftKey) { typingUntil = now + 1200; return }
      if (root.hasAttribute('data-intro')) return
      const dir = DIRS[k]
      pending = life.timeout(() => { pending = 0; step(dir) }, 170)
      return
    }
    const dir = DIRS[k]
    if (!dir || e.repeat || e.shiftKey) return
    if (root.hasAttribute('data-intro')) return
    e.preventDefault()
    step(dir)
  })

  // Swipes on the room (touch and pen; a mouse clicks doorways).
  let swipe = null
  life.on(view, 'pointerdown', (e) => {
    if (e.pointerType === 'mouse') return
    swipe = { x: e.clientX, y: e.clientY, t: performance.now() }
  }, { passive: true })
  life.on(view, 'pointerup', (e) => {
    if (!swipe) return
    const dx = e.clientX - swipe.x
    const dy = e.clientY - swipe.y
    const dt = performance.now() - swipe.t
    swipe = null
    if (dt > 800 || Math.max(Math.abs(dx), Math.abs(dy)) < 44) return
    S.swiped = performance.now()
    step(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'far' : 'back'))
  }, { passive: true })
  life.on(view, 'pointercancel', () => { swipe = null }, { passive: true })

  // Words typed on the page, as in the old games: look, take, and the one everybody tries.
  life.bus(ctx.bus, 'behavior:typed', ({ buffer }) => {
    const b = String(buffer ?? '')
    if (b.endsWith('look')) { sayEl.textContent = T.describe(S.model) }
    else if (b.endsWith('take') || b.endsWith(' get') || b === 'get') take()
    else if (b.endsWith('xyzzy')) {
      event(T.XYZZY)
      ctx.memory.markSecret('interstice-xyzzy')
    }
  })

  // ── the light cord ────────────────────────────────────────────────────────────────────────────
  life.on(cord, 'click', () => {
    try { ctx.audio?.summon?.() } catch (e) { console.warn('[interstice] summon', e) }
    const k = W.keyOf(S.here)
    const roomEl = S.cur?.room
    if (roomEl && !S.solved && !S.model.seed) {
      const now = roomEl.dataset.lamp === 'off' ? 'on' : 'off'
      S.switched.set(k, now)
      roomEl.dataset.lamp = now
      S.model.fate.lamp = now
      event(now === 'on' ? 'Click. The panel stutters, then holds: a cold, even light.' : 'Click. The light goes out. The doorways go on glowing.', 5000)
    }
    if (!mercy()) {
      cord.classList.remove('is-pulled')
      void cord.offsetWidth
      cord.classList.add('is-pulled')
    }
  })

  // ── stillness ─────────────────────────────────────────────────────────────────────────────────
  life.bus(ctx.bus, 'behavior:still', ({ seconds }) => {
    if (seconds === 7) {
      root.setAttribute('data-hush', '')
      hum(T.STILL[7])
    }
    if (seconds === 33) {
      ctx.memory.markSecret('stillness', { face: 'interstice' })
      if (S.model && grow(S.here)) event(T.STILL[33], 12000)
    }
    if (seconds === 108) {
      S.dark = true
      root.setAttribute('data-dark', '')
      if (S.model) plaque(S.model)
      ctx.memory.markSecret('interstice-dark')
      event(T.STILL[108], 0)
    }
  })
  life.bus(ctx.bus, 'behavior:stir', () => {
    root.removeAttribute('data-hush')
    hum('')
    if (S.dark) {
      S.dark = false
      root.removeAttribute('data-dark')
      if (S.model) plaque(S.model)
      event(T.STILL.stir, 5000)
    }
  })
  // Restless feet echo; the building does not hurry.
  life.bus(ctx.bus, 'behavior:restless', () => { if (!humEl.textContent) hum(T.RESTLESS) })
  life.bus(ctx.bus, 'behavior:calm', () => { if (humEl.textContent === T.RESTLESS) hum('') })
  // Back from another tab: the room has one more doorway than it had.
  life.bus(ctx.bus, 'behavior:return', () => {
    if (mercy() || !S.model || S.busy) return
    if (grow(S.here)) event(T.RETURNED, 9000)
  })

  // ── the panels that dim (at most once every 4 to 7 s, never by more than 20%) ──────────────────
  const dimRng = visit.fork('dim')
  function dimLater() {
    life.timeout(() => {
      const still = (ctx.behavior?.stillFor ?? 0) >= 7
      if (!mercy() && !document.hidden && !S.dark && !still && S.cur && !S.solved) {
        const planes = Object.values(S.cur.planes).filter(Boolean)
        const p = dimRng.pick(planes)
        p.classList.add('is-dim')
        life.timeout(() => p.classList.remove('is-dim'), 640)
      }
      dimLater()
    }, dimRng.int(4000, 7000))
  }
  dimLater()

  // ── mercy ─────────────────────────────────────────────────────────────────────────────────────
  life.bus(ctx.bus, 'mercy:change', ({ on }) => {
    if (!on) { if (S.cur && S.model) mirror(S.cur, S.model); return }
    life.finishAll()
    root.removeAttribute('data-intro')
    sign.removeAttribute('data-possessed')
    for (const p of S.cur ? Object.values(S.cur.planes) : []) p?.classList.remove('is-dim')
  })

  // ── the sky, the eclipse and the wall (the ritual surfaces in the Stairwell) ────────────────────
  life.bus(ctx.bus, 'server:eclipse', () => event('The lights brown out all over the building, as if something very large had passed in front of the sun.', 12000))
  let wallSeen = ''
  life.bus(ctx.bus, 'ritual:state', ({ state }) => {
    const now = JSON.stringify((state?.wall ?? ctx.ritual?.state?.wall ?? []).slice(-3).map((x) => x?.text))
    if (now === wallSeen) return
    wallSeen = now
    if (S.model && !S.here.length && !S.busy) refresh()
  })

  // ── go ────────────────────────────────────────────────────────────────────────────────────────
  walkTo(null, S.here)
  show(S.here, null)
  intro(S.cur)
  if (S.solved) {
    pocket.hidden = false
    pocketGlyph.textContent = S.letter
    pocketLetter.textContent = S.letter
    const info = ALPHABET[S.letter]
    pocketName.textContent = info ? `${info.name}, ${info.sign}: ${info.gloss}` : ''
  }
  if (debugging) {
    debug.take = take
    debug.step = step
    debug.go = (address, how = 'far') => { const p = W.parseAddress(address); if (p) go(p, how) }
  }

  return () => {
    life.destroy()
    root.remove()
    document.title = originalTitle
    for (const k of Object.keys(debug)) delete debug[k]
    // Give the address bar back the path the visitor came in by, without the walk.
    try {
      const { interstice: _walk, ...st } = history.state && typeof history.state === 'object' ? history.state : {}
      history.replaceState(Object.keys(st).length ? st : null, '', originalPath + originalSearch + location.hash)
    } catch {}
  }
}
