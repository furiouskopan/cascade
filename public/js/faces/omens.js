// ŠUMMA, THE OMEN TABLETS (docs/ROADMAP.md §4.2; docs/CANON.md §3). Dry, exact, fatalistic clay.
//
// A scholar's table of unbaked clay tablets under a hard raking light from the upper left. The great tablet
// is an omen series about the Pilgrim's own device: every "If" is a live condition (a media query, an
// @supports or @container rule, the sky, or the Pilgrim's own conduct, with true counts), and every omen
// that holds is fired red and raised, and its "then" really happens to the page, under the same condition,
// in /css/faces/omens.css. Resize the window and the fate is rewritten while you watch.
// Around it: a clay liver whose word is written in the Book (the riddle, faces/omens/liver.js), a ziggurat
// whose terraces are real z-indexes, a personal cylinder seal, an envelope with this hour's letter to the
// king, a bull-headed lyre (the summon), the watch of the sky, a pupil's exercise (the Rosetta), and the
// commentary (scripture).
//
// Secrets kept here (ctx.memory.markSecret):
//   omens-riddle      the liver read in the Book: its word pressed into the clay (the face's riddle)
//   omens-reed        the reed omen appeared: the window stood like a reed (max-aspect-ratio: 1/2)
//   omens-stripped    a forced-colours visitor, who gets a line of their own
//   omens-rewritten   an omen changed while the Pilgrim watched (the window was resized, the theme turned)
//   omens-seal        the cylinder seal rolled one whole turn
//   omens-envelope    the envelope broken open
//   omens-correction  the omen of the hour, pressed into the wrong column, put back
//   omens-restored    a broken edge restored by the editor's hand
//   omens-fired       one hundred and eight seconds of stillness: the tablet is fired
//   stillness         thirty-three seconds of stillness: the stylus presses a colophon (CANON §6)
import { h } from '../lib/dom.js'
import { makeLife } from './omens/life.js'
import { bakeClay, bakeMat } from './omens/clay.js'
import { buildSeries } from './omens/series.js'
import { makeLacunae } from './omens/lacuna.js'
import { makeCracks } from './omens/cracks.js'
import { buildLiver } from './omens/liver.js'
import { buildZiggurat } from './omens/ziggurat.js'
import { buildSeal } from './omens/seal.js'
import { buildEnvelope } from './omens/envelope.js'
import { buildLyre } from './omens/lyre.js'
import { buildHeavens } from './omens/heavens.js'
import { buildHead, buildSchool, buildCommentary, buildFoot } from './omens/texts.js'

// The firing at one hundred and eight seconds belongs to the tablet, not to a schism (CANON §12).
export const keeps = ['still']

// For the witness tool: the live parts of this face (set by render, emptied by destroy).
export const debug = {}

export function render(ctx) {
  const life = makeLife('omens')
  const rng = ctx.rng.fork('omens')
  const root = h('div', { class: 'om' })
  const announcer = h('p', { class: 'visually-hidden om-announcer', 'aria-live': 'polite' })
  let sayTimer = 0
  const say = (text) => {
    announcer.textContent = ''
    life.clear(sayTimer)
    sayTimer = life.timeout(() => { announcer.textContent = text }, 60)
  }
  const O = { ctx, life, rng, say, root }

  // The clay and the reed mat, baked once.
  try {
    root.style.setProperty('--om-clay-tex', `url("${bakeClay(rng.fork('clay'))}")`)
    root.style.setProperty('--om-mat-tex', `url("${bakeMat(rng.fork('mat'))}")`)
  } catch (e) { console.warn('[omens] the clay could not be baked', e) }
  // The light through the window, drawn by lot: the hour of day it pretends to be.
  root.dataset.light = rng.pick(['morning', 'noon', 'evening'])
  const sky = ctx.sky
  if (sky.moon.age >= 1 && sky.moon.age <= 2.5 && sky.hour >= 18) root.dataset.crescent = ''

  const head = buildHead(O)
  const series = buildSeries(O)
  const liver = buildLiver(O)
  const zig = buildZiggurat()
  const seal = buildSeal(O)
  root.style.setProperty('--seal-relief', seal.relief)
  const envelope = buildEnvelope(O)
  const lyre = buildLyre(O)
  const heavens = buildHeavens(O)
  const school = buildSchool(O)
  const comm = buildCommentary(O)

  O.state = () => {
    const lit = []
    let holding = 0
    for (const line of series.lines.values()) {
      if (!line.lit) continue
      holding++
      if (line.def.if && line.def.kind !== 'reed') lit.push({ if: line.ifEl.textContent, then: line.thenEl.textContent })
    }
    return { holding, lit }
  }
  O.onRewritten = () => ctx.memory?.markSecret?.('omens-rewritten', { face: 'omens' })
  O.onRead = () => {
    root.dataset.read = ''
    series.add('read')
    if (ctx.audio?.summoned) lyre.cadence()
  }

  const table = h('div', { class: 'om-table' }, series.el, liver.el, zig.el, heavens.el, envelope.el, seal.el, lyre.el, school, comm)
  root.append(h('div', { class: 'om-sheen', 'aria-hidden': 'true' }), head, table, buildFoot(), announcer)
  ctx.root.append(root)

  makeCracks(O, series.cracks)
  zig.label()
  series.start()
  const texts = () => [...series.texts(), ...root.querySelectorAll('.om-letter-p, .om-comm-text')]
  const lacunae = makeLacunae(O, texts, series.restore)

  // ── omens that are secrets too ──────────────────────────────────────────────────────────────
  const reed = life.media('(max-aspect-ratio: 1/2)', (on) => { if (on) reedSeen() })
  function reedSeen() {
    if (ctx.memory?.markSecret?.('omens-reed', { face: 'omens' })) say('A broken line of the great tablet is restored, for a Pilgrim who stands like a reed.')
  }
  if (reed?.matches) reedSeen()
  const forced = life.media('(forced-colors: active)', (on) => { if (on) ctx.memory?.markSecret?.('omens-stripped', { face: 'omens' }) })
  if (forced?.matches) ctx.memory?.markSecret?.('omens-stripped', { face: 'omens' })

  // ── stillness (CANON §3.6): the clay dries, a colophon is pressed, the tablet is fired ────────
  life.bus(ctx.bus, 'behavior:still', ({ seconds }) => {
    if (seconds === 7) {
      series.dry(true)
      say('Seven breaths of stillness. The clay dries paler.')
    }
    if (seconds === 33) {
      series.pressColophon()
      ctx.memory?.markSecret?.('stillness', { face: 'omens' })
      say('Thirty-three breaths of stillness. The stylus presses a colophon at the foot of the tablet.')
    }
    if (seconds === 108) {
      if (series.fire()) {
        ctx.memory?.markSecret?.('omens-fired', { face: 'omens' })
        say('One hundred and eight breaths. The tablet is fired: if the Pilgrim is still for one hundred and eight breaths, the tablet will outlive the king.')
      }
    }
  })
  life.bus(ctx.bus, 'behavior:stir', () => series.dry(false))
  life.bus(ctx.bus, 'mercy:change', ({ on }) => { if (on) series.readAll() })

  // ── the sky moves on while the Pilgrim reads ────────────────────────────────────────────────
  let planet = sky.planetaryHour.planet
  life.interval(() => {
    const now = ctx.readSky?.()
    if (!now) return
    heavens.paint(now)
    if (now.planetaryHour.planet !== planet) {
      planet = now.planetaryHour.planet
      lyre.retune(planet)
    }
  }, 30000)

  // ── the ritual surfaces (CANON §3.8): the prayers in sixties, and the souls at the tables ────
  const ritual = (st) => heavens.ritual(st ?? ctx.ritual?.state)
  life.bus(ctx.bus, 'ritual:state', (d) => ritual(d.state))
  life.bus(ctx.bus, 'temple:awake', () => ritual())
  life.bus(ctx.bus, 'server:presence', () => ritual())
  ritual()

  Object.assign(debug, { O, series, liver, zig, seal, envelope, lyre, heavens, lacunae })
  return () => {
    life.destroy()
    root.remove()
    for (const k of Object.keys(debug)) delete debug[k]
  }
}
