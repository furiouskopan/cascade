// The Line to the Temple Server. Every call fails soft: the temple still works offline, only lonelier.
import { bus } from './bus.js'

async function call(method, path, body) {
  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, status: res.status, ...data }
    return { ok: true, ...data }
  } catch (e) {
    return { ok: false, offline: true, error: String(e) }
  }
}

export const api = {
  get: (path) => call('GET', path),
  post: (path, body) => call('POST', path, body ?? {}),
  online: false,
  // Opens the SSE choir once; server events are re-emitted on the bus as `server:<event>`.
  stream() {
    if (api._es || typeof EventSource === 'undefined') return
    const es = new EventSource('/api/stream')
    api._es = es
    es.onopen = () => { api.online = true; bus.emit('server:open') }
    es.onerror = () => { api.online = false; bus.emit('server:lost') }
    for (const name of ['presence', 'prayer', 'eclipse', 'offering', 'wall', 'ascended', 'omen']) {
      es.addEventListener(name, (e) => {
        let data = null
        try { data = JSON.parse(e.data) } catch {}
        bus.emit(`server:${name}`, data)
      })
    }
  },
}
