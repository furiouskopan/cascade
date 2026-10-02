// THE CYLINDER SEAL. Every Pilgrim has one, cut from the seed of the first day they came to the temple
// (memory firstVisit), so it is the same on every visit and nobody else's. It is carved in reverse on the
// stone and comes out the right way round in the clay. Roll it by dragging the clay or with the arrow
// keys: rolling is only background-position, on the stone and on the clay at once.
import { h } from '../../lib/dom.js'
import { makeRng } from '../../kernel/rng.js'
import { holyName } from '../../lib/scripture.js'
import { STONES } from './lore.js'
import { signs } from './clay.js'

const VW = 240, VH = 100

// The beasts and plants of the seal-cutter, in the linear style: each faces right, standing on y = 0.
const MOTIFS = {
  bull: `<ellipse cx="0" cy="-22" rx="17" ry="8.5"/><circle cx="-7" cy="-28" r="5.5"/>
    <path d="M12 -27 Q18 -33 25 -31 L31 -24 Q28 -19 22 -20 Q16 -20 12 -19 Z"/>
    <path d="M22 -31 Q20 -42 28 -45 M25 -31 Q31 -40 37 -37" fill="none" stroke-width="2.2"/>
    <path d="M10 -15 L12 0 M5 -15 L5 0 M-10 -15 L-12 0 M-15 -16 L-17 0 M-17 -25 Q-25 -19 -22 -6" fill="none" stroke-width="2.4"/>`,
  lion: `<ellipse cx="0" cy="-19" rx="16" ry="6.5"/><circle cx="17" cy="-25" r="8.5"/><circle cx="21" cy="-24" r="4.5"/>
    <path d="M24 -21 L29 -19" fill="none" stroke-width="1.6"/>
    <path d="M10 -14 L13 0 M5 -14 L4 0 M-9 -14 L-11 0 M-13 -15 L-16 0 M-15 -21 Q-27 -32 -19 -41" fill="none" stroke-width="2.4"/>
    <circle cx="-19" cy="-42" r="2.4"/>`,
  goat: `<ellipse cx="0" cy="-24" rx="13" ry="6" transform="rotate(-38 0 -24)"/><ellipse cx="11" cy="-41" rx="5" ry="3.4" transform="rotate(-20 11 -41)"/>
    <path d="M9 -44 Q2 -60 -10 -55" fill="none" stroke-width="2.4"/>
    <path d="M8 -33 L19 -40 M6 -30 L17 -31 M-7 -17 L-10 0 M-3 -16 L-1 0 M-10 -19 L-14 -24" fill="none" stroke-width="2.3"/>`,
  palm: `<path d="M0 0 L0 -44" fill="none" stroke-width="3.2"/>
    <path d="M-3 -8 L3 -11 M-3 -16 L3 -19 M-3 -24 L3 -27 M-3 -32 L3 -35" fill="none" stroke-width="1.3"/>
    <path d="M0 -44 Q-12 -51 -22 -40 M0 -44 Q12 -51 22 -40 M0 -44 Q-7 -57 -16 -58 M0 -44 Q7 -57 16 -58 M0 -44 L0 -60" fill="none" stroke-width="2.4"/>
    <circle cx="-6" cy="-39" r="2.2"/><circle cx="6" cy="-39" r="2.2"/>`,
  fish: `<path d="M-12 0 Q0 -8 12 0 Q0 8 -12 0 Z"/><path d="M11 0 L18 -5 L18 5 Z"/>`,
  bird: `<ellipse cx="0" cy="-6" rx="7" ry="4"/><circle cx="7" cy="-10" r="2.8"/><path d="M9 -10 L13 -9" fill="none" stroke-width="1.4"/>
    <path d="M-2 -8 Q-8 -18 -14 -16 M-6 -5 L-13 -3 M-1 -2 L-2 3 M2 -2 L3 3" fill="none" stroke-width="1.8"/>`,
  scorpion: `<ellipse cx="0" cy="-4" rx="7" ry="3"/><path d="M-6 -4 Q-14 -6 -14 -14 Q-13 -20 -8 -18" fill="none" stroke-width="2.2"/>
    <path d="M6 -5 L11 -9 L13 -6 M6 -3 L11 1 L13 -2 M-2 -2 L-4 2 M2 -2 L2 2" fill="none" stroke-width="1.6"/>`,
  hut: `<path d="M-15 0 L-15 -14 Q0 -32 15 -14 L15 0 Z"/><path d="M-8 -2 L-8 -18 M0 -2 L0 -22 M8 -2 L8 -18" fill="none" stroke-width="1.2" opacity="0.5"/>`,
  reeds: `<path d="M0 0 Q-2 -24 2 -48 M5 0 Q6 -20 10 -40 M-5 0 Q-7 -18 -10 -36" fill="none" stroke-width="1.6"/>
    <ellipse cx="2" cy="-50" rx="1.8" ry="4"/><ellipse cx="10" cy="-42" rx="1.6" ry="3.6"/>`,
}

// Compositions for the field (x from about 64 to 236, ground at y = 90). [motif, x, y, scale, mirror]
const SCENES = {
  herd: [['bull', 104, 90, 1.05], ['palm', 158, 90, 0.95], ['goat', 205, 90, 0.95, true], ['fish', 128, 30, 0.8], ['bird', 182, 24, 0.9]],
  beasts: [['lion', 100, 90, 1.05], ['bull', 196, 90, 1.05, true], ['scorpion', 150, 88, 0.9], ['fish', 150, 34, 0.75], ['bird', 222, 22, 0.75]],
  goats: [['goat', 112, 90, 1.05], ['palm', 152, 90, 1], ['goat', 192, 90, 1.05, true], ['bird', 152, 22, 0.85], ['fish', 226, 40, 0.65, true]],
  marsh: [['hut', 98, 90, 1.15], ['reeds', 128, 90, 1], ['fish', 160, 66, 0.9], ['bird', 182, 34, 1], ['reeds', 214, 90, 1.1], ['fish', 220, 26, 0.7, true]],
}

function art(scene, name, mode) {
  const C = mode === 'relief'
    ? { under: 'rgb(56 36 18 / 0.5)', over: 'rgb(255 244 222 / 0.55)', body: 'rgb(214 192 154)' }
    : { under: 'rgb(255 255 255 / 0.22)', over: null, body: 'rgb(12 8 10 / 0.62)' }
  const paint = (shape) => {
    let out = `<g transform="translate(1.1 1.3)" fill="${C.under}" stroke="${C.under}">${shape}</g>`
    if (C.over) out += `<g transform="translate(-0.7 -0.8)" fill="${C.over}" stroke="${C.over}">${shape}</g>`
    return out + `<g fill="${C.body}" stroke="${C.body}">${shape}</g>`
  }
  let field = ''
  for (const [m, x, y, k, flip] of scene) {
    field += paint(`<g transform="translate(${x} ${y}) scale(${flip ? -k : k} ${k})" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round">${MOTIFS[m]}</g>`)
  }
  // The caps of the seal, and the ruled panel of its inscription: three columns of signs, read from the top.
  const frame = paint('<path d="M0 6 L240 6 M0 94 L240 94" fill="none" stroke-width="1.6"/><path d="M8 12 L56 12 L56 88 L8 88 Z M24 12 L24 88 M40 12 L40 88" fill="none" stroke-width="1"/>')
  const words = name.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/).filter((w) => w.length > 2).slice(0, 3)
  let inscr = ''
  const opts = mode === 'relief' ? { ink: 'rgb(64 44 24 / 0.6)', lit: 'rgb(255 244 222 / 0.6)' } : { ink: 'rgb(12 8 10 / 0.7)', lit: 'rgb(255 255 255 / 0.2)' }
  words.forEach((w, col) => {
    ;[...w.slice(0, 6)].forEach((ch, row) => {
      inscr += signs(ch, 10.4 + col * 16, 14 + row * 12.2, 1.02, opts).svg
    })
  })
  const body = frame + inscr + field
  const inner = mode === 'stone' ? `<g transform="translate(${VW} 0) scale(-1 1)">${body}</g>` : body
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${inner}</svg>`
}

const url = (svg) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function buildSeal(O) {
  const { ctx, life, say } = O
  const first = Number(ctx.visit?.firstVisit ?? ctx.memory?.get?.('firstVisit', 0)) || 0
  const r = makeRng(`omens:seal:${first || ctx.seed}`)
  const stone = r.pick(STONES)
  const scene = SCENES[r.pick(Object.keys(SCENES))]
  const owner = holyName(r)
  const relief = url(art(scene, owner, 'relief'))
  const carved = url(art(scene, owner, 'stone'))
  const day = first ? new Date(first) : null
  const when = day ? `${day.getDate()} ${MONTHS[day.getMonth()]} ${day.getFullYear()}` : 'the first day you came'

  const cyl = h('div', { class: 'om-seal-cyl', 'data-stone': stone.id, 'aria-hidden': 'true' }, h('i', { class: 'om-seal-cap om-seal-cap--top' }), h('i', { class: 'om-seal-cap om-seal-cap--bottom' }))
  const strip = h('div', {
    class: 'om-seal-strip', role: 'slider', tabindex: '0',
    'aria-label': 'The impression of your cylinder seal. Roll it with the arrow keys, or drag the clay.',
    'aria-valuemin': '0', 'aria-valuemax': '359', 'aria-valuenow': '0', 'aria-valuetext': 'not yet rolled',
  })
  const bench = h('div', { class: 'om-seal-bench', 'data-hell': 'spare' }, strip, cyl)
  bench.style.setProperty('--seal-relief', relief)
  bench.style.setProperty('--seal-stone', carved)
  const el = h('section', { class: 'om-obj om-seal', 'aria-labelledby': 'om-seal-h' },
    h('h2', { id: 'om-seal-h', class: 'om-obj-h' }, 'Your cylinder seal'),
    bench,
    h('p', { class: 'om-label' }, 'The seal of ', h('b', {}, owner), `, cut in ${stone.name} from ${day ? 'the day you first came to the temple, ' : ''}`,
      h('time', day ? { datetime: day.toISOString().slice(0, 10) } : {}, when),
      '. It is yours and nobody else’s, on every visit. Roll it across the clay: drag it, or use the arrow keys.'))

  // ── rolling ────────────────────────────────────────────────────────────────────────────────
  let roll = 0
  let travelled = 0
  let turned = ctx.memory?.hasSecret?.('omens-seal')
  const turn = () => (strip.clientHeight || 100) * (VW / VH) // one turn of the cylinder, in pixels of clay
  function set(px) {
    const d = px - roll
    roll = px
    travelled += Math.abs(d)
    bench.style.setProperty('--roll', `${Math.round(roll * 10) / 10}px`)
    const deg = Math.round((((roll / turn()) * 360) % 360 + 360) % 360)
    strip.setAttribute('aria-valuenow', String(deg))
    strip.setAttribute('aria-valuetext', `rolled ${deg} degrees`)
    if (!turned && travelled >= turn()) {
      turned = true
      ctx.memory?.markSecret?.('omens-seal', { face: 'omens' })
      say?.('Your seal has rolled one whole turn. Its picture is complete in the clay.')
    }
  }
  let drag = null
  life.on(strip, 'pointerdown', (e) => {
    drag = { x: e.clientX, roll, id: e.pointerId }
    strip.setPointerCapture?.(e.pointerId)
    strip.classList.add('is-rolling')
  })
  life.on(strip, 'pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return
    set(drag.roll + (e.clientX - drag.x))
  })
  const end = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return
    drag = null
    strip.classList.remove('is-rolling')
  }
  life.on(strip, 'pointerup', end)
  life.on(strip, 'pointercancel', end)
  life.on(strip, 'keydown', (e) => {
    const step = turn() / 24
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(roll + step)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(roll - step)
    else if (e.key === 'PageUp') set(roll + step * 6)
    else if (e.key === 'PageDown') set(roll - step * 6)
    else if (e.key === 'Home') set(0)
    else if (e.key === 'End') set(roll + turn())
    else return
    e.preventDefault()
  })

  return { el, relief, owner, stone, roll: (px) => set(roll + px) }
}
