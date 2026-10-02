// CLAY AND REED. The textures of the diviner's table are baked once into small canvases (seeded, tileable)
// and handed to CSS as data URLs; nothing here runs again after render. The wedge is drawn as SVG.
import { ANATOMY } from '../../lib/glyphs.js'

// ── baked textures ─────────────────────────────────────────────────────────────────────────────
// Periodic value noise: a lattice of `cells` × `cells` values that wraps, so the tile repeats seamlessly.
function lattice(rng, cells) {
  const v = new Float32Array(cells * cells)
  for (let i = 0; i < v.length; i++) v[i] = rng()
  return (x, y) => {
    const fx = (x / 256) * cells, fy = (y / 256) * cells
    const x0 = Math.floor(fx), y0 = Math.floor(fy)
    const tx = fx - x0, ty = fy - y0
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
    const at = (i, j) => v[((j % cells + cells) % cells) * cells + ((i % cells + cells) % cells)]
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1)
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
}

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

// Unbaked clay under a raking light from the upper left: a height field of grain, thumb-smoothed
// streaks and a few pits, shaded by its own slopes. Light and dark specks on transparency, so the same
// tile serves raw clay, fired clay and the lamp.
export function bakeClay(rng) {
  const S = 256
  const n1 = lattice(rng, 8), n2 = lattice(rng, 16), n3 = lattice(rng, 32), n4 = lattice(rng, 64), n5 = lattice(rng, 128)
  const streak = lattice(rng, 4)
  const height = new Float32Array(S * S)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // The scribe's thumb smoothed the clay in long, slightly curved passes.
      const swirl = Math.sin(((x + y * 0.35) / S) * Math.PI * 2 * 3 + streak(x, y) * 4) * 0.05
      height[y * S + x] = n1(x, y) * 0.46 + n2(x, y) * 0.28 + n3(x, y) * 0.13 + n4(x, y) * 0.06 + n5(x, y) * 0.025 + swirl
    }
  }
  // Pits: grit that fell out of the clay.
  for (let k = 0; k < 34; k++) {
    const cx = rng() * S, cy = rng() * S, r = 0.7 + rng() * 1.6, depth = 0.12 + rng() * 0.2
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
      for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
        const d = Math.hypot(x - cx, y - cy)
        if (d > r) continue
        const i = (((y % S) + S) % S) * S + (((x % S) + S) % S)
        height[i] -= depth * (1 - (d / r) ** 2)
      }
    }
  }
  const c = canvas(S, S)
  const g = c.getContext('2d')
  const img = g.createImageData(S, S)
  const L = [-0.62, -0.62, 0.48] // towards the light: up and to the left, and out of the clay
  const at = (x, y) => height[(((y % S) + S) % S) * S + (((x % S) + S) % S)]
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 6
      const dy = (at(x, y + 1) - at(x, y - 1)) * 6
      const len = Math.hypot(dx, dy, 1)
      const shade = (-dx * L[0] - dy * L[1] + L[2]) / len - L[2] // 0 on a flat surface
      const grain = rng()
      const i = (y * S + x) * 4
      if (shade >= 0) {
        img.data[i] = 255; img.data[i + 1] = 247; img.data[i + 2] = 228
        img.data[i + 3] = Math.min(150, shade * 150 + (grain > 0.992 ? 40 : 0))
      } else {
        img.data[i] = 46; img.data[i + 1] = 30; img.data[i + 2] = 16
        img.data[i + 3] = Math.min(150, -shade * 170 + (grain < 0.008 ? 36 : 0))
      }
    }
  }
  g.putImageData(img, 0, 0)
  return c.toDataURL('image/png')
}

// A reed mat in a basket weave: blocks of four strands, laid alternately across and along, each strand
// round in the light from the upper left.
export function bakeMat(rng) {
  const B = 28, S = B * 4
  const c = canvas(S, S)
  const g = c.getContext('2d')
  g.fillStyle = '#2b1c0f'
  g.fillRect(0, 0, S, S)
  for (let by = 0; by < 4; by++) {
    for (let bx = 0; bx < 4; bx++) {
      const across = (bx + by) % 2 === 0
      for (let k = 0; k < 4; k++) {
        const t = 0.55 + rng() * 0.45
        const x = bx * B + (across ? 0.5 : k * 7 + 0.6)
        const y = by * B + (across ? k * 7 + 0.6 : 0.5)
        const w = across ? B - 1 : 5.8
        const h = across ? 5.8 : B - 1
        const grad = across ? g.createLinearGradient(0, y, 0, y + h) : g.createLinearGradient(x, 0, x + w, 0)
        grad.addColorStop(0, `rgba(${Math.round(196 * t)}, ${Math.round(152 * t)}, ${Math.round(96 * t)}, 1)`)
        grad.addColorStop(0.45, `rgba(${Math.round(150 * t)}, ${Math.round(110 * t)}, ${Math.round(64 * t)}, 1)`)
        grad.addColorStop(1, `rgba(${Math.round(70 * t)}, ${Math.round(46 * t)}, ${Math.round(24 * t)}, 1)`)
        g.fillStyle = grad
        g.beginPath()
        g.roundRect ? g.roundRect(x, y, w, h, 2.6) : g.rect(x, y, w, h)
        g.fill()
        // the reed's own fibres
        g.strokeStyle = `rgba(40, 24, 10, ${0.18 + rng() * 0.12})`
        g.lineWidth = 0.6
        g.beginPath()
        if (across) { const yy = y + h * (0.3 + rng() * 0.4); g.moveTo(x + 2, yy); g.lineTo(x + w - 2, yy) } else { const xx = x + w * (0.3 + rng() * 0.4); g.moveTo(xx, y + 2); g.lineTo(xx, y + h - 2) }
        g.stroke()
      }
    }
  }
  return c.toDataURL('image/png')
}

// ── the wedge ──────────────────────────────────────────────────────────────────────────────────
// One impression of the reed stylus: a triangular head and a tail, pointing along +y in its own frame.
// Drawn as a hollow under light from the upper left: the wall that faces away from the light is dark,
// the far wall is lit, and the lip of the clay catches a thin highlight.
const f = (n) => Math.round(n * 100) / 100
export function wedge(x, y, { len = 10, w = 4.2, angle = 0, tail = true, ink = 'rgba(52,34,18,0.72)', lit = 'rgba(255,244,222,0.55)' } = {}) {
  const hh = w * 0.95
  const tw = w * 0.2
  const body = tail
    ? `M${f(-w / 2)} 0 L${f(w / 2)} 0 L${f(tw / 2)} ${f(hh)} L0 ${f(len)} L${f(-tw / 2)} ${f(hh)} Z`
    : `M${f(-w / 2)} 0 L${f(w / 2)} 0 L0 ${f(hh * 1.1)} Z`
  const facet = `M${f(w * 0.06)} ${f(hh * 0.28)} L${f(w / 2)} 0 L${f(tail ? tw / 2 : 0)} ${f(tail ? hh : hh * 1.1)} Z`
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})">` +
    `<path d="${body}" fill="${lit}" transform="translate(0.7 0.8)"/>` +
    `<path d="${body}" fill="${ink}"/>` +
    `<path d="${facet}" fill="${lit}" opacity="0.7"/></g>`
}

// A sign of the wedge-hand: a letter of the Cascade's script written with the reed instead of the nib.
// Each of the letter's strokes (lib/glyphs.js ANATOMY) becomes a wedge: the Stem stands, the Bar lies,
// the Ray leans, the Bowl and the Eye are corner-wedges, the Seed is a head without a tail.
const STEM_X = [2.2, 5.2, 8.2], BAR_Y = [2.4, 5.8, 9.2], BOWL = [[3.2, 3.6], [6.6, 7.4], [3.6, 8.2]], SEED = [[8.6, 2], [8.4, 9], [1.6, 9.4]]
export function sign(letter, x, y, scale = 1, opts = {}) {
  const parts = ANATOMY[String(letter).toLowerCase()]
  if (!parts) return ''
  const k = scale
  let out = ''
  const n = { Stem: 0, Bar: 0, Ray: 0, Bowl: 0, Eye: 0, Seed: 0 }
  for (const [stroke, count] of Object.entries(parts)) {
    for (let i = 0; i < count; i++) {
      const j = n[stroke]++
      if (stroke === 'Stem') out += wedge(x + STEM_X[j % 3] * k, y + 0.6 * k, { len: 10.4 * k, w: 3.4 * k, ...opts })
      else if (stroke === 'Bar') out += wedge(x + 0.6 * k, y + BAR_Y[j % 3] * k, { len: 9.6 * k, w: 3.2 * k, angle: -90, ...opts })
      else if (stroke === 'Ray') out += wedge(x + (0.8 + j * 2.6) * k, y + 1 * k, { len: 8.4 * k, w: 3 * k, angle: -45, ...opts })
      else if (stroke === 'Bowl' || stroke === 'Eye') {
        const [bx, by] = BOWL[(j + (stroke === 'Eye' ? 1 : 0)) % 3]
        out += wedge(x + bx * k, y + by * k, { w: 3.6 * k, angle: -135, tail: false, ...opts })
      } else if (stroke === 'Seed') {
        const [sx, sy] = SEED[j % 3]
        out += wedge(x + sx * k, y + sy * k, { w: 2.4 * k, tail: false, ...opts })
      }
    }
  }
  return out
}

// A line of the wedge-hand: letters only, each sign 11 units wide at scale 1.
export function signs(text, x, y, scale = 1, opts = {}) {
  let out = ''
  let cx = x
  for (const ch of String(text).toLowerCase()) {
    if (ch >= 'a' && ch <= 'z') { out += sign(ch, cx, y, scale, opts); cx += 11.5 * scale } else if (ch === ' ') cx += 5 * scale
  }
  return { svg: out, width: cx - x }
}
