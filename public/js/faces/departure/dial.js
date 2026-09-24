// THE RECEIVER. A seven-tube cosmic superheterodyne: a slide-rule dial (an ARIA slider: drag it,
// wheel it, or use the arrow keys), a bakelite knob, and a magic-eye tuning tube whose green fan
// closes as you find a station. TUNE IN glides the needle to the Mothership and summons sound.
import { h } from '../../lib/dom.js'
import { svgNode } from './util.js'
import { STATIONS, STATION_KC } from './lore.js'

const LOCK = 11
const MOTHER = STATIONS.find((s) => s.mothership)

function eyeSvg() {
  return svgNode(`<svg viewBox="-50 -50 100 100" class="dep-eye-svg" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="dep-eye-g" r="0.55">
        <stop offset="0" stop-color="#0d2a17"/>
        <stop offset="0.28" stop-color="#1f7a3f"/>
        <stop offset="0.7" stop-color="#7dffab"/>
        <stop offset="1" stop-color="#b8ffd0"/>
      </radialGradient>
    </defs>
    <circle r="48" fill="#0a0d0b" stroke="#3a3326" stroke-width="2"/>
    <circle r="41" class="dep-eye-glow" fill="url(#dep-eye-g)"/>
    <path class="dep-eye-shadow" fill="#04100a" d=""/>
    <circle r="12" fill="#101410" stroke="#27302a" stroke-width="1.5"/>
    <circle r="41" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>
  </svg>`)
}

function antennaSvg() {
  return svgNode(`<svg viewBox="0 0 120 120" class="dep-antenna-svg" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" stroke-linecap="round">
      <path d="M60 118 L60 34" stroke-width="3"/>
      <path d="M60 60 L34 92 M60 60 L86 92 M60 84 L44 104 M60 84 L76 104" stroke-width="1.6"/>
      <path d="M40 44 L80 44 M46 36 L74 36 M52 28 L68 28" stroke-width="2"/>
      <circle cx="60" cy="18" r="5" fill="currentColor" class="dep-antenna-tip"/>
    </g>
  </svg>`)
}

function kcAt(v) {
  const first = STATIONS[0].at
  if (v <= first) return Math.max(1, Math.round((STATION_KC[0] * v) / first))
  for (let i = 0; i < STATIONS.length - 1; i++) {
    const a = STATIONS[i], b = STATIONS[i + 1]
    if (v <= b.at) {
      const t = (v - a.at) / (b.at - a.at)
      return Math.round(Math.exp(Math.log(STATION_KC[i]) + (Math.log(STATION_KC[i + 1]) - Math.log(STATION_KC[i])) * t))
    }
  }
  return Infinity
}

export function receiver(ctx, life, rng, { onStation, onSummon } = {}) {
  const eye = eyeSvg()
  const shadow = eye.querySelector('.dep-eye-shadow')
  const needle = h('span', { class: 'dep-needle', 'aria-hidden': 'true' })
  const scale = h('div', { class: 'dep-scale', 'aria-hidden': 'true' },
    h('span', { class: 'dep-band' }, 'Cosmic band · kc'),
    ...STATIONS.map((s) => {
      const mark = h('span', { class: `dep-st${s.mothership ? ' dep-st--mother' : ''}` },
        h('b', {}, s.freq), h('i', {}, s.name))
      mark.style.setProperty('--at', `${s.at / 10}%`)
      return mark
    }),
  )
  const glass = h('div', {
    class: 'dep-glass', role: 'slider', tabindex: '0',
    'aria-label': 'Tuning dial', 'aria-valuemin': '0', 'aria-valuemax': '1000', 'aria-orientation': 'horizontal',
  }, scale, needle)
  const knob = h('span', { class: 'dep-knob', 'aria-hidden': 'true' }, h('span', { class: 'dep-knob-cap' }))
  const lamp = h('span', { class: 'dep-onair', 'aria-live': 'polite' }, 'Off air')
  // The readout follows the needle for the eye; a screen reader hears only when a station locks (the
  // slider's own valuetext carries the rest), so a drag across the band is not read out step by step.
  const readout = h('p', { class: 'dep-readout' })
  const heard = h('span', { class: 'visually-hidden', 'aria-live': 'polite' })
  const tuneIn = h('button', { type: 'button', class: 'dep-tunein' },
    h('span', { class: 'dep-tunein-knurl', 'aria-hidden': 'true' }), 'Tune in')
  const antenna = h('span', { class: 'dep-antenna' }, antennaSvg(),
    h('span', { class: 'dep-antenna-ring' }), h('span', { class: 'dep-antenna-ring' }), h('span', { class: 'dep-antenna-ring' }))

  const el = h('section', { class: 'dep-panel dep-radio', 'aria-labelledby': 'dep-radio-h' },
    antenna,
    h('header', { class: 'dep-plate' },
      h('h2', { id: 'dep-radio-h' }, 'The Receiver'),
      h('span', { class: 'dep-plate-no dep-can' }, 'Seven-tube cosmic superheterodyne'),
    ),
    h('div', { class: 'dep-radio-face' },
      h('div', { class: 'dep-eye' }, eye, h('span', { class: 'dep-eye-label dep-can' }, 'Magic eye')),
      h('div', { class: 'dep-grille', 'aria-hidden': 'true' }),
      knob,
    ),
    glass,
    h('div', { class: 'dep-radio-foot' }, tuneIn, lamp),
    readout,
    heard,
  )

  let tune = rng.pick([140, 250, 372, 505, 640, 790])
  let locked = null
  let dwell = null
  const lastSaid = new Map()

  function eyeAngle(dist) {
    const th = (6 + Math.min(1, dist / 70) * 64) * (Math.PI / 180)
    const R = 44
    const x = Math.sin(th) * R, y = -Math.cos(th) * R
    shadow.setAttribute('d', `M0 0 L${(-x).toFixed(2)} ${y.toFixed(2)} A${R} ${R} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`)
  }

  function describeTune(v, st) {
    if (st) return `${st.freq} kc · ${st.name}`
    if (v > MOTHER.at + LOCK) return '−2147483648 kc · overflow: past the Highest Heaven the Ladder wraps around'
    return `${kcAt(v).toLocaleString('en')} kc · between stations`
  }

  function set(v, { user = false } = {}) {
    tune = Math.max(0, Math.min(1000, Math.round(v)))
    glass.style.setProperty('--tune', `${tune / 10}%`)
    knob.style.setProperty('--turn', `${(tune * 0.72).toFixed(1)}deg`)
    let best = null, dist = Infinity
    for (const s of STATIONS) {
      const d = Math.abs(s.at - tune)
      if (d < dist) { dist = d; best = s }
    }
    const st = dist <= LOCK ? best : null
    eyeAngle(st ? dist * 0.25 : dist)
    el.classList.toggle('is-locked', Boolean(st))
    el.classList.toggle('is-mother', Boolean(st?.mothership))
    el.classList.toggle('is-overflow', tune > MOTHER.at + LOCK)
    const text = describeTune(tune, st)
    glass.setAttribute('aria-valuenow', String(tune))
    glass.setAttribute('aria-valuetext', text)
    if (st !== locked) {
      locked = st
      readout.textContent = st ? `Tuned: ${text}` : text
      heard.textContent = st ? `Tuned: ${text}` : ''
      dwell?.()
      dwell = null
      if (st) {
        // Sound may only begin inside a gesture, so the summons happens here, synchronously.
        if (user && st.mothership) onSummon?.('dial')
        dwell = life.timeout(() => {
          const t = lastSaid.get(st.name) ?? -Infinity
          if (performance.now() - t < 25000) return
          lastSaid.set(st.name, performance.now())
          onStation?.(st, user)
        }, 650)
      }
    } else if (!st) {
      readout.textContent = text
    }
  }

  // ---- pointer: drag the glass to place the needle; drag the knob to turn it -----------------
  let dragging = null
  const fromX = (e) => {
    const r = glass.getBoundingClientRect()
    return ((e.clientX - r.left) / Math.max(1, r.width)) * 1000
  }
  life.listen(glass, 'pointerdown', (e) => {
    if (e.button !== 0) return
    dragging = { kind: 'glass' }
    glass.setPointerCapture?.(e.pointerId)
    el.classList.add('is-dragging')
    set(fromX(e), { user: true })
  })
  life.listen(knob, 'pointerdown', (e) => {
    if (e.button !== 0) return
    dragging = { kind: 'knob', x: e.clientX, y: e.clientY, v: tune }
    knob.setPointerCapture?.(e.pointerId)
    el.classList.add('is-dragging')
    e.preventDefault()
  })
  const move = (e) => {
    if (!dragging) return
    if (dragging.kind === 'glass') set(fromX(e), { user: true })
    else set(dragging.v + (e.clientX - dragging.x) * 1.4 - (e.clientY - dragging.y) * 1.4, { user: true })
  }
  const up = () => { dragging = null; el.classList.remove('is-dragging') }
  for (const t of [glass, knob]) {
    life.listen(t, 'pointermove', move)
    life.listen(t, 'pointerup', up)
    life.listen(t, 'pointercancel', up)
    life.listen(t, 'lostpointercapture', up)
    life.listen(t, 'wheel', (e) => {
      e.preventDefault()
      el.classList.add('is-dragging')
      set(tune + Math.sign(e.deltaY || e.deltaX) * 7, { user: true })
      life.timeout(() => { if (!dragging) el.classList.remove('is-dragging') }, 120)
    }, { passive: false })
  }
  life.listen(glass, 'keydown', (e) => {
    const step = { ArrowRight: 4, ArrowUp: 4, ArrowLeft: -4, ArrowDown: -4, PageUp: 40, PageDown: -40 }[e.key]
    if (step) { e.preventDefault(); set(tune + step, { user: true }) }
    else if (e.key === 'Home') { e.preventDefault(); set(0, { user: true }) }
    else if (e.key === 'End') { e.preventDefault(); set(1000, { user: true }) }
  })

  life.listen(tuneIn, 'click', () => {
    onSummon?.('button')
    el.classList.remove('is-dragging')
    el.classList.add('is-gliding')
    set(MOTHER.at, { user: false })
    life.timeout(() => el.classList.remove('is-gliding'), 1800)
  })

  function syncAir() {
    const on = Boolean(ctx.audio?.summoned)
    lamp.textContent = on ? 'On air' : 'Off air'
    el.classList.toggle('is-on-air', on)
  }
  life.on(ctx.bus, 'audio:summoned', syncAir)
  life.on(ctx.bus, 'audio:hushed', syncAir)

  return {
    el,
    start() { set(tune); syncAir() },
    syncAir,
  }
}
