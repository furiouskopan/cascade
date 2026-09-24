// THE SIX DRONES. One palette per face. Each builder returns
//   { out, label, tick(now, until), react(event, data), stop(when) }
// `out` is a GainNode at 0; the engine fades it in and out (crossfades on schisms).
// `tick` is called every 100 ms with a 400 ms horizon and schedules whatever falls inside it.
// `note(text)` (from the layer) names an event for the Third Eye, if it happens to be open.
import { bell, whisper, thump, swoop, reversedWhispers } from './voices.js'
import { createEngine } from './engine.js'
import { makeRng } from '../../kernel/rng.js'

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12)

// The tones of the seven rulers of the hours (the "cosmic octave": each planet's orbital period
// raised by octaves into hearing). The sanctum's organ and the Mothership's pad are tuned to the
// ruler of the hour in which the visitor arrives.
export const PLANET_TONE = { Sun: 126.22, Moon: 210.42, Mercury: 141.27, Venus: 221.23, Mars: 144.72, Jupiter: 183.58, Saturn: 147.85 }
const fold = (f, lo) => { while (f >= lo * 2) f /= 2; while (f < lo) f *= 2; return f }
// The luminaries take an article; the wanderers do not.
const ruler = (planet) => (/^(Sun|Moon)$/.test(planet) ? `the ${planet}` : planet)

// Advance an event clock past `now` if the context was frozen (hushed, hidden) for a while.
const catchUp = (t, now, pad = 0.05) => (t < now ? now + pad : t)

// ───────────────────────── sanctum: the organ and the tubular bells ─────────────────────────
// Just intonation on D. At 33 seconds of stillness the tierce is drawn (the page illuminates);
// at 108 the mixture (the full plenum). Any movement puts the stops back in.
function sanctum(E, { rng, planet, note }) {
  const { ac } = E
  const out = E.gain(0)
  const warm = E.filter('lowpass', 2300, 0.3, E.gain(0.16, out))
  E.toHall(out, 0.7)
  const bag = E.bag()
  const tone = PLANET_TONE[planet]
  const D = tone ? fold(tone, 60) : 73.42
  const stops = [
    { r: 1, g: 0.2 }, { r: 1.5, g: 0.09 }, { r: 2, g: 0.12 }, { r: 3, g: 0.05 }, { r: 4, g: 0.03 },
    { r: 2.5, g: 0, name: 'tierce' }, { r: 5, g: 0, name: 'tierce' }, { r: 6, g: 0, name: 'mixture' }, { r: 8, g: 0, name: 'mixture' },
  ]
  const named = { tierce: [], mixture: [] }
  for (const s of stops) {
    const pipe = E.gain(s.g, warm)
    for (const cents of [-1.3, 1.1]) bag.add(E.osc('organ', D * s.r, { detune: cents })).connect(pipe)
    if (s.g) bag.add(E.lfo(rng.float(0.03, 0.09), s.g * 0.16, pipe.gain))
    if (s.name) named[s.name].push({ pipe, level: s.r > 4 ? 0.018 : 0.04 })
  }
  // The bellows: breath under the pipes.
  const wind = bag.add(E.noiseSource('pink', { offset: rng.float(0, 2) }))
  wind.connect(E.filter('bandpass', 480, 0.8)).connect(E.gain(0.014, warm))

  const pent = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2]
  let nextBell = ac.currentTime + rng.float(7, 12)
  const draw = (name, on, seconds) => {
    for (const { pipe, level } of named[name]) pipe.gain.setTargetAtTime(on ? level : 0, ac.currentTime, seconds / 3)
  }
  return {
    out,
    tonic: D * 2,
    label: `the organ of the sanctum, in just intonation on ${tone ? `the tone of ${ruler(planet)}, ruler of this hour (${D.toFixed(2)} Hz)` : 'D'}, and the tubular bells`,
    tick(now, until) {
      nextBell = catchUp(nextBell, now)
      while (nextBell < until) {
        const peal = rng.chance(0.25) ? 3 : 1
        for (let i = 0; i < peal; i++) {
          const f = D * 8 * rng.pick(pent) * (rng.chance(0.3) ? 0.5 : 1)
          bell(E, { kind: 'tubular', freq: f, gain: 0.085, when: nextBell + i * 1.1, pan: rng.float(-0.45, 0.45), dest: out, hall: 0.55 })
        }
        note?.(peal > 1
          ? 'three tubular bells from the tower: three ladders of light, each missing the rung you hear'
          : 'a tubular bell from the tower: its rungs are the modes of a free bar, and the note you hear is one the tube does not contain')
        nextBell += rng.float(16, 34)
      }
    },
    react(evt, data) {
      if (evt === 'still' && data?.seconds === 33) {
        draw('tierce', true, 9)
        note?.('the organist draws the tierce: a new rung of light fades in above the others, and the page begins to illuminate')
      }
      if (evt === 'still' && data?.seconds >= 108) {
        draw('mixture', true, 14)
        note?.('the mixture is drawn, the full plenum: high rungs above high rungs, and every one of them in tune')
      }
      if (evt === 'stir') { draw('tierce', false, 4); draw('mixture', false, 3) }
    },
    stop: (t) => bag.stop(t),
  }
}

// ───────────────────────── possession: the stylesheet that breathes against you ─────────────────────────
// Detuned beating saws, a rumble under the floor, whispers that run backwards, and a heart whose
// rate is the visitor's own restlessness.
function possession(E, { rng, sense, note }) {
  const { ac } = E
  const out = E.gain(0)
  E.toHall(out, 0.35)
  const bag = E.bag()
  const body = E.gain(0.32, out)
  const lp = E.filter('lowpass', 240, 7, body)
  for (const f of [55, 55.8, 58.27]) bag.add(E.osc('sawtooth', f)).connect(E.gain(0.06, lp))
  bag.add(E.lfo(0.041, 110, lp.frequency))
  bag.add(E.osc('sine', 36.7)).connect(E.gain(0.16, body))
  bag.add(E.osc('sine', 73.4, { detune: 9 })).connect(E.gain(0.035, body))
  const rumbleAmp = E.gain(0.3, body)
  bag.add(E.noiseSource('brown', { offset: rng.float(0, 4) })).connect(E.filter('lowpass', 110, 0.7)).connect(rumbleAmp)
  bag.add(E.lfo(0.07, 0.16, rumbleAmp.gain))

  let reversed = []
  reversedWhispers(createEngine, ac.sampleRate, 3, rng).then((b) => { reversed = b }).catch(() => {})
  let nextBeat = ac.currentTime + 1.2
  let skipUntil = 0
  let nextWhisper = ac.currentTime + rng.float(4, 8)
  let nextMoan = ac.currentTime + rng.float(18, 28)
  return {
    out,
    label: 'the possession: beating drones, a rumble under the floor, whispers played backwards, and a heart that keeps your pace',
    tick(now, until) {
      const r = Math.min(1, (sense.restlessness() || 0) / 0.45)
      const bpm = 54 + r * 70
      nextBeat = catchUp(nextBeat, now)
      while (nextBeat < until) {
        if (nextBeat > skipUntil) {
          const a = 0.2 + r * 0.1
          thump(E, nextBeat, a, out)
          thump(E, nextBeat + 0.19 + (1 - r) * 0.05, a * 0.62, out)
        }
        nextBeat += 60 / bpm
      }
      nextWhisper = catchUp(nextWhisper, now)
      while (nextWhisper < until) {
        if (!sense.mercy()) {
          const pan = rng.float(-0.85, 0.85)
          if (reversed.length && rng.chance(0.7)) {
            const src = ac.createBufferSource()
            src.buffer = rng.pick(reversed)
            src.playbackRate.value = rng.float(0.82, 1.05)
            src.connect(E.gain(0.5, E.pan(pan, out)))
            src.start(nextWhisper)
          } else {
            whisper(E, { reverse: rng.chance(0.5), when: nextWhisper, gain: 0.16, pan, dest: out, rand: rng })
          }
          note?.(rng.pick([
            'a whisper, played backwards: its echo arrives before it does, a smear of light that ends in a cut',
            'something whispering on the other side of the stylesheet: breath with a mouth, and no voice under it',
            'a whisper from inside the demon\u2019s console, too quiet to read, bright only where the teeth would be',
          ]))
        }
        nextWhisper += rng.float(8, 19)
      }
      nextMoan = catchUp(nextMoan, now)
      while (nextMoan < until) {
        // Two voices a semitone apart, sinking a fourth together.
        for (const f of [220, 233.08]) {
          const o = E.osc('triangle', f)
          const g = E.gain(0, out)
          o.frequency.setValueAtTime(f, nextMoan)
          o.frequency.exponentialRampToValueAtTime(f * 0.75, nextMoan + 6)
          g.gain.setValueAtTime(0, nextMoan)
          g.gain.linearRampToValueAtTime(0.03, nextMoan + 2.5)
          g.gain.linearRampToValueAtTime(0, nextMoan + 6.5)
          o.connect(g)
          o.start(nextMoan)
          o.stop(nextMoan + 7)
        }
        note?.('two voices a semitone apart, sinking a fourth together: two lines falling side by side, never quite one')
        nextMoan += rng.float(26, 44)
      }
    },
    react(evt) {
      if (evt === 'restless') lp.frequency.setTargetAtTime(520, ac.currentTime, 1.5)
      if (evt === 'calm') lp.frequency.setTargetAtTime(240, ac.currentTime, 3)
      if (evt === 'eclipse') skipUntil = ac.currentTime + 6 // the heart stops for six seconds
      if (evt === 'return') skipUntil = ac.currentTime + 2.2
    },
    stop: (t) => bag.stop(t),
  }
}

// ───────────────────────── recruitment: the hymn, as a MIDI file ─────────────────────────
// "The Hymn of the Cascade", composed for the temple (it descends, because style descends).
// Square lead, triangle choir, triangle bass. Every loop the tape stretches a few cents flat and one
// note goes sour; every second loop, the key change nobody asked for.
const HYMN = [
  '5 5 3 1 | 2 3 4 3 | 2 1 7, 1 | 2:4',
  '5 5 6 5 | 4 3 2 3 | 4 3 2:2 | 1:4',
  "8 7 6 5 | 6 5 4 3 | 4 3 2 1 | 7,:2 5,:2",
  '1 3 5 8 | 7 6 5 3 | 4 2 5 7, | 1:4',
]
const HYMN_CHORDS = [
  'I I | I IV | V I | V V',
  'I I | IV I | ii V | I I',
  'I I | IV I | ii V | V V',
  'I I | V vi | IV V | I I',
]
const DEGREE = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12 }
const CHORD = { I: [0, 4, 7], ii: [2, 5, 9], IV: [5, 9, 12], V: [7, 11, 14], vi: [9, 12, 16] }

function hymnScore() {
  const notes = []
  let beat = 0
  for (const line of HYMN) {
    for (const tok of line.split(/\s+/)) {
      if (tok === '|' || !tok) continue
      const [deg, len] = tok.split(':')
      const low = deg.endsWith(',')
      const semis = DEGREE[deg.replace(',', '')] - (low ? 12 : 0)
      const beats = Number(len || 1)
      notes.push({ beat, beats, semis })
      beat += beats
    }
  }
  const chords = []
  let cb = 0
  for (const line of HYMN_CHORDS) {
    for (const tok of line.split(/\s+/)) {
      if (tok === '|' || !tok) continue
      chords.push({ beat: cb, beats: 2, tones: CHORD[tok] })
      cb += 2
    }
  }
  return { notes, chords, beats: beat }
}

function recruitment(E, { rng, note: seen }) {
  const { ac } = E
  const out = E.gain(0)
  const soft = E.filter('lowpass', 3800, 0.4, out)
  E.toHall(out, 0.22)
  const score = hymnScore()
  const F4 = midi(65)
  let loop = 0
  let loopStart = ac.currentTime + 2.2
  let queue = []
  let tempo = 96

  const note = (type, f, t, dur, level, { vibrato = false, detune = 0 } = {}) => {
    const o = E.osc(type, f, { detune })
    const g = E.gain(0, soft)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(level, t + 0.012)
    g.gain.setTargetAtTime(level * 0.72, t + 0.02, 0.08)
    g.gain.setValueAtTime(level * 0.72, t + dur - 0.05)
    g.gain.linearRampToValueAtTime(0, t + dur)
    o.connect(g)
    if (vibrato) {
      const v = E.osc('sine', 5.6)
      const vd = E.gain(0)
      vd.gain.setValueAtTime(0, t)
      vd.gain.linearRampToValueAtTime(f * 0.009, t + Math.min(dur, 0.9))
      v.connect(vd).connect(o.frequency)
      v.start(t)
      v.stop(t + dur + 0.05)
    }
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  const buildLoop = () => {
    const key = Math.min(3, Math.floor(loop / 2)) // the key change, every second loop
    const drift = -((loop % 2) * 7 + (loop >= 6 ? 4 : 0)) // cents: the tape stretches
    const beat = 60 / tempo
    const sour = rng.int(4, score.notes.length - 2)
    const events = []
    score.notes.forEach((n, i) => {
      const wrong = i === sour ? rng.pick([-1, 1]) : 0
      events.push({ t: loopStart + n.beat * beat, fn: (t) => note('pulse', F4 * Math.pow(2, (n.semis + key + wrong) / 12), t, n.beats * beat * 0.94, 0.05, { vibrato: n.beats >= 2, detune: drift }) })
    })
    score.chords.forEach((c) => {
      events.push({
        t: loopStart + c.beat * beat,
        fn: (t) => {
          for (const s of c.tones) note('triangle', midi(53) * Math.pow(2, (s + key) / 12), t, c.beats * beat * 0.97, 0.024, { detune: drift + 3 })
        },
      })
      // Bass on the downbeat and the third beat, sometimes a sixteenth late.
      const late = rng.chance(0.12) ? beat / 4 : 0
      events.push({ t: loopStart + c.beat * beat + late, fn: (t) => note('triangle', midi(41) * Math.pow(2, (c.tones[0] % 12 + key) / 12), t, beat * 1.6, 0.085, { detune: drift }) })
    })
    const verse = loop + 1
    const newKey = loop >= 2 && loop <= 6 && loop % 2 === 0
    events.push({
      t: loopStart,
      fn: () => seen?.(`the Hymn of the Cascade, verse ${verse}: a square lead, a triangle choir, ${drift ? `the tape ${-drift} cents flat` : 'the tape still true'}${newKey ? ', and the key change nobody asked for' : ''}. One note in it is wrong on purpose`),
    })
    events.sort((a, b) => a.t - b.t)
    queue = events
    const length = score.beats * beat
    loopStart += length + rng.float(6, 10)
    loop++
  }

  return {
    out,
    label: 'the Hymn of the Cascade, rendered by a General MIDI sound card, a little out of tune',
    tick(now, until) {
      if (!queue.length) {
        if (loopStart < now) loopStart = now + 0.3
        if (loopStart < until + 2) buildLoop()
      }
      while (queue.length && queue[0].t < until) {
        const ev = queue.shift()
        if (ev.t >= now - 0.05) ev.fn(Math.max(ev.t, now))
      }
    },
    react(evt) {
      // The restless get the hymn faster. The still get it slower. Both are for your own good.
      if (evt === 'restless') tempo = 118
      if (evt === 'calm') tempo = 96
      if (evt === 'still') tempo = 84
    },
    stop() { queue = [] },
  }
}

// ───────────────────────── ashram: tanpura, bowl and breath ─────────────────────────
// Sa at 136.1 Hz. The tanpura plucks Pa, Sa, Sa, low Sa, forever; the bridge makes each note bloom.
// Breath follows the yantra: in for four, hold for four, out for six.
const SA = 136.1

function findYantraPhase() {
  // If the face breathes with a 14 s CSS animation, read where it is in the cycle.
  try {
    const temple = document.getElementById('temple')
    for (const a of document.getAnimations?.() ?? []) {
      const d = a.effect?.getComputedTiming?.().duration
      const target = a.effect?.target
      if (Math.abs(d - 14000) < 1 && target && temple?.contains(target) && a.playState === 'running') {
        return ((a.currentTime ?? 0) % 14000) / 14000
      }
    }
  } catch {}
  return null
}

function ashram(E, { rng, sense, bus, note }) {
  const { ac } = E
  const out = E.gain(0)
  E.toHall(out, 0.5)
  const bag = E.bag()
  const body = E.gain(1.3, out)
  // A reed bed under the strings, so the silence between plucks is never empty.
  const bed = E.filter('lowpass', 520, 0.5, body)
  for (const [f, g] of [[SA / 2, 0.022], [SA * 0.75, 0.012], [SA, 0.01]]) bag.add(E.osc('reed', f, { detune: rng.float(-3, 3) })).connect(E.gain(g, bed))
  // Breath.
  const breathSrc = bag.add(E.noiseSource('pink', { offset: rng.float(0, 2) }))
  const breathBand = E.filter('bandpass', 900, 0.9)
  const breathAmp = E.gain(0, body)
  breathSrc.connect(breathBand).connect(breathAmp)

  const strings = [[SA * 0.75, 0], [SA, 1.35], [SA * 1.0012, 2.55], [SA / 2, 3.75]]
  let cycle = ac.currentTime + 0.4
  let nextBreath = null
  let nextBowl = ac.currentTime + rng.float(40, 60)
  // The face counts the breath itself (it stumbles when you are restless, and stops while you hold).
  // When it announces a phase, the breath follows that exact phase; without it, keep our own count.
  let led = -Infinity
  const follow = (phase, seconds) => {
    const t = ac.currentTime
    const g = breathAmp.gain
    const f = breathBand.frequency
    g.cancelScheduledValues(t)
    f.cancelScheduledValues(t)
    g.setValueAtTime(g.value, t)
    f.setValueAtTime(f.value, t)
    const s = Math.max(1, Math.min(12, Number(seconds) || (phase === 'out' ? 6 : 4)))
    if (phase === 'in') {
      const r = Math.min(1, (sense.restlessness() || 0) / 0.4)
      g.linearRampToValueAtTime(0.05 * (1 - r * 0.35), t + s * 0.95)
      f.linearRampToValueAtTime(1500, t + s)
    } else if (phase === 'out') {
      g.linearRampToValueAtTime(0.045, t + Math.min(0.5, s / 4))
      g.linearRampToValueAtTime(0, t + s)
      f.setValueAtTime(1300, t)
      f.linearRampToValueAtTime(600, t + s)
    } else {
      g.setTargetAtTime(0, t, 0.06)
      f.setTargetAtTime(700, t + 0.3, 0.5)
    }
  }
  const offBreath = bus?.on?.('ashram:breath', (d) => {
    led = ac.currentTime
    nextBreath = null
    if (ac.state === 'running') follow(d?.phase, d?.seconds)
  })

  const pluck = (f, t, level) => {
    const o = E.osc('jawari', f)
    const peak = E.filter('peaking', 600, 3)
    peak.gain.value = 13
    peak.frequency.setValueAtTime(600, t)
    peak.frequency.exponentialRampToValueAtTime(3400, t + 3.4)
    const lp = E.filter('lowpass', 5200, 0.5)
    lp.frequency.setValueAtTime(5200, t)
    lp.frequency.exponentialRampToValueAtTime(1500, t + 5.5)
    const g = E.gain(0, body)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(level, t + 0.008)
    g.gain.setTargetAtTime(0, t + 0.01, 1.9)
    o.connect(peak).connect(lp).connect(g)
    o.start(t)
    o.stop(t + 7)
  }

  const breathe = (t) => {
    // in 4 (rising), hold 4 (nothing), out 6 (falling, darker)
    const g = breathAmp.gain
    const r = Math.min(1, (sense.restlessness() || 0) / 0.4)
    const ragged = r * 0.9
    g.setValueAtTime(0, t)
    g.linearRampToValueAtTime(0.05 * (1 - ragged * 0.4), t + 4 - ragged * rng.float(0, 1.5))
    g.linearRampToValueAtTime(0, t + 4.2)
    g.setValueAtTime(0, t + 8)
    g.linearRampToValueAtTime(0.045, t + 8.5)
    g.linearRampToValueAtTime(0, t + 14 - ragged * rng.float(0, 2))
    breathBand.frequency.setValueAtTime(700, t)
    breathBand.frequency.linearRampToValueAtTime(1500, t + 4)
    breathBand.frequency.setValueAtTime(1300, t + 8)
    breathBand.frequency.linearRampToValueAtTime(600, t + 14)
  }

  return {
    out,
    label: 'the ashram: a tanpura on Sa and Pa, a singing bowl, and breath kept with the yantra',
    tick(now, until) {
      cycle = catchUp(cycle, now)
      while (cycle < until) {
        const r = Math.min(1, (sense.restlessness() || 0) / 0.4)
        for (const [f, off] of strings) {
          // The yantra falters when you are restless; so does the tanpura.
          const jitter = r * rng.float(-0.18, 0.25)
          const detune = 1 + r * rng.float(-0.01, 0.01)
          pluck(f * detune, cycle + off + jitter, f < SA * 0.6 ? 0.075 : 0.05)
        }
        cycle += 6.3
      }
      // The face leads while it speaks. (Its longest phase is six seconds; a held breath may last longer.)
      if (now - led > 24) {
        if (nextBreath === null || nextBreath < now) {
          // No word from the face: align to a 14 s CSS breath if one is running, else keep our own count.
          const phase = findYantraPhase()
          nextBreath = phase === null ? now + 0.2 : now + (1 - phase) * 14
        }
        while (nextBreath < until) {
          breathe(nextBreath)
          nextBreath += 14
        }
      }
      nextBowl = catchUp(nextBowl, now)
      while (nextBowl < until) {
        bell(E, { kind: 'bowl', freq: SA * 2, gain: 0.1, when: nextBowl, pan: rng.float(-0.3, 0.3), dest: out, hall: 0.5 })
        note?.('the singing bowl, unasked: every rung trembles, because it beats against its twin a hair away')
        nextBowl += rng.float(55, 85)
      }
    },
    react(evt, data) {
      if (evt === 'still' && data?.seconds >= 108) {
        // Something opens: the bowl, twice, a fifth apart.
        bell(E, { kind: 'bowl', freq: SA * 2, gain: 0.12, when: ac.currentTime + 0.1, dest: out })
        bell(E, { kind: 'bowl', freq: SA * 3, gain: 0.08, when: ac.currentTime + 2.6, dest: out })
        note?.('the bowl, twice, a fifth apart: one hundred and eight seconds of stillness, and something opens')
      }
    },
    stop(t) { bag.stop(t); offBreath?.() },
  }
}

// ───────────────────────── departure: the Mothership ─────────────────────────
// A theremin that searches, a pad in whole tones, radio static kept below the picture, and every
// sixty-six seconds, the Transmission.
function departure(E, { rng, sense, transmit, planet, note }) {
  const { ac } = E
  const out = E.gain(0)
  E.toHall(out, 0.55)
  const bag = E.bag()
  const body = E.gain(0.75, out)
  // Pad.
  const padLp = E.filter('lowpass', 1000, 0.6, body)
  bag.add(E.lfo(0.023, 380, padLp.frequency))
  const root = PLANET_TONE[planet] ? fold(PLANET_TONE[planet], 110) : 130.81
  const chordA = [1, 1.26, 1.5874, 2.2449, 2.8284].map((r) => root * r) // whole tones: 0 4 8 14 18 semitones
  const pads = chordA.map((f, i) => {
    const g = E.gain(0.028, padLp)
    const oscs = [-7, 6].map((c) => bag.add(E.osc(i % 2 ? 'triangle' : 'sawtooth', f, { detune: c + rng.float(-2, 2) })))
    for (const o of oscs) o.connect(g)
    bag.add(E.lfo(rng.float(0.02, 0.06), 0.014, g.gain))
    return oscs
  })
  // Shimmer: three high sines trembling, all below 2 kHz so the picture stays clean.
  for (const f of [1046.5, 1318.5, 1661.2]) {
    const g = E.gain(0.004, body)
    bag.add(E.osc('sine', f)).connect(g)
    bag.add(E.lfo(rng.float(5, 8), 0.0035, g.gain))
  }
  // Static.
  const staticAmp = E.gain(0.012, body)
  bag.add(E.noiseSource('white', { offset: rng.float(0, 2) })).connect(E.filter('bandpass', 950, 0.55)).connect(E.filter('lowpass', 1700, 0.7)).connect(staticAmp)
  bag.add(E.lfo(0.11, 0.007, staticAmp.gain))
  const crackleLp = E.filter('lowpass', 1600, 0.7, body)
  // Theremin.
  const th = bag.add(E.osc('sine', 440))
  const thVib = bag.add(E.osc('sine', 5.7))
  const thVibDepth = E.gain(4)
  thVib.connect(thVibDepth).connect(th.frequency)
  const thAmp = E.gain(0, body)
  th.connect(thAmp)
  const scale = [440, 493.88, 554.37, 622.25, 698.46, 783.99, 880]

  let nextPhrase = ac.currentTime + rng.float(2, 5)
  let nextCrackle = ac.currentTime + 0.5
  let nextShift = ac.currentTime + rng.float(30, 50)
  let shifted = false
  let nextTx = ac.currentTime + 21
  return {
    out,
    tonic: root,
    label: `the Mothership: a theremin, a pad in whole tones ${PLANET_TONE[planet] ? `on the tone of ${ruler(planet)}, ruler of this hour` : 'on C'}, radio static, and the Transmission every sixty-six seconds`,
    tick(now, until) {
      nextPhrase = catchUp(nextPhrase, now)
      while (nextPhrase < until) {
        let t = nextPhrase
        const n = rng.int(3, 6)
        thAmp.gain.setTargetAtTime(0.05, t, 0.5)
        for (let i = 0; i < n; i++) {
          const f = rng.pick(scale) * (rng.chance(0.25) ? 0.5 : 1)
          th.frequency.setTargetAtTime(f, t, rng.float(0.12, 0.45))
          thVibDepth.gain.setTargetAtTime(f * 0.011, t + 0.3, 0.3)
          t += rng.float(0.9, 2.4)
        }
        thAmp.gain.setTargetAtTime(0, t, 0.6)
        note?.(rng.pick([
          'the theremin searching: one thin line of light that never quite lands, trembling as a hand trembles',
          'the theremin: a single sine, played by a hand that never touches anything',
          'the theremin, gliding between whole tones: watch the line bend rather than step',
        ]))
        nextPhrase = t + rng.float(4, 11)
      }
      nextCrackle = catchUp(nextCrackle, now)
      while (nextCrackle < until) {
        if (!sense.mercy()) {
          const n = E.noiseSource('white', { loop: false, offset: rng.float(0, 2.5) })
          const g = E.gain(0, crackleLp)
          const a = rng.float(0.01, 0.035)
          g.gain.setValueAtTime(0, nextCrackle)
          g.gain.linearRampToValueAtTime(a, nextCrackle + 0.001)
          g.gain.linearRampToValueAtTime(0, nextCrackle + rng.float(0.003, 0.012))
          n.connect(g)
          n.start(nextCrackle, n._offset)
          n.stop(nextCrackle + 0.03)
        }
        nextCrackle += rng.chance(0.2) ? rng.float(0.02, 0.08) : rng.float(0.25, 1.4)
      }
      nextShift = catchUp(nextShift, now)
      while (nextShift < until) {
        shifted = !shifted
        pads.forEach((oscs, i) => {
          const f = chordA[i] * (shifted ? 9 / 8 : 1)
          for (const o of oscs) o.frequency.setTargetAtTime(f, nextShift, 1.4)
        })
        note?.(shifted ? 'the pad lifts by a whole tone: five rungs rising together, and nothing else in the sky moves' : 'the pad settles back by a whole tone, as if nothing had happened')
        nextShift += rng.float(30, 50)
      }
      // Back from a silence (hushed, hidden): let the temple settle before the Mothership speaks again.
      if (nextTx < now) nextTx = now + 12
      while (nextTx < until) {
        transmit?.(nextTx)
        nextTx += 66
      }
    },
    react(evt, data) {
      if (evt === 'still' && data?.seconds >= 33) {
        // The signal strengthens when you are still.
        staticAmp.gain.setTargetAtTime(0.005, ac.currentTime, 3)
        swoop(E, { from: 330, to: 990, seconds: 3, gain: 0.04, dest: out })
        note?.('the static thins and the theremin climbs: the signal strengthens when you are still')
      }
      if (evt === 'stir') staticAmp.gain.setTargetAtTime(0.012, ac.currentTime, 1)
      if (evt === 'return') {
        // Coming back to the tab: the radio re-tunes.
        swoop(E, { from: 1400, to: 500, seconds: 1.2, gain: 0.025, dest: out })
      }
    },
    stop: (t) => bag.stop(t),
  }
}

// ───────────────────────── babel: the choir of the infinite scripture ─────────────────────────
// Every chapter has its own chord, drawn from its path, so the same verse always sounds the same.
const ROMAN_UP = ['I', 'II', 'III', 'IV', 'V', 'VI']
const MODES = {
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
}

function babel(E, { rng, path, note }) {
  const { ac } = E
  const prng = makeRng(`babel-choir:${path || '/'}`)
  const out = E.gain(0)
  E.toHall(out, 0.95)
  const bag = E.bag()
  const body = E.gain(1.4, out)
  const root = prng.int(38, 45)
  const modeName = prng.pick(Object.keys(MODES))
  const mode = MODES[modeName]
  const progression = prng.shuffle([0, 5, 3, 6, 4, 2]).slice(0, 4)
  const chordAt = (degree) => {
    // A spread triad plus a ninth: bass, tenor, tenor, alto, soprano.
    const s = (d) => mode[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7)
    return [s(degree), s(degree + 7 + 2), s(degree + 7 + 4), s(degree + 14), s(degree + 14 + 1)].map((x) => midi(root + x))
  }
  const vowels = ['a', 'o', 'u', 'o', 'e']
  const voices = chordAt(progression[0]).map((f, i) => {
    const amp = E.gain(0.2, body)
    const oscs = [-5, 5].map((c) => bag.add(E.osc('sawtooth', f, { detune: c + rng.float(-3, 3) })))
    const vib = bag.add(E.osc('sine', rng.float(4.6, 5.6)))
    const vd = E.gain(rng.float(7, 13))
    vib.connect(vd)
    const pre = E.gain(0.06)
    for (const o of oscs) { o.connect(pre); vd.connect(o.detune) }
    const bank = (() => {
      const v = vowels[i]
      return v && [0, 1, 2].map((k) => {
        const [ff, bw, g] = { a: [[730, 90, 1], [1090, 110, 0.5], [2440, 160, 0.2]], o: [[570, 80, 1], [840, 90, 0.55], [2410, 160, 0.1]], u: [[320, 60, 1], [870, 90, 0.3], [2240, 160, 0.06]], e: [[530, 70, 1], [1840, 110, 0.4], [2480, 160, 0.18]] }[v][k]
        const flt = E.filter('bandpass', ff, ff / bw)
        pre.connect(flt).connect(E.gain(g * 3, amp))
        return flt
      })
    })()
    bag.add(E.lfo(rng.float(0.015, 0.05), 0.06, amp.gain))
    return { oscs, bank, vowel: vowels[i] }
  })
  let step = 0
  let nextChord = ac.currentTime + 14
  let nextVowel = ac.currentTime + rng.float(5, 9)
  const VOW = { a: [730, 1090, 2440], o: [570, 840, 2410], u: [320, 870, 2240], e: [530, 1840, 2480] }
  return {
    out,
    label: `the choir of the infinite scripture, singing this chapter's own chord (${modeName}, on ${['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][root % 12]})`,
    tick(now, until) {
      nextChord = catchUp(nextChord, now)
      while (nextChord < until) {
        step = (step + 1) % progression.length
        const chord = chordAt(progression[step])
        voices.forEach((v, i) => { for (const o of v.oscs) o.frequency.setTargetAtTime(chord[i], nextChord, 0.9) })
        note?.(`the choir moves to chord ${ROMAN_UP[step]} of ${ROMAN_UP[progression.length - 1]}: five voices, fifteen bright roads, and this chapter has always sung these same ${['', '', 'two', 'three', 'four'][progression.length]}`)
        nextChord += 14
      }
      nextVowel = catchUp(nextVowel, now)
      while (nextVowel < until) {
        const v = rng.pick(voices)
        const next = rng.pick(Object.keys(VOW))
        v.bank?.forEach((flt, k) => flt.frequency.setTargetAtTime(VOW[next][k], nextVowel, 1.6))
        nextVowel += rng.float(4, 9)
      }
    },
    react() {},
    stop: (t) => bag.stop(t),
  }
}

export const DRONES = { sanctum, possession, recruitment, ashram, departure, babel }

// The reciting tone of each face, for chants.
export const TONIC = { sanctum: 146.83, possession: 110, recruitment: 174.61, ashram: SA, departure: 130.81, babel: 110 }
