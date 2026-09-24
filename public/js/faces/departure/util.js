// Small tools for the Departure face: a lifetime that owns every timer and listener (so destroy()
// really does leave nothing behind), time formatting, and a selector path describer.
import { h } from '../../lib/dom.js'

// Some words of a text become departable: they may one day leave their sentence.
// The first word stays when asked (a drop cap cannot reach into an inline-block to find its letter).
export function departable(text, rng, p = 0.16, { keepFirst = false } = {}) {
  const out = []
  let first = true
  for (const tok of String(text).split(/(\s+)/)) {
    if (!tok) continue
    const m = tok.match(/^([A-Za-z][A-Za-z'’-]{3,})([.,;:!?"”)]*)$/)
    const may = !(keepFirst && first)
    if (/\S/.test(tok)) first = false
    if (m && may && rng.chance(p)) out.push(h('span', { class: 'dep-can dep-word' }, m[1]), m[2])
    else out.push(tok)
  }
  return out
}

export function makeLife() {
  const cleanups = new Set()
  let dead = false
  const life = {
    get dead() { return dead },
    add(fn) { cleanups.add(fn); return fn },
    timeout(fn, ms) {
      const id = setTimeout(() => { cleanups.delete(cancel); if (!dead) fn() }, ms)
      const cancel = () => clearTimeout(id)
      cleanups.add(cancel)
      return cancel
    },
    interval(fn, ms) {
      const id = setInterval(() => { if (!dead) fn() }, ms)
      const cancel = () => clearInterval(id)
      cleanups.add(cancel)
      return cancel
    },
    raf(fn) {
      const id = requestAnimationFrame((t) => { cleanups.delete(cancel); if (!dead) fn(t) })
      const cancel = () => cancelAnimationFrame(id)
      cleanups.add(cancel)
      return cancel
    },
    listen(target, event, fn, opts) {
      target.addEventListener(event, fn, opts)
      const off = () => target.removeEventListener(event, fn, opts)
      cleanups.add(off)
      return off
    },
    on(bus, event, fn) {
      const off = bus.on(event, fn)
      cleanups.add(off)
      return off
    },
    kill() {
      dead = true
      for (const fn of cleanups) { try { fn() } catch {} }
      cleanups.clear()
    },
  }
  return life
}

export const pad = (n, w = 2) => String(n).padStart(w, '0')
export const hms = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
export const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// 24 IX 2026, the way a bulletin clerk would stamp it.
export const stampDate = (d) => `${d.getDate()} ${ROMAN[d.getMonth()]} ${d.getFullYear()}`

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// Set CSS custom properties (never !important, so mercy and the Cascade still rule).
export function vars(el, map) {
  for (const [k, v] of Object.entries(map)) el.style.setProperty(`--${k}`, String(v))
  return el
}

// Parse trusted, generated SVG markup into an element.
export function svgNode(markup) {
  const t = document.createElement('template')
  t.innerHTML = markup.trim()
  return t.content.firstElementChild
}

// "section.dep-report > p.dep-verse:nth-of-type(3)": where an element used to live.
export function describe(el, stop) {
  const parts = []
  let n = el
  while (n && n !== stop && n.nodeType === 1 && parts.length < 3) {
    let s = n.tagName.toLowerCase()
    const cls = [...n.classList].find((c) => c.startsWith('dep-') && !['dep-can', 'dep-sighted'].includes(c))
    if (cls) s += `.${cls}`
    const parent = n.parentElement
    if (parent) {
      const same = [...parent.children].filter((c) => c.tagName === n.tagName)
      if (same.length > 1) s += `:nth-of-type(${same.indexOf(n) + 1})`
    }
    parts.unshift(s)
    n = parent
  }
  return parts.join(' > ')
}

// Uppercase text for the teletype: the machine knows capitals only, and a few marks.
export function tty(text) {
  return String(text)
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .toUpperCase()
}
