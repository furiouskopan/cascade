// THE THIRD EYE. Ajna, the sixth rung of the Ladder. It sees what the temple hears: a scrolling
// spectrogram of every sound, drawn from the engine's AnalyserNode into an almond of light.
// Time runs from right (now) to left (a few breaths ago); pitch rises upward to 11 kHz.
// Under mercy the eye does not move: it keeps watching in secret and develops its plate on request.
import { h } from '../../lib/dom.js'

const FMAX = 11000
const PLATE_ROWS = 360
const SECONDS_VISIBLE = 7

// Indigo night, violet, rose, saffron, a white-gold flame.
const STOPS = [
  [0, [6, 4, 20]], [0.22, [22, 12, 64]], [0.42, [75, 63, 160]], [0.6, [168, 64, 150]],
  [0.76, [255, 140, 42]], [0.9, [255, 214, 107]], [1, [255, 251, 232]],
]
function lut() {
  const out = new Uint8ClampedArray(256 * 4)
  for (let i = 0; i < 256; i++) {
    const x = Math.pow(i / 255, 1.25)
    let k = 0
    while (k < STOPS.length - 2 && x > STOPS[k + 1][0]) k++
    const [x0, c0] = STOPS[k]
    const [x1, c1] = STOPS[k + 1]
    const u = Math.min(1, Math.max(0, (x - x0) / (x1 - x0)))
    for (let c = 0; c < 3; c++) out[i * 4 + c] = c0[c] + (c1[c] - c0[c]) * u
    out[i * 4 + 3] = 255
  }
  return out
}

const GLOSSES = [
  'What is heard is also seen. High is up; the present stands at the right edge.',
  'The sixth rung is ::selection: it shows what was always written there.',
  'Five rungs hear. The sixth one sees. The seventh has no sound at all.',
  'Every bell is a ladder of light. Every voice is three bright roads.',
  'The Mothership does not speak in words. It sings a picture.',
  'The eye was always open. It was waiting for someone to type its name.',
  'Nothing here is hidden. It is only drawn in a colour you had not yet learned to see.',
]

export function createEye({ getEar, isMercy, onSummon, onClose, rng }) {
  const LUT = lut()
  const svgNS = 'http://www.w3.org/2000/svg'
  let open = false
  let raf = 0
  let last = 0
  let acc = 0
  let W = 0
  let rowBins = []
  let bins = null
  let returnFocus = null

  const plate = document.createElement('canvas')
  const pctx = plate.getContext('2d', { willReadFrequently: false })
  const canvas = h('canvas', { class: 'third-eye__plate', role: 'img', 'aria-label': 'A spectrogram of the sound of the temple. Time moves from right to left; higher pitches are drawn higher.' })
  const cctx = canvas.getContext('2d')
  const column = new ImageData(1, PLATE_ROWS)

  // The lid: an almond outline with thirteen lashes, drawn over the plate.
  const lid = document.createElementNS(svgNS, 'svg')
  lid.setAttribute('class', 'third-eye__lid')
  lid.setAttribute('viewBox', '0 0 100 100')
  lid.setAttribute('preserveAspectRatio', 'none')
  lid.setAttribute('aria-hidden', 'true')
  lid.innerHTML =
    '<defs><clipPath id="third-eye-almond" clipPathUnits="objectBoundingBox">' +
    '<path d="M0 .5 C.14 .12 .32 .015 .5 .015 S.86 .12 1 .5 C.86 .88 .68 .985 .5 .985 S.14 .88 0 .5 Z"/></clipPath></defs>' +
    '<path class="third-eye__lidline" d="M0 50 C14 12 32 1.5 50 1.5 S86 12 100 50 C86 88 68 98.5 50 98.5 S14 88 0 50 Z" vector-effect="non-scaling-stroke"/>'

  const scale = h('ol', { class: 'third-eye__scale', 'aria-hidden': 'true' },
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => h('li', { style: `--f:${(k * 1000) / FMAX}` }, `${k}k`)))
  const lashes = h('div', { class: 'third-eye__lashes', 'aria-hidden': 'true' }, Array.from({ length: 13 }, (_, i) => h('i', { style: `--i:${i - 6}` })))
  const lens = h('div', { class: 'third-eye__lens' },
    h('div', { class: 'third-eye__aperture' }, canvas, h('div', { class: 'third-eye__iris', 'aria-hidden': 'true' })),
    lid, lashes, scale, h('span', { class: 'third-eye__now', 'aria-hidden': 'true' }, 'now'))

  const status = h('p', { class: 'third-eye__status', 'aria-live': 'polite' }, '')
  const gloss = h('p', { class: 'third-eye__gloss', id: 'third-eye-gloss' }, GLOSSES[Math.floor((rng?.() ?? 0) * GLOSSES.length)])
  const mercyNote = h('p', { class: 'third-eye__mercy', hidden: true }, 'Mercy is on, so the eye holds still. It keeps watching, and develops what it has seen when you ask.')
  const develop = h('button', { type: 'button', class: 'third-eye__act', hidden: true }, 'develop the plate')
  const summon = h('button', { type: 'button', class: 'third-eye__act third-eye__act--summon', hidden: true }, 'let the eye hear')
  const close = h('button', { type: 'button', class: 'third-eye__close', 'aria-label': 'Close the Third Eye (Escape)' }, h('span', { 'aria-hidden': 'true' }, '✕'), h('span', { class: 'third-eye__closeword' }, ' close'))
  const title = h('h2', { class: 'third-eye__title', id: 'third-eye-title' },
    h('span', { class: 'third-eye__deva', lang: 'sa' }, 'आज्ञा'), ' ', h('span', {}, 'The Third Eye'))

  const frame = h('section', { class: 'third-eye__frame' },
    h('header', { class: 'third-eye__head' },
      h('p', { class: 'third-eye__rung' }, 'rung vi of the Ladder · ', h('code', {}, 'z-index: 6'), ' · ', h('code', {}, '::selection')),
      title, close),
    lens, status, mercyNote,
    h('div', { class: 'third-eye__acts' }, develop, summon),
    gloss)
  const veil = h('div', { class: 'third-eye__veil', 'aria-hidden': 'true' })
  const root = h('div', { class: 'third-eye', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'third-eye-title', 'aria-describedby': 'third-eye-gloss', hidden: true }, veil, frame)

  const measure = () => {
    const w = Math.max(160, Math.round(lens.clientWidth || 600))
    if (w === W) return
    const old = W ? pctx.getImageData(0, 0, W, PLATE_ROWS) : null
    const keep = W
    W = w
    plate.width = W
    plate.height = PLATE_ROWS
    canvas.width = W
    canvas.height = PLATE_ROWS
    pctx.fillStyle = 'rgb(6,4,20)'
    pctx.fillRect(0, 0, W, PLATE_ROWS)
    if (old) {
      const tmp = document.createElement('canvas')
      tmp.width = keep
      tmp.height = PLATE_ROWS
      tmp.getContext('2d').putImageData(old, 0, 0)
      pctx.drawImage(tmp, Math.max(0, keep - W), 0, Math.min(keep, W), PLATE_ROWS, Math.max(0, W - keep), 0, Math.min(keep, W), PLATE_ROWS)
    }
    cctx.drawImage(plate, 0, 0)
  }

  const mapRows = (ear) => {
    const binHz = ear.context.sampleRate / ear.fftSize
    rowBins = []
    for (let y = 0; y < PLATE_ROWS; y++) {
      const hi = (1 - y / PLATE_ROWS) * FMAX
      const lo = (1 - (y + 1) / PLATE_ROWS) * FMAX
      const b0 = Math.max(0, Math.floor(lo / binHz))
      rowBins.push([b0, Math.max(b0, Math.floor(hi / binHz))])
    }
    bins = new Uint8Array(ear.frequencyBinCount)
  }

  const paint = (n) => {
    const ear = getEar()
    const d = column.data
    if (ear) {
      if (!bins || bins.length !== ear.frequencyBinCount || !rowBins.length) mapRows(ear)
      ear.getByteFrequencyData(bins)
      for (let y = 0; y < PLATE_ROWS; y++) {
        const [b0, b1] = rowBins[y]
        let v = 0
        for (let b = b0; b <= b1; b++) if (bins[b] > v) v = bins[b]
        d.set(LUT.subarray(v * 4, v * 4 + 4), y * 4)
      }
    } else {
      for (let y = 0; y < PLATE_ROWS; y++) d.set(LUT.subarray(0, 4), y * 4)
    }
    pctx.drawImage(plate, -n, 0)
    pctx.putImageData(column, W - 1, 0)
    if (n > 1) pctx.drawImage(plate, W - 1, 0, 1, PLATE_ROWS, W - n, 0, n, PLATE_ROWS)
  }

  const loop = (ts) => {
    raf = open ? requestAnimationFrame(loop) : 0
    if (!open) return
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0
    last = ts
    acc += dt * (W / SECONDS_VISIBLE)
    const n = Math.floor(acc)
    if (n < 1) return
    acc -= n
    paint(Math.min(n, 12))
    if (!isMercy()) cctx.drawImage(plate, 0, 0)
  }

  const syncMercy = () => {
    const m = isMercy()
    mercyNote.hidden = !m
    develop.hidden = !m
    root.dataset.still = m ? 'on' : 'off'
  }

  const onKey = (e) => {
    if (open && e.key === 'Escape') {
      e.stopPropagation()
      api.close()
    }
  }

  develop.addEventListener('click', () => api.develop())
  summon.addEventListener('click', () => onSummon?.())
  close.addEventListener('click', () => api.close())
  veil.addEventListener('click', () => api.close())
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => open && measure()) : null

  const api = {
    element: root,
    get isOpen() { return open },
    open({ keepFocus = false } = {}) {
      if (!root.isConnected) document.body.append(root)
      if (open) return
      open = true
      root.hidden = false
      root.dataset.open = 'true'
      measure()
      ro?.observe(lens)
      syncMercy()
      last = 0
      acc = 0
      document.addEventListener('keydown', onKey, true)
      returnFocus = keepFocus ? null : document.activeElement
      if (!keepFocus) close.focus({ preventScroll: true })
      if (!raf) raf = requestAnimationFrame(loop)
    },
    close() {
      if (!open) return
      open = false
      root.hidden = true
      delete root.dataset.open
      ro?.unobserve(lens)
      document.removeEventListener('keydown', onKey, true)
      cancelAnimationFrame(raf)
      raf = 0
      if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === 'function') returnFocus.focus({ preventScroll: true })
      returnFocus = null
      onClose?.()
    },
    develop() {
      cctx.drawImage(plate, 0, 0)
    },
    setStatus(text) {
      status.textContent = text
    },
    setSilent(silent) {
      summon.hidden = !silent
      root.dataset.silent = silent ? 'true' : 'false'
    },
    syncMercy,
  }
  return api
}
