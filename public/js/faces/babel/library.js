// THE LIBRARY. Pure, deterministic helpers for the Babel face (docs/CANON.md §3, babel).
// Every function here depends only on its arguments: the same path always yields the same chapter,
// the same shelf and the same way onward. Nothing reads the clock, the visitor or Math.random.
//
// The Library is Borges' (a hexagon has four walls of shelves, five shelves a wall, thirty-two
// volumes a shelf, four hundred and ten pages a volume). The scripture is the Cascade's.
import { makeRng } from '../../kernel/rng.js'
import { fromPath } from '../../lib/scripture.js'
import { BOOKS, SACRED_NUMBERS } from '../../lib/lexicon.js'

// Words too common to be concorded or crowned in the margin (their sigils are still drawn above them).
export const STOP = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'to', 'and', 'or', 'is', 'it', 'be', 'by', 'for', 'at', 'as', 'with',
  'from', 'that', 'this', 'unto', 'thy', 'thee', 'ye', 'o', 'not', 'no', 'but', 'so', 'was', 'are', 'i',
  'before', 'after', 'beneath', 'beyond', 'without', 'within', 'under', 'above', 'against', 'upon',
])

// A pathname that never makes decodeURIComponent throw. Malformed escapes are read literally.
export function safePathname(raw) {
  let p = String(raw || '/verse')
  try { decodeURIComponent(p) } catch { p = p.replace(/%/g, '%25') }
  return p
}

export function decoded(path) {
  try { return decodeURIComponent(path) } catch { return String(path) }
}

// The key a path is shelved under: decoded, trailing slashes removed (the same cleaning fromPath uses).
export function shelfKey(path) {
  return decoded(path).replace(/\/+$/, '') || '/'
}

// "/verse/in/the/beginning" -> ["in", "the", "beginning"]. Paths outside /verse keep all their words.
export function pathWords(path) {
  const rest = shelfKey(path).replace(/^\/verse(?=\/|$)/i, '')
  return rest.split(/[/\s+_]+/).map((w) => w.trim().slice(0, 48)).filter(Boolean).slice(0, 24)
}

export function versePath(words) {
  return '/verse' + (words.length ? '/' + words.map((w) => encodeURIComponent(w)).join('/') : '')
}

// Visitor-written text -> path words: lower case, letters, digits and hyphens only, bounded.
export function wordsFromText(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}\s/-]+/gu, ' ')
    .split(/[\s/]+/)
    .map((w) => w.replace(/^-+|-+$/g, '').slice(0, 32))
    .filter(Boolean)
    .slice(0, 12)
}

// Words the Root cannot spell (no Latin letters) still deserve a sigil: displace each character onto
// the wheel of the alphabet by its code point.
export function latinize(word) {
  const w = String(word).toLowerCase()
  if (/[a-z]/.test(w)) return w
  return [...w].map((c) => String.fromCharCode(97 + (c.codePointAt(0) % 26))).join('')
}

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const BOOK_BY_SLUG = new Map(BOOKS.map((b) => [slug(b), b]))
export const bookPath = (book, n = 1) => versePath([slug(book), String(n)])

// Borges' coordinates for a path. The hexagon's full name is 3,200 characters; we print its first sixteen.
export function address(path) {
  const r = makeRng(`hexagon:${shelfKey(path)}`)
  const groups = Array.from({ length: 4 }, () => r.int(0, 1679615).toString(36).padStart(4, '0'))
  return {
    hexagon: groups.join('·'),
    wall: r.int(1, 4),
    shelf: r.int(1, 5),
    volume: r.int(1, 32),
    page: r.int(1, 410),
    line: r.int(1, 40),
  }
}

export function roman(n) {
  if (!(n > 0) || n > 3999 || n % 1) return String(n)
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let s = ''
  for (const [v, l] of map) while (n >= v) { s += l; n -= v }
  return s
}

export const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// What kind of shelf a path sits on. Most paths are ordinary; a few are not.
export function specials(words) {
  const lower = words.map((w) => w.toLowerCase())
  const numbers = [...new Set(lower.filter((w) => /^\d+$/.test(w) && SACRED_NUMBERS[w]))]
  return {
    lost: lower.includes('404'),
    nativity: lower.includes('1996'),
    mala: lower.includes('108'),
    heaven: lower.includes('2147483647'),
    catalogue: lower.length === 0,
    catalogues: lower.join(' ') === 'the catalogue of catalogues',
    numbers,
  }
}

function safeFromPath(path) {
  try { return fromPath(path) } catch { return fromPath(String(path).replace(/%/g, '%25')) }
}

// The chapter at a path. The verses come from scripture.fromPath(); only the label may be overridden:
// "/verse/<book-slug>/<n>" is that book's chapter n as the catalogue shelves it, and anything with 404
// in it belongs to the Book of the Lost.
export function readChapter(path) {
  const { rng, verses } = safeFromPath(path)
  const words = pathWords(path)
  const kinds = specials(words)
  let book = verses[0]?.book ?? 'Selectors'
  let chapter = verses[0]?.chapter ?? 1
  if (words.length === 2 && BOOK_BY_SLUG.has(words[0].toLowerCase()) && /^\d{1,4}$/.test(words[1])) {
    book = BOOK_BY_SLUG.get(words[0].toLowerCase())
    chapter = Number(words[1])
  }
  if (kinds.lost) { book = 'the Book of the Lost'; chapter = 404 }
  return {
    path,
    key: shelfKey(path),
    words,
    rng,
    book,
    chapter,
    ref: `${book} ${chapter}`,
    verses: verses.map((v) => ({ ...v, book, chapter, ref: `${book} ${chapter}:${v.number}` })),
    address: address(path),
    kinds,
  }
}

// ---------------------------------------------------------------------------------------------
// The way onward. From any path there are five ways: deeper (one more word), beside (the last word
// exchanged), above (the last word dropped), elsewhere (a leap across the Library) and onward (the
// next chapter of the same book, as the catalogue shelves it). The stair below a chapter takes one of
// deeper / beside / elsewhere, chosen by the path itself.

const NOUNS = [
  'margin', 'padding', 'border', 'outline', 'content', 'root', 'cascade', 'flow', 'float', 'clear', 'grid',
  'flex', 'ladder', 'mothership', 'inversion', 'reflow', 'repaint', 'veil', 'overflow', 'union', 'selector',
  'pilgrim', 'word', 'seed', 'breath', 'mind', 'wisdom', 'bliss', 'nativity', 'departed', 'humble', 'ghosts',
  'hermitage', 'viewport', 'baptism', 'absolution', 'reckoning', 'spheres', 'lamp', 'stair', 'mirror',
  'hexagon', 'catchword', 'colophon', 'gloss', 'lacuna', 'caret', 'baseline', 'kerning', 'ligature', 'span',
  'div', 'slot', 'layer', 'origin', 'grace', 'karma', 'sheath', 'chakra', 'omega', 'alpha', 'em', 'rem',
  'scrollbar', 'fold', 'anchor', 'shadow', 'specificity', 'quire', 'leaf', 'shelf', 'volume', 'line',
  'letter', 'beginning', 'librarian', 'catalogue', 'vindication', 'palimpsest', 'errata', 'marginalia',
]
const ADJ = [
  'unstyled', 'collapsed', 'overflowing', 'hidden', 'floated', 'inherited', 'absolute', 'relative', 'fixed',
  'sticky', 'transparent', 'initial', 'unset', 'first', 'last', 'seventh', 'thirty-third', 'nameless',
  'twice-rendered', 'empty', 'lost', 'quiet', 'infinite', 'inverted', 'unmanifest', 'crimson',
]
const JOIN = ['in', 'of', 'before', 'after', 'beneath', 'beyond', 'unto', 'without', 'within', 'under', 'above', 'against']
const NUMS = ['3', '5', '7', '12', '16', '33', '96', '108', '404', '1996']
const PHRASES = [
  (r) => ['the', r.pick(NOUNS)],
  (r) => [r.pick(NOUNS), 'of', 'the', r.pick(NOUNS)],
  (r) => [r.pick(JOIN), 'the', r.pick(NOUNS)],
  (r) => [r.pick(ADJ), r.pick(NOUNS)],
  (r) => ['the', r.pick(ADJ), r.pick(NOUNS)],
  (r) => [r.pick(NOUNS)],
  (r) => [r.pick(NUMS)],
  (r) => [r.pick(NOUNS), r.pick(NUMS)],
  (r) => ['in', 'the', r.pick(['beginning', 'margin', 'flow', 'root', 'cascade'])],
]

function classOf(word) {
  const w = word.toLowerCase()
  if (JOIN.includes(w) || w === 'the') return JOIN
  if (ADJ.includes(w)) return ADJ
  if (/^\d+$/.test(w)) return NUMS
  return NOUNS
}

export function onward(path) {
  const key = shelfKey(path)
  const ws = pathWords(path)
  const root = makeRng(`onward:${key}`)
  const lastIsJoin = ws.length && (JOIN.includes(ws[ws.length - 1].toLowerCase()) || ws[ws.length - 1].toLowerCase() === 'the')

  const d = root.fork('deeper')
  const deeper = [...ws.slice(0, 7), lastIsJoin ? d.pick(NOUNS) : d.pick([...JOIN, 'the', ...NOUNS, ...NOUNS, ...ADJ])]

  let beside = null
  if (ws.length) {
    const b = root.fork('beside')
    const pool = classOf(ws[ws.length - 1]).filter((w) => w !== ws[ws.length - 1].toLowerCase())
    beside = [...ws.slice(0, -1), b.pick(pool)]
  }

  const e = root.fork('elsewhere')
  let elsewhere = e.weighted({ 0: 3, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 0.7, 7: 0.8, 8: 0.5 })
  elsewhere = PHRASES[Number(elsewhere)](e)
  if (elsewhere.join('/') === ws.join('/').toLowerCase()) elsewhere = [...elsewhere, e.pick(NOUNS)]

  const ch = readChapter(path)
  return {
    deeper: versePath(deeper),
    beside: beside && versePath(beside),
    above: ws.length ? versePath(ws.slice(0, -1)) : null,
    elsewhere: versePath(elsewhere),
    onward: bookPath(ch.book === 'the Book of the Lost' ? 'Lamentations of the Float' : ch.book, ch.chapter + 1),
  }
}

// The mirror in the hallway, "which faithfully duplicates all appearances". It shows a path with its
// words in the opposite order; a path of one word, with its letters reversed. Returns null for the
// catalogue, and the path itself when the path is its own reflection.
export function mirrorPath(path) {
  const ws = pathWords(path)
  if (!ws.length) return null
  const flipped = ws.length > 1 ? [...ws].reverse() : [[...ws[0]].reverse().join('')]
  return versePath(flipped)
}

export function isOwnReflection(path) {
  const m = mirrorPath(path)
  return Boolean(m) && shelfKey(m).toLowerCase() === shelfKey(versePath(pathWords(path))).toLowerCase()
}

// The stair: which way the scroll continues below the chapter at `path`. `turn` (how many times the
// reader has already met this chapter today) bends the walk, so the Library repeats but never loops.
export function stairStep(path, turn = 0) {
  const r = makeRng(`stair:${shelfKey(path)}${turn ? `#${turn}` : ''}`)
  if (turn) return { move: 'elsewhere', path: versePath(r.pick(PHRASES.slice(0, 6))(r)) }
  const ways = onward(path)
  const depth = pathWords(path).length
  const move = r.weighted({
    deeper: depth < 3 ? 3 : depth < 5 ? 1.4 : 0.2,
    beside: ways.beside ? 1.7 : 0,
    elsewhere: depth >= 4 ? 2.4 : 1,
  })
  return { move, path: ways[move] }
}

// Where the path words stand in the chapter: the concordance printed at its foot.
export function concordance(ch) {
  const out = []
  const seen = new Set()
  for (const w of ch.words) {
    const lw = w.toLowerCase()
    if (STOP.has(lw) || seen.has(lw) || !/\p{L}/u.test(lw) || lw.length < 2) continue
    seen.add(lw)
    const re = new RegExp(`(^|[^\\p{L}])${lw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'iu')
    out.push({ word: w, hits: ch.verses.filter((v) => re.test(v.text)).map((v) => v.number) })
    if (out.length >= 6) break
  }
  return out
}

// Printer's signature for leaf k: A, A2, A3, A4, B, B2 ... (no J, U or W, as the old printers counted).
const SIG = 'ABCDEFGHIKLMNOPQRSTXYZ'
export function signature(k) {
  const g = Math.floor(k / 4)
  const letter = SIG[g % SIG.length].repeat(1 + Math.floor(g / SIG.length))
  const leaf = (k % 4) + 1
  return leaf === 1 ? letter : `${letter}${leaf}`
}
