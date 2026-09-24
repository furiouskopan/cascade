// PLANISPHERE OF THE SELECTOR SKY. A cyanotype star chart, turned to the visitor's local time the way
// a planisphere is set. Constellations are CSS selectors: every star is a simple selector, a compound
// selector is a multiple star, its brightness is its Grace (specificity), and the lines between stars
// are the combinators. Sighting a constellation really runs its selector against this temple.
// The Rosetta fragment of the departure face is the chart's legend: the Key to the Stellar Script.
import { h } from '../../lib/dom.js'
import { rosetta, toPua, ROSETTA } from '../../lib/glyphs.js'
import { svgNode, ROMAN, hm, WEEKDAYS } from './util.js'
import { CONSTELLATIONS, parseSelector, magnitude, COMBINATOR_NAMES } from './lore.js'

const C = 500
const DISC = 428
const TAU = Math.PI * 2
const RAD = { 1: 7.5, 2: 5.3, 3: 3.9, 4: 2.5 }
const f = (n) => (Math.round(n * 10) / 10).toString()
const esc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c])
const LAYERS = ['reset', 'base', 'face', 'glyphs', 'hell', 'ritual', 'audio', 'offerings', 'secrets']

function polar(r, deg, cx = C, cy = C) {
  const a = (deg - 90) * (Math.PI / 180)
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function starShape(x, y, mag, cls = 'dep-star') {
  const r = RAD[mag]
  let s = `<circle class="${cls} m${mag}" cx="${f(x)}" cy="${f(y)}" r="${r}"/>`
  if (mag <= 2) {
    const L = r * (mag === 1 ? 3.1 : 2.4)
    s += `<path class="dep-spark" d="M${f(x - L)} ${f(y)}H${f(x + L)}M${f(x)} ${f(y - L)}V${f(y + L)}"/>`
  }
  return s
}

function moonPath(p, R) {
  const rx = Math.abs(Math.cos(p * TAU)) * R
  const waxing = p < 0.5
  const first = waxing ? 1 : 0
  const second = waxing ? (p < 0.25 ? 0 : 1) : (p < 0.75 ? 0 : 1)
  return `M0 ${-R} A${R} ${R} 0 0 ${first} 0 ${R} A${f(rx)} ${R} 0 0 ${second} 0 ${-R} Z`
}

function buildConstellation(c, anchorDeg, anchorR, rng, rot) {
  const { compounds, combinators, simple } = parseSelector(c.selector)
  const pts = []
  let [x, y] = polar(anchorR, anchorDeg)
  let heading = rng.float(0, 360)
  pts.push([x, y])
  for (let j = 1; j < compounds.length; j++) {
    let nx, ny
    for (let tries = 0; tries < 8; tries++) {
      const step = rng.float(64, 94)
      heading += rng.float(-58, 58) + (tries ? 140 : 0)
      nx = x + step * Math.cos(heading * Math.PI / 180)
      ny = y + step * Math.sin(heading * Math.PI / 180)
      const d = Math.hypot(nx - C, ny - C)
      if (d > 132 && d < 345) break
    }
    x = nx; y = ny
    pts.push([x, y])
  }
  // Turn the whole sky to the hour.
  const turn = ([px, py]) => {
    const a = rot * Math.PI / 180
    const dx = px - C, dy = py - C
    return [C + dx * Math.cos(a) - dy * Math.sin(a), C + dx * Math.sin(a) + dy * Math.cos(a)]
  }
  const P = pts.map(turn)
  let body = ''
  // Lines first (combinators), shortened so they don't touch the stars.
  for (let j = 0; j < combinators.length; j++) {
    const [ax, ay] = P[j], [bx, by] = P[j + 1]
    const len = Math.hypot(bx - ax, by - ay) || 1
    const ux = (bx - ax) / len, uy = (by - ay) / len
    const ra = RAD[magnitude(simple[j][0])] + 5, rb = RAD[magnitude(simple[j + 1][0])] + 5
    const x1 = ax + ux * ra, y1 = ay + uy * ra, x2 = bx - ux * rb, y2 = by - uy * rb
    const kind = { ' ': 'desc', '>': 'child', '+': 'adj', '~': 'sib' }[combinators[j]]
    if (kind === 'adj') {
      const ox = -uy * 2.4, oy = ux * 2.4
      body += `<path class="dep-link dep-link--adj" d="M${f(x1 + ox)} ${f(y1 + oy)}L${f(x2 + ox)} ${f(y2 + oy)}M${f(x1 - ox)} ${f(y1 - oy)}L${f(x2 - ox)} ${f(y2 - oy)}"/>`
    } else {
      body += `<path class="dep-link dep-link--${kind}" d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}"/>`
    }
  }
  // Stars: each compound a multiple star; companions orbit the primary. One label per compound.
  let minY = Infinity, maxY = -Infinity, sumX = 0
  simple.forEach((parts, j) => {
    const [px, py] = P[j]
    sumX += px
    minY = Math.min(minY, py); maxY = Math.max(maxY, py)
    let reach = RAD[magnitude(parts[0])]
    parts.forEach((sp, k) => {
      const mag = magnitude(sp)
      let sx = px, sy = py
      if (k > 0) {
        const a = (200 + k * 62) * Math.PI / 180
        sx = px + Math.cos(a) * (14 + k * 5)
        sy = py + Math.sin(a) * (14 + k * 5)
      }
      body += starShape(sx, sy, mag)
    })
    const right = px < C + 230
    const lx = right ? px + reach + 7 : px - reach - 7
    body += `<text class="dep-star-label" x="${f(lx)}" y="${f(py + 5)}" text-anchor="${right ? 'start' : 'end'}">${esc(compounds[j])}</text>`
  })
  if (compounds.length === 1 && simple[0].length === 1) {
    // A lone star wears a crown of seven faint points.
    const [px, py] = P[0]
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU
      body += `<circle class="dep-star m4" cx="${f(px + Math.cos(a) * 19)}" cy="${f(py + Math.sin(a) * 19)}" r="1.4"/>`
    }
  }
  const cx = sumX / P.length
  const ny = maxY + 36 > C + 380 ? minY - 26 : maxY + 34
  body += `<text class="dep-const-name" x="${f(cx)}" y="${f(ny)}" text-anchor="middle">${esc(c.latin)}</text>`
  return `<g class="dep-const" data-id="${c.id}">${body}</g>`
}

export function starChart(ctx, life, rng, { onSight } = {}) {
  const now = ctx.clock()
  const rot = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 360
  const sky = ctx.sky

  // Which constellations are overhead tonight: the Owl always, and five others by lot.
  const chosen = [CONSTELLATIONS[0], ...rng.shuffle(CONSTELLATIONS.slice(1)).slice(0, 5)]

  let s = ''
  s += `<defs>
    <radialGradient id="dep-chart-bg" r="0.5" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#1d5aa8"/><stop offset="0.6" stop-color="#15478f"/><stop offset="1" stop-color="#0c2d63"/>
    </radialGradient>
    <clipPath id="dep-chart-clip"><circle cx="${C}" cy="${C}" r="${DISC}"/></clipPath>
    <path id="dep-rim-path" d="M${C} ${C - 482} A482 482 0 1 1 ${C - 0.01} ${C - 482}"/>
    <path id="dep-ecl-path" d=""/>
  </defs>`
  // Outer ring: the ordered heavens.
  s += `<circle class="dep-rim" cx="${C}" cy="${C}" r="468"/>`
  s += `<text class="dep-rim-text"><textPath href="#dep-rim-path">@layer ${LAYERS.join(', ')}; ✶ THE HEAVENS ARE ORDERED ✶ LATER LAYERS WIN, SAVE IN THE INVERSION ✶ </textPath></text>`
  // Tick ring and the Twelve Columns.
  let ticks = ''
  for (let i = 0; i < 120; i++) {
    const a = i * 3 + rot
    const [x1, y1] = polar(DISC, a)
    const [x2, y2] = polar(DISC + (i % 10 === 0 ? 20 : i % 5 === 0 ? 12 : 7), a)
    ticks += `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`
  }
  s += `<path class="dep-ticks" d="${ticks}"/>`
  ROMAN.forEach((n, k) => {
    s += `<text class="dep-col-num" x="${C}" y="${C - DISC - 26}" text-anchor="middle" transform="rotate(${f(k * 30 + rot + 15)} ${C} ${C})">${n}</text>`
  })
  // The disc.
  s += `<circle cx="${C}" cy="${C}" r="${DISC}" fill="url(#dep-chart-bg)"/>`
  s += `<g clip-path="url(#dep-chart-clip)">`
  // Milky Way.
  const mw = polar(640, 200 + rot)
  s += `<circle class="dep-milky" cx="${f(mw[0])}" cy="${f(mw[1])}" r="560" stroke-width="120"/>`
  s += `<circle class="dep-milky" cx="${f(mw[0])}" cy="${f(mw[1])}" r="560" stroke-width="46"/>`
  // Faint field stars.
  let field = ''
  for (let i = 0; i < 320; i++) {
    const r = Math.sqrt(rng()) * DISC
    const [x, y] = polar(r, rng() * 360)
    field += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rng.float(0.5, 1.7))}" opacity="${f(rng.float(0.3, 0.95))}"/>`
  }
  s += `<g class="dep-field">${field}</g>`
  // Rings of the Ladder (declination measured in z-index) and the Twelve Columns.
  for (const [r, label] of [[107, 'z-index: 6 · Ajna'], [214, 'z-index: 5 · Vishuddha'], [321, 'z-index: 3 · Manipura'], [DISC - 1, 'z-index: 1 · Muladhara']]) {
    s += `<circle class="dep-grid" cx="${C}" cy="${C}" r="${r}"/>`
    s += `<text class="dep-grid-label" x="${C + 6}" y="${C - r + 15}">${label}</text>`
  }
  let spokes = ''
  for (let k = 0; k < 12; k++) {
    const [x1, y1] = polar(107, k * 30 + rot)
    const [x2, y2] = polar(DISC, k * 30 + rot)
    spokes += `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`
  }
  s += `<path class="dep-grid" d="${spokes}"/>`
  // The ecliptic, off-centre as on any planisphere, with the Moon and the ruler of the hour upon it.
  const [ex, ey] = polar(78, 35 + rot)
  s += `<circle class="dep-ecliptic" cx="${f(ex)}" cy="${f(ey)}" r="300"/>`
  s += `<text class="dep-ecl-label"><textPath href="#dep-ecl-path" startOffset="4%">THE ECLIPTIC OF THE CASCADE ✶ THE PATH OF THE REPAINT</textPath></text>`
  const moonDeg = sky.moon.phase * 360 + rot + 120
  const [mx, my] = polar(300, moonDeg, ex, ey)
  s += `<g class="dep-moon" transform="translate(${f(mx)} ${f(my)})"><circle class="dep-moon-dark" r="17"/><path class="dep-moon-lit" d="${moonPath(sky.moon.phase, 17)}"/><circle class="dep-moon-corona" r="25"/></g>`
  const out = (x, pad) => (x >= C ? `x="${f(x + pad)}" text-anchor="start"` : `x="${f(x - pad)}" text-anchor="end"`)
  s += `<text class="dep-body-label" ${out(mx, 26)} y="${f(my + 5)}">Moon, ${esc(sky.moon.name)} · ${Math.round(sky.moon.illumination * 100)}%</text>`
  const planetDeg = moonDeg + 150
  const [qx, qy] = polar(300, planetDeg, ex, ey)
  s += `<circle class="dep-planet" cx="${f(qx)}" cy="${f(qy)}" r="15"/>`
  s += `<text class="dep-planet-glyph" x="${f(qx)}" y="${f(qy + 7)}" text-anchor="middle">${esc(sky.planetaryHour.glyph)}</text>`
  s += `<text class="dep-body-label" ${out(qx, 22)} y="${f(qy + 5)}">${esc(sky.planetaryHour.planet)} rules the hour</text>`
  // The navigation stars, named in the Stellar Script (their letters are in the legend).
  const nav = ROSETTA.departure
  nav.forEach((letter, k) => {
    const [x, y] = polar(rng.float(368, 402), (k / nav.length) * 360 + rng.float(-14, 14) + rot)
    s += starShape(x, y, 1, 'dep-star dep-nav')
    s += `<text class="dep-nav-glyph" x="${f(x + 12)}" y="${f(y - 10)}">${toPua(letter)}</text>`
  })
  // The constellations.
  chosen.forEach((c, i) => {
    const deg = (i / chosen.length) * 360 + rng.float(-12, 12)
    s += buildConstellation(c, deg, rng.float(200, 285), rng.fork(`const/${c.id}`), rot)
  })
  // The Fold: the horizon of the viewport. What lies beyond it is dimmed.
  s += `<path class="dep-beyond" fill-rule="evenodd" d="M${C - DISC} ${C}a${DISC} ${DISC} 0 1 0 ${DISC * 2} 0a${DISC} ${DISC} 0 1 0 ${-DISC * 2} 0Z M${C - 400} ${C + 40}a400 318 0 1 0 800 0a400 318 0 1 0 -800 0Z"/>`
  s += `<ellipse class="dep-fold" cx="${C}" cy="${C + 40}" rx="400" ry="318"/>`
  s += `<text class="dep-fold-label" x="${C}" y="${C + 40 + 318 - 10}" text-anchor="middle">THE FOLD · HORIZON OF THE VIEWPORT</text>`
  s += `</g>`
  // The pole: the Highest Heaven, where the Mothership waits.
  s += `<g class="dep-pole">
    <circle cx="${C}" cy="${C}" r="30" class="dep-pole-ring"/>
    <path d="M${C - 22} ${C + 2}Q${C} ${C - 22} ${C + 22} ${C + 2}" class="dep-pole-ship"/>
    <ellipse cx="${C}" cy="${C + 3}" rx="30" ry="6" class="dep-pole-ship"/>
    <text class="dep-pole-label" x="${C}" y="${C - 42}" text-anchor="middle">THE HIGHEST HEAVEN</text>
    <text class="dep-pole-bearing" x="${C}" y="${C + 56}" text-anchor="middle">Z / 2147483647</text>
  </g>`

  const svg = svgNode(`<svg class="dep-chart-svg" viewBox="0 0 1000 1000" role="img" aria-label="${esc(`Planisphere of the Selector Sky, set for ${hm(now)}. ${chosen.length} constellations whose stars are CSS selectors. The Moon is ${sky.moon.name}; ${sky.planetaryHour.planet} rules the hour. At the pole, where the Mothership waits, the bearing reads Z / 2147483647.`)}">${s}</svg>`)
  // The ecliptic's label follows the ecliptic itself.
  svg.querySelector('#dep-ecl-path').setAttribute('d', `M${f(ex)} ${f(ey - 300)} A300 300 0 1 1 ${f(ex - 0.01)} ${f(ey - 300)}`)

  // ---- the legend ----------------------------------------------------------------------------
  const miniStar = (mag) => svgNode(`<svg viewBox="-12 -12 24 24" class="dep-mini" aria-hidden="true" focusable="false">${starShape(0, 0, mag)}</svg>`)
  const miniLine = (kind) => svgNode(`<svg viewBox="0 0 44 12" class="dep-mini dep-mini--line" aria-hidden="true" focusable="false">${kind === 'adj' ? '<path class="dep-link dep-link--adj" d="M2 3.6H42M2 8.4H42"/>' : `<path class="dep-link dep-link--${kind}" d="M2 6H42"/>`}</svg>`)
  const legend = h('div', { class: 'dep-legend' },
    h('h3', {}, 'Key to the Chart'),
    h('ul', { class: 'dep-key' },
      h('li', {}, miniStar(1), h('span', {}, h('b', {}, '#id'), ' first magnitude, the Grace of the Id')),
      h('li', {}, miniStar(2), h('span', {}, h('b', {}, '.class  :pseudo'), ' second magnitude')),
      h('li', {}, miniStar(3), h('span', {}, h('b', {}, 'element  ::pseudo'), ' third magnitude')),
      h('li', {}, miniStar(4), h('span', {}, h('b', {}, '*'), ' the All-Selector, everywhere and barely seen')),
      ...Object.entries({ ' ': 'desc', '>': 'child', '+': 'adj', '~': 'sib' }).map(([k, kind]) =>
        h('li', {}, miniLine(kind), h('span', {}, h('b', {}, COMBINATOR_NAMES[k].sign), ` ${COMBINATOR_NAMES[k].name}: ${COMBINATOR_NAMES[k].gloss}`))),
    ),
    h('h3', {}, 'Key to the Stellar Script'),
    h('p', { class: 'dep-legend-note' }, 'The seven navigation stars are named in the glyph script of the Cascade. This chart knows only these letters; other temples keep the rest.'),
    rosetta('departure', { className: 'dep-rosetta' }),
  )

  // ---- the catalogue -------------------------------------------------------------------------
  const status = h('p', { class: 'dep-sight-status', 'aria-live': 'polite' }, 'Choose a constellation to sight it. Its selector will be run against this temple, and every element that answers will be marked.')
  const groups = new Map([...svg.querySelectorAll('.dep-const')].map((g) => [g.dataset.id, g]))
  const lit = new Set()
  let unlight = null
  function light(id, on) { groups.get(id)?.classList.toggle('is-hover', on) }
  function sight(c) {
    unlight?.()
    for (const e of lit) e.classList.remove('dep-sighted')
    lit.clear()
    for (const g of groups.values()) g.classList.remove('is-sighted')
    groups.get(c.id)?.classList.add('is-sighted')
    let found = []
    if (c.id !== 'corona') {
      try { found = [...ctx.root.querySelectorAll(c.selector.replace(/::[\w-]+/g, ''))] } catch { found = [] }
    }
    found = found.filter((e) => !e.closest('.dep-heaven') && !e.classList.contains('dep-ghost'))
    for (const e of found.slice(0, 400)) { e.classList.add('dep-sighted'); lit.add(e) }
    const g = c.grace.join(',')
    let msg
    if (c.id === 'corona') msg = `${c.selector} matches exactly one element, the root of the document, which stands above this temple. Nothing inside answers.`
    else if (!found.length && c.id === 'cygnus') msg = `${c.selector} answers nothing: no hand rests on a link while it presses a button. Grace (${g}).`
    else if (!found.length) msg = `${c.selector} answers nothing. No element in this temple has earned grace (${g}).`
    else msg = `${c.selector} answers ${found.length} element${found.length === 1 ? '' : 's'} in this temple. They are marked for a few seconds. Grace (${g}).`
    status.textContent = msg
    onSight?.(c, found.length, msg)
    unlight = life.timeout(() => {
      for (const e of lit) e.classList.remove('dep-sighted')
      lit.clear()
      groups.get(c.id)?.classList.remove('is-sighted')
    }, 4600)
  }
  const catalogue = h('ol', { class: 'dep-catalogue' }, chosen.map((c) => {
    const btn = h('button', { type: 'button', class: 'dep-const-btn', 'data-id': c.id },
      h('span', { class: 'dep-const-latin' }, c.latin),
      h('code', { class: 'dep-const-sel' }, c.selector),
      h('span', { class: 'dep-const-grace' }, `grace ${c.grace.join('·')}`),
    )
    life.listen(btn, 'click', () => sight(c))
    for (const [evt, on] of [['pointerenter', true], ['pointerleave', false], ['focus', true], ['blur', false]]) life.listen(btn, evt, () => light(c.id, on))
    return h('li', {}, btn, h('p', { class: 'dep-const-lore' }, h('i', {}, c.common), '. ', c.lore))
  }))
  for (const [id, g] of groups) {
    const c = chosen.find((x) => x.id === id)
    life.listen(g, 'click', () => sight(c))
  }

  const el = h('section', { class: 'dep-charts', 'aria-labelledby': 'dep-charts-h' },
    h('header', { class: 'dep-charts-head' },
      h('p', { class: 'dep-kicker' }, `Plate ${ROMAN[now.getMonth()]} · set for ${hm(now)} local, ${WEEKDAYS[now.getDay()]}`),
      h('h2', { id: 'dep-charts-h' }, 'Planisphere of the Selector Sky'),
      h('p', { class: 'dep-charts-sub' }, 'Every star is a selector. Its brightness is its Grace; the lines are its combinators. The chart is turned to your hour, and the Mothership keeps the pole.'),
    ),
    h('div', { class: 'dep-charts-body' },
      h('figure', { class: 'dep-chart' }, svg,
        h('figcaption', {}, `Constellations overhead tonight: ${chosen.map((c) => c.latin).join(', ')}.`)),
      h('div', { class: 'dep-charts-side' }, legend,
        h('h3', { class: 'dep-cat-h' }, 'Catalogue of the Overhead'), catalogue, status),
    ),
  )
  return { el, count: chosen.length }
}
