// THE RECRUITMENT OFFICE — clip art. Everything is procedural: canvas, CSS and SVG strings. No downloads.
import { h } from '../../lib/dom.js'

// Set CSS custom properties on an element (h()'s style object cannot set --vars).
export function vars(el, obj) {
  for (const [k, v] of Object.entries(obj)) el.style.setProperty(k, String(v))
  return el
}

// The tiled backgrounds of 1997. The Webmaster changes the wallpaper now and then; the Oracle picks it per visit.
export const TILES = { stars: 6, nebula: 3, planets: 2 }

// Draw something at its own place and at the eight places it wraps to, so the tile repeats without a seam.
function wrapped(size, x, y, draw) {
  for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) draw(x + dx, y + dy)
}

// A 1997 starfield tile: black, single-pixel stars, a few fat ones, two sparkles, and (very faintly)
// the sign of the planet that rules this hour, repeated across the whole sky. `variant` adds a
// nebula (soft clouds that repeat every 144 pixels, as they did) or a little ringed planet and its moon.
export function starTile(rng, planetGlyph = '☿', variant = 'stars') {
  const size = 144
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  if (!g) return null
  g.fillStyle = '#000006'
  g.fillRect(0, 0, size, size)
  if (variant === 'nebula') {
    const hues = rng.shuffle([[150, 40, 190], [40, 110, 200], [200, 40, 120], [30, 150, 150]]).slice(0, 3)
    for (const [r, gr, b] of hues) {
      const x = rng.int(0, size - 1)
      const y = rng.int(0, size - 1)
      const rad = rng.int(34, 62)
      wrapped(size, x, y, (px, py) => {
        const grad = g.createRadialGradient(px, py, 0, px, py, rad)
        grad.addColorStop(0, `rgba(${r},${gr},${b},0.34)`)
        grad.addColorStop(0.55, `rgba(${r},${gr},${b},0.12)`)
        grad.addColorStop(1, `rgba(${r},${gr},${b},0)`)
        g.fillStyle = grad
        g.fillRect(px - rad, py - rad, rad * 2, rad * 2)
      })
    }
  }
  const tints = ['#ffffff', '#ffffff', '#c8c8c8', '#8a8a8a', '#5c5c5c', '#ccccff', '#ffffcc', '#99aaff', '#ffccdd']
  for (let i = 0; i < 90; i++) {
    g.fillStyle = rng.pick(tints)
    g.fillRect(rng.int(0, size - 1), rng.int(0, size - 1), 1, 1)
  }
  for (let i = 0; i < 7; i++) {
    g.fillStyle = rng.pick(['#ffffff', '#ddddff', '#ffeecc'])
    g.fillRect(rng.int(0, size - 2), rng.int(0, size - 2), 2, 2)
  }
  for (let i = 0; i < 2; i++) {
    const x = rng.int(6, size - 7)
    const y = rng.int(6, size - 7)
    g.fillStyle = '#6f6f99'
    g.fillRect(x - 4, y, 9, 1)
    g.fillRect(x, y - 4, 1, 9)
    g.fillStyle = '#b8b8ff'
    g.fillRect(x - 2, y, 5, 1)
    g.fillRect(x, y - 2, 1, 5)
    g.fillStyle = '#ffffff'
    g.fillRect(x, y, 1, 1)
  }
  if (variant === 'planets') {
    // A little ringed planet with a moon, drawn the way a paint program would: hard edges, two colours.
    const x = rng.int(30, size - 30)
    const y = rng.int(26, size - 26)
    const [body, shade, ring] = rng.pick([['#c46a2c', '#7a3b12', '#e8c77a'], ['#3f78c9', '#1d3f73', '#b7d6ff'], ['#8a5bc2', '#4a2a73', '#f0b8ff']])
    g.save()
    g.translate(x, y)
    g.rotate(-0.35)
    g.strokeStyle = ring
    g.lineWidth = 2
    g.beginPath()
    g.ellipse(0, 0, 17, 5, 0, Math.PI, Math.PI * 2)
    g.stroke()
    g.fillStyle = body
    g.beginPath()
    g.arc(0, 0, 9, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = shade
    g.beginPath()
    g.arc(3, 2, 9, -0.2, Math.PI * 0.8)
    g.fill()
    g.beginPath()
    g.ellipse(0, 0, 17, 5, 0, 0, Math.PI)
    g.stroke()
    g.restore()
    const mx = (x + rng.int(34, 60)) % size
    const my = (y + rng.int(30, 70)) % size
    g.fillStyle = '#d8d8c8'
    g.beginPath()
    g.arc(mx, my, 3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#000006'
    g.beginPath()
    g.arc(mx + 1.4, my - 0.8, 2.6, 0, Math.PI * 2)
    g.fill()
  }
  g.font = '10px serif'
  g.fillStyle = variant === 'nebula' ? '#3a3560' : '#2c2a4a'
  g.fillText(planetGlyph, rng.int(8, size - 20), rng.int(14, size - 6))
  try {
    return c.toDataURL('image/png')
  } catch {
    return null
  }
}

// WordArt, in the four presets every 1997 homepage had to choose between (recruitment.css draws them):
//   rainbow  letters on an arch, a rainbow continuous across the word
//   chrome   polished metal on an arch, with a navy drop shadow
//   fire     letters riding a wave, yellow at the top and red at the bottom
//   slant    blue block letters that grow toward the end, extruded like a 3D bevel
export const WORDART = { rainbow: 4, chrome: 2, fire: 2, slant: 2 }
export function wordArt(text, className = '', preset = 'rainbow') {
  const letters = [...text]
  const n = letters.length
  const mid = (n - 1) / 2
  const wrap = h('span', { class: `rc-wordart ${className}`.trim(), 'aria-hidden': 'true', 'data-preset': preset })
  vars(wrap, { '--n': n })
  letters.forEach((ch, i) => {
    const t = mid ? (i - mid) / mid : 0
    const u = n > 1 ? i / (n - 1) : 0.5
    const el = h('span', { class: ch === ' ' ? 'rc-wa rc-wa--space' : 'rc-wa' }, ch === ' ' ? ' ' : ch)
    vars(el, {
      '--t': t.toFixed(3),
      '--t2': (t * t).toFixed(3),
      '--p': `${(u * 100).toFixed(1)}%`,
      '--u': u.toFixed(3),
      // the wave: height and slope of a sine that makes one and a half turns across the word
      '--w': Math.sin(u * Math.PI * 3).toFixed(3),
      '--wd': Math.cos(u * Math.PI * 3).toFixed(3),
    })
    wrap.append(el)
  })
  return wrap
}

// The classic yellow diamond with a little man digging, plus caution tape. Pure CSS (see recruitment.css).
export function constructionSign({ label = 'UNDER CONSTRUCTION', small = false } = {}) {
  const worker = h('span', { class: 'rc-worker' },
    h('i', { class: 'rc-worker__head' }),
    h('i', { class: 'rc-worker__hat' }),
    h('i', { class: 'rc-worker__body' }),
    h('i', { class: 'rc-worker__arm' }),
    h('i', { class: 'rc-worker__leg rc-worker__leg--a' }),
    h('i', { class: 'rc-worker__leg rc-worker__leg--b' }),
    h('i', { class: 'rc-worker__shovel' }),
    h('i', { class: 'rc-worker__dirt' }),
  )
  return h('div', { class: `rc-construct${small ? ' rc-construct--small' : ''}`, 'aria-hidden': 'true' },
    h('span', { class: 'rc-construct__sign' }, h('span', { class: 'rc-construct__face' }, worker)),
    h('span', { class: 'rc-construct__tape' }, h('b', {}, label)),
    h('span', { class: 'rc-construct__beacon' }),
  )
}

// A moon icon for the horoscope, drawn from the real phase (0 new, 0.5 full).
export function moonSvg(phase, label) {
  const r = 20
  const c = Math.cos(phase * 2 * Math.PI)
  const rx = Math.abs(r * c).toFixed(2)
  const waxing = phase < 0.5
  let lit
  if (phase < 0.02 || phase > 0.98) lit = ''
  else if (Math.abs(phase - 0.5) < 0.02) lit = `<circle r="${r}" fill="#fff6c8"/>`
  else {
    const outer = waxing ? 1 : 0
    const crescent = waxing ? phase < 0.25 : phase > 0.75
    const inner = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0)
    lit = `<path d="M0 ${-r} A${r} ${r} 0 0 ${outer} 0 ${r} A${rx} ${r} 0 0 ${inner} 0 ${-r} Z" fill="#fff6c8"/>`
  }
  return `<svg class="rc-moon" viewBox="-24 -24 48 48" role="img" aria-label="${label}"><circle r="${r}" fill="#1d1d3a" stroke="#565690" stroke-width="1"/>${lit}<circle cx="-6" cy="-5" r="2.4" fill="#000" opacity=".12"/><circle cx="5" cy="7" r="3.2" fill="#000" opacity=".1"/></svg>`
}

// An odometer hit counter. Digits roll on their reels; value can be negative (for the overflow).
export function odometer() {
  const reels = h('span', { class: 'rc-odo__reels', 'aria-hidden': 'true' })
  const text = h('span', { class: 'visually-hidden' })
  const el = h('span', { class: 'rc-odo' }, reels, text)
  let shown = ''
  function set(value, minDigits = 7) {
    const s = value < 0 ? '-' + String(Math.abs(value)).padStart(minDigits, '0') : String(value).padStart(minDigits, '0')
    text.textContent = String(value)
    if (s.length !== shown.length) {
      reels.replaceChildren(...[...s].map(() => h('span', { class: 'rc-odo__cell' }, h('span', { class: 'rc-odo__reel' }, '0123456789-'.split('').map((d) => h('span', {}, d))))))
    }
    ;[...s].forEach((ch, i) => {
      const reel = reels.children[i]?.firstChild
      if (reel) reel.style.setProperty('--d', ch === '-' ? 10 : Number(ch))
    })
    shown = s
  }
  return { el, set }
}

// Little CSS-drawn portraits of the saints. Each needs a number of empty <i> parts.
const PORTRAIT_PARTS = { union: 2, flex: 3, grid: 12, overflow: 1, shadow: 2, twins: 4, clearfix: 3, viewport: 2, div: 1, ghost: 1, padding: 2, pseudo: 7, shadowbox: 1, last: 5 }
export function portrait(kind) {
  const n = PORTRAIT_PARTS[kind] ?? 1
  return h('span', { class: `rc-portrait rc-portrait--${kind}`, 'aria-hidden': 'true' },
    Array.from({ length: n }, (_, i) => h('i', { class: `p${i + 1}` })),
  )
}

// An 88x31 web button.
export function badge({ k, top, bottom }) {
  return h('li', { class: `rc-badge rc-badge--${k}` }, h('span', { class: 'rc-badge__top' }, top), h('span', { class: 'rc-badge__bottom' }, bottom))
}

// A "NEW!" starburst.
export function newBurst(text = 'NEW!') {
  return h('span', { class: 'rc-new', 'aria-hidden': 'true' }, h('span', {}, text))
}

// A rainbow <hr>, for dividing things joyfully.
export function rainbowRule() {
  return h('hr', { class: 'rc-rainbow' })
}
