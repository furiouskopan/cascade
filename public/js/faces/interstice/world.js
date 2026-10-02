// THE INTERSTICE · the world (docs/ROADMAP.md §4.3).
//
// Every room is a function of its address alone, so /404/6/12 is the same place for everyone who goes
// there: its box (margin, border, padding), its doorways, the magic number its wallpaper misses itself
// by, and what kind of room it is. What changes from visit to visit (the lighting, the damage, the verse
// pencilled on the plaster) is the visit's own fate and lives in fate.js.
//
// The plan of the place is a DOM tree. /404 is the Stairwell, `body`, whose 404 children are /404/1 to
// /404/404; /404/6/12 is body > div:nth-child(6) > div:nth-child(12). Doorways in the far wall lead to a
// room's children (children live in the content box), doorways in the side walls lead to its previous
// and next sibling (only where the two rooms' margins have collapsed into one space: the Union), and the
// parent is always behind you.
//
// THE RIDDLE. Every room is :empty except one, and that one lies a few rooms from wherever the visitor
// came in, behind a wall that looks solid and is not (pointer-events: none, the Passable). Where it lies
// is planted from the room the visitor came in by (plantSeed), so everyone who arrives by the same
// address finds it in the same place. What lies in it is one letter with no element of its own.
import { makeRng, hash } from '../../kernel/rng.js'
import { ROSETTA } from '../../lib/glyphs.js'

export const ROOT_CHILDREN = 404 // body's last child is the Lost
export const MAX_DEPTH = 33

export const keyOf = (path) => path.join('/')
export const addressOf = (path) => (path.length ? `/404/${path.join('/')}` : '/404')
export const parentOf = (path) => path.slice(0, -1)
export const indexOf = (path) => (path.length ? path[path.length - 1] : 0)
export const same = (a, b) => Boolean(a && b) && a.length === b.length && a.every((x, i) => x === b[i])

// The world is asked the same questions many times a step; the answers never change.
const memo = new Map()
function remember(k, make) {
  if (memo.has(k)) return memo.get(k)
  const v = make()
  if (memo.size > 4000) memo.clear()
  memo.set(k, v)
  return v
}

// How many children a room has. body has 404; most rooms a dozen to thirty-three, a few a crowd. (Every
// room has at least twelve, so the address everybody is shown first, /404/6/12, is always a room.)
export function childCount(path) {
  if (!path.length) return ROOT_CHILDREN
  return remember(`n:${keyOf(path)}`, () => {
    const r = makeRng(`interstice/n/${keyOf(path)}`)
    return r.chance(0.15) ? r.int(34, 99) : r.int(12, 33)
  })
}

// '/404/6/12' -> [6, 12]; '/404' -> []; anything that names no room (a child past the last one, a zero,
// a word) -> null. A trailing slash is forgiven.
export function parseAddress(pathname) {
  const m = /^\/404((?:\/[1-9]\d{0,4})*)\/?$/.exec(String(pathname ?? ''))
  if (!m) return null
  const path = m[1] ? m[1].slice(1).split('/').map(Number) : []
  if (path.length > MAX_DEPTH) return null
  for (let i = 0; i < path.length; i++) if (path[i] > childCount(path.slice(0, i))) return null
  return path
}

// The room an unknown address drops you into: two or three doors below the Stairwell, chosen by the
// address itself (so every visitor who mistypes it the same way lands in the same room).
export function originFor(text) {
  const r = makeRng(`interstice/origin/${text}`)
  const depth = r.chance(0.5) ? 2 : 3
  const path = []
  for (let i = 0; i < depth; i++) path.push(r.int(1, Math.min(childCount(path), i ? 99 : 33)))
  return path
}

const MARGINS = [10, 14, 18, 24, 28, 32]
const BORDERS = [1, 2, 3, 4, 5, 6]
const PADDINGS = [8, 12, 14, 16, 20, 24]

// The architecture of a room: everything about it that is the same for everyone.
export function roomOf(path) {
  return remember(`r:${keyOf(path)}`, () => {
    const key = keyOf(path)
    const r = makeRng(`interstice/room/${key}`)
    const n = childCount(path)
    const box = { margin: r.pick(MARGINS), border: r.pick(BORDERS), padding: r.pick(PADDINGS) }
    const seam = r.int(3, 61) // the Magic Number: how far the wallpaper misses itself at the far corners
    const seamWidth = r.pick([46, 53, 61, 68, 77])
    let far
    if (!path.length) far = [1, ROOT_CHILDREN]
    else {
      // At least one child is never shown on the far wall: there is always somewhere a door could be.
      const count = Math.min(n - 1, Number(r.weighted({ 1: 5, 2: 5, 3: 2 })))
      const set = new Set()
      while (set.size < count) set.add(r.int(1, n))
      far = [...set].sort((a, b) => a - b)
    }
    const kind = !path.length ? 'stairwell' : r.weighted({ plain: 30, window: 5, waiting: 2, mirror: 2 })
    return {
      path,
      key,
      n,
      box,
      seam,
      seamWidth,
      far,
      kind,
      upside: indexOf(path) === 404, // nth-child(404), the Lost, hangs from its floor
      deep: r.float(0.92, 1.12), // how far back its far wall stands
      slot: r.float(0.5, 0.7), // how wide the slot in the far wall is, as a share of the wall
      side: { left: r.float(0.3, 0.46), right: r.float(0.3, 0.46) }, // where each side doorway stands (0 near, 1 far)
      windowSide: r.chance(0.5) ? 'left' : 'right',
    }
  })
}

// Whether nth-child(k) and nth-child(k + 1) of `parent` touch: their margins collapsed into one space,
// and there is a doorway between them. Half of them do.
export function union(parent, k) {
  return remember(`u:${keyOf(parent)}#${k}`, () => makeRng(`interstice/union/${keyOf(parent)}#${k}`).chance(0.5))
}

// The ways out of a room that can be seen: [{dir: 'far'|'left'|'right', to, n}]. The parent is not listed:
// it is always behind you. `plan` (from plantSeed) hides the seed's room from every wall but one.
export function exitsOf(path, plan = null) {
  const R = roomOf(path)
  const out = []
  for (const c of R.far) {
    const to = [...path, c]
    if (!plan?.hidden(to)) out.push({ dir: 'far', to, n: c })
  }
  if (path.length) {
    const parent = parentOf(path)
    const k = indexOf(path)
    const n = childCount(parent)
    if (k > 1 && union(parent, k - 1) && !plan?.closed(parent, k - 1)) out.push({ dir: 'left', to: [...parent, k - 1], n: k - 1 })
    if (k < n && union(parent, k) && !plan?.closed(parent, k)) out.push({ dir: 'right', to: [...parent, k + 1], n: k + 1 })
  }
  // From inside the seed's room, the wall it was hidden behind is only a doorway.
  const back = plan?.reverse(path)
  if (back && !out.some((e) => e.dir === back.dir)) out.push(back)
  return out
}

const OPPOSITE = { left: 'right', right: 'left' }

// Where the one room that is not :empty lies, for a visitor who came in by `origin`. A short walk through
// doorways anyone can see (one or two steps, never back the way you came), then one more step through a
// wall that shows no door. The seed's own room keeps no other way in.
export function plantSeed(origin) {
  const r = makeRng(`interstice/seed/${keyOf(origin)}`)
  const trail = [origin]
  const seen = new Set([keyOf(origin)])
  let cur = origin
  const steps = r.chance(0.45) ? 1 : 2
  for (let i = 0; i < steps; i++) {
    let options = exitsOf(cur).filter((e) => !seen.has(keyOf(e.to)))
    if (!options.length) {
      if (cur.length && !seen.has(keyOf(parentOf(cur)))) options = [{ dir: 'back', to: parentOf(cur), n: indexOf(parentOf(cur)) }]
      else break
    }
    const e = r.pick(options)
    cur = e.to
    trail.push(cur)
    seen.add(keyOf(cur))
  }
  const A = cur
  const shown = new Set(exitsOf(A).map((e) => keyOf(e.to)))
  const R = roomOf(A)
  const cands = []
  for (let tries = 0; tries < 24; tries++) {
    const c = r.int(1, R.n)
    const to = [...A, c]
    if (!R.far.includes(c) && !seen.has(keyOf(to))) { cands.push({ dir: 'far', to, w: 3 }); break }
  }
  if (A.length) {
    const parent = parentOf(A)
    const k = indexOf(A)
    const n = childCount(parent)
    const left = [...parent, k - 1]
    const right = [...parent, k + 1]
    if (k > 1 && !shown.has(keyOf(left)) && !seen.has(keyOf(left))) cands.push({ dir: 'left', to: left, w: 1 })
    if (k < n && !shown.has(keyOf(right)) && !seen.has(keyOf(right))) cands.push({ dir: 'right', to: right, w: 1 })
  }
  // A room with every child on show and no free side: the seed goes to the first child nobody has walked.
  if (!cands.length) {
    for (let c = 1; c <= R.n; c++) if (!seen.has(keyOf([...A, c]))) { cands.push({ dir: 'far', to: [...A, c], w: 1 }); break }
  }
  const choice = cands.length > 1 ? cands[Number(r.weighted(Object.fromEntries(cands.map((c, i) => [i, c.w]))))] : cands[0]
  const S = choice.to
  const P = parentOf(S)
  const kS = indexOf(S)
  // The seed's room keeps no doorway to its siblings and is not shown on its parent's far wall.
  const closed = new Set()
  if (kS > 1) closed.add(`${keyOf(P)}#${kS - 1}`)
  if (kS < childCount(P)) closed.add(`${keyOf(P)}#${kS}`)
  const plan = {
    origin,
    trail,
    A,
    S,
    dir: choice.dir,
    hidden: (to) => same(to, S),
    closed: (parent, k) => closed.has(`${keyOf(parent)}#${k}`),
    // The hidden way: in A, the wall in `dir` lets you through to S.
    passage: (path) => (same(path, A) ? { dir: choice.dir, to: S, n: kS } : null),
    reverse: (path) => (same(path, S) && OPPOSITE[choice.dir] ? { dir: OPPOSITE[choice.dir], to: A, n: indexOf(A) } : null),
  }
  // Along the trail a little warmth comes through the doorway that leads on toward the seed.
  plan.warmth = (path) => {
    const i = trail.findIndex((p) => same(p, path))
    if (i < 0 || i >= trail.length - 1) return null
    return trail[i + 1]
  }
  return plan
}

// body > div:nth-child(6) > div:nth-child(12). `last` counts from the other end (:nth-last-child), and
// `short` keeps only the last three steps of a deep room.
export function selectorOf(path, { last = false, short = false } = {}) {
  const parts = ['body']
  for (let i = 0; i < path.length; i++) parts.push(stepName(path.slice(0, i + 1), last))
  if (short && parts.length > 4) return [parts[0], '…', ...parts.slice(-3)].join(' > ')
  return parts.join(' > ')
}

export function stepName(path, last = false) {
  if (!path.length) return 'body'
  const k = indexOf(path)
  return last ? `div:nth-last-child(${childCount(parentOf(path)) - k + 1})` : `div:nth-child(${k})`
}

// The one letter in the one room that is not :empty: a letter of the address that went wrong, or, for a
// visitor who came by a room's own address, one of the letters this face teaches.
export function strayLetter(text, origin) {
  const letters = String(text ?? '').toLowerCase().match(/[a-z]/g) ?? []
  const h = hash(`interstice/letter/${text ?? ''}/${keyOf(origin)}`)()
  if (letters.length) return letters[h % letters.length]
  const pool = ROSETTA.interstice ?? ['p']
  return pool[h % pool.length]
}

// An address one letter away from a shelf of the Infinite Scripture: /vrse/in/the/beginning lost its e.
// Returns {letter, kind: 'missing'|'extra'|'wrong', to} or null. `to` always stays on this site.
export function mend(rawPath) {
  const segs = String(rawPath ?? '').split('/')
  let first = segs[1] ?? ''
  try { first = decodeURIComponent(first) } catch {}
  const fix = oneEdit(first.toLowerCase(), 'verse')
  if (!fix) return null
  const rest = segs.slice(2).join('/')
  return { ...fix, to: '/verse' + (rest ? `/${rest}` : '') }
}

function oneEdit(a, b) {
  if (a === b || !/^[a-z]{3,8}$/.test(a)) return null
  if (a.length === b.length - 1) {
    for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) return a.slice(i) === b.slice(i + 1) ? { kind: 'missing', letter: b[i] } : null
    return null
  }
  if (a.length === b.length + 1) {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a.slice(i + 1) === b.slice(i) ? { kind: 'extra', letter: a[i] } : null
    return null
  }
  if (a.length === b.length) {
    const diff = [...a].flatMap((c, i) => (c !== b[i] ? [i] : []))
    if (diff.length === 1) return { kind: 'wrong', letter: b[diff[0]], was: a[diff[0]] }
  }
  return null
}

// What an address says on a plaque: decoded where it can be, never longer than a plaque.
export function readable(pathname, search = '') {
  let p = String(pathname ?? '/')
  try { p = decodeURIComponent(p) } catch {}
  let q = String(search ?? '')
  try { q = decodeURIComponent(q) } catch {}
  const s = (p + q).replace(/[\u0000-\u001f\u007f]/g, '�')
  return s.length > 72 ? `${s.slice(0, 70)}…` : s
}
