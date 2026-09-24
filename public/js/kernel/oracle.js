// The Oracle. Decides which face of the temple this visit sees.
// Inputs: the visit's fate (rng), the firmament (sky), and what the Akashic Record remembers (memory).
// See docs/CANON.md §3 for the faces and why each omen favours which.

export const FACES = ['sanctum', 'possession', 'recruitment', 'ashram', 'departure']
// Route-only faces, never drawn by lot.
export const HIDDEN_FACES = ['babel']

export function faceWeights({ sky, memory }) {
  const w = { sanctum: 1, possession: 1, recruitment: 1, ashram: 1, departure: 1 }
  const visits = memory.get('visits', 1)
  const seen = memory.get('facesSeen', [])
  const last = memory.get('lastFace', null)

  // The Recruiters always greet newcomers first.
  if (visits <= 1) w.recruitment *= 6

  // Omens.
  if (sky.has('witching') || sky.has('midnight')) w.possession *= 4
  if (sky.has('friday-13')) w.possession *= 3
  if (sky.has('full-moon')) { w.ashram *= 2.5; w.sanctum *= 2 }
  if (sky.has('new-moon')) w.departure *= 3
  if (sky.has('triple') || sky.has('thirty-three')) w.departure *= 2
  if (sky.has('saturn-hour')) w.sanctum *= 2
  if (sky.has('turning') || sky.has('eclipse')) { w.departure *= 2; w.possession *= 2 }
  if (sky.has('night')) w.possession *= 1.5
  if (sky.planetaryHour.planet === 'Venus') w.ashram *= 1.8
  if (sky.planetaryHour.planet === 'Mercury') w.recruitment *= 1.6

  // Returning souls: prefer faces not yet seen, rarely repeat the last one.
  for (const f of FACES) if (!seen.includes(f) && visits > 1) w[f] *= 1.6
  if (last && visits > 1) w[last] *= 0.2

  // The restless are drawn to hell; the still to the ashram.
  const r = memory.get('restlessness', 0)
  if (r > 0.3) w.possession *= 1.5
  if (r < 0.08 && visits > 1) w.ashram *= 1.4

  return w
}

export function chooseFace(ctx) {
  const path = location.pathname.replace(/\/+$/, '')
  if (path.startsWith('/verse')) return 'babel'
  const forced = ctx.params.get('face')
  if (forced && (FACES.includes(forced) || HIDDEN_FACES.includes(forced))) return forced
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
  if (reason === 'restless') w.possession *= 4
  if (reason === 'still') w.ashram *= 3
  return r.weighted(w)
}
