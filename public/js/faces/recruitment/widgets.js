// THE RECRUITMENT OFFICE — moving parts. Every loop checks Mercy and document.hidden (Canon §9),
// and everything is registered with `life` so destroy() can take it all back.
import { h } from '../../lib/dom.js'
import { vars } from './art.js'

// A small lifecycle keeper: listeners, bus subscriptions, timers and frames, all undone at destroy().
export function makeLife() {
  const undo = []
  const life = {
    dead: false,
    add(fn) { undo.push(fn); return fn },
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts)
      undo.push(() => target.removeEventListener(type, fn, opts))
    },
    bus(ctx, event, fn) { undo.push(ctx.bus.on(event, fn)) },
    timeout(fn, ms) {
      const t = setTimeout(() => { if (!life.dead) fn() }, ms)
      undo.push(() => clearTimeout(t))
      return t
    },
    interval(fn, ms) {
      const t = setInterval(() => { if (!life.dead) fn() }, ms)
      undo.push(() => clearInterval(t))
      return t
    },
    destroy() {
      life.dead = true
      for (const fn of undo.splice(0).reverse()) {
        try { fn() } catch {}
      }
    },
  }
  return life
}

// The cursor trail of 1997: little stars that fall off the pointer. Mouse only; never under Mercy.
export function sparkleTrail(ctx, life, host, rng) {
  const layer = h('div', { class: 'rc-trail', 'aria-hidden': 'true' })
  host.append(layer)
  const colors = ['#ffffff', '#ffff00', '#00ffff', '#ff66ff', '#ffcc00', '#99ff99']
  const shapes = ['✦', '✧', '*', '✶', '+']
  let last = 0
  let live = 0
  let i = 0
  life.on(window, 'pointermove', (e) => {
    if (ctx.mercy.on || document.hidden || e.pointerType !== 'mouse') return
    const now = performance.now()
    if (now - last < 48 || live >= 14) return
    last = now
    const s = h('span', { class: 'rc-spark' }, shapes[i % shapes.length])
    vars(s, {
      '--x': `${e.clientX}px`,
      '--y': `${e.clientY}px`,
      '--c': colors[i % colors.length],
      '--dx': `${rng.int(-18, 18)}px`,
      '--dy': `${rng.int(18, 46)}px`,
      '--s': rng.float(0.7, 1.3).toFixed(2),
    })
    i++
    live++
    const done = () => { s.remove(); live = Math.max(0, live - 1) }
    s.addEventListener('animationend', done, { once: true })
    setTimeout(done, 1600)
    layer.append(s)
  }, { passive: true })
  life.bus(ctx, 'mercy:change', ({ on }) => {
    if (on) { layer.replaceChildren(); live = 0 }
  })
  life.add(() => layer.remove())
}

// A little Win95 window that appears inside the tab (never a real popup). One at a time.
export function makeToaster(life, host) {
  let current = null
  let timer = null
  let returnTo = null
  function close() {
    clearTimeout(timer)
    // If the keyboard was inside the window, hand it back to where it was before the window opened.
    const hadFocus = Boolean(current?.contains(document.activeElement))
    current?.remove()
    current = null
    if (hadFocus && returnTo?.isConnected) returnTo.focus({ preventScroll: true })
    returnTo = null
  }
  function show({ title, body, ms = 16000, className = '', focus = false }) {
    close()
    returnTo = focus && document.activeElement !== document.body ? document.activeElement : null
    const closeBtn = h('button', { type: 'button', class: 'rc-toast__x', 'aria-label': 'Close' }, '×')
    const el = h('section', { class: `rc-toast ${className}`.trim(), role: 'status', 'aria-live': 'polite', tabindex: '-1' },
      h('div', { class: 'rc-win__title' }, h('span', {}, title), closeBtn),
      h('div', { class: 'rc-toast__body' }, body),
    )
    closeBtn.addEventListener('click', close)
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
    host.append(el)
    current = el
    if (focus) el.focus({ preventScroll: true })
    if (ms) timer = setTimeout(close, ms)
    return el
  }
  life.add(close)
  return { show, close, get open() { return current } }
}

// The screensaver that arrives after 108 seconds of stillness: a warp starfield with THE CASCADE
// bouncing between the edges. Any input dismisses it. Under Mercy it is a still picture.
export function makeScreensaver(ctx, life, host, rng) {
  let el = null
  let raf = 0
  let stars = []
  let logo = null
  let canvas = null
  let g = null
  let pos = null
  const hues = [0, 45, 60, 120, 180, 220, 280, 320]
  let hueIndex = 0

  let box = { w: 300, h: 60 }
  function resize() {
    if (!canvas) return
    // Measured here, not in the loop, so the loop never asks the page for layout.
    if (logo) box = { w: logo.offsetWidth, h: logo.offsetHeight }
    canvas.width = Math.max(1, Math.floor(innerWidth / 2))
    canvas.height = Math.max(1, Math.floor(innerHeight / 2))
  }

  function drawStatic() {
    if (!g) return
    g.fillStyle = '#000'
    g.fillRect(0, 0, canvas.width, canvas.height)
    for (const s of stars) {
      const k = 120 / s.z
      const x = canvas.width / 2 + s.x * k
      const y = canvas.height / 2 + s.y * k
      g.fillStyle = s.z < 30 ? '#fff' : '#889'
      g.fillRect(x, y, 1, 1)
    }
  }

  function tick() {
    raf = 0
    if (!el || life.dead) return
    if (ctx.mercy.on) { drawStatic(); return }
    if (document.hidden) { raf = requestAnimationFrame(tick); return }
    const w = canvas.width
    const hgt = canvas.height
    g.fillStyle = 'rgba(0,0,0,0.35)'
    g.fillRect(0, 0, w, hgt)
    for (const s of stars) {
      s.z -= 0.9
      if (s.z < 1) { s.x = rng.float(-w, w); s.y = rng.float(-hgt, hgt); s.z = 160 }
      const k = 120 / s.z
      const x = w / 2 + s.x * k
      const y = hgt / 2 + s.y * k
      const size = s.z < 40 ? 2 : 1
      g.fillStyle = s.z < 60 ? '#ffffff' : '#8a8aa8'
      g.fillRect(x, y, size, size)
    }
    // The bouncing logo (moves about 70px per second; it only changes colour when it hits a wall).
    const bw = box.w
    const bh = box.h
    pos.x += pos.vx
    pos.y += pos.vy
    let bounced = false
    if (pos.x < 0) { pos.x = 0; pos.vx = Math.abs(pos.vx); bounced = true }
    if (pos.y < 0) { pos.y = 0; pos.vy = Math.abs(pos.vy); bounced = true }
    if (pos.x + bw > innerWidth) { pos.x = innerWidth - bw; pos.vx = -Math.abs(pos.vx); bounced = true }
    if (pos.y + bh > innerHeight) { pos.y = innerHeight - bh; pos.vy = -Math.abs(pos.vy); bounced = true }
    if (bounced) {
      hueIndex = (hueIndex + 1) % hues.length
      logo.style.setProperty('--hue', String(hues[hueIndex]))
    }
    logo.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px)`
    raf = requestAnimationFrame(tick)
  }

  function show() {
    if (el) return
    canvas = h('canvas', { class: 'rc-saver__sky', 'aria-hidden': 'true' })
    g = canvas.getContext('2d')
    logo = h('div', { class: 'rc-saver__logo', 'aria-hidden': 'true' }, 'THE CASCADE', h('small', {}, '☩ all style descends ☩'))
    el = h('div', { class: 'rc-saver', role: 'status', 'aria-live': 'polite' },
      canvas,
      logo,
      h('p', { class: 'rc-saver__note' }, 'You have been still for 108 seconds, one for each bead of the mala. The Recruitment Office has started its screensaver. Move your mouse or press a key to return. Your place has been kept.'),
    )
    host.append(el)
    resize()
    stars = Array.from({ length: 140 }, () => ({ x: rng.float(-canvas.width, canvas.width), y: rng.float(-canvas.height, canvas.height), z: rng.float(1, 160) }))
    pos = { x: rng.float(20, Math.max(40, innerWidth - 320)), y: rng.float(20, Math.max(40, innerHeight - 160)), vx: 1.15, vy: 0.9 }
    logo.style.setProperty('--hue', String(hues[0]))
    logo.style.transform = `translate(${pos.x}px, ${pos.y}px)`
    if (g) {
      g.fillStyle = '#000'
      g.fillRect(0, 0, canvas.width, canvas.height)
      if (ctx.mercy.on) drawStatic()
      else raf = requestAnimationFrame(tick)
    }
  }

  function hide() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    el?.remove()
    el = null
  }

  life.on(window, 'resize', () => { if (el) resize() })
  life.bus(ctx, 'mercy:change', ({ on }) => {
    if (!el) return
    if (on) { if (raf) cancelAnimationFrame(raf); raf = 0; drawStatic() }
    else if (!raf && g) raf = requestAnimationFrame(tick)
  })
  life.add(hide)
  return { show, hide, get open() { return Boolean(el) } }
}
