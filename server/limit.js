// Penance throttle: in-memory, per-IP token buckets. Good enough for one small server.
const buckets = new Map()

export function limiter({ name, per, windowMs }) {
  return (req, res, next) => {
    const key = `${name}:${req.ip}`
    const now = Date.now()
    let b = buckets.get(key)
    if (!b || now - b.start > windowMs) {
      b = { start: now, count: 0 }
      buckets.set(key, b)
    }
    b.count++
    if (b.count > per) {
      const wait = Math.ceil((b.start + windowMs - now) / 1000)
      res.set('Retry-After', String(wait))
      return res.status(429).json({ error: 'patience is a sacrament', retryAfter: wait })
    }
    next()
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [k, b] of buckets) if (now - b.start > 3600_000) buckets.delete(k)
}, 600_000).unref()
