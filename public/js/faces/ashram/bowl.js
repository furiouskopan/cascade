// THE SINGING BOWL. Strike it (click, Enter, Space) to summon the temple's sound (Canon §3.5, §10).
// Secret: circle its rim three times while pressing, the way old bowls are sung, and the water shows
// the shape of the sound.
import { h } from '../../lib/dom.js'
import { mandala } from '../../lib/sigil.js'
import { s } from './life.js'

const VB = { y0: 62, w: 260, h: 128, cx: 130, cy: 97, rx: 88, ry: 18 }

function bowlSvg(rng) {
  const id = `ash-bowl-${rng.int(0, 1e9).toString(36)}`
  const svg = s('svg', { viewBox: `0 ${VB.y0} ${VB.w} ${VB.h}`, class: 'ash-bowl-svg', 'aria-hidden': 'true', focusable: 'false' })
  const defs = s('defs', {},
    s('linearGradient', { id: `${id}-bronze`, x1: 0, x2: 1, y1: 0, y2: 0 },
      s('stop', { offset: '0', 'stop-color': '#3b230b' }),
      s('stop', { offset: '0.22', 'stop-color': '#a8712c' }),
      s('stop', { offset: '0.38', 'stop-color': '#f0c77a' }),
      s('stop', { offset: '0.55', 'stop-color': '#b27a33' }),
      s('stop', { offset: '1', 'stop-color': '#2b1807' })),
    s('linearGradient', { id: `${id}-lip`, x1: 0, x2: 1, y1: 0, y2: 0 },
      s('stop', { offset: '0', 'stop-color': '#6b4518' }),
      s('stop', { offset: '0.35', 'stop-color': '#ffe0a0' }),
      s('stop', { offset: '0.7', 'stop-color': '#b98136' }),
      s('stop', { offset: '1', 'stop-color': '#4d300f' })),
    s('radialGradient', { id: `${id}-water`, cx: '0.5', cy: '0.35', r: '0.7' },
      s('stop', { offset: '0', 'stop-color': '#2f2a7a' }),
      s('stop', { offset: '0.6', 'stop-color': '#141046' }),
      s('stop', { offset: '1', 'stop-color': '#07061a' })),
    s('linearGradient', { id: `${id}-cushion`, x1: 0, x2: 0, y1: 0, y2: 1 },
      s('stop', { offset: '0', 'stop-color': '#e2474f' }),
      s('stop', { offset: '0.55', 'stop-color': '#9c1427' }),
      s('stop', { offset: '1', 'stop-color': '#4d0714' })),
    s('linearGradient', { id: `${id}-wood`, x1: 0, x2: 0, y1: 0, y2: 1 },
      s('stop', { offset: '0', 'stop-color': '#c98f55' }),
      s('stop', { offset: '1', 'stop-color': '#5a3316' })),
    s('clipPath', { id: `${id}-clip` }, s('ellipse', { cx: VB.cx, cy: VB.cy + 1, rx: 81, ry: 14.5 })),
    s('path', { id: `${id}-band`, d: 'M50 118 Q130 146 210 118' }),
  )
  svg.append(defs)
  svg.append(
    s('ellipse', { cx: 130, cy: 178, rx: 112, ry: 9, fill: '#000', opacity: 0.4 }),
    // the ring cushion, with its saffron piping and two tassels
    s('ellipse', { cx: 130, cy: 156, rx: 106, ry: 24, fill: `url(#${id}-cushion)` }),
    s('path', { d: 'M28 152 Q130 124 232 152', stroke: '#f5a524', 'stroke-width': 1.4, fill: 'none', opacity: 0.8 }),
    s('path', { d: 'M26 158 l-9 16 M26 158 l-3 18 M26 158 l3 17', stroke: '#f5a524', 'stroke-width': 1.2, fill: 'none' }),
    s('path', { d: 'M234 158 l9 16 M234 158 l3 18 M234 158 l-3 17', stroke: '#f5a524', 'stroke-width': 1.2, fill: 'none' }),
    // the bowl
    s('path', { d: 'M42 96 C44 150 92 168 130 168 C168 168 216 150 218 96 Z', fill: `url(#${id}-bronze)` }),
    s('path', { d: 'M52 110 Q130 136 208 110', stroke: '#2a1705', 'stroke-width': 0.8, fill: 'none', opacity: 0.7 }),
    s('path', { d: 'M54 127 Q130 155 206 127', stroke: '#2a1705', 'stroke-width': 0.8, fill: 'none', opacity: 0.7 }),
    s('text', { class: 'ash-bowl-band', 'font-size': 9.5, fill: '#2a1705', 'letter-spacing': 3.2 },
      s('textPath', { href: `#${id}-band`, startOffset: '50%', 'text-anchor': 'middle' }, 'ॐ लं वं रं यं हं ॐ')),
    s('path', { d: 'M78 104 Q84 146 118 160', stroke: '#fff4d8', 'stroke-width': 3, fill: 'none', opacity: 0.22, 'stroke-linecap': 'round' }),
    // the lip and the dark water within
    s('ellipse', { cx: VB.cx, cy: VB.cy, rx: VB.rx, ry: VB.ry, fill: `url(#${id}-lip)` }),
    s('ellipse', { cx: VB.cx, cy: VB.cy + 1, rx: 81, ry: 14.5, fill: `url(#${id}-water)` }),
  )
  const water = s('g', { 'clip-path': `url(#${id}-clip)` })
  const cym = s('g', { class: 'ash-cymatics', transform: `translate(${VB.cx} ${VB.cy + 1}) scale(0.78 0.15)` })
  cym.innerHTML = mandala(rng, { size: 200, stroke: 1.1, rings: 5 }).replace(/^<svg[^>]*>|<\/svg>$/g, '')
  water.append(cym)
  for (let i = 0; i < 3; i++) {
    water.append(s('ellipse', { class: 'ash-ripple', cx: VB.cx, cy: VB.cy + 1, rx: 20, ry: 3.6, fill: 'none', stroke: '#ffd48a', 'stroke-width': 0.9 }))
  }
  water.append(s('ellipse', { class: 'ash-glint', cx: 104, cy: 93, rx: 16, ry: 2.2, fill: '#fff', opacity: 0.13 }))
  svg.append(water)
  // the striker, resting
  svg.append(
    s('g', { transform: 'rotate(-13 196 170)' },
      s('rect', { x: 148, y: 165, width: 96, height: 9, rx: 4.5, fill: `url(#${id}-wood)` }),
      s('rect', { x: 148, y: 164.5, width: 22, height: 10, rx: 5, fill: '#3d1f10' }),
      s('path', { d: 'M156 165 v9 M162 165 v9', stroke: '#6b3a1e', 'stroke-width': 0.7 })),
  )
  return svg
}

export function buildBowl(A) {
  const { ctx, life } = A
  const rng = A.rng.fork('bowl')
  const svg = bowlSvg(rng)
  const status = h('p', { class: 'ash-bowl-status' }, 'Strike the bowl to give the temple a voice. It is silent until you do.')
  const button = h('button', {
    type: 'button',
    class: 'ash-bowl',
    'aria-label': 'Singing bowl. Strike it to summon the temple’s sound.',
  }, h('span', { class: 'ash-bowl-glow', 'aria-hidden': 'true' }), svg)
  const wrap = h('figure', { class: 'ash-bowl-wrap' },
    button,
    h('figcaption', {},
      h('span', { class: 'ash-kicker' }, 'the singing bowl · ', h('span', { lang: 'sa', class: 'ash-kicker-deva' }, 'कांस्य पात्र')),
      status,
      h('span', { class: 'ash-bowl-hint' }, 'Old bowls also sing when their rim is circled.')),
  )

  let ringTimer = 0
  function ring(ms = 7600) {
    button.classList.remove('is-ringing')
    void button.offsetWidth // restart the ripples
    button.classList.add('is-ringing')
    clearTimeout(ringTimer)
    ringTimer = setTimeout(() => button.classList.remove('is-ringing'), ms)
  }
  life.add(() => clearTimeout(ringTimer))

  function sync() {
    const a = ctx.audio
    if (!a) return
    status.textContent = a.summoned
      ? 'The temple has a voice now. Strike again to let the bowl answer; hush it whenever you like.'
      : 'The temple is hushed. Strike the bowl to wake its voice.'
  }

  function strike() {
    const a = ctx.audio
    try {
      if (a && !a.summoned) a.summon?.()
      else a?.bell?.({ kind: 'bowl', face: 'ashram' })
    } catch (e) { console.error('[ashram:bowl]', e) }
    ring()
    button.classList.add('is-woken') // on touch screens the rim can be circled only once the bowl is awake
    if (!a) status.textContent = 'The bowl rings, though you cannot hear it yet. Watch the water.'
    else sync()
    A.onStrike?.()
  }
  life.on(button, 'click', strike)
  life.bus(ctx.bus, 'audio:summoned', sync)
  life.bus(ctx.bus, 'audio:hushed', sync)

  // Singing the rim: pressing and circling. The rim is an ellipse, so the angle is taken in the
  // bowl's own proportions (a circle seen from the side).
  let rub = null
  let sung = false
  function rimAngle(e) {
    const r = svg.getBoundingClientRect()
    const nx = (e.clientX - (r.left + (VB.cx / VB.w) * r.width)) / ((VB.rx / VB.w) * r.width || 1)
    const ny = (e.clientY - (r.top + ((VB.cy - VB.y0) / VB.h) * r.height)) / ((VB.ry / VB.h) * r.height || 1)
    return { a: Math.atan2(ny, nx), d: Math.hypot(nx, ny) }
  }
  life.on(button, 'pointerdown', (e) => {
    const p = rimAngle(e)
    rub = { last: p.a, sum: 0 }
    try { button.setPointerCapture(e.pointerId) } catch {}
  })
  life.on(button, 'pointermove', (e) => {
    if (!rub) return
    const p = rimAngle(e)
    if (p.d < 0.35) { rub.last = p.a; return } // too near the centre: that is stirring, not singing
    let da = p.a - rub.last
    if (da > Math.PI) da -= 2 * Math.PI
    if (da < -Math.PI) da += 2 * Math.PI
    rub.last = p.a
    // A change of direction starts the song over.
    if (rub.sum && Math.sign(da) !== Math.sign(rub.sum) && Math.abs(da) > 0.05) rub.sum = 0
    rub.sum += da
    const circles = Math.abs(rub.sum) / (2 * Math.PI)
    button.style.setProperty('--song', Math.min(1, circles / 3).toFixed(3))
    if (circles >= 3 && !sung) sing()
  })
  const endRub = () => { rub = null; if (!sung) button.style.removeProperty('--song') }
  life.on(button, 'pointerup', endRub)
  life.on(button, 'pointercancel', endRub)

  function sing() {
    sung = true
    button.classList.add('is-singing')
    status.textContent = 'It sings. The water is showing you the shape of the sound.'
    try {
      if (ctx.audio?.summoned) ctx.audio.chant?.('om')
    } catch (e) { console.error('[ashram:bowl]', e) }
    ctx.memory?.markSecret?.('ashram-bowl-sings', { face: 'ashram' })
    A.onSing?.()
  }

  return { el: wrap, ring, button }
}
