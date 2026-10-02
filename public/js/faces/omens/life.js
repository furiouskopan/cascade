// The diviner's housekeeping: everything the Omens face starts, it can stop (faces are swapped mid-visit,
// CANON §3). Timers sleep in a hidden tab; every matchMedia listener is removed on destroy.
const SVGNS = 'http://www.w3.org/2000/svg'

export function makeLife(tag = 'omens') {
  const cleanups = []
  const timers = new Set()
  let dead = false
  cleanups.push(() => { timers.forEach(clearTimeout); timers.clear() })
  const life = {
    get dead() { return dead },
    add(fn) { cleanups.push(fn); return fn },
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts)
      cleanups.push(() => target.removeEventListener(type, fn, opts))
      return fn
    },
    bus(bus, event, fn) {
      const off = bus?.on?.(event, (d) => { if (!dead) fn(d ?? {}) })
      if (off) cleanups.push(off)
      return off
    },
    // A media query that is listened to for as long as the face lives. Returns the MediaQueryList.
    media(query, fn) {
      let mql = null
      try { mql = matchMedia(query) } catch { return null }
      const handler = (e) => { if (!dead) fn(e.matches, mql) }
      mql.addEventListener('change', handler)
      cleanups.push(() => mql.removeEventListener('change', handler))
      return mql
    },
    // One-shot timers forget themselves when they fire.
    timeout(fn, ms) {
      const id = setTimeout(() => { timers.delete(id); if (!dead) fn() }, ms)
      timers.add(id)
      return id
    },
    clear(id) { clearTimeout(id); timers.delete(id) },
    // Intervals do nothing while the tab is hidden.
    interval(fn, ms) {
      const id = setInterval(() => { if (!dead && !document.hidden) fn() }, ms)
      cleanups.push(() => clearInterval(id))
      return id
    },
    observe(observer) {
      cleanups.push(() => observer.disconnect())
      return observer
    },
    destroy() {
      dead = true
      for (const fn of cleanups.splice(0).reverse()) {
        try { fn() } catch (e) { console.error(`[${tag}]`, e) }
      }
    },
  }
  return life
}

// Build an SVG element from trusted, generated values.
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) el.setAttribute(k, String(v))
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  return el
}

// Parse trusted, generated SVG markup into an element.
export function svgNode(markup) {
  const t = document.createElement('template')
  t.innerHTML = markup.trim()
  return t.content.firstElementChild
}

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
export const r1 = (n) => Math.round(n * 10) / 10
export const r2 = (n) => Math.round(n * 100) / 100

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
// Counts the way a scribe would write them in a translation: in words, below a hundred.
export function count(n) {
  if (!Number.isInteger(n) || n < 0) return String(n)
  if (n === 0) return 'no'
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '')
  return n.toLocaleString('en-US')
}
export const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${count(n)} times`)
export const cap = (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1)
