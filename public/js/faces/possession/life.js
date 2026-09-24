// POSSESSION / LIFE. The leash on everything this face sets in motion.
// Every timer, listener, observer and bus subscription goes through here so destroy() takes it all back.
// `wait(ms)` is the demon's own sense of time: it does not pass while mercy is on, while the tab is
// hidden, or while something holds it (the Apology).

export function createLife(ctx) {
  const timers = new Set()
  const frames = new Set()
  const cleanups = []
  let dead = false
  let holds = 0

  const guard = (fn) => {
    try { fn() } catch (e) { console.error('[possession]', e) }
  }

  const life = {
    get dead() { return dead },
    get held() { return holds > 0 },
    hold() { holds++ },
    release() { holds = Math.max(0, holds - 1) },
    // True when the demon must not act.
    paused() { return dead || holds > 0 || ctx.mercy.on || document.hidden },
    add(fn) { cleanups.push(fn); return fn },
    timeout(fn, ms) {
      const id = setTimeout(() => {
        timers.delete(id)
        if (!dead) guard(fn)
      }, ms)
      timers.add(id)
      return id
    },
    cancel(id) {
      clearTimeout(id)
      timers.delete(id)
    },
    every(fn, ms) {
      const id = setInterval(() => { if (!dead) guard(fn) }, ms)
      cleanups.push(() => clearInterval(id))
      return id
    },
    frame(fn) {
      const id = requestAnimationFrame(() => {
        frames.delete(id)
        if (!dead) guard(fn)
      })
      frames.add(id)
      return id
    },
    listen(target, type, fn, opts) {
      target.addEventListener(type, fn, opts)
      cleanups.push(() => target.removeEventListener(type, fn, opts))
    },
    on(event, fn) {
      cleanups.push(ctx.bus.on(event, (d) => { if (!dead) fn(d) }))
    },
    observe(cb, opts) {
      const io = new IntersectionObserver((entries) => { if (!dead) guard(() => cb(entries)) }, opts)
      cleanups.push(() => io.disconnect())
      return io
    },
    // Resolves after `ms` of the demon's time (waits out mercy, hidden tabs and holds).
    wait(ms) {
      return new Promise((resolve) => {
        const go = () => (life.paused() ? life.timeout(go, 320) : resolve())
        life.timeout(go, Math.max(0, ms))
      })
    },
    // Plain wall-clock sleep for UI niceties that are not motion.
    sleep(ms) {
      return new Promise((resolve) => life.timeout(resolve, ms))
    },
    dispose() {
      dead = true
      for (const id of timers) clearTimeout(id)
      timers.clear()
      for (const id of frames) cancelAnimationFrame(id)
      frames.clear()
      for (const fn of cleanups.splice(0).reverse()) guard(fn)
    },
  }
  return life
}
