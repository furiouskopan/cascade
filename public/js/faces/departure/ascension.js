// THE DEPARTURE. Elements on this page really do leave their containers: the node is lifted out of
// its parent, carries its computed style with it inline (there is no Cascade where it is going), and
// rises through a layer at z-index 2147483647 into the hold of the Mothership. A ghost keeps its
// place in the flow (visibility: hidden's cousin: the same text, drawn in the Clear Light, so screen
// readers still read it). Open your devtools and look inside .dep-hold: they are all there.
// Canon §9: this is only ever about DOM elements.
import { h } from '../../lib/dom.js'
import { svgNode, vars, describe, hms } from './util.js'

const CARRY = ['font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'letter-spacing', 'word-spacing', 'text-transform', 'line-height', 'color', 'text-shadow', 'font-variant-caps']
const MAX_ABOARD = 21

function shipSvg() {
  // The Mothership, seen slightly from below: dome, hull, a ring of ports, three landing spheres, and
  // the emitter from which the beam descends.
  let ports = ''
  for (let i = 0; i < 17; i++) {
    const t = Math.PI * (0.06 + (i / 16) * 0.88)
    const x = 300 - Math.cos(t) * 262
    const y = 126 + Math.sin(t) * 17
    ports += `<ellipse class="dep-port" style="--i:${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5.2" ry="3.4"/>`
  }
  return svgNode(`<svg class="dep-ship-svg" viewBox="0 0 600 240" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="dep-hull" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5d6fa6"/><stop offset="0.45" stop-color="#232d57"/><stop offset="1" stop-color="#0c1130"/>
      </linearGradient>
      <linearGradient id="dep-dome" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e9fbff" stop-opacity="0.9"/><stop offset="1" stop-color="#6fb7ff" stop-opacity="0.15"/>
      </linearGradient>
      <radialGradient id="dep-emit" r="0.5">
        <stop offset="0" stop-color="#ffffff"/><stop offset="0.4" stop-color="#c9f4ff"/><stop offset="1" stop-color="#7fd4ff" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="dep-sphere" cx="0.35" cy="0.35" r="0.7">
        <stop offset="0" stop-color="#dfe8ff"/><stop offset="0.5" stop-color="#6a79b0"/><stop offset="1" stop-color="#1b2248"/>
      </radialGradient>
    </defs>
    <path d="M196 112 Q300 -8 404 112 Z" fill="url(#dep-dome)" stroke="#dff5ff" stroke-width="1.6"/>
    <path d="M226 96 Q300 30 374 96" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="1"/>
    <g class="dep-dome-windows" fill="#fff6c9">
      <rect x="252" y="80" width="14" height="10" rx="2"/><rect x="293" y="72" width="14" height="10" rx="2"/><rect x="334" y="80" width="14" height="10" rx="2"/>
    </g>
    <ellipse cx="300" cy="118" rx="292" ry="36" fill="url(#dep-hull)" stroke="#cfe6ff" stroke-width="1.6"/>
    <ellipse cx="300" cy="112" rx="250" ry="22" fill="none" stroke="#a7c7ff" stroke-opacity=".4"/>
    <text x="300" y="109" text-anchor="middle" class="dep-ship-text">Z-INDEX 2147483647 · THE HIGHEST HEAVEN</text>
    <g class="dep-ports">${ports}</g>
    <path d="M22 128 Q300 214 578 128" fill="#0b1030" stroke="#8fb4ff" stroke-opacity=".6" stroke-width="1.2"/>
    <ellipse cx="300" cy="160" rx="130" ry="14" fill="none" stroke="#9ad8ff" stroke-opacity=".45"/>
    <ellipse cx="300" cy="166" rx="84" ry="9" fill="none" stroke="#9ad8ff" stroke-opacity=".6"/>
    <circle cx="222" cy="182" r="12" fill="url(#dep-sphere)"/><circle cx="300" cy="192" r="12" fill="url(#dep-sphere)"/><circle cx="378" cy="182" r="12" fill="url(#dep-sphere)"/>
    <ellipse class="dep-emitter" cx="300" cy="172" rx="46" ry="13" fill="url(#dep-emit)"/>
  </svg>`)
}

export function ascension(ctx, life, rng, { onDepart, onReturn } = {}) {
  const risers = h('div', { class: 'dep-risers' })
  const hold = h('div', { class: 'dep-hold', hidden: true, 'data-note': 'The hold of the Mothership. Every element that left its container this visit is kept here, with its computed style carried inline.' })
  const speech = h('div', { class: 'dep-speech' })
  const beam = h('div', { class: 'dep-beam' })
  const ship = h('div', { class: 'dep-ship' }, h('div', { class: 'dep-ship-bob' }, beam, shipSvg(), hold))
  const el = h('div', { class: 'dep-heaven', 'aria-hidden': 'true' }, ship, risers, speech)

  const records = [] // { id, el, ghost, from, at, text, reason, state: 'rising'|'aboard' }
  let seq = 0
  let rising = 0
  const listeners = new Set()
  const notify = () => { for (const fn of listeners) fn(records) }

  function visible(e) {
    const r = e.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && r.bottom > 40 && r.top < innerHeight - 40 && r.right > 0 && r.left < innerWidth
  }

  function candidates(scope = ctx.root) {
    return [...scope.querySelectorAll('.dep-can')].filter((e) => !e.closest('.dep-heaven') && !e.closest('.dep-ghost') && !e.classList.contains('dep-ghost'))
  }

  function beamOn() {
    ship.classList.add('is-beaming')
  }
  function beamOff() {
    if (!rising) ship.classList.remove('is-beaming')
  }

  // Lift one element out of its container and send it up.
  function depart(target, { reason = 'drift' } = {}) {
    if (ctx.mercy.on || !target?.isConnected || target.closest('.dep-heaven')) return null
    const rect = target.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    const cs = getComputedStyle(target)
    const id = `d${++seq}`
    const ghost = target.cloneNode(true)
    for (const n of [ghost, ...ghost.querySelectorAll('[id]')]) n.removeAttribute('id') // one name, one element
    ghost.classList.remove('dep-can', 'dep-sighted', 'dep-returned')
    ghost.classList.add('dep-ghost')
    ghost.dataset.ghostOf = id
    ghost.title = 'position: absolute. It has left the flow; its place is kept. Click to call it back.'
    const from = describe(target.parentElement, ctx.root)
    const text = (target.textContent || '').replace(/\s+/g, ' ').trim() || target.dataset.name || `<${target.tagName.toLowerCase()}>`
    // The departed carry their computed style inline, like pilgrims carrying water.
    for (const p of CARRY) target.style.setProperty(p, cs.getPropertyValue(p))
    if (cs.color === 'rgba(0, 0, 0, 0)') target.style.setProperty('color', '#e8f4ff')
    const shipBox = ship.getBoundingClientRect()
    const descended = ship.classList.contains('is-descended')
    const tx = innerWidth / 2
    const ty = descended ? shipBox.top + shipBox.height * 0.72 : Math.max(18, shipBox.height * 0.22)
    vars(target, {
      x: `${rect.left.toFixed(1)}px`, y: `${rect.top.toFixed(1)}px`, w: `${rect.width.toFixed(1)}px`, h: `${rect.height.toFixed(1)}px`,
      dx: `${(tx - (rect.left + rect.width / 2)).toFixed(1)}px`, dy: `${(ty - (rect.top + rect.height / 2)).toFixed(1)}px`,
      sway: `${rng.float(-70, 70).toFixed(1)}px`, spin: `${rng.float(-50, 50).toFixed(1)}deg`,
      dur: `${(reason === 'drift' ? rng.float(8, 12) : rng.float(6, 8.5)).toFixed(2)}s`,
    })
    target.dataset.departedFrom = from
    target.dataset.departedAt = hms(ctx.clock())
    target.setAttribute('aria-hidden', 'true')
    target.replaceWith(ghost)
    target.classList.add('dep-risen')
    risers.append(target)
    const named = !(target.textContent || '').trim() && Boolean(target.dataset.name)
    const rec = { id, el: target, ghost, from, at: target.dataset.departedAt, text: text.slice(0, 40), named, reason, state: 'rising' }
    records.push(rec)
    rising++
    beamOn()
    // Start rising on the next frame, once it has been placed where it used to be.
    life.raf(() => life.raf(() => target.classList.add('is-rising')))
    let done = false
    const board = () => {
      if (done || rec.state !== 'rising') return
      done = true
      rising = Math.max(0, rising - 1)
      target.classList.remove('is-rising')
      hold.append(target)
      rec.state = 'aboard'
      beamOff()
      notify()
    }
    life.listen(target, 'animationend', (e) => { if (e.animationName === 'dep-rise') board() })
    life.timeout(board, (parseFloat(target.style.getPropertyValue('--dur')) || 12) * 1000 + 1500)
    notify()
    onDepart?.(rec)
    // Too many aboard: the oldest is sent home.
    const aboard = records.filter((r) => r.state !== 'home')
    if (aboard.length > MAX_ABOARD) recall(aboard[0], { quiet: false })
    return rec
  }

  function clean(e) {
    for (const p of CARRY) e.style.removeProperty(p)
    for (const v of ['x', 'y', 'w', 'h', 'dx', 'dy', 'sway', 'spin', 'dur']) e.style.removeProperty(`--${v}`)
    if (!e.getAttribute('style')) e.removeAttribute('style')
    e.classList.remove('dep-risen', 'is-rising')
    e.removeAttribute('aria-hidden')
    delete e.dataset.departedFrom
    delete e.dataset.departedAt
  }

  // Call a departed element back down into its old place.
  function recall(rec, { quiet = false } = {}) {
    if (!rec || rec.state === 'home') return
    if (rec.state === 'rising') rising = Math.max(0, rising - 1)
    rec.state = 'home'
    const e = rec.el
    clean(e)
    if (rec.ghost.isConnected) {
      rec.ghost.replaceWith(e)
      e.classList.add('dep-returned')
      life.timeout(() => e.classList.remove('dep-returned'), 2600)
    } else {
      e.remove()
    }
    beamOff()
    notify()
    if (!quiet) onReturn?.(rec)
  }

  function recallAll(filter = () => true) {
    const list = records.filter((r) => r.state !== 'home' && filter(r))
    list.forEach((r) => recall(r, { quiet: true }))
    return list.length
  }

  // Clicking a ghost calls its element home.
  life.listen(ctx.root, 'click', (e) => {
    const g = e.target.closest?.('.dep-ghost')
    if (!g) return
    const rec = records.find((r) => r.ghost === g)
    if (rec) recall(rec)
  })

  // When mercy arrives mid-flight, the risers finish at once (CSS is neutralised) and board.
  life.on(ctx.bus, 'mercy:change', ({ on }) => {
    if (!on) return
    for (const r of records) if (r.state === 'rising') r.el.dispatchEvent(new AnimationEvent('animationend', { animationName: 'dep-rise' }))
  })

  function pickAndDepart(opts = {}) {
    const vis = candidates().filter(visible)
    if (!vis.length) return null
    return depart(rng.pick(vis), opts)
  }

  return {
    el,
    ship,
    speech,
    depart,
    pickAndDepart,
    recall,
    recallAll,
    candidates,
    records,
    get rising() { return rising },
    get aboard() { return records.filter((r) => r.state === 'aboard').length },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    setState(state) {
      ship.classList.toggle('is-attentive', state === 'attentive')
      ship.classList.toggle('is-descended', state === 'descended')
    },
  }
}
