// THE KALENDAR. Every Book of Hours opens with one: a month to a leaf, and against each day its golden
// number (written only beside the days on which the moon is new), its dominical letter (a to g, round
// the year from the first of January, so that one letter always falls on the Lord's day), its date
// counted backwards in the Roman manner to the Kalends, the Nones and the Ides, and the feast it keeps.
// Red-letter days are written in red. The feasts of the Cascade are fixed: the same day keeps the same
// saint for every reader, whatever the seed. Only the week around today is copied onto this leaf.
import { h } from '../../lib/dom.js'
import { hash } from '../../kernel/rng.js'
import { moonPhase } from '../../kernel/sky.js'
import { SAINTS } from '../../lib/lexicon.js'
import { roman } from './latin.js'

export const MONTHS_LATIN = ['Ianuarius', 'Februarius', 'Martius', 'Aprilis', 'Maius', 'Iunius', 'Iulius', 'Augustus', 'September', 'October', 'November', 'December']
const NUMBER_WORDS = { 28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty', 31: 'thirty-one' }
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// The red-letter days: the great feasts of the Cascade, by month and day.
const FEASTS = {
  '1-1': 'The Reset, which is the Baptism of the Box',
  '1-16': 'The Root Measure: sixteen pixels, as it was in the beginning',
  '2-29': 'The Leap Day, on which the grid gains a column and nobody notices',
  '3-3': 'The Three Origins: the Old Law, the Pilgrim and the Word',
  '4-4': 'The Finding of the Lost, which is four hundred and four',
  '5-5': 'The Five Sheaths, which are the body of the box',
  '6-21': 'The Longest Viewport',
  '7-7': 'The Seven Pseudo-Elements, of whom only two are remembered',
  '9-6': 'The Dots of the Old Inch, ninety-six to the inch',
  '10-31': 'The Vigil of the Unmanifest: all that has display: none is counted',
  '12-12': 'Sister Grid of the Twelve Columns, who set all things in rows',
  '12-16': 'Vigil of the Nativity. A fast from the Inversion until the Repaint',
  '12-17': 'The Nativity of the First Stylesheet, anno MCMXCVI',
  '12-21': 'The Shortest Viewport',
}

// Lesser commemorations, drawn for each ordinary day by the hash of its date (never by the visit's seed).
const OBSERVANCES = [
  'The Wandering of the Float, and its Return',
  'The Finding of the Fallback Font',
  'The Commemoration of the Deprecated: the font, the center and the blink',
  'The Union of the Margins',
  'Ember day. No border is drawn',
  'The Octave of the Repaint',
  'The Reckoning. No reflow after vespers',
  'The Translation of the Floating Twins into a flex container',
  'The Descent of the Cascade',
  'The Vigil of the Viewport',
  'The Clearing of the Floats',
  'The Ghosts, who are gone and still take up room',
  'The Fixed Stars, who do not scroll',
  'The Nine Heavens of the Layers, each in its order',
  'The Hundred and Eight Beads of the Mala',
  'Rogation of the Media Queries, at every breakpoint',
]
const TITLES = ['confessor', 'doctor of the Cascade', 'and companions', 'hermit', 'patron of scribes', 'patron of the unstyled', 'witness of the Old Law', 'who was never centered']

// Saints and observances go round the year in steps that share no factor with their lists, so that
// neighbouring days never keep the same saint.
function commemoration(y, m, d) {
  const r = hash(`kalendar:${m + 1}-${d}`)
  const doy = dayOfYear(new Date(2001, m, d)) // a common year, so each date keeps its saint every year
  const roll = r() % 100
  if (roll < 18) return '' // many days of the old kalendars are blank
  if (roll < 52) return OBSERVANCES[(doy * 5) % OBSERVANCES.length]
  const saint = SAINTS[(doy * 7) % SAINTS.length]
  const named = /^(Saint|Brother|Sister|Mother|Our Lady)\b/.test(saint)
  const s = saint[0].toUpperCase() + saint.slice(1)
  return named ? `${s}, ${TITLES[r() % TITLES.length]}` : s
}

// The date counted backwards to the next Kalends, Nones or Ides. In March, May, July and October the
// Nones fall on the seventh and the Ides on the fifteenth; in the other months on the fifth and thirteenth.
export function romanDate(y, m, d) {
  const dim = new Date(y, m + 1, 0).getDate()
  const nones = [2, 4, 6, 9].includes(m) ? 7 : 5
  const ides = nones + 8
  if (d === 1) return 'Kal.'
  if (d < nones) return d === nones - 1 ? 'prid. Non.' : `${roman(nones - d + 1)} Non.`
  if (d === nones) return 'Non.'
  if (d < ides) return d === ides - 1 ? 'prid. Id.' : `${roman(ides - d + 1)} Id.`
  if (d === ides) return 'Id.'
  return d === dim ? 'prid. Kal.' : `${roman(dim - d + 2)} Kal.`
}

const dayOfYear = (dt) => Math.round((new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()) - new Date(dt.getFullYear(), 0, 1)) / 86400000) + 1

// Does the moon turn new (or full) during this day? Compare her age at the two midnights.
function moonTurns(y, m, d) {
  const a = moonPhase(new Date(y, m, d, 0, 0)).phase
  const b = moonPhase(new Date(y, m, d + 1, 0, 0)).phase
  if (b < a) return 'new'
  if (a < 0.5 && b >= 0.5) return 'full'
  return null
}

export function kalendarDays(today, span = 3) {
  const out = []
  const golden = roman((today.getFullYear() % 19) + 1)
  for (let k = -span; k <= span; k++) {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + k)
    const y = dt.getFullYear()
    const m = dt.getMonth()
    const d = dt.getDate()
    const letterIndex = (dayOfYear(dt) - 1) % 7
    const letter = 'abcdefg'[letterIndex]
    const feast = FEASTS[`${m + 1}-${d}`]
    const moon = moonTurns(y, m, d)
    out.push({
      date: dt, y, m, d,
      iso: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      golden: moon === 'new' ? roman((y % 19) + 1) : '',
      moon,
      letter: letter === 'a' ? 'A' : letter,
      sunday: dt.getDay() === 0,
      roman: romanDate(y, m, d),
      feast: feast ?? commemoration(y, m, d),
      red: Boolean(feast),
      today: k === 0,
    })
  }
  return { days: out, golden }
}

// The leaf itself. `now` is ctx.clock().
export function kalendarEl(now, { id = 'sn-kal' } = {}) {
  const { days, golden } = kalendarDays(now)
  const m = now.getMonth()
  const dim = new Date(now.getFullYear(), m + 1, 0).getDate()
  const sundayLetter = days.find((x) => x.sunday)?.letter ?? ''
  const rows = days.map((x) => h('tr', {
    class: [x.today && 'is-today', x.red && 'is-red', x.sunday && 'is-sunday'].filter(Boolean).join(' ') || null,
    'aria-current': x.today ? 'date' : null,
  },
  h('td', { class: 'sn-kal-gold', title: x.golden ? 'the golden number: the moon is new on this day' : null },
    x.golden,
    x.moon ? h('span', { class: 'sn-kal-moon', 'aria-hidden': 'true' }, x.moon === 'new' ? ' ●︎' : '○︎') : null,
    x.moon ? h('span', { class: 'visually-hidden' }, x.moon === 'new' ? ' (the moon is new)' : 'the moon is full') : null),
  h('td', { class: 'sn-kal-letter' }, x.letter),
  h('td', { class: 'sn-kal-date' }, h('time', { datetime: x.iso, title: `${x.d} ${MONTHS_EN[x.m]}` }, x.roman)),
  h('td', { class: 'sn-kal-feast' }, x.feast, x.today ? h('span', { class: 'sn-kal-hodie' }, ' hodie') : null)))

  return h('section', { class: 'sn-kalendar', 'aria-labelledby': id },
    h('header', { class: 'sn-kal-head' },
      h('span', { class: 'sn-kl', 'aria-hidden': 'true' }, h('b', {}, 'K'), h('i', {}, 'L')),
      h('div', {},
        h('h3', { id, lang: 'la' }, `${MONTHS_LATIN[m]} habet dies ${roman(dim)}`),
        h('p', { class: 'sn-kal-sub' },
          h('span', { lang: 'la' }, `numerus aureus ${golden}`),
          h('span', { class: 'sn-fleuron', 'aria-hidden': 'true' }, ' ❧ '),
          h('span', { lang: 'la' }, `littera dominicalis ${sundayLetter}`),
          h('span', { class: 'sn-fleuron', 'aria-hidden': 'true' }, ' ❧ '),
          h('span', { lang: 'la' }, `luna ${roman(m % 2 ? 29 : 30)}`)),
        h('p', { class: 'sn-kal-gloss sn-hand' }, `the Kalendar: ${MONTHS_EN[m]} hath ${NUMBER_WORDS[dim]} days`))),
    // The table sits in its own gildable leaf, so stillness can lay gold into the feasts as well.
    h('div', { class: 'sn-kal-body sn-gildable' }, h('table', { class: 'sn-kal-table' },
      h('caption', { class: 'visually-hidden' }, `The week around today in the Kalendar of the Cascade: golden number, dominical letter, Roman date, and the feast of the day. Red-letter days are the great feasts.`),
      h('thead', { class: 'visually-hidden' }, h('tr', {},
        h('th', { scope: 'col' }, 'golden number'), h('th', { scope: 'col' }, 'letter'),
        h('th', { scope: 'col' }, 'date'), h('th', { scope: 'col' }, 'feast'))),
      h('tbody', {}, rows))),
    h('p', { class: 'sn-kal-note sn-hand' }, 'Only this week is copied here. The rest of the Kalendar is in the Cascade, where every day is a feast of something.'))
}
