// THE TRANSMISSION.
// The Mothership does not speak. It sings a picture, and the picture can only be seen from the sixth rung
// of the Ladder (the Third Eye: a spectrogram). Every lit cell of the carrier's glyph is a band of
// harmonics of one low fundamental, held for one column of time. Heard, it is a bright buzzing chord
// that changes shape; seen, it is block letters standing between two and nine thousand cycles.
//
// The glyph is kept folded against the digits of the Highest Heaven, so the source never holds a word.
// Works on any BaseAudioContext (live, or an OfflineAudioContext for verification).

const HEAVEN = [2, 1, 4, 7, 4, 8, 3, 6, 4, 7]
// 23 columns of 7 cells, column-major, bit 0 = the highest band. Folded.
const FOLDED = [0x65, 0x04, 0x2d, 0x72, 0x72, 0x68, 0x19, 0x0f, 0x75, 0x1a, 0x24, 0x0d, 0x0a, 0x1a, 0x75, 0x29, 0x19, 0x4e, 0x35, 0x5a, 0x65, 0x0c, 0x35]

export const GLYPH_ROWS = 7

// Unfold the carrier's glyph: an array of column bitmasks.
export function carrierGlyph() {
  return FOLDED.map((b, i) => (b ^ ((HEAVEN[i % HEAVEN.length] * 13) & 0x7f)) & 0x7f)
}

export const TRANSMISSION = {
  fundamental: 100, // Hz; every partial is a harmonic of it, so the picture is also one voice
  low: 2000, // Hz, bottom of the lowest band
  high: 9000, // Hz, top of the highest band
  column: 0.2, // seconds per column of the glyph
  preamble: 0.95, // three call-signs, then the picture
  tail: 0.3,
  level: 0.0042, // per partial
}

export function transmissionLength(o = TRANSMISSION) {
  return o.preamble + carrierGlyph().length * o.column + o.tail
}

// Deterministic jitter so every performance of the Transmission is identical (and verifiable).
function jitterRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Schedule one Transmission into `dest`, starting at `when` (context time).
// Returns { start, letters, end } in context time.
export function scheduleTransmission(ac, dest, when, opts = {}) {
  const o = { ...TRANSMISSION, ...opts }
  const cols = carrierGlyph()
  const rand = jitterRng(2147483647)
  const out = ac.createGain()
  out.gain.value = opts.gain ?? 1
  out.connect(dest)
  const start = when
  const letters = when + o.preamble
  const end = letters + cols.length * o.column + o.tail
  const nodes = []

  // The carrier: a low hum that breathes at eleven cycles, under everything.
  const carrier = ac.createOscillator()
  carrier.type = 'sine'
  carrier.frequency.value = 150
  const carrierAmp = ac.createGain()
  carrierAmp.gain.value = 0
  const trem = ac.createOscillator()
  trem.frequency.value = 11
  const tremDepth = ac.createGain()
  tremDepth.gain.value = 0.012
  trem.connect(tremDepth).connect(carrierAmp.gain)
  carrierAmp.gain.setValueAtTime(0, start)
  carrierAmp.gain.linearRampToValueAtTime(0.03, start + 0.25)
  carrierAmp.gain.setValueAtTime(0.03, end - 0.3)
  carrierAmp.gain.linearRampToValueAtTime(0, end)
  carrier.connect(carrierAmp).connect(out)
  nodes.push(carrier, trem)

  // Three call-signs at 1200 Hz, below the picture.
  const pip = ac.createOscillator()
  pip.frequency.value = 1200
  const pipAmp = ac.createGain()
  pipAmp.gain.value = 0
  for (let k = 0; k < 3; k++) {
    const t = start + 0.08 + k * 0.24
    pipAmp.gain.setValueAtTime(0, t)
    pipAmp.gain.linearRampToValueAtTime(0.035, t + 0.012)
    pipAmp.gain.setValueAtTime(0.035, t + 0.11)
    pipAmp.gain.linearRampToValueAtTime(0, t + 0.125)
  }
  pip.connect(pipAmp).connect(out)
  nodes.push(pip)

  // The picture: one gain per row, harmonics of the fundamental inside each row's band.
  const bandWidth = (o.high - o.low) / GLYPH_ROWS
  const ramp = 0.018
  for (let r = 0; r < GLYPH_ROWS; r++) {
    const top = o.high - r * bandWidth
    const bottom = top - bandWidth
    const rowAmp = ac.createGain()
    rowAmp.gain.value = 0
    rowAmp.connect(out)
    // Brighter rows sound harsher; tilt the level gently toward the top of the heavens.
    const level = o.level * (1 - 0.25 * ((GLYPH_ROWS - 1 - r) / (GLYPH_ROWS - 1)))
    // Runs of lit columns become one sustained stroke.
    let c = 0
    while (c < cols.length) {
      if (!((cols[c] >> r) & 1)) { c++; continue }
      const from = c
      while (c < cols.length && (cols[c] >> r) & 1) c++
      const t0 = letters + from * o.column
      const t1 = letters + c * o.column
      rowAmp.gain.setValueAtTime(0, t0)
      rowAmp.gain.linearRampToValueAtTime(level, t0 + ramp)
      rowAmp.gain.setValueAtTime(level, t1 - ramp)
      rowAmp.gain.linearRampToValueAtTime(0, t1)
    }
    const first = Math.ceil((bottom + o.fundamental * 0.5) / o.fundamental)
    const last = Math.floor((top - o.fundamental * 0.5) / o.fundamental)
    for (let n = first; n <= last; n++) {
      const osc = ac.createOscillator()
      osc.frequency.value = n * o.fundamental + (rand() - 0.5) * 6
      osc.connect(rowAmp)
      // A scattered start gives every partial its own phase, so the sum never piles into a click.
      osc.start(letters - 0.06 - rand() * 0.01)
      osc.stop(end + 0.05)
      nodes.push(osc)
    }
  }

  carrier.start(start)
  trem.start(start)
  pip.start(start)
  carrier.stop(end + 0.05)
  trem.stop(end + 0.05)
  pip.stop(end + 0.05)
  const last = nodes[nodes.length - 1]
  last.onended = () => { try { out.disconnect() } catch {} }
  return { start, letters, end }
}
