// The Nervous System. A tiny event bus; every layer talks through it.
// Event names are listed in docs/CANON.md §4.
const handlers = new Map()

export const bus = {
  on(event, fn) {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event).add(fn)
    return () => handlers.get(event)?.delete(fn)
  },
  once(event, fn) {
    const off = bus.on(event, (d) => { off(); fn(d) })
    return off
  },
  emit(event, data) {
    for (const fn of handlers.get(event) ?? []) {
      try { fn(data) } catch (e) { console.error(`[bus:${event}]`, e) }
    }
    for (const fn of handlers.get('*') ?? []) {
      try { fn({ event, data }) } catch {}
    }
  },
}
