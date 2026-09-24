// THE MACHINERY OF HELL: what every curse shares.
// - a clock that stops whenever the visitor looks away or asks for mercy (every curse keeps time by it),
// - the finder of bodies (headings, paragraphs, figures, list items inside #temple, on any face),
// - the two veils the curses draw on: a fixed veil inside #layers and a sheet of marks that scrolls with
//   the page, for the little tags that show scores and rungs,
// - a register of motions (Web Animations), so they can all be paused, resumed or undone at once.
import { h } from '../../lib/dom.js'

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

// Never touched by any curse: the puzzle and its relics, forms, anything live, anything a face spared.
// Faces may spare an element (and everything inside it) with data-hell="spare".
export const SPARE = [
  '#ladder', '#rubrics', '.rubric', '[data-hell="spare"]', '[data-secrets-skip]', '[data-inscription]', '.inscription',
  '.rosetta', 'input', 'textarea', 'select', 'button', 'option', 'label', 'form', '[contenteditable]', '[aria-live]',
  '[role="status"]', '[role="log"]', '[role="alert"]', '[role="dialog"]', 'dialog', '[hidden]', '.visually-hidden',
  'script', 'style', 'noscript', 'canvas', 'video', 'iframe', 'marquee', 'details',
].join(',')
// The written word is spared a little more: glyph text is already rotted, code is already truth.
export const TEXT_SPARE = `${SPARE},.glyph,[lang="x-cascade"],pre,code,kbd,samp,svg,math,[aria-hidden="true"]`

export const KINDS = {
  text: 'p, li, blockquote, dd, figcaption',
  heading: 'h1, h2, h3, h4, h5, h6',
  figure: 'figure, img, picture, svg:not(svg svg)',
  block: 'p, li, blockquote, dd, figcaption, figure, h1, h2, h3, h4, h5, h6, img, svg:not(svg svg)',
}

const inViewport = (r, margin = 0) => r.bottom > -margin && r.top < innerHeight + margin && r.right > 0 && r.left < innerWidth

// Bodies the curses may take. Reads layout once per call (no writes), so call it sparingly.
export function bodies(root, selector, opt = {}) {
  const { text = false, inView = true, margin = 0, maxArea = 0.42, minW = 24, minH = 10, minChars = 0, cap = 3000 } = opt
  if (!root?.isConnected) return []
  const spare = text ? TEXT_SPARE : SPARE
  const vw = innerWidth
  const vh = innerHeight
  const out = []
  const list = root.querySelectorAll(selector)
  let seen = 0
  for (const el of list) {
    if (++seen > cap) break
    if (el.closest(spare) || el.closest('[data-hell-moving]')) continue
    const r = el.getBoundingClientRect()
    if (inView && out.length && r.top > vh + 1600) break // document order: the rest lie further down
    if (r.width < minW || r.height < minH) continue
    if (inView && !inViewport(r, margin)) continue
    if (r.width * r.height > vw * vh * maxArea) continue
    if (minChars && (el.textContent || '').trim().length < minChars) continue
    out.push({ el, r })
  }
  return out
}

// An element is quiet when no face animation is moving it and no transform of the face's own would be
// overwritten by ours. Reads computed style: only call for the few bodies actually chosen.
export function quiet(el) {
  if (!el?.isConnected) return false
  try {
    if (el.getAnimations?.().length) return false
    const cs = getComputedStyle(el)
    if (cs.translate !== 'none' || cs.rotate !== 'none' || cs.scale !== 'none') return false
    if (cs.position === 'fixed' || cs.position === 'sticky') return false
    if (cs.display === 'inline' || cs.display === 'contents' || cs.display === 'none') return false
    if (el.querySelectorAll('*').length > 60) return false
  } catch {
    return false
  }
  return true
}

// Whether the visitor can really see the element: nothing of the face's own (a cookie banner, a fixed bar,
// a dialog) lies over it. Hit-tests three points across its middle and wants two of them clear. A curse
// with a tag must not fight over something hidden, or its tag floats over whatever hides it.
// A few hit tests: only call it for the bodies a curse has already chosen.
export function seen(el, r = el.getBoundingClientRect()) {
  let clear = 0
  let tried = 0
  for (const fx of [0.5, 0.18, 0.82]) {
    const x = r.left + r.width * fx
    const y = r.top + r.height * 0.5
    if (x < 1 || y < 1 || x > innerWidth - 1 || y > innerHeight - 1) continue
    tried++
    const top = document.elementFromPoint(x, y)
    // The hit landed on the element, inside it, or passed through it to an ancestor: nothing lies over it.
    if (top && (top === el || el.contains(top) || top.contains(el))) clear++
  }
  return tried > 0 && clear >= Math.min(2, tried)
}

// The colour of the page behind an element: its own background, or the first ancestor that has one.
// A body lifted over another is given this paper, so the one on top really hides the one beneath.
const CLEAR = /^(transparent|rgba\([^)]*,\s*0\))$/
export function paperOf(el) {
  for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
    const bg = getComputedStyle(p).backgroundColor
    if (bg && !CLEAR.test(bg.replace(/\s+/g, ' '))) return bg
  }
  return getComputedStyle(document.documentElement).backgroundColor || '#0b0b0b'
}

// The clock of hell: time passes only while the tab is seen, mercy is not asked, and the session lives.
// Resolution 200 ms; `speed` > 1 makes every curse hurry (?hell=fast).
export function createClock(ctx, speed = 1) {
  const timers = new Set()
  const waiting = new Set() // resolvers of wait(): released when the session dies, so no curse hangs forever
  let last = performance.now()
  let dead = false
  let activeMs = 0
  const active = () => !dead && !document.hidden && !ctx.mercy?.on
  const tick = () => {
    const now = performance.now()
    const dt = Math.min(1000, now - last)
    last = now
    if (!active()) return
    activeMs += dt
    for (const t of [...timers]) {
      if (!timers.has(t)) continue
      t.left -= dt
      if (t.left > 0) continue
      timers.delete(t)
      try { t.fn() } catch (e) { console.error('[layer:hell]', e) }
    }
  }
  const iv = setInterval(tick, 200)
  const after = (ms, fn) => {
    const t = { left: Math.max(0, ms) / speed, fn }
    timers.add(t)
    return () => timers.delete(t)
  }
  // A wait that outlives its session resolves at once (every curse checks that it is still alive after
  // each await), so the war, the union and the z-war let go of the elements they held.
  const wait = (ms) => new Promise((resolve) => {
    if (dead) return resolve()
    const done = () => { waiting.delete(done); resolve() }
    waiting.add(done)
    after(ms, done)
  })
  return {
    speed,
    active,
    after,
    wait,
    // Seconds of seen, merciless time since this session began (scaled by speed).
    get elapsed() { return (activeMs * speed) / 1000 },
    get dead() { return dead },
    stop() {
      dead = true
      timers.clear()
      clearInterval(iv)
      for (const done of [...waiting]) done()
    },
  }
}

// Motions: Web Animations on the individual `translate` / `rotate` properties, so a face's own
// `transform` is never overwritten. All of them pause with the tab and die with mercy.
export function createMotions() {
  const all = new Set()
  const held = new Set()
  return {
    animate(el, keyframes, opts) {
      const a = el.animate(keyframes, { fill: 'forwards', ...opts })
      all.add(a)
      a.addEventListener('cancel', () => { all.delete(a); held.delete(a) })
      // A motion that holds nothing when it ends (a return home) is forgotten when it ends; one that
      // holds its pose stays registered until it is cancelled.
      if (opts?.fill === 'none') a.addEventListener('finish', () => { all.delete(a); held.delete(a) })
      if (document.hidden) { a.pause(); held.add(a) }
      return a
    },
    forget(a) { all.delete(a); held.delete(a) },
    pause() {
      for (const a of all) if (a.playState === 'running') { a.pause(); held.add(a) }
    },
    resume() {
      for (const a of held) if (a.playState === 'paused') a.play()
      held.clear()
    },
    cancel() {
      for (const a of [...all]) { try { a.cancel() } catch {} }
      all.clear()
      held.clear()
    },
  }
}

// The value of an animated `translate` right now, as [x, y] px (for undoing a motion from where it is).
export function currentTranslate(el) {
  const t = getComputedStyle(el).translate
  if (!t || t === 'none') return [0, 0]
  const [x = '0', y = '0'] = t.split(' ')
  return [parseFloat(x) || 0, parseFloat(y) || 0]
}
export function currentRotate(el) {
  const r = getComputedStyle(el).rotate
  return r && r !== 'none' ? parseFloat(r) || 0 : 0
}

// Where the written part of an element is. A centred heading in a full-width block has its words in the
// middle, not at the block's left edge, so a tag that follows it should follow the ink. Clipped to the
// element's own box; figures and empty elements answer with that box. Includes our own transforms.
const NO_INK = /^(img|svg|picture|figure|canvas|video)$/i
export function inkRect(el) {
  const r = el.getBoundingClientRect()
  if (!el.firstChild || NO_INK.test(el.tagName)) return r
  try {
    const range = document.createRange()
    range.selectNodeContents(el)
    const t = range.getBoundingClientRect()
    const left = Math.max(r.left, t.left)
    const right = Math.min(r.right, t.right)
    const top = Math.max(r.top, t.top)
    const bottom = Math.min(r.bottom, t.bottom)
    if (!t.width || right - left < 12 || bottom - top < 6) return r
    return { left, right, top, bottom, width: right - left, height: bottom - top }
  } catch {
    return r
  }
}

// The fixed veil (inside #layers, above the page, below mercy) and the scrolling sheet of marks.
// The veil is hell-only: mercy hides it with everything that moves. `words` is not: what the temple says
// when a secret is spoken (the Inversion) is still said under mercy, only without the turning.
export function createVeils() {
  const layers = document.getElementById('layers') ?? document.body
  const veil = h('div', { class: 'hell-veil hell-only', 'aria-hidden': 'true' })
  const words = h('div', { class: 'hell-veil hell-veil--words', 'aria-hidden': 'true' })
  const status = h('p', { class: 'visually-hidden hell-status' })
  layers.append(veil, words, status)

  const sheet = h('div', { class: 'hell-marks hell-only', 'aria-hidden': 'true' })
  document.body.append(sheet)

  // Marks follow an element: { node, el, place(rect, w, h) -> [x, y] } in document coordinates.
  const marks = new Map()
  let raf = 0
  const refresh = () => {
    raf = 0
    const sx = scrollX
    const sy = scrollY
    const vw = document.documentElement.clientWidth || innerWidth
    const reads = []
    for (const [node, m] of marks) {
      if (!m.el.isConnected || !node.isConnected) { reads.push([node, null]); continue }
      reads.push([node, m, inkRect(m.el), node.offsetWidth, node.offsetHeight])
    }
    // Tags never lie on one another. The elder keeps its place; a younger one that would cover it steps
    // aside, up or down (whichever is the shorter way the first time, then on in that direction).
    const placed = []
    for (const [node, m, r, w, hh] of reads) {
      if (!m) { node.hidden = true; continue }
      const [x, y0] = m.place(r, w, hh)
      const cx = clamp(x, 4, vw - w - 4)
      let y = y0
      let dir = 0
      for (let tries = 0; tries < 8; tries++) {
        const hit = placed.find((p) => cx < p.x + p.w + 4 && cx + w + 4 > p.x && y < p.y + p.h + 3 && y + hh + 3 > p.y)
        if (!hit) break
        const up = hit.y - hh - 4
        const down = hit.y + hit.h + 4
        if (!dir) dir = up > 4 && y - up <= down - y ? -1 : 1
        y = dir < 0 ? up : down
      }
      const off = r.bottom < -40 || r.top > innerHeight + 40
      if (!off) placed.push({ x: cx, y, w, h: hh })
      node.style.translate = `${Math.round(cx + sx)}px ${Math.round(y + sy)}px`
      // Kept in the layout while off screen (visibility, not display), so it can still be measured.
      node.style.visibility = off ? 'hidden' : ''
    }
  }
  const schedule = () => { if (!raf && marks.size) raf = requestAnimationFrame(refresh) }
  // Faces with their own scrolling rooms move elements without moving the document.
  const onScroll = (e) => { if (e.target !== document && marks.size) schedule() }
  addEventListener('scroll', onScroll, { capture: true, passive: true })
  addEventListener('resize', schedule, { passive: true })

  return {
    veil,
    words,
    sheet,
    say(text) {
      status.textContent = ''
      requestAnimationFrame(() => { status.textContent = text })
    },
    mark(el, node, place = aboveStart) {
      sheet.append(node)
      marks.set(node, { el, place })
      schedule()
      return node
    },
    unmark(node) {
      marks.delete(node)
      node.remove()
    },
    refresh: schedule,
    clear() {
      for (const node of marks.keys()) node.remove()
      marks.clear()
    },
  }
}

export const aboveStart = (r, w, hh) => [r.left, r.top - hh - 6 < 4 ? r.bottom + 6 : r.top - hh - 6]
export const belowStart = (r) => [r.left, r.bottom + 6]

// Weighted chance helper for the lot: p clamped into [0, 1].
export const chance = (rng, p) => rng() < clamp(p, 0, 1)
