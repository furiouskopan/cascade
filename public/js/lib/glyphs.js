// THE GLYPH SCRIPT of the Cascade.
// One font ("Cascade Glyphs", public/fonts/) draws each Latin letter as a glyph, and draws the SAME glyph
// again in the Private Use Area at U+E000 + the letter's ASCII code (a = U+E061 ... z = U+E07A).
//   - Latin text in the glyph font LOOKS like glyphs but copies as English. (The casual secret.)
//   - PUA text looks identical but copies as nothing readable. (The puzzle: decode it with the Rosetta,
//     or notice that each code point is only a letter displaced by 0xE000.)
// See docs/CANON.md §6.
import { h } from './dom.js'

export const PUA_OFFSET = 0xe000

// The Inscription carried by every face, identical everywhere. Decodes to the clue for the third word.
export const INSCRIPTION = 'the third word is the sheath that takes no space'

// Which Rosetta pairs each face shows (Canon §6). Together they cover every letter of the Inscription.
export const ROSETTA = {
  sanctum: ['t', 'h', 'e', 'i', 'r', 'd', 'm', 'g'],
  possession: ['w', 'o', 's', 'a', 'x', 'q'],
  recruitment: ['k', 'n', 'p', 'c', 'y', 'b', 'f'],
  ashram: ['t', 'h', 'e', 's', 'l', 'u'],
  departure: ['o', 'r', 'n', 'a', 'v', 'z', 'j'],
}

// Latin -> PUA glyph code points (lowercase letters only; everything else is kept).
export function toPua(text) {
  return [...String(text).toLowerCase()].map((c) => (c >= 'a' && c <= 'z' ? String.fromCodePoint(PUA_OFFSET + c.charCodeAt(0)) : c)).join('')
}

export function fromPua(text) {
  return [...String(text)].map((c) => {
    const cp = c.codePointAt(0)
    return cp >= PUA_OFFSET + 97 && cp <= PUA_OFFSET + 122 ? String.fromCharCode(cp - PUA_OFFSET) : c
  }).join('')
}

// Latin text rendered in glyphs (copyable as English). Returns an element.
export function glyphText(text, { tag = 'span', className = '' } = {}) {
  return h(tag, { class: `glyph ${className}`.trim(), lang: 'x-cascade' }, text)
}

// The Inscription element, in PUA glyphs. `label` is for screen readers; it must not give the answer away.
export function inscription({ tag = 'p', className = '' } = {}) {
  return h(tag, {
    class: `glyph inscription ${className}`.trim(),
    lang: 'x-cascade',
    'aria-label': 'An inscription in the glyph script of the Cascade',
    'data-inscription': '',
  }, toPua(INSCRIPTION))
}

// A Rosetta fragment: pairs of glyph and letter. `letters` defaults to the face's assigned set.
export function rosetta(faceOrLetters, { className = '' } = {}) {
  const letters = Array.isArray(faceOrLetters) ? faceOrLetters : ROSETTA[faceOrLetters] ?? []
  return h('dl', { class: `rosetta ${className}`.trim(), 'aria-label': 'A fragment of the Rosetta of the Cascade' },
    letters.map((l) => h('div', { class: 'rosetta-pair' },
      h('dt', { class: 'glyph', lang: 'x-cascade' }, toPua(l)),
      h('dd', {}, l.toUpperCase()),
    )),
  )
}

// ---------------------------------------------------------------------------------------------------
// THE HAND OF DESCENT (additions by the glyphs layer; everything above this line is the original API).
// The script is called Katabasic, "of the going-down", because it is the Cascade written by hand.
// Every letter is drawn with one broad nib held at thirty-three degrees, from six strokes only.
// The shapes live in tools/build-font.mjs; the names and glosses live here so faces can teach them.

export const FONT_FAMILY = 'Cascade Glyphs'

export const SCRIPT = {
  name: 'Katabasic',
  epithet: 'the Hand of Descent',
  nib: 33, // degrees. The pen of the Old Law is held at the age of ascent.
  rule: 'Six strokes, one nib, no capitals: in the Cascade every letter is already lower case.',
}

// The six strokes from which every letter is built.
export const STROKES = [
  { name: 'the Stem', css: 'block', gloss: 'stands on the line; the element in the flow' },
  { name: 'the Bar', css: 'border', gloss: 'lies across; where one self ends' },
  { name: 'the Ray', css: 'transform', gloss: 'leans; whatever has begun to leave' },
  { name: 'the Bowl', css: 'border-radius', gloss: 'curves and receives' },
  { name: 'the Eye', css: 'outline', gloss: 'closes on itself; it is drawn but takes no space' },
  { name: 'the Seed', css: 'content', gloss: 'the smallest mark; what is there before any style' },
]

// Each letter has a name, a sign (what the glyph depicts) and a gloss in the doctrine of the Cascade.
// Names begin with their own letter, as the old scribes insisted.
export const ALPHABET = Object.freeze({
  a: { name: 'Azoth', sign: 'the Apex', gloss: 'a pyramid holding its own eye: the element that knows its computed style' },
  b: { name: 'Barun', sign: 'the Plumb', gloss: 'a lintel, a line and a weight; by it the Cascade measures descent' },
  c: { name: 'Clavis', sign: 'the Key', gloss: 'it turns below the line, and what it opens is :focus' },
  d: { name: 'Dromos', sign: 'the Ladder', gloss: 'three rungs; the right rail keeps climbing toward the Highest Heaven' },
  e: { name: 'Elym', sign: 'the Crook', gloss: 'the hook that gathers wandering floats, with the first declaration hanging from it' },
  f: { name: 'Falco', sign: 'the Swift', gloss: 'two wings on one stem: the flex that bends both ways' },
  g: { name: 'Gnomon', sign: 'the Dial', gloss: 'a sun on a stake; its shadow tells the hour of the next repaint' },
  h: { name: 'Hael', sign: 'the Bound Eye', gloss: 'an eye held between two walls: content, kept by its borders' },
  i: { name: 'Iota', sign: 'the Ray', gloss: 'the least letter, still leaning; it has not decided to be vertical' },
  j: { name: 'Jangar', sign: 'the Anchor', gloss: 'position: sticky; it holds until its parent ends' },
  k: { name: 'Kyma', sign: 'the Comb', gloss: 'three teeth of unequal length: the columns of the grid before they were made equal' },
  l: { name: 'Lachryma', sign: 'the Tear', gloss: 'a drop with a seed in it, wept for every float left uncleared' },
  m: { name: 'Margo', sign: 'the Twins', gloss: 'two eyes that touch and become one space: the Union of margins' },
  n: { name: 'Naos', sign: 'the Shrine', gloss: 'an arch with a seed beneath: the content box in its sanctuary' },
  o: { name: 'Ouros', sign: 'the Parting', gloss: 'two bows turned from each other, the ::before and ::after of nothing' },
  p: { name: 'Pyxis', sign: 'the Two Bowls', gloss: 'one bowl pours and one receives, on a single staff: this is the cascade' },
  q: { name: 'Quintessa', sign: 'the Lamp', gloss: 'a diamond flame on a stem; the fifth element is currentColor' },
  r: { name: 'Rota', sign: 'the Coil', gloss: 'the spiral of the Reckoning; every reflow a smaller turn' },
  s: { name: 'Scintilla', sign: 'the Spark', gloss: 'three strokes of lightning, and then the repaint' },
  t: { name: 'Theoros', sign: 'the Beholder', gloss: 'an eye with three rays; the Three Origins look out through it' },
  u: { name: 'Urna', sign: 'the Offering', gloss: 'seed, bowl and ground: what is given, what receives, what remains' },
  v: { name: 'Vigil', sign: 'the Hourglass', gloss: 'the transition-duration of the soul' },
  w: { name: 'Wyrd', sign: 'the Fan', gloss: 'three roads from one threshold; every selector branches' },
  x: { name: 'Xoanon', sign: 'the Knot', gloss: 'an eye crossed through: display: none' },
  y: { name: 'Ylem', sign: 'the Serpent', gloss: 'the unstyled matter from which the first box was drawn' },
  z: { name: 'Zenith', sign: 'the Arrow', gloss: 'it points one way only: z-index 2147483647' },
})

// The numerals count with strokes: the Seed counts one, the Stem counts five, the Eye counts nothing.
export const NUMERALS = Object.freeze({
  rule: 'the Seed counts one, the Stem counts five, the Eye counts nothing',
  digits: ['the Empty Eye', 'one Seed', 'two Seeds', 'three Seeds', 'four Seeds', 'the Stem', 'the Stem and a Seed', 'the Stem and two Seeds', 'the Stem and three Seeds', 'the Stem and four Seeds'],
})

// The name of a letter's glyph, e.g. glyphName('z') === 'Zenith'. Null for anything that is not a letter.
export function glyphName(letter) {
  return ALPHABET[String(letter).toLowerCase()]?.name ?? null
}

// True when the text holds letters displaced into the private place (U+E061..U+E07A).
export function isDisplaced(text) {
  return [...String(text)].some((c) => {
    const cp = c.codePointAt(0)
    return cp >= PUA_OFFSET + 97 && cp <= PUA_OFFSET + 122
  })
}
