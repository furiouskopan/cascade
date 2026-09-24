// MELTING. The Laying on of Hands (:hover) is answered badly: text and figures you rest on begin to run
// downward like warm wax, in vertical strands. An SVG filter does it: feTurbulence makes the strands,
// feComponentTransfer biases them so pixels are only pulled from above (they drip, never rise), and
// feDisplacementMap pours the element through them. Each melt has its own filter; the filter leaves the
// element the moment the melt is over, so nothing costs anything at rest.
import { bodies, KINDS, SPARE, clamp, seen } from './core.js'

const NS = 'http://www.w3.org/2000/svg'
let defs = null
let serial = 0

function ensureDefs() {
  if (defs?.isConnected) return defs
  defs = document.createElementNS(NS, 'svg')
  defs.setAttribute('class', 'hell-defs')
  defs.setAttribute('aria-hidden', 'true')
  defs.setAttribute('focusable', 'false')
  defs.setAttribute('width', '0')
  defs.setAttribute('height', '0')
  document.body.append(defs)
  return defs
}

function el(name, attrs) {
  const n = document.createElementNS(NS, name)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n
}

// 1. The sag. The displacement map reads (x + s·(R − ½), y + s·(G − ½)). G is folded into [0, ½] by a
//    table, so every pixel is pulled from above it (the ink sags; nothing rises), unevenly from strand to
//    strand. R is folded close to ½, so the strands only tremble sideways. Narrow in x, long in y.
// 2. The drip. The sagged ink is smeared downward (a blur in y only), dropped a little lower, and kept
//    only in the strands that sag most (an alpha mask made from the same noise), then laid beneath.
function makeFilter(seed, fx, fy) {
  const id = `hell-melt-${++serial}`
  const f = el('filter', { id, x: '-6%', y: '-10%', width: '112%', height: '180%', 'color-interpolation-filters': 'sRGB' })
  const bias = el('feComponentTransfer', { in: 'strands', result: 'bias' })
  bias.append(
    el('feFuncR', { type: 'linear', slope: 0.24, intercept: 0.38 }),
    el('feFuncG', { type: 'table', tableValues: '0 0 0.04 0.2 0.38 0.5 0.5' }),
  )
  const map = el('feDisplacementMap', { in: 'SourceGraphic', in2: 'bias', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G', result: 'sag' })
  const blur = el('feGaussianBlur', { in: 'sag', stdDeviation: '0 0', result: 'smear' })
  const off = el('feOffset', { in: 'smear', dx: 0, dy: 0, result: 'fall' })
  const merge = el('feMerge', {})
  merge.append(el('feMergeNode', { in: 'drip' }), el('feMergeNode', { in: 'sag' }))
  f.append(
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: `${fx} ${fy}`, numOctaves: 2, seed, result: 'strands' }),
    bias,
    map,
    blur,
    off,
    // alpha = 2.2 − 3.6·G: where the strand sags hardest (G low) the smear is whole; where it barely
    // sags (G above ~0.6) there is none.
    el('feColorMatrix', { in: 'strands', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 -3.6 0 0 2.2', result: 'where' }),
    el('feComposite', { in: 'fall', in2: 'where', operator: 'in', result: 'drip' }),
    merge,
  )
  ensureDefs().append(f)
  return { id, f, map, blur, off }
}

export function createMelt(env, { ambient = true } = {}) {
  const { ctx, rng, clock, I } = env
  const melts = new Map() // element -> melt
  const lot = new WeakMap() // element -> meltable?
  const odds = clamp(0.16 + 0.6 * I, 0, 0.85)
  const peak = 8 + 20 * I
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches
  let hovered = null
  let hoverTimer = 0
  let dead = false

  function begin(target, { peakScale = peak, rise = 2600 } = {}) {
    if (dead || ctx.mercy?.on || !target?.isConnected) return null
    let m = melts.get(target)
    if (!m) {
      const { id, f, map, blur, off } = makeFilter(rng.int(1, 999), rng.float(0.045, 0.085).toFixed(4), rng.float(0.0015, 0.004).toFixed(4))
      const cs = getComputedStyle(target)
      // Big letters run further than small ones; a figure runs like a heading.
      const size = /^(img|svg|picture|figure)$/i.test(target.tagName) ? 30 : parseFloat(cs.fontSize) || 16
      m = { target, id, f, map, blur, off, scale: 0, goal: 0, speed: 0, raf: 0, last: 0, k: clamp(size / 18, 0.8, 2.2), prevInline: target.style.filter, base: cs.filter !== 'none' ? cs.filter : '' }
      target.style.filter = `${m.base} url(#${id})`.trim()
      target.setAttribute('data-hell-melting', '')
      melts.set(target, m)
    }
    // Never more than 40px of sag: a melted heading should still be half-legible, like old wax.
    to(m, Math.min(40, peakScale * m.k), rise)
    return m
  }

  function to(m, goal, ms) {
    m.goal = goal
    m.speed = Math.abs(goal - m.scale) / Math.max(120, ms)
    if (!m.raf) { m.last = performance.now(); m.raf = requestAnimationFrame((t) => step(m, t)) }
  }

  // At most ~24 writes a second to three attributes of one filter.
  function step(m, now) {
    m.raf = 0
    if (dead || ctx.mercy?.on) return finish(m)
    const dt = now - m.last
    if (dt >= 40) {
      m.last = now
      const d = m.goal - m.scale
      m.scale += Math.sign(d) * Math.min(Math.abs(d), m.speed * dt)
      m.map.setAttribute('scale', m.scale.toFixed(2))
      m.blur.setAttribute('stdDeviation', `0 ${(m.scale * 0.3).toFixed(2)}`)
      m.off.setAttribute('dy', (m.scale * 0.42).toFixed(2))
      if (m.goal === 0 && m.scale <= 0.01) return finish(m)
      if (Math.abs(m.goal - m.scale) < 0.01) return // resting at the goal: no loop
    }
    m.raf = requestAnimationFrame((t) => step(m, t))
  }

  function release(target, ms = 900) {
    const m = melts.get(target)
    if (m) to(m, 0, ms)
  }

  function finish(m) {
    cancelAnimationFrame(m.raf)
    m.raf = 0
    melts.delete(m.target)
    m.target.style.filter = m.prevInline
    if (!m.target.getAttribute('style')) m.target.removeAttribute('style')
    m.target.removeAttribute('data-hell-melting')
    m.f.remove()
  }

  // melt(el): the API for faces. Rises, holds, sets. Returns a function that ends it early.
  function melt(target, { ms = 6000, strength = 1 } = {}) {
    if (!(target instanceof Element)) return () => {}
    const m = begin(target, { peakScale: peak * clamp(strength, 0.2, 2), rise: ms * 0.45 })
    if (!m) return () => {}
    const cancel = clock.after(ms * 0.7, () => release(target, ms * 0.3))
    return () => { cancel(); release(target, 500) }
  }

  // ── The hand rests on something ─────────────────────────────────────────────────────────────
  const onOver = (e) => {
    if (!canHover || e.pointerType === 'touch') return
    const t = e.target instanceof Element ? e.target.closest(KINDS.block) : null
    if (!t || t === hovered || !ctx.root.contains(t) || t.closest(SPARE)) return
    if (hovered) { clearTimeout(hoverTimer); release(hovered) }
    hovered = t
    if (!lot.has(t)) lot.set(t, rng() < odds)
    if (!lot.get(t)) return
    const r = t.getBoundingClientRect()
    if (r.width * r.height > innerWidth * innerHeight * 0.35) return
    hoverTimer = setTimeout(() => { if (hovered === t && !document.hidden) begin(t, { rise: 3200 }) }, 700)
  }
  const onOut = (e) => {
    if (!hovered || hovered.contains(e.relatedTarget)) return
    clearTimeout(hoverTimer)
    release(hovered)
    hovered = null
  }
  if (ambient) {
    ctx.root.addEventListener('pointerover', onOver, { passive: true })
    ctx.root.addEventListener('pointerout', onOut, { passive: true })
  }

  // A heading or a figure the visitor can see, not yet melting.
  function visibleOne() {
    const pool = bodies(ctx.root, `${KINDS.figure}, ${KINDS.heading}`, { maxArea: 0.3, margin: -60 })
    return rng.shuffle(pool).find(({ el, r }) => !melts.has(el) && seen(el, r))?.el ?? null
  }

  // Now and then something melts on its own (and on touch screens this is the only way it happens).
  function spell() {
    if (dead) return
    if (rng.chance(0.35 + I * 0.4) && melts.size < 2) {
      const one = visibleOne()
      if (one) melt(one, { ms: rng.float(5000, 9000), strength: rng.float(0.6, 1.1) })
    }
    clock.after(rng.float(30000, 80000) / (0.3 + I), spell)
  }
  if (ambient) clock.after(rng.float(20000, 50000) / (0.3 + I), spell)

  return {
    ambient,
    melt,
    trigger() {
      const one = visibleOne()
      if (!one) return false
      melt(one, { ms: 7000 })
      return true
    },
    begin,
    release,
    get count() { return melts.size },
    stop() {
      dead = true
      clearTimeout(hoverTimer)
      ctx.root.removeEventListener('pointerover', onOver)
      ctx.root.removeEventListener('pointerout', onOut)
      for (const m of [...melts.values()]) finish(m)
    },
  }
}
