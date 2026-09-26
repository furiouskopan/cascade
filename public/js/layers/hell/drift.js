// DRIFT. The longer you stay, the more the elements creep out of their boxes. It begins once you have held
// still for a few seconds: a few bodies set off, each on its own heading, a few pixels in a minute. Every
// time one arrives it rests, and if you are still holding still it goes on, a little further out, as far
// as the minutes you have spent here allow; and more of them join as the minutes pass. Scroll or click and
// you clear them (Absolution, in the old word for `clear`): everything glides back into the flow, and the
// creeping begins again from nothing. Compositor-only motion (translate/rotate), paused with the tab.
import { bodies, KINDS, quiet, currentTranslate, currentRotate, clamp, faceLift } from './core.js'

export function createDrift(env) {
  const { ctx, rng, clock, motions, I } = env
  const max = Math.round(5 + 19 * I) // at most 24 bodies creep at once
  const moving = new Map() // el -> { anim, x, y, r, heading, spin, rest: cancels the pending next leg, or null }
  let creeping = false
  let lastClear = performance.now()
  let lastRecruit = 0
  let absolutions = 0
  let lastWhisper = 0
  let dead = false

  // How far a body may stray by now, and how many may stray, both growing with the minutes of seen time
  // on this face (the clock stops while the tab is hidden or mercy is asked).
  const minutes = () => clock.elapsed / 60
  const reach = () => (4 + 30 * I) * clamp(0.25 + minutes() / 5, 0.25, 1.6)
  const many = () => Math.max(2, Math.round(max * clamp(0.3 + minutes() / 6, 0.3, 1)))
  const tilt = () => (0.4 + 2.4 * I) * clamp(0.3 + minutes() / 6, 0.3, 1.2) // degrees
  const still = () => (ctx.behavior?.stillFor ?? 0) >= 2

  // More bodies set off, up to as many as the minutes allow.
  function recruit() {
    lastRecruit = performance.now()
    const want = many() - moving.size
    if (want <= 0 || dead || ctx.mercy?.on || document.hidden) return
    const pool = bodies(ctx.root, KINDS.block, { maxArea: 0.3, margin: 80 })
    const taken = [...moving.keys()]
    let added = 0
    for (const { el } of rng.shuffle(pool)) {
      if (added >= want) break
      if (moving.has(el) || taken.some((c) => c.contains(el) || el.contains(c)) || !quiet(el)) continue
      taken.push(el)
      // Mostly outward and upward, as the Departed go; a few sink. Each keeps its heading, wandering a little.
      const m = { anim: null, x: 0, y: 0, r: 0, heading: rng.float(0, Math.PI * 2), spin: rng.chance(0.5) ? 1 : -1, rest: null }
      moving.set(el, m)
      el.setAttribute('data-hell-moving', 'drift')
      leg(el, m)
      added++
    }
  }

  // One leg of the creep: from where the body is to a little further out, over most of a minute.
  function leg(el, m) {
    if (dead || !creeping || moving.get(el) !== m) return
    if (!el.isConnected) { forget(el, m); return }
    const R = reach()
    m.heading += rng.float(-0.55, 0.55)
    const step = R * rng.float(0.22, 0.5)
    const lift = step * faceLift(ctx.face) // the Departed rise (registry: hell.lift)
    let tx = m.x + Math.cos(m.heading) * step
    let ty = m.y + Math.sin(m.heading) * step * 0.7 - lift
    const far = Math.hypot(tx, ty)
    if (far > R) { tx *= R / far; ty *= R / far } // never past the reach of the hour
    const T = tilt()
    const tr = clamp(m.r + m.spin * T * rng.float(0.15, 0.4), -T, T)
    const anim = motions.animate(el, [
      { translate: `${m.x.toFixed(1)}px ${m.y.toFixed(1)}px`, rotate: `${m.r.toFixed(2)}deg` },
      { translate: `${tx.toFixed(1)}px ${ty.toFixed(1)}px`, rotate: `${tr.toFixed(2)}deg` },
    ], { duration: rng.float(38000, 75000) / clock.speed, easing: 'cubic-bezier(0.3, 0, 0.6, 1)' })
    // The new leg starts exactly where the last one holds, so the old one can go without a jump.
    m.anim?.cancel()
    m.anim = anim
    anim.addEventListener('finish', () => {
      if (m.anim !== anim) return
      m.x = tx
      m.y = ty
      m.r = tr
      rest(el, m)
    })
  }

  // It rests where it arrived, and goes on only while the visitor is still holding still.
  function rest(el, m) {
    m.rest = clock.after(rng.float(2500, 9000), () => {
      if (dead || !creeping || moving.get(el) !== m) return
      if (still()) leg(el, m)
      else rest(el, m)
    })
  }

  function forget(el, m) {
    m.rest?.()
    m.anim?.cancel()
    moving.delete(el)
    el.removeAttribute('data-hell-moving')
  }

  // Absolution. Everything returns from wherever it has got to.
  function clear(quick = false) {
    if (!creeping) return
    creeping = false
    let far = 0
    for (const [el, m] of moving) {
      m.rest?.()
      if (!el.isConnected || quick || !m.anim) {
        m.anim?.cancel()
        el.removeAttribute('data-hell-moving')
        continue
      }
      const [x, y] = currentTranslate(el)
      const r = currentRotate(el)
      far += Math.hypot(x, y)
      m.anim.cancel()
      const back = motions.animate(el, [
        { translate: `${x}px ${y}px`, rotate: `${r}deg` },
        { translate: '0px 0px', rotate: '0deg' },
      ], { duration: 650, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'none' })
      back.addEventListener('finish', () => { motions.forget(back); el.removeAttribute('data-hell-moving') })
      back.addEventListener('cancel', () => el.removeAttribute('data-hell-moving'))
    }
    const n = moving.size
    moving.clear()
    lastClear = performance.now()
    // A whisper when the absolution was worth noticing, at most once in two minutes.
    if (!quick && n && far / n > 7 && performance.now() - lastWhisper > 120000) {
      lastWhisper = performance.now()
      absolutions++
      env.whisper?.(absolutions === 1 ? `clear: both · ${n} bodies absolved` : `absolved again · ${n} returned to the flow`, { quiet: true })
    }
  }

  // Scrolling, clicking, keys, touch: any of them clears. Only the visitor's own hand counts: the page's
  // scroll (not a face's little console scrolling itself), the wheel, a touch, a click, a key.
  const onClear = () => { if (creeping) clear() }
  addEventListener('scroll', onClear, { passive: true })
  addEventListener('pointerdown', onClear, { passive: true })
  addEventListener('keydown', onClear)
  addEventListener('wheel', onClear, { passive: true })
  addEventListener('touchstart', onClear, { passive: true })

  // Once the visitor has been still a few seconds, the creeping begins; while it lasts, more join.
  function watch() {
    if (dead) return
    const s = ctx.behavior?.stillFor ?? 0
    if (!creeping && s >= 4 && performance.now() - lastClear > 3000) {
      creeping = true
      recruit()
    } else if (creeping && s >= 2 && performance.now() - lastRecruit > 20000 / clock.speed) {
      recruit()
    }
    clock.after(1000, watch)
  }
  clock.after(rng.float(4000, 9000), watch)

  return {
    trigger() {
      clear(true)
      lastClear = 0
      creeping = true
      recruit()
      return moving.size > 0
    },
    clear,
    get count() { return moving.size },
    get reach() { return reach() },
    stop() {
      dead = true
      removeEventListener('scroll', onClear)
      removeEventListener('pointerdown', onClear)
      removeEventListener('keydown', onClear)
      removeEventListener('wheel', onClear)
      removeEventListener('touchstart', onClear)
      for (const [el, m] of moving) { m.rest?.(); m.anim?.cancel(); el.removeAttribute('data-hell-moving') }
      moving.clear()
      creeping = false
    },
  }
}
