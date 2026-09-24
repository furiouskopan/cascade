// THE FIRMAMENT OF THE DEPARTURE. Three canvases behind everything:
//   far + mid: pre-painted, vertically seamless star tiles, moved by the compositor for parallax;
//   live: twinkling bright stars, slow meteors, and the Alignment (at 108 s of stillness the stars
//         leave their places and spell the address of the Highest Heaven).
// Mercy: one static frame, no loop. Hidden tab: no loop (rAF sleeps on its own; we also stop).
import { h } from '../../lib/dom.js'

const TAU = Math.PI * 2
const COLORS = ['#cfe0ff', '#ffffff', '#ffffff', '#fff3d6', '#ffd9b0', '#bcd4ff', '#ffc4b8']
const PAR = { far: 0.02, mid: 0.06 }
// Twinkles are slow changes of light, and 12 frames a second draws them without a visible step; a meteor
// or the Alignment in motion asks for 30. Fewer frames leave the main thread to the page.
const FPS_REST = 12
const FPS_MOVING = 30

export function starfield(ctx, life, rng) {
  const el = h('div', { class: 'dep-stars', 'aria-hidden': 'true' })
  const far = h('canvas', { class: 'dep-stars-far' })
  const mid = h('canvas', { class: 'dep-stars-mid' })
  const live = h('canvas', { class: 'dep-stars-live' })
  el.append(far, mid, live)

  const moonWash = 1 - 0.45 * (ctx.sky.moon?.illumination ?? 0.5) // moonlight hides faint stars
  let W = 0, H = 0, dpr = 1
  let twinklers = []
  let meteors = []
  let align = null // { pts:[{x0,y0,x1,y1,c,s}], t0, mode:'in'|'hold'|'out', t1 }
  let running = false
  let paused = false
  let last = 0
  let nextMeteor = performance.now() + rng.float(9000, 20000)
  const g = live.getContext('2d')

  function paintTile(canvas, count, rMin, rMax, aMin, aMax, withBand, r) {
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * 2 * dpr)
    const c = canvas.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    const dot = (x, y, s, a, col) => {
      c.globalAlpha = a
      c.fillStyle = col
      for (const dy of [0, H, 2 * H, -H]) {
        const yy = y + dy
        if (yy < -4 || yy > 2 * H + 4) continue
        c.beginPath()
        c.arc(x, yy, s, 0, TAU)
        c.fill()
      }
    }
    if (withBand) {
      // The Milky Way: a soft diagonal river of haze and a crowd of faint stars, with a dust lane.
      const x0 = -0.1 * W, y0 = 0.92 * H, x1 = 1.1 * W, y1 = 0.08 * H
      const len = Math.hypot(x1 - x0, y1 - y0)
      const nx = -(y1 - y0) / len, ny = (x1 - x0) / len
      for (let i = 0; i < 26; i++) {
        const t = r()
        const off = (r() - 0.5) * 120
        const x = x0 + (x1 - x0) * t + nx * off
        const y = y0 + (y1 - y0) * t + ny * off
        const rad = r.float(70, 190)
        const grd = c.createRadialGradient(x, y, 0, x, y, rad)
        const hue = r.pick(['150, 120, 255', '90, 180, 255', '120, 230, 220', '255, 190, 230'])
        grd.addColorStop(0, `rgba(${hue}, 0.07)`)
        grd.addColorStop(1, `rgba(${hue}, 0)`)
        for (const dy of [0, H, -H]) {
          c.globalAlpha = 1
          c.fillStyle = grd
          c.save(); c.translate(0, dy); c.fillRect(x - rad, y - rad, rad * 2, rad * 2); c.restore()
        }
      }
      const crowd = Math.round((W * H) / 1400 * moonWash)
      for (let i = 0; i < crowd; i++) {
        const t = r()
        const off = (r() + r() + r() - 1.5) * 90
        dot(x0 + (x1 - x0) * t + nx * off, y0 + (y1 - y0) * t + ny * off, r.float(0.3, 0.8), r.float(0.15, 0.5) * moonWash, r.pick(COLORS))
      }
    }
    for (let i = 0; i < count; i++) {
      dot(r() * W, r() * H, r.float(rMin, rMax), r.float(aMin, aMax), r.pick(COLORS))
    }
    // Every dot was painted at y and y+H, so the canvas is two identical, seamless tiles.
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.globalAlpha = 1
  }

  function spikes(canvas, n, r) {
    const c = canvas.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * H, L = r.float(7, 16)
      for (const dy of [0, H]) {
        const yy = y + dy
        const grd = c.createRadialGradient(x, yy, 0, x, yy, L)
        grd.addColorStop(0, 'rgba(235,245,255,0.9)')
        grd.addColorStop(1, 'rgba(235,245,255,0)')
        c.strokeStyle = grd
        c.lineWidth = 0.8
        c.globalAlpha = 0.9
        c.beginPath(); c.moveTo(x - L, yy); c.lineTo(x + L, yy); c.moveTo(x, yy - L); c.lineTo(x, yy + L); c.stroke()
        c.fillStyle = '#f4f8ff'
        c.beginPath(); c.arc(x, yy, 1.4, 0, TAU); c.fill()
      }
    }
    c.setTransform(1, 0, 0, 1, 0, 0)
  }

  function build() {
    W = Math.max(1, innerWidth)
    H = Math.max(1, innerHeight)
    dpr = Math.min(2, devicePixelRatio || 1)
    const r = rng.fork(`tile/${Math.round(W / 50)}x${Math.round(H / 50)}`)
    const area = W * H
    paintTile(far, Math.round((area / 1700) * moonWash), 0.35, 0.9, 0.25, 0.75, true, r)
    paintTile(mid, Math.round((area / 9000) * moonWash), 0.7, 1.5, 0.5, 0.95, false, r)
    spikes(mid, Math.max(3, Math.round(area / 180000)), r)
    live.width = Math.round(W * dpr)
    live.height = Math.round(H * dpr)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    const n = Math.round(Math.min(70, area / 16000))
    twinklers = Array.from({ length: n }, () => ({
      x: r() * W, y: r() * H, s: r.float(0.8, 1.9), base: r.float(0.35, 0.75), amp: r.float(0.15, 0.4),
      w: r.float(0.35, 1.3), ph: r() * TAU, c: r.pick(COLORS),
    }))
    if (align) retarget()
    parallax()
    draw(performance.now())
  }

  function parallax() {
    const y = ctx.mercy.on ? 0 : scrollY
    far.style.transform = `translate3d(0, ${-((y * PAR.far) % H)}px, 0)`
    mid.style.transform = `translate3d(0, ${-((y * PAR.mid) % H)}px, 0)`
  }

  // ---- the Alignment -------------------------------------------------------------------------
  let alignText = '2147483647'
  function targets(text) {
    const lines = W < 720 ? [text.slice(0, Math.ceil(text.length / 2)), text.slice(Math.ceil(text.length / 2))] : [text]
    const off = document.createElement('canvas')
    const ow = Math.round(W), oh = Math.round(H)
    off.width = ow; off.height = oh
    const oc = off.getContext('2d')
    const longest = Math.max(...lines.map((l) => l.length))
    let size = Math.min((W * 0.86) / (longest * 0.62), H / (lines.length * 1.5))
    oc.font = `700 ${size}px "Century Gothic", Futura, "Trebuchet MS", sans-serif`
    oc.textAlign = 'center'
    oc.textBaseline = 'middle'
    oc.fillStyle = '#fff'
    lines.forEach((l, i) => oc.fillText(l, W / 2, H * 0.42 + (i - (lines.length - 1) / 2) * size * 1.1))
    const data = oc.getImageData(0, 0, ow, oh).data
    const pts = []
    for (let y = 0; y < oh; y += 3) for (let x = 0; x < ow; x += 3) if (data[(y * ow + x) * 4 + 3] > 140) pts.push([x, y])
    // A random subset of the ink is a stipple: sparse enough to be stars, dense enough to read.
    return rng.fork('align/shuffle').shuffle(pts).slice(0, W < 720 ? 380 : 720)
  }
  function retarget() {
    const t = targets(alignText)
    const r = rng.fork('align/start')
    align.pts = t.map(([x, y], i) => ({
      x0: align.pts[i]?.x0 ?? r() * W, y0: align.pts[i]?.y0 ?? r() * H,
      x1: x, y1: y, c: r.pick(COLORS), s: r.float(0.8, 1.6), d: r.float(0, 0.25),
    }))
  }
  function startAlign(text) {
    alignText = text || alignText
    align = { pts: [], t0: performance.now(), mode: 'in' }
    retarget()
    kick()
  }
  function disperse() {
    if (!align) return
    const r = rng.fork('align/out')
    const now = performance.now()
    align.pts.forEach((p) => {
      const k = progress(p, now)
      p.x0 = p.x0 + (p.x1 - p.x0) * k; p.y0 = p.y0 + (p.y1 - p.y0) * k
      p.x1 = r() * W; p.y1 = r() * H
    })
    align.t0 = now
    align.mode = 'out'
    align.settled = false
    kick()
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  function progress(p, now) {
    if (ctx.mercy.on) return 1
    const dur = align.mode === 'in' ? 11000 : 5000
    const t = Math.min(1, Math.max(0, ((now - align.t0) / dur - p.d) / (1 - p.d)))
    return ease(t)
  }

  // ---- drawing -------------------------------------------------------------------------------
  function draw(now) {
    g.clearRect(0, 0, W, H)
    const still = ctx.mercy.on
    const yoff = still ? 0 : (scrollY * PAR.mid) % H
    for (const s of twinklers) {
      let y = s.y - yoff
      if (y < 0) y += H
      const a = still ? s.base : s.base + s.amp * Math.sin((now / 1000) * s.w + s.ph)
      g.globalAlpha = Math.max(0, Math.min(1, a))
      g.fillStyle = s.c
      g.beginPath(); g.arc(s.x, y, s.s, 0, TAU); g.fill()
    }
    for (const m of meteors) {
      const k = (now - m.t0) / m.dur
      const hx = m.x + m.vx * k, hy = m.y + m.vy * k
      const tx = hx - m.vx * 0.35, ty = hy - m.vy * 0.35
      const grd = g.createLinearGradient(tx, ty, hx, hy)
      grd.addColorStop(0, 'rgba(220,240,255,0)')
      grd.addColorStop(1, 'rgba(235,248,255,0.85)')
      g.globalAlpha = Math.sin(Math.PI * Math.min(1, k)) * 0.9
      g.strokeStyle = grd
      g.lineWidth = 1.3
      g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke()
    }
    if (align) {
      let settled = true
      for (const p of align.pts) {
        const k = progress(p, now)
        if (k < 1) settled = false
        const x = p.x0 + (p.x1 - p.x0) * k
        const y = p.y0 + (p.y1 - p.y0) * k
        const a = align.mode === 'in' ? Math.min(0.95, 0.08 + 1.6 * k) : 0.95 * (1 - k)
        g.globalAlpha = a
        g.fillStyle = p.c
        g.beginPath(); g.arc(x, y, p.s, 0, TAU); g.fill()
        if (align.mode === 'in' && k > 0.98) {
          g.globalAlpha = 0.12
          g.beginPath(); g.arc(x, y, p.s * 3.2, 0, TAU); g.fill()
        }
      }
      align.settled = settled
      if (settled && align.mode === 'out') align = null
    }
    g.globalAlpha = 1
  }

  // One chain of frames at a time (gen), and between the slow frames of twinkling the page is left
  // alone entirely: the next frame is asked for by a timer, not by a waiting requestAnimationFrame.
  let gen = 0
  const isMoving = () => meteors.length > 0 || Boolean(align && !align.settled)
  function loop(now, g) {
    if (!running || g !== gen) return
    if (now - last >= 1000 / (isMoving() ? FPS_MOVING : FPS_REST) - 4) {
      last = now
      if (now > nextMeteor) {
        nextMeteor = now + rng.float(22000, 55000)
        const fromLeft = rng.chance(0.5)
        meteors.push({
          x: rng.float(0.1, 0.9) * W, y: rng.float(0.05, 0.45) * H,
          vx: (fromLeft ? 1 : -1) * rng.float(220, 360), vy: rng.float(90, 170),
          t0: now, dur: rng.float(1300, 1900),
        })
      }
      meteors = meteors.filter((m) => now - m.t0 < m.dur)
      draw(now)
    }
    const next = (t) => loop(t, g)
    if (isMoving()) life.raf(next)
    else life.timeout(() => life.raf(next), 1000 / FPS_REST - 12)
  }

  function kick() {
    const want = !ctx.mercy.on && !document.hidden && !life.dead && !paused
    if (want && !running) {
      running = true
      const g = ++gen
      life.raf((t) => loop(t, g))
    } else if (!want) {
      running = false
      gen++
      meteors = []
      draw(performance.now())
    }
    if (!want) parallax()
  }

  let resizeTimer = null
  life.listen(window, 'resize', () => {
    // A phone's address bar folding away as you scroll changes only the height, a little, and often:
    // the tiles simply stretch with the glass then. They are repainted when the sky really changes shape.
    if (Math.round(innerWidth) === Math.round(W) && Math.abs(innerHeight - H) < H * 0.18) return
    resizeTimer?.()
    resizeTimer = life.timeout(build, 180)
  })
  let scrollQueued = false
  life.listen(window, 'scroll', () => {
    if (ctx.mercy.on || scrollQueued) return
    scrollQueued = true
    life.raf(() => { scrollQueued = false; parallax() })
  }, { passive: true })
  life.listen(document, 'visibilitychange', kick)
  life.on(ctx.bus, 'mercy:change', () => { parallax(); kick() })

  return {
    el,
    start() { build(); kick() },
    align: startAlign,
    disperse,
    get aligned() { return Boolean(align && align.mode === 'in') },
    pause(on = true) { paused = on; kick() },
  }
}
