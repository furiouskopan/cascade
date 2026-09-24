// THE ILLUMINATOR. Procedural SVG in the humanist manner ("bianchi girari", white vine-stem):
// gold capitals on grounds of lapis, verdigris and crimson, wound about with vines left the colour
// of the bare vellum, sprinkled with white dots in threes. Plus hairline sprays with gold bezants.
// Everything is deterministic for a given rng.

export const INK = '#2b1b10'
export const LAPIS = '#1f3a8a'
export const VERD = '#2e6b47'
export const CRIMSON = '#9b2335'
export const VELLUM_VINE = '#f1e6c9'
export const GOLD_STOPS = [['0', '#7a5410'], ['0.28', '#d9b24a'], ['0.45', '#f7e3a0'], ['0.62', '#c0922c'], ['1', '#8a6414']]

const TAU = Math.PI * 2
export const f = (n) => Math.round(n * 10) / 10

// A smooth path through points (Catmull-Rom turned into cubic Beziers).
export function smooth(pts) {
  if (pts.length < 2) return ''
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

// Points on a spiral winding inward from radius r0 at angle a0.
export function spiralPts(cx, cy, r0, a0, turns, dir = 1, n = 22, rEnd = 0.16) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = a0 + dir * t * turns * TAU
    const r = r0 * (1 - (1 - rEnd) * Math.pow(t, 0.85))
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}

function goldGradient(id, angle = 35) {
  const rad = (angle * Math.PI) / 180
  const x = f(Math.cos(rad) * 50 + 50)
  const y = f(Math.sin(rad) * 50 + 50)
  return `<linearGradient id="${id}" x1="${f(100 - x)}%" y1="${f(100 - y)}%" x2="${x}%" y2="${y}%">${GOLD_STOPS.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`
}

function dots3(x, y, r = 1.5, color = '#f6efd9') {
  return `<circle cx="${f(x)}" cy="${f(y - r * 1.3)}" r="${r}" fill="${color}"/><circle cx="${f(x - r * 1.3)}" cy="${f(y + r)}" r="${r}" fill="${color}"/><circle cx="${f(x + r * 1.3)}" cy="${f(y + r)}" r="${r}" fill="${color}"/>`
}

// THE ILLUMINATED INITIAL. A square panel, 200 units. `letter` is a single capital.
export function initialSvg(rng, letter, { id = 'sn-init' } = {}) {
  const L = String(letter || 'A').toUpperCase().slice(0, 1)
  const gid = `${id}-gold`
  const cid = `${id}-clip`
  let ground = `<rect x="8" y="8" width="184" height="184" fill="${LAPIS}"/>`
  const patches = rng.int(5, 8)
  for (let i = 0; i < patches; i++) {
    ground += `<circle cx="${f(rng.float(14, 186))}" cy="${f(rng.float(14, 186))}" r="${f(rng.float(16, 32))}" fill="${rng.pick([VERD, CRIMSON, VERD])}"/>`
  }
  let dots = ''
  for (let i = 0; i < 22; i++) dots += dots3(rng.float(16, 184), rng.float(16, 184), 1.6)

  // Vines: spirals anchored on the frame, curling inward around the letter.
  const anchors = [
    [8, rng.float(30, 70), 0], [192, rng.float(30, 70), Math.PI], [8, rng.float(130, 170), 0], [192, rng.float(130, 170), Math.PI],
    [rng.float(60, 140), 8, Math.PI / 2], [rng.float(60, 140), 192, -Math.PI / 2],
  ]
  let vines = ''
  let vineFill = ''
  let vineInk = ''
  // The trunk: one stem winding through the whole panel behind the letter, from which the scrolls grow.
  const flip = rng.chance(0.5)
  const tp = [[8, 178], [46, rng.float(140, 160)], [rng.float(80, 95), rng.float(115, 125)], [rng.float(105, 120), rng.float(78, 90)], [rng.float(150, 160), rng.float(45, 58)], [192, 22]]
    .map(([x, y]) => (flip ? [200 - x, y] : [x, y]))
  const trunk = smooth(tp)
  vineInk += `<path class="sn-vine-ink" d="${trunk}" stroke="${INK}" stroke-width="12" pathLength="1"/>`
  vineFill += `<path class="sn-vine" d="${trunk}" stroke="${VELLUM_VINE}" stroke-width="9" pathLength="1"/>`
  anchors.forEach(([x, y, inward], i) => {
    const r0 = rng.float(22, 32)
    const cx = x + Math.cos(inward) * (r0 + rng.float(8, 18)) + rng.float(-8, 8)
    const cy = y + Math.sin(inward) * (r0 + rng.float(8, 18)) + rng.float(-8, 8)
    const dir = i % 2 ? 1 : -1
    const a0 = inward + Math.PI + dir * 0.6
    const sp = spiralPts(cx, cy, r0, a0, rng.float(1.2, 1.7), dir, 20, 0.2)
    const start = [x - Math.cos(inward) * 4, y - Math.sin(inward) * 4]
    const d = smooth([start, [(start[0] + sp[0][0]) / 2, (start[1] + sp[0][1]) / 2], ...sp])
    vineInk += `<path class="sn-vine-ink" d="${d}" stroke="${INK}" stroke-width="10.5" pathLength="1"/>`
    vineFill += `<path class="sn-vine" d="${d}" stroke="${VELLUM_VINE}" stroke-width="7.5" pathLength="1"/>`
    // A bud where the spiral ends.
    const [ex, ey] = sp[sp.length - 1]
    vineFill += `<circle class="sn-bud" cx="${f(ex)}" cy="${f(ey)}" r="3.4" fill="${VELLUM_VINE}" stroke="${INK}" stroke-width="1.2"/>`
    // Leaflets on the outer turn.
    const lp = sp[Math.floor(sp.length * 0.3)]
    vineFill += `<path class="sn-bud" d="M${f(lp[0])} ${f(lp[1])} q ${f(dir * 7)} -9 ${f(dir * 15)} -4 q ${f(-dir * 6)} 6 ${f(-dir * 15)} 4 Z" fill="${VELLUM_VINE}" stroke="${INK}" stroke-width="1"/>`
  })
  vines = vineInk + vineFill

  const fs = L === 'M' || L === 'W' ? 116 : L === 'I' || L === 'J' ? 150 : 140
  const ty = f(100 + fs * 0.335)
  const font = `'Book Antiqua','Palatino Linotype',Palatino,Garamond,'Times New Roman',serif`
  const letterEl = (extra, cls) => `<text class="${cls}" x="100" y="${ty}" text-anchor="middle" font-family="${font}" font-weight="700" font-size="${fs}" ${extra}>${L}</text>`

  return `<svg class="sn-initial-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true" focusable="false">
<defs>${goldGradient(gid, 40)}${goldGradient(`${gid}-b`, 120)}<clipPath id="${cid}"><rect x="8" y="8" width="184" height="184"/></clipPath></defs>
<g class="sn-init-ground" clip-path="url(#${cid})">${ground}${dots}</g>
<g class="sn-init-vines" clip-path="url(#${cid})" stroke-linecap="round">${vines}</g>
<rect class="sn-init-frame" x="4" y="4" width="192" height="192" stroke="url(#${gid})" stroke-width="7"/>
<rect x="0.8" y="0.8" width="198.4" height="198.4" stroke="${INK}" stroke-width="1.4"/>
<rect x="7.6" y="7.6" width="184.8" height="184.8" stroke="${INK}" stroke-width="1.2"/>
<g class="sn-init-letter">
${letterEl(`fill="rgba(20,10,4,.55)" transform="translate(3 4)"`, 'sn-init-shadow')}
${letterEl(`fill="url(#${gid})" stroke="${INK}" stroke-width="3.2" paint-order="stroke"`, 'sn-init-gold')}
${letterEl(`fill="url(#${gid}-b)"`, 'sn-init-burnish')}
${letterEl(`fill="none" stroke="#fff4c8" stroke-width="0.9" stroke-dasharray="1.2 3.4" opacity=".8"`, 'sn-init-pearl')}
</g>
<rect class="sn-init-sheen" x="-120" y="-20" width="60" height="240" fill="url(#${id}-sheen)" transform="rotate(18 100 100)"/>
<defs><linearGradient id="${id}-sheen" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff8dc" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
</svg>`
}

// Penwork for the small Lombardic initials: hairline filigree in the contrasting colour, as a data URL.
export function penworkUrl(rng, pen) {
  let d = ''
  for (let i = 0; i < 4; i++) d += `M${f(4 + i * 2)} ${f(6 + i * 11)} q -4 4 0 8 q 4 4 0 8 `
  const tail = smooth([[10, 4], [6, 20], [10, 36], [5, 52], [9, 68]])
  const curl = smooth(spiralPts(12, 74, 5, Math.PI, 1.3, 1, 12, 0.2))
  let beads = ''
  for (let i = 0; i < 6; i++) beads += `<circle cx="${f(rng.float(2, 14))}" cy="${f(4 + i * 12 + rng.float(-2, 2))}" r=".9" fill="${pen}"/>`
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="84" viewBox="0 0 20 84" fill="none"><path d="${d}${tail} ${curl}" stroke="${pen}" stroke-width=".7" stroke-linecap="round"/>${beads}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svgStr)}")`
}

// THE BAR BORDER: a seamless vertical strip of white vine on patched grounds, edged in gold.
// Returned as a data URL for a repeating background.
export function borderStrip(rng, { w = 30, seg = 56, n = 8 } = {}) {
  const H = seg * n
  let ground = ''
  let dots = ''
  for (let i = 0; i < n; i++) {
    const c = rng.pick([LAPIS, LAPIS, VERD, CRIMSON])
    ground += `<rect x="3" y="${i * seg}" width="${w - 6}" height="${seg}" fill="${c}"/>`
    for (let k = 0; k < 2; k++) dots += dots3(rng.float(8, w - 8), i * seg + rng.float(8, seg - 8), 1.1)
  }
  const amp = w * 0.22
  const pts = []
  for (let y = -seg; y <= H + seg; y += 7) pts.push([w / 2 + amp * Math.sin((y / (seg * 2)) * TAU), y])
  const stem = smooth(pts)
  let spirals = ''
  for (let k = 0; k < n; k++) {
    const y = seg * (k + 0.5)
    const side = k % 2 === 0 ? 1 : -1 // stem is at this side here
    const cx = w / 2 - side * w * 0.15
    const cy = y + rng.float(-4, 4)
    const dir = side
    const sp = spiralPts(cx, cy, w * 0.19, side > 0 ? 0 : Math.PI, 1.3, dir, 14, 0.2)
    const start = [w / 2 + side * amp * 0.9, y - 12]
    spirals += `<path d="${smooth([start, ...sp])}"/>`
  }
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" fill="none" stroke-linecap="round">
<defs>${goldGradient('g', 90)}</defs>
${ground}${dots}
<g stroke="${INK}" stroke-width="4.6">${spirals}</g><path d="${stem}" stroke="${INK}" stroke-width="6.4"/>
<g stroke="${VELLUM_VINE}" stroke-width="2.6">${spirals}</g><path d="${stem}" stroke="${VELLUM_VINE}" stroke-width="4.2"/>
<rect x="1.5" y="-2" width="3" height="${H + 4}" fill="url(#g)"/><rect x="${w - 4.5}" y="-2" width="3" height="${H + 4}" fill="url(#g)"/>
<path d="M0.5 0 V${H} M${w - 0.5} 0 V${H} M4.8 0 V${H} M${w - 4.8} 0 V${H}" stroke="${INK}" stroke-width=".8"/>
</svg>`
  return { url: `url("data:image/svg+xml,${encodeURIComponent(svgStr)}")`, height: H, width: w }
}

// A gold bezant with hairline rays, as scattered through Flemish and Italian borders.
export function bezant(x, y, r = 3.2, gradId = 'sn-gold') {
  let rays = ''
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.3
    rays += `M${f(x + Math.cos(a) * (r + 1.4))} ${f(y + Math.sin(a) * (r + 1.4))} L${f(x + Math.cos(a) * (r + 4.4))} ${f(y + Math.sin(a) * (r + 4.4))} `
  }
  return `<path d="${rays}" stroke="${INK}" stroke-width=".55"/><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#${gradId})" stroke="${INK}" stroke-width=".7"/>`
}

function leaf(x, y, angle, size, fill) {
  return `<path d="M0 0 Q ${f(size * 0.5)} ${f(-size * 0.42)} ${f(size)} 0 Q ${f(size * 0.5)} ${f(size * 0.42)} 0 0 Z" transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})" fill="${fill}" stroke="${INK}" stroke-width=".6"/>`
}

// A hairline spray growing leftward out of the bar border (its root is at the right edge, middle).
export function spraySvg(rng, { w = 120, h = 100, gradId = 'sn-gold' } = {}) {
  let hair = ''
  let jewels = ''
  const n = rng.int(3, 4)
  for (let b = 0; b < n; b++) {
    const ex = rng.float(12, w * 0.5)
    const ey = rng.float(14, h - 14)
    const r0 = rng.float(6, 10)
    const dir = rng.pick([1, -1])
    const sp = spiralPts(ex, ey, r0, 0, rng.float(1.1, 1.6), dir, 14, 0.2)
    const root = [w, h / 2 + rng.float(-5, 5)]
    const mid = [rng.float(w * 0.55, w * 0.8), (h / 2 + ey) / 2 + rng.float(-12, 12)]
    const pre = [ex + r0 + 12, ey + rng.float(-5, 5)]
    hair += `<path d="${smooth([root, mid, pre, ...sp])}"/>`
    jewels += bezant(mid[0], mid[1], rng.float(2.6, 3.4), gradId)
    if (rng.chance(0.7)) jewels += leaf(pre[0] - 4, pre[1], rng.float(-160, -110), rng.float(9, 13), rng.pick(['#4f8a5f', '#c79a2e', '#4f8a5f', '#b3301c']))
    if (rng.chance(0.6)) jewels += leaf(mid[0] - 6, mid[1] + 3, rng.float(100, 160), rng.float(8, 11), rng.pick(['#4f8a5f', '#c79a2e']))
  }
  // A few free bezants on their own hair stalks.
  for (let i = 0; i < 2; i++) {
    const x = rng.float(8, w * 0.7)
    const y = rng.float(8, h - 8)
    hair += `<path d="M${f(x + 4)} ${f(y + 2)} q 6 4 10 0"/>`
    jewels += bezant(x, y, 2.4, gradId)
  }
  return `<svg class="sn-spray-svg" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true" focusable="false"><g stroke="${INK}" stroke-width=".8" stroke-linecap="round">${hair}</g>${jewels}</svg>`
}

// Moon at its true phase (0 new, 0.5 full), lit part as a path. Centred at (cx, cy).
export function moonPath(cx, cy, r, phase) {
  const k = Math.cos(phase * TAU) // 1 new, -1 full
  const waxing = phase < 0.5
  const rx = f(Math.abs(k) * r)
  const limbSweep = waxing ? 1 : 0
  const termSweep = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0)
  return `M${f(cx)} ${f(cy - r)} A${r} ${r} 0 0 ${limbSweep} ${f(cx)} ${f(cy + r)} A${rx} ${r} 0 0 ${termSweep} ${f(cx)} ${f(cy - r)} Z`
}
