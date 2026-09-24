// Fate. Deterministic randomness: the same seed always yields the same visit.
// xmur3 string hash -> sfc32 generator.

export function hash(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

function sfc32(a, b, c, d) {
  return () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0
    let t = (a + b) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    d = (d + 1) | 0
    t = (t + d) | 0
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}

// makeRng('seed') returns a function () => [0, 1) with helpers attached.
export function makeRng(seed) {
  const s = hash(String(seed))
  const next = sfc32(s(), s(), s(), s())
  for (let i = 0; i < 12; i++) next()
  const rng = () => next()
  rng.seed = String(seed)
  rng.int = (min, max) => Math.floor(next() * (max - min + 1)) + min // inclusive
  rng.float = (min, max) => next() * (max - min) + min
  rng.pick = (arr) => arr[Math.floor(next() * arr.length)]
  rng.chance = (p) => next() < p
  rng.shuffle = (arr) => {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  // weighted({a: 2, b: 1}) -> 'a' about two thirds of the time
  rng.weighted = (weights) => {
    const entries = Object.entries(weights).filter(([, w]) => w > 0)
    const total = entries.reduce((n, [, w]) => n + w, 0)
    let r = next() * total
    for (const [k, w] of entries) if ((r -= w) < 0) return k
    return entries[entries.length - 1]?.[0]
  }
  // fork('audio') gives an independent stream, stable for the same parent seed.
  rng.fork = (name) => makeRng(`${rng.seed}/${name}`)
  return rng
}

// A fresh seed for this visit (unless ?seed= pins it). Uses crypto, never Math.random.
export function freshSeed() {
  const b = new Uint32Array(2)
  crypto.getRandomValues(b)
  return b[0].toString(36) + b[1].toString(36)
}
