// THE ALL-NIGHT LAUNDERETTE (docs/ROADMAP.md §4.1, docs/CANON.md §3). 3:33 a.m., fluorescent, deadpan.
// A row of front-loaders labelled with the CSS-wide keywords: INITIAL, INHERIT, UNSET, REVERT and REVERT-LAYER
// (still in its plastic). Load a badly dressed element from the basket, press START, and the machine really
// applies `all: <keyword>` to it, group by group as the drum turns, then prints a care label of computed
// values, before and after. A div washed in INITIAL comes out display: inline.
//
// The riddle: one garment carries a stain that survives every wash (see launderette/stain.js).
//
// Also in the room: humming tubes (one dims, never more than once every four seconds), a window onto the real
// sky, a clock that always says 3:33, the machine at the back that is always nearly done, a change machine
// (a coin in the slot summons the sound), dryers tumbling the other faces' styles, a notice board that is the
// live Wall, the care-marks poster (the Rosetta fragment), the attendant (back soon, since 1996; the bell on
// the counter gives the riddle's hints), a free sheet of scripture with a lost sock floated into it, a floor
// laid a magic number off true, and lint that gathers while you stay.
//
// Stillness: at 7 s the hum dips, at 33 s a washer starts by itself, at 108 s the machine at the back
// unlatches its door for one breath. Secrets: launderette-riddle, launderette-initial,
// launderette-every-machine, launderette-revert-layer, launderette-absolution, launderette-endless, and the
// temple's own `stillness`.
import { h } from '../lib/dom.js'
import { inscription } from '../lib/glyphs.js'
import { makeLife, s } from './launderette/life.js'
import { HOW_TO, SAYS, RESTLESS } from './launderette/lore.js'
import { makeBasket } from './launderette/garments.js'
import { makeHand, makeBasketUI } from './launderette/basket.js'
import { makeWashers } from './launderette/washers.js'
import { makeWindow, makeTubes, makeClock, makeFloor, makeEndless, makeChanger, makeDryers, outsideOf } from './launderette/room.js'
import { makeBoard } from './launderette/board.js'
import { makeSheet } from './launderette/sheet.js'
import { makeStain } from './launderette/stain.js'
import { makeIron } from './launderette/iron.js'

// The 108-second stillness belongs to the machine at the back (its door unlatches), not to a schism.
export const keeps = ['still']

// For the witness tool: the live instance (set by render, cleared by destroy).
export const debug = {}

export function render(ctx) {
  const life = makeLife()
  const rng = ctx.rng.fork('launderette')
  const fast = ctx.params?.get('debug') === 'launderette'
  const sky = ctx.sky
  const root = h('div', { class: 'lnd', id: 'lnd-room' })
  const live = h('p', { class: 'visually-hidden', 'aria-live': 'polite' })
  let sayTimer = null
  const A = {
    ctx, life, rng, fast, root,
    say(text) {
      sayTimer?.()
      live.textContent = ''
      sayTimer = life.timeout(() => { live.textContent = text }, 40)
    },
  }
  // Each part draws from its own stream, and reads A's callbacks at the moment it needs them.
  const part = (name) => Object.assign(Object.create(A), { rng: rng.fork(name) })

  // ── The parts of the room ──────────────────────────────────────────────────────────────────────────
  const garments = makeBasket(rng.fork('basket'), { lastFace: ctx.memory?.get?.('lastFace', null) })
  const tee = garments.find((g) => g.stained)
  A.hand = makeHand(A)
  A.stateLine = (g) => (g.stained && A.stain ? A.stain.line() : '')
  A.basket = makeBasketUI(A, garments)
  A.washers = makeWashers(A)
  const tubes = makeTubes(part('tubes'))
  let win = makeWindow(part('window'))
  const clock = makeClock(part('clock'))
  const floor = makeFloor(part('floor'))
  const endless = makeEndless(part('endless'))
  const changer = makeChanger(part('changer'))
  const dryers = makeDryers(part('dryers'))
  const board = makeBoard(part('board'))
  const sheet = makeSheet(part('sheet'))
  const iron = makeIron(part('iron'))

  // ── The front: tubes, the window, the lightbox, the clock, the instructions ─────────────────────────
  const howTo = h('section', { class: 'lnd-howto', 'aria-labelledby': 'lnd-howto-h' },
    h('h2', { id: 'lnd-howto-h' }, 'How to wash'),
    h('ol', {}, HOW_TO.map((t) => h('li', {}, t))))
  const front = h('header', { class: 'lnd-front' },
    tubes.el,
    h('div', { class: 'lnd-front-grid' },
      win.el,
      h('div', { class: 'lnd-signs' },
        h('div', { class: 'lnd-lightbox' },
          h('p', { class: 'lnd-lightbox-top' }, 'Self service · wash · dry · fold'),
          h('h1', {}, h('span', { class: 'lnd-h1-a' }, 'The All-Night'), ' ', h('span', { class: 'lnd-h1-b' }, 'Launderette')),
          h('p', { class: 'lnd-lightbox-bottom' }, 'Open every night · 3:33 a.m. always')),
        h('p', { class: 'lnd-lede' }, 'Five washes, one property. Each machine applies ', h('code', {}, 'all: <keyword>'), ' to whatever you load into it, for real, and prints a care label of what changed.'),
        h('div', { class: 'lnd-signs-row' }, clock.el, howTo))))

  // ── The floor: the basket and the ironing board on one side; the machines on the tiles, with the care
  //    labels and the change machine beneath them ─────────────────────────────────────────────────────
  const floorSection = h('section', { class: 'lnd-floor', 'aria-labelledby': 'lnd-floor-h' },
    h('h2', { id: 'lnd-floor-h', class: 'visually-hidden' }, 'The washers, the basket and the care labels'),
    h('div', { class: 'lnd-table' }, A.basket.el, iron.el),
    h('div', { class: 'lnd-machines' },
      h('div', { class: 'lnd-machines-row', 'data-hell': 'spare', 'data-secrets-skip': '' }, A.washers.row),
      h('div', { class: 'lnd-kickplate' }, h('span', { class: 'lnd-kick-est', 'aria-hidden': 'true' }, 'EST. 1996'), inscription({ className: 'lnd-inscription' })),
      floor.el,
      h('div', { class: 'lnd-under' }, A.washers.labels.el, changer.el)))

  const back = h('section', { class: 'lnd-back', 'aria-labelledby': 'lnd-back-h' },
    h('h2', { id: 'lnd-back-h', class: 'visually-hidden' }, 'The back of the shop'),
    endless.el, dryers.el)
  const wall = h('div', { class: 'lnd-wall' }, board.board, h('div', { class: 'lnd-wall-side' }, board.poster, board.attendant))
  // Three orange bucket chairs, bolted to nothing. The free sheet was left on the middle one.
  const chair = (i) => s('svg', { class: `lnd-chair${i === 1 ? ' has-sheet' : ''}`, viewBox: '0 0 60 92', style: `--chair-tilt: ${(rng.float(-3, 3)).toFixed(1)}deg`, focusable: 'false' },
    s('path', { class: 'lnd-chair-legs', d: 'M15 54 L10 90 M45 54 L50 90 M13 72 L47 72' }),
    s('path', { class: 'lnd-chair-back', d: 'M9 50 Q4 20 13 7 Q30 -1 47 7 Q56 20 51 50 Q30 56 9 50 Z' }),
    s('path', { class: 'lnd-chair-seat', d: 'M6 49 Q30 60 54 49 L54 54 Q30 64 6 54 Z' }),
    i === 1 ? s('path', { class: 'lnd-chair-paper', d: 'M17 44 L41 42 L43 51 L19 53 Z' }) : null)
  const chairs = h('div', { class: 'lnd-chairs', 'aria-hidden': 'true' }, [0, 1, 2].map(chair))
  const lounge = h('div', { class: 'lnd-lounge' }, chairs, sheet.el)
  const roads = ['the/spin/cycle', 'all/is/initial', 'one/sock/floated/left', 'revert/to/the/old/law', 'nearly/done']
  const foot = h('footer', { class: 'lnd-foot' },
    h('p', {}, 'The All-Night Launderette · est. 1996 · the attendant will be back soon'),
    h('nav', { 'aria-label': 'Roads out of the launderette' },
      roads.map((r, i) => [i ? ' · ' : '', h('a', { href: `/verse/${r}` }, `/verse/${r}`)])))

  root.append(h('div', { class: 'lnd-light', 'aria-hidden': 'true' }), front, floorSection, back, wall, lounge, foot, live)
  root.setAttribute('style', tubes.vars)
  ctx.root.append(root)

  // ── The sky: outside is real, inside is always 3:33 ─────────────────────────────────────────────────
  root.dataset.outside = win.out
  for (const omen of ['witching', 'full-moon', 'new-moon', 'eclipse', 'thirty-three', 'night']) root.classList.toggle(`is-${omen}`, sky.has(omen))

  // ── The stain ──────────────────────────────────────────────────────────────────────────────────────
  A.onLifted = ({ again, byHand }) => {
    A.say(`${SAYS.lifted} The machine at the back has finished, for the first time.`)
    root.classList.add('is-blessed')
    endless.finish(A.stain.certificate({ again, byHand }))
    for (const [i, f] of [1046.5, 1318.5, 1568].entries()) ctx.audio?.bell?.({ kind: 'gm', freq: f, gain: 0.06, delay: 0.25 * i, decay: 0.9 })
    A.basket.paint(tee)
    showTicket()
  }
  A.stain = makeStain(A, tee)
  // A ticket on the tee's slot points to the certificate, wherever on the page the machine at the back is.
  function showTicket() {
    const slot = A.basket.slotOf(tee)
    if (!slot || slot.li.querySelector('.lnd-ticket')) return
    const go = h('button', { type: 'button', class: 'lnd-ticket' }, h('b', {}, 'CLEAN'), ' Read the certificate at the machine at the back')
    life.on(go, 'click', () => {
      endless.el.scrollIntoView({ block: 'center', behavior: ctx.mercy?.on ? 'auto' : 'smooth' })
      endless.el.querySelector('.lnd-cert')?.focus({ preventScroll: true })
    })
    slot.li.append(go)
  }

  // ── Washing: the secrets the machines keep ──────────────────────────────────────────────────────────
  A.onWashed = ({ g, kw, before, after, every }) => {
    const was = (p) => before.find((r) => r.prop === p)?.value
    const now = (p) => after.find((r) => r.prop === p)?.value
    if (kw === 'initial' && g.tagName === 'div' && was('display') !== 'inline' && now('display') === 'inline') {
      ctx.memory?.markSecret?.('launderette-initial', { face: 'launderette' })
    }
    if (kw === 'revert-layer' && g.inline) ctx.memory?.markSecret?.('launderette-revert-layer', { face: 'launderette' })
    if (every) ctx.memory?.markSecret?.('launderette-every-machine', { face: 'launderette' })
    if (g.stained) A.stain.washed(kw)
    A.basket.paint(g)
  }
  A.onSock = () => {
    board.sockCleared()
    ctx.memory?.markSecret?.('launderette-absolution', { face: 'launderette' })
  }
  A.onEndless = () => ctx.memory?.markSecret?.('launderette-endless', { face: 'launderette' })

  // Escape puts down whatever is in the hand.
  life.on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && A.hand.g) A.hand.drop()
  })

  // ── Stillness (CANON §3.6) ─────────────────────────────────────────────────────────────────────────
  let selfStarts = 0
  life.bus(ctx.bus, 'behavior:still', ({ seconds }) => {
    if (seconds === 7) root.classList.add('is-hushed')
    if (seconds === 33) {
      const m = A.washers.selfStart(rng.fork(`self/${selfStarts++}`))
      if (m) A.say(SAYS.self)
      ctx.memory?.markSecret?.('stillness', { face: 'launderette' })
    }
    if (seconds === 108) endless.breathe()
  })
  life.bus(ctx.bus, 'behavior:stir', () => root.classList.remove('is-hushed'))

  // ── Restlessness: the machines walk further; the stain trembles harder ──────────────────────────────
  let restlessSaid = false
  life.bus(ctx.bus, 'behavior:restless', () => {
    root.classList.add('is-restless')
    if (!restlessSaid) { restlessSaid = true; A.say(RESTLESS) }
  })
  life.bus(ctx.bus, 'behavior:calm', () => root.classList.remove('is-restless'))
  life.bus(ctx.bus, 'hell:inversion', ({ on } = {}) => root.classList.toggle('is-inverted', on !== false))

  // ── The first ten seconds: the tubes strike, and one door clunks by itself ──────────────────────────
  root.classList.add('is-striking')
  life.timeout(() => root.classList.remove('is-striking'), 1800)
  const clunk = rng.pick(A.washers.machines)
  life.timeout(() => {
    if (ctx.mercy?.on || document.hidden) return
    clunk.el.classList.add('is-clunk')
    life.timeout(() => clunk.el.classList.remove('is-clunk'), 900)
  }, rng.int(3800, 6200))

  // ── The hour changes while you wait: the window looks out again every two minutes, and when the day
  //    outside has turned (dusk, night, dawn) it is redrawn. Inside, it is still 3:33. ─────────────────────
  let looks = 0
  life.interval(() => {
    const now = ctx.readSky?.()
    if (!now || outsideOf(now) === root.dataset.outside) return
    const fresh = makeWindow(part(`window/${++looks}`), now)
    win.el.replaceWith(fresh.el)
    win = fresh
    root.dataset.outside = fresh.out
  }, 120000)

  A.washers.paint()
  A.basket.paintAll()
  Object.assign(debug, { ctx, A, garments, tee, endless, board, sheet, floor, changer, stain: A.stain })

  return () => {
    life.destroy()
    root.remove()
    for (const k of Object.keys(debug)) delete debug[k]
  }
}
