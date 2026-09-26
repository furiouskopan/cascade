// THE ABECEDARY. Among the volumes of the Library there is necessarily a primer, and one of its leaves is
// shelved at /verse/of/the/alphabet: the Hand of Descent whole, on a single page. First the alphabet line,
// as primers print it, with the letters pencilled under it by the reader who copied it out; then every
// glyph with its letter, its name, its sign, its gloss and the strokes it is written with.
//
// Nothing here is drawn by hand: the shapes are the glyph font's, and the letters' names, signs, glosses and
// anatomy come from lib/glyphs.js (read defensively, as the rest of the face reads it). It is only the key:
// it reads nothing for the reader. Deterministic: the pencil is drawn from the chapter's own rng.
import { h } from '../../lib/dom.js'
import * as Glyphs from '../../lib/glyphs.js'

const LATIN = 'abcdefghijklmnopqrstuvwxyz'.split('')
const COUNTED = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

// What the copyist pencilled beside one letter of the primer. Texture only: none of it teaches anything.
const MARGIN = [
  'the nib slips on this one. go slowly',
  'I wrote this one wrong for a year',
  'the prettiest of them',
  'copied it three times before it stood on the line',
  'the one my hand remembers first',
]
const HANDS = ['K., who was looking for something else', 'the reader before you', 'one who counts', 'a Pilgrim', 'M.']

// A letter displaced into the glyph script, as the Rosetta fragments print it; named for those who
// cannot see it.
const glyphOf = (l, cls, label = true) => h('span', {
  class: `glyph ${cls}`,
  lang: 'x-cascade',
  role: label ? 'img' : null,
  'aria-label': label ? `glyph for ${l}` : null,
}, Glyphs.toPua(l))

export function abecedary(ch) {
  const r = ch.rng.fork('abecedary')
  const names = Glyphs.ALPHABET ?? {}
  const anatomy = typeof Glyphs.anatomy === 'function' ? Glyphs.anatomy : () => null
  const script = Glyphs.SCRIPT ?? null
  const marked = r.pick(LATIN)
  const note = { text: r.pick(MARGIN), tilt: r.float(-2.4, 1.2).toFixed(2) }

  const lede = script
    ? `${script.name}, ${script.epithet}, whole: twenty-six glyphs in the order of the Latin letters they stand for, each with its name, what it depicts and its gloss.`
    : 'The glyph script of the Cascade, whole: twenty-six glyphs in the order of the Latin letters they stand for.'

  // The alphabet line: the whole key at a glance. It repeats what the lexicon below says in full, so it
  // is drawn for the eye only.
  const line = h('div', { class: 'bb-abc-line', 'aria-hidden': 'true' },
    h('ol', { class: 'bb-abc-row' }, LATIN.map((l) => h('li', {},
      glyphOf(l, 'bb-abc-row-glyph', false),
      h('span', { class: 'bb-abc-row-latin' }, l)))),
    h('p', { class: 'bb-abc-row-note' }, 'all of it. every other leaf keeps two.'))

  const entries = LATIN.map((l) => {
    const a = names[l]
    const body = anatomy(l)
    return h('li', { class: 'bb-abc-entry', id: `bb-abc-${l}` },
      h('span', { class: 'bb-abc-cell' }, glyphOf(l, 'bb-abc-glyph')),
      h('p', { class: 'bb-abc-hw' },
        h('span', { class: 'visually-hidden' }, 'the letter '),
        h('span', { class: 'bb-abc-latin' }, l),
        a && [h('span', { class: 'bb-abc-dot', 'aria-hidden': 'true' }, '·'), h('span', { class: 'visually-hidden' }, ', named '), h('span', { class: 'bb-abc-name' }, a.name)]),
      a && h('p', { class: 'bb-abc-sign' }, a.sign),
      a && h('p', { class: 'bb-abc-gloss' }, a.gloss),
      body && h('p', { class: 'bb-abc-strokes' },
        // The count is written in the Hand's own numerals, then said in words.
        h('span', { class: 'glyph bb-abc-count', lang: 'x-cascade', 'aria-hidden': 'true' }, String(body.strokes)),
        h('span', {}, `${COUNTED[body.strokes] ?? body.strokes} strokes: ${body.text}`)),
      l === marked && h('aside', { class: 'bb-abc-margin', style: `--tilt:${note.tilt}deg`, 'aria-label': 'A note pencilled in the margin' }, note.text))
  })

  // Shielded from the secrets layer's rubrics and relic: the key is copied from, and must copy clean (and
  // stay the same leaf for every reader).
  return h('section', { class: 'bb-abc', id: 'bb-abecedary', 'aria-labelledby': 'bb-abc-title', 'data-secrets-skip': '' },
    h('header', { class: 'bb-abc-head' },
      h('p', { class: 'bb-abc-kicker' }, 'A leaf of the primer'),
      h('h2', { class: 'bb-abc-title', id: 'bb-abc-title' }, 'Abecedarium'),
      h('p', { class: 'bb-abc-lede' }, lede, ' Among the volumes of the Library there is necessarily a primer; this is its first leaf.'),
      script?.rule && h('p', { class: 'bb-abc-rule' }, script.rule)),
    line,
    h('ol', { class: 'bb-abc-list', 'aria-label': 'The twenty-six letters, each with its glyph, its name, its sign and its gloss' }, entries),
    Glyphs.NUMERALS?.rule && h('p', { class: 'bb-abc-foot' }, `And the numerals: ${Glyphs.NUMERALS.rule}.`),
    h('p', { class: 'bb-abc-colophon' },
      h('span', { class: 'bb-abc-colophon-text' }, 'copied out whole by one who went round every face of the temple for it, so that the next reader need not.'),
      h('span', { class: 'bb-abc-colophon-hand' }, ` — ${r.pick(HANDS)}`)))
}
