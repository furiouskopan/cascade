// The Launderette's housekeeping: everything it starts, it can stop (faces are swapped mid-visit, CANON §3),
// plus the small instruments of the room: SVG builders, a moon drawn from its phase, colour tidying for the
// care labels, and a seven-segment display for the machines.
const SVGNS = 'http://www.w3.org/2000/svg'

export function makeLife() {
  const cleanups = []
  const timers = new Set()
  let dead = false
  cleanups.push(() => { timers.forEach(clearTimeout); timers.clear() })
  return {
    get dead() { return dead },
    add(fn) { cleanups.push(fn); return fn },
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts)
      cleanups.push(() => target.removeEventListener(type, fn, opts))
    },
    bus(bus, event, fn) {
      const off = bus?.on?.(event, (d) => { if (!dead) fn(d ?? {}) })
      if (off) cleanups.push(off)
    },
    // One-shot timers forget themselves when they fire. Returns a cancel function.
    timeout(fn, ms) {
      const id = setTimeout(() => { timers.delete(id); if (!dead) fn() }, ms)
      timers.add(id)
      return () => { clearTimeout(id); timers.delete(id) }
    },
    // Repeating work sleeps while the tab is hidden.
    interval(fn, ms) {
      const id = setInterval(() => { if (!dead && !document.hidden) fn() }, ms)
      cleanups.push(() => clearInterval(id))
      return () => clearInterval(id)
    },
    observe(observer) {
      cleanups.push(() => observer.disconnect())
      return observer
    },
    wait(ms) {
      return new Promise((resolve) => {
        const id = setTimeout(() => { timers.delete(id); resolve(!dead) }, ms)
        timers.add(id)
      })
    },
    destroy() {
      dead = true
      for (const fn of cleanups.splice(0).reverse()) {
        try { fn() } catch (e) { console.error('[launderette]', e) }
      }
    },
  }
}

// An SVG element with attributes (trusted, generated values only).
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) el.setAttribute(k, String(v))
  for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  return el
}

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
export const pad = (n, w = 2) => String(n).padStart(w, '0')
export const f2 = (n) => Math.round(n * 100) / 100

// A moon drawn from its phase (0 new, 0.5 full), lit limb on the right while waxing.
export function moonPath(phase, r) {
  const p = ((phase % 1) + 1) % 1
  const k = Math.cos(p * 2 * Math.PI)
  const rx = Math.abs(k) * r
  const waxing = p < 0.5
  const crescent = k > 0
  const termSweep = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0)
  return `M0 ${f2(-r)} A${f2(r)} ${f2(r)} 0 0 ${waxing ? 1 : 0} 0 ${f2(r)} A${f2(rx)} ${f2(r)} 0 0 ${termSweep} 0 ${f2(-r)} Z`
}

// rgb(255, 63, 180) -> #ff3fb4; anything transparent -> 'transparent'. Other values pass through.
export function tidyColor(v) {
  const m = String(v).match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+%?))?\s*\)$/)
  if (!m) return String(v)
  const alpha = m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
  if (alpha === 0) return 'transparent'
  const hex = '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
  return alpha < 1 ? `${hex} @ ${Math.round(alpha * 100)}%` : hex
}

// ── The seven-segment display ─────────────────────────────────────────────────────────────────────
// Four cells and a colon, drawn once; set() only lights segments. Unlit segments stay as ghosts.
const SEGMENTS = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
  '-': 'g', ' ': '', _: 'd', A: 'abcefg', b: 'cdefg', C: 'adef', c: 'deg', d: 'bcdeg', E: 'adefg', F: 'aefg', H: 'bcefg',
  h: 'cefg', L: 'def', n: 'ceg', o: 'cdeg', O: 'abcdef', P: 'abefg', r: 'eg', S: 'afgcd', t: 'defg', U: 'bcdef', u: 'cde',
  y: 'bcdfg', I: 'ef', i: 'e', G: 'acdef', J: 'bcde', q: 'abcfg',
}
const hbar = (x1, x2, y) => `${x1},${y} ${x1 + 1},${y - 1} ${x2 - 1},${y - 1} ${x2},${y} ${x2 - 1},${y + 1} ${x1 + 1},${y + 1}`
const vbar = (x, y1, y2) => `${x},${y1} ${x + 1},${y1 + 1} ${x + 1},${y2 - 1} ${x},${y2} ${x - 1},${y2 - 1} ${x - 1},${y1 + 1}`
const GEOMETRY = {
  a: hbar(1.6, 8.4, 1), g: hbar(1.6, 8.4, 9), d: hbar(1.6, 8.4, 17),
  f: vbar(1, 1.6, 8.4), b: vbar(9, 1.6, 8.4), e: vbar(1, 9.6, 16.4), c: vbar(9, 9.6, 16.4),
}
const CELL_X = [0, 12, 28, 40] // the colon sits between the first and second cell

export function segDisplay(label = '') {
  const cells = CELL_X.map((x) => {
    const g = s('g', { transform: `translate(${x} 0) skewX(-6)` })
    const segs = {}
    for (const [k, pts] of Object.entries(GEOMETRY)) {
      segs[k] = s('polygon', { points: pts, class: 'seg' })
      g.append(segs[k])
    }
    return { g, segs }
  })
  const colon = s('g', { class: 'seg-colon' }, s('rect', { x: 22.6, y: 5, width: 1.8, height: 1.8, class: 'seg' }), s('rect', { x: 21.6, y: 11.4, width: 1.8, height: 1.8, class: 'seg' }))
  const el = s('svg', { viewBox: '-1 -1 52 20', class: 'lnd-seg', 'aria-hidden': 'true', focusable: 'false' }, ...cells.map((c) => c.g), colon)
  let last = null
  function set(text) {
    const t = String(text ?? '')
    if (t === last) return
    last = t
    const hasColon = t.includes(':')
    const chars = [...t.replace(':', '')].slice(-4)
    while (chars.length < 4) chars.unshift(' ')
    cells.forEach((cell, i) => {
      const lit = SEGMENTS[chars[i]] ?? SEGMENTS[String(chars[i]).toUpperCase()] ?? ''
      for (const [k, poly] of Object.entries(cell.segs)) poly.classList.toggle('on', lit.includes(k))
    })
    for (const r of colon.children) r.classList.toggle('on', hasColon)
  }
  set(label)
  return { el, set }
}

// m:ss for a number of seconds (the machines count in minutes and seconds).
export function mss(sec) {
  const n = Math.max(0, Math.ceil(sec))
  return `${Math.min(9, Math.floor(n / 60))}:${pad(n % 60)}`
}
