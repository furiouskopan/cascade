// THE ORGAN LOFT. One context, one master, one hall, one ear.
//
//   drones ─┐
//   fx ─────┼─> temple ─> tone (the veil; closes for eclipses and while the Mothership speaks) ─┐
//   hall ───┘                                                                                  ├─> sum ─> master ─> limiter ─> out
//   transmission ──────────────────────────────────────────────────────────────────────────────┘      └─> ear (AnalyserNode, the Third Eye)
//
// Works with any BaseAudioContext, so every sound can also be rendered offline and measured.
import { scheduleTransmission } from './transmission.js'

export const MASTER_LEVEL = 0.5

// A small deterministic noise source (the hall must not depend on Math.random to be the same hall).
function lcg(seed = 1996) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

// A generated hall: stereo noise, bright at first and darker as it dies, with a short silence before it.
function hallImpulse(ac, seconds, { predelay = 0.022, curve = 2.4 } = {}) {
  const rate = ac.sampleRate
  const len = Math.max(1, Math.floor(rate * seconds))
  const pre = Math.floor(rate * predelay)
  const buf = ac.createBuffer(2, len, rate)
  const rand = lcg(2147483647)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let lp = 0
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / (len - pre)
      const white = rand() * 2 - 1
      lp += (white - lp) * (0.92 - 0.8 * t)
      d[i] = lp * Math.pow(1 - t, curve) * Math.exp(-2.2 * t)
    }
  }
  return buf
}

function noiseBuffer(ac, kind, seconds = 3) {
  const len = Math.floor(ac.sampleRate * seconds)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const d = buf.getChannelData(0)
  const rand = lcg(kind.length * 33 + 7)
  if (kind === 'white') {
    for (let i = 0; i < len; i++) d[i] = rand() * 2 - 1
  } else if (kind === 'pink') {
    // Paul Kellet's economy pink.
    let b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < len; i++) {
      const w = rand() * 2 - 1
      b0 = 0.99765 * b0 + w * 0.099046
      b1 = 0.963 * b1 + w * 0.2965164
      b2 = 0.57 * b2 + w * 1.0526913
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2
    }
  } else {
    // brown: integrated white, leaky.
    let last = 0
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (rand() * 2 - 1)) / 1.02
      d[i] = last * 3.2
    }
  }
  // Fade the loop seam.
  const fade = Math.min(512, len >> 3)
  for (let i = 0; i < fade; i++) {
    const k = i / fade
    d[i] *= k
    d[len - 1 - i] *= k
  }
  return buf
}

function wave(ac, name) {
  const n = 48
  const real = new Float32Array(n + 1)
  const imag = new Float32Array(n + 1)
  if (name === 'organ') {
    // An open diapason flue pipe: strong octave, soft upper partials.
    const amps = [0, 1, 0.52, 0.3, 0.2, 0.1, 0.07, 0.05, 0.03, 0.02, 0.012]
    amps.forEach((a, i) => { imag[i] = a })
  } else if (name === 'reed') {
    for (let k = 1; k <= n; k++) imag[k] = (k % 2 ? 1 : 0.55) / Math.pow(k, 0.9)
  } else if (name === 'pulse') {
    // 25% pulse: the lead patch of every sound card of 1997.
    for (let k = 1; k <= n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25)
  } else if (name === 'jawari') {
    // The tanpura's bridge lets every harmonic speak; a gentle bump near the 8th to the 14th.
    for (let k = 1; k <= n; k++) imag[k] = (1 / Math.pow(k, 0.72)) * (1 + 0.8 * Math.exp(-((k - 11) ** 2) / 18))
  } else if (name === 'voice') {
    for (let k = 1; k <= n; k++) imag[k] = 1 / Math.pow(k, 1.05)
  }
  return ac.createPeriodicWave(real, imag)
}

export function createEngine(ac, { hallSeconds = 4.6 } = {}) {
  // `cents` sags every drone oscillator (the witching hour); bells and the Transmission stay true.
  const E = { ac, tickers: new Set(), txUntil: 0, cents: 0 }

  const sum = ac.createGain()
  const master = ac.createGain()
  master.gain.value = 0
  const limiter = ac.createDynamicsCompressor()
  limiter.threshold.value = -16
  limiter.knee.value = 8
  limiter.ratio.value = 8
  limiter.attack.value = 0.004
  limiter.release.value = 0.3
  sum.connect(master).connect(limiter).connect(ac.destination)

  const ear = ac.createAnalyser()
  ear.fftSize = 2048
  ear.smoothingTimeConstant = 0.18
  ear.minDecibels = -116
  ear.maxDecibels = -50
  sum.connect(ear)

  const temple = ac.createGain()
  const tone = ac.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 19000
  tone.Q.value = 0.4
  temple.connect(tone).connect(sum)

  const drones = ac.createGain()
  drones.connect(temple)
  const fx = ac.createGain()
  fx.gain.value = 0.9
  fx.connect(temple)

  const hall = ac.createConvolver()
  hall.buffer = hallImpulse(ac, hallSeconds)
  const send = ac.createGain()
  const hallOut = ac.createGain()
  hallOut.gain.value = 0.62
  send.connect(hall).connect(hallOut).connect(temple)

  const tx = ac.createGain()
  tx.gain.value = 1.25
  tx.connect(sum)

  E.nodes = { sum, master, limiter, ear, temple, tone, drones, fx, send, hall, tx }
  E.now = () => ac.currentTime

  const noises = {}
  E.noise = (kind = 'white') => (noises[kind] ??= noiseBuffer(ac, kind, kind === 'brown' ? 5 : 3))
  const waves = {}
  E.wave = (name) => (waves[name] ??= wave(ac, name))

  E.gain = (value = 1, dest) => {
    const g = ac.createGain()
    g.gain.value = value
    if (dest) g.connect(dest)
    return g
  }
  E.filter = (type, frequency, Q = 0.7, dest) => {
    const f = ac.createBiquadFilter()
    f.type = type
    f.frequency.value = frequency
    f.Q.value = Q
    if (dest) f.connect(dest)
    return f
  }
  E.osc = (type, frequency, { detune = 0 } = {}) => {
    const o = ac.createOscillator()
    if (type in { organ: 1, reed: 1, pulse: 1, jawari: 1, voice: 1 }) o.setPeriodicWave(E.wave(type))
    else o.type = type
    o.frequency.value = frequency
    o.detune.value = detune + (frequency > 20 ? E.cents : 0)
    return o
  }
  E.pan = (value, dest) => {
    const p = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain()
    if (p.pan) p.pan.value = Math.max(-1, Math.min(1, value))
    if (dest) p.connect(dest)
    return p
  }
  E.noiseSource = (kind = 'white', { loop = true, offset = 0 } = {}) => {
    const s = ac.createBufferSource()
    s.buffer = E.noise(kind)
    s.loop = loop
    s._offset = offset
    return s
  }
  // Route a node into the hall at `amount`.
  E.toHall = (from, amount) => {
    if (amount <= 0) return null
    const g = E.gain(amount, send)
    from.connect(g)
    return g
  }
  // A slow LFO driving `param` by ±depth around its current value.
  E.lfo = (rate, depth, param, type = 'sine') => {
    const o = E.osc(type, rate)
    const g = E.gain(depth)
    o.connect(g).connect(param)
    return o
  }

  // A bag of sources that start now and stop together.
  E.bag = () => {
    const live = new Set()
    return {
      add(src, when = ac.currentTime) {
        live.add(src)
        src.addEventListener?.('ended', () => live.delete(src))
        try { src.start(when, src._offset || 0) } catch {}
        return src
      },
      stop(when = ac.currentTime) {
        for (const s of live) { try { s.stop(when) } catch {} }
      },
    }
  }

  // Fades of the master.
  // From silence the rise is eased (quick at first, gentle at the top), so the first bell is heard
  // while the whole temple still takes its full `seconds` to arrive.
  E.fadeTo = (level, seconds) => {
    const g = master.gain
    const t = ac.currentTime
    const from = g.value
    const s = Math.max(0.02, seconds)
    g.cancelScheduledValues(t)
    g.setValueAtTime(from, t)
    if (from < 0.001 && level > 0) {
      for (const [x, y] of [[0.15, 0.3], [0.35, 0.58], [0.6, 0.82], [1, 1]]) g.linearRampToValueAtTime(level * y, t + s * x)
    } else {
      g.linearRampToValueAtTime(level, t + s)
    }
    return new Promise((r) => setTimeout(r, s * 1000 + 40))
  }

  // The veil: close the temple's tone to `freq` between `from` and `until` (context time), then open
  // it again. Veils may overlap (an Eclipse during a Transmission): the darkest one wins, and the whole
  // timeline is rebuilt on the audio clock each time a veil is drawn.
  const veils = []
  E.veil = (freq, from, until, { attack = 0.6, release = 2.2 } = {}) => {
    const now = ac.currentTime
    veils.push({ freq, from, until, attack, release })
    for (let i = veils.length - 1; i >= 0; i--) if (veils[i].until < now) veils.splice(i, 1)
    const p = tone.frequency
    p.cancelScheduledValues(now)
    p.setValueAtTime(p.value, now)
    const times = [...new Set(veils.flatMap((v) => [Math.max(now, v.from), Math.max(now, v.until)]))].sort((a, b) => a - b)
    for (const t of times) {
      const active = veils.filter((v) => v.from <= t + 1e-4 && v.until > t + 1e-4)
      const closing = active.length > 0
      const target = closing ? Math.min(...active.map((v) => v.freq)) : 19000
      const tc = (closing ? Math.min(...active.map((v) => v.attack)) : Math.max(...veils.map((v) => v.release))) / 3
      p.setTargetAtTime(target, t, tc)
    }
  }

  // Schedule the Transmission at `when`; never two at once. Returns {start, letters, end}.
  E.transmit = (when = ac.currentTime + 0.5) => {
    if (E.txUntil > when) return E.lastTx
    const info = scheduleTransmission(ac, tx, when)
    E.txUntil = info.end
    E.lastTx = info
    // The temple falls quiet to listen: everything below the picture, nothing inside it.
    E.veil(1500, when - 0.4, info.end + 0.2, { attack: 0.5, release: 2.5 })
    drones.gain.setTargetAtTime(0.55, Math.max(ac.currentTime, when - 0.4), 0.2)
    drones.gain.setTargetAtTime(1, info.end + 0.2, 0.8)
    return info
  }

  // The clock that feeds the drones: every 100 ms, schedule what falls in the next 400 ms.
  let timer = 0
  E.start = () => {
    if (timer || typeof setInterval !== 'function') return
    timer = setInterval(() => {
      if (ac.state !== 'running') return
      const now = ac.currentTime
      for (const t of E.tickers) {
        try { t(now, now + 0.4) } catch (e) { console.warn('[audio] ticker', e) }
      }
    }, 100)
  }
  E.stop = () => { clearInterval(timer); timer = 0 }

  return E
}
