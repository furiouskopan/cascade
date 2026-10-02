// THE BASKET and the visitor's hand. A garment is picked up with its tag (a button: click, Enter or Space)
// and loaded with a machine's button, or dragged by its hanger onto a machine with a mouse or a pen.
// Escape puts down whatever is in the hand. A finger taps the tag or the hanger (only mice and pens drag), so
// it can still scroll the page.
import { h } from '../../lib/dom.js'
import { SAYS } from './lore.js'
import { redress } from './garments.js'
import { s } from './life.js'

// A wire hanger: a hook, a shoulder and a bar.
const wire = () => s('svg', { class: 'lnd-hanger-wire', viewBox: '0 0 70 18', 'aria-hidden': 'true', focusable: 'false' },
  s('path', { d: 'M35 8 C35 5 38 4.6 38.6 3 C39.2 1 37.4 0.6 36 1.2 M35 8 L4 16 L66 16 Z' }))

export function makeHand(A) {
  const hand = {
    g: null,
    pick(g) {
      if (!g || g.where) return
      hand.g = g
      A.root.classList.add('is-holding')
      A.basket?.paintAll()
      A.washers?.paint()
      A.say(SAYS.pick(g.name))
    },
    drop(quiet) {
      const g = hand.g
      if (!g) return
      hand.g = null
      A.root.classList.remove('is-holding')
      A.basket?.paintAll()
      A.washers?.paint()
      if (!quiet) A.say(SAYS.drop(g.name))
    },
  }
  return hand
}

export function makeBasketUI(A, garments) {
  const { life } = A
  const slots = new Map()
  const list = h('ul', { class: 'lnd-basket-list' })
  for (const g of garments) {
    const one = slot(g)
    slots.set(g, one)
    list.append(one.li)
  }
  const el = h('section', { class: 'lnd-basket', 'aria-labelledby': 'lnd-basket-h', 'data-hell': 'spare', 'data-secrets-skip': '' },
    h('h2', { id: 'lnd-basket-h', class: 'lnd-plate' }, 'The basket'),
    h('p', { class: 'lnd-basket-note' }, 'Tonight\'s washing. Pick a garment up by its tag, then press a machine\'s button. Or drag it by the hanger.'),
    list)

  function slot(g) {
    const cloth = h('div', { class: 'lnd-cloth', 'aria-hidden': 'true' }, g.el)
    const hanger = h('div', { class: 'lnd-hanger', title: g.name }, wire(), cloth)
    const state = h('span', { class: 'lnd-tag-state' }, 'in the basket')
    const what = document.createTextNode(` ${g.what}`)
    const tag = h('button', { type: 'button', class: 'lnd-tag', 'aria-pressed': 'false' },
      h('span', { class: 'lnd-tag-name' }, g.name),
      h('span', { class: 'lnd-tag-what' }, h('code', {}, `<${g.tagName}>`), what),
      state)
    const again = h('button', { type: 'button', class: 'lnd-redress', hidden: true }, 'dress it again')
    const li = h('li', { class: `lnd-slot lnd-slot--${g.kind}`, 'data-g': g.id }, hanger, tag, again)
    life.on(tag, 'click', () => {
      if (g.where) {
        // It is in a machine: say so, and hand the keyboard to that machine.
        A.say(`${g.name} is in ${g.where.w.label}.`)
        g.where.go.focus({ preventScroll: false })
        return
      }
      if (A.hand.g === g) A.hand.drop()
      else A.hand.pick(g)
    })
    life.on(again, 'click', () => {
      if (g.where) return
      redress(g)
      paint(g)
      A.say(`${g.name} is dressed in its old clothes again.`)
      A.onRedress?.(g)
      tag.focus()
    })
    drag(g, hanger)
    return { li, cloth, hanger, tag, state, again, what }
  }

  function paint(g) {
    const sl = slots.get(g)
    if (!sl) return
    const held = A.hand.g === g
    sl.tag.setAttribute('aria-pressed', String(held))
    sl.li.classList.toggle('is-held', held)
    sl.li.classList.toggle('is-away', Boolean(g.where))
    sl.state.textContent = g.where ? `in ${g.where.w.label}` : held ? 'in your hand' : g.washes.length ? `washed in ${g.washes.map((k) => k.toUpperCase()).join(', ')}` : 'in the basket'
    if (A.stateLine?.(g)) sl.state.textContent += ` · ${A.stateLine(g)}`
    if (g.ironed?.length) sl.state.textContent += ` · ironed: ${g.ironed.map(([p, v]) => `${p}: ${v}`).join('; ')}`
    if (g.stained && A.stain?.lifted) sl.what.data = ' a white tee, clean at last'
    sl.again.hidden = Boolean(g.where) || !(g.washes.length || g.el.getAttribute('style') !== (g.inline || null))
  }
  const paintAll = () => garments.forEach(paint)

  // ── Dragging by the hanger (mouse and pen) ──────────────────────────────────────────────────────────
  function drag(g, hanger) {
    let start = null
    let ghost = null
    let over = null
    let dragged = false
    // A tap or a click on the hanger picks the garment up, like its tag; a drag that just ended does not.
    life.on(hanger, 'click', () => {
      if (dragged) { dragged = false; return }
      if (g.where) return
      if (A.hand.g === g) A.hand.drop()
      else A.hand.pick(g)
    })
    const setOver = (m) => {
      if (over === m) return
      over?.el.classList.remove('is-target')
      over = m
      over?.el.classList.add('is-target')
    }
    const end = () => {
      setOver(null)
      ghost?.remove()
      ghost = null
      start = null
      A.root.classList.remove('is-dragging')
    }
    life.on(hanger, 'pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0 || g.where) return
      start = { x: e.clientX, y: e.clientY, id: e.pointerId }
      try { hanger.setPointerCapture(e.pointerId) } catch {}
    })
    life.on(hanger, 'pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return
      if (!ghost) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return
        if (A.hand.g !== g) A.hand.pick(g)
        ghost = h('div', { class: 'lnd-ghost', 'aria-hidden': 'true' }, g.name)
        A.root.append(ghost)
        A.root.classList.add('is-dragging')
      }
      ghost.style.translate = `${e.clientX + 12}px ${e.clientY + 10}px`
      const m = A.washers.machineAt(e.clientX, e.clientY)
      setOver(m && m.state === 'empty' ? m : null)
    })
    life.on(hanger, 'pointerup', (e) => {
      if (!start) return
      const was = Boolean(ghost)
      const m = was ? A.washers.machineAt(e.clientX, e.clientY) : null
      end()
      if (!was) return // a plain click: the click listener picks it up
      dragged = true
      life.timeout(() => { dragged = false }, 400)
      if (m && m.state === 'empty') A.washers.load(m, g)
    })
    life.on(hanger, 'pointercancel', end)
    life.on(hanger, 'lostpointercapture', () => { if (ghost) end() })
  }

  // Nothing in the hand and a machine was pressed: the basket raises its hand.
  function beckon() {
    el.classList.remove('is-beckoning')
    void el.offsetWidth
    el.classList.add('is-beckoning')
    life.timeout(() => el.classList.remove('is-beckoning'), 1600)
  }

  // A garment comes back from a machine to its own slot.
  function home(g) {
    slots.get(g)?.cloth.append(g.el)
    paint(g)
  }

  return { el, paint, paintAll, home, beckon, slotOf: (g) => slots.get(g), update: paint }
}
