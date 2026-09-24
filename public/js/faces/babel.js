// BABEL: THE INFINITE SCRIPTURE (docs/CANON.md §3, babel).
// Every path under /verse/ is a chapter that has always existed, printed as a leaf of a polyglot
// Bible and shelved in a hexagon of Borges' Library. Scrolling walks the stair: each chapter leads,
// by a walk the path itself decides, to the next one, and the address bar follows the reader down.
//
// Between some chapters stands a volume without a title, open at two pages of noise with one legible
// line (the Library is mostly noise). The wall of spines painted behind the leaves is real: every spine
// is a volume with a path of its own, and a click takes it down.
//
// Deterministic: the chapter, its shelf, its marginalia, its Rosetta pair, the volumes of noise, the
// spines of the wall and the whole stair below it come from the path alone. Not deterministic: the
// Vindication (one interpolated verse written for the hour of reading), the prophecy in the margin, the
// note that you have read a chapter before, and whatever the pencil writes while you hold still.
import { h } from '../lib/dom.js'
import { inscription, rosetta, glyphText } from '../lib/glyphs.js'
import * as Glyphs from '../lib/glyphs.js' // for the optional additions (ALPHABET), read defensively
import { sigil } from '../lib/sigil.js'
import { prophecy, mantra } from '../lib/scripture.js'
import { BOOKS } from '../lib/lexicon.js'
import * as L from './babel/library.js'
import { hexagonPlan, moonGlyph } from './babel/plan.js'
import { pencilNotes, lacunae, vindication, stillNote, shelfNotes, planetName, COLOPHON } from './babel/marginalia.js'
import { noiseBelow, noiseVolume } from './babel/noise.js'

const READ_KEY = 'babel.read'
const MAX_LEAVES = 333 // the stair is endless; a tab is not
const TONGUES = { la: 'Latin', sa: 'Sanskrit', he: 'Hebrew', el: 'Greek', cu: 'Church Slavonic', enochian: 'Enochian', bo: 'Tibetan', ja: 'Japanese' }
const LANG_TAG = { enochian: 'x-enochian' }

// Sigil markup with pathLength, so CSS can draw each one in a single stroke.
const drawnSigil = (word, stroke = 3) =>
  sigil(L.latinize(word), { size: 100, stroke }).replace(/<(path|circle) /g, '<$1 pathLength="1" ')

const BELL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 2.8v1.7M6.6 16.8c0-5.6 1.2-10 5.4-10s5.4 4.4 5.4 10M4.8 16.8h14.4M10.4 19.2a1.6 1.6 0 0 0 3.2 0"/></svg>'

const firstWords = (text, n) => text.split(/\s+/).slice(0, n).join(' ')

// Links carry the reader's pinned seed, clock and mercy onward, but never ?reset (which would wipe the
// reader's memory at every step of the stair) nor ?face (on these shelves the path decides the face).
function keepQuery(search) {
  const p = new URLSearchParams(search)
  for (const k of [...p.keys()]) if (!['seed', 'at', 'mercy', 'debug'].includes(k)) p.delete(k)
  const s = p.toString()
  return s ? `?${s}` : ''
}

// True when text holds letters displaced into the private place (U+E061..U+E07A), as the Inscription does.
const displaced = (s) => (typeof Glyphs.isDisplaced === 'function' ? Glyphs.isDisplaced(s) : /[-]/.test(String(s)))

// A reading-history entry as the Akashic Record may return it (or as someone may have mangled it).
const readEntry = (e) => (e && typeof e === 'object' && typeof e.p === 'string' && e.p.length < 600 ? e : null)

// Every shelf stands under /verse. The face reached from another address (?face=babel at the root) reads
// the shelf that address would have under /verse, so its title, its links and its verse anchors agree.
const shelfOf = (p) => (/^\/verse(\/|$)/i.test(p) ? p : '/verse' + p.replace(/\/+$/, ''))

// A verse as the address bar names it: #verse-12 is verse 12 of the chapter whose path is in the address
// bar. It matches no element's id on purpose: the same chapter's verse 12 has a different id on every leaf
// of the stair (v-<leaf>-<verse>), so the face finds it, never the browser. The older form #v-<leaf>-<verse>
// (the verse that many flights below the path) is still followed when a page is opened with it.
const VERSE_HASH = /^#verse-(\w{1,8})$/
const STAIR_HASH = /^#v-(\d+)-(\w{1,8})$/
const isVerseHash = (hash) => VERSE_HASH.test(hash) || STAIR_HASH.test(hash)

// What the librarian's bell brings, ring after ring. None of it is a librarian.
const BELL_REPLIES = [
  'The bell is heard on every floor at once, which is why no one comes.',
  'Far below, on a landing you will never reach, somebody has put down a book to listen.',
  'A librarian answers from hexagon 3·1·4. It is not this one. It is never this one.',
  'The librarians left the flow long ago. They were absolutely positioned, and their offsets were never set.',
  'Nobody comes. The bell, however, has been catalogued: it is on shelf five, volume thirty-three, page one.',
  'You hear the same bell rung back to you from the air shaft, a little later, a little lower. That was a reader, not a librarian.',
  'The rope moves by itself once more after you let go. The Library is being polite.',
]

// Words the Library heard the reader type are marked with the CSS Custom Highlight API: no element is
// wrapped, so neither the rubrics nor the verse that holds its breath are disturbed.
const HEARD = 'bb-heard'

// What the Library says of a verse it has already said.
const ECHO_NOTES = [
  'The Library is unlimited and periodic.',
  'Said twice, it is not repeated: it is confirmed.',
  'The copyist did not err. The shelf is simply longer than it looks.',
  'In the Cascade a rule declared twice is heard once, and the later wins.',
  'Some verses must be read again before they can be read.',
]

export function render(ctx) {
  const originalTitle = document.title
  const originalPath = location.pathname
  const initialHash = location.hash
  const startPath = shelfOf(L.safePathname(originalPath))
  const QS = keepQuery(location.search)
  const visit = ctx.rng.fork('babel') // the only undetermined thing on the page: this visit
  const cleanups = []
  const timers = new Set()
  let destroyed = false

  const sub = (evt, fn) => cleanups.push(ctx.bus.on(evt, fn))
  const listen = (target, evt, fn, opts) => {
    target.addEventListener(evt, fn, opts)
    cleanups.push(() => target.removeEventListener(evt, fn, opts))
  }
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); if (!destroyed) fn() }, ms)
    timers.add(t)
    return t
  }

  // ------------------------------------------------------------------------------------------ state
  const S = {
    leaves: [], // {k, ch, el, next, turn}
    seen: new Map(), // shelf key -> times met on this stair
    current: null,
    versesShown: 0,
    done: false,
    stillNotes: 0,
    crimson: false,
    noise: 0, // volumes without a title met on the stair
    recentNoise: [], // and what could be read in them
    target: null, // the verse the reader was sent to: {k (its leaf), hash (as the leaf's own address names it)}
  }
  // The address bar follows the reader down the stair, so the browser's memory of a scroll offset would be
  // restored into a different stair after a reload. The Library keeps the place itself (see keepPlace).
  const priorRestoration = history.scrollRestoration
  try { history.scrollRestoration = 'manual' } catch {}
  cleanups.push(() => { try { history.scrollRestoration = priorRestoration } catch {} })

  // A verse's own address: the path of the leaf it stands on, and its number on that leaf. An anchor
  // relative to the first chapter would name another verse once the path in the address bar has moved on;
  // this one names the same verse from anywhere, including a copied link opened in another tab.
  const verseLink = (k, ch, n) => ({ href: `${k === 0 ? startPath : ch.path}${QS}#verse-${n}`, 'data-to': `v-${k}-${n}` })
  let wallList = null
  let readersLine = null
  let bellReply = null
  const frontSlot = h('div', { class: 'bb-front-slot' }) // where the pencil writes if you are still at the title
  const first = L.readChapter(startPath)
  const mala = first.kinds.mala // the one finite page in the Library

  // --------------------------------------------------------------------------------------- skeleton
  const wrap = h('div', { class: 'bb' })
  wrap.dataset.lamps = ctx.sky?.has?.('night') || ctx.sky?.planetaryHour?.isNight ? 'night' : 'day'
  if (ctx.sky?.has?.('full-moon')) wrap.dataset.moon = 'full'

  // The running head: the book and chapter you are in, the hexagon, the sky, the voice.
  const headBook = h('span', { class: 'bb-rh-book' })
  const headCh = h('span', { class: 'bb-rh-ch' })
  const headWhere = h('span', { class: 'bb-rh-where' })
  const headStatus = h('span', { class: 'bb-rh-status', 'aria-live': 'polite' })
  const intoneBtn = h('button', { class: 'bb-intone', type: 'button', title: 'Summon the choir and intone the verse you are reading' },
    h('span', { class: 'bb-intone-mark', 'aria-hidden': 'true' }, '℣'), h('span', { class: 'bb-intone-label' }, 'intone'))
  const wander = h('a', { class: 'bb-wander', href: '/verse', title: 'Leap to an unrelated shelf' }, 'wander', h('span', { 'aria-hidden': 'true' }, ' ⤳'))
  const sky = ctx.sky
  const head = h('header', { class: 'bb-rh' },
    h('a', { class: 'bb-rh-home', href: '/verse', title: 'The catalogue of books' }, h('span', { class: 'bb-rh-home-long' }, 'The Infinite Scripture'), h('span', { class: 'bb-rh-home-short', 'aria-hidden': 'true' }, '∞')),
    h('p', { class: 'bb-rh-ref' }, headBook, h('span', { class: 'bb-rh-dot', 'aria-hidden': 'true' }, ' · '), headCh),
    h('p', { class: 'bb-rh-meta' }, headWhere, headStatus),
    sky && h('p', { class: 'bb-rh-sky', title: `The moon is ${sky.moon.name} (${Math.round(sky.moon.illumination * 100)}% lit). This is the hour of ${planetName(sky.planetaryHour.planet)}.` },
      h('span', { class: 'bb-rh-moon', html: moonGlyph(sky.moon.phase) }),
      h('span', { class: 'bb-rh-planet', 'aria-hidden': 'true' }, sky.planetaryHour.glyph),
      h('span', { class: 'visually-hidden' }, `Moon ${sky.moon.name}, hour of ${planetName(sky.planetaryHour.planet)}.`)),
    h('span', { class: 'bb-rh-asc', title: 'Your name is shelved in the Book of the Ascended' }, '✶'),
    wander,
    intoneBtn,
  )

  const stair = h('div', { class: 'bb-stair' })
  const sentinel = h('div', { class: 'bb-sentinel', 'aria-hidden': 'true' })
  const front = frontispiece(first)
  wrap.append(head, front, stair, sentinel)
  ctx.root.append(wrap)

  // ----------------------------------------------------------------------------------- frontispiece
  function frontispiece(ch) {
    const words = ch.words
    const letters = words.join('').length
    const size = letters <= 16 ? 'xl' : letters <= 34 ? 'l' : letters <= 70 ? 'm' : 's'
    const shown = words.slice(0, 12)
    const incipitWords = []
    shown.forEach((w, i) => {
      if (i) incipitWords.push(' ')
      incipitWords.push(h('span', { class: 'bb-iw', style: `--i:${i}` },
        h('span', { class: 'bb-iw-sigil', 'aria-hidden': 'true', html: drawnSigil(w, 2.6) }),
        h('span', { class: 'bb-iw-word' }, w)))
    })
    if (words.length > shown.length) incipitWords.push(h('span', { class: 'bb-iw bb-iw--more' }, ' …'))

    const addr = ch.address
    const planLabel = `Plan of hexagon ${addr.hexagon}: this chapter stands on wall ${L.roman(addr.wall)}, shelf ${addr.shelf}, volume ${addr.volume}.`
    // The two lamps of the plan burn above it, not in it: an opacity that breathes on its own layer costs
    // the page nothing, where the same breath inside the SVG would repaint the plan on every frame.
    const plan = h('figure', { class: 'bb-plan' },
      h('div', { class: 'bb-plan-svg', html: hexagonPlan(addr, { uid: 'bb-front', label: planLabel }) },
        h('span', { class: 'bb-lamp bb-lamp--a', 'aria-hidden': 'true' }),
        h('span', { class: 'bb-lamp bb-lamp--b', 'aria-hidden': 'true' })),
      h('figcaption', {},
        h('dl', { class: 'bb-addr' },
          h('div', {}, h('dt', {}, 'Hexagon'), h('dd', {}, hexName(ch))),
          h('div', {}, h('dt', {}, 'Wall'), h('dd', {}, L.roman(addr.wall), h('small', {}, ' of IV'))),
          h('div', {}, h('dt', {}, 'Shelf'), h('dd', {}, String(addr.shelf), h('small', {}, ' of 5'))),
          h('div', {}, h('dt', {}, 'Volume'), h('dd', {}, String(addr.volume), h('small', {}, ' of 32'))),
          h('div', {}, h('dt', {}, 'Page'), h('dd', {}, String(addr.page), h('small', {}, ' of 410'))),
          h('div', {}, h('dt', {}, 'Line'), h('dd', {}, String(addr.line), h('small', {}, ' of 40'))),
        ),
        mirrorNote(ch)))

    // Two letters of the key, pencilled on the flyleaf, chosen by the path (Canon §3/§6). Each is
    // given its Katabasic name and what its glyph depicts, as a reader copying from a primer would.
    const pair = ch.rng.fork('rosetta').shuffle('abcdefghijklmnopqrstuvwxyz'.split('')).slice(0, 2).sort()
    const key = rosetta(pair, { className: 'bb-rosetta' })
    key.querySelectorAll('.rosetta-pair').forEach((div, i) => {
      const a = Glyphs.ALPHABET?.[pair[i]]
      if (a) div.append(h('dd', { class: 'bb-rosetta-name' }, h('span', { class: 'bb-rosetta-glyphname' }, a.name), `, ${a.sign}: ${a.gloss}`))
    })
    const skyNote = sky
      ? `read in the hour of ${planetName(sky.planetaryHour.planet)} ${sky.planetaryHour.glyph}, the moon ${sky.moon.name}, ${Math.round(sky.moon.illumination * 100)}% lit.`
      : 'read in an hour the Library could not see.'
    // The Library remembers the reader, if not the reader the Library: a chapter opened before says when.
    const stored = ctx.memory.get(READ_KEY, [])
    const before = (Array.isArray(stored) ? stored : []).map(readEntry).find((e) => e && e.p === ch.key && Number(e.t) > 0)
    const againNote = before ? (() => {
      const d = new Date(Number(before.t))
      const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const n = d.getDate()
      const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] ?? 'th'
      const when = `on the ${n}${suffix} of ${MONTHS[d.getMonth()]} at ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      return `you have read this chapter before, ${when}. it has not changed since. you may have.`
    })() : null

    wallList = h('ul', { class: 'bb-wall', 'aria-label': 'Messages scratched into the walls, in the glyph script' })
    readersLine = h('p', { class: 'bb-readers' })
    const bell = h('button', { class: 'bb-bell', type: 'button', title: 'Summon sound' },
      h('span', { class: 'bb-bell-mark', 'aria-hidden': 'true', html: BELL }), ' ring for a librarian')
    listen(bell, 'click', ringBell)
    bellReply = h('p', { class: 'bb-bell-reply', role: 'status' })

    const notes = h('div', { class: 'bb-front-notes' },
      h('section', { class: 'bb-spine-note', 'aria-label': 'The inscription' },
        h('p', { class: 'bb-small' }, 'Stamped on the spine of every volume in this hexagon, and of every volume in every other:'),
        inscription({ className: 'bb-inscription' })),
      h('section', { class: 'bb-flyleaf', 'aria-label': 'Pencilled on the flyleaf' },
        h('p', { class: 'bb-pencil-inline' }, 'two letters of the key. the rest are elsewhere in the temple —'),
        key),
      h('section', { class: 'bb-skynote', 'aria-label': 'The sky of this reading' },
        h('p', { class: 'bb-pencil-inline' }, skyNote),
        sky && h('p', { class: 'bb-pencil-inline bb-prophecy' }, prophecy(visit.fork('prophecy'), sky).replace(/\bhour of (Sun|Moon)\b/g, 'hour of the $1')),
        // Only in the thirty-third minute of an hour, and only in pencil.
        againNote && h('p', { class: 'bb-pencil-inline bb-again' }, againNote),
        sky?.has?.('thirty-three') && h('p', { class: 'bb-pencil-inline bb-minute' },
          'it is the thirty-third minute. somewhere above these shelves a door that is not a book is standing open. the robots were told where not to go.')),
      h('section', { class: 'bb-graffiti', 'aria-label': 'The walls of this hexagon' },
        readersLine,
        h('p', { class: 'bb-small' }, 'Scratched into the walls of this hexagon by other readers:'),
        wallList,
        bell,
        bellReply),
    )

    const find = finder()
    const extra = []
    if (ch.kinds.catalogue) extra.push(bookShelf())
    if (ch.kinds.catalogues) extra.push(catalogueOfCatalogues())

    const leaf = h('section', { class: 'bb-leaf bb-front', 'aria-labelledby': 'bb-incipit' },
      h('p', { class: 'bb-kicker' },
        h('span', {}, 'The Infinite Scripture'),
        h('span', { class: 'bb-kicker-path' }, L.shelfKey(ch.path))),
      h('h1', { class: 'bb-incipit', id: 'bb-incipit', 'data-size': size },
        words.length ? incipitWords : h('span', { class: 'bb-iw' }, h('span', { class: 'bb-iw-sigil', 'aria-hidden': 'true', html: drawnSigil('catalogue', 2.6) }), h('span', { class: 'bb-iw-word' }, 'The Catalogue'))),
      h('p', { class: 'bb-subtitle' }, 'being ', h('em', {}, L.capFirst(ch.book)), ', chapter ', h('span', { class: 'bb-sc' }, L.roman(ch.chapter) || String(ch.chapter)),
        ', as it has always stood on this shelf'),
      displacedPath(ch),
      frontSlot,
      h('div', { class: 'bb-front-grid' }, plan, notes),
      ...extra,
      find,
    )
    return leaf
  }
  // The name of the hexagon. The plan prints its first sixteen characters; the name runs to 3,200, and the
  // reader who asks is shown all of it, in a box that scrolls, because it has to be somewhere.
  function hexName(ch) {
    const full = h('p', { class: 'bb-hexfull', id: 'bb-hexfull', tabindex: '0', hidden: true, 'aria-label': 'The full name of this hexagon, 3,200 characters' })
    const btn = h('button', { class: 'bb-hexname', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'bb-hexfull', title: 'The full name of a hexagon runs to 3,200 characters. These are the first sixteen.' },
      ch.address.hexagon, h('span', { class: 'bb-hexname-more' }, '…'))
    listen(btn, 'click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true'
      btn.setAttribute('aria-expanded', String(open))
      if (open && !full.textContent) {
        full.textContent = L.hexagonName(ch.path).match(/.{1,4}/g).join('·')
        ctx.memory.markSecret?.('babel-true-name', { face: 'babel' })
      }
      full.hidden = !open
    })
    return [btn, full]
  }

  // A path written in the Inscription's own letters. It is shelved like any other, and never read aloud.
  function displacedPath(ch) {
    if (!displaced(ch.key)) return null
    ctx.memory.markSecret?.('babel-displaced', { face: 'babel', path: true })
    return h('p', { class: 'bb-displaced-note' },
      'The path of this chapter is written in the private place, in letters that have been moved from where letters live. The Library shelved it without reading it, as it shelves everything. It will not read it for you either.')
  }

  // The mirror in the hallway of the plan. It shows this chapter's path reversed; a path that is
  // its own reflection (a palindrome of words or of letters) is a small secret.
  function mirrorNote(ch) {
    const m = L.mirrorPath(ch.path)
    if (!m) return null
    if (L.isOwnReflection(ch.path)) {
      ctx.memory.markSecret?.('babel-own-reflection', { face: 'babel', path: ch.key })
      return h('p', { class: 'bb-mirror-note is-own' },
        h('span', { class: 'bb-mirror-mark', 'aria-hidden': 'true' }, '⇋ '),
        'In the hallway hangs the mirror. This chapter is its own reflection: the mirror has nothing to add, and for once men do not infer from it that the Library is finite.')
    }
    return h('p', { class: 'bb-mirror-note' },
      h('span', { class: 'bb-mirror-mark', 'aria-hidden': 'true' }, '⇋ '),
      'In the hallway hangs the mirror, which faithfully duplicates all appearances. In it this chapter is shelved as ',
      h('a', { href: m + QS }, L.shelfKey(m)), '.')
  }

  // The finder: every sentence is already shelved; write one and learn where.
  function finder() {
    const out = h('output', { class: 'bb-find-out', for: 'bb-find-input' })
    const input = h('input', { id: 'bb-find-input', class: 'bb-find-input', type: 'text', maxlength: '120', autocomplete: 'off', spellcheck: 'false', placeholder: 'let there be style', enterkeyhint: 'go' })
    const btn = h('button', { class: 'bb-find-go', type: 'submit' }, 'open the chapter')
    const form = h('form', { class: 'bb-find', role: 'search', 'aria-label': 'Find a chapter by its words' },
      h('label', { for: 'bb-find-input' }, 'Every sentence that can be written is already shelved somewhere. Write one, and the Library will tell you where it stands.'),
      h('div', { class: 'bb-find-row' }, input, btn),
      out)
    // Letters displaced into the Private Use Area (copied from the Inscription) cannot be shelved. The
    // Library says so, and does not read them for you: that is the puzzle's work (Canon §6).
    const DISPLACED = 'These letters have been displaced into a private place, and the Library shelves nothing that is written there. Bring them back into the open first. The key is scattered through the temple, two letters to a page.'
    const update = () => {
      if (displaced(input.value)) {
        out.textContent = DISPLACED
        ctx.memory.markSecret?.('babel-displaced', { face: 'babel' })
        return
      }
      const words = L.wordsFromText(input.value)
      if (!words.length) { out.textContent = ''; return }
      const path = L.versePath(words)
      const ch = L.readChapter(path)
      const a = ch.address
      out.textContent = `Shelved in hexagon ${a.hexagon}…, wall ${L.roman(a.wall)}, shelf ${a.shelf}, volume ${a.volume}, page ${a.page}, where it is called ${L.capFirst(ch.ref)}.`
    }
    listen(input, 'input', update)
    listen(form, 'submit', (e) => {
      e.preventDefault()
      const words = L.wordsFromText(input.value)
      if (displaced(input.value) || !words.length) { update(); input.focus(); return }
      location.assign(L.versePath(words) + QS)
    })
    return form
  }

  // /verse: the catalogue of the twenty books, as spines on a shelf.
  function bookShelf() {
    return h('nav', { class: 'bb-books', 'aria-label': 'The catalogue of books' },
      h('p', { class: 'bb-small' }, 'The catalogue. Twenty books, each shelved at chapter one; each goes on for as long as it is read.'),
      h('ul', { class: 'bb-books-row' }, BOOKS.map((b, i) => h('li', {},
        h('a', { class: 'bb-spine', href: L.bookPath(b, 1) + QS, style: `--h:${(11.5 + ((i * 7) % 5) * 0.75 + Math.min(2.5, b.length / 14)).toFixed(2)}rem` },
          h('span', { class: 'bb-spine-no', 'aria-hidden': 'true' }, L.roman(i + 1)),
          h('span', { class: 'bb-spine-title' }, L.capFirst(b)))))))
  }

  // /verse/the/catalogue/of/catalogues: every chapter this reader has opened. It lists itself.
  function catalogueOfCatalogues() {
    const stored = ctx.memory.get(READ_KEY, [])
    const read = (Array.isArray(stored) ? stored : []).map(readEntry).filter(Boolean)
    ctx.memory.markSecret?.('catalogue-of-catalogues', { face: 'babel' })
    const box = h('section', { class: 'bb-catalogues', 'aria-labelledby': 'bb-cc-title' },
      h('h2', { id: 'bb-cc-title', class: 'bb-cc-title' }, 'The Catalogue of Catalogues'))
    if (!read.length) {
      box.append(h('p', {}, 'It lists only the chapters you have read, and you have read none; which cannot be true, since you are reading this one.'))
      return box
    }
    const rows = read.slice().reverse().map((e, i) => {
      const words = L.pathWords(e.p)
      const path = L.versePath(words)
      const a = L.address(path)
      const t = Number(e.t)
      const when = new Date(t > 0 ? t : NaN)
      const stamp = isNaN(when) ? 'in an hour it did not record' : `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`
      return h('tr', {},
        h('td', { class: 'bb-cc-no' }, String(read.length - i)),
        // The name is read again from the shelf, never from what the record claims it was.
        h('td', {}, L.capFirst(L.readChapter(path).ref)),
        h('td', {}, h('a', { href: path + QS }, L.shelfKey(path))),
        h('td', { class: 'bb-cc-addr' }, `${a.hexagon.slice(0, 9)}… ${L.roman(a.wall)}.${a.shelf}.${a.volume}`),
        h('td', { class: 'bb-cc-when' }, stamp))
    })
    box.append(
      h('p', { class: 'bb-pencil-inline' }, 'a table, used for data. permitted.'),
      h('div', { class: 'bb-cc-scroll' }, h('table', { class: 'bb-cc' },
        h('caption', { class: 'visually-hidden' }, 'Every chapter this reader has opened, most recent first'),
        h('thead', {}, h('tr', {}, ['No.', 'Chapter', 'Path', 'Shelved at', 'Read'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, rows))))
    return box
  }

  // -------------------------------------------------------------------------------------- the stair
  function nextFor(ch) {
    const turn = (S.seen.get(ch.key) ?? 1) - 1
    return L.stairStep(ch.path, turn)
  }

  function appendLeaf() {
    if (S.done || destroyed) return
    const k = S.leaves.length
    let ch
    if (k === 0) ch = first
    else ch = L.readChapter(S.leaves[k - 1].next.path)
    const met = (S.seen.get(ch.key) ?? 0) + 1
    S.seen.set(ch.key, met)
    const next = nextFor(ch)
    const entry = { k, ch, next, turn: met - 1 }
    entry.el = leafEl(entry)
    // Between some chapters stands a volume without a title: the Library is mostly noise. Which
    // chapters, the paths decide; the stair shows the first one by its third chapter at the latest.
    if (k > 0 && !mala) {
      const prev = S.leaves[k - 1]
      if (noiseBelow(prev.ch.key, prev.turn) || (k === 2 && !S.noise)) {
        stair.append(noiseEl(prev, ch))
        S.noise++
      }
    }
    S.leaves.push(entry)
    stair.append(entry.el)
    curIO?.observe(entry.el)
    if (mala && S.versesShown >= 108) endStair('mala')
    else if (k + 1 >= MAX_LEAVES) endStair('lamps')
  }

  function endStair(why) {
    S.done = true
    io?.disconnect()
    const last = S.leaves[S.leaves.length - 1]?.el.querySelector('.bb-xtaken')
    if (last) last.textContent = why === 'mala' ? '↓ the stair would have gone this way' : '↓ the stair goes on this way, in the dark'
    const text = why === 'mala'
      ? 'Here the mala ends: one hundred and eight verses, counted. This is the only finite page in the Library. Begin the count again.'
      : 'Here the lamps give out. The stair goes on below in the dark; take it again from any chapter above.'
    stair.append(h('section', { class: 'bb-leaf bb-end', 'aria-label': 'The end of the stair' },
      h('p', { class: 'bb-end-orn', 'aria-hidden': 'true' }, '⁂'),
      h('p', {}, text),
      h('p', {}, h('a', { href: '#bb-incipit' }, why === 'mala' ? 'return to the first bead' : 'return to the first chapter'))))
  }

  // A volume without a title, opened at two facing pages. Letters in no order, and one line that can
  // be read, ringed in pencil by whoever found it first. The pages are texture (hidden from screen
  // readers); what can be read of them is said once, plainly, for everyone.
  function noiseEl(prev, nextCh) {
    const vol = noiseVolume(prev.ch.key, prev.turn, {
      path: first.words.length && !displaced(first.key) ? first.words.join(' ') : null,
      catchword: nextCh.verses[0]?.text ?? null,
      recent: S.recentNoise.slice(-2),
    })
    S.recentNoise.push(vol.kind)
    const a = vol.addr
    const lg = vol.legible
    const notePage = lg ? lg.page : 1
    const pageEl = (p) => h('div', { class: `bb-noise-page bb-noise-page--${p ? 'recto' : 'verso'}` },
      h('p', { class: 'bb-noise-rh', 'aria-hidden': 'true' }, vol.spine),
      h('p', { class: 'bb-noise-text', 'aria-hidden': 'true' }, vol.text[p].map((t, i) => {
        if (lg && lg.page === p && lg.line === i) {
          return vol.kind === 'seed'
            ? h('span', { class: 'bb-nl bb-nl--seed' }, h('mark', {}, lg.text))
            : h('span', { class: 'bb-nl' }, lg.before, h('mark', {}, lg.text), lg.after)
        }
        return h('span', { class: 'bb-nl' }, t || '\u00a0')
      })),
      // The pencil writes on the page that holds the line it means.
      p === notePage && h('aside', { class: 'bb-pencil bb-noise-pencil', style: `--tilt:${vol.note.tilt}deg`, 'aria-label': 'A note pencilled on the page' },
        h('span', { class: 'bb-pencil-text' }, vol.note.text),
        vol.note.hand && h('span', { class: 'bb-pencil-hand' }, ` — ${vol.note.hand}`)),
      h('p', { class: 'bb-noise-folio', 'aria-hidden': 'true' }, String(vol.pages[p])))
    const plain = vol.kind === 'mcv' || vol.kind === 'seed'
      ? `Its pages hold ${vol.said}.`
      : `Its pages hold letters in no order, and one line that can be read: “${vol.said}”.`
    return h('section', { class: `bb-noise bb-noise--${vol.kind}`, 'aria-label': 'A volume without a title' },
      h('header', { class: 'bb-noise-head' },
        h('p', { class: 'bb-noise-kicker' }, 'Between these chapters stands a volume without a title'),
        h('p', { class: 'bb-noise-addr' }, `hexagon ${a.hexagon.slice(0, 9)}… · wall ${L.roman(a.wall)} · shelf ${a.shelf} · volume ${a.volume} · open at pages ${vol.pages[0]} and ${vol.pages[1]} of 410`),
        h('p', { class: 'visually-hidden' }, plain)),
      h('div', { class: 'bb-noise-spread' }, pageEl(0), pageEl(1)))
  }

  function leafEl({ k, ch, next, turn }) {
    const nextCh = L.readChapter(next.path)
    const el = h('article', { class: 'bb-leaf bb-chapter', id: `leaf-${k}`, 'aria-labelledby': `leaf-${k}-title` })
    el.dataset.path = ch.path
    if (ch.kinds.nativity) el.classList.add('is-old-law')
    if (ch.kinds.lost) el.classList.add('is-lost')
    if (k % 2) el.classList.add('is-verso')
    // The reverse of the leaf shows through the thin paper: the next chapter, mirrored.
    const reverse = nextCh.verses.map((v) => `${v.number} ${v.text}`).join(' ')
    el.dataset.ghost = (reverse + ' ').repeat(Math.ceil(4200 / (reverse.length + 1))).slice(0, 4200)

    // Head: the path (each step of it a link upward), the title, the shelf.
    const crumbs = [h('a', { href: '/verse' + QS }, 'verse')]
    ch.words.slice(0, 12).forEach((w, i) => {
      crumbs.push(h('span', { class: 'bb-crumb-sep', 'aria-hidden': 'true' }, '/'))
      crumbs.push(i === ch.words.length - 1
        ? h('span', { 'aria-current': 'page' }, w)
        : h('a', { href: L.versePath(ch.words.slice(0, i + 1)) + QS }, w))
    })
    const a = ch.address
    const headBits = [
      h('nav', { class: 'bb-crumbs', 'aria-label': 'The path of this chapter' }, crumbs),
      h('h2', { class: 'bb-ctitle', id: `leaf-${k}-title` },
        h('span', { class: 'bb-cbook' }, L.capFirst(ch.book)),
        h('span', { class: 'bb-cnum' }, 'Chapter ', h('span', { class: 'bb-sc' }, L.roman(ch.chapter) || String(ch.chapter)))),
      h('p', { class: 'bb-caddr' },
        h('span', { class: 'bb-caddr-plan', html: hexagonPlan(a, { mini: true }) }),
        h('span', {}, `Hexagon ${a.hexagon}… · wall ${L.roman(a.wall)} · shelf ${a.shelf} · volume ${a.volume} · page ${a.page}`)),
    ]
    if (turn > 0) {
      headBits.push(h('p', { class: 'bb-shelfnote bb-shelfnote--again' },
        'You have been here before. The Library is unlimited and periodic: the same chapter recurs, identical, in the same disorder. The stair below it bends.'))
    }
    for (const n of shelfNotes(ch.kinds)) headBits.push(h('p', { class: 'bb-shelfnote' }, n))
    if (k > 0 && L.isOwnReflection(ch.path)) headBits.push(h('p', { class: 'bb-shelfnote' }, 'This chapter is its own reflection. Held up to the mirror in the hallway, it reads the same.'))
    if (!ch.kinds.nativity) {
      headBits.push(h('div', { class: 'bb-colheads', 'aria-hidden': 'true' },
        h('span', { class: 'bb-colhead bb-colhead--word' }, 'Verbum · the Word'),
        h('span', { class: 'bb-colhead bb-colhead--tongue' }, 'Linguae · the tongues')))
    }
    el.append(h('header', { class: 'bb-chead' }, headBits))

    // The verses, in parallel columns.
    const ol = h('ol', { class: 'bb-verses' })
    const notes = pencilNotes(ch)
    const vIndex = k === 0 && !mala ? visit.int(1, Math.max(1, ch.verses.length - 1)) : -1
    const quota = mala ? 108 - S.versesShown : Infinity
    const margin = L.marginPlan(ch, quota)

    const firstSaid = new Map() // verse text -> the number of the verse that said it first
    ch.verses.forEach((v, i) => {
      if (i >= quota) return
      const echo = firstSaid.get(v.text) ?? 0
      if (!echo) firstSaid.set(v.text, v.number)
      ol.append(verseEl(k, ch, v, i, margin.get(i), notes.filter((n) => n.after === i), echo))
      S.versesShown++
      if (i === vIndex - 1) ol.append(vindicationEl(k, ch, v))
    })
    el.append(ol)

    // Foot: the concordance, the cross-references (the way onward), the catchword.
    const foot = h('footer', { class: 'bb-cfoot' })
    const printed = new Set([...ol.querySelectorAll('.bb-verse')].map((li) => li.id))
    const conc = L.concordance(ch).map((c) => ({ ...c, hits: c.hits.filter((n) => printed.has(`v-${k}-${n}`)) }))
    if (conc.length) {
      foot.append(h('p', { class: 'bb-concord' },
        h('span', { class: 'bb-foot-label' }, 'Concordance'), ' ',
        conc.map(({ word, hits }) => h('span', { class: 'bb-concord-entry' },
          h('span', { class: 'bb-sc' }, word), ' ',
          hits.length
            ? hits.map((n, j) => [j ? ', ' : '', h('a', verseLink(k, ch, n), `${ch.chapter}:${n}`)])
            : ['not in this chapter; see ', h('a', { href: L.versePath([word]) + QS }, L.shelfKey(L.versePath([word])))]))))
    }
    const ways = { ...L.onward(ch.path), mirror: L.isOwnReflection(ch.path) ? null : L.mirrorPath(ch.path) }
    const WAY = [['deeper', '↘', 'deeper'], ['beside', '→', 'beside'], ['above', '↑', 'above'], ['elsewhere', '⤳', 'elsewhere'], ['mirror', '⇋', 'in the mirror'], ['onward', '↪', 'next chapter']]
    const xref = h('ul', { class: 'bb-xref-list' })
    for (const [key, arrow, label] of WAY) {
      const p = ways[key]
      if (!p) continue
      const taken = next.path === p
      xref.append(h('li', { class: taken ? 'is-taken' : '' },
        h('span', { class: 'bb-xway', 'aria-hidden': 'true' }, arrow),
        h('span', { class: 'bb-xlabel' }, label),
        h('a', { href: p + QS }, L.shelfKey(p)),
        h('span', { class: 'bb-xref' }, L.capFirst(L.readChapter(p).ref)),
        taken && h('span', { class: 'bb-xtaken' }, '↓ the stair goes this way')))
    }
    if (!xref.querySelector('.is-taken')) {
      xref.append(h('li', { class: 'is-taken' },
        h('span', { class: 'bb-xway', 'aria-hidden': 'true' }, '⤳'),
        h('span', { class: 'bb-xlabel' }, 'the bend'),
        h('a', { href: next.path + QS }, L.shelfKey(next.path)),
        h('span', { class: 'bb-xref' }, L.capFirst(nextCh.ref)),
        h('span', { class: 'bb-xtaken' }, '↓ the stair goes this way')))
    }
    foot.append(h('nav', { class: 'bb-xrefs', 'aria-label': `Cross-references from ${ch.ref}` }, h('p', { class: 'bb-foot-label' }, 'See also'), xref))
    if (k === 0) foot.append(h('div', { class: 'bb-colophon' }, COLOPHON.map((c) => h('p', {}, c))))
    const catchword = (nextCh.verses[0]?.text ?? '').split(' ')[0]
    foot.append(h('p', { class: 'bb-catch', 'aria-hidden': 'true' },
      h('span', { class: 'bb-sig' }, L.signature(k)),
      h('span', { class: 'bb-catchword' }, catchword)))
    el.append(foot)

    return el
  }

  function verseEl(k, ch, v, i, mark, notes, echo) {
    const id = `v-${k}-${v.number}`
    const li = h('li', { class: 'bb-verse', id, value: String(v.number) })
    // The margin: the sigil of a word of the path, beside the verse that holds it, or, when no verse
    // holds it, beside the verse where the chapter says it would have stood.
    if (mark) {
      const note = mark.present
        ? `The sigil of “${mark.word}”, set beside the verse that holds the word`
        : `The sigil of “${mark.word}”. No verse of this chapter holds the word; the margin keeps its place.`
      const own = L.versePath([mark.word])
      li.append(h('a', { class: mark.present ? 'bb-vmark' : 'bb-vmark is-absent', href: own + QS, title: `${note}. It opens the chapter shelved under the word alone.` },
        h('span', { class: 'bb-vmark-sigil', 'aria-hidden': 'true', html: drawnSigil(mark.word, 4.6) }),
        h('span', { class: 'visually-hidden' }, mark.present ? 'Sigil of ' : 'Sigil of the absent word '),
        h('span', { class: 'bb-vmark-word' }, mark.word),
        h('span', { class: 'visually-hidden' }, ', which opens the chapter of the word alone. ')))
    }
    const isFirst = i === 0
    li.append(h('a', { class: isFirst ? 'bb-vnum bb-vnum--chapter' : 'bb-vnum', ...verseLink(k, ch, v.number), 'aria-label': L.capFirst(v.ref), 'data-digits': isFirst ? String(Math.min(4, String(ch.chapter).length)) : null },
      isFirst ? String(ch.chapter) : String(v.number)))

    // The Word.
    const text = h('p', { class: 'bb-vtext', 'data-verse': L.capFirst(v.ref) })
    if (ch.kinds.lost) {
      const segs = lacunae(ch, v)
      if (!segs) {
        text.classList.add('is-gone')
        text.append(h('span', { class: 'bb-lacuna', title: 'lacuna' }, `[verse ${v.number} is lost]`))
      } else {
        segs.forEach((s, j) => {
          if (j) text.append(' ')
          if (s.lost) text.append(h('span', { class: 'bb-lacuna', title: 'lacuna: taken by the Lost' }, '[ … ]', h('span', { class: 'visually-hidden' }, ' (a word is lost) ')), s.trail)
          else text.append(s.text)
        })
      }
    } else {
      text.textContent = L.capFirst(v.text)
    }
    li.append(text)

    // The tongues: a sacred fragment with its gloss, or else the Pilgrim's glyphs of the same verse.
    // A verse that repeats an earlier one, word for word, is noted and not ashamed.
    if (echo) {
      li.classList.add('is-echo')
      const gloss = v.number - echo === 1
        ? [`verse ${v.number} repeats verse ${echo} word for word, as the Library, being periodic, sometimes does`]
        : ['as at ', h('a', verseLink(k, ch, echo), `verse ${echo}`), `, word for word. ${ECHO_NOTES[(v.number + echo) % ECHO_NOTES.length]}`]
      li.append(h('div', { class: 'bb-tongue bb-tongue--note' },
        h('span', { class: 'bb-tongue-name' }, 'Echo'),
        h('span', { class: 'bb-gloss' }, gloss)))
    } else if (v.fragment) {
      const fr = v.fragment
      li.append(h('div', { class: `bb-tongue bb-tongue--${fr.lang}` },
        h('span', { class: 'bb-tongue-name' }, TONGUES[fr.lang] ?? fr.lang),
        h('q', { class: 'bb-frag', lang: LANG_TAG[fr.lang] ?? fr.lang, dir: fr.lang === 'he' ? 'rtl' : null }, fr.text),
        h('span', { class: 'bb-gloss' }, fr.gloss)))
    } else if (!ch.kinds.nativity) {
      li.append(h('div', { class: 'bb-tongue bb-tongue--glyph', 'aria-hidden': 'true' },
        glyphText(firstWords(v.text, 7).toLowerCase(), { className: 'bb-echo' })))
    }
    for (const n of notes) li.append(pencilEl(n))
    return li
  }

  function vindicationEl(k, ch, prev) {
    const n = `${prev.number}a`
    const li = h('li', { class: 'bb-verse bb-verse--vindication', id: `v-${k}-${n}` })
    li.append(
      h('a', { class: 'bb-vnum', ...verseLink(k, ch, n), 'aria-label': `${L.capFirst(ch.ref)}:${n}, an interpolation` }, n),
      h('p', { class: 'bb-vtext', 'data-verse': `${L.capFirst(ch.ref)}:${n}` }, vindication(visit.fork('vindication'), ctx.sky, ctx.clock())),
      h('div', { class: 'bb-tongue bb-tongue--note' },
        h('span', { class: 'bb-tongue-name' }, 'Vindication'),
        h('span', { class: 'bb-gloss' }, 'an interpolation, found in this copy only, in this hour only')))
    return li
  }

  function pencilEl(n) {
    return h('aside', { class: 'bb-pencil', style: `--tilt:${n.tilt}deg`, 'aria-label': 'A note pencilled in the margin' },
      h('span', { class: 'bb-pencil-text' }, n.text),
      n.hand && h('span', { class: 'bb-pencil-hand' }, ` — ${n.hand}`))
  }

  // ------------------------------------------------------------------------------------- observers
  let curIO = null
  let io = null
  if ('IntersectionObserver' in window) {
    curIO = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const entry = S.leaves.find((x) => x.el === e.target)
        if (entry) setCurrent(entry)
      }
    }, { rootMargin: '-38% 0px -58% 0px' })
    io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting) || S.done || destroyed) return
      appendLeaf()
      // re-arm: a fresh observation reports again if the sentinel is still near
      io.unobserve(sentinel)
      if (!S.done) io.observe(sentinel)
    }, { rootMargin: '0px 0px 1400px 0px' })
    // The lamps over the plan burn only while the plan can be seen.
    const planEl = front.querySelector('.bb-plan')
    if (planEl) {
      const lampIO = new IntersectionObserver(([e]) => { if (e) wrap.dataset.lamplight = e.isIntersecting ? 'on' : 'off' })
      lampIO.observe(planEl)
      cleanups.push(() => lampIO.disconnect())
    }
  }

  appendLeaf()

  // Deep links to a verse (#verse-12 of this path; #v-3-12, three flights below it, as older links wrote
  // it): walk down until the verse exists, and mark it as the one the reader was sent to.
  let deepLi = null
  const deepHere = VERSE_HASH.exec(initialHash)
  const deepBelow = STAIR_HASH.exec(initialHash)
  if (deepHere) deepLi = document.getElementById(`v-0-${deepHere[1]}`)
  else if (deepBelow && Number(deepBelow[1]) <= 60) {
    while (S.leaves.length <= Number(deepBelow[1]) && !S.done) appendLeaf()
    deepLi = document.getElementById(`v-${deepBelow[1]}-${deepBelow[2]}`)
  }
  if (deepLi) markVerse(deepLi)

  setCurrent(S.leaves[0])
  if (io) io.observe(sentinel)
  else for (let i = 0; i < 6; i++) appendLeaf()
  if (deepLi) later(() => deepLi.scrollIntoView({ block: 'start' }), 60)
  else restorePlace()

  function setCurrent(entry) {
    if (!entry || S.current === entry || destroyed) return
    S.current = entry
    const { ch, k } = entry
    headBook.textContent = L.capFirst(ch.book)
    headCh.textContent = L.roman(ch.chapter) || String(ch.chapter)
    headWhere.textContent = `hexagon ${ch.address.hexagon.slice(0, 4)} · leaf ${L.signature(k)}${k ? ` · ${k} ${k === 1 ? 'flight' : 'flights'} down` : ''}`
    wander.href = L.onward(ch.path).elsewhere + QS
    if (!document.hidden) document.title = `${L.capFirst(ch.ref)} · The Infinite Scripture`
    syncAddress()
    ctx.memory.update(READ_KEY, (list) => {
      const rest = (Array.isArray(list) ? list : []).map(readEntry).filter((e) => e && e.p !== ch.key)
      return [...rest, { p: ch.key, r: ch.ref, t: ctx.clock().getTime() }].slice(-108)
    }, [])
  }

  // The address bar follows the reader down the stair (replaceState: no history is added, no trap). It
  // names the leaf being read, and the verse the reader was sent to while that verse's leaf is the one in
  // view. Any other fragment is left alone until the path itself moves on.
  function syncAddress() {
    const entry = S.current
    if (!entry || destroyed) return
    const path = entry.k === 0 ? originalPath : entry.ch.path
    const hash = S.target && S.target.k === entry.k ? S.target.hash : ''
    if (location.pathname === path && (location.hash === hash || (!hash && !isVerseHash(location.hash)))) return
    try { history.replaceState(history.state, '', path + location.search + hash) } catch {}
  }

  // The verse the reader was sent to (by a verse number, the concordance, an echo, or a link from outside).
  function markVerse(li, { scroll = false, from = null } = {}) {
    for (const x of wrap.querySelectorAll('.bb-verse.is-target')) if (x !== li) x.classList.remove('is-target')
    li.classList.add('is-target')
    const k = S.leaves.findIndex((x) => x.el.contains(li))
    S.target = k < 0 ? null : { k, hash: `#verse-${li.id.replace(/^v-\d+-/, '')}` }
    if (scroll) li.scrollIntoView({ block: 'start', behavior: ctx.mercy?.on ? 'auto' : 'smooth' })
    // A reader who came from the foot of the leaf by keyboard goes on reading from the verse.
    if (from && !li.contains(from)) {
      li.tabIndex = -1
      li.focus({ preventScroll: true })
    }
    syncAddress()
  }
  listen(wrap, 'click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[data-to]') : null
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const li = document.getElementById(a.dataset.to)
    if (!li || !wrap.contains(li)) return
    e.preventDefault()
    markVerse(li, { scroll: true, from: a })
  })
  // A verse named in the address bar by hand (#verse-7), or reached again through the history: it is a
  // verse of the chapter whose path the address bar shows.
  listen(window, 'hashchange', () => {
    const m = VERSE_HASH.exec(location.hash)
    if (!m) return
    const cur = S.current
    const here = cur && (cur.k === 0 ? originalPath : cur.ch.path) === location.pathname ? cur : S.leaves[0]
    const li = here && document.getElementById(`v-${here.k}-${m[1]}`)
    if (li) markVerse(li, { scroll: true })
  })

  // The place kept: the verse at the top of the page being read (and how far down the window it stood),
  // or else how deep into the leaf, written into this history entry. A reload opens the address bar's path,
  // whose first leaf is that same chapter, and the same verse is set in the same place.
  function keepPlace() {
    const entry = S.current
    if (!entry || destroyed) return
    const state = history.state && typeof history.state === 'object' ? history.state : {}
    const dy = Math.round(-entry.el.getBoundingClientRect().top)
    let n = null
    let off = 0
    for (const li of entry.el.querySelectorAll('.bb-verse:not(.bb-verse--vindication)')) {
      const r = li.getBoundingClientRect()
      if (r.bottom < 72) continue
      if (r.top < innerHeight) { n = li.id.replace(/^v-\d+-/, ''); off = Math.round(r.top) }
      break
    }
    try { history.replaceState({ ...state, babel: { at: location.pathname, dy, n, off } }, '') } catch {}
  }
  function restorePlace() {
    const kept = history.state?.babel
    if (!kept || kept.at !== location.pathname || !Number.isFinite(kept.dy)) return
    const place = () => {
      const li = kept.n != null && /^\w{1,8}$/.test(String(kept.n)) ? document.getElementById(`v-0-${kept.n}`) : null
      const y = li && Number.isFinite(kept.off)
        ? li.getBoundingClientRect().top + scrollY - kept.off
        : S.leaves[0].el.getBoundingClientRect().top + scrollY + kept.dy
      scrollTo(0, Math.max(0, y))
    }
    place()
    // The letters may arrive after the leaf is set; if the reader has not moved since, set the place again.
    const y = scrollY
    document.fonts?.ready?.then(() => { if (!destroyed && Math.abs(scrollY - y) < 2) place() })
  }

  // ------------------------------------------------------------------------------------- the voice
  // The verse nearest the reader's eye; with `strict`, null when no verse is on screen.
  function verseInView(strict = false) {
    const mid = innerHeight * 0.42
    let best = null
    let bestD = Infinity
    const leaf = S.current?.el
    if (!leaf) return null
    for (const li of leaf.querySelectorAll('.bb-verse')) {
      const r = li.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight) continue
      const d = Math.abs((r.top + r.bottom) / 2 - mid)
      if (d < bestD) { bestD = d; best = li }
    }
    return best ?? (strict ? null : leaf.querySelector('.bb-verse'))
  }
  const frontInView = () => { const r = frontSlot.getBoundingClientRect(); return r.top < innerHeight && r.bottom > -innerHeight * 0.5 }

  let intoneTimer = 0
  function intone() {
    const audio = ctx.audio
    try { audio?.summon?.() } catch (e) { console.warn('[babel] summon', e) }
    const li = verseInView()
    const text = li?.querySelector('.bb-vtext')?.textContent || mantra(visit.fork('mantra')).text
    try { audio?.chant?.(firstWords(text, 9)) } catch (e) { console.warn('[babel] chant', e) }
    for (const x of wrap.querySelectorAll('.is-intoned')) x.classList.remove('is-intoned')
    li?.classList.add('is-intoned')
    intoneBtn.classList.add('is-on')
    intoneBtn.querySelector('.bb-intone-label').textContent = 'intoning'
    clearTimeout(intoneTimer)
    timers.delete(intoneTimer)
    intoneTimer = later(() => {
      li?.classList.remove('is-intoned')
      intoneBtn.classList.remove('is-on')
      intoneBtn.querySelector('.bb-intone-label').textContent = 'intone'
    }, 7000)
  }
  listen(intoneBtn, 'click', intone)

  let rings = 0
  const firstReply = visit.int(0, BELL_REPLIES.length - 1)
  function ringBell() {
    const audio = ctx.audio
    try { audio?.summon?.() } catch (e) { console.warn('[babel] summon', e) }
    try { audio?.bell?.({ soft: true }) } catch (e) { console.warn('[babel] bell', e) }
    const b = wrap.querySelector('.bb-bell')
    b?.classList.remove('is-rung')
    void b?.offsetWidth
    b?.classList.add('is-rung')
    if (bellReply) {
      bellReply.textContent = BELL_REPLIES[(firstReply + rings++) % BELL_REPLIES.length]
      if (rings === BELL_REPLIES.length) ctx.memory.markSecret?.('babel-no-librarian', { face: 'babel' })
    }
  }

  // ------------------------------------------------------------------------------------- the ritual
  let online = null
  let prayers = null
  const wallMessages = []
  const wallText = (m) => (typeof m === 'string' ? m : m?.text ?? m?.message ?? '')
  function paintRitual() {
    const st = ctx.ritual?.state
    if (st) {
      if (online == null && Number.isFinite(st.online)) online = st.online
      if (prayers == null && Number.isFinite(st.prayers)) prayers = st.prayers
      if (!wallMessages.length && Array.isArray(st.wall)) wallMessages.push(...st.wall.slice(-5).map(wallText).filter(Boolean).reverse())
    }
    if (readersLine) {
      const bits = []
      if (Number.isFinite(online)) bits.push(`${online} ${online === 1 ? 'reader is' : 'readers are'} in the Library now`)
      if (Number.isFinite(prayers)) bits.push(`${prayers} ${prayers === 1 ? 'prayer has' : 'prayers have'} been said in it`)
      readersLine.textContent = bits.length ? bits.join('; ') + '.' : 'The other readers cannot be heard from this hexagon.'
    }
    if (wallList) {
      wallList.replaceChildren(...(wallMessages.length
        ? wallMessages.slice(0, 5).map((m) => h('li', {}, glyphText(m)))
        : [h('li', { class: 'bb-wall-empty' }, 'Nothing yet. The walls are patient.')]))
    }
  }
  const addWall = (m) => {
    const t = wallText(m)
    if (!t || wallMessages[0] === t) return // our own inscription echoes back from the server
    wallMessages.unshift(t)
    wallMessages.length = Math.min(wallMessages.length, 12)
    paintRitual()
  }
  // The ritual layer re-reads the shared state now and then; the walls follow it.
  const fromState = (st) => {
    if (!st) return
    if (Number.isFinite(st.online)) online = st.online
    if (Number.isFinite(st.prayers)) prayers = st.prayers
    if (Array.isArray(st.wall)) wallMessages.splice(0, wallMessages.length, ...st.wall.slice(-12).map(wallText).filter(Boolean).reverse())
    paintRitual()
  }
  paintRitual()
  sub('temple:awake', paintRitual)
  sub('ritual:state', (d) => fromState(d?.state ?? ctx.ritual?.state))
  sub('server:presence', (d) => { if (Number.isFinite(d?.online)) { online = d.online; paintRitual() } })
  sub('server:prayer', (d) => { if (Number.isFinite(d?.count)) { prayers = d.count; paintRitual() } })
  sub('ritual:prayed', (d) => { if (Number.isFinite(d?.count)) { prayers = d.count; paintRitual() } })
  sub('server:wall', (d) => addWall(d?.message ?? d))
  sub('ritual:inscribed', (d) => addWall(d?.message ?? d))

  // --------------------------------------------------------------------------- the Library listens
  // Type a word anywhere outside a field and the Library finds it on the leaf you are reading: every
  // occurrence is marked (by the Custom Highlight API, so no element is wrapped), and a slip under the
  // running head offers the chapter shelved under that word.
  const canHighlight = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight === 'function'
  const heardWord = h('span', { class: 'bb-heard-word' })
  const heardText = h('span', { class: 'bb-heard-text' })
  const heardLink = h('a', { class: 'bb-heard-link' })
  // A live region has to be in the page before it speaks, so the slip is always there: empty and clear
  // when the Library has heard nothing, filled and lit when it has.
  const heard = h('p', { class: 'bb-heard', role: 'status' })
  head.append(heard)
  let heardTimer = 0
  let hearTimer = 0
  const fieldFocused = () => {
    const a = document.activeElement
    return Boolean(a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)))
  }
  function unhear() {
    delete heard.dataset.on
    if (canHighlight) CSS.highlights.delete(HEARD)
    clearTimeout(heardTimer)
    timers.delete(heardTimer)
    // Emptied once it has faded, so its link cannot be reached while it cannot be seen.
    heardTimer = later(() => heard.replaceChildren(), 700)
  }
  function hear(word) {
    const leaf = S.current?.el
    if (!leaf || destroyed) return
    const re = L.wordRe(word, 'giu')
    const ranges = []
    for (const p of leaf.querySelectorAll('.bb-vtext')) {
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT)
      for (let n = walker.nextNode(); n && ranges.length < 60; n = walker.nextNode()) {
        re.lastIndex = 0
        for (let m = re.exec(n.data); m && ranges.length < 60; m = re.exec(n.data)) {
          const start = m.index + m[1].length
          const r = document.createRange()
          r.setStart(n, start)
          r.setEnd(n, start + m[2].length)
          ranges.push(r)
        }
      }
    }
    if (canHighlight) {
      if (ranges.length) CSS.highlights.set(HEARD, new Highlight(...ranges))
      else CSS.highlights.delete(HEARD)
    }
    const path = L.versePath([word])
    heardWord.textContent = `“${word}”`
    heardText.textContent = ranges.length
      ? `${ranges.length === 1 ? 'once' : ranges.length === 2 ? 'twice' : `${ranges.length} times`} on this leaf. Its own chapter stands at`
      : 'nowhere on this leaf. It has a chapter of its own, at'
    heardLink.href = path + QS
    heardLink.textContent = L.shelfKey(path)
    heard.replaceChildren(h('span', { class: 'bb-heard-kicker' }, 'heard'), ' ', heardWord, ' ', heardText, ' ', heardLink)
    heard.dataset.on = ''
    ctx.memory.markSecret?.('babel-heard', { face: 'babel', word })
    clearTimeout(heardTimer)
    timers.delete(heardTimer)
    heardTimer = later(unhear, 9000)
  }
  sub('behavior:typed', ({ buffer } = {}) => {
    if (fieldFocused()) return
    clearTimeout(hearTimer)
    timers.delete(hearTimer)
    // Hear the word once the reader pauses: the last run of letters, three or more of them.
    hearTimer = later(() => {
      const m = /(\p{L}{3,24})\P{L}*$/u.exec(String(buffer ?? ''))
      if (m) hear(m[1].toLowerCase())
    }, 650)
  })

  // ------------------------------------------------------------------------------- citation on copy
  // No verse leaves the Library without its shelfmark. What was selected is kept exactly as it was (the
  // verse that holds its breath still holds it); the reference is written underneath.
  listen(document, 'copy', (e) => {
    const sel = getSelection()
    if (!sel || sel.isCollapsed || !e.clipboardData) return
    const at = (node) => (node?.nodeType === 1 ? node : node?.parentElement)?.closest?.('.bb-verse')
    const first = at(sel.anchorNode)
    const last = at(sel.focusNode)
    if (!first || !wrap.contains(first)) return
    const text = sel.toString()
    if (!text.trim()) return
    const [a, b] = first.compareDocumentPosition(last ?? first) & Node.DOCUMENT_POSITION_PRECEDING ? [last, first] : [first, last ?? first]
    const refA = a.querySelector('.bb-vtext')?.dataset.verse ?? ''
    const refB = b.querySelector('.bb-vtext')?.dataset.verse ?? ''
    const leafA = a.closest('.bb-chapter')
    const same = leafA === b.closest('.bb-chapter')
    const ref = refA === refB ? refA : same ? `${refA}–${refB.split(':').pop()}` : `${refA} – ${refB}`
    const addr = S.leaves.find((x) => x.el === leafA)?.ch.address
    const shelf = addr ? `, hexagon ${addr.hexagon}…, wall ${L.roman(addr.wall)}, shelf ${addr.shelf}, volume ${addr.volume}` : ''
    const anchor = /^v-\d+-\w+$/.test(a.id) ? `#verse-${a.id.replace(/^v-\d+-/, '')}` : ''
    e.clipboardData.setData('text/plain', `${text.replace(/\s+$/, '')}\n\n— ${ref} (${location.origin}${leafA?.dataset.path ?? ''}${anchor}${shelf})`)
    e.preventDefault()
  })

  // ------------------------------------------------------------------------- the ribbon (away, back)
  // Leave the tab for a while and the Library keeps your place: a silk ribbon laid at the verse you were
  // reading when you came back, and a pencilled word of how long it waited.
  let ribbon = null
  sub('behavior:return', ({ awayMs } = {}) => {
    if (!(awayMs > 20000) || destroyed) return
    const li = verseInView(true)
    if (!li) return
    ribbon?.remove()
    const mins = Math.round(awayMs / 60000)
    const waited = mins < 1 ? 'less than a minute' : mins === 1 ? 'one minute' : mins < 60 ? `${mins} minutes` : 'longer than an hour'
    ribbon = h('aside', { class: 'bb-ribbon', role: 'note' },
      h('span', { class: 'bb-ribbon-silk', 'aria-hidden': 'true' }),
      h('span', { class: 'bb-ribbon-note' }, `your place. the Library kept it for ${waited}, and did not read ahead.`))
    li.append(ribbon)
    ctx.memory.markSecret?.('babel-ribbon', { face: 'babel' })
  })

  // -------------------------------------------------------------------------------------- the wall
  // The spines painted behind the leaves are not decoration. Point at one and the lamp finds it; click it
  // and it is taken down, because every volume on the wall has a path of its own. (For the keyboard, the
  // same act is the running head's "wander": a volume taken down from somewhere else on the wall.)
  const SPINE = 14 // px: one spine of the gallery background (see .bb in babel.css)
  const SHELF = 150 // px: one shelf, board to board
  const BOOK = [22, 142] // px within a shelf: where the books stand
  const WALL_SKIP = '.bb-leaf, .bb-noise-head, .bb-noise-spread, .bb-rh, a, button, input, label'
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)')
  const litWhere = h('span', { class: 'bb-wall-slip-where' })
  const litPath = h('span', { class: 'bb-wall-slip-path' })
  const spineLit = h('div', { class: 'bb-wall-lit', 'aria-hidden': 'true', hidden: true })
  const spineSlip = h('div', { class: 'bb-wall-slip', 'aria-hidden': 'true', hidden: true },
    litWhere, litPath, h('span', { class: 'bb-wall-slip-do' }, 'click to take it down'))
  wrap.append(spineLit, spineSlip)
  let wallAt = null
  let wallFrame = 0
  let wallEvent = null

  function spineAt(e) {
    if (!finePointer.matches || !(e.target instanceof Element) || e.target.closest(WALL_SKIP)) return null
    const r = wrap.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const inShelf = y - Math.floor(y / SHELF) * SHELF
    if (x < 0 || y < 0 || inShelf < BOOK[0] || inShelf >= BOOK[1]) return null
    const col = Math.floor(x / SPINE)
    const row = Math.floor(y / SHELF)
    return { col, row, x: col * SPINE, y: row * SHELF + BOOK[0], left: x < r.width / 2 }
  }
  function darkenWall() {
    wallAt = null
    spineLit.hidden = true
    spineSlip.hidden = true
    delete wrap.dataset.wall
  }
  function lightSpine(at) {
    if (!at) return darkenWall()
    if (wallAt && wallAt.col === at.col && wallAt.row === at.row) return
    wallAt = { ...at, path: L.volumeAt(startPath, at.col, at.row) }
    litWhere.textContent = `wall ${at.left ? 'IV' : 'II'} · shelf ${(at.row % 5) + 1} · volume ${(at.col % 32) + 1}`
    litPath.textContent = L.shelfKey(wallAt.path)
    spineLit.style.transform = `translate(${at.x}px, ${at.y}px)`
    spineSlip.style.transform = at.left
      ? `translate(${at.x + SPINE + 8}px, ${at.y + 18}px)`
      : `translate(calc(${at.x - 8}px - 100%), ${at.y + 18}px)`
    spineLit.hidden = false
    spineSlip.hidden = false
    wrap.dataset.wall = ''
  }
  listen(wrap, 'pointermove', (e) => {
    wallEvent = e
    if (wallFrame) return
    wallFrame = requestAnimationFrame(() => {
      wallFrame = 0
      if (!destroyed && wallEvent) lightSpine(spineAt(wallEvent))
    })
  }, { passive: true })
  listen(wrap, 'pointerleave', darkenWall)
  let placeTimer = 0
  listen(window, 'scroll', () => {
    if (wallAt) darkenWall()
    clearTimeout(placeTimer)
    timers.delete(placeTimer)
    placeTimer = later(keepPlace, 450)
  }, { passive: true })
  // A volume is taken down only by a press and release on the same spine, and never at the end of a
  // drag that was selecting a verse (that would pull the reader off the page mid-copy).
  let pressed = null
  listen(wrap, 'pointerdown', (e) => { pressed = spineAt(e) }, { passive: true })
  listen(wrap, 'click', (e) => {
    const at = spineAt(e)
    const was = pressed
    pressed = null
    if (!at || !was || was.col !== at.col || was.row !== at.row) return
    const sel = getSelection()
    if (sel && !sel.isCollapsed) return
    ctx.memory.markSecret?.('babel-the-wall', { face: 'babel' })
    location.assign(L.volumeAt(startPath, at.col, at.row) + QS)
  })
  cleanups.push(() => cancelAnimationFrame(wallFrame))

  // ------------------------------------------------------------------------------------ stillness
  // 7 s: the lamps lower and the reverse of the leaf shows through. 33 s: the pencil writes to you.
  // 108 s: the Crimson Hexagon.
  const typing = new Set()
  function typeInto(el, text, done) {
    if (ctx.mercy?.on) { el.textContent = text; done?.(); return }
    const job = { el, text, done, i: 0 }
    typing.add(job)
    const step = () => {
      if (destroyed) return
      if (ctx.mercy?.on || job.i >= text.length) { el.textContent = text; typing.delete(job); done?.(); return }
      job.i++
      el.textContent = text.slice(0, job.i)
      later(step, 38 + (text.charCodeAt(job.i - 1) === 32 ? 70 : 0) + ((job.i * 7) % 5) * 9)
    }
    step()
  }
  function finishTyping() {
    for (const job of typing) { job.i = job.text.length }
  }

  function pencilToReader() {
    if (S.stillNotes >= 5) return
    const li = verseInView(true)
    const host = li ?? (frontInView() ? frontSlot : verseInView())
    if (!host) return
    S.stillNotes++
    const r = visit.fork(`still/${S.stillNotes}`)
    const source = li?.querySelector('.bb-vtext')?.textContent ?? (host === frontSlot ? S.leaves[0].ch.verses.map((v) => v.text).join(' ') : host.textContent)
    const words = (source ?? '').toLowerCase().match(/\p{L}{3,}/gu) ?? ['margin']
    const pick = r.shuffle(words.filter((w) => !L.STOP.has(w))).slice(0, r.int(1, 3))
    const path = L.versePath(pick.length ? pick : ['margin'])
    const note = stillNote(r)
    const typed = h('span', { class: 'bb-pencil-text', 'aria-hidden': 'true' })
    const link = h('a', { class: 'bb-pencil-link', href: path + QS }, L.shelfKey(path))
    const aside = h('aside', { class: 'bb-pencil is-live', style: `--tilt:${r.float(-2.2, 1.2).toFixed(2)}deg`, role: 'note' },
      h('span', { class: 'visually-hidden' }, note + ' '), typed, ' ', link)
    host.append(aside)
    typeInto(typed, note, () => aside.classList.add('is-written'))
  }

  function crimsonHexagon() {
    if (S.crimson) return
    S.crimson = true
    wrap.dataset.crimson = ''
    ctx.memory.markSecret?.('crimson-hexagon', { face: 'babel' })
    const li = verseInView(true)
    const box = h('aside', { class: 'bb-crimson', 'aria-label': 'The Crimson Hexagon' },
      h('div', { class: 'bb-crimson-plan', html: hexagonPlan(S.current.ch.address, { mini: true }) }),
      h('div', {},
        h('p', { class: 'bb-crimson-title' }, 'The Crimson Hexagon'),
        h('p', {}, 'You held still for one hundred and eight seconds, the length of a mala, and a hexagon that is not on any plan has lit its lamps. Its shelves hold a single book: the catalogue of every chapter you have read.'),
        h('p', {}, h('a', { href: '/verse/the/catalogue/of/catalogues' + QS }, 'open the catalogue of catalogues'))))
    if (li) li.append(box)
    else if (frontInView()) frontSlot.append(box)
    else S.current.el.querySelector('.bb-cfoot')?.before(box)
  }

  sub('behavior:still', ({ seconds } = {}) => {
    if (seconds >= 7) wrap.dataset.still = String(seconds)
    if (seconds === 33) {
      ctx.memory.markSecret?.('stillness', { face: 'babel' })
      pencilToReader()
    }
    if (seconds === 108) crimsonHexagon()
  })
  sub('behavior:stir', () => { delete wrap.dataset.still })

  let restlessTimer = 0
  sub('behavior:restless', () => {
    headStatus.textContent = ' · slowly. the Library is not going anywhere.'
    clearTimeout(restlessTimer)
    restlessTimer = later(() => { headStatus.textContent = '' }, 9000)
  })
  sub('behavior:calm', () => { headStatus.textContent = '' })
  sub('mercy:change', ({ on } = {}) => { if (on) finishTyping() })

  // -------------------------------------------------------------------------------------- destroy
  return () => {
    destroyed = true
    io?.disconnect()
    curIO?.disconnect()
    for (const t of timers) clearTimeout(t)
    timers.clear()
    typing.clear()
    for (const off of cleanups) { try { off() } catch {} }
    if (canHighlight) CSS.highlights.delete(HEARD)
    wrap.remove()
    document.title = originalTitle
    // Give the address bar back the path the reader came in by, without the Library's bookmark.
    try {
      const { babel: _kept, ...state } = history.state && typeof history.state === 'object' ? history.state : {}
      const hash = isVerseHash(location.hash) ? '' : location.hash
      history.replaceState(Object.keys(state).length ? state : null, '', originalPath + location.search + hash)
    } catch {}
  }
}
