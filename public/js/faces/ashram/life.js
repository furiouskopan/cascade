// The ashram's housekeeping: everything it starts, it can stop (faces are swapped mid-visit, §3).
const SVGNS = 'http://www.w3.org/2000/svg'

export function makeLife() {
  const cleanups = []
  let dead = false
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
    timeout(fn, ms) {
      const id = setTimeout(() => { if (!dead) fn() }, ms)
      cleanups.push(() => clearTimeout(id))
      return id
    },
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
        try { fn() } catch (e) { console.error('[ashram]', e) }
      }
    },
  }
}

// One animation loop for the whole face. It sleeps under mercy, in hidden tabs, and after destroy.
export function makeTicker(ctx, life) {
  const subs = new Set()
  let raf = 0
  let last = 0
  const alive = () => !life.dead && !ctx.mercy?.on && !document.hidden
  function loop(now) {
    raf = 0
    if (!alive()) { last = 0; return }
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
    last = now
    for (const fn of subs) {
      try { fn(dt, now) } catch (e) { console.error('[ashram]', e); subs.delete(fn) }
    }
    if (subs.size) raf = requestAnimationFrame(loop)
  }
  function wake() {
    if (!raf && subs.size && alive()) raf = requestAnimationFrame(loop)
  }
  life.add(() => { cancelAnimationFrame(raf); raf = 0; subs.clear() })
  life.on(document, 'visibilitychange', wake)
  life.bus(ctx.bus, 'mercy:change', wake)
  return {
    add(fn) { subs.add(fn); wake(); return () => subs.delete(fn) },
    wake,
  }
}

// Build an SVG element with attributes (trusted, generated values only).
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, String(v))
  for (const c of children.flat()) if (c != null) el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  return el
}

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
export const easeInOut = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x, 0, 1))
export const fmt = (n) => Number(n).toLocaleString('en-US')

// Smooth, deterministic wobble from time (no Math.random: the tremor is a function of the clock).
export function wobble(t, seed = 0) {
  return (Math.sin(t * 1.31 + seed) + Math.sin(t * 2.17 + seed * 1.7) * 0.6 + Math.sin(t * 3.73 + seed * 2.3) * 0.3) / 1.9
}

// A moon drawn from its phase (0 new, 0.5 full). Lit limb on the right while waxing.
export function moonPath(phase, r) {
  const p = ((phase % 1) + 1) % 1
  const k = Math.cos(p * 2 * Math.PI) // 1 at new, -1 at full
  const rx = Math.abs(k) * r
  const waxing = p < 0.5
  const limbSweep = waxing ? 1 : 0
  // Terminator bulges toward the lit side for crescents, away from it for gibbous moons.
  const crescent = k > 0
  const termSweep = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0)
  const f = (n) => Math.round(n * 100) / 100
  return `M0 ${f(-r)} A${f(r)} ${f(r)} 0 0 ${limbSweep} 0 ${f(r)} A${f(rx)} ${f(r)} 0 0 ${termSweep} 0 ${f(-r)} Z`
}
