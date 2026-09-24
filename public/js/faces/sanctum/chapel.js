// THE CHAPEL. Two pricket candlesticks stand in the dark on either side of the lectern, where a wide
// window leaves room for them. Their light is the only light in the chapel. They listen as the book
// does: at stillness the flames stand straight, a restless reader makes them gutter, and "fiat lux"
// makes them flare. The wax is real in its way: it burns only while someone is reading, the same candle
// is lit again on the next visit, and when it is spent a new one is set on the pricket.
import { h } from '../../lib/dom.js'
import { f } from './art.js'

export const CANDLE_LIFE = 108 // minutes of reading from a new candle to the stub

const INK = '#1c120b'

// A turned brass pricket: drip pan, baluster stem with three knops, and a foot on three lion's paws.
function standSvg(rng, id) {
  const g = `${id}-brass`
  const k = rng.float(0.92, 1.06)
  const knops = [44, 92 + rng.int(-4, 4), 150 + rng.int(-4, 4)]
  return `<svg class="sn-candle-stand" viewBox="0 0 100 240" aria-hidden="true" focusable="false">
<defs><linearGradient id="${g}" x1="0" x2="1">
<stop offset="0" stop-color="#3b2408"/><stop offset=".22" stop-color="#9c7322"/><stop offset=".4" stop-color="#f1d98e"/>
<stop offset=".55" stop-color="#c79a2e"/><stop offset=".8" stop-color="#6d4a12"/><stop offset="1" stop-color="#2a1705"/></linearGradient></defs>
<g stroke="${INK}" stroke-width="1" fill="url(#${g})">
<path d="M8 8 Q 50 22 92 8 L 88 14 Q 50 28 12 14 Z"/>
<path d="M44 20 L 56 20 L 54 ${knops[0] - 6} L 46 ${knops[0] - 6} Z"/>
${knops.map((y, i) => `<ellipse cx="50" cy="${y}" rx="${f((i === 1 ? 13 : 10) * k)}" ry="${i === 1 ? 7 : 5}"/>`).join('')}
<path d="M46 ${knops[0] + 4} C 38 ${knops[0] + 22} 38 ${knops[1] - 20} 45 ${knops[1] - 6} L 55 ${knops[1] - 6} C 62 ${knops[1] - 20} 62 ${knops[0] + 22} 54 ${knops[0] + 4} Z"/>
<path d="M45 ${knops[1] + 6} C 42 ${knops[1] + 26} 46 ${knops[2] - 20} 44 ${knops[2] - 4} L 56 ${knops[2] - 4} C 54 ${knops[2] - 20} 58 ${knops[1] + 26} 55 ${knops[1] + 6} Z"/>
<path d="M44 ${knops[2] + 4} C 44 190 30 200 14 210 L 86 210 C 70 200 56 190 56 ${knops[2] + 4} Z"/>
<path d="M14 210 C 8 214 6 222 10 230 L 22 230 C 20 222 22 216 28 212 Z"/>
<path d="M86 210 C 92 214 94 222 90 230 L 78 230 C 80 222 78 216 72 212 Z"/>
<path d="M44 212 C 44 220 44 226 42 232 L 58 232 C 56 226 56 220 56 212 Z"/>
</g>
<path d="M20 12 Q 50 22 80 12" fill="none" stroke="#fff3c4" stroke-width=".8" opacity=".55"/>
<path d="M47 ${knops[0] + 8} C 43 ${knops[0] + 22} 43 ${knops[1] - 20} 47 ${knops[1] - 10}" fill="none" stroke="#fff3c4" stroke-width="1.2" opacity=".4"/>
</svg>`
}

// Runs of wax down the candle and over the lip of the drip pan, as a background for the wax.
function dripsUrl(rng) {
  let d = ''
  let x = 2
  while (x < 30) {
    const w = rng.float(3, 6)
    const len = rng.float(10, 60)
    d += `M${f(x)} 0 L${f(x)} ${f(len - w / 2)} a${f(w / 2)} ${f(w / 2)} 0 0 0 ${f(w)} 0 L${f(x + w)} 0 Z `
    x += w + rng.float(3, 9)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="80" viewBox="0 0 34 80"><path d="${d}" fill="#fbf1d2" stroke="#b6a070" stroke-width=".6"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function candle(rng, side, uid) {
  const wax = h('div', { class: 'sn-candle-wax' })
  wax.style.backgroundImage = `${dripsUrl(rng)}, linear-gradient(90deg, #9f8a5e 0%, #e6d6ad 24%, #fbf3da 42%, #efe2bd 62%, #c2ad7e 86%, #8c7750 100%)`
  const flame = h('div', { class: 'sn-flame' })
  flame.style.animationDelay = `${f(-rng.float(0, 3.4))}s`
  return h('div', { class: `sn-candle sn-candle--${side}` },
    h('div', { class: 'sn-candle-halo' }),
    h('div', { class: 'sn-candle-fire' }, flame, h('span', { class: 'sn-candle-wick' })),
    wax,
    h('div', { class: 'sn-candle-foot', html: standSvg(rng, `${uid}-${side}`) }))
}

export function candlesEl(rng, uid) {
  // Spared by the curses: a candlestick that drifts out of its place would only look broken.
  return h('div', { class: 'sn-candles', 'aria-hidden': 'true', 'data-hell': 'spare' }, candle(rng, 'l', uid), candle(rng, 'r', uid))
}

// How much of the candle is left, 1 (new) down to a stub, for so many minutes burnt.
export function waxLeft(burnt) {
  return Math.max(0.12, 1 - 0.88 * Math.min(1, burnt / CANDLE_LIFE))
}
