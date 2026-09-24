// THE HELL LAYER: the stylesheet is possessed, and the possession is contained in the tab. Canon §8.
//
//   ctx.hell = { intensity, possess(el, {ms}), melt(el, {ms, strength}), whisper(text), invert(ms),
//                effects (names drawn by lot for this face), face }
//
// Each face is cursed differently. Intensity comes from the face (sanctum 0.3, possession 1.0,
// recruitment 0.4, ashram 0.15, departure 0.5, babel 0.2) and the omens (witching or midnight ×1.5,
// capped at 1), and the curses are drawn by lot from ctx.rng.fork('hell'):
//   phantom  a second cursor that follows yours late, or as your mirror, and wanders when you are still
//   war      the War of Grace: two real CSS rules fight over an element, scores shown, (0,1,1) vs (1,1,0)
//   melt     text and figures you rest on run like wax (feTurbulence + feDisplacementMap)
//   drift    the longer you stay, the more things creep out of their boxes; scroll or click to absolve
//   rot      paragraphs you read slowly turn into glyphs, one letter of the alphabet at a time
//   union    two neighbouring blocks collapse into one space (margin collapse, the Union), then part
//   zwar     two bodies fight up the Ladder over which is on top (only at intensity 0.5 and above)
//   possess  a word you point at is replaced by its doctrine, or by the CSS it always was
// Always, on every face: tab whispers and the sigil favicon (secret `tab-whisper`) and the Inversion
// (type !important, or ↑↑↓↓←→←→BA; secret `inversion`; emits hell:inversion {on}).
//
// All of it: off at once under mercy (and everything put back), paused while the tab is hidden, undone
// on face:leaving and drawn anew on face:ready. Faces may spare an element with data-hell="spare".
// Debug: ?debug=hell shows the lot and buttons to summon each curse (and exposes window.cascadeHell).
//        ?hell=all | none | fast | 0.8 | war,rot  (comma-separated: force curses, intensity, or haste)
import { h } from '../lib/dom.js'
import { clamp, createClock, createMotions, createVeils, bodies, KINDS } from './hell/core.js'
import { createTab } from './hell/tab.js'
import { createInversion } from './hell/inversion.js'
import { createPhantom } from './hell/phantom.js'
import { createWars } from './hell/war.js'
import { createMelt } from './hell/melt.js'
import { createDrift } from './hell/drift.js'
import { createRot, rotOrder } from './hell/rot.js'
import { createUnion } from './hell/union.js'
import { createZwar } from './hell/zwar.js'
import { createPossession } from './hell/possess.js'

export const INTENSITY = { sanctum: 0.3, possession: 1, recruitment: 0.4, ashram: 0.15, departure: 0.5, babel: 0.2 }

// The catalogue: the chance of each curse being drawn at intensity I, before the face's own leanings.
const CATALOGUE = {
  phantom: (I) => 0.15 + 0.6 * I,
  war: (I) => 0.25 + 0.75 * I,
  melt: (I) => 0.3 + 0.7 * I,
  drift: (I) => 0.35 + 0.65 * I,
  rot: (I) => 0.45 + 0.55 * I,
  union: (I) => 0.2 + 0.7 * I,
  zwar: (I) => (I >= 0.5 ? 0.35 + 1.3 * (I - 0.5) : 0),
  possess: (I) => 0.3 + 0.6 * I,
}
const LEANINGS = {
  sanctum: { rot: 1.3, melt: 1.2, drift: 0.8 },
  recruitment: { war: 1.3, phantom: 1.5, union: 1.2 },
  ashram: { union: 1.6, drift: 0.6, war: 0.6, phantom: 0.7 },
  departure: { drift: 1.7, zwar: 1.3, phantom: 1.1 },
  babel: { rot: 1.6, possess: 1.5, drift: 0.8 },
}

export async function init(ctx) {
  const params = ctx.params ?? new URLSearchParams(location.search)
  const tokens = String(params.get('hell') ?? '').toLowerCase().split(',').map((t) => t.trim()).filter(Boolean)
  const forcedI = tokens.map(Number).find((n) => Number.isFinite(n))
  const forced = new Set(tokens.filter((t) => t in CATALOGUE))
  const all = tokens.includes('all')
  const none = tokens.includes('none') || tokens.includes('off')
  const speed = tokens.includes('fast') ? 6 : 1
  const debug = (params.get('debug') ?? '').split(',').includes('hell')

  const base = ctx.rng.fork('hell')
  const order = rotOrder(base.fork('rot-order'))
  const veils = createVeils()
  const tab = createTab(ctx, base.fork('tab'))
  const inversion = createInversion(ctx, veils)
  const finePointer = matchMedia('(pointer: fine)').matches
  let session = null
  let startTimer = 0

  function intensityFor(face) {
    if (forcedI != null) return clamp(forcedI, 0, 1)
    let I = INTENSITY[face] ?? 0.3
    const sky = ctx.readSky?.() ?? ctx.sky
    if (sky?.has?.('witching') || sky?.has?.('midnight')) I *= 1.5
    return Math.min(1, I)
  }

  function drawLot(face, I, rng) {
    const lean = LEANINGS[face] ?? {}
    const drawn = {}
    const odds = {}
    for (const [name, p] of Object.entries(CATALOGUE)) {
      odds[name] = clamp(p(I) * (lean[name] ?? 1), 0, 1)
      drawn[name] = rng() < odds[name]
    }
    // Every face is cursed at least twice (the zwar never unless the intensity allows it).
    const count = () => Object.values(drawn).filter(Boolean).length
    for (const name of Object.keys(odds).sort((a, b) => odds[b] - odds[a])) {
      if (count() >= 2) break
      if (odds[name] > 0) drawn[name] = true
    }
    if (all) for (const k of Object.keys(drawn)) drawn[k] = true
    else if (forced.size) for (const k of Object.keys(drawn)) drawn[k] = forced.has(k)
    if (none) for (const k of Object.keys(drawn)) drawn[k] = false
    if (!finePointer) drawn.phantom = false
    return drawn
  }

  // ── An in-page whisper, near the hand ──────────────────────────────────────────────────────
  // Written on the veil of words, which mercy does not take away: a face that asks the temple to
  // whisper is still heard under mercy, only without the drift (mercy stills the transition).
  const whispers = new Set()
  function whisper(text, { quiet = false } = {}) {
    const t = String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, 140)
    if (!t) return false
    if (tab.whisperToTab(t)) return true
    for (const old of [...whispers].slice(0, Math.max(0, whispers.size - 2))) { old.remove(); whispers.delete(old) }
    const node = h('p', { class: 'hell-whisper' }, t)
    veils.words.append(node)
    // Beside the hand when there is one; otherwise high in the middle. Measured once, kept on screen.
    const vw = document.documentElement.clientWidth || innerWidth
    const w = Math.min(node.offsetWidth, vw - 16)
    const p = ctx.behavior?.pointer
    const touchy = !finePointer || !p
    let x = touchy ? (vw - w) / 2 : p.x + 18
    if (!touchy && x + w > vw - 8) x = p.x - 14 - w // no room to the right: speak from the left of the hand
    x = clamp(x, 8, Math.max(8, vw - w - 8))
    const y = touchy ? innerHeight * 0.3 : clamp(p.y - 30, 24, innerHeight - 90)
    node.style.setProperty('--x', `${Math.round(x)}px`)
    node.style.setProperty('--y', `${Math.round(y)}px`)
    whispers.add(node)
    requestAnimationFrame(() => node.classList.add('is-shown'))
    setTimeout(() => node.classList.remove('is-shown'), 3400)
    setTimeout(() => { node.remove(); whispers.delete(node) }, 4600)
    if (!quiet) veils.say(t)
    return true
  }

  // ── A session: one face, one lot ───────────────────────────────────────────────────────────
  function start() {
    clearTimeout(startTimer)
    if (session || ctx.mercy?.on || !ctx.root || !ctx.face) return
    const face = ctx.face
    const I = intensityFor(face)
    const lot = base.fork(`${face}/${ctx.schisms ?? 0}`)
    const drawn = drawLot(face, I, lot.fork('lot'))
    const clock = createClock(ctx, speed)
    const motions = createMotions()
    const env = { ctx, clock, motions, veils, I, speed, rotOrder: order, whisper }
    const make = (name, fn) => {
      try { return fn({ ...env, rng: lot.fork(name) }) } catch (e) { console.error(`[layer:hell] ${name}`, e); return null }
    }
    const fx = {}
    // The machinery of possess() and melt() always exists; the lot only decides if it roams by itself.
    fx.rot = make('rot', (e) => createRot(e, { ambient: drawn.rot }))
    fx.melt = make('melt', (e) => createMelt(e, { ambient: drawn.melt }))
    if (drawn.war) fx.war = make('war', createWars)
    if (drawn.drift) fx.drift = make('drift', createDrift)
    if (drawn.union) fx.union = make('union', createUnion)
    if (drawn.zwar) fx.zwar = make('zwar', createZwar)
    if (drawn.possess) fx.possess = make('possess', createPossession)
    // The phantom's hand: where it rests, a word is taken or the thing melts.
    env.pickWritten = () => {
      const pool = bodies(ctx.root, `${KINDS.heading}, ${KINDS.text}`, { text: true, minChars: 12, margin: -80 })
      return pool.length ? lot.pick(pool) : null
    }
    env.touch = (el, x, y) => (fx.possess?.at(x, y)) || fx.melt?.melt(el, { ms: 5200, strength: 0.8 })
    if (drawn.phantom) fx.phantom = make('phantom', createPhantom)
    session = { face, I, drawn, clock, motions, fx, releases: new Set() }
    for (const k of Object.keys(fx)) if (!fx[k]) delete fx[k]
    renderDebug()
  }

  function stop() {
    clearTimeout(startTimer)
    if (!session) return
    const s = session
    session = null
    for (const release of s.releases) { try { release() } catch {} }
    for (const [name, f] of Object.entries(s.fx)) {
      try { f.stop() } catch (e) { console.error(`[layer:hell] stop ${name}`, e) }
    }
    s.motions.cancel()
    s.clock.stop()
    veils.clear()
    document.querySelectorAll('[data-hell-possessed]').forEach((el) => el.removeAttribute('data-hell-possessed'))
    renderDebug()
  }

  const later = (ms) => {
    clearTimeout(startTimer)
    startTimer = setTimeout(start, ms)
  }

  // ── The API ────────────────────────────────────────────────────────────────────────────────
  function possess(el, { ms = 6500 } = {}) {
    const s = session
    if (!s || !(el instanceof Element) || ctx.mercy?.on || !s.fx.rot) return () => {}
    el.setAttribute('data-hell-possessed', '')
    const unrot = s.fx.rot.possess(el, { ms })
    let done = false
    const release = () => {
      if (done) return
      done = true
      s.releases.delete(release)
      try { unrot() } catch {}
      el.removeAttribute('data-hell-possessed')
    }
    s.releases.add(release)
    if (Number.isFinite(ms)) s.clock.after(ms, release)
    return release
  }

  function melt(el, opts = {}) {
    if (!session?.fx.melt || !(el instanceof Element)) return () => {}
    return session.fx.melt.melt(el, opts)
  }

  ctx.hell = {
    get intensity() { return session?.I ?? intensityFor(ctx.face) },
    get face() { return session?.face ?? null },
    get effects() { return session ? Object.keys(session.drawn).filter((k) => session.drawn[k]) : [] },
    get inverted() { return inversion.on },
    possess,
    melt,
    whisper,
    invert: (ms = 7000) => inversion.invert(ms, 'api'),
  }

  // ── The life of the layer ──────────────────────────────────────────────────────────────────
  ctx.bus.on('face:leaving', () => stop())
  ctx.bus.on('face:ready', () => { stop(); later(900) })
  ctx.bus.on('mercy:change', ({ on } = {}) => {
    if (on) stop()
    else later(600)
  })
  // While the temple turns over (and back), the tags that follow its elements are carried round with
  // them; they stay upright themselves, so the annotations can still be read on an inverted page.
  ctx.bus.on('hell:inversion', () => {
    for (const ms of [250, 700, 1150, 1450]) setTimeout(() => veils.refresh(), ms)
  })
  document.addEventListener('visibilitychange', () => {
    if (!session) return
    if (document.hidden) {
      session.motions.pause()
      session.fx.phantom?.pause()
    } else {
      session.motions.resume()
      session.fx.phantom?.resume()
    }
  })

  // ── ?debug=hell: the lot laid bare ─────────────────────────────────────────────────────────
  let panel = null
  function renderDebug() {
    if (!debug) return
    panel?.remove()
    const s = session
    const names = Object.keys(CATALOGUE)
    const trig = {
      invert: () => inversion.invert(7000, 'debug'),
      whisper: () => whisper('come back to the flow ☩'),
      possessEl: () => { const p = bodies(ctx.root, KINDS.heading, { text: true })[0]; if (p) possess(p.el) },
    }
    panel = h('section', { class: 'hell-debug', 'aria-label': 'Hell layer debug' },
      h('h2', {}, `hell · ${ctx.face ?? '—'} · I ${(s?.I ?? intensityFor(ctx.face)).toFixed(2)}${speed > 1 ? ' · fast' : ''}`),
      h('p', {}, names.map((n) => h('span', { class: s?.drawn[n] ? 'is-on' : '' }, `${s?.drawn[n] ? '✓' : '·'} ${n} `))),
      h('p', {}, [
        ...['war', 'union', 'zwar', 'drift', 'rot', 'melt', 'possess'].map((n) => h('button', { type: 'button', onclick: () => session?.fx[n]?.trigger?.() }, n)),
        h('button', { type: 'button', onclick: trig.possessEl }, 'possess(h)'),
        h('button', { type: 'button', onclick: trig.invert }, 'invert'),
        h('button', { type: 'button', onclick: trig.whisper }, 'whisper'),
      ]),
    )
    ;(document.getElementById('layers') ?? document.body).append(panel)
  }
  if (debug) {
    document.documentElement.dataset.debug = [document.documentElement.dataset.debug, 'hell'].filter(Boolean).join(' ')
    window.cascadeHell = {
      ctx,
      get session() { return session },
      trigger: (name) => session?.fx[name]?.trigger?.(),
      api: ctx.hell,
      tab,
      inversion,
      start,
      stop,
    }
  }

  start()
}
