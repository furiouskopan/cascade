// THE FREE SHEET left on a plastic chair: "The Night Cycle", a few verses of the Infinite Scripture for those
// who wait for a wash, the forecast for the sky outside, and a sock that has floated left into the news.
// Clear it (click it, or press it) and the paragraph it floated beside comes down beneath it: Absolution.
import { h } from '../../lib/dom.js'
import { chapter, prophecy, holyName, planetName } from '../../lib/scripture.js'
import { HEADLINES, SAYS } from './lore.js'

// Five verses of one chapter, none of them said twice (the generator repeats itself now and then).
function fiveVerses(rng) {
  const seen = new Set()
  const out = []
  for (const v of chapter(rng, 16)) {
    if (seen.has(v.text)) continue
    seen.add(v.text)
    out.push({ ...v, number: out.length + 1 })
    if (out.length === 5) break
  }
  return out
}

export function makeSheet(A) {
  const { ctx, life, rng } = A
  const sky = ctx.sky
  const verses = fiveVerses(rng.fork('sheet/verses'))
  const issue = rng.int(12, 96)
  const headline = rng.pick(HEADLINES)
  const reporter = holyName(rng.fork('sheet/reporter'))
  const sock = h('button', { type: 'button', class: 'lnd-sock', 'aria-label': 'A lost sock, floated left. Clear it.' }, h('span', { class: 'lnd-sock-cuff', 'aria-hidden': 'true' }))
  const lead = h('p', { class: 'lnd-sheet-lead' },
    `By ${reporter}. A garment brought in at 3:33 left the machine in a state its owner described as "inline". `,
    'The management repeated that nothing in the machines is broken: each of them does exactly what its label says, ',
    'and has done since the night the attendant stepped out.')
  const ph = sky.planetaryHour
  const forecast = prophecy(rng.fork('sheet/prophecy'), sky)
  const el = h('aside', { class: 'lnd-sheet-paper', 'aria-labelledby': 'lnd-sheet-h' },
    h('header', { class: 'lnd-masthead' },
      h('p', { class: 'lnd-mast-ear' }, `Vol. 33 · No. ${issue}`),
      h('h2', { id: 'lnd-sheet-h' }, 'The Night Cycle'),
      h('p', { class: 'lnd-mast-ear' }, 'free · take one')),
    h('h3', { class: 'lnd-headline' }, headline),
    h('div', { class: 'lnd-sheet-cols' },
      h('div', { class: 'lnd-sheet-story' }, sock, lead,
        h('p', { class: 'lnd-sheet-p' }, 'Readers are reminded that the machine at the back is nearly done, and that the folding table is for folding.')),
      h('section', { class: 'lnd-sheet-scripture', 'aria-label': `Scripture: ${verses[0].book}, chapter ${verses[0].chapter}` },
        h('h4', {}, `${verses[0].book} ${verses[0].chapter}`),
        h('ol', { class: 'lnd-verses' }, verses.map((v) => h('li', { class: 'lnd-verse', value: v.number },
          h('span', { class: 'lnd-verse-n', 'aria-hidden': 'true' }, v.number), ' ', v.text)))),
      h('section', { class: 'lnd-forecast', 'aria-labelledby': 'lnd-forecast-h' },
        h('h4', { id: 'lnd-forecast-h' }, 'Tonight'),
        h('p', {}, forecast),
        h('dl', {},
          h('div', {}, h('dt', {}, 'Moon'), h('dd', {}, `${sky.moon.name}, ${Math.round(sky.moon.illumination * 100)}%`)),
          h('div', {}, h('dt', {}, 'Hour'), h('dd', {}, `${ph.glyph} ${planetName(ph.planet)}`)),
          h('div', {}, h('dt', {}, 'Omens'), h('dd', {}, sky.omens.length ? sky.omens.join(', ') : 'none')),
          h('div', {}, h('dt', {}, 'Inside'), h('dd', {}, '3:33, fluorescent'))))))

  let cleared = false
  life.on(sock, 'click', () => {
    if (cleared) return
    cleared = true
    // The Wandering ends: the paragraph beside the float clears it, and comes down beneath it.
    lead.classList.add('is-cleared')
    sock.classList.add('is-cleared')
    sock.setAttribute('aria-label', 'The sock, cleared and found.')
    A.say(SAYS.sock)
    A.onSock?.()
  })
  return { el, sock }
}
