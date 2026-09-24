// THE INSTRUMENTS OF THE TEMPLE. Every one takes the engine `E` and schedules itself at `when`.
// Nothing here starts loud: every attack is at least a few milliseconds, every level is small.

// ───────────────────────────── bells ─────────────────────────────
// r: partial ratios, a: amplitudes, d: seconds to fall silent, beat: detuning of each partial pair (Hz).
export const BELLS = {
  // Church bell: hum, prime, tierce (the minor third that makes bells sound like bells), quint, nominal.
  church: { r: [0.5, 1, 1.183, 1.506, 2, 2.514, 2.662, 3.011, 4.166], a: [0.3, 0.45, 0.38, 0.2, 0.42, 0.16, 0.12, 0.1, 0.07], d: [11, 8, 6.5, 5, 4.2, 3, 2.6, 2.2, 1.6], strike: 1800 },
  // Tubular bell: the modes of a free bar, (2n+1)², heard as a pitch the tube does not contain.
  tubular: { r: [0.617, 1.21, 2.0, 2.99, 4.17, 5.55], a: [0.1, 0.26, 0.55, 0.45, 0.28, 0.14], d: [4.5, 6.5, 7.5, 5.8, 4.2, 2.6], beat: [0, 0.3, 0.6, 0.8, 1.1, 1.3], strike: 2600 },
  // Handbell: nearly harmonic, short.
  hand: { r: [1, 2.01, 2.43, 3.02, 4.11, 5.4], a: [0.5, 0.3, 0.18, 0.12, 0.08, 0.05], d: [3.4, 2.5, 2, 1.5, 1.1, 0.8], strike: 5000 },
  // Singing bowl: inharmonic, long, every partial beating against its twin.
  bowl: { r: [1, 2.71, 5.15, 8.4, 12.3], a: [0.55, 0.42, 0.24, 0.12, 0.05], d: [20, 13, 8, 5, 3], beat: [0.9, 1.7, 2.3, 3.1, 3.6], strike: 700 },
  // Glass: for chimes and secrets.
  glass: { r: [1, 2.32, 4.25, 6.63], a: [0.5, 0.22, 0.1, 0.05], d: [2.8, 1.7, 1.1, 0.6], strike: 7000 },
  // Gong: slow bloom of the upper partials.
  gong: { r: [1, 1.52, 2.03, 2.41, 2.93, 3.46, 4.2, 5.1], a: [0.4, 0.3, 0.26, 0.2, 0.16, 0.12, 0.09, 0.06], d: [16, 12, 10, 9, 8, 7, 6, 5], beat: [0.4, 0.7, 0.9, 1.3, 1.6, 2, 2.4, 2.9], strike: 400, bloom: true },
  // "Tubular Bells", program 15 of General MIDI, on a sound card that cost less than the computer's mouse.
  gm: { r: [1, 2, 3.01, 4.2], a: [1.5, 0.9, 0.36, 0.2], d: [1.6, 1.2, 0.8, 0.5], strike: 0, cheap: true },
}

export function bell(E, { kind = 'hand', freq = 660, gain = 0.2, when, pan = 0, decay = 1, hall = 0.35, dest } = {}) {
  const { ac } = E
  const spec = BELLS[kind] ?? BELLS.hand
  const t = Math.max(when ?? ac.currentTime + 0.02, ac.currentTime)
  const out = E.pan(pan, dest ?? E.nodes.fx)
  E.toHall(out, hall)
  let end = t
  spec.r.forEach((ratio, i) => {
    const f = freq * ratio
    if (f > ac.sampleRate / 2.2) return
    const amp = spec.a[i] * gain
    const life = spec.d[i] * decay
    const g = ac.createGain()
    g.gain.value = 0
    g.connect(out)
    if (spec.bloom && i > 1) {
      // Upper partials of a gong arrive late and swell.
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(amp * 0.4, t + 0.01)
      g.gain.linearRampToValueAtTime(amp, t + 0.6 + i * 0.25)
      g.gain.setTargetAtTime(0, t + 0.6 + i * 0.25, life / 5)
    } else {
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(amp, t + 0.005)
      g.gain.setTargetAtTime(0, t + 0.005, life / 5)
    }
    const beat = spec.beat?.[i] ?? 0
    const pair = beat ? [f - beat / 2, f + beat / 2] : [f]
    for (const pf of pair) {
      const o = ac.createOscillator()
      if (spec.cheap) o.type = i === 0 ? 'square' : 'triangle'
      o.frequency.value = pf
      o.detune.value = spec.cheap ? 16 : 0 // slightly wrong, like the card
      const og = ac.createGain()
      og.gain.value = (spec.cheap && i === 0 ? 0.35 : 1) / pair.length
      o.connect(og).connect(g)
      o.start(t)
      o.stop(t + life + 0.3)
    }
    end = Math.max(end, t + life)
  })
  if (spec.strike) {
    const n = E.noiseSource('white', { loop: false, offset: Math.random() * 2 })
    const bp = E.filter('bandpass', spec.strike, 1.4)
    const g = E.gain(0)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain * 0.22, t + 0.002)
    g.gain.setTargetAtTime(0, t + 0.003, 0.012)
    n.connect(bp).connect(g).connect(out)
    n.start(t, n._offset)
    n.stop(t + 0.12)
  }
  return end
}

// Glass arpeggio: four notes rising, for a found secret.
export function chime(E, { when, root = 1046.5, gain = 0.1, pan = 0 } = {}) {
  const t = when ?? E.now() + 0.03
  const steps = [1, 9 / 8, 3 / 2, 2]
  steps.forEach((r, i) => bell(E, { kind: 'glass', freq: root * r, gain: gain * (1 - i * 0.12), when: t + i * 0.13, pan: pan + (i - 1.5) * 0.18, hall: 0.5 }))
  return t + 3
}

// A descending peal: rounds on eight bells, twice. (The Cascade's own change ringing.)
export function peal(E, { when, root = 523.25, gain = 0.09, kind = 'hand' } = {}) {
  const t = when ?? E.now() + 0.05
  const scale = [2, 15 / 8, 5 / 3, 3 / 2, 4 / 3, 5 / 4, 9 / 8, 1]
  for (let round = 0; round < 2; round++) {
    scale.forEach((r, i) => {
      const at = t + round * 2.3 + i * 0.26 + (Math.random() - 0.5) * 0.02
      bell(E, { kind, freq: root * r, gain: gain * (round ? 0.8 : 1), when: at, pan: (i / 7 - 0.5) * 0.9, hall: 0.45 })
    })
  }
  return t + 7
}

// ───────────────────────────── voices ─────────────────────────────
// Formants (Hz, bandwidth, gain) of five sung vowels and two hums.
export const FORMANTS = {
  a: [[730, 90, 1], [1090, 110, 0.5], [2440, 160, 0.22]],
  e: [[530, 70, 1], [1840, 110, 0.42], [2480, 160, 0.2]],
  i: [[290, 60, 1], [2290, 120, 0.3], [3010, 180, 0.16]],
  o: [[570, 80, 1], [840, 90, 0.55], [2410, 160, 0.12]],
  u: [[320, 60, 1], [870, 90, 0.3], [2240, 160, 0.08]],
  m: [[250, 60, 1], [1700, 150, 0.04], [2500, 200, 0.02]],
  n: [[280, 70, 1], [1500, 150, 0.06], [2600, 200, 0.03]],
}
const FRICATIVE = { s: ['highpass', 5200, 0.8, 0.5], z: ['highpass', 4800, 0.8, 0.35], f: ['bandpass', 3800, 0.6, 0.25], v: ['bandpass', 3000, 0.7, 0.2], h: ['bandpass', 1400, 0.6, 0.3], x: ['bandpass', 2600, 1, 0.35], c: ['bandpass', 3400, 1.2, 0.3], j: ['bandpass', 2500, 1.1, 0.3] }
const PLOSIVE = new Set(['p', 't', 'k', 'b', 'd', 'g', 'q'])

function vowelOf(v) {
  const c = v[0]
  if (c === 'y') return 'i'
  return 'aeiou'.includes(c) ? c : 'a'
}

// Split text into sung syllables {onset, vowel, coda}.
export function syllables(text, limit = 24) {
  const clean = String(text ?? '')
    .replace(/ॐ|ༀ/g, ' om ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z\s]/g, ' ')
  const out = []
  for (const word of clean.split(/\s+/).filter(Boolean)) {
    const parts = word.match(/[aeiouy]+|[^aeiouy]+/g) ?? []
    const syl = []
    let onset = ''
    parts.forEach((p, i) => {
      if (/[aeiouy]/.test(p[0])) {
        syl.push({ onset, vowel: p, coda: '' })
        onset = ''
      } else if (!syl.length) {
        onset = p
      } else if (i === parts.length - 1) {
        syl[syl.length - 1].coda = p
      } else if (p.length === 1) {
        onset = p
      } else {
        syl[syl.length - 1].coda = p.slice(0, -1)
        onset = p.slice(-1)
      }
    })
    if (!syl.length && onset) syl.push({ onset: '', vowel: '', coda: onset })
    if (syl.length) syl[syl.length - 1].wordEnd = true
    out.push(...syl)
  }
  return out.slice(0, limit)
}

// Chant: saw voices through three formant filters, singing the text on a reciting tone that falls a
// whole tone at the end, the way the old psalm tones close. `chords` may give each syllable its own
// voice ratios (for an Amen). Returns the end time.
export function chant(E, text, { freq = 146.83, when, gain = 0.55, voices = [1, 0.75, 0.5], rate = 1, hall = 0.55, dest, chords, pan = 0 } = {}) {
  const { ac } = E
  const syl = syllables(text)
  if (!syl.length) return E.now()
  const t0 = Math.max(when ?? ac.currentTime + 0.05, ac.currentTime)
  const out = E.pan(pan, dest ?? E.nodes.fx)
  E.toHall(out, hall)
  const amp = E.gain(0)
  // Formant bank.
  const bank = [0, 1, 2].map(() => {
    const f = E.filter('bandpass', 500, 5)
    const g = E.gain(1)
    amp.connect(f).connect(g).connect(out)
    return { f, g }
  })
  const body = E.filter('lowpass', 700, 0.5)
  const bodyGain = E.gain(0.14)
  amp.connect(body).connect(bodyGain).connect(out)
  const makeup = 1.3 * gain

  // Timeline.
  const base = 0.46 / rate
  let t = t0
  const segs = syl.map((s, i) => {
    const last = i === syl.length - 1
    const nasal = /^[mn]/.test(s.coda) ? s.coda[0] : null
    const vowelDur = base * (last ? (nasal ? 1.6 : 2.4) : s.wordEnd ? 1.25 : 1)
    const humDur = nasal ? base * (last ? 3.2 : 0.5) : 0
    const seg = { s, start: t, vowelDur, humDur, nasal, last, index: i }
    t += vowelDur + humDur + (s.wordEnd && !last ? base * 0.12 : 0)
    return seg
  })
  const end = t

  const oscs = []
  const count = chords ? chords[0].length : voices.length
  const vib = E.osc('sine', 5.3)
  const vibDepth = E.gain(0)
  vib.connect(vibDepth)
  vibDepth.gain.setValueAtTime(0, t0)
  vibDepth.gain.linearRampToValueAtTime(11, t0 + 0.9) // cents; the voice settles, then trembles
  for (let v = 0; v < count; v++) {
    const o = E.osc('voice', freq, { detune: (v - 1) * 3 })
    vibDepth.connect(o.detune)
    const g = E.gain(1 / Math.sqrt(count) * (v === 0 ? 1 : 0.8))
    o.connect(g).connect(amp)
    oscs.push(o)
  }

  const setFormant = (key, at, glide = 0.035) => {
    FORMANTS[key].forEach(([f, bw, g], k) => {
      bank[k].f.frequency.setTargetAtTime(f, at, glide)
      bank[k].f.Q.setTargetAtTime(f / bw, at, glide)
      bank[k].g.gain.setTargetAtTime(g, at, glide)
    })
  }

  amp.gain.setValueAtTime(0, t0)
  for (const seg of segs) {
    const { s, start, vowelDur, humDur, nasal, last, index } = seg
    const vowel = vowelOf(s.vowel || 'm')
    // Pitch: the reciting tone; a rising first syllable; the last falls a whole tone.
    let contour = 1
    if (last && syl.length > 1) contour = 8 / 9
    const ratios = chords ? chords[Math.min(index, chords.length - 1)] : voices
    oscs.forEach((o, v) => {
      const target = freq * (ratios[v] ?? ratios[0]) * contour
      if (index === 0 && syl.length > 2) {
        o.frequency.setValueAtTime(target * 0.94, start)
        o.frequency.setTargetAtTime(target, start + 0.05, 0.08)
      } else {
        o.frequency.setTargetAtTime(target, start, 0.05)
      }
    })
    // Onset.
    const onset = s.onset
    const plosive = onset && PLOSIVE.has(onset[0])
    if (index === 0) {
      amp.gain.setValueAtTime(0, start)
      amp.gain.linearRampToValueAtTime(makeup, start + (plosive ? 0.02 : 0.12))
    } else if (plosive) {
      amp.gain.setTargetAtTime(makeup * 0.04, start - 0.03, 0.01)
      amp.gain.setTargetAtTime(makeup, start + 0.015, 0.02)
    } else {
      amp.gain.setTargetAtTime(makeup * 0.7, start - 0.02, 0.02)
      amp.gain.setTargetAtTime(makeup, start + 0.03, 0.04)
    }
    const fric = [...onset].find((c) => FRICATIVE[c]) || (plosive ? onset[0] : null)
    if (fric) {
      const [type, f, Q, level] = FRICATIVE[fric] ?? ['bandpass', 2500, 1, 0.35]
      const n = E.noiseSource('white', { loop: false, offset: Math.random() * 2 })
      const flt = E.filter(type, f, Q)
      const g = E.gain(0)
      const len = plosive && !FRICATIVE[fric] ? 0.025 : 0.09
      g.gain.setValueAtTime(0, start - len * 0.6)
      g.gain.linearRampToValueAtTime(level * gain * 0.5, start - len * 0.3)
      g.gain.linearRampToValueAtTime(0, start + len * 0.4)
      n.connect(flt).connect(g).connect(out)
      n.start(Math.max(ac.currentTime, start - len), n._offset)
      n.stop(start + len)
    }
    // Vowel, with a glide for diphthongs (ai, au, oi).
    setFormant(vowel, start, index === 0 ? 0.005 : 0.035)
    if (s.vowel.length > 1 && s.vowel[1] !== s.vowel[0]) setFormant(vowelOf(s.vowel.slice(1)), start + vowelDur * 0.55, 0.08)
    // Coda.
    if (nasal) {
      setFormant(nasal, start + vowelDur, 0.06)
    } else if (s.coda) {
      const c = [...s.coda].find((ch) => FRICATIVE[ch])
      if (c) {
        const [type, f, Q, level] = FRICATIVE[c]
        const n = E.noiseSource('white', { loop: false, offset: Math.random() * 2 })
        const flt = E.filter(type, f, Q)
        const g = E.gain(0)
        const at = start + vowelDur * 0.8
        g.gain.setValueAtTime(0, at)
        g.gain.linearRampToValueAtTime(level * gain * 0.45, at + 0.03)
        g.gain.linearRampToValueAtTime(0, at + 0.12)
        n.connect(flt).connect(g).connect(out)
        n.start(at, n._offset)
        n.stop(at + 0.14)
      }
    }
    if (last) {
      const rel = start + vowelDur + humDur
      amp.gain.setTargetAtTime(0, rel - 0.15, 0.22)
    }
  }
  vib.start(t0)
  vib.stop(end + 1.5)
  for (const o of oscs) { o.start(t0); o.stop(end + 1.5) }
  return end
}

// Whisper: breath through the same formants, no voice. `reverse` draws each syllable backwards:
// it grows out of nothing and is cut off, as if the tape ran the wrong way.
export function whisper(E, { text, reverse = false, when, gain = 0.28, pan = 0, hall = 0.6, dest, rand = Math.random } = {}) {
  const { ac } = E
  const t0 = Math.max(when ?? ac.currentTime + 0.03, ac.currentTime)
  const sy = text ? syllables(text, 16) : Array.from({ length: 4 + Math.floor(rand() * 5) }, () => ({ vowel: 'aeiou'[Math.floor(rand() * 5)], onset: rand() < 0.4 ? 's' : '' }))
  const out = E.pan(pan, dest ?? E.nodes.fx)
  E.toHall(out, hall)
  const src = E.noiseSource('white', { loop: true, offset: rand() * 2 })
  const amp = E.gain(0)
  const bank = [0, 1, 2].map((k) => {
    const f = E.filter('bandpass', 800, 7)
    const g = E.gain([1, 0.7, 0.4][k] * 6.2)
    src.connect(f).connect(g).connect(amp)
    return f
  })
  const hiss = E.filter('highpass', 5000, 0.7)
  const hissAmp = E.gain(0)
  src.connect(hiss).connect(hissAmp).connect(out)
  amp.connect(out)
  let t = t0
  const lvl = gain
  for (const s of sy) {
    const d = 0.1 + rand() * 0.08
    const v = vowelOf(s.vowel || 'a')
    FORMANTS[v].forEach(([f], k) => bank[k].frequency.setValueAtTime(f * 1.08, t))
    if (reverse) {
      amp.gain.setValueAtTime(0.0001, t)
      amp.gain.exponentialRampToValueAtTime(lvl, t + d - 0.008)
      amp.gain.linearRampToValueAtTime(0, t + d)
    } else {
      amp.gain.setValueAtTime(0, t)
      amp.gain.linearRampToValueAtTime(lvl, t + 0.012)
      amp.gain.setTargetAtTime(0, t + 0.02, d / 3)
    }
    if (s.onset && /[szcx]/.test(s.onset)) {
      const at = reverse ? t + d - 0.05 : t - 0.04
      hissAmp.gain.setValueAtTime(0, at)
      hissAmp.gain.linearRampToValueAtTime(lvl * 0.5, at + 0.03)
      hissAmp.gain.linearRampToValueAtTime(0, at + 0.06)
    }
    t += d + 0.02 + rand() * 0.05
  }
  src.start(t0, src._offset)
  src.stop(t + 0.3)
  return t
}

// Render a few whispers offline and play them backwards: the hall arrives before the voice.
export async function reversedWhispers(createEngine, sampleRate, count = 3, rand = Math.random) {
  const Offline = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext
  if (!Offline) return []
  const buffers = []
  for (let i = 0; i < count; i++) {
    const seconds = 2.4
    const oac = new Offline(2, Math.floor(sampleRate * seconds), sampleRate)
    const E = createEngine(oac, { hallSeconds: 1.6 })
    E.nodes.master.gain.value = 1
    whisper(E, { when: 0.05, gain: 0.5, pan: 0, hall: 1.1, rand })
    const buf = await oac.startRendering()
    for (let ch = 0; ch < buf.numberOfChannels; ch++) buf.getChannelData(ch).reverse()
    buffers.push(buf)
  }
  return buffers
}

// ───────────────────────────── bodies ─────────────────────────────
// One half of a heartbeat: a falling sine and a soft knock, so small speakers hear it too.
export function thump(E, when, amp = 0.5, dest) {
  const out = dest ?? E.nodes.fx
  const o = E.osc('sine', 64)
  o.frequency.setValueAtTime(64, when)
  o.frequency.exponentialRampToValueAtTime(36, when + 0.16)
  const g = E.gain(0)
  g.gain.setValueAtTime(0, when)
  g.gain.linearRampToValueAtTime(amp, when + 0.01)
  g.gain.setTargetAtTime(0, when + 0.012, 0.07)
  o.connect(g).connect(out)
  o.start(when)
  o.stop(when + 0.5)
  const n = E.noiseSource('brown', { loop: false, offset: Math.random() * 3 })
  const lp = E.filter('bandpass', 180, 1.2)
  const ng = E.gain(0)
  ng.gain.setValueAtTime(0, when)
  ng.gain.linearRampToValueAtTime(amp * 0.5, when + 0.006)
  ng.gain.setTargetAtTime(0, when + 0.008, 0.035)
  n.connect(lp).connect(ng).connect(out)
  n.start(when, n._offset)
  n.stop(when + 0.25)
}

// A low swell for the Eclipse: slow in, slower out, never sudden.
export function swell(E, { when, freq = 49, seconds = 16, gain = 0.2 } = {}) {
  const t = when ?? E.now() + 0.05
  const out = E.gain(0, E.nodes.fx)
  E.toHall(out, 0.5)
  out.gain.setValueAtTime(0, t)
  out.gain.linearRampToValueAtTime(gain, t + seconds * 0.35)
  out.gain.setTargetAtTime(0, t + seconds * 0.4, seconds * 0.15)
  const lp = E.filter('lowpass', 180, 1.5, out)
  lp.frequency.setValueAtTime(180, t)
  lp.frequency.linearRampToValueAtTime(900, t + seconds * 0.4)
  lp.frequency.linearRampToValueAtTime(160, t + seconds)
  for (const [r, a] of [[1, 1], [1.5, 0.55], [2, 0.45], [3, 0.2]]) {
    const o = E.osc('reed', freq * r, { detune: (Math.random() - 0.5) * 8 })
    const g = E.gain(a * 0.5)
    o.connect(g).connect(lp)
    o.start(t)
    o.stop(t + seconds + 2)
  }
  const n = E.noiseSource('brown', { loop: true })
  const ng = E.gain(0.5)
  n.connect(ng).connect(lp)
  n.start(t, 0)
  n.stop(t + seconds + 2)
  return t + seconds
}

// A theremin phrase: a sine that slides, with the hand's tremble.
export function swoop(E, { when, from = 330, to = 880, seconds = 1.8, gain = 0.07, dest, pan = 0 } = {}) {
  const t = when ?? E.now() + 0.03
  const out = E.pan(pan, dest ?? E.nodes.fx)
  E.toHall(out, 0.6)
  const o = E.osc('sine', from)
  o.frequency.setValueAtTime(from, t)
  o.frequency.exponentialRampToValueAtTime(to, t + seconds * 0.8)
  const vib = E.osc('sine', 5.8)
  const vd = E.gain(0)
  vd.gain.setValueAtTime(0, t)
  vd.gain.linearRampToValueAtTime(to * 0.012, t + seconds * 0.7)
  vib.connect(vd).connect(o.frequency)
  const g = E.gain(0)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + seconds * 0.3)
  g.gain.setTargetAtTime(0, t + seconds * 0.8, seconds * 0.15)
  o.connect(g).connect(out)
  o.start(t)
  vib.start(t)
  o.stop(t + seconds * 1.6)
  vib.stop(t + seconds * 1.6)
  return t + seconds
}

// The General MIDI welcome: four notes, one ding, all a few cents sharp.
export function jingle(E, { when, root = 523.25, gain = 0.1 } = {}) {
  const t = when ?? E.now() + 0.03
  const notes = [1, 5 / 4, 3 / 2, 2]
  notes.forEach((r, i) => {
    const at = t + i * 0.12
    const o = E.osc('pulse', root * r, { detune: 14 })
    const g = E.gain(0, E.nodes.fx)
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(gain, at + 0.008)
    g.gain.setValueAtTime(gain * 0.8, at + 0.08)
    g.gain.linearRampToValueAtTime(0, at + (i === 3 ? 0.4 : 0.11))
    o.connect(g)
    o.start(at)
    o.stop(at + 0.5)
  })
  bell(E, { kind: 'gm', freq: root * 2, gain: gain * 1.2, when: t + 0.5, hall: 0.2 })
  return t + 1.6
}

// A choir breathing in: "ah", rising a fifth.
export function choirSwell(E, { when, freq = 110, seconds = 4, gain = 0.4 } = {}) {
  const t = when ?? E.now() + 0.05
  chant(E, 'aa', { freq, when: t, gain: gain * 1.4, voices: [1, 1.5, 2, 0.5], rate: 1 / (seconds / 1.6), hall: 0.8 })
  return t + seconds
}

// The Inversion: a reversed breath and a fall.
export function inversion(E, { when } = {}) {
  const t = when ?? E.now() + 0.03
  const n = E.noiseSource('pink', { loop: true, offset: Math.random() * 2 })
  const f = E.filter('bandpass', 600, 0.8)
  const g = E.gain(0, E.nodes.fx)
  E.toHall(g, 0.5)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.16, t + 1.1)
  g.gain.linearRampToValueAtTime(0, t + 1.14)
  f.frequency.setValueAtTime(300, t)
  f.frequency.exponentialRampToValueAtTime(3200, t + 1.1)
  n.connect(f).connect(g)
  n.start(t, n._offset)
  n.stop(t + 1.3)
  swoop(E, { when: t + 1.1, from: 700, to: 90, seconds: 1.8, gain: 0.05 })
  return t + 3
}
