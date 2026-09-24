// THE AUDIO LAYER. Summoned sound (docs/CANON.md §10, §6 word 4).
// Silent until the visitor acts. Then: a drone per face (crossfaded on schisms), bells for prayers,
// a chime for secrets, a swell for the Eclipse, chant and whisper for anyone who asks, the
// Transmission from the Mothership, and the Third Eye that lets you see what you hear.
//
//   ctx.audio = { summoned, summon(), hush(), bell(opts), chant(text, opts), whisper(text, opts),
//                 drone(face), transmit(), openEye(), closeEye() }
//
// Typed words (anywhere outside a text field unless noted): ajna (anywhere) opens the Third Eye;
// amen sings an Amen; om or aum sings an Om; hush hushes; the chakra seeds lam vam ram yam ham are
// sung at their rung of the Ladder; and one more word, kept here only as its seal, rings a
// descending peal for whoever has already found it.
// While the Third Eye is open, each thing it sees is named beneath it (hear()).
// Emits: audio:summoned {face}, audio:hushed {}, audio:transmission {duration, letters}.
import { h } from '../lib/dom.js'
import { hash } from '../kernel/rng.js'
import { createEngine, MASTER_LEVEL } from './audio/engine.js'
import { DRONES, TONIC } from './audio/drones.js'
import { bell as ringBell, chime, peal, chant as sing, whisper as breathe, swell, swoop, jingle, choirSwell, inversion, thump } from './audio/voices.js'
import { createEye } from './audio/eye.js'

const SA = 136.1
// Words the layer answers but does not write down: length -> seal (hash of 'audio:peal:' + word).
const SEALED = { 7: 'dmg9xw' }
const sealOf = (w) => hash(`audio:peal:${w}`)().toString(36)

// What the Third Eye says it has seen. A spectrogram is easier to read once someone names the shapes.
export const SEEN_BELL = {
  church: 'a church bell: hum, prime, the minor tierce that makes a bell a bell, the quint and the nominal, five rungs of light dying at five speeds',
  tubular: 'a tubular bell: its rungs are the modes of a free bar, and the note you hear is one the tube does not contain',
  hand: 'a handbell: nearly harmonic, bright, and gone in a breath',
  bowl: 'a singing bowl: every rung trembles, because it beats against its twin a hair away',
  glass: 'glass: four high rungs, brief as something found',
  gong: 'a gong: the upper rungs arrive late and swell, as if the metal were remembering',
  gm: 'General MIDI program 15, Tubular Bells, sixteen cents sharp, as the sound card intended',
}
const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii']

// The hush control speaks each face's language.
const HUSH = {
  sanctum: { glyph: '✠', on: 'silentium', off: 'sonet', hint: ['Silentium: hush the organ and the bells', 'Sonet: let the organ sound again'] },
  possession: { glyph: '◖', on: 'mute', off: 'unmute', hint: ['Mute (it will not help)', 'Unmute (you asked for this)'] },
  recruitment: { glyph: '♫', on: 'STOP MIDI', off: 'PLAY HYMN', hint: ['STOP MIDI: stop our hymn', 'PLAY HYMN: play our hymn!!'] },
  ashram: { glyph: 'ॐ', on: 'mauna', off: 'nāda', hint: ['Mauna: the vow of silence', 'Nāda: let the sound return'] },
  departure: { glyph: '⌁', on: 'RX OFF', off: 'TUNE IN', hint: ['RX OFF: switch the receiver off', 'TUNE IN: tune in to the Mothership'] },
  babel: { glyph: '𝄐', on: 'hush', off: 'listen', hint: ['Hush the choir', 'Listen to this chapter sing'] },
}
const FACE_BELL = { sanctum: 'tubular', possession: 'church', recruitment: 'gm', ashram: 'bowl', departure: 'glass', babel: 'hand' }
const BIJA_RUNG = { lam: 0, vam: 1, ram: 2, yam: 3, ham: 4 }
const RUNG_RATIO = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 2]
const OWN_SECRETS = new Set(['third-eye', 'amen', 'om'])

export async function init(ctx) {
  const bus = ctx.bus
  const memory = ctx.memory
  const debug = ctx.params?.get('debug') === 'audio'
  const state = {
    engine: null,
    on: false,
    waiting: false,
    drone: null,
    droneFace: null,
    override: null,
    gen: 0,
    lastBellAt: 0,
    ackTimer: 0,
    pendingTx: false,
    lastPrayedAt: -Infinity,
    // Context time at which a fresh summon can first be heard (the master is still rising before it).
    openAt: 0,
  }
  let eye = null

  const faceName = () => (HUSH[ctx.face] ? ctx.face : 'sanctum')
  const droneFace = () => state.override ?? (DRONES[ctx.face] ? ctx.face : 'sanctum')
  const level = () => MASTER_LEVEL * (ctx.mercy?.on ? 0.85 : 1)
  const E = () => state.engine
  // A voice asked for in the same breath as the summon waits (all of it together, keeping its own
  // spacing) until the temple can be heard, instead of being swallowed by the rising master.
  const lag = () => Math.max(0, state.openAt - (state.engine?.now() ?? 0))
  // Something was voiced by whoever asked: the layer's own greeting stands aside for it.
  const voiced = () => {
    state.lastBellAt = performance.now()
    clearTimeout(state.ackTimer)
  }
  // Numbers from other layers are clamped before they reach an AudioParam (a NaN there throws).
  const num = (x, fallback, lo, hi) => {
    const n = x == null || x === '' ? NaN : Number(x)
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback
  }
  const ratios = (a) => (Array.isArray(a) && a.length && a.every((x) => Number.isFinite(x) && x > 0) ? a.slice(0, 6) : undefined)
  const tonic = () => state.drone?.tonic ?? TONIC[ctx.face] ?? 146.83
  // Name what the eye is seeing (only while it is open; it keeps quiet during a Transmission).
  const hear = (text) => { if (eye?.isOpen && state.on) eye.hear(text) }

  // ─────────────── the hush control, beside mercy ───────────────
  const meterBars = Array.from({ length: 5 }, (_, i) => h('i', { style: `--k:var(--m${i}, 0.12)` }))
  const glyph = h('span', { class: 'audio-hush__glyph', 'aria-hidden': 'true' })
  const word = h('span', { class: 'audio-hush__word' })
  const control = h('button', { type: 'button', class: 'audio-hush', 'data-state': 'silent' },
    glyph, h('span', { class: 'audio-hush__meter', 'aria-hidden': 'true' }, meterBars), word)
  // The announcer lives outside the control's wrapper, so it exists before its first sentence.
  const live = h('p', { class: 'visually-hidden audio-announcer', 'aria-live': 'polite' })
  const wrap = h('div', { class: 'audio-layer', id: 'audio-layer', hidden: true }, control)
  const mercyButton = document.getElementById('mercy')
  if (mercyButton) mercyButton.after(wrap, live)
  else document.body.append(wrap, live)

  const announce = (text) => { live.textContent = text }

  const paintControl = () => {
    const f = HUSH[faceName()]
    const on = state.on
    const st = on ? 'on' : state.waiting ? 'waiting' : state.engine ? 'hushed' : 'silent'
    control.dataset.state = st
    glyph.textContent = f.glyph
    word.textContent = on ? f.on : f.off
    control.title = on ? f.hint[0] : f.hint[1]
    const hint = on ? f.hint[0] : f.hint[1]
    const stop = /[.!?)]$/.test(hint) ? '' : '.'
    control.setAttribute('aria-label', `${hint}${stop} ${on ? 'Hush' : 'Summon'} the temple's sound.`)
    wrap.hidden = st === 'silent'
    if (!wrap.hidden) requestAnimationFrame(place)
  }

  // Sit to the right of mercy, whatever the face has done to it; never on top of it.
  function place() {
    const m = document.getElementById('mercy')
    if (!m || wrap.hidden) return
    const r = m.getBoundingClientRect()
    const me = control.getBoundingClientRect()
    if (!r.width) return
    let left = r.right + 6
    let top = r.top + (r.height - me.height) / 2
    if (left + me.width > innerWidth - 4) {
      left = Math.max(4, r.left)
      top = r.top - me.height - 6
    }
    wrap.style.left = `${Math.round(left)}px`
    wrap.style.top = `${Math.round(Math.max(4, top))}px`
    wrap.style.bottom = 'auto'
  }
  addEventListener('resize', place, { passive: true })
  if (mercyButton && typeof ResizeObserver === 'function') new ResizeObserver(place).observe(mercyButton)
  setInterval(() => { if (!document.hidden && !wrap.hidden) place() }, 3000)

  control.addEventListener('click', () => {
    if (state.on) hush()
    else summon()
  })

  // The meter: five bands of the ear, a dozen times a second. It rises at once and falls like an
  // old needle (about a second from full to rest), so a heartbeat reads as a sway, not a flicker.
  // Still under mercy.
  let meterRaf = 0
  let meterAt = 0
  let meterBins = null
  const needles = [0, 0, 0, 0, 0]
  const shown = ['', '', '', '', '']
  const BANDS = [[40, 200], [200, 600], [600, 1800], [1800, 5000], [5000, 12000]]
  function meter(ts) {
    const en = E()
    if (!state.on || !en || ctx.mercy?.on || document.hidden) {
      meterRaf = 0
      for (let i = 0; i < 5; i++) {
        control.style.removeProperty(`--m${i}`)
        needles[i] = 0
        shown[i] = ''
      }
      return
    }
    meterRaf = requestAnimationFrame(meter)
    if (ts - meterAt < 80) return
    meterAt = ts
    const ear = en.nodes.ear
    meterBins ??= new Uint8Array(ear.frequencyBinCount)
    ear.getByteFrequencyData(meterBins)
    const binHz = en.ac.sampleRate / ear.fftSize
    BANDS.forEach(([lo, hi], i) => {
      let v = 0
      for (let b = Math.floor(lo / binHz); b <= Math.min(meterBins.length - 1, hi / binHz); b++) v = Math.max(v, meterBins[b])
      const k = Math.pow(v / 255, 1.6)
      needles[i] = k > needles[i] ? k : needles[i] * 0.8 + k * 0.2
      const s = (0.12 + 0.88 * needles[i]).toFixed(2)
      // Only touch the style when the needle has actually moved.
      if (s !== shown[i]) control.style.setProperty(`--m${i}`, (shown[i] = s))
    })
  }
  const startMeter = () => { if (!meterRaf) meterRaf = requestAnimationFrame(meter) }

  // ─────────────── the engine ───────────────
  function ensureEngine() {
    if (state.engine) return state.engine
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    try {
      state.engine = createEngine(new AC({ latencyHint: 'balanced' }))
    } catch (e) {
      console.warn('[audio] the organ loft is locked', e)
      return null
    }
    if (debug) window.__cascadeAudioEngine = state.engine
    return state.engine
  }

  // A user gesture is required to begin (or to begin again after a hush).
  function mayStart() {
    if (state.engine?.ac.state === 'running' && state.on) return true
    const ua = navigator.userActivation
    return !ua || ua.isActive
  }

  function env(face) {
    return {
      rng: ctx.rng.fork(`audio/${face}/${++state.gen}`),
      sense: {
        restlessness: () => ctx.behavior?.restlessness ?? 0,
        mercy: () => Boolean(ctx.mercy?.on),
      },
      bus,
      path: location.pathname,
      planet: sky().planetaryHour?.planet,
      transmit: (at) => scheduleTx(at),
      note: hear,
    }
  }
  function sky() {
    try { return ctx.readSky?.() ?? ctx.sky ?? {} } catch { return ctx.sky ?? {} }
  }
  // The firmament leans on the sound: the moon fills the hall, the witching hour sags the drones.
  function attune(en) {
    const s = sky()
    const lit = Number(s.moon?.illumination) || 0
    en.nodes.hall && en.nodes.send.gain.setTargetAtTime(0.75 + 0.5 * lit, en.now(), 0.5)
    en.cents = s.has?.('witching') ? -33 : 0
  }

  function startDrone(face, fade = 3.5) {
    const en = E()
    const build = DRONES[face]
    if (!en || !build) return
    let d
    try {
      d = build(en, env(face))
    } catch (e) {
      console.warn(`[audio] the ${face} drone would not sound`, e)
      return
    }
    const now = en.now()
    d.out.connect(en.nodes.drones)
    d.out.gain.setValueAtTime(0, now)
    d.out.gain.linearRampToValueAtTime(1, now + fade)
    const old = state.drone
    if (old) {
      en.tickers.delete(old.tick)
      old.out.gain.cancelScheduledValues(now)
      old.out.gain.setValueAtTime(old.out.gain.value, now)
      old.out.gain.linearRampToValueAtTime(0, now + fade)
      try { old.stop(now + fade + 0.3) } catch {}
      setTimeout(() => { try { old.out.disconnect() } catch {} }, (fade + 4) * 1000)
    }
    state.drone = d
    state.droneFace = face
    en.tickers.add(d.tick)
  }

  const statusLine = () => (state.on && state.drone ? `Now hearing ${state.drone.label}.` : 'The eye sees only what is heard, and the temple is silent.')

  // The face's own voice, heard when sound is summoned (and again when its affordance is used).
  function signature(face, { small = false, delay = 0.06 } = {}) {
    const en = E()
    if (!en) return
    const t = en.now() + Math.max(delay, lag())
    state.lastBellAt = performance.now()
    switch (face) {
      case 'sanctum': {
        // In tune with the organ, which is in tune with the ruler of the hour.
        const T = state.droneFace === 'sanctum' ? tonic() : 146.83
        ringBell(en, { kind: 'tubular', freq: T * 4, gain: 0.13, when: t })
        if (!small) ringBell(en, { kind: 'church', freq: T * 2, gain: 0.09, when: t + 1.5, pan: -0.25 })
        hear(SEEN_BELL.tubular)
        break
      }
      case 'possession':
        breathe(en, { reverse: true, when: t, gain: 0.16, pan: 0.3 })
        thump(en, t + 0.95, 0.3)
        hear('a whisper drawn backwards, and then a heartbeat: two soft knocks at the floor of the eye')
        break
      case 'recruitment':
        jingle(en, { when: t })
        hear('the welcome jingle: four square notes climbing, one cheap bell, all of it a few cents sharp')
        break
      case 'ashram':
        ringBell(en, { kind: 'bowl', freq: SA * 2, gain: small ? 0.1 : 0.13, when: t })
        hear(SEEN_BELL.bowl)
        break
      case 'departure':
        swoop(en, { from: 280, to: 880, seconds: 2.2, gain: 0.055, when: t })
        hear('the theremin rises to greet you: one thin line of light, bending upward, trembling as a hand trembles')
        break
      case 'babel':
        choirSwell(en, { when: t, freq: 110, gain: 0.35 })
        hear('the choir breathes in on “ah”: four voices, and above each of them its three bright roads')
        break
      default:
        ringBell(en, { kind: 'hand', freq: 660, gain: 0.12, when: t })
        hear(SEEN_BELL.hand)
    }
  }

  // Answer a summon with the face's own voice, unless whoever summoned voiced something themselves in
  // the same breath (a bell, a chant, a whisper): then theirs is the first sound, and it stands alone.
  // Faces call summon() again on their bell or bowl; the answer then is a smaller one.
  function acknowledge(small) {
    clearTimeout(state.ackTimer)
    const asked = performance.now()
    state.ackTimer = setTimeout(() => {
      if (state.on && state.lastBellAt < asked) signature(ctx.face, { small })
    }, 70)
  }

  // soft: a summon the visitor did not ask for by name (opening the eye, a prayer): a visitor who
  // hushed the temple stays hushed. beckon: without a live gesture, let the hush control beckon.
  function summon({ soft = false, beckon = true } = {}) {
    if (soft && !state.on && memory.get('audio.muted', false)) return Promise.resolve(false)
    if (state.on) {
      acknowledge(true)
      return Promise.resolve(true)
    }
    if (!mayStart()) {
      // Asked without a gesture: offer the control and wait for the visitor's own hand.
      if (beckon) {
        state.waiting = true
        paintControl()
      }
      return Promise.resolve(false)
    }
    const en = ensureEngine()
    if (!en) {
      announce('This browser cannot hear the temple.')
      return Promise.resolve(false)
    }
    const resumed = en.ac.state === 'running' ? Promise.resolve() : en.ac.resume()
    state.on = true
    state.waiting = false
    memory.set('audio.muted', false)
    memory.update('audio.summons', (n) => (Number(n) || 0) + 1, 0)
    attune(en)
    if (!state.drone || state.droneFace !== droneFace()) startDrone(droneFace(), 3)
    en.start()
    en.fadeTo(level(), 1.8)
    state.openAt = en.now() + 0.35
    acknowledge(false)
    paintControl()
    startMeter()
    announce(`Sound summoned. ${statusLine()}`)
    eye?.setSilent(false)
    eye?.setStatus(statusLine())
    if (state.pendingTx) {
      state.pendingTx = false
      scheduleTx(en.now() + 1.6)
    }
    bus.emit('audio:summoned', { face: ctx.face })
    // Some browsers (no output device, a policy) never settle resume(): answer anyway after a breath.
    const settled = resumed.then(() => en.ac.state === 'running', () => false)
    const late = new Promise((r) => setTimeout(() => r(en.ac.state === 'running'), 2500))
    return Promise.race([settled, late])
  }

  function hush() {
    const en = E()
    if (!state.on) {
      if (state.waiting) { state.waiting = false; paintControl() }
      return false
    }
    state.on = false
    memory.set('audio.muted', true)
    clearTimeout(state.ackTimer)
    en.fadeTo(0, 1.2).then(() => {
      if (!state.on && en.ac.state === 'running') en.ac.suspend().catch(() => {})
    })
    paintControl()
    announce('Hushed. The temple keeps its silence.')
    eye?.setSilent(true)
    eye?.setStatus(statusLine())
    bus.emit('audio:hushed', {})
    return true
  }

  // ─────────────── the Transmission ───────────────
  const RECEIVING = 'A transmission is passing through the eye. Something is being written in light between two and nine thousand cycles.'
  let lastTxStart = -1
  function scheduleTx(when) {
    const en = E()
    if (!en) return null
    const info = en.transmit(when)
    if (!info || info.start === lastTxStart) return info
    lastTxStart = info.start
    const lead = Math.max(0, (info.start - en.now()) * 1000)
    const length = info.end - info.start
    setTimeout(() => {
      if (!state.on) return
      bus.emit('audio:transmission', { duration: length, letters: info.letters - info.start })
      eye?.receiving(true)
      eye?.setStatus(RECEIVING)
    }, lead)
    setTimeout(() => {
      eye?.receiving(false)
      eye?.setStatus(statusLine())
      if (ctx.mercy?.on) {
        eye?.develop()
        hear('the plate is developed: what the Mothership wrote stands still on it, for as long as you need')
      } else {
        hear('the Mothership has finished writing. What it wrote is still crossing the eye, right to left: read it before it leaves')
      }
    }, lead + length * 1000 + 700)
    return info
  }

  async function transmit() {
    if (!state.on) {
      state.pendingTx = true
      const ok = await summon()
      if (!ok && !state.on) return false
      if (!state.pendingTx) return true
      state.pendingTx = false
    }
    const info = scheduleTx(E().now() + 0.5)
    return Boolean(info)
  }

  // ─────────────── the Third Eye ───────────────
  function openEye({ keepFocus = false } = {}) {
    eye ??= createEye({
      getEar: () => (state.on && state.engine ? state.engine.nodes.ear : null),
      isMercy: () => Boolean(ctx.mercy?.on),
      onSummon: () => summon(),
      // Tab inside the eye still reaches mercy and the hush control.
      companions: () => [document.getElementById('mercy'), wrap.hidden ? null : control],
      rng: ctx.rng.fork('audio/eye'),
    })
    const wasOpen = eye.isOpen
    // Shut (or open) before it is shown, so a silent eye does not blink on its way in.
    eye.setSilent(!state.on)
    eye.open({ keepFocus })
    memory.markSecret('third-eye')
    if (!state.on) summon({ soft: true })
    eye.setSilent(!state.on)
    eye.setStatus(statusLine())
    // Opened in the middle of a Transmission: say so at once.
    const tx = state.on ? E()?.lastTx : null
    if (tx && E().now() >= tx.start && E().now() < tx.end) {
      eye.receiving(true)
      eye.setStatus(RECEIVING)
    }
    if (!wasOpen && state.on) {
      // The eye's own voice: a glass pair as the lid lifts (the face's greeting stands aside for it).
      const en = E()
      voiced()
      const t = en.now() + lag() + 0.05
      ringBell(en, { kind: 'glass', freq: 1661.2, gain: 0.05, when: t, pan: -0.3 })
      ringBell(en, { kind: 'glass', freq: 2489, gain: 0.035, when: t + 0.2, pan: 0.3 })
      hear('two glass rungs, high on the right, a fifth apart: the sound of this eye opening. Everything heard is drawn here')
    }
    if (!wasOpen) announce('The Third Eye is open. Press Escape to close it.')
    return true
  }
  const closeEye = () => { eye?.close(); return true }

  // ─────────────── public voices ───────────────
  function bell(opts = {}) {
    const en = E()
    if (!state.on || !en) return false
    voiced()
    const note = num(opts.note, null, 0, 127)
    const freq = num(opts.freq, null, 20, 12000) ?? (note != null ? 440 * Math.pow(2, (note - 69) / 12) : null)
    const kind = Object.hasOwn(SEEN_BELL, opts.kind ?? '') ? opts.kind : (FACE_BELL[ctx.face] ?? 'hand')
    const defaults = { tubular: state.droneFace === 'sanctum' ? tonic() * 4 : 587.33, church: 220, gm: 1046.5, bowl: SA * 2, glass: 1318.5, hand: 880, gong: 73.42 }
    ringBell(en, {
      kind,
      freq: freq ?? defaults[kind] ?? 660,
      gain: num(opts.gain, opts.soft ? 0.07 : 0.14, 0, 0.3),
      pan: num(opts.pan, 0, -1, 1),
      when: en.now() + lag() + num(opts.delay, 0.02, 0.02, 30),
      decay: num(opts.decay, 1, 0.1, 4),
    })
    hear(SEEN_BELL[kind])
    return true
  }

  function chant(text, opts = {}) {
    const en = E()
    if (!state.on || !en) return Promise.resolve(false)
    voiced()
    // A bare Om is sung low and slow, in octaves and a fifth, whoever asks for it.
    const bareOm = /^\s*(om|aum|ॐ)\s*$/i.test(String(text ?? ''))
    const chords = Array.isArray(opts.chords) ? opts.chords.slice(0, 24).map(ratios) : undefined
    const end = sing(en, String(text ?? '').slice(0, 160), {
      freq: num(opts.freq, bareOm ? (ctx.face === 'ashram' ? SA : tonic() * 0.75) : tonic(), 40, 1200),
      gain: num(opts.gain, 0.5, 0, 0.7),
      rate: num(opts.rate, bareOm ? 0.75 : 1, 0.25, 3),
      voices: ratios(opts.voices) ?? (bareOm ? [1, 0.5, 1.5] : undefined),
      chords: chords?.length && chords.every(Boolean) ? chords : undefined,
      when: en.now() + lag() + 0.06,
    })
    const words = String(text ?? '').replace(/\s+/g, ' ').trim()
    hear(opts.seen ?? (bareOm
      ? 'Om, sung low in octaves and a fifth: the roads of “o” close slowly into the hum of “m”'
      : `a chant on “${words.length > 42 ? `${words.slice(0, 40)}…` : words}”: every vowel is three bright roads, and the roads move as the mouth moves`))
    return new Promise((r) => setTimeout(() => r(true), Math.max(0, (end - en.now()) * 1000)))
  }

  function whisper(text, opts = {}) {
    const en = E()
    if (!state.on || !en) return false
    voiced()
    breathe(en, { text: text ? String(text).slice(0, 80) : undefined, reverse: Boolean(opts.reverse), gain: num(opts.gain, 0.2, 0, 0.3), pan: num(opts.pan, (Math.random() - 0.5) * 1.2, -1, 1), when: en.now() + lag() + 0.04 })
    hear(opts.reverse
      ? 'a whisper drawn backwards: each syllable grows out of nothing and is cut off'
      : 'a whisper: breath in the shape of a mouth, with no voice standing beneath it')
    return true
  }

  function drone(face) {
    if (face === undefined) return state.droneFace
    state.override = face && DRONES[face] ? face : null
    if (state.on && state.droneFace !== droneFace()) startDrone(droneFace())
    return droneFace()
  }

  const amen = () => {
    const f = tonic() / 2
    return chant('a men', { freq: f, chords: [[2, 5 / 3, 4 / 3, 2 / 3], [2, 3 / 2, 5 / 4, 1 / 2]], rate: 0.8, gain: 0.5, seen: 'Amen, in four parts: the plagal close, the fourth falling home. Watch the four voices step together' })
  }
  const om = () => {
    if (ctx.face === 'ashram') bell({ kind: 'bowl', gain: 0.08 })
    return chant('om', { gain: 0.55 })
  }

  const api = {
    get summoned() { return state.on },
    summon: () => summon(),
    hush,
    bell,
    chant,
    whisper,
    drone,
    transmit,
    openEye: (opts) => openEye(opts),
    closeEye,
    get eyeOpen() { return Boolean(eye?.isOpen) },
  }
  ctx.audio = api
  if (debug) window.__cascadeAudio = api

  // ─────────────── the bus ───────────────
  const react = (evt, data) => { if (state.on) { try { state.drone?.react?.(evt, data) } catch {} } }

  bus.on('face:leaving', () => { state.override = null })
  bus.on('face:ready', () => {
    paintControl()
    if (state.on) {
      attune(E())
      if (state.droneFace !== droneFace()) startDrone(droneFace(), 4)
      eye?.setStatus(statusLine())
    }
  })
  bus.on('behavior:still', (d) => react('still', d))
  bus.on('behavior:stir', () => react('stir'))
  bus.on('behavior:restless', (d) => react('restless', d))
  bus.on('behavior:calm', () => react('calm'))
  bus.on('behavior:return', (d) => react('return', d))

  bus.on('mercy:change', ({ on } = {}) => {
    eye?.syncMercy()
    if (state.on) {
      E().fadeTo(level(), 1.5)
      if (!on) startMeter()
    }
    requestAnimationFrame(place)
  })

  bus.on('server:eclipse', (d) => {
    const en = E()
    if (!state.on || !en) return
    const until = Number(d?.until) || Date.now() + 33000
    const seconds = Math.max(8, Math.min(40, (until - Date.now()) / 1000))
    en.veil(650, en.now() + 0.2, en.now() + seconds, { attack: 4, release: 6 })
    swell(en, { freq: 49, seconds: Math.min(24, seconds), gain: 0.2 })
    react('eclipse', d)
    hear('the Eclipse: the veil closes to six hundred and fifty cycles, and everything above it goes dark for a while')
  })

  bus.on('ritual:prayed', () => {
    state.lastPrayedAt = performance.now()
    // A prayer is a rite, and rites may summon (Canon §10): the first one wakes the temple's voice,
    // if the visitor's hand is still on it and they have not asked for silence before.
    if (!state.on) summon({ soft: true, beckon: false })
    const en = E()
    if (!state.on || !en) return
    voiced()
    const t = en.now() + lag() + 0.03
    const small = {
      sanctum: ['hand', 1174.66], possession: ['church', 220], recruitment: ['gm', 1046.5], ashram: ['hand', 1661.2],
      departure: ['glass', 1318.5], babel: ['hand', 880],
    }[ctx.face] ?? ['hand', 880]
    ringBell(en, { kind: small[0], freq: small[1], gain: 0.1, when: t })
    // The tingsha of the ashram are a pair, a hair apart.
    if (ctx.face === 'ashram') ringBell(en, { kind: 'hand', freq: 1668, gain: 0.08, when: t + 0.01 })
    hear(ctx.face === 'ashram' ? 'two tingsha a hair apart, so their rungs shimmer: your prayer was counted' : 'a small bell: your prayer was counted')
  })

  bus.on('server:prayer', () => {
    // Someone else, somewhere, prayed: a far bell. (Our own prayer may echo back from the server
    // before or after the local rite reports it, so wait a breath and look both ways.)
    if (!state.on) return
    const heard = performance.now()
    setTimeout(() => {
      const en = E()
      if (!state.on || !en || Math.abs(state.lastPrayedAt - heard) < 3000) return
      const r = ctx.rng.fork(`audio/far/${Date.now() % 997}`)
      ringBell(en, { kind: 'hand', freq: 880 * r.pick([1, 9 / 8, 5 / 4, 3 / 2, 5 / 3]), gain: 0.035, pan: r.float(-0.9, 0.9), hall: 1, when: en.now() + 0.05 })
      hear('a far bell, faint: someone else, somewhere, prayed')
    }, 900)
  })

  bus.on('server:ascended', () => {
    const en = E()
    if (!state.on || !en) return
    // An element has left its container: a slow glide upward and a glass chord at the top.
    const end = swoop(en, { from: 220, to: 1320, seconds: 4, gain: 0.045 })
    chime(en, { when: end - 0.4, root: 1318.5, gain: 0.06 })
    hear('one line climbing the whole height of the eye, and a glass chord at the top: a name was written in the Book of the Ascended')
  })

  bus.on('secret:found', (d) => {
    const en = E()
    if (!state.on || !en || OWN_SECRETS.has(d?.id)) return
    chime(en, { gain: 0.09 })
    hear('four glass rungs, rising: something was found')
  })

  bus.on('secrets:word', (d) => {
    const en = E()
    if (!state.on || !en) return
    // One bell for each word the Oracle has accepted, climbing.
    const n = Math.max(1, Math.min(5, (Number(d?.index) || 0) + 1))
    for (let i = 0; i < n; i++) ringBell(en, { kind: 'hand', freq: 523.25 * RUNG_RATIO[i], gain: 0.08, when: en.now() + 0.05 + i * 0.32, pan: (i - n / 2) * 0.2 })
    hear(`${['one bell', 'two bells', 'three bells', 'four bells', 'five bells'][n - 1]}, climbing: the Oracle has counted ${n === 1 ? 'a word' : `${n} words`}`)
  })

  bus.on('hell:inversion', (d) => {
    const en = E()
    if (!state.on || !en || d?.on === false) return
    inversion(en)
    hear('a breath drawn backwards, then one line falling: the Inversion')
  })

  // ─────────────── typed words ───────────────
  const stamps = []
  const isField = (el) => Boolean(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)))
  // A word counts when it starts fresh: after a non-letter, or after a pause.
  const fresh = (buffer, n) => {
    const before = buffer.charAt(buffer.length - n - 1)
    if (!before || !/[a-z]/.test(before)) return true
    const i = stamps.length - n
    return i > 0 && stamps[i] - stamps[i - 1] > 1200
  }
  const spoken = (buffer, w) => buffer.endsWith(w) && fresh(buffer, w.length)
  // A word known only by its seal: the last n letters, if they are all letters and freshly begun.
  const sealed = (buffer) => Object.entries(SEALED).some(([n, seal]) => {
    const tail = buffer.slice(-n)
    return tail.length === Number(n) && /^[a-z]+$/.test(tail) && fresh(buffer, Number(n)) && sealOf(tail) === seal
  })
  bus.on('behavior:typed', ({ buffer = '' } = {}) => {
    stamps.push(performance.now())
    if (stamps.length > 48) stamps.shift()
    const field = isField(document.activeElement)
    if (buffer.endsWith('ajna')) {
      openEye({ keepFocus: field })
      return
    }
    if (field) return
    if (spoken(buffer, 'amen')) {
      memory.markSecret('amen')
      if (state.on) amen()
    } else if (spoken(buffer, 'om') || spoken(buffer, 'aum')) {
      memory.markSecret('om')
      if (state.on) om()
    } else if (spoken(buffer, 'hush')) {
      if (state.on) hush()
    } else if (sealed(buffer)) {
      if (state.on) {
        peal(E(), { kind: ctx.face === 'recruitment' ? 'gm' : 'hand', root: 523.25, gain: 0.08 })
        hear('rounds on eight bells, descending, twice: sixteen rungs stepping down the eye like a stair')
      }
    } else {
      for (const [seed, rung] of Object.entries(BIJA_RUNG)) {
        if (spoken(buffer, seed)) {
          if (state.on) {
            chant(seed, {
              freq: SA * RUNG_RATIO[rung], voices: [1, 0.5], rate: 0.8, gain: 0.45,
              seen: `“${seed}”, the seed of rung ${ROMAN[rung]}, sung on its own step of the Ladder, ${['lowest of all', 'one step up', 'a third up', 'a fourth up', 'a fifth up'][rung]}`,
            })
          }
          break
        }
      }
    }
  })

  // ─────────────── the tab ───────────────
  document.addEventListener('visibilitychange', () => {
    const en = E()
    if (!en || !state.on) return
    if (document.hidden) {
      en.fadeTo(0, 0.4).then(() => {
        if (document.hidden && state.on && en.ac.state === 'running') en.ac.suspend().catch(() => {})
      })
    } else {
      en.ac.resume().then(() => {
        en.fadeTo(level(), 1.8)
        startMeter()
      }).catch(() => {})
    }
  })

  paintControl()
}
