// PLATE I: THE PHOTOGRAPH. Every contact report worth the name had one: a small grey print from a box
// camera, a dark shape over a road or a water tower, grain like sand, a scratch, a thumbprint of light
// in one corner. This one is painted once, on a canvas, from the report's own rng, so each report has
// its own print. Nothing here moves. (Look closely at the water tower, if the Fleet chose one.)
import { h } from '../../lib/dom.js'

const TAU = Math.PI * 2
const W = 480
const H = 330
const gray = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v)

const SCENES = {
  road: 'a straight road into low hills, lined with telephone poles',
  tower: 'a field with a water tower and a wire fence',
  mesa: 'flat-topped mesas in the desert',
}

// A ragged line of hills by midpoint displacement.
function ridge(rng, y0, amp, rough = 0.55) {
  let pts = [[0, y0 + rng.float(-amp, amp)], [W, y0 + rng.float(-amp, amp)]]
  let a = amp
  for (let k = 0; k < 6; k++) {
    const next = []
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i]
      const [x2, y2] = pts[i + 1]
      next.push(pts[i], [(x1 + x2) / 2, (y1 + y2) / 2 + rng.float(-a, a)])
    }
    next.push(pts[pts.length - 1])
    pts = next
    a *= rough
  }
  return pts
}

function fillRidge(c, pts, bottom, style) {
  c.fillStyle = style
  c.beginPath()
  c.moveTo(0, bottom)
  for (const [x, y] of pts) c.lineTo(x, y)
  c.lineTo(W, bottom)
  c.closePath()
  c.fill()
}

function softBlob(c, x, y, rx, ry, v, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, rx)
  g.addColorStop(0, gray(v, a))
  g.addColorStop(1, gray(v, 0))
  c.save()
  c.translate(x, y)
  c.scale(1, ry / rx)
  c.translate(-x, -y)
  c.fillStyle = g
  c.beginPath()
  c.arc(x, y, rx, 0, TAU)
  c.fill()
  c.restore()
}

// The craft: dark against a bright sky, as they always were, with a rim that caught the light.
function craft(c, rng, x, y, rx, tilt) {
  const lights = rng.int(5, 8)
  const draw = (alpha) => {
    c.save()
    c.translate(x, y)
    c.rotate(tilt)
    c.globalAlpha = alpha
    const body = c.createLinearGradient(0, -rx * 0.3, 0, rx * 0.25)
    body.addColorStop(0, gray(78))
    body.addColorStop(0.45, gray(44))
    body.addColorStop(1, gray(22))
    c.fillStyle = body
    c.beginPath(); c.ellipse(0, 0, rx, rx * 0.2, 0, 0, TAU); c.fill()
    c.fillStyle = gray(64)
    c.beginPath(); c.ellipse(0, -rx * 0.1, rx * 0.42, rx * 0.3, 0, Math.PI, TAU); c.fill()
    c.fillStyle = gray(30)
    c.beginPath(); c.ellipse(0, rx * 0.12, rx * 0.5, rx * 0.1, 0, 0, TAU); c.fill()
    c.strokeStyle = gray(228, 0.75)
    c.lineWidth = 1
    c.beginPath(); c.ellipse(0, -rx * 0.03, rx * 0.95, rx * 0.15, 0, Math.PI * 1.06, Math.PI * 1.94); c.stroke()
    c.strokeStyle = gray(200, 0.5)
    c.beginPath(); c.ellipse(0, -rx * 0.14, rx * 0.36, rx * 0.24, 0, Math.PI * 1.2, Math.PI * 1.6); c.stroke()
    for (let i = 0; i < lights; i++) {
      const t = (i + 0.5) / lights
      c.fillStyle = gray(236, 0.9)
      c.beginPath(); c.arc(-rx * 0.8 + t * rx * 1.6, rx * 0.06, Math.max(0.8, rx * 0.035), 0, TAU); c.fill()
    }
    c.restore()
  }
  // The shutter was slow: a few ghosts of the hull along its line of flight.
  const drift = rng.float(2, 5) * (rng.chance(0.5) ? 1 : -1)
  for (let k = 3; k >= 1; k--) {
    c.save(); c.translate(drift * k, 0); draw(0.16); c.restore()
  }
  draw(0.92)
}

function poles(c, rng, horizon, vx) {
  // Telephone poles down the right side of the road, shrinking toward the vanishing point.
  const near = { x: W * 0.9, base: H * 0.98, h: H * 0.62 }
  const tops = []
  for (let i = 0; i < 9; i++) {
    const t = 1 - Math.pow(0.72, i) // 0 near .. 1 far
    const s = 1 - t * 0.97
    const x = near.x + (vx + 14 - near.x) * t
    const base = near.base + (horizon - near.base) * t
    const hgt = near.h * s
    c.strokeStyle = gray(28)
    c.lineWidth = Math.max(0.6, 5 * s)
    c.beginPath(); c.moveTo(x, base); c.lineTo(x, base - hgt); c.stroke()
    c.lineWidth = Math.max(0.5, 3 * s)
    c.beginPath(); c.moveTo(x - 26 * s, base - hgt * 0.94); c.lineTo(x + 26 * s, base - hgt * 0.94); c.stroke()
    tops.push([x, base - hgt * 0.94, s])
  }
  c.strokeStyle = gray(34, 0.8)
  c.lineWidth = 0.7
  for (const off of [-20, 20]) {
    for (let i = 0; i < tops.length - 1; i++) {
      const [x1, y1, s1] = tops[i]
      const [x2, y2, s2] = tops[i + 1]
      const a = [x1 + off * s1, y1]
      const b = [x2 + off * s2, y2]
      c.beginPath()
      c.moveTo(...a)
      c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 9 * s1, ...b)
      c.stroke()
    }
  }
  // Birds on the nearest wire, which is the only thing in the photograph that does not look up.
  const [x1, y1, s1] = tops[0]
  const [x2, y2] = tops[1]
  const n = rng.int(3, 7)
  for (let i = 0; i < n; i++) {
    const t = rng.float(0.08, 0.8)
    const bx = x1 - 20 * s1 + (x2 - 20 * s1 * 0.72 - (x1 - 20 * s1)) * t
    const by = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 9 - 3
    c.fillStyle = gray(26)
    c.beginPath(); c.ellipse(bx, by, 3.2, 2.4, 0, 0, TAU); c.fill()
    c.beginPath(); c.arc(bx + (rng.chance(0.5) ? 2.4 : -2.4), by - 2.2, 1.5, 0, TAU); c.fill()
  }
}

function road(c, rng, horizon, vx) {
  c.fillStyle = gray(132)
  c.beginPath()
  c.moveTo(W * 0.18, H); c.lineTo(vx - 2, horizon); c.lineTo(vx + 2, horizon); c.lineTo(W * 0.82, H)
  c.closePath(); c.fill()
  c.strokeStyle = gray(210, 0.7)
  for (let i = 0; i < 12; i++) {
    const t0 = Math.pow(i / 12, 2.2)
    const t1 = Math.pow((i + 0.45) / 12, 2.2)
    const ya = H + (horizon - H) * (1 - t0)
    const yb = H + (horizon - H) * (1 - t1)
    c.lineWidth = Math.max(0.5, 3 * t0)
    c.beginPath(); c.moveTo(vx + (W / 2 - vx) * t0, ya); c.lineTo(vx + (W / 2 - vx) * t1, yb); c.stroke()
  }
  poles(c, rng, horizon, vx)
}

function tower(c, rng, horizon) {
  const x = W * rng.float(0.16, 0.3)
  const base = horizon + 26
  const top = horizon - 118
  c.strokeStyle = gray(30)
  c.lineWidth = 2.2
  for (const dx of [-24, -9, 9, 24]) { c.beginPath(); c.moveTo(x + dx * 1.2, base); c.lineTo(x + dx * 0.8, top + 50); c.stroke() }
  c.lineWidth = 0.9
  for (let k = 0; k < 3; k++) {
    const y = base - 18 - k * 20
    c.beginPath(); c.moveTo(x - 27, y); c.lineTo(x + 27, y - 14); c.moveTo(x + 27, y); c.lineTo(x - 27, y - 14); c.stroke()
  }
  const tank = c.createLinearGradient(x - 36, 0, x + 36, 0)
  tank.addColorStop(0, gray(58)); tank.addColorStop(0.35, gray(150)); tank.addColorStop(1, gray(46))
  c.fillStyle = tank
  c.beginPath(); c.moveTo(x - 36, top + 50); c.lineTo(x - 36, top + 12); c.lineTo(x + 36, top + 12); c.lineTo(x + 36, top + 50)
  c.ellipse(x, top + 50, 36, 7, 0, 0, Math.PI); c.fill()
  c.fillStyle = gray(52)
  c.beginPath(); c.moveTo(x - 40, top + 13); c.lineTo(x, top - 12); c.lineTo(x + 40, top + 13); c.closePath(); c.fill()
  // The town painted its year on the tank, as towns did. This town was founded at the Nativity.
  c.fillStyle = gray(34, 0.85)
  c.font = '700 13px "Arial Narrow", "Bahnschrift", sans-serif'
  c.textAlign = 'center'
  c.fillText('1996', x - 2, top + 37)
  // A wire fence across the foreground.
  c.strokeStyle = gray(36)
  let px = -10
  const fy = H * 0.9
  while (px < W + 20) {
    const lean = rng.float(-0.06, 0.06)
    c.lineWidth = 3
    c.beginPath(); c.moveTo(px, fy + 30); c.lineTo(px + lean * 40, fy - 22); c.stroke()
    px += rng.float(62, 80)
  }
  c.lineWidth = 0.8
  for (const dy of [-14, 0]) { c.beginPath(); c.moveTo(0, fy + dy); c.quadraticCurveTo(W / 2, fy + dy + 6, W, fy + dy - 2); c.stroke() }
}

function mesas(c, rng, horizon) {
  let x = rng.float(-40, 20)
  while (x < W) {
    const w = rng.float(60, 150)
    const hgt = rng.float(22, 58)
    const slope = rng.float(8, 20)
    c.fillStyle = gray(rng.float(92, 118))
    c.beginPath()
    c.moveTo(x, horizon + 2); c.lineTo(x + slope, horizon - hgt); c.lineTo(x + w - slope, horizon - hgt); c.lineTo(x + w, horizon + 2)
    c.closePath(); c.fill()
    x += w + rng.float(20, 110)
  }
  // Scrub in the foreground.
  for (let i = 0; i < 26; i++) {
    const bx = rng() * W
    const by = horizon + rng.float(10, H - horizon)
    softBlob(c, bx, by, rng.float(6, 16) * (by / H), rng.float(3, 6), 40, 0.7)
  }
}

export function contactPhoto(rng) {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const kind = rng.weighted({ road: 3, tower: 2, mesa: 2 })
  const canvas = h('canvas', {
    class: 'dep-photo-img', width: Math.round(W * dpr), height: Math.round(H * dpr), role: 'img',
    'aria-label': `A grainy black-and-white photograph: a saucer of the Fleet hangs in a pale sky over ${SCENES[kind]}.`,
  })
  const c = canvas.getContext('2d', { willReadFrequently: true })
  if (!c) return { el: canvas, kind }
  c.scale(dpr, dpr)
  const horizon = H * rng.float(0.6, 0.68)
  const vx = W * rng.float(0.38, 0.52)

  // The sky, overexposed near the horizon.
  const sky = c.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, gray(rng.float(84, 104)))
  sky.addColorStop(0.65, gray(170))
  sky.addColorStop(1, gray(204))
  c.fillStyle = sky
  c.fillRect(0, 0, W, horizon + 4)
  for (let i = 0; i < 10; i++) {
    softBlob(c, rng() * W, rng.float(0.05, 0.9) * horizon, rng.float(50, 170), rng.float(5, 16), rng.chance(0.6) ? 222 : 110, rng.float(0.18, 0.4))
  }
  // Far hills, then the ground.
  fillRidge(c, ridge(rng, horizon - 8, 10, 0.5), horizon + 6, gray(128))
  const ground = c.createLinearGradient(0, horizon, 0, H)
  ground.addColorStop(0, gray(104))
  ground.addColorStop(1, gray(46))
  c.fillStyle = ground
  c.fillRect(0, horizon, W, H - horizon)

  if (kind === 'road') road(c, rng, horizon, vx)
  else if (kind === 'tower') tower(c, rng, horizon)
  else mesas(c, rng, horizon)

  // The craft, somewhere the photographer did not expect it to be.
  const rx = rng.float(24, 42)
  const cx = kind === 'tower' ? W * rng.float(0.5, 0.8) : W * rng.float(0.25, 0.72)
  craft(c, rng, cx, horizon * rng.float(0.28, 0.62), rx, rng.float(-0.22, 0.22))
  // A second, far smaller, that nobody noticed until the print was made.
  if (rng.chance(0.55)) craft(c, rng, W * rng.float(0.06, 0.94), horizon * rng.float(0.12, 0.3), rng.float(4, 6.5), rng.float(-0.3, 0.3))

  // Develop: grain, a warm silver tone, and a little softness.
  const img = c.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data
  let s = (rng() * 4294967296) >>> 0
  const rand = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] + (rand() + rand() + rand() - 1.5) * 34
    d[i] = clamp(v * 1.03 + 12)
    d[i + 1] = clamp(v * 0.97 + 5)
    d[i + 2] = clamp(v * 0.84 - 2)
  }
  c.putImageData(img, 0, 0)

  // Vignette, a light leak, dust, and one long scratch.
  const vig = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.72)
  vig.addColorStop(0, 'rgba(20, 12, 4, 0)')
  vig.addColorStop(1, 'rgba(20, 12, 4, 0.62)')
  c.fillStyle = vig
  c.fillRect(0, 0, W, H)
  const lx = rng.chance(0.5) ? 0 : W
  const leak = c.createRadialGradient(lx, rng.float(0, H), 0, lx, H / 2, W * 0.45)
  leak.addColorStop(0, 'rgba(255, 190, 120, 0.3)')
  leak.addColorStop(1, 'rgba(255, 190, 120, 0)')
  c.globalCompositeOperation = 'screen'
  c.fillStyle = leak
  c.fillRect(0, 0, W, H)
  c.globalCompositeOperation = 'source-over'
  for (let i = 0; i < 70; i++) {
    c.fillStyle = rng.chance(0.7) ? 'rgba(250, 244, 230, 0.55)' : 'rgba(20, 14, 8, 0.5)'
    c.beginPath(); c.arc(rng() * W, rng() * H, rng.float(0.3, 1.3), 0, TAU); c.fill()
  }
  c.strokeStyle = 'rgba(250, 244, 230, 0.35)'
  c.lineWidth = 0.7
  const sx = rng() * W
  c.beginPath(); c.moveTo(sx, -4); c.bezierCurveTo(sx + rng.float(-20, 20), H * 0.3, sx + rng.float(-30, 30), H * 0.7, sx + rng.float(-24, 24), H + 4); c.stroke()

  return { el: canvas, kind, scene: SCENES[kind] }
}
