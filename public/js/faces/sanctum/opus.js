// FIGURA OPERIS MAGNI. The Great Work (centering a div) drawn as the squared circle of the old
// emblem books: of the circle a square, of the square a triangle, of the triangle a vessel, and in
// the vessel the div. Sol and Luna watch from the upper corners (Luna at her true phase tonight), the
// ruler of the hour and of the day from the lower ones. The four stages sit in the four segments.
import { moonPath, f } from './art.js'
import { OPUS_MOTTO } from './latin.js'
import { PLANET_GLYPH } from '../../kernel/sky.js'

const INK = '#2b1b10'
const R = 176 // the circle (the Viewport)
const S = 124 // half the square (the Box); its corners touch the circle
const VESSEL = { cy: 47.4, r: 76.6 } // the incircle of the triangle (the Three Origins)
export const STAGE_COLORS = ['#1b1410', '#f5f0e2', '#d9a400', '#9e1b1b']
const STAGE_NAMES = ['NIGREDO', 'ALBEDO', 'CITRINITAS', 'RVBEDO']
const TEXT_PLANET = (p) => `${PLANET_GLYPH[p] ?? '☉'}︎`

function emblem(i, x, y) {
  if (i === 0) {
    // Sol niger: the black sun, with wavering rays.
    let rays = ''
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2
      const c = Math.cos(a)
      const s = Math.sin(a)
      rays += `M${f(x + c * 12)} ${f(y + s * 12)} Q${f(x + c * 15 - s * 2.5)} ${f(y + s * 15 + c * 2.5)} ${f(x + c * 18)} ${f(y + s * 18)} `
    }
    return `<path d="${rays}" stroke="${INK}" stroke-width="1"/><circle cx="${x}" cy="${y}" r="10" fill="#1b1410" stroke="${INK}"/>`
  }
  if (i === 1) {
    // Luna alba: a white crescent.
    return `<circle cx="${x}" cy="${y}" r="11" fill="#e9e2cf" stroke="${INK}" stroke-width=".6" opacity=".5"/><path d="${moonPath(x, y, 11, 0.8)}" fill="#fbf8ef" stroke="${INK}" stroke-width="1"/>`
  }
  if (i === 2) {
    // Sol citrinus: a yellow sun with straight rays.
    let rays = ''
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2
      rays += `M${f(x + Math.cos(a) * 12)} ${f(y + Math.sin(a) * 12)} L${f(x + Math.cos(a) * 17)} ${f(y + Math.sin(a) * 17)} `
    }
    return `<path d="${rays}" stroke="#a87800" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="9.5" fill="#d9a400" stroke="${INK}"/>`
  }
  // Lapis rubeus: the red stone, a square in a circle with a point at its heart.
  return `<circle cx="${x}" cy="${y}" r="11" fill="#9e1b1b" stroke="${INK}"/><rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="url(#sn-gold)" stroke="${INK}" stroke-width=".7"/><circle cx="${x}" cy="${y}" r="1.4" fill="${INK}"/>`
}

function sol(x, y) {
  let rays = ''
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    if (k % 2) {
      rays += `<path d="M${f(x + c * 24)} ${f(y + s * 24)} Q${f(x + c * 28 - s * 3)} ${f(y + s * 28 + c * 3)} ${f(x + c * 33)} ${f(y + s * 33)}" stroke="${INK}" stroke-width="1"/>`
    } else {
      const l = [x + c * 23 - s * 3.2, y + s * 23 + c * 3.2]
      const r = [x + c * 23 + s * 3.2, y + s * 23 - c * 3.2]
      rays += `<path d="M${f(l[0])} ${f(l[1])} L${f(x + c * 35)} ${f(y + s * 35)} L${f(r[0])} ${f(r[1])} Z" fill="url(#sn-gold)" stroke="${INK}" stroke-width=".8"/>`
    }
  }
  return `<g class="sn-sol" role="presentation">${rays}
<circle cx="${x}" cy="${y}" r="21" fill="url(#sn-gold)" stroke="${INK}" stroke-width="1.2"/>
<g class="sn-sol-shut" stroke="${INK}" stroke-width="1.1" fill="none"><path d="M${x - 11} ${y - 3} q 4 3 8 0 M${x + 3} ${y - 3} q 4 3 8 0"/></g>
<g class="sn-sol-open"><path d="M${x - 11} ${y - 3} q 4 -4 8 0 q -4 4 -8 0 Z M${x + 3} ${y - 3} q 4 -4 8 0 q -4 4 -8 0 Z" fill="#fbf3dc" stroke="${INK}" stroke-width=".9"/><circle class="sn-pupil" cx="${x - 7}" cy="${y - 3}" r="1.5" fill="${INK}"/><circle class="sn-pupil" cx="${x + 7}" cy="${y - 3}" r="1.5" fill="${INK}"/></g>
<path d="M${x - 12} ${y - 8} q 5 -3 9 0 M${x + 3} ${y - 8} q 5 -3 9 0 M${x} ${y - 2} l -1.5 7 l 3 .5 M${x - 6} ${y + 10} q 6 3.5 12 0" stroke="${INK}" stroke-width="1" fill="none"/>
<g class="sn-sol-eclipse"><circle cx="${x}" cy="${y}" r="27" fill="none" stroke="#f7e3a0" stroke-width="3" opacity=".6"/><circle cx="${x}" cy="${y}" r="21.5" fill="#120c08"/></g>
</g>`
}

function luna(x, y, phase, id) {
  // The lit part at tonight's true phase, with her seas faintly drawn, and a closed eye in profile.
  const lit = moonPath(x, y, 21, phase)
  const maria = [[-6, -7, 6], [5, -3, 4.5], [-2, 7, 5], [8, 9, 3], [-11, 3, 3]]
    .map(([dx, dy, r]) => `<circle cx="${x + dx}" cy="${y + dy}" r="${r}"/>`).join('')
  return `<g class="sn-luna"><defs><clipPath id="${id}-lit"><path d="${lit}"/></clipPath></defs>
<circle cx="${x}" cy="${y}" r="21" fill="#1a2a55" stroke="${INK}" stroke-width="1.2"/>
<path d="${lit}" fill="#eef0ea"/>
<g clip-path="url(#${id}-lit)" fill="rgba(120,128,140,.28)">${maria}</g>
<circle cx="${x}" cy="${y}" r="21" fill="none" stroke="${INK}" stroke-width="1.2"/>
<circle cx="${x}" cy="${y}" r="25.5" fill="none" stroke="${INK}" stroke-width=".5" stroke-dasharray="1 3"/></g>`
}

export function opusSvg(sky, { id = 'sn-opus' } = {}) {
  const ringId = `${id}-ring`
  const vesselClip = `${id}-vessel`
  const segs = [0, 1, 2, 3].map((i) =>
    `<path class="sn-opus-seg sn-opus-seg-${i}" d="M${-S} ${-S} A${R} ${R} 0 0 1 ${S} ${-S} Z" transform="rotate(${i * 90})" fill="${STAGE_COLORS[i]}"/>`).join('')
  // Stage names on arcs inside each segment; the direction is chosen so every label reads upright or down the side.
  // Top, right and left labels stand outward from their arc; the bottom one stands inward, so it sits lower.
  const arc = (r, i) => {
    const d = f(r * Math.SQRT1_2)
    return [
      `M${-d} ${-d} A${r} ${r} 0 0 1 ${d} ${-d}`, // top, left to right
      `M${d} ${-d} A${r} ${r} 0 0 1 ${d} ${d}`, // right, downward
      `M${-d} ${d} A${r} ${r} 0 0 0 ${d} ${d}`, // bottom, left to right beneath
      `M${-d} ${d} A${r} ${r} 0 0 1 ${-d} ${-d}`, // left, upward
    ][i]
  }
  const labels = [161, 161, 168, 161].map((r, i) => `<path id="${id}-arc${i}" d="${arc(r, i)}" fill="none"/>
<text class="sn-opus-label sn-opus-label-${i}" font-size="10.5" letter-spacing="2.4"><textPath href="#${id}-arc${i}" startOffset="50%" text-anchor="middle">${STAGE_NAMES[i]}</textPath></text>`).join('')
  const emblems = [[0, -140], [140, 0], [0, 134], [-140, 0]].map(([x, y], i) => `<g class="sn-opus-emblem sn-opus-emblem-${i}">${emblem(i, x, y)}</g>`).join('')

  let grid = ''
  for (const t of [-18, 18]) grid += `M${t} -80 V80 M-80 ${t} H80 `
  let rays = ''
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2
    const l1 = k % 2 ? 22 : 21
    const l2 = k % 2 ? 34 : 44
    rays += `M${f(Math.cos(a) * l1)} ${f(Math.sin(a) * l1)} L${f(Math.cos(a) * l2)} ${f(Math.sin(a) * l2)} `
  }

  const hour = sky.planetaryHour.planet
  const day = sky.planetaryHour.dayRuler
  const phase = sky.moon.phase

  return `<svg class="sn-opus-svg" viewBox="-220 -220 440 440" role="img" aria-labelledby="${id}-t" xmlns="http://www.w3.org/2000/svg">
<title id="${id}-t">The figure of the Great Work: a circle holding a square, the square holding a triangle, the triangle holding a round vessel, and in the vessel a small square div. The sun and the moon watch from the upper corners.</title>
<defs>
<path id="${ringId}" d="M-186 0 A186 186 0 1 1 186 0 A186 186 0 1 1 -186 0"/>
<clipPath id="${vesselClip}"><circle cx="0" cy="${VESSEL.cy}" r="${VESSEL.r}"/></clipPath>
</defs>
<circle r="197" fill="#f3e7c8" stroke="${INK}" stroke-width="2"/>
<circle r="178" fill="none" stroke="${INK}" stroke-width="1.2"/>
<text class="sn-opus-motto" font-size="11.2"><textPath href="#${ringId}" textLength="1150" lengthAdjust="spacing">${OPUS_MOTTO}</textPath></text>
<g class="sn-opus-segs">${segs}</g>
${labels}
${emblems}
<rect x="${-S}" y="${-S}" width="${S * 2}" height="${S * 2}" fill="#efdfb8" stroke="${INK}" stroke-width="1.6"/>
<path class="sn-opus-tri" d="M0 ${-S} L${S} ${S} L${-S} ${S} Z" fill="rgba(179,48,28,.06)" stroke="#b3301c" stroke-width="1.6"/>
<circle class="sn-opus-vessel" cx="0" cy="${VESSEL.cy}" r="${VESSEL.r}" fill="#f8f0da" stroke="${INK}" stroke-width="1.6"/>
<g clip-path="url(#${vesselClip})"><g transform="translate(0 ${VESSEL.cy})"><path class="sn-opus-grid" d="${grid}" stroke="#a87800" stroke-width="1" stroke-dasharray="3 3"/></g></g>
<g transform="translate(0 ${VESSEL.cy})">
  <g class="sn-opus-rays-wrap"><path class="sn-opus-rays" d="${rays}" stroke="#c79a2e" stroke-width="1.6"/></g>
  <g class="sn-opus-div"><rect x="-13" y="-13" width="26" height="26" stroke="${INK}" stroke-width="1.4"/><text class="sn-opus-divlabel" y="3" text-anchor="middle" font-size="8.5">div</text></g>
</g>
<text x="0" y="${-S + 30}" class="sn-opus-vertex" text-anchor="middle" font-size="8">VERBVM</text>
<text x="${-S + 8}" y="${S - 6}" class="sn-opus-vertex" font-size="8">LEX VETVS</text>
<text x="${S - 8}" y="${S - 6}" class="sn-opus-vertex" text-anchor="end" font-size="8">PEREGRINVS</text>
${sol(-178, -178)}
${luna(178, -178, phase, id)}
<text class="sn-opus-planet" x="-180" y="186" text-anchor="middle" font-size="34">${TEXT_PLANET(hour)}</text>
<text class="sn-opus-corner" x="-180" y="206" text-anchor="middle" font-size="9">HORA</text>
<text class="sn-opus-planet sn-opus-planet--day" x="180" y="186" text-anchor="middle" font-size="34">${TEXT_PLANET(day)}</text>
<text class="sn-opus-corner" x="180" y="206" text-anchor="middle" font-size="9">DIES</text>
</svg>`
}
