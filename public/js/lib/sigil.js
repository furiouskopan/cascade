// SACRED GEOMETRY. Procedural SVG: sigils, yantras, seals, star polygons, mandalas, saucers.
// Every function returns an SVG string drawn in currentColor, so faces colour it with CSS.
// All output is deterministic for a given rng.

const TAU = Math.PI * 2
const f = (n) => Math.round(n * 100) / 100

function svg(size, body, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-size / 2} ${-size / 2} ${size} ${size}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</svg>`
}

function polar(r, a) {
  return [f(r * Math.cos(a - Math.PI / 2)), f(r * Math.sin(a - Math.PI / 2))]
}

// A sigil in the manner of the chaos magicians: strike repeated letters, place the rest on a
// wheel of the alphabet, join them with one line, begin with a circle and end with a bar.
export function sigil(word, { size = 100, stroke = 2.2 } = {}) {
  const letters = [...new Set(word.toLowerCase().replace(/[^a-z]/g, '').split(''))]
  if (!letters.length) return svg(size, '')
  const R = size * 0.38
  const pts = letters.map((ch) => polar(R * (0.55 + 0.45 * ((ch.charCodeAt(0) * 7) % 5) / 4), ((ch.charCodeAt(0) - 97) / 26) * TAU))
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ')
  const [sx, sy] = pts[0]
  const [ex, ey] = pts[pts.length - 1]
  const [px, py] = pts[Math.max(0, pts.length - 2)]
  const ang = Math.atan2(ey - py, ex - px) + Math.PI / 2
  const bx = f(Math.cos(ang) * size * 0.06)
  const by = f(Math.sin(ang) * size * 0.06)
  const body =
    `<path d="${d}" stroke-width="${stroke}"/>` +
    `<circle cx="${sx}" cy="${sy}" r="${f(size * 0.035)}" stroke-width="${stroke}"/>` +
    `<path d="M${f(ex - bx)} ${f(ey - by)} L${f(ex + bx)} ${f(ey + by)}" stroke-width="${stroke}"/>`
  return svg(size, body)
}

// {n/k} star polygon, e.g. starPolygon(7, 3) for the heptagram.
export function starPolygonPath(n, k, r) {
  const pts = []
  let i = 0
  do {
    pts.push(polar(r, (i / n) * TAU))
    i = (i + k) % n
  } while (i !== 0)
  return 'M' + pts.map((p) => p.join(' ')).join(' L') + ' Z'
}

export function starPolygon(n = 7, k = 3, { size = 100, stroke = 1.5 } = {}) {
  return svg(size, `<path d="${starPolygonPath(n, k, size * 0.45)}" stroke-width="${stroke}"/>`)
}

function petals(count, r0, r1, width) {
  let d = ''
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU
    const [x0, y0] = polar(r0, a)
    const [x1, y1] = polar(r1, a)
    const [cx1, cy1] = polar((r0 + r1) / 2 / Math.cos(width), a - width)
    const [cx2, cy2] = polar((r0 + r1) / 2 / Math.cos(width), a + width)
    d += `M${x0} ${y0} Q${cx1} ${cy1} ${x1} ${y1} Q${cx2} ${cy2} ${x0} ${y0} `
  }
  return d
}

// A yantra: square enclosure with four T-gates (bhupura), lotus rings, circles,
// interlocking triangles pointing up (Shiva) and down (Shakti), and the bindu at the centre.
export function yantra(rng, { size = 200, stroke = 1.2 } = {}) {
  const s = size / 2
  const g = s * 0.92 // gate square half-size
  const gw = s * 0.16 // gate width
  const gd = s * 0.08 // gate depth
  let body = ''
  // Bhupura: three nested squares with gates.
  for (const k of [1, 0.955, 0.91]) {
    const h = g * k
    const w = gw * k
    const dd = gd
    const side = (rot) => {
      const pts = [[-h, -h], [-w, -h], [-w, -h - dd], [w, -h - dd], [w, -h], [h, -h]]
      return pts.map(([x, y]) => {
        const c = Math.cos(rot), sn = Math.sin(rot)
        return `${f(x * c - y * sn)} ${f(x * sn + y * c)}`
      })
    }
    const all = [0, 1, 2, 3].flatMap((q) => side((q * Math.PI) / 2))
    body += `<path d="M${all.join(' L')} Z" stroke-width="${stroke}"/>`
  }
  const lotusOuter = rng.pick([16, 12, 10])
  const lotusInner = rng.pick([8, 6])
  body += `<circle r="${f(s * 0.8)}" stroke-width="${stroke}"/><circle r="${f(s * 0.77)}" stroke-width="${stroke}"/>`
  body += `<path d="${petals(lotusOuter, s * 0.6, s * 0.77, 0.16)}" stroke-width="${stroke}"/>`
  body += `<path d="${petals(lotusInner, s * 0.46, s * 0.6, 0.3)}" stroke-width="${stroke}"/>`
  body += `<circle r="${f(s * 0.46)}" stroke-width="${stroke}"/>`
  // Interlocking triangles, spaced so they cross one another.
  const up = rng.int(3, 4)
  const down = rng.int(4, 5)
  const T = s * 0.44
  for (let i = 0; i < up; i++) {
    const r = T * (1 - i * 0.2)
    const off = -T * 0.12 * i
    body += `<path d="M0 ${f(-r + off)} L${f(r * 0.87)} ${f(r * 0.5 + off)} L${f(-r * 0.87)} ${f(r * 0.5 + off)} Z" stroke-width="${stroke}"/>`
  }
  for (let i = 0; i < down; i++) {
    const r = T * (1 - i * 0.17)
    const off = T * 0.1 * i
    body += `<path d="M0 ${f(r + off)} L${f(r * 0.87)} ${f(-r * 0.5 + off)} L${f(-r * 0.87)} ${f(-r * 0.5 + off)} Z" stroke-width="${stroke}"/>`
  }
  body += `<circle r="${f(s * 0.025)}" fill="currentColor"/>`
  return svg(size, body)
}

// A seal: concentric rings, a star polygon, planetary signs and a line of text around the rim.
export function seal(rng, text = 'OMNIS STYLUS A CASCADA DESCENDIT', { size = 200, stroke = 1.2, id = 'seal' } = {}) {
  const s = size / 2
  const n = rng.pick([5, 7, 8, 9, 11])
  const k = n === 8 ? 3 : rng.int(2, Math.floor((n - 1) / 2))
  const pathId = `${id}-${rng.int(0, 1e9).toString(36)}`
  const signs = ['☉', '☽', '☿', '♀', '♂', '♃', '♄']
  let body = `<circle r="${f(s * 0.96)}" stroke-width="${stroke * 1.5}"/><circle r="${f(s * 0.78)}" stroke-width="${stroke}"/>`
  body += `<path id="${pathId}" d="M0 ${f(-s * 0.87)} A${f(s * 0.87)} ${f(s * 0.87)} 0 1 1 -0.01 ${f(-s * 0.87)}" stroke="none"/>`
  body += `<text font-size="${f(s * 0.11)}" fill="currentColor" stroke="none" letter-spacing="${f(s * 0.02)}" font-family="serif"><textPath href="#${pathId}">${escapeXml(text)} ✶ </textPath></text>`
  body += `<path d="${starPolygonPath(n, k, s * 0.74)}" stroke-width="${stroke}"/>`
  body += `<circle r="${f(s * 0.3)}" stroke-width="${stroke}"/>`
  for (let i = 0; i < 7; i++) {
    const [x, y] = polar(s * 0.52, (i / 7) * TAU)
    body += `<text x="${x}" y="${y}" font-size="${f(s * 0.12)}" fill="currentColor" stroke="none" text-anchor="middle" dominant-baseline="central">${signs[i]}</text>`
  }
  return svg(size, body)
}

// A mandala of repeated petals and dots; `rings` controls density.
export function mandala(rng, { size = 200, stroke = 1, rings = 5 } = {}) {
  const s = size / 2
  let body = ''
  for (let i = 0; i < rings; i++) {
    const r0 = s * (0.12 + (i / rings) * 0.8)
    const r1 = r0 + s * (0.8 / rings) * rng.float(0.8, 1.2)
    const count = rng.pick([6, 8, 12, 16, 24, 32])
    body += `<path d="${petals(count, r0, r1, rng.float(0.08, 0.35) * (8 / count) * 2)}" stroke-width="${stroke}"/>`
    if (rng.chance(0.5)) body += `<circle r="${f(r1)}" stroke-width="${stroke * 0.7}"/>`
    if (rng.chance(0.4)) {
      for (let j = 0; j < count; j++) {
        const [x, y] = polar(r1 + s * 0.03, ((j + 0.5) / count) * TAU)
        body += `<circle cx="${x}" cy="${y}" r="${f(s * 0.012)}" fill="currentColor" stroke="none"/>`
      }
    }
  }
  body += `<circle r="${f(s * 0.05)}" fill="currentColor"/>`
  return svg(size, body)
}

// The Eye in the triangle, which watches from the top of every stylesheet.
export function eye({ size = 100, stroke = 2 } = {}) {
  const s = size / 2
  const body =
    `<path d="M0 ${f(-s * 0.9)} L${f(s * 0.95)} ${f(s * 0.72)} L${f(-s * 0.95)} ${f(s * 0.72)} Z" stroke-width="${stroke}"/>` +
    `<path d="M${f(-s * 0.5)} ${f(s * 0.2)} Q0 ${f(-s * 0.25)} ${f(s * 0.5)} ${f(s * 0.2)} Q0 ${f(s * 0.62)} ${f(-s * 0.5)} ${f(s * 0.2)} Z" stroke-width="${stroke}"/>` +
    `<circle cy="${f(s * 0.2)}" r="${f(s * 0.14)}" fill="currentColor"/>` +
    Array.from({ length: 13 }, (_, i) => {
      const a = -Math.PI / 2 + ((i - 6) / 12) * Math.PI * 0.9
      const [x0, y0] = [f(Math.cos(a) * s * 0.98), f(Math.sin(a) * s * 0.98 - s * 0.05)]
      const [x1, y1] = [f(Math.cos(a) * s * 1.18), f(Math.sin(a) * s * 1.18 - s * 0.05)]
      return `<path d="M${x0} ${y0} L${x1} ${y1}" stroke-width="${stroke * 0.6}"/>`
    }).join('')
  return svg(size * 1.3, body)
}

// A saucer from the Mothership's fleet, in 1950s contactee style.
export function saucer(rng, { size = 200, stroke = 1.5 } = {}) {
  const s = size / 2
  const w = s * rng.float(0.8, 0.95)
  const lights = rng.int(5, 9)
  let body =
    `<ellipse rx="${f(w)}" ry="${f(s * 0.14)}" stroke-width="${stroke}"/>` +
    `<path d="M${f(-w * 0.45)} ${f(-s * 0.08)} Q0 ${f(-s * 0.62)} ${f(w * 0.45)} ${f(-s * 0.08)}" stroke-width="${stroke}"/>` +
    `<path d="M${f(-w * 0.62)} ${f(s * 0.08)} Q0 ${f(s * 0.3)} ${f(w * 0.62)} ${f(s * 0.08)}" stroke-width="${stroke}"/>`
  for (let i = 0; i < lights; i++) {
    const x = -w * 0.8 + (i / (lights - 1)) * w * 1.6
    body += `<circle cx="${f(x)}" cy="${f(s * 0.02)}" r="${f(s * 0.025)}" fill="currentColor"/>`
  }
  if (rng.chance(0.6)) body += `<path d="M${f(-w * 0.3)} ${f(s * 0.2)} L${f(-w * 0.55)} ${f(s * 0.95)} M${f(w * 0.3)} ${f(s * 0.2)} L${f(w * 0.55)} ${f(s * 0.95)}" stroke-width="${stroke * 0.6}" stroke-dasharray="3 5"/>`
  return svg(size, body)
}

// Wrap an SVG string as a data URL, e.g. for CSS backgrounds or a favicon.
export function toDataUrl(svgString, color = '#000') {
  const colored = svgString.replace('stroke="currentColor"', `stroke="${color}" color="${color}"`)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(colored)}`
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c])
}
