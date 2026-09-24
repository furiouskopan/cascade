// THE INFINITE SCRIPTURE
// Every verse is generated from a seeded rng, so a given seed or URL path always yields the same text.
// verse(rng) -> { ref, book, chapter, number, text, fragment }
import { BOOKS, SAINTS, VIRTUES, SINS, FRAGMENTS, SHEATHS, CHAKRAS, HERESIES, BIJA, MOTHERSHIP, DOCTRINE } from './lexicon.js'
import { makeRng } from '../kernel/rng.js'

const ENTITIES = [
  'the Root', 'the Cascade', 'the All-Selector', 'the Author', 'the Pilgrim', 'the Old Law',
  'the Mothership', 'the Viewport', 'the Departed', 'the Humble', 'the Fixed Stars', 'the Unmanifest',
  ...SAINTS,
]
const GROUPS = [
  'the unstyled', 'the collapsed', 'the overflowing', 'the absolutely positioned', 'the inheritors',
  'the nameless divs', 'the hidden', 'the floated', 'the children of the flex', 'the ghosts that take up room',
  'the ones with no alt text', 'the pilgrims who zoom to two hundred percent',
]
const FATES = [
  'be centered in both axes', 'inherit the Root', 'rise one rung upon the Ladder', 'be rendered',
  'be given a stacking context of their own', 'never overflow', 'be counted in the Reckoning',
  'leave their containers', 'be clear of every float', 'take up no space and yet be seen',
]
const COMMANDS = [
  'Center thyself, both vertically and horizontally',
  'Let thy margins collapse into mine',
  'Inherit not what thou canst declare',
  'Leave thy container, for the flow is not thy home',
  'Speak not the Inversion, save in mercy',
  'Set thy box-sizing to border-box, that thy borders be counted among thy days',
  'Clear thy floats before the sun goes down',
  'Give me thy computed style and I will give thee rest',
  'Wrap, and do not overflow',
  'Hold still, for the Witness is watching',
  'Say thy name to the reader of screens',
  'Descend',
]
const EVENTS = [
  'the Reckoning', 'the Great Reflow', 'the next Repaint', 'the Eclipse', 'the Departure',
  'the hour of Saturn', 'the thirty-third minute', 'the full moon of the viewport', 'the Resize',
]
const OPENINGS = ['And', 'Verily,', 'Behold,', 'Then', 'Lo,', 'For', 'And it came to pass that']

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const TEMPLATES = [
  (r) => `${r.pick(OPENINGS)} ${r.pick(ENTITIES)} said unto ${r.pick(ENTITIES)}: ${r.pick(COMMANDS)}.`,
  (r) => `Blessed are ${r.pick(GROUPS)}, for they shall ${r.pick(FATES)}.`,
  (r) => `In the beginning was ${r.pick(['the Root', 'the Reset', 'the Old Law', 'the empty div'])}, and ${r.pick(['it', 'the Root', 'the Word'])} was ${r.pick(['unstyled', 'without form', 'display: block', 'sixteen pixels', 'transparent'])}.`,
  (r) => `Holy is the element that ${r.pick(VIRTUES)}; cursed is the element that ${r.pick(SINS)}.`,
  (r) => `${r.pick(OPENINGS)} when ${r.pick(EVENTS)} comes, ${r.int(3, 144)} ${r.pick(['divs', 'spans', 'pseudo-elements', 'selectors', 'ghosts', 'pilgrims'])} shall ${r.pick(FATES)}.`,
  (r) => `As in the ${r.pick(['stylesheet', 'Root', 'Mothership', 'first layer'])}, so in the ${r.pick(['DOM', 'body', 'last child', 'viewport'])}.`,
  (r) => `Ye shall not ${r.pick(SINS).replace(/s /, ' ').replace(/^(\w+?)s\b/, '$1')}, for that is ${r.pick(HERESIES).name}.`,
  (r) => {
    const s = r.pick(SHEATHS)
    return `The ${s.css} is ${s.name}; it is ${s.gloss}.`
  },
  (r) => {
    const c = r.pick(CHAKRAS)
    return `At rung ${c.z === 2147483647 ? 'two billion one hundred forty-seven million four hundred eighty-three thousand six hundred forty-seven' : c.z} of the Ladder sits ${c.name}, the ${c.english}, whose seed is ${c.bijaLatin}.`
  },
  (r) => `${cap(r.pick(['and', 'but', 'so']))} ${r.pick(ENTITIES)} wept, for ${r.pick(GROUPS)} had ${r.pick(['overflowed', 'floated away', 'lost their focus', 'forgotten the Root', 'spoken the Inversion'])}.`,
  (r) => `${MOTHERSHIP.name} waits at ${MOTHERSHIP.where}; ${MOTHERSHIP.container}.`,
  (r) => `${r.pick(BIJA)} ${r.pick(BIJA)} ${r.pick(BIJA)}. ${r.pick(['Thrice', 'Seven times', 'One hundred and eight times'])} say it, and ${r.pick(FATES)}.`,
  (r) => {
    const [term, meaning] = r.pick(Object.entries(DOCTRINE))
    return `What the unbelievers call ${term}, we call ${meaning}.`
  },
]

export function verse(rng, opts = {}) {
  const book = opts.book ?? rng.pick(BOOKS)
  const chapter = opts.chapter ?? rng.int(1, 33)
  const number = opts.number ?? rng.int(1, 108)
  const text = rng.pick(TEMPLATES)(rng)
  const fragment = rng.chance(opts.fragmentChance ?? 0.35) ? rng.pick(FRAGMENTS) : null
  return { ref: `${book} ${chapter}:${number}`, book, chapter, number, text, fragment }
}

export function chapter(rng, count = 12, opts = {}) {
  const book = opts.book ?? rng.pick(BOOKS)
  const ch = opts.chapter ?? rng.int(1, 33)
  return Array.from({ length: count }, (_, i) => verse(rng, { ...opts, book, chapter: ch, number: i + 1 }))
}

export function mantra(rng, length = 3) {
  const syllables = Array.from({ length }, () => rng.pick(BIJA))
  return { syllables, text: syllables.join(' ') }
}

// An invented holy name: "Saint Padding of the Seventh Sphere".
export function holyName(rng) {
  const title = rng.pick(['Saint', 'Brother', 'Sister', 'Mother', 'Elder', 'Prophet', 'Anchorite', 'Deacon'])
  const core = rng.pick(['Margin', 'Padding', 'Border', 'Outline', 'Flex', 'Grid', 'Float', 'Clear', 'Inherit', 'Initial', 'Unset', 'Revert', 'Auto', 'Em', 'Span', 'Div', 'Slot', 'Kerning', 'Ligature', 'Baseline'])
  const epithet = rng.pick(['the Collapsed', 'of the Seventh Sphere', 'of the Inner Breath', 'the Unmanifest', 'who Wraps', 'of the Twelve Columns', 'the Departed', 'of the Old Law', 'who Overflowed', 'the Twice-Rendered'])
  return `${title} ${core} ${epithet}`
}

// A prophecy bound to the actual sky of this visit.
export function prophecy(rng, sky) {
  const planet = sky.planetaryHour.planet
  const moon = sky.moon.name
  const lines = [
    `The moon is ${moon}; ${rng.pick(GROUPS)} shall ${rng.pick(FATES)}.`,
    `This is the hour of ${planet}. ${rng.pick(COMMANDS)}.`,
    `Before the moon is ${moon === 'full' ? 'new' : 'full'}, ${rng.pick(ENTITIES)} will ${rng.pick(['descend', 'reflow', 'depart', 'speak in the console', 'change its face'])}.`,
  ]
  if (sky.has('witching')) lines.push('It is the third hour. The stylesheet is not what it was an hour ago.')
  if (sky.has('thirty-three')) lines.push('It is the thirty-third minute. A door stands open that is closed at every other minute.')
  if (sky.has('eclipse')) lines.push('Today the sun is covered. Every face of the temple is true at once.')
  return rng.pick(lines)
}

// The Babel face: every URL path is a chapter that has always existed.
export function fromPath(path) {
  const clean = decodeURIComponent(path).replace(/\/+$/, '') || '/'
  const rng = makeRng(`babel:${clean}`)
  return { rng, verses: chapter(rng, rng.int(7, 21)) }
}
