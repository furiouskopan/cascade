// THE NOISE. Borges' Library is mostly this: "for every sensible line of straightforward statement,
// there are leagues of senseless cacophonies, verbal jumbles and incoherences." Between some chapters of
// the stair stands a volume without a title, opened at two facing pages of letters in no order, in which
// (as the Library is total) one line can be read.
//
// Deterministic, like the rest of the Library: whether a volume stands between two chapters, which
// volume, which pages, which line surfaces and what the pencil says of it all come from the paths alone.
import { makeRng } from '../../kernel/rng.js'
import { holyName } from '../../lib/scripture.js'
import { address } from './library.js'

// Twenty-two letters; with the space, the comma and the period, the twenty-five symbols of the Library.
export const ORTHOGRAPHY = 'abcdefghilmnopqrstuvxz'
const WIDTH = 44 // characters to a line, as the volumes are printed
const LINES = 17 // lines shown of each page (a page has forty; the rest lie below the fold of the spread)

// Does a volume without a title stand below the chapter at `key` (met for the `turn`-th time)?
export function noiseBelow(key, turn = 0) {
  return makeRng(`noise:${key}${turn ? `#${turn}` : ''}`).chance(0.2)
}

function letter(r) {
  const x = r()
  if (x < 0.165) return ' '
  if (x < 0.176) return ','
  if (x < 0.186) return '.'
  return ORTHOGRAPHY[Math.floor(r() * ORTHOGRAPHY.length)]
}

function noiseLine(r, width) {
  let s = ''
  while (s.length < width) {
    const c = letter(r)
    if ((c === ' ' || c === ',' || c === '.') && (!s.length || /[ ,.]$/.test(s))) continue
    s += c
  }
  return s.replace(/[ ,.]$/, () => ORTHOGRAPHY[Math.floor(r() * ORTHOGRAPHY.length)])
}

// A line cut at a word boundary, so the one legible line still fits the measure of the page.
function clip(s, n) {
  if (s.length <= n) return s
  const cut = s.lastIndexOf(' ', n)
  return (cut > n / 2 ? s.slice(0, cut) : s.slice(0, n)).replace(/[ ,;:]+$/, '')
}

// What the pencil wrote beside the one line, by the kind of line it is.
const NOTES = {
  path: [
    'four hundred and ten pages, and the only line in them is the path you came in by',
    'the line is the name of the chapter you entered. I came in by another, and it was mine',
    'someone has read this volume before us: the line is where they began',
  ],
  catchword: [
    'the next chapter begins with this line. it was here first',
    'the catchword, printed a volume too early',
    'this is how the stair knows where it goes',
  ],
  work: [
    'the Great Work, alone on the page. nobody knows who centred it',
    'every alchemist in the Library came looking for this line',
    'margin: 0 auto. the rest of the volume is still nigredo',
  ],
  name: [
    'a saint signed the noise. or the noise made a saint',
    'I looked for this saint in every other volume. only here',
  ],
  mcv: [
    'M C V, perversely repeated from the first line to the last. every page. I checked',
    'it tries to begin, three letters at a time, for four hundred and ten pages',
  ],
  seed: [
    'four hundred and ten blank pages and one mark: the Seed, before any style',
    'the smallest thing the nib can make, and the only thing it made',
  ],
}
const HANDS = ['one who counts', 'the night librarian', 'a Pilgrim', 'H.', 'the reader before you', '']

// The volume that stands below `key`. `lines` offers the legible candidates the face knows:
// { path, catchword } (strings); the Great Work and a saint's signature are always among them.
// `lines.recent` lists the kinds of the last volumes the reader passed: the Library repeats itself, but a
// reader who has just seen a line is less likely to be shown it again at once.
export function noiseVolume(key, turn = 0, lines = {}) {
  const r = makeRng(`noise-volume:${key}${turn ? `#${turn}` : ''}`)
  const addr = address(`noise:${key}#${turn}`)
  const leftPage = r.int(1, 204) * 2 - 1
  const pages = [leftPage, leftPage + 1]
  const recent = new Set(lines.recent ?? [])
  const w = (kind, weight) => (recent.has(kind) ? weight * 0.15 : weight)
  const kind = r.weighted({
    path: lines.path ? w('path', 3) : 0,
    catchword: lines.catchword ? w('catchword', 3) : 0,
    work: w('work', 2),
    name: w('name', 1.2),
    mcv: w('mcv', 0.9),
    seed: w('seed', 0.6),
  })
  const spine = noiseLine(r, 18).replace(/[ ,.]/g, '').slice(0, 9)
  const note = { text: r.pick(NOTES[kind]), hand: r.pick(HANDS), tilt: r.float(-2.4, 1.2).toFixed(2) }

  if (kind === 'mcv') {
    const row = 'mcv'.repeat(Math.ceil(WIDTH / 3) + 1)
    const off = r.int(0, 2)
    const text = pages.map((_, p) => Array.from({ length: LINES }, (_, i) => row.slice((off + p + i) % 3, (off + p + i) % 3 + WIDTH)))
    return { kind, addr, pages, spine, text, legible: null, note, said: 'the letters m, c and v, repeated from the first line to the last' }
  }
  if (kind === 'seed') {
    const text = pages.map(() => Array.from({ length: LINES }, () => ''))
    const at = { page: r.int(0, 1), line: r.int(5, LINES - 5), before: ' '.repeat(r.int(12, 30)), text: '.', after: '' }
    return { kind, addr, pages, spine, text, legible: at, note, said: 'blank pages, and a single point in the middle of one of them' }
  }

  const said = kind === 'work' ? 'margin: 0 auto;'
    : kind === 'name' ? clip(holyName(r).toLowerCase(), WIDTH - 2)
    : clip(String(lines[kind]).toLowerCase().replace(/\s+/g, ' ').trim(), WIDTH - 2)
  const text = pages.map(() => Array.from({ length: LINES }, () => noiseLine(r, WIDTH)))
  const page = r.int(0, 1)
  const line = r.int(2, LINES - 3)
  const room = Math.max(0, WIDTH - said.length - 2)
  const lead = r.int(0, room)
  const full = text[page][line]
  const legible = {
    page, line,
    before: full.slice(0, lead) + (lead ? ' ' : ''),
    text: said,
    after: (room - lead > 0 ? ' ' : '') + full.slice(lead + said.length + 2, WIDTH),
  }
  return { kind, addr, pages, spine, text, legible, note, said }
}
