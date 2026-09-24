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

// The clock of hell: time passes only while the tab is seen, mercy is not asked, and the session lives.
// Resolution 200 ms; `speed` > 1 makes every curse hurry (?hell=fast).
export function createClock(ctx, speed = 1) {
  const timers = new Set()
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
  return {
    speed,
    active,
    after,
    wait: (ms) => new Promise((resolve) => after(ms, resolve)),
    // Seconds of seen, merciless time since this session began (scaled by speed).
    get elapsed() { return (activeMs * speed) / 1000 },
    get dead() { return dead },
    stop() {
      dead = true
      timers.clear()
      clearInterval(iv)
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

// The fixed veil (inside #layers, above the page, below mercy) and the scrolling sheet of marks.
export function createVeils() {
  const layers = document.getElementById('layers') ?? document.body
  const veil = h('div', { class: 'hell-veil hell-only', 'aria-hidden': 'true' })
  const status = h('p', { class: 'visually-hidden hell-status' })
  layers.append(veil, status)

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
      reads.push([node, m, m.el.getBoundingClientRect(), node.offsetWidth, node.offsetHeight])
    }
    for (const [node, m, r, w, hh] of reads) {
      if (!m) { node.hidden = true; continue }
      const [x, y] = m.place(r, w, hh)
      const cx = clamp(x, 4, vw - w - 4)
      node.style.translate = `${Math.round(cx + sx)}px ${Math.round(y + sy)}px`
      node.hidden = r.bottom < -40 || r.top > innerHeight + 40
    }
  }
  const schedule = () => { if (!raf && marks.size) raf = requestAnimationFrame(refresh) }
  // Faces with their own scrolling rooms move elements without moving the document.
  const onScroll = (e) => { if (e.target !== document && marks.size) schedule() }
  addEventListener('scroll', onScroll, { capture: true, passive: true })
  addEventListener('resize', schedule, { passive: true })

  return {
    veil,
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
