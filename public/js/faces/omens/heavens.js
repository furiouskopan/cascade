// THE WATCH OF THE SKY. A small round tablet that keeps the sky of this hour: the moon as it is (drawn
// from its real phase), the day of the month counted from the new moon, the ruler of the hour, the watch
// of the night, the omens of the hour, a reading for it (prophecy, lib/scripture.js), and the prayers of
// the congregation, counted in sixties with wedges, as the old astronomers counted.
import { h } from '../../lib/dom.js'
import { prophecy, planetName } from '../../lib/scripture.js'
import { watchOf } from './lore.js'
import { s, count } from './life.js'
import { wedge } from './clay.js'

const OMEN_WORDS = {
  witching: 'the third hour', midnight: 'midnight', triple: 'a repeated hour', 'thirty-three': 'the thirty-third minute',
  'full-moon': 'the full moon', 'new-moon': 'the new moon', turning: 'a turning of the year', 'friday-13': 'Friday the thirteenth',
  eclipse: 'a covered sun', 'saturn-hour': 'the hour of Saturn', night: 'the night',
}

// A moon drawn from its phase (0 new, 0.5 full), lit limb on the right while it waxes.
function moonPath(phase, r) {
  const p = ((phase % 1) + 1) % 1
  const k = Math.cos(p * 2 * Math.PI)
  const rx = Math.abs(k) * r
  const waxing = p < 0.5
  const crescent = k > 0
  const termSweep = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0)
  const f = (n) => Math.round(n * 100) / 100
  return `M0 ${f(-r)} A${f(r)} ${f(r)} 0 0 ${waxing ? 1 : 0} 0 ${f(r)} A${f(rx)} ${f(r)} 0 0 ${termSweep} 0 ${f(-r)} Z`
}

// A number in sixties: each place is tens (corner-wedges) and units (upright wedges, in rows of three).
export function sexagesimal(n) {
  n = Math.max(0, Math.floor(Number(n) || 0))
  const places = []
  do { places.unshift(n % 60); n = Math.floor(n / 60) } while (n > 0)
  let x = 2
  let body = ''
  for (const d of places) {
    const tens = Math.floor(d / 10), ones = d % 10
    if (!d) { body += wedge(x + 3, 8, { w: 3.4, angle: -45, tail: false }) + wedge(x + 3, 14, { w: 3.4, angle: -45, tail: false }); x += 10; continue }
    for (let t = 0; t < tens; t++) { body += wedge(x + 2 + (t % 3) * 5, 5 + Math.floor(t / 3) * 9, { w: 5, angle: -135, tail: false }); }
    if (tens) x += Math.min(3, tens) * 5 + 3
    for (let o = 0; o < ones; o++) body += wedge(x + 2 + (o % 3) * 4.4, 2 + Math.floor(o / 3) * 7.4, { len: 6.6, w: 3.6 })
    if (ones) x += Math.min(3, ones) * 4.4 + 2
    x += 6
  }
  return { body, width: x }
}

export function buildHeavens(O) {
  const { ctx, rng } = O
  const moon = s('svg', { class: 'om-moon', viewBox: '-22 -22 44 44', 'aria-hidden': 'true', focusable: 'false' })
  const moonDark = s('circle', { r: '18', class: 'om-moon-dark' })
  const moonLit = s('path', { class: 'om-moon-lit' })
  moon.append(moonDark, moonLit)
  const dayEl = h('p', { class: 'om-sky-day' })
  const moonEl = h('p', { class: 'om-sky-moon' })
  const hourEl = h('p', { class: 'om-sky-hour' })
  const omensEl = h('p', { class: 'om-sky-omens' })
  const reading = h('p', { class: 'om-sky-reading om-clay' })
  const tallySvg = s('svg', { class: 'om-tally-svg', viewBox: '0 0 40 20', 'aria-hidden': 'true', focusable: 'false' })
  const tallyText = h('span', { class: 'om-tally-text' })
  const tally = h('p', { class: 'om-sky-tally', hidden: true }, h('span', { class: 'om-sky-tally-label' }, 'Prayers of the congregation, in sixties: '), tallySvg, tallyText)
  const witnesses = h('p', { class: 'om-sky-souls', hidden: true })

  const el = h('section', { class: 'om-obj om-sky', 'aria-labelledby': 'om-sky-h' },
    h('h2', { id: 'om-sky-h', class: 'om-obj-h' }, 'The watch of the sky'),
    h('div', { class: 'om-sky-disc' }, moon, h('div', { class: 'om-sky-text' }, dayEl, moonEl, hourEl)),
    omensEl, reading, tally, witnesses)

  const voice = rng.fork('reading')
  function paint(sky) {
    moonLit.setAttribute('d', moonPath(sky.moon.phase, 18))
    const day = Math.floor(sky.moon.age) + 1
    dayEl.textContent = `Day ${count(day)} of the month, counted from the new moon.`
    moonEl.textContent = `The moon is ${sky.moon.name}, ${Math.round(sky.moon.illumination * 100)} parts in a hundred lit.`
    const ph = sky.planetaryHour
    hourEl.textContent = `${ph.glyph} The hour of ${planetName(ph.planet)}, on the day of ${planetName(ph.dayRuler)}; ${watchOf(sky.hour)}.`
    const words = sky.omens.map((o) => OMEN_WORDS[o] ?? o)
    omensEl.textContent = words.length ? `Omens of this hour: ${words.join(', ')}.` : 'No omen of the hour. The diviner notes it, and is relieved.'
  }
  paint(ctx.sky)
  reading.textContent = `The reading for this hour: ${prophecy(voice, ctx.sky)}`

  function ritual(state) {
    if (!state) return
    const p = Number(state.prayers)
    if (Number.isFinite(p)) {
      if (p > 0) {
        const { body, width } = sexagesimal(p)
        tallySvg.setAttribute('viewBox', `0 0 ${Math.max(20, width)} 20`)
        tallySvg.style.width = `${(Math.max(20, width) / 20) * 1.6}em`
        tallySvg.innerHTML = body
        tallyText.textContent = ` (${p.toLocaleString('en-US')})`
      } else {
        tallySvg.innerHTML = ''
        tallyText.textContent = 'none yet. The tally tablet is still smooth.'
      }
      tallySvg.style.display = p > 0 ? '' : 'none'
      tally.hidden = false
    }
    const souls = Number(state.online)
    if (Number.isFinite(souls) && souls > 0) {
      witnesses.textContent = souls === 1 ? 'One soul is at the table: you.' : `${cap(count(souls))} souls are at the tables of the Cascade.`
      witnesses.hidden = false
    }
  }
  return { el, paint, ritual }
}

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1)
