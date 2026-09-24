// DRIFT. The longer you stay, the more the elements creep out of their boxes: a few pixels at first,
// then more, as the minutes pass. They only move while you are still. Scroll or click and you clear them
// (Absolution, in the old word for `clear`): everything glides back into the flow and the creeping
// begins again, a little bolder than before. Compositor-only motion (translate/rotate), paused with the tab.
import { bodies, KINDS, quiet, currentTranslate, currentRotate, clamp } from './core.js'

export function createDrift(env) {
  const { ctx, rng, clock, motions, veils, I } = env
  const max = Math.round(5 + 19 * I) // at most 24 bodies creep at once
  const moving = new Map() // el -> { anim, dx, dy, rot }
  let creeping = false
  let lastClear = performance.now()
  let absolutions = 0
  let lastWhisper = 0
  let dead = false

  // How far a body may stray, growing with the minutes of seen time on this face.
  const reach = () => {
    const minutes = clock.elapsed / 60
    return (4 + 30 * I) * clamp(0.25 + minutes / 5, 0.25, 1.35)
  }

  function creep() {
    if (dead || creeping || ctx.mercy?.on || document.hidden) return
    const pool = bodies(ctx.root, KINDS.block, { maxArea: 0.3, margin: 80 })
    if (!pool.length) return
    creeping = true
    const R = reach()
    const chosen = []
    for (const { el } of rng.shuffle(pool)) {
      if (chosen.length >= max) break
      if (chosen.some((c) => c.contains(el) || el.contains(c)) || !quiet(el)) continue
      chosen.push(el)
    }
    for (const el of chosen) {
      // Mostly outward and upward, as the Departed go; a few sink.
      const angle = rng.float(0, Math.PI * 2)
      const dist = R * rng.float(0.35, 1)
      const dx = Math.cos(angle) * dist
      const dy = Math.sin(angle) * dist * 0.7 - (ctx.face === 'departure' ? R * 0.4 : 0)
      const rot = rng.float(-1, 1) * (0.4 + 2.4 * I) * clamp(R / 30, 0.3, 1.2)
      el.setAttribute('data-hell-moving', 'drift')
      const anim = motions.animate(el, [
        { translate: '0px 0px', rotate: '0deg' },
        { translate: `${dx.toFixed(1)}px ${dy.toFixed(1)}px`, rotate: `${rot.toFixed(2)}deg` },
      ], { duration: rng.float(70000, 150000) / clock.speed, easing: 'cubic-bezier(0.3, 0, 0.6, 1)' })
      moving.set(el, { anim, dx, dy, rot })
    }
  }

  // Absolution. Everything returns from wherever it has got to.
  function clear(quick = false) {
    if (!creeping) return
    creeping = false
    let far = 0
    for (const [el, m] of moving) {
      if (!el.isConnected || quick) {
        m.anim.cancel()
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

  // Scrolling, clicking, keys, touch: any of them clears.
  const onClear = () => { if (creeping) clear() }
  addEventListener('scroll', onClear, { capture: true, passive: true })
  addEventListener('pointerdown', onClear, { passive: true })
  addEventListener('keydown', onClear)
  addEventListener('wheel', onClear, { passive: true })
  addEventListener('touchstart', onClear, { passive: true })

  // While still for a few seconds, the creeping begins.
  function watch() {
    if (dead) return
    const still = ctx.behavior?.stillFor ?? 0
    if (!creeping && still >= 4 && performance.now() - lastClear > 3000) creep()
    clock.after(1000, watch)
  }
  clock.after(rng.float(4000, 9000), watch)

  return {
    trigger() { clear(true); lastClear = 0; creep() },
    clear,
    get count() { return moving.size },
    stop() {
      dead = true
      removeEventListener('scroll', onClear, { capture: true })
      removeEventListener('pointerdown', onClear)
      removeEventListener('keydown', onClear)
      removeEventListener('wheel', onClear)
      removeEventListener('touchstart', onClear)
      for (const [el, m] of moving) { m.anim.cancel(); el.removeAttribute('data-hell-moving') }
      moving.clear()
      creeping = false
    },
  }
}
