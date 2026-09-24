// The Akashic Record (per visitor). localStorage, wrapped so the temple works when storage is gone.
import { bus } from './bus.js'

const KEY = 'cascade.memory.v1'
let cache = null

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return null }
}

function load() {
  if (cache) return cache
  cache = read() ?? {}
  return cache
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)) } catch {}
}

// Other tabs of the temple write to the same record; take their news instead of overwriting it.
addEventListener('storage', (e) => {
  if (e.key === KEY) cache = null
})

export const memory = {
  get(k, fallback = undefined) {
    const v = load()[k]
    return v === undefined ? fallback : v
  },
  set(k, v) {
    cache = read() ?? load() // re-read before writing, so another tab's keys survive
    cache[k] = v
    save()
    return v
  },
  update(k, fn, fallback) {
    return memory.set(k, fn(memory.get(k, fallback)))
  },
  // Record a discovered secret once; emits secret:found only the first time.
  markSecret(id, detail = {}) {
    const secrets = memory.get('secrets', {})
    if (secrets[id]) return false
    secrets[id] = { at: Date.now(), ...detail }
    memory.set('secrets', secrets)
    bus.emit('secret:found', { id, ...detail })
    return true
  },
  hasSecret(id) {
    return Boolean(memory.get('secrets', {})[id])
  },
  forget() {
    cache = {}
    try { localStorage.removeItem(KEY) } catch {}
  },
  all() {
    return { ...load() }
  },
}

// Called once per page load by main.js.
export function recordVisit() {
  const now = Date.now()
  const visits = memory.update('visits', (n) => n + 1, 0)
  if (!memory.get('firstVisit')) memory.set('firstVisit', now)
  const last = memory.get('lastVisit', null)
  memory.set('lastVisit', now)
  return { visits, firstVisit: memory.get('firstVisit'), lastVisit: last, sinceLast: last ? now - last : null }
}
