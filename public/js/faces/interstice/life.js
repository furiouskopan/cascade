// THE INTERSTICE · housekeeping. Everything the face starts (timers, listeners, observers, animations, the
// one frame loop of the Mirror Room) it can stop, so destroy() leaves nothing behind (Canon §3).
export function makeLife(name = 'interstice') {
  const cleanups = []
  const timers = new Set()
  const anims = new Set()
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
      const id = setTimeout(() => { timers.delete(id); if (!dead) fn() }, ms)
      timers.add(id)
      return id
    },
    clear(id) {
      clearTimeout(id)
      timers.delete(id)
    },
    // Web Animations, remembered so that mercy can finish them and destroy can cancel them.
    animate(el, frames, opts) {
      if (dead || !el?.animate) return null
      const a = el.animate(frames, opts)
      anims.add(a)
      const forget = () => anims.delete(a)
      a.finished.then(forget, forget)
      return a
    },
    finishAll() {
      for (const a of [...anims]) { try { a.finish() } catch {} }
    },
    observe(observer) {
      cleanups.push(() => observer.disconnect())
      return observer
    },
    destroy() {
      dead = true
      timers.forEach(clearTimeout)
      timers.clear()
      for (const a of [...anims]) { try { a.cancel() } catch {} }
      anims.clear()
      for (const fn of cleanups.splice(0).reverse()) {
        try { fn() } catch (e) { console.error(`[${name}]`, e) }
      }
    },
  }
}
