#!/usr/bin/env node
// THE RELIQUARY. Makes the temple's media by hand, with no dependencies (node:zlib only).
//
//   public/media/favicon.png        64x64 medallion bearing the sigil of the Cascade. The least
//                                   significant bit of every red, green and blue sample keeps a
//                                   message (Canon §6, the `favicon` relic).
//   public/media/relics/halo.png    32x32 cursor worn by the Ascended (canon.css, html[data-ascended]).
//
// Afterwards every file is decoded again from disk (inflate + unfilter) and the hidden message is read
// back bit by bit. If a single bit is lost, the build fails.
//
//   node tools/build-media.mjs
import { deflateSync, inflateSync } from 'node:zlib'
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sigil, starPolygonPath } from '../public/js/lib/sigil.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MESSAGE = 'the favicon remembers: 1996-12-17, the Nativity'
const TEXT_CHUNK = 'The least of each light remembers what the eye forgets.'

// ── colour ────────────────────────────────────────────────────────────────────────────────────────
const hex = (s, a = 1) => {
  const n = parseInt(s.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]
}
const INK = hex('#100b08')
const GOLD = hex('#d9ae52')
const GOLD_DIM = hex('#6e5424')
const VERMILION = hex('#e0452b')
const PALE = hex('#f7ecd0')

// ── a tiny rasteriser: straight-alpha RGBA floats, supersampled coverage, source-over ─────────────
class Canvas {
  constructor(w, h, ss = 8) {
    this.w = w
    this.h = h
    this.ss = ss
    this.px = new Float64Array(w * h * 4) // r,g,b in 0..255, a in 0..1
  }
  // `inside(x, y)` tests a sample point in pixel space; bbox limits the work.
  fill(inside, [r, g, b, a], bbox = [0, 0, this.w, this.h]) {
    const { ss } = this
    const [x0, y0, x1, y1] = [Math.max(0, Math.floor(bbox[0])), Math.max(0, Math.floor(bbox[1])), Math.min(this.w, Math.ceil(bbox[2])), Math.min(this.h, Math.ceil(bbox[3]))]
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        let hits = 0
        for (let sy = 0; sy < ss; sy++) {
          for (let sx = 0; sx < ss; sx++) {
            if (inside(px + (sx + 0.5) / ss, py + (sy + 0.5) / ss)) hits++
          }
        }
        if (!hits) continue
        const sa = a * (hits / (ss * ss))
        const i = (py * this.w + px) * 4
        const da = this.px[i + 3]
        const oa = sa + da * (1 - sa)
        if (oa <= 0) continue
        this.px[i] = (r * sa + this.px[i] * da * (1 - sa)) / oa
        this.px[i + 1] = (g * sa + this.px[i + 1] * da * (1 - sa)) / oa
        this.px[i + 2] = (b * sa + this.px[i + 2] * da * (1 - sa)) / oa
        this.px[i + 3] = oa
      }
    }
  }
  toBytes() {
    const out = Buffer.alloc(this.w * this.h * 4)
    for (let i = 0; i < out.length; i += 4) {
      const a = this.px[i + 3]
      // Fully transparent pixels keep black; the message is written into them later anyway.
      out[i] = a ? Math.round(this.px[i]) : 0
      out[i + 1] = a ? Math.round(this.px[i + 1]) : 0
      out[i + 2] = a ? Math.round(this.px[i + 2]) : 0
      out[i + 3] = Math.round(a * 255)
    }
    return out
  }
}

// Geometry helpers (all in pixel space).
const disc = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r
const ring = (cx, cy, r, w) => (x, y) => Math.abs(Math.hypot(x - cx, y - cy) - r) <= w / 2
function segDist(x, y, [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy))
}
const polyline = (pts, w, closed = false) => (x, y) => {
  const n = closed ? pts.length : pts.length - 1
  for (let i = 0; i < n; i++) if (segDist(x, y, pts[i], pts[(i + 1) % pts.length]) <= w / 2) return true
  return false
}
const polygon = (pts) => (x, y) => {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const ellipseRing = (cx, cy, rx, ry, w) => (x, y) => {
  // First-order distance to the ellipse outline: |f| / |grad f|, with f = (x/rx)^2 + (y/ry)^2 - 1.
  const u = x - cx
  const v = y - cy
  const f = (u * u) / (rx * rx) + (v * v) / (ry * ry) - 1
  const g = 2 * Math.hypot(u / (rx * rx), v / (ry * ry)) || 1
  return Math.abs(f) / g <= w / 2
}

// Parse the "M x y L x y ... Z" paths that sigil.js draws.
function parsePath(d) {
  const nums = d.match(/-?\d+(?:\.\d+)?/g).map(Number)
  const pts = []
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]])
  return pts
}

// ── the favicon: a medallion of ink and gold, a faint heptagram, the sigil of the Cascade ─────────
function drawFavicon(S = 64) {
  const c = new Canvas(S, S)
  const m = S / 2
  const k = S / 64 // design units are for a 64px icon
  const map = ([x, y], scale) => [m + x * scale, m + y * scale]

  c.fill(disc(m, m, 31.6 * k), INK)
  c.fill(ring(m, m, 29.4 * k, 2.4 * k), GOLD, [0, 0, S, S])
  c.fill(ring(m, m, 25.6 * k, 0.9 * k), GOLD_DIM, [0, 0, S, S])
  // Seven notches in the gold ring: the seven rulers of the hours.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2
    c.fill(disc(m + Math.cos(a) * 29.4 * k, m + Math.sin(a) * 29.4 * k, 1.35 * k), INK)
  }
  // The heptagram {7/3}, the Ladder of the seven chakras, drawn dim behind the sigil.
  const hept = parsePath(starPolygonPath(7, 3, 24.2)).map((p) => map(p, k))
  c.fill(polyline(hept, 0.8 * k, true), GOLD_DIM)

  // The sigil of the word "cascade", exactly as sigil.js draws it for the pages.
  const svg = sigil('cascade', { size: 100 })
  const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((mm) => parsePath(mm[1]))
  const [cx, cy, cr] = svg.match(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/).slice(1).map(Number)
  // Centre the sigil on its own bounds (a sigil is never symmetric) and fit it inside the heptagram.
  const all = [...paths.flat(), [cx - cr, cy - cr], [cx + cr, cy + cr]]
  const [minX, maxX] = [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))]
  const [minY, maxY] = [Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[1]))]
  const [midX, midY] = [(minX + maxX) / 2, (minY + maxY) / 2]
  const scale = (34 / Math.max(maxX - minX, maxY - minY)) * k
  const place = ([x, y]) => map([x - midX, y - midY], scale)
  const body = paths[0].map(place)
  const bar = paths[1].map(place)
  const [ox, oy] = place([cx, cy])
  // A soft dark halo first, so the vermilion stroke reads on the gold star.
  c.fill(polyline(body, 6.2 * k), [16, 11, 8, 0.85])
  c.fill(polyline(body, 3.4 * k), VERMILION)
  c.fill(polyline(bar, 3.4 * k), VERMILION)
  c.fill(ring(ox, oy, cr * scale + 0.3 * k, 2.6 * k), PALE)
  // The bindu: the smallest point, at the centre of everything.
  c.fill(disc(m, m, 1.5 * k), PALE)
  return c
}

// ── the halo cursor: a plain arrow, wearing a small gold halo above its point ─────────────────────
// Hotspot is the arrow tip at (4, 9); canon.css says: cursor: url(/media/relics/halo.png) 4 9, auto
function drawHalo() {
  const c = new Canvas(32, 32)
  const arrow = [[4, 9], [4, 27.5], [8.6, 23.2], [11.8, 30.4], [15, 29], [11.9, 21.9], [18.2, 21.9]]
  c.fill(ellipseRing(9.2, 4.6, 7.2, 2.6, 3.4), [255, 224, 140, 0.28]) // glow
  c.fill(ellipseRing(9.2, 4.6, 7.2, 2.6, 1.5), hex('#f2c75c'))
  c.fill(polyline(arrow, 2.1, true), [12, 9, 6, 1])
  c.fill(polygon(arrow), hex('#fffaf0'))
  c.fill(polyline(arrow, 1.05, true), [12, 9, 6, 1])
  return c
}

// ── PNG: encode, decode, and the least significant bits ──────────────────────────────────────────
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function encodePng(w, h, rgba, text) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // adaptive filtering
  ihdr[12] = 0 // no interlace
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0 // filter: none (keeps every bit exactly where it was put)
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr)]
  if (text) parts.push(chunk('tEXt', Buffer.from(`Comment\0${text}`, 'latin1')))
  parts.push(chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)))
  return Buffer.concat(parts)
}
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let pos = 8
  let w = 0
  let h = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('latin1', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (crc32(buf.subarray(pos + 4, pos + 8 + len)) !== buf.readUInt32BE(pos + 8 + len)) throw new Error(`bad CRC in ${type}`)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0)
      h = data.readUInt32BE(4)
      if (data[8] !== 8 || data[9] !== 6) throw new Error('only 8-bit RGBA is read here')
    } else if (type === 'IDAT') idat.push(data)
    pos += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * 4
  const out = Buffer.alloc(stride * h)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x]
      const a = x >= 4 ? out[y * stride + x - 4] : 0
      const b = y > 0 ? out[(y - 1) * stride + x] : 0
      const c = x >= 4 && y > 0 ? out[(y - 1) * stride + x - 4] : 0
      let p = 0
      if (f === 1) p = a
      else if (f === 2) p = b
      else if (f === 3) p = (a + b) >> 1
      else if (f === 4) {
        const pa = Math.abs(b - c)
        const pb = Math.abs(a - c)
        const pc = Math.abs(a + b - 2 * c)
        p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      out[y * stride + x] = (v + p) & 255
    }
  }
  return { w, h, rgba: out }
}

// The message rides in the least significant bit of R, G and B of each pixel, in reading order,
// most significant bit of each byte first, and ends with a NUL. Alpha is left untouched.
function hideMessage(rgba, message) {
  const bytes = Buffer.concat([Buffer.from(message, 'utf8'), Buffer.from([0])])
  const capacity = (rgba.length / 4) * 3
  if (bytes.length * 8 > capacity) throw new Error(`message needs ${bytes.length * 8} bits; the icon holds ${capacity}`)
  let bit = 0
  for (const byte of bytes) {
    for (let k = 7; k >= 0; k--, bit++) {
      const i = Math.floor(bit / 3) * 4 + (bit % 3)
      rgba[i] = (rgba[i] & 0xfe) | ((byte >> k) & 1)
    }
  }
  return rgba
}
function readMessage(rgba) {
  const bytes = []
  let cur = 0
  const total = (rgba.length / 4) * 3
  for (let bit = 0; bit < total; bit++) {
    const i = Math.floor(bit / 3) * 4 + (bit % 3)
    cur = (cur << 1) | (rgba[i] & 1)
    if (bit % 8 === 7) {
      if (cur === 0) return Buffer.from(bytes).toString('utf8')
      bytes.push(cur)
      cur = 0
    }
  }
  return null
}

// ── build ─────────────────────────────────────────────────────────────────────────────────────────
function write(rel, png) {
  const file = resolve(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, png)
  return file
}

const favicon = drawFavicon(64)
const favFile = write('public/media/favicon.png', encodePng(64, 64, hideMessage(favicon.toBytes(), MESSAGE), TEXT_CHUNK))
const halo = drawHalo()
const haloFile = write('public/media/relics/halo.png', encodePng(32, 32, halo.toBytes(), 'Worn by those who have left their container.'))

// Read everything back from disk and prove the relic survived.
const back = decodePng(readFileSync(favFile))
const found = readMessage(back.rgba)
if (found !== MESSAGE) {
  console.error(`[build-media] the favicon forgot. Read back: ${JSON.stringify(found)}`)
  process.exit(1)
}
const haloBack = decodePng(readFileSync(haloFile))
if (haloBack.w !== 32 || haloBack.h !== 32) {
  console.error('[build-media] the halo is the wrong size')
  process.exit(1)
}
const opaque = (rgba) => { let n = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i] > 200) n++; return n }
console.log(`[build-media] ${relative(root, favFile)}  ${back.w}x${back.h}, ${readFileSync(favFile).length} bytes, ${opaque(back.rgba)} opaque px`)
console.log(`[build-media]   LSB (R,G,B, MSB first, NUL-terminated) reads back: "${found}"`)
console.log(`[build-media] ${relative(root, haloFile)}  ${haloBack.w}x${haloBack.h}, ${readFileSync(haloFile).length} bytes, ${opaque(haloBack.rgba)} opaque px`)
