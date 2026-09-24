// THE PHANTOM CURSOR. A second pointer that follows yours a little late, sometimes as your mirror.
// When you hold still long enough, it stops following and goes on without you: it glides to something
// written on the page and rests its hand there, and what it touches may melt or be possessed.
// Only for fine pointers (a mouse); it has nothing to follow on a touch screen.
import { h } from '../../lib/dom.js'
import { clamp, ease } from './core.js'

const ARROW = '<svg viewBox="0 0 20 28" width="20" height="28" aria-hidden="true"><path d="M1.5 1.5 L1.5 21.5 L6.6 16.9 L10.3 25.6 L13.6 24.2 L9.9 15.6 L16.9 15.6 Z"/></svg>'

// Modes by lot. `delay` in ms; `map` turns your position into its position.
const MODES = {
  late: { delay: 520, map: (x, y) => [x, y] },
  later: { delay: 1300, map: (x, y) => [x, y] },
  mirror: { delay: 180, map: (x, y) => [innerWidth - x, y] },
  reflection: { delay: 260, map: (x, y) => [x, innerHeight - y] },
  antipode: { delay: 340, map: (x, y) => [innerWidth - x, innerHeight - y] },
}

export function createPhantom(env) {
  const { ctx, rng, veils, clock, I } = env
  const node = h('div', { class: 'hell-phantom', html: ARROW })
  veils.veil.append(node)
  const samples = []
  let raf = 0
  let lastMove = 0
  let pos = [innerWidth / 2, innerHeight / 2]
  let mode = 'late'
  let wander = null // { from, to, t0, dur, target }
  let visible = false
  let dead = false

  const weights = { late: 5, later: 2 + I * 2, mirror: 1 + I * 3, reflection: I * 1.5, antipode: I * 1.2 }
  const reroll = () => {
    mode = rng.weighted(weights)
    node.dataset.mode = mode
    clock.after(rng.float(9000, 24000) / (0.6 + I), reroll)
  }
  reroll()

  function show(on) {
    if (visible === on) return
    visible = on
    node.classList.toggle('is-shown', on)
  }

  function sampleAt(t) {
    // The newest sample not newer than t, eased toward the next one.
    for (let i = samples.length - 1; i >= 0; i--) {
      if (samples[i].t <= t) {
        const a = samples[i]
        const b = samples[i + 1]
        if (!b) return [a.x, a.y]
        const k = clamp((t - a.t) / Math.max(1, b.t - a.t), 0, 1)
        return [a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k]
      }
    }
    return samples[0] ? [samples[0].x, samples[0].y] : pos
  }

  function place([x, y]) {
    pos = [x, y]
    node.style.translate = `${Math.round(x)}px ${Math.round(y)}px`
  }

  function loop(now) {
    raf = 0
    if (dead || document.hidden || ctx.mercy?.on) return
    if (wander) {
      const k = clamp((now - wander.t0) / wander.dur, 0, 1)
      const e = ease(k)
      place([wander.from[0] + (wander.to[0] - wander.from[0]) * e, wander.from[1] + (wander.to[1] - wander.from[1]) * e])
      if (k < 1) raf = requestAnimationFrame(loop)
      else arrive()
      return
    }
    const m = MODES[mode]
    const [x, y] = sampleAt(now - m.delay)
    place(m.map(x, y))
    // Keep running only until the phantom has caught up with a resting pointer.
    if (now - lastMove < m.delay + 400) raf = requestAnimationFrame(loop)
  }

  const kick = () => { if (!raf) raf = requestAnimationFrame(loop) }

  const onMove = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
    const now = performance.now()
    samples.push({ x: e.clientX, y: e.clientY, t: now })
    while (samples.length > 2 && now - samples[1].t > 2500) samples.shift()
    if (samples.length > 240) samples.splice(0, samples.length - 240)
    lastMove = now
    if (wander) { wander = null; node.classList.remove('is-wandering', 'is-resting') }
    if (!ctx.mercy?.on) show(true)
    kick()
  }
  const onLeave = (e) => { if (!e.relatedTarget) show(false) }
  addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerout', onLeave, { passive: true })

  // Stillness: the phantom goes on alone and lays its hand on something written.
  const offStill = ctx.bus.on('behavior:still', ({ seconds } = {}) => {
    if (dead || seconds < 33 || !visible || ctx.mercy?.on || document.hidden) return
    const picks = env.pickWritten?.()
    if (!picks) return
    const { el, r } = picks
    const to = [clamp(r.left + r.width * rng.float(0.2, 0.7), 8, innerWidth - 24), clamp(r.top + Math.min(r.height * 0.5, 18), 8, innerHeight - 30)]
    wander = { from: pos, to, t0: performance.now(), dur: rng.float(2600, 4200), target: el }
    node.classList.add('is-wandering')
    kick()
  })

  function arrive() {
    if (!wander) return
    node.classList.add('is-resting')
    const target = wander.target
    const [x, y] = wander.to
    env.touch?.(target, x + 2, y + 2)
  }

  return {
    stop() {
      dead = true
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onLeave)
      offStill()
      node.remove()
    },
    pause() { cancelAnimationFrame(raf); raf = 0 },
    resume() { kick() },
    get mode() { return wander ? 'wandering' : mode },
  }
}
