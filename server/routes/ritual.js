// THE ALTAR, server side: the shared ritual of the Cascade (docs/CANON.md §7). Mounted at /api.
//
//   GET  /api/state   { prayers, eclipseUntil, offerings[], wall[], ascended[], online, now }
//   POST /api/pray    { count, eclipse, eclipseUntil, now }   every 108th prayer covers the sun for 33 s
//   POST /api/offer   { selector, property, value } -> { offering }   the Living Canon (1 per IP per 10 min)
//   POST /api/wall    { text } -> { message }                         the Wall of Strangers (1 per IP per 5 min)
//
// The law of offerings is not written here. It lives in public/js/layers/ritual.js (THE GRAMMAR OF
// OFFERINGS), which is pure, and this route imports it: the altar in the browser and the altar on the
// server read one and the same law. Only structured, canonical triples are stored. Everything read back is
// re-validated before it leaves, so even a tampered database cannot speak CSS the grammar does not allow.
import { Router } from 'express'
import { db, kvGet, kvSet } from '../db.js'
import { broadcast, online } from '../sse.js'
import { limiter } from '../limit.js'
import { LIMITS, validateOffering, sanitizeWall, sanitizeName } from '../../public/js/layers/ritual.js'

// The Book of the Ascended is shared with the secrets route (schema agreed in CANON §7).
db.exec(`
  CREATE TABLE IF NOT EXISTS ascended (id INTEGER PRIMARY KEY, name TEXT NOT NULL, at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS ritual_offerings (
    id INTEGER PRIMARY KEY, selector TEXT NOT NULL, property TEXT NOT NULL, value TEXT NOT NULL, at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ritual_wall (id INTEGER PRIMARY KEY, text TEXT NOT NULL, at INTEGER NOT NULL);
`)

const sql = {
  offerings: db.prepare('SELECT id, selector, property, value, at FROM ritual_offerings ORDER BY id DESC LIMIT ?'),
  addOffering: db.prepare('INSERT INTO ritual_offerings (selector, property, value, at) VALUES (?, ?, ?, ?)'),
  pruneOfferings: db.prepare('DELETE FROM ritual_offerings WHERE id <= (SELECT id FROM ritual_offerings ORDER BY id DESC LIMIT 1 OFFSET ?)'),
  wall: db.prepare('SELECT id, text, at FROM ritual_wall ORDER BY id DESC LIMIT ?'),
  addWall: db.prepare('INSERT INTO ritual_wall (text, at) VALUES (?, ?)'),
  pruneWall: db.prepare('DELETE FROM ritual_wall WHERE id <= (SELECT id FROM ritual_wall ORDER BY id DESC LIMIT 1 OFFSET ?)'),
  ascended: db.prepare('SELECT id, name, at FROM ascended ORDER BY id DESC LIMIT ?'),
}

const K_PRAYERS = 'ritual.prayers'
const K_ECLIPSE = 'ritual.eclipseUntil'
const whole = (n) => (Number.isSafeInteger(n) && n >= 0 ? n : 0)
const plainObject = (b) => (b && typeof b === 'object' && !Array.isArray(b) ? b : {})

// Rows come back newest first; the state lists them oldest first, as the Cascade reads (the last word wins).
function readOfferings() {
  const out = []
  for (const row of sql.offerings.all(LIMITS.canon * 3)) {
    const v = validateOffering(row.selector, row.property, row.value)
    if (!v.ok || v.value !== row.value) continue // not canonical: never spoken
    out.push({ id: Number(row.id), selector: v.selector, property: v.property, value: v.value, at: Number(row.at) })
    if (out.length === LIMITS.canon) break
  }
  return out.reverse()
}

function readWall() {
  const out = []
  for (const row of sql.wall.all(LIMITS.wall)) {
    const s = sanitizeWall(row.text)
    if (s.ok) out.push({ id: Number(row.id), text: s.text, at: Number(row.at) })
  }
  return out.reverse()
}

function readAscended() {
  const out = []
  for (const row of sql.ascended.all(108)) {
    const name = sanitizeName(row.name)
    if (name) out.push({ id: Number(row.id), name, at: Number(row.at) })
  }
  return out.reverse()
}

export function readState() {
  return {
    prayers: whole(kvGet(K_PRAYERS, 0)),
    eclipseUntil: whole(kvGet(K_ECLIPSE, 0)),
    offerings: readOfferings(),
    wall: readWall(),
    ascended: readAscended(),
    online: online(),
    now: Date.now(),
  }
}

const router = Router()

// Penances. Attempts are throttled before they are read; acceptances are throttled after, so a visitor who
// mistypes a value is corrected by the grammar and not locked out by it.
const stateLimit = limiter({ name: 'ritual:state', per: 120, windowMs: 60_000 })
const prayLimit = limiter({ name: 'ritual:pray', per: LIMITS.prayPerMinute, windowMs: 60_000 })
const offerTries = limiter({ name: 'ritual:offer-try', per: 12, windowMs: 60_000 })
const offerOnce = limiter({ name: 'ritual:offer', per: 1, windowMs: LIMITS.offerCooldownMs })
const wallTries = limiter({ name: 'ritual:wall-try', per: 12, windowMs: 60_000 })
const wallOnce = limiter({ name: 'ritual:wall', per: 1, windowMs: LIMITS.wallCooldownMs })

// Only this altar's own rites are marked uncacheable; other routes under /api keep their own counsel.
const fresh = (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
}

router.get('/state', fresh, stateLimit, (req, res) => {
  res.set('X-Mala', '108 beads and one guru bead, which is never crossed')
  res.json(readState())
})

router.post('/pray', fresh, prayLimit, (req, res) => {
  const now = Date.now()
  const count = kvSet(K_PRAYERS, whole(kvGet(K_PRAYERS, 0)) + 1)
  let eclipseUntil = whole(kvGet(K_ECLIPSE, 0))
  const eclipse = count % LIMITS.eclipseEvery === 0
  if (eclipse) eclipseUntil = kvSet(K_ECLIPSE, now + LIMITS.eclipseMs)
  broadcast('prayer', { count })
  if (eclipse) broadcast('eclipse', { until: eclipseUntil, count, now })
  res.json({ count, eclipse, eclipseUntil, now })
})

router.post('/offer', fresh, offerTries, (req, res) => {
  const body = plainObject(req.body)
  const v = validateOffering(body.selector, body.property, body.value)
  if (!v.ok) return res.status(400).json({ error: v.error, field: v.field })
  offerOnce(req, res, () => {
    const at = Date.now()
    const info = sql.addOffering.run(v.selector, v.property, v.value, at)
    sql.pruneOfferings.run(LIMITS.keep)
    const offering = { id: Number(info.lastInsertRowid), selector: v.selector, property: v.property, value: v.value, at }
    broadcast('offering', { offering })
    res.status(201).json({ offering })
  })
})

router.post('/wall', fresh, wallTries, (req, res) => {
  const body = plainObject(req.body)
  const s = sanitizeWall(body.text)
  if (!s.ok) return res.status(400).json({ error: s.error })
  wallOnce(req, res, () => {
    const at = Date.now()
    const info = sql.addWall.run(s.text, at)
    sql.pruneWall.run(LIMITS.wall)
    const message = { id: Number(info.lastInsertRowid), text: s.text, at }
    broadcast('wall', { message })
    res.status(201).json({ message })
  })
})

export default router
