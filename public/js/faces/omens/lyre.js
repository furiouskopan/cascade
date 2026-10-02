// THE BULL-HEADED LYRE, the face's summon (CANON §3.5). Gold head, lapis beard, a sound box inlaid with
// shell, and nine strings, as many as the old tuning texts count. Click it (or press Enter) and the temple's
// sound is summoned; drag across the strings to strum them. It is tuned in one of the seven old tunings,
// the one that belongs to the ruler of the hour.
import { h } from '../../lib/dom.js'
import { planetName } from '../../lib/scripture.js'
import { TUNINGS, CHALDEAN } from './lore.js'
import { s } from './life.js'

const STRINGS = 9
const BASE = 293.66 // the face's tonic (146.83 Hz), an octave up
const MAJOR = [2, 2, 1, 2, 2, 2, 1]

// The tuning of the hour: the diatonic steps, begun on a different degree for each ruler.
function tuning(planet) {
  const k = Math.max(0, CHALDEAN.indexOf(planet))
  const steps = MAJOR.slice(k).concat(MAJOR.slice(0, k))
  const out = [0]
  for (let i = 1; i < STRINGS; i++) out.push(out[i - 1] + steps[(i - 1) % 7])
  return out.map((st) => BASE * Math.pow(2, st / 12))
}

function drawLyre() {
  const svg = s('svg', { class: 'om-lyre-svg', viewBox: '0 0 300 236', 'aria-hidden': 'true', focusable: 'false' })
  const defs = s('defs', {},
    s('linearGradient', { id: 'om-gold', x1: '0', y1: '0', x2: '1', y2: '1' },
      s('stop', { offset: '0', 'stop-color': '#fbe7a6' }), s('stop', { offset: '0.35', 'stop-color': '#d9a845' }),
      s('stop', { offset: '0.7', 'stop-color': '#9c6b1c' }), s('stop', { offset: '1', 'stop-color': '#5d3d0c' })),
    s('linearGradient', { id: 'om-wood', x1: '0', y1: '0', x2: '0', y2: '1' },
      s('stop', { offset: '0', 'stop-color': '#6b4326' }), s('stop', { offset: '1', 'stop-color': '#2d190c' })),
    s('linearGradient', { id: 'om-lapis', x1: '0', y1: '0', x2: '1', y2: '1' },
      s('stop', { offset: '0', 'stop-color': '#4a68c4' }), s('stop', { offset: '1', 'stop-color': '#16255e' })),
    s('pattern', { id: 'om-inlay', width: '12', height: '8', patternUnits: 'userSpaceOnUse' },
      s('rect', { width: '12', height: '8', fill: '#efe4cc' }), s('rect', { width: '4', height: '8', fill: '#26408f' }),
      s('rect', { x: '8', width: '4', height: '8', fill: '#a6402e' })),
  )
  svg.append(defs)
  // its shadow on the table, cast to the lower right
  svg.append(s('path', { class: 'om-lyre-shadow', d: 'M96 220 L290 220 L298 230 L104 232 Z' }))
  // arms and yoke
  svg.append(s('path', { d: 'M92 166 L80 38 L90 37 L102 166 Z', fill: 'url(#om-wood)' }))
  svg.append(s('path', { d: 'M246 166 L256 52 L266 53 L256 166 Z', fill: 'url(#om-wood)' }))
  svg.append(s('path', { d: 'M86 52 L90 49 M84 70 L94 69 M88 100 L96 99 M252 78 L262 79 M250 110 L259 110', stroke: '#d9a845', 'stroke-width': '2.2', fill: 'none' }))
  svg.append(s('path', { d: 'M70 30 L278 44 L276 54 L68 40 Z', fill: 'url(#om-wood)' }))
  // the strings, with their pegs
  const strings = []
  for (let i = 0; i < STRINGS; i++) {
    const x0 = 118 + i * 13.4
    const x1 = x0 - 6 + i * 0.6
    const y1 = 32 + ((x1 - 70) / 208) * 14 + 6
    svg.append(s('circle', { cx: x1, cy: y1 - 6, r: '2.6', fill: '#d9a845' }))
    const g = s('g', { class: 'om-string', 'data-i': i, style: `--i:${i}` },
      s('line', { x1: x0, y1: '166', x2: x1, y2: y1, class: 'om-string-line' }))
    svg.append(g)
    strings.push({ g, x: (x0 + x1) / 2 })
  }
  // the sound box, inlaid with shell, lapis and red stone along its edges
  svg.append(s('rect', { x: '72', y: '160', width: '200', height: '58', rx: '3', fill: 'url(#om-wood)' }))
  svg.append(s('rect', { x: '72', y: '160', width: '200', height: '8', fill: 'url(#om-inlay)' }))
  svg.append(s('rect', { x: '72', y: '210', width: '200', height: '8', fill: 'url(#om-inlay)' }))
  svg.append(s('rect', { x: '112', y: '158', width: '124', height: '5', rx: '2', fill: '#2a1a0e' }))
  // The bull's head looks out at whoever plucks: gold, frontal, with horns sweeping out and up, eyes of
  // shell and lapis, and a long beard of lapis in rows of curls hanging down the front of the sound box.
  svg.append(s('path', { d: 'M36 166 L66 166 L66 216 Q51 224 36 216 Z', fill: 'url(#om-lapis)' }))
  const curls = []
  for (let row = 0; row < 6; row++) for (let k = 0; k < 4; k++) curls.push(`M${38 + k * 7} ${174 + row * 7.4} q2.6 -3.6 5.2 0`)
  svg.append(s('path', { d: curls.join(' '), stroke: '#0c1538', 'stroke-width': '1.2', fill: 'none' }))
  // horns, from the corners of the brow, out and up and a little in
  svg.append(s('path', { d: 'M34 110 C20 108 8 96 12 74 C16 90 26 98 40 102 Z', fill: 'url(#om-gold)' }))
  svg.append(s('path', { d: 'M68 110 C82 108 94 96 90 74 C86 90 76 98 62 102 Z', fill: 'url(#om-gold)' }))
  // ears, laid out sideways beneath the horns
  svg.append(s('path', { d: 'M33 116 C24 112 14 114 10 120 C16 126 26 126 34 123 Z', fill: '#b98a2e' }))
  svg.append(s('path', { d: 'M69 116 C78 112 88 114 92 120 C86 126 76 126 68 123 Z', fill: '#a87a26' }))
  // the face: a broad brow narrowing to the muzzle
  svg.append(s('path', { d: 'M32 106 C40 100 62 100 70 106 C74 118 70 136 66 150 C64 160 61 168 51 170 C41 168 38 160 36 150 C32 136 28 118 32 106 Z', fill: 'url(#om-gold)' }))
  // a forelock of lapis curls on the brow
  svg.append(s('path', { d: 'M40 106 q3.6 -6 7.2 0 q3.6 -6 7.2 0 q3.6 -6 7.2 0 q-3.6 7 -10.8 7 q-7.2 0 -10.8 -7 Z', fill: 'url(#om-lapis)' }))
  // brows and eyes
  svg.append(s('path', { d: 'M35 121 Q41 116 47 121 M55 121 Q61 116 67 121', stroke: '#6b4512', 'stroke-width': '1.5', fill: 'none' }))
  svg.append(s('ellipse', { cx: '41.5', cy: '125', rx: '5', ry: '3.4', fill: '#efe4cc' }))
  svg.append(s('ellipse', { cx: '60.5', cy: '125', rx: '5', ry: '3.4', fill: '#efe4cc' }))
  svg.append(s('circle', { cx: '42', cy: '125', r: '2.3', fill: '#16255e' }))
  svg.append(s('circle', { cx: '60', cy: '125', r: '2.3', fill: '#16255e' }))
  // the muzzle, with its two nostrils
  svg.append(s('ellipse', { cx: '51', cy: '160', rx: '10', ry: '8', fill: '#b98a2e' }))
  svg.append(s('ellipse', { cx: '46.5', cy: '161', rx: '2', ry: '2.6', fill: '#4a2e08' }))
  svg.append(s('ellipse', { cx: '55.5', cy: '161', rx: '2', ry: '2.6', fill: '#4a2e08' }))
  svg.append(s('path', { d: 'M51 132 L51 150', stroke: '#9c6b1c', 'stroke-width': '1.2', opacity: '0.6' }))
  return { svg, strings }
}

export function buildLyre(O) {
  const { ctx, life } = O
  const { svg, strings } = drawLyre()
  let planet = ctx.sky.planetaryHour.planet
  let freqs = tuning(planet)
  let next = 0
  let lastPluck = -1

  const tuned = h('span', { class: 'om-lyre-tuning' })
  const btn = h('button', { type: 'button', class: 'om-lyre-btn', 'aria-label': 'Pluck the bull-headed lyre. It wakes the sound of the temple.' }, svg)
  const el = h('section', { class: 'om-obj om-lyre', 'aria-labelledby': 'om-lyre-h' },
    h('h2', { id: 'om-lyre-h', class: 'om-obj-h' }, 'The bull-headed lyre'),
    btn,
    h('p', { class: 'om-label' }, 'Pluck it to give the room a voice; it is silent until you do. Drag across the strings to strum. ', tuned))

  function retune(p) {
    planet = p
    freqs = tuning(p)
    tuned.textContent = `Tuned in ${TUNINGS[p]}, for the hour of ${planetName(p)}.`
  }
  retune(planet)

  function shake(i) {
    const g = strings[i]?.g
    if (!g) return
    g.classList.remove('is-plucked')
    void g.getBoundingClientRect()
    g.classList.add('is-plucked')
    life.timeout(() => g.classList.remove('is-plucked'), 900)
  }
  function sound(i, { soft = false, delay = 0 } = {}) {
    ctx.audio?.bell?.({ kind: 'hand', freq: freqs[i], gain: soft ? 0.05 : 0.075, decay: 1.6, pan: (i / (STRINGS - 1) - 0.5) * 0.8, delay })
  }
  function pluck(i, opts) {
    shake(i)
    sound(i, opts)
    lastPluck = i
  }

  // Strumming: the pointer crossing a string plucks it.
  const stringAt = (clientX) => {
    const r = svg.getBoundingClientRect()
    const x = ((clientX - r.left) / r.width) * 300
    let best = -1, d = Infinity
    strings.forEach((st, i) => { const dd = Math.abs(st.x - x); if (dd < d) { d = dd; best = i } })
    return d < 9 ? best : -1
  }
  let strum = null
  life.on(btn, 'pointerdown', (e) => {
    strum = { id: e.pointerId, at: stringAt(e.clientX) }
    lastPluck = -1
    if (strum.at >= 0) shake(strum.at)
  })
  life.on(btn, 'pointermove', (e) => {
    if (!strum || e.pointerId !== strum.id) return
    const i = stringAt(e.clientX)
    if (i >= 0 && i !== strum.at) {
      strum.at = i
      pluck(i, { soft: true })
    }
  })
  const end = () => { strum = null }
  life.on(btn, 'pointerup', end)
  life.on(btn, 'pointercancel', end)
  life.on(btn, 'pointerleave', end)

  // Click and Enter summon the sound (CANON §3.5), and the string that was touched (or the next) sounds.
  life.on(btn, 'click', (e) => {
    ctx.audio?.summon?.()
    const touched = e.detail > 0 && lastPluck < 0 ? stringAt(e.clientX) : -1
    const i = touched >= 0 ? touched : lastPluck >= 0 ? lastPluck : next
    if (touched < 0 && lastPluck < 0) next = (next + 2) % STRINGS
    pluck(i)
    lastPluck = -1
  })

  return {
    el,
    retune,
    // A cadence, for a liver that has been read: five strings, rising.
    cadence() {
      ;[0, 2, 4, 6, 8].forEach((i, k) => {
        life.timeout(() => shake(i), k * 170)
        sound(i, { delay: k * 0.17 })
      })
    },
  }
}
