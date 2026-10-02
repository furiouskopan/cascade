// CRACKS. Unbaked clay dries, and drying clay cracks. A few cracks start at the edges of the great tablet
// and creep inward by a few pixels a minute: one small step every twenty seconds, never in a hidden tab,
// never under mercy. Each crack is a dark line with a lit lip, revealed along its length.
import { s } from './life.js'

const STEP_MS = 20000

export function makeCracks(O, host) {
  const { ctx, life, rng } = O
  // The drawing keeps the tablet's own proportions (measured once), so a crack is as thick going down as
  // going across; a later resize only stretches it a little.
  const box = host.getBoundingClientRect()
  const VH = box.width > 0 && box.height > 0 ? Math.round((1000 * box.height) / box.width) : 1000
  const svg = s('svg', { class: 'om-cracks-svg', viewBox: `0 0 1000 ${VH}`, preserveAspectRatio: 'none', focusable: 'false' })
  host.append(svg)
  const cracks = []
  const n = rng.int(2, 3)
  for (let i = 0; i < n; i++) {
    // Start somewhere on an edge, walk inward with a jagged gait, and fork once.
    const side = rng.pick(['top', 'right', 'bottom', 'left', 'right', 'bottom'])
    let x = side === 'left' ? 0 : side === 'right' ? 1000 : rng.float(80, 920)
    let y = side === 'top' ? 0 : side === 'bottom' ? VH : rng.float(80, VH - 80)
    let a = side === 'left' ? 0 : side === 'right' ? Math.PI : side === 'top' ? Math.PI / 2 : -Math.PI / 2
    a += rng.float(-0.5, 0.5)
    const pts = [[x, y]]
    const steps = rng.int(14, 22)
    const heading = a
    for (let k = 0; k < steps; k++) {
      // Drying clay cracks in short, stubborn zigzags that keep a general direction.
      a = heading + rng.float(-0.55, 0.55) + (k % 2 ? 0.5 : -0.5) * rng.float(0.3, 1)
      const len = rng.float(12, 30)
      x += Math.cos(a) * len
      y += Math.sin(a) * len
      pts.push([x, y])
    }
    let d = 'M' + pts.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(' L')
    // and once, about halfway, it forks
    const at = pts[Math.floor(pts.length / 2)]
    let fx = at[0], fy = at[1], fa = heading + rng.pick([-1, 1]) * rng.float(0.6, 1.1)
    d += ` M${fx.toFixed(1)} ${fy.toFixed(1)}`
    for (let k = 0; k < 6; k++) {
      fa += rng.float(-0.6, 0.6)
      const len = rng.float(10, 22)
      fx += Math.cos(fa) * len
      fy += Math.sin(fa) * len
      d += ` L${fx.toFixed(1)} ${fy.toFixed(1)}`
    }
    const lip = s('path', { d, class: 'om-crack-lip', pathLength: 100 })
    const dark = s('path', { d, class: 'om-crack-line', pathLength: 100 })
    svg.append(lip, dark)
    const crack = { paths: [lip, dark], shown: rng.float(10, 26) }
    cracks.push(crack)
    paint(crack)
  }

  function paint(crack) {
    const v = Math.min(100, crack.shown)
    for (const p of crack.paths) p.style.strokeDashoffset = `${(100 - v).toFixed(2)}px`
  }

  life.interval(() => {
    if (ctx.mercy?.on) return
    for (const c of cracks) {
      if (c.shown >= 100) continue
      c.shown += rng.float(0.25, 0.6)
      paint(c)
    }
  }, STEP_MS)

  return { svg, grow(by = 10) { for (const c of cracks) { c.shown = Math.min(100, c.shown + by); paint(c) } } }
}
