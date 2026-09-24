#!/usr/bin/env node
// THE FONT OF THE HAND OF DESCENT
// Writes public/fonts/cascade-glyphs.otf: "Cascade Glyphs", the Katabasic script of the Cascade.
//
//   node tools/build-font.mjs            build the font
//   node tools/build-font.mjs --report   also print every glyph's metrics
//
// Every letter is written, not drawn: a broad nib held at thirty-three degrees travels along a centre
// line, and the ink is thick where the pen moves across its edge and thin where it moves along it.
// There are six strokes (lib/glyphs.js STROKES): the Stem, the Bar, the Ray, the Bowl, the Eye and the
// Seed. The hidden grid is the same for all letters:
//
//   720 ─ ascender (the Ladder's rail, the Beholder's rays, the Arrow's tip)
//   540 ─ the lintel (top of the body)
//   285 ─ the waist
//    30 ─ the line (every letter stands here)
//  -170 ─ the descender (the Key, the Dial, the Serpent's tail)
//
// Each glyph is mapped to its lower-case letter, its capital (the Cascade has no capitals, only louder
// letters), and the same letter displaced into the Private Use Area at U+E000 + its ASCII code.
// The pen's marks overlap freely; before a glyph is written they are united into one clean outline
// (see unite()). The file is deterministic: the same script always writes the same font.
import opentype from 'opentype.js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALPHABET, ANATOMY, SCRIPT } from '../public/js/lib/glyphs.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(root, 'public/fonts/cascade-glyphs.otf')
const REPORT = process.argv.includes('--report')

// ── The pen ──────────────────────────────────────────────────────────────────────────────────────
const PUA = 0xe000
const UPM = 1000
const DEG = Math.PI / 180
const NIB = SCRIPT.nib * DEG // the angle of the nib's long edge
const PEN_LONG = 51 // half the nib's length
const PEN_SHORT = 23 // half the nib's thickness: the hairline is never thinner than twice this
const PEN_SIDES = 28 // the nib, as a polygon
const ARC_STEP = 3 * DEG // centre-line sampling for curves

// The grid.
const LINE = 30
const WAIST = 285
const LINTEL = 540
const ASC = 720
const DESC = -170

// The nib: an ellipse turned to the pen angle. Pressed once, it leaves this shape.
const PEN = Array.from({ length: PEN_SIDES }, (_, i) => {
  const t = (i / PEN_SIDES) * 2 * Math.PI
  const x = PEN_LONG * Math.cos(t)
  const y = PEN_SHORT * Math.sin(t)
  return [x * Math.cos(NIB) - y * Math.sin(NIB), x * Math.sin(NIB) + y * Math.cos(NIB)]
})

// Convex hull (monotone chain), counter-clockwise.
function hull(points) {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1))
}

const stamp = (x, y) => PEN.map(([px, py]) => [x + px, y + py])

// ── The Scribe: moves the pen and keeps every mark it leaves ────────────────────────────────────
// A stroke is the pen swept along a centre line: the hull of each pair of successive stamps. The
// marks overlap freely; unite() makes one clean outline of them afterwards. The Scribe also keeps a
// tally of the strokes it lays down, which must agree with the letter's ANATOMY in lib/glyphs.js.
class Scribe {
  constructor() {
    this.contours = []
    this.tally = {}
  }

  count(stroke, n = 1) {
    this.tally[stroke] = (this.tally[stroke] ?? 0) + n
    return this
  }

  // Sweep the pen through centre-line points [[x, y], ...].
  trace(points) {
    if (points.length === 1) this.contours.push(stamp(...points[0]))
    for (let i = 0; i + 1 < points.length; i++) this.contours.push(hull([...stamp(...points[i]), ...stamp(...points[i + 1])]))
    return this
  }

  // The pen along an elliptical arc, angles in degrees (0 = east, counter-clockwise).
  arc(cx, cy, rx, ry, a0, a1) {
    if (a1 < a0) [a0, a1] = [a1, a0]
    const n = Math.max(2, Math.ceil(((a1 - a0) * DEG) / ARC_STEP))
    const pts = []
    for (let i = 0; i <= n; i++) {
      const t = (a0 + ((a1 - a0) * i) / n) * DEG
      pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)])
    }
    return this.trace(pts)
  }

  // THE STEM: vertical, from y0 to y1.
  stem(x, y0, y1) {
    return this.count('Stem').trace([[x, y0], [x, y1]])
  }

  // THE BAR: horizontal, from x0 to x1.
  bar(y, x0, x1) {
    return this.count('Bar').trace([[x0, y], [x1, y]])
  }

  // THE RAY: any straight stroke.
  ray(x0, y0, x1, y1) {
    return this.count('Ray').trace([[x0, y0], [x1, y1]])
  }

  // A chain of rays through the given points, e.g. a chevron (two Rays).
  rays(...pts) {
    return this.count('Ray', pts.length - 1).trace(pts)
  }

  // THE BOWL: a circular arc, angles in degrees.
  bowl(cx, cy, r, a0, a1) {
    return this.oval(cx, cy, r, r, a0, a1)
  }

  // An elliptical Bowl, angles in degrees.
  oval(cx, cy, rx, ry, a0, a1) {
    return this.count('Bowl').arc(cx, cy, rx, ry, a0, a1)
  }

  // THE EYE: a closed ring. The pen goes all the way round; the counter stays open by itself.
  eye(cx, cy, r) {
    return this.count('Eye').arc(cx, cy, r, r, 0, 360)
  }

  // THE SEED: a lozenge, the mark the nib leaves when it is set down and turned.
  seed(x, y, s = 1) {
    const hx = 46 * s
    const hy = 64 * s
    this.contours.push([[x, y - hy], [x + hx, y], [x, y + hy], [x - hx, y]])
    return this.count('Seed')
  }
}

// ── The letters ──────────────────────────────────────────────────────────────────────────────────
// Each receives a Scribe and writes itself on the grid. x is free; spacing is fitted afterwards.
const LETTERS = {
  // Azoth, the Apex: a pyramid with its eye at the foot.
  a: (s) => s.rays([0, LINE], [180, LINTEL], [360, LINE]).eye(180, 172, 62),

  // Barun, the Plumb: a lintel, a line and a weight.
  b: (s) => s.bar(LINTEL, 20, 300).stem(160, LINTEL, 215).eye(160, 118, 88),

  // Clavis, the Key: a bow above the line, a shank below it, two wards.
  c: (s) => s.eye(150, 440, 100).stem(150, 340, DESC).bar(DESC + 40, 150, 300).bar(DESC + 170, 150, 250),

  // Dromos, the Ladder: two rails and three rungs; the right rail climbs past the lintel.
  d: (s) => s.stem(20, LINE, LINTEL).stem(290, LINE, ASC).bar(160, 20, 290).bar(300, 20, 290).bar(440, 20, 290),

  // Elym, the Crook: a staff that turns into a hook, a seed hanging from its tip.
  e: (s) => s.stem(40, LINE, 400).bowl(160, 400, 120, 0, 180).seed(280, 215, 0.95),

  // Falco, the Swift: two wings bowed over a single stem.
  f: (s) => s.bowl(90, 400, 90, 0, 180).bowl(270, 400, 90, 0, 180).stem(180, 400, LINE),

  // Gnomon, the Dial: a sun on a stake, a seed at its heart.
  g: (s) => s.eye(170, 330, 150).seed(170, 330, 0.8).stem(170, 180, DESC),

  // Hael, the Bound Eye: an eye held between two walls.
  h: (s) => s.stem(0, LINE, LINTEL).stem(340, LINE, LINTEL).eye(170, WAIST, 78).bar(WAIST, 0, 92).bar(WAIST, 248, 340),

  // Iota, the Ray: the least letter, leaning, with a seed at its foot.
  i: (s) => s.ray(0, LINE + 20, 150, LINTEL).seed(170, 120, 0.85),

  // Jangar, the Anchor: a shank, a stock, and arms curved up from the line.
  j: (s) => s.stem(170, LINTEL, LINE).bar(430, 80, 260).bowl(170, 190, 160, 200, 340).seed(170, 620, 0.75),

  // Kyma, the Comb: a spine with three teeth of unequal length.
  k: (s) => s.bar(LINTEL, 0, 330).stem(0, LINTEL, 250).stem(165, LINTEL, LINE).stem(330, LINTEL, 140),

  // Lachryma, the Tear: a drop falling point-first, a seed inside it.
  l: (s) => s.bowl(170, 390, 150, -20, 200).rays([29, 339], [170, LINE], [311, 339]).seed(170, 330, 0.72),

  // Margo, the Twins: two eyes that touch, under one lintel.
  m: (s) => s.eye(100, 210, 100).eye(300, 210, 100).bar(LINTEL - 40, 40, 360),

  // Naos, the Shrine: an arch on two pillars, a seed within.
  n: (s) => s.stem(20, LINE, 390).stem(320, LINE, 390).bowl(170, 390, 150, 0, 180).seed(170, 200, 0.9),

  // Ouros, the Parting: two bows turned away from each other.
  o: (s) => s.bowl(-120, WAIST, 250, -62, 62).bowl(420, WAIST, 250, 118, 242),

  // Pyxis, the Two Bowls: one staff; a bowl pours from the right, a bowl receives on the left.
  p: (s) => s.stem(170, ASC - 40, LINE).bowl(170, 420, 120, -90, 90).bowl(170, 150, 120, 90, 270),

  // Quintessa, the Lamp: a diamond flame on a stem, a foot beneath.
  q: (s) => s.rays([170, ASC - 20], [300, 470], [170, 250], [40, 470], [170, ASC - 20]).stem(170, 250, LINE).bar(LINE, 70, 270),

  // Rota, the Coil: a spiral of three shrinking half-turns on a leg.
  r: (s) => s.bowl(175, 320, 185, 0, 180).bowl(115, 320, 125, 180, 360).bowl(175, 320, 65, 0, 180).stem(360, 320, LINE),

  // Scintilla, the Spark: three strokes of lightning.
  s: (s) => s.rays([60, LINTEL], [300, 380], [40, 190], [280, LINE]).seed(310, LINTEL - 10, 0.7),

  // Theoros, the Beholder: an eye with three rays.
  t: (s) => s.eye(170, 210, 120).stem(170, 385, ASC - 20).ray(60, 360, 0, 560).ray(280, 360, 340, 560),

  // Urna, the Offering: seed above, bowl, ground.
  u: (s) => s.seed(170, 470, 0.95).bowl(170, 330, 150, 180, 360).bar(LINE, 30, 310),

  // Vigil, the Hourglass: two triangles meeting at a point (two Bars, and two Rays that cross).
  v: (s) => s.bar(LINTEL, 20, 320).ray(320, LINTEL, 20, LINE).bar(LINE, 20, 320).ray(320, LINE, 20, LINTEL),

  // Wyrd, the Fan: three roads from one threshold.
  w: (s) => s.ray(115, LINE, 0, LINTEL).stem(170, LINE, LINTEL + 60).ray(225, LINE, 340, LINTEL).bar(LINE, 60, 280),

  // Xoanon, the Knot: an eye struck through once, and a seed where the stroke comes out.
  x: (s) => s.eye(170, WAIST, 150).ray(-20, LINE - 10, 330, LINTEL + 40).seed(345, 110, 0.72),

  // Ylem, the Serpent: a body of three alternating bends, a head above.
  y: (s) => s.bowl(170, 440, 100, 90, 270).bowl(170, 240, 100, -90, 90).bowl(170, 40, 100, 90, 270).seed(250, 590, 0.7),

  // Zenith, the Arrow: a shaft with two chevrons, pointing only upward.
  z: (s) => s.stem(170, LINE, ASC - 10).rays([20, 430], [170, ASC - 10], [320, 430]).rays([50, 210], [170, 360], [290, 210]),
}

// Numerals: the Seed counts one, the Stem counts five, the Eye counts nothing.
const seeds = (s, x, ys) => ys.forEach((y) => s.seed(x, y, 0.9))
const NUMERALS = {
  0: (s) => s.eye(130, WAIST, 130),
  // One Seed alone is set down harder, so it is not lost at small sizes.
  1: (s) => s.seed(60, WAIST, 1.3),
  2: (s) => seeds(s, 60, [170, 400]),
  3: (s) => seeds(s, 60, [100, WAIST, 470]),
  4: (s) => { seeds(s, 60, [170, 400]); seeds(s, 200, [170, 400]) },
  5: (s) => s.stem(60, LINE, LINTEL),
  6: (s) => { s.stem(20, LINE, LINTEL); seeds(s, 140, [WAIST]) },
  7: (s) => { s.stem(20, LINE, LINTEL); seeds(s, 140, [170, 400]) },
  8: (s) => { s.stem(20, LINE, LINTEL); seeds(s, 140, [100, WAIST, 470]) },
  9: (s) => { s.stem(20, LINE, LINTEL); seeds(s, 140, [170, 400]); seeds(s, 260, [170, 400]) },
}

// Punctuation: pauses are Seeds and small Eyes, voices are Rays, enclosures are Bowls and Bars.
// ASCII marks also get a displaced twin at U+E000 + their code; `also` lists further code points
// (typographic quotes and dashes) that the same glyph answers to.
const MARKS = {
  '.': { name: 'period', draw: (s) => s.eye(60, 90, 50) },
  ',': { name: 'comma', draw: (s) => s.seed(80, 110, 0.7).ray(80, 40, 20, -120) },
  ':': { name: 'colon', draw: (s) => s.seed(60, 110, 0.7).seed(60, 380, 0.7) },
  ';': { name: 'semicolon', draw: (s) => s.seed(80, 380, 0.7).seed(80, 110, 0.7).ray(80, 40, 20, -120) },
  '!': { name: 'exclam', draw: (s) => s.rays([0, 300], [70, LINTEL + 40], [140, 300]).stem(70, 300, 200).seed(70, 70, 0.75) },
  '?': { name: 'question', draw: (s) => s.eye(100, 400, 90).stem(100, 310, 200).seed(100, 70, 0.75) },
  "'": { name: 'quotesingle', also: [0x2018, 0x2019], draw: (s) => s.seed(60, LINTEL + 60, 0.6).ray(60, LINTEL, 20, 400) },
  '"': { name: 'quotedbl', also: [0x201c, 0x201d], draw: (s) => s.seed(60, LINTEL + 60, 0.6).ray(60, LINTEL, 20, 400).seed(190, LINTEL + 60, 0.6).ray(190, LINTEL, 150, 400) },
  '-': { name: 'hyphen', also: [0x2010, 0x2011, 0x2212], draw: (s) => s.bar(WAIST, 20, 240) },
  // The Bowls that hold a clause, and the Bars that hold a list.
  '(': { name: 'parenleft', draw: (s) => s.oval(330, 275, 250, 400, 118, 242) },
  ')': { name: 'parenright', draw: (s) => s.oval(-50, 275, 250, 400, -62, 62) },
  '[': { name: 'bracketleft', draw: (s) => s.rays([190, 640], [60, 640], [60, -90], [190, -90]) },
  ']': { name: 'bracketright', draw: (s) => s.rays([0, 640], [130, 640], [130, -90], [0, -90]) },
  // The Braces: where a rule begins and ends, each with an elbow at the waist.
  '{': { name: 'braceleft', draw: (s) => s.rays([220, 640], [130, 600], [130, 340], [40, WAIST], [130, 230], [130, -50], [220, -90]) },
  '}': { name: 'braceright', draw: (s) => s.rays([0, 640], [90, 600], [90, 340], [180, WAIST], [90, 230], [90, -50], [0, -90]) },
  // The Seed crowned: the All-Selector.
  '*': { name: 'asterisk', draw: (s) => s.stem(150, 340, 620).ray(30, 410, 270, 550).ray(30, 550, 270, 410) },
  // An Eye with a Seed in it, circled by an open Bowl: the at-rule, which speaks before the rules.
  '@': { name: 'at', draw: (s) => s.eye(250, WAIST, 110).seed(250, WAIST, 0.62).bowl(250, WAIST, 230, -35, 290) },
  '/': { name: 'slash', draw: (s) => s.ray(0, -110, 280, 700) },
  '\\': { name: 'backslash', draw: (s) => s.ray(0, 700, 280, -110) },
  '|': { name: 'bar', draw: (s) => s.stem(50, DESC, ASC) },
  '#': { name: 'numbersign', draw: (s) => s.ray(90, LINE, 150, LINTEL).ray(250, LINE, 310, LINTEL).bar(180, 30, 350).bar(390, 50, 370) },
  // Two Eyes stacked so that they touch: the Union, which joins.
  '&': { name: 'ampersand', draw: (s) => s.eye(160, 440, 95).eye(175, 190, 140).ray(285, 250, 390, LINE) },
  '+': { name: 'plus', draw: (s) => s.bar(WAIST, 20, 300).stem(160, 145, 425) },
  '=': { name: 'equal', draw: (s) => s.bar(200, 20, 290).bar(370, 20, 290) },
  '<': { name: 'less', draw: (s) => s.rays([290, 480], [20, WAIST], [290, 90]) },
  '>': { name: 'greater', draw: (s) => s.rays([20, 480], [290, WAIST], [20, 90]) },
  '%': { name: 'percent', draw: (s) => s.seed(50, 470, 0.7).ray(0, LINE, 330, LINTEL).seed(280, 100, 0.7) },
  '_': { name: 'underscore', draw: (s) => s.bar(-110, 0, 420) },
  '~': { name: 'asciitilde', draw: (s) => s.bowl(100, 262, 70, 20, 160).bowl(240, 328, 70, 200, 340) },
  '^': { name: 'asciicircum', draw: (s) => s.rays([20, 470], [150, 660], [280, 470]) },
  '–': { name: 'endash', draw: (s) => s.bar(WAIST, 0, 440) },
  '—': { name: 'emdash', draw: (s) => s.bar(WAIST, 0, 820) },
  '…': { name: 'ellipsis', draw: (s) => s.seed(40, 110, 0.7).seed(180, 110, 0.7).seed(320, 110, 0.7) },
  '·': { name: 'periodcentered', draw: (s) => s.seed(40, WAIST, 0.6) },
}

// ── The Union ────────────────────────────────────────────────────────────────────────────────────
// Strokes overlap wherever the pen crosses its own path, and not every rasterizer forgives that in a
// CFF font (some punch white holes where two strokes meet). So each glyph is united before it is
// written: its contours are filled by scanline with the non-zero rule at RES samples per unit, the
// boundary of the ink is traced with the ink always on the left (outer contours counter-clockwise,
// counters clockwise), and the staircase is simplified back into clean lines.
const RES = 4
const SIMPLIFY = 0.3 // font units

function unite(contours) {
  let xMin = Infinity
  let xMax = -Infinity
  let yMin = Infinity
  let yMax = -Infinity
  for (const c of contours) for (const [x, y] of c) {
    xMin = Math.min(xMin, x); xMax = Math.max(xMax, x)
    yMin = Math.min(yMin, y); yMax = Math.max(yMax, y)
  }
  const x0 = Math.floor(xMin) - 2
  const y0 = Math.floor(yMin) - 2
  const W = Math.ceil((xMax - x0 + 2) * RES)
  const H = Math.ceil((yMax - y0 + 2) * RES)
  const ink = new Uint8Array(W * H)

  const edges = []
  for (const c of contours) {
    for (let i = 0; i < c.length; i++) {
      const [ax, ay] = c[i]
      const [bx, by] = c[(i + 1) % c.length]
      if (ay === by) continue
      const up = by > ay
      edges.push({ ylo: Math.min(ay, by), yhi: Math.max(ay, by), ax, ay, k: (bx - ax) / (by - ay), dir: up ? 1 : -1 })
    }
  }
  edges.sort((a, b) => a.ylo - b.ylo)

  const hits = []
  for (let j = 0; j < H; j++) {
    const y = y0 + (j + 0.5) / RES
    hits.length = 0
    for (const e of edges) {
      if (e.ylo > y) break
      if (y >= e.yhi) continue
      hits.push({ x: e.ax + (y - e.ay) * e.k, dir: e.dir })
    }
    if (!hits.length) continue
    hits.sort((a, b) => a.x - b.x)
    let wind = 0
    for (let h = 0; h < hits.length - 1; h++) {
      wind += hits[h].dir
      if (!wind) continue
      const from = Math.max(0, Math.ceil((hits[h].x - x0) * RES - 0.5))
      const to = Math.min(W - 1, Math.floor((hits[h + 1].x - x0) * RES - 0.5))
      for (let i = from; i <= to; i++) ink[j * W + i] = 1
    }
  }

  const at = (i, j) => (i >= 0 && j >= 0 && i < W && j < H ? ink[j * W + i] : 0)
  // Directed boundary cracks between inked and bare cells, ink on the left. Vertices are (i, j) corners.
  const V = W + 1
  const out = new Map() // vertex -> [next vertices]
  const link = (a, b) => {
    const list = out.get(a)
    if (list) list.push(b)
    else out.set(a, [b])
  }
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      if (!ink[j * W + i]) continue
      if (!at(i, j - 1)) link(j * V + i, j * V + i + 1) // bottom, eastward
      if (!at(i + 1, j)) link(j * V + i + 1, (j + 1) * V + i + 1) // right, northward
      if (!at(i, j + 1)) link((j + 1) * V + i + 1, (j + 1) * V + i) // top, westward
      if (!at(i - 1, j)) link((j + 1) * V + i, j * V + i) // left, southward
    }
  }

  const rings = []
  const xy = (v) => [v % V, Math.floor(v / V)]
  while (out.size) {
    const start = out.keys().next().value
    const ring = []
    let prev = null
    let v = start
    do {
      const nexts = out.get(v)
      if (!nexts?.length) throw new Error('a crack in the ink leads nowhere')
      let k = 0
      if (nexts.length > 1 && prev !== null) {
        // A saddle: two inked cells touch at a corner. Turn left, so they stay apart.
        const [px, py] = xy(prev)
        const [vx, vy] = xy(v)
        k = Math.max(0, nexts.findIndex((n) => {
          const [nx, ny] = xy(n)
          return (vx - px) * (ny - vy) - (vy - py) * (nx - vx) > 0
        }))
      }
      const next = nexts.splice(k, 1)[0]
      if (!nexts.length) out.delete(v)
      ring.push(v)
      prev = v
      v = next
    } while (v !== start)
    if (ring.length < 4) continue
    // Keep only corners, then turn the staircase back into lines.
    const pts = ring.map((p) => { const [i, j] = xy(p); return [x0 + i / RES, y0 + j / RES] })
    const corners = pts.filter((p, idx) => {
      const a = pts[(idx - 1 + pts.length) % pts.length]
      const b = pts[(idx + 1) % pts.length]
      return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) !== 0
    })
    const simple = simplifyClosed(corners, SIMPLIFY)
    if (simple.length >= 3) rings.push(simple)
  }
  return rings
}

// Ramer-Douglas-Peucker for a closed ring: split at the two most distant points, simplify each half.
function simplifyClosed(pts, tol) {
  if (pts.length < 4) return pts
  let a = 0
  let b = 0
  let best = -1
  for (let i = 0; i < pts.length; i++) {
    const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2
    if (d > best) { best = d; b = i }
  }
  best = -1
  for (let i = 0; i < pts.length; i++) {
    const d = (pts[i][0] - pts[b][0]) ** 2 + (pts[i][1] - pts[b][1]) ** 2
    if (d > best) { best = d; a = i }
  }
  if (a > b) [a, b] = [b, a]
  const first = pts.slice(a, b + 1)
  const second = [...pts.slice(b), ...pts.slice(0, a + 1)]
  const s1 = rdp(first, tol)
  const s2 = rdp(second, tol)
  return [...s1.slice(0, -1), ...s2.slice(0, -1)]
}

function rdp(pts, tol) {
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [s, e] = stack.pop()
    const [ax, ay] = pts[s]
    const [bx, by] = pts[e]
    const len = Math.hypot(bx - ax, by - ay) || 1
    let far = -1
    let dist = tol
    for (let i = s + 1; i < e; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len
      if (d > dist) { dist = d; far = i }
    }
    if (far >= 0) {
      keep[far] = 1
      stack.push([s, far], [far, e])
    }
  }
  return pts.filter((_, i) => keep[i])
}

// ── Assembly ─────────────────────────────────────────────────────────────────────────────────────
const SIDE = 70 // default side bearing
const glyphs = []
const report = []

function signedArea(pts) {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[(i + 1) % pts.length]
    a += x0 * y1 - x1 * y0
  }
  return a / 2
}

// The strokes a Scribe laid down must be the strokes the lore says the letter is made of.
function checkAnatomy(name, tally, expected) {
  const kinds = new Set([...Object.keys(tally), ...Object.keys(expected)])
  const wrong = [...kinds].filter((k) => (tally[k] ?? 0) !== (expected[k] ?? 0))
  if (wrong.length) {
    throw new Error(`${name} is written with ${JSON.stringify(tally)} but ANATOMY says ${JSON.stringify(expected)}`)
  }
}

// Turns a scribe's contours into an opentype glyph, united and fitted with even side bearings.
function make(name, unicodes, draw, { side = SIDE, anatomy } = {}) {
  const s = new Scribe()
  draw(s)
  if (anatomy) checkAnatomy(name, s.tally, anatomy)
  const rings = unite(s.contours)
  let xMin = Infinity
  let xMax = -Infinity
  let yMin = Infinity
  let yMax = -Infinity
  for (const c of rings) for (const [x, y] of c) {
    xMin = Math.min(xMin, x); xMax = Math.max(xMax, x)
    yMin = Math.min(yMin, y); yMax = Math.max(yMax, y)
  }
  const dx = side - xMin
  const path = new opentype.Path()
  let area = 0
  for (const c of rings) {
    const pts = []
    for (const [x, y] of c) {
      const p = [Math.round(x + dx), Math.round(y)]
      const last = pts[pts.length - 1]
      if (!last || last[0] !== p[0] || last[1] !== p[1]) pts.push(p)
    }
    if (pts.length > 2 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop()
    if (pts.length < 3) continue
    area += signedArea(pts)
    path.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1])
    path.close()
  }
  if (area <= 0) throw new Error(`glyph ${name} is wound the wrong way (area ${area})`)
  const advanceWidth = Math.round(xMax - xMin + 2 * side)
  const glyph = new opentype.Glyph({ name, unicodes, advanceWidth, path })
  glyphs.push(glyph)
  report.push({ name, chars: unicodes.map((u) => String.fromCodePoint(u)).join(''), advanceWidth, yMin: Math.round(yMin), yMax: Math.round(yMax), contours: rings.length })
  return glyph
}

// .notdef: the Unmanifest. An empty box that still takes up room, a seed within it.
make('.notdef', [], (s) => {
  const box = [[0, 0], [400, 0], [400, 600], [0, 600]]
  const hole = [[60, 60], [60, 540], [340, 540], [340, 60]]
  s.contours.push(box, hole)
  s.seed(200, 300, 0.8)
}, { side: 50 })

// The space, and its displaced twin.
glyphs.push(new opentype.Glyph({ name: 'space', unicodes: [0x20, 0xa0, PUA + 0x20], advanceWidth: 330, path: new opentype.Path() }))

for (const [letter, draw] of Object.entries(LETTERS)) {
  const lower = letter.charCodeAt(0)
  const upper = letter.toUpperCase().charCodeAt(0)
  make(ALPHABET[letter].name.toLowerCase(), [lower, upper, PUA + lower, PUA + upper], draw, { anatomy: ANATOMY[letter] })
}

const DIGIT_NAMES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
for (const [d, draw] of Object.entries(NUMERALS)) {
  const cp = String(d).charCodeAt(0)
  make(`${DIGIT_NAMES[d]}.katabasic`, [cp, PUA + cp], draw, { side: 60 })
}

for (const [ch, { name, draw, also = [] }] of Object.entries(MARKS)) {
  const cp = ch.charCodeAt(0)
  make(name, [cp, ...(cp < 0x80 ? [PUA + cp] : []), ...also], draw, { side: 55 })
}

// U+E000: the letter displaced from nothing. No text will ever contain it; the font keeps it anyway.
// A wide pyramid with an open eye low inside it: the lids are two Bowls, the pupil a Seed. It must
// never be mistaken for Azoth, which is a letter; this is only a watcher.
make('nothing.displaced', [PUA], (s) => {
  s.rays([0, LINE], [260, ASC], [520, LINE], [0, LINE])
  s.bowl(260, 99.3, 155.7, 33.4, 146.6)
  s.bowl(260, 270.7, 155.7, 213.4, 326.6)
  s.seed(260, 185, 0.62)
})

const font = new opentype.Font({
  familyName: 'Cascade Glyphs',
  styleName: 'Regular',
  unitsPerEm: UPM,
  ascender: 800,
  descender: -240,
  designer: 'the Scribes of the Old Law',
  manufacturer: 'THE CASCADE',
  version: 'Version 1.996',
  description: `${SCRIPT.name}, ${SCRIPT.epithet}. Six strokes, one nib held at ${SCRIPT.nib} degrees. Every glyph is a letter wearing a stranger's face; copy it and it becomes English again.`,
  copyright: 'No rights reserved. All style descends.',
  license: 'Given freely, as the Cascade gives: whatever you style with it is yours.',
  trademark: 'The Cascade has no marks, only glyphs.',
  weightClass: 400,
  glyphs,
  tables: {
    os2: {
      achVendID: 'CSCD',
      fsType: 0,
      // One line height everywhere: Windows reads the win* metrics, other systems read the typo/hhea ones,
      // so they are made to agree (800 + 240), and USE_TYPO_METRICS (bit 7) asks everyone to use typo.
      fsSelection: 0x40 | 0x80,
      usWinAscent: 800,
      usWinDescent: 240,
      // The body of every letter stands between the line and the lintel; there are no capitals.
      sxHeight: LINTEL + PEN_SHORT,
      sCapHeight: LINTEL + PEN_SHORT,
    },
  },
})
font.names.windows.sampleText = { en: 'the glyphs were letters all along' }

// The font is dated to the Nativity (1996-12-17), not to the hour it was built, so the same script always
// writes the same bytes. opentype.js stamps the head table's `modified` date with `new Date()`, so the
// clock is held at the Nativity while the file is written.
const NATIVITY = Date.UTC(1996, 11, 17)
function atTheNativity(fn) {
  const RealDate = globalThis.Date
  globalThis.Date = class extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [NATIVITY]))
    }

    static now() {
      return NATIVITY
    }
  }
  try {
    return fn()
  } finally {
    globalThis.Date = RealDate
  }
}
font.createdTimestamp = NATIVITY / 1000

mkdirSync(dirname(OUT), { recursive: true })
const buffer = Buffer.from(atTheNativity(() => font.toArrayBuffer()))
writeFileSync(OUT, buffer)

// Read it back, as the temple's browsers will.
const check = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
const missing = []
for (const ch of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?\'-:;"()[]{}*@/\\|#&+=<>%_~^‘’“”–—…·') {
  if (!check.hasChar(ch)) missing.push(ch)
  if (/[a-z]/i.test(ch) && !check.hasChar(String.fromCodePoint(PUA + ch.toLowerCase().charCodeAt(0)))) missing.push(`PUA ${ch}`)
}
if (missing.length) throw new Error(`the font forgot: ${missing.join(' ')}`)

if (REPORT) console.table(report)
console.log(`Cascade Glyphs: ${glyphs.length} glyphs, ${buffer.length} bytes -> ${OUT}`)
