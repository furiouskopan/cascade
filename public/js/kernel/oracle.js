// The Oracle. Decides which face of the temple this visit sees.
// Inputs: the visit's fate (rng), the firmament (sky), and what the Akashic Record remembers (memory).
// Each face's leanings (its omens, planets, newcomers, the restless and the still) are written in its
// entry of the face registry, lib/faces.js; see docs/CANON.md §3 for the faces and why each omen
// favours which.
import { REGISTRY, LOT, HIDDEN, isFace, routeFace } from '../lib/faces.js'

// The faces drawn by lot, in the registry's order.
export const FACES = LOT
// Faces never drawn by lot (route-only, like babel, or secret).
export const HIDDEN_FACES = HIDDEN

const by = (table, key) => (table && Object.hasOwn(table, key) ? table[key] : undefined)

export function faceWeights({ sky, memory }) {
  const visits = memory.get('visits', 1)
  const seen = memory.get('facesSeen', [])
  const last = memory.get('lastFace', null)
  const r = memory.get('restlessness', 0)
  const planet = sky.planetaryHour?.planet
  const w = {}
  for (const f of FACES) {
    const o = REGISTRY[f].oracle ?? {}
    let x = o.weight ?? 1
    if (visits <= 1 && o.newcomer) x *= o.newcomer
    // Omens, in the order the face wrote them; 'a|b' counts once if either holds.
    for (const [omens, k] of Object.entries(o.omens ?? {})) if (omens.split('|').some((m) => sky.has(m))) x *= k
    const p = by(o.planets, planet)
    if (p) x *= p
    // Returning souls: prefer faces not yet seen, rarely repeat the last one.
    if (visits > 1 && !seen.includes(f)) x *= 1.6
    if (visits > 1 && f === last) x *= 0.2
    // The restless are drawn to hell; the still to the ashram (as their entries say).
    if (r > 0.3 && o.restless) x *= o.restless
    if (r < 0.08 && visits > 1 && o.still) x *= o.still
    w[f] = x
  }
  return w
}

export function chooseFace(ctx) {
  const routed = routeFace(location.pathname)
  if (routed) return routed
  const forced = ctx.params.get('face')
  if (forced && isFace(forced)) return forced
  return ctx.rng.fork('oracle').weighted(faceWeights(ctx))
}

// A schism: mid-visit the temple may change its face. Returns the new face or null.
// Called by main.js on strong behavioral signals; rare by design.
export function schismCandidate(ctx, reason) {
  const chance = { restless: 0.25, still: 0.35, return: 0.2, eclipse: 0.6 }[reason] ?? 0.1
  const r = ctx.rng.fork(`schism/${reason}/${ctx.schisms}`)
  if (!r.chance(chance)) return null
  const w = faceWeights(ctx)
  w[ctx.face] = 0
  for (const f of FACES) {
    const k = by(REGISTRY[f].oracle?.schism, reason)
    if (k) w[f] *= k
  }
  return r.weighted(w)
}
