// GLYPH ROT. A paragraph you have been reading for a while begins to turn into the glyph script, one
// letter of the alphabet at a time: first every z, then every q, then every j... until the whole of it
// is written in the Hand of Descent. The text itself never changes (copy it and it is English); only
// its font does. Rest your hand on it and it is restored at once, and it waits a while before rotting
// again. Also serves ctx.hell.possess(): a possessed element rots all the way in a few seconds.
//
// How: the glyph font is fetched once, and 26 font faces are made from it ("Hell Rot 1" .. "Hell Rot 26"),
// each covering one more letter (unicode-range). A rotting element's font-family becomes
// "Hell Rot n", <its own family>: the first n letters are drawn as glyphs, everything else falls through.
import { bodies, KINDS, TEXT_SPARE, clamp } from './core.js'

// English letter frequency, rarest first: the rot begins where it is least noticed.
const RARE_FIRST = 'zqxjkvbpygfwmucldrhsnioate'
let fontData = null
let fontPromise = null
const faces = new Map() // `${order}:${n}` -> Promise<family>

function loadFont() {
  if (fontData) return Promise.resolve(fontData)
  if (!fontPromise) {
    fontPromise = fetch('/fonts/cascade-glyphs.otf')
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`font ${r.status}`))))
      .then((buf) => (fontData = buf))
      .catch((e) => { fontPromise = null; throw e })
  }
  return fontPromise
}

// The order of the rot is drawn by lot for each visit, leaning rare-first.
export function rotOrder(rng) {
  const keyed = [...RARE_FIRST].map((c, i) => [c, i + rng.float(-4, 4)])
  return keyed.sort((x, y) => x[1] - y[1]).map(([c]) => c).join('')
}

function stage(order, n) {
  const key = `${order}:${n}`
  if (!faces.has(key)) {
    const letters = [...order.slice(0, n)]
    const range = letters.flatMap((c) => [`U+${c.toUpperCase().charCodeAt(0).toString(16)}`, `U+${c.charCodeAt(0).toString(16)}`]).join(', ')
    let hsh = 7
    for (const ch of order) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0
    const family = `Hell Rot ${hsh.toString(36)} ${n}`
    faces.set(key, loadFont().then(async (buf) => {
      const ff = new FontFace(family, buf.slice(0), { unicodeRange: range, display: 'block' })
      await ff.load()
      document.fonts.add(ff)
      return family
    }).catch((e) => { faces.delete(key); throw e }))
  }
  return faces.get(key)
}

export function createRot(env, { ambient = true } = {}) {
  const { ctx, rng, clock, I } = env
  const order = env.rotOrder
  const pace = clamp(14000 - 10500 * I, 3500, 14000) // ms per letter
  const readFor = clamp(22000 - 14000 * I, 7000, 22000) // ms of reading before the rot takes hold
  const maxRotting = 1 + Math.round(3 * I)
  const rotting = new Map() // el -> { n, family, text, timer, possessed }
  const seen = new Map() // el -> ms visible so far
  const resting = new WeakMap() // el -> time it may rot again
  const visible = new Set()
  let dead = false

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const tall = e.rootBounds && e.intersectionRect.height >= e.rootBounds.height * 0.5
      if (e.isIntersecting && (e.intersectionRatio >= 0.6 || tall)) visible.add(e.target)
      else visible.delete(e.target)
    }
  }, { threshold: [0, 0.2, 0.4, 0.6, 0.8] })
  const watched = new WeakSet()

  function gather() {
    const list = bodies(ctx.root, `${KINDS.text}, h1, h2, h3`, { text: true, inView: false, minChars: 40, maxArea: 0.6 })
    for (const { el } of list) if (!watched.has(el)) { watched.add(el); io.observe(el) }
  }

  function apply(el, family) {
    const r = rotting.get(el)
    if (!r) return
    el.style.setProperty('--hell-rot-family', `"${family}", ${r.base}`)
    el.setAttribute('data-hell-rot', String(r.n))
  }

  function restore(el) {
    const r = rotting.get(el)
    if (!r) return
    r.cancel?.()
    rotting.delete(el)
    el.removeAttribute('data-hell-rot')
    el.style.removeProperty('--hell-rot-family')
    if (!el.getAttribute('style')) el.removeAttribute('style')
  }

  async function advance(el, to) {
    const r = rotting.get(el)
    if (!r) return
    const n = clamp(to, 0, 26)
    try {
      const family = await stage(order, n)
      if (rotting.get(el) !== r || dead || ctx.mercy?.on) return
      // The words were rewritten by their face: this is no longer the text we were rotting.
      if (el.textContent !== r.text) return restore(el)
      r.n = n
      apply(el, family)
    } catch (e) {
      console.warn('[layer:hell] rot', e)
    }
  }

  function begin(el, { possessed = false } = {}) {
    if (rotting.has(el) || !el.isConnected) return rotting.get(el)
    const base = getComputedStyle(el).fontFamily
    const r = { n: 0, base, text: el.textContent, possessed, cancel: null }
    rotting.set(el, r)
    return r
  }

  // Each second, count reading time for visible paragraphs; rot those read long enough.
  function tend() {
    if (dead) return
    const now = performance.now()
    for (const el of visible) {
      if (!el.isConnected) { visible.delete(el); continue }
      if (rotting.has(el) || (resting.get(el) ?? 0) > now) continue
      const t = (seen.get(el) ?? 0) + 1000 * clock.speed
      seen.set(el, t)
      const count = [...rotting.values()].filter((x) => !x.possessed).length
      if (t >= readFor && count < maxRotting && !el.closest(TEXT_SPARE)) {
        const r = begin(el)
        const step = () => {
          if (dead || rotting.get(el) !== r) return
          if (!visible.has(el)) { r.cancel = clock.after(1500, step); return } // rot only what is being read
          if (r.n < 26) advance(el, r.n + 1)
          r.cancel = clock.after(pace * rng.float(0.7, 1.3), step)
        }
        step()
      }
    }
    for (const [el] of rotting) if (!el.isConnected) rotting.delete(el)
    clock.after(1000, tend)
  }

  // A hand on the paragraph (or a tap) restores it and makes it wait.
  const onOver = (e) => {
    const t = e.target instanceof Element ? e.target.closest('[data-hell-rot]') : null
    if (!t || rotting.get(t)?.possessed) return
    restore(t)
    seen.set(t, 0)
    resting.set(t, performance.now() + rng.float(20000, 45000))
  }
  if (ambient) {
    ctx.root.addEventListener('pointerover', onOver, { passive: true })
    ctx.root.addEventListener('pointerdown', onOver, { passive: true })
    gather()
    const regather = () => { if (!dead) { gather(); clock.after(12000, regather) } }
    clock.after(12000, regather)
    clock.after(1000, tend)
    // Warm the font while nothing is happening.
    loadFont().then(() => stage(order, 1)).catch(() => {})
  }

  // possess(el): the element rots through all 26 letters in a few seconds, holds, and heals.
  function possess(el, { ms = 6500 } = {}) {
    if (dead || ctx.mercy?.on || !el?.isConnected) return () => {}
    if (rotting.has(el)) restore(el)
    const r = begin(el, { possessed: true })
    let n = 0
    let healing = false
    const tick = () => {
      if (rotting.get(el) !== r) return
      if (!healing) {
        n = Math.min(26, n + 2)
        advance(el, n)
        if (n < 26) r.cancel = clock.after(140, tick)
        else r.cancel = clock.after(Math.max(800, ms - 2400), () => { healing = true; tick() })
      } else {
        n = Math.max(0, n - 3)
        if (n > 0) { advance(el, n); r.cancel = clock.after(110, tick) } else restore(el)
      }
    }
    // Every stage is made before the possession starts, so no letter ever blinks out while loading.
    Promise.all(Array.from({ length: 13 }, (_, i) => stage(order, (i + 1) * 2))).then(() => { if (rotting.get(el) === r) tick() }).catch(() => restore(el))
    return () => restore(el)
  }

  return {
    possess,
    restore,
    ambient,
    trigger() {
      if (!ambient) return false
      gather()
      const el = [...visible].find((x) => !rotting.has(x)) ?? null
      if (el) seen.set(el, readFor)
      return Boolean(el)
    },
    get count() { return rotting.size },
    stop() {
      dead = true
      io.disconnect()
      ctx.root.removeEventListener('pointerover', onOver)
      ctx.root.removeEventListener('pointerdown', onOver)
      for (const el of [...rotting.keys()]) restore(el)
      visible.clear()
    },
  }
}
