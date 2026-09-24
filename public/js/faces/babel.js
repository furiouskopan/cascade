// BABEL: THE INFINITE SCRIPTURE (docs/CANON.md §3, babel).
// Every path under /verse/ is a chapter that has always existed, printed as a leaf of a polyglot
// Bible and shelved in a hexagon of Borges' Library. Scrolling walks the stair: each chapter leads,
// by a walk the path itself decides, to the next one, and the address bar follows the reader down.
//
// Deterministic: the chapter, its shelf, its marginalia, its Rosetta pair and the whole stair below it
// come from the path alone. Not deterministic: the Vindication (one interpolated verse written for the
// hour of reading), the prophecy in the margin, and whatever the pencil writes while you hold still.
import { h } from '../lib/dom.js'
import { inscription, rosetta, glyphText } from '../lib/glyphs.js'
import * as Glyphs from '../lib/glyphs.js' // for the optional additions (ALPHABET), read defensively
import { sigil } from '../lib/sigil.js'
import { prophecy, mantra } from '../lib/scripture.js'
import { BOOKS } from '../lib/lexicon.js'
import * as L from './babel/library.js'
import { hexagonPlan, moonGlyph } from './babel/plan.js'
import { pencilNotes, lacunae, vindication, stillNote, shelfNotes, planetName, COLOPHON } from './babel/marginalia.js'

const READ_KEY = 'babel.read'
const MAX_LEAVES = 333 // the stair is endless; a tab is not
const TONGUES = { la: 'Latin', sa: 'Sanskrit', he: 'Hebrew', el: 'Greek', cu: 'Church Slavonic', enochian: 'Enochian', bo: 'Tibetan', ja: 'Japanese' }
const LANG_TAG = { enochian: 'x-enochian' }

// Sigil markup with pathLength, so CSS can draw each one in a single stroke.
const drawnSigil = (word, stroke = 3) =>
  sigil(L.latinize(word), { size: 100, stroke }).replace(/<(path|circle) /g, '<$1 pathLength="1" ')

const BELL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 2.8v1.7M6.6 16.8c0-5.6 1.2-10 5.4-10s5.4 4.4 5.4 10M4.8 16.8h14.4M10.4 19.2a1.6 1.6 0 0 0 3.2 0"/></svg>'

const firstWords = (text, n) => text.split(/\s+/).slice(0, n).join(' ')

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
  const startPath = L.safePathname(originalPath)
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
  }
  let wallList = null
  let readersLine = null
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
  wrap.append(head, frontispiece(first), stair, sentinel)
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
    const plan = h('figure', { class: 'bb-plan' },
      h('div', { class: 'bb-plan-svg', html: hexagonPlan(addr, { uid: 'bb-front', label: planLabel }) }),
      h('figcaption', {},
        h('dl', { class: 'bb-addr' },
          h('div', {}, h('dt', {}, 'Hexagon'), h('dd', { title: 'The full name of a hexagon runs to 3,200 characters. These are the first sixteen.' }, addr.hexagon, '…')),
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

    wallList = h('ul', { class: 'bb-wall', 'aria-label': 'Messages scratched into the walls, in the glyph script' })
    readersLine = h('p', { class: 'bb-readers' })
    const bell = h('button', { class: 'bb-bell', type: 'button', title: 'Summon sound' },
      h('span', { class: 'bb-bell-mark', 'aria-hidden': 'true', html: BELL }), ' ring for a librarian')
    listen(bell, 'click', ringBell)

    const notes = h('div', { class: 'bb-front-notes' },
      h('section', { class: 'bb-spine-note', 'aria-label': 'The inscription' },
        h('p', { class: 'bb-small' }, 'Stamped on the spine of every volume in this hexagon, and of every volume in every other:'),
        inscription({ className: 'bb-inscription' })),
      h('section', { class: 'bb-flyleaf', 'aria-label': 'Pencilled on the flyleaf' },
        h('p', { class: 'bb-pencil-inline' }, 'two letters of the key. the rest are elsewhere in the temple —'),
        key),
      h('section', { class: 'bb-skynote', 'aria-label': 'The sky of this reading' },
        h('p', { class: 'bb-pencil-inline' }, skyNote),
        sky && h('p', { class: 'bb-pencil-inline bb-prophecy' }, prophecy(visit.fork('prophecy'), sky))),
      h('section', { class: 'bb-graffiti', 'aria-label': 'The walls of this hexagon' },
        readersLine,
        h('p', { class: 'bb-small' }, 'Scratched into the walls of this hexagon by other readers:'),
        wallList,
        bell),
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
      frontSlot,
      h('div', { class: 'bb-front-grid' }, plan, notes),
      ...extra,
      find,
    )
    return leaf
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
      h('a', { href: m + location.search }, L.shelfKey(m)), '.')
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
    const update = () => {
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
      if (!words.length) { input.focus(); return }
      location.assign(L.versePath(words) + location.search)
    })
    return form
  }

  // /verse: the catalogue of the twenty books, as spines on a shelf.
  function bookShelf() {
    return h('nav', { class: 'bb-books', 'aria-label': 'The catalogue of books' },
      h('p', { class: 'bb-small' }, 'The catalogue. Twenty books, each shelved at chapter one; each goes on for as long as it is read.'),
      h('ul', { class: 'bb-books-row' }, BOOKS.map((b, i) => h('li', {},
        h('a', { class: 'bb-spine', href: L.bookPath(b, 1) + location.search, style: `--h:${(11.5 + ((i * 7) % 5) * 0.75 + Math.min(2.5, b.length / 14)).toFixed(2)}rem` },
          h('span', { class: 'bb-spine-no', 'aria-hidden': 'true' }, L.roman(i + 1)),
          h('span', { class: 'bb-spine-title' }, L.capFirst(b)))))))
  }

  // /verse/the/catalogue/of/catalogues: every chapter this reader has opened. It lists itself.
  function catalogueOfCatalogues() {
    const read = ctx.memory.get(READ_KEY, [])
    ctx.memory.markSecret?.('catalogue-of-catalogues', { face: 'babel' })
    const box = h('section', { class: 'bb-catalogues', 'aria-labelledby': 'bb-cc-title' },
      h('h2', { id: 'bb-cc-title', class: 'bb-cc-title' }, 'The Catalogue of Catalogues'))
    if (!read.length) {
      box.append(h('p', {}, 'It lists only the chapters you have read, and you have read none; which cannot be true, since you are reading this one.'))
      return box
    }
    const rows = read.slice().reverse().map((e, i) => {
      const words = L.pathWords(String(e.p ?? ''))
      const path = L.versePath(words)
      const a = L.address(path)
      const when = new Date(Number(e.t) || 0)
      const stamp = isNaN(when) ? '' : `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`
      return h('tr', {},
        h('td', { class: 'bb-cc-no' }, String(read.length - i)),
        h('td', {}, L.capFirst(String(e.r ?? L.readChapter(path).ref))),
        h('td', {}, h('a', { href: path + location.search }, L.shelfKey(path))),
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
    const crumbs = [h('a', { href: '/verse' + location.search }, 'verse')]
    ch.words.slice(0, 12).forEach((w, i) => {
      crumbs.push(h('span', { class: 'bb-crumb-sep', 'aria-hidden': 'true' }, '/'))
      crumbs.push(i === ch.words.length - 1
        ? h('span', { 'aria-current': 'page' }, w)
        : h('a', { href: L.versePath(ch.words.slice(0, i + 1)) + location.search }, w))
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
    const marked = new Set()
    const markWords = ch.words.map((w) => w.toLowerCase()).filter((w) => !L.STOP.has(w) && /\p{L}/u.test(w) && w.length > 1)
    const vIndex = k === 0 && !mala ? visit.int(1, Math.max(1, ch.verses.length - 1)) : -1
    const quota = mala ? 108 - S.versesShown : Infinity

    const firstSaid = new Map() // verse text -> the number of the verse that said it first
    ch.verses.forEach((v, i) => {
      if (i >= quota) return
      const echo = firstSaid.get(v.text) ?? 0
      if (!echo) firstSaid.set(v.text, v.number)
      ol.append(verseEl(k, ch, v, i, marked, markWords, notes.filter((n) => n.after === i), echo))
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
        h('span', { class: 'bb-foot-label' }, 'Concordance'),
        conc.map(({ word, hits }) => h('span', { class: 'bb-concord-entry' },
          h('span', { class: 'bb-sc' }, word), ' ',
          hits.length
            ? hits.map((n, j) => [j ? ', ' : '', h('a', { href: `#v-${k}-${n}` }, `${ch.chapter}:${n}`)])
            : ['not in this chapter; see ', h('a', { href: L.versePath([word]) + location.search }, L.shelfKey(L.versePath([word])))]))))
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
        h('a', { href: p + location.search }, L.shelfKey(p)),
        h('span', { class: 'bb-xref' }, L.capFirst(L.readChapter(p).ref)),
        taken && h('span', { class: 'bb-xtaken' }, '↓ the stair goes this way')))
    }
    if (!xref.querySelector('.is-taken')) {
      xref.append(h('li', { class: 'is-taken' },
        h('span', { class: 'bb-xway', 'aria-hidden': 'true' }, '⤳'),
        h('span', { class: 'bb-xlabel' }, 'the bend'),
        h('a', { href: next.path + location.search }, L.shelfKey(next.path)),
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

  function verseEl(k, ch, v, i, marked, markWords, notes, echo) {
    const id = `v-${k}-${v.number}`
    const li = h('li', { class: 'bb-verse', id, value: String(v.number) })
    // The margin: the sigil of a path word, where that word first appears in this chapter.
    const low = v.text.toLowerCase()
    const hit = markWords.find((w) => !marked.has(w) && new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u').test(low))
    if (hit && marked.size < 3) {
      marked.add(hit)
      li.append(h('span', { class: 'bb-vmark', title: `The sigil of “${hit}”` },
        h('span', { class: 'bb-vmark-sigil', 'aria-hidden': 'true', html: drawnSigil(hit, 3.4) }),
        h('span', { class: 'bb-vmark-word' }, hit)))
    }
    const isFirst = i === 0
    li.append(h('a', { class: isFirst ? 'bb-vnum bb-vnum--chapter' : 'bb-vnum', href: `#${id}`, 'aria-label': L.capFirst(v.ref) },
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
        : ['as at ', h('a', { href: `#v-${k}-${echo}` }, `verse ${echo}`), `, word for word. ${ECHO_NOTES[(v.number + echo) % ECHO_NOTES.length]}`]
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
      h('a', { class: 'bb-vnum', href: `#v-${k}-${n}`, 'aria-label': `${L.capFirst(ch.ref)}:${n}, an interpolation` }, n),
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
  }

  appendLeaf()
  setCurrent(S.leaves[0])
  if (io) io.observe(sentinel)
  else for (let i = 0; i < 6; i++) appendLeaf()

  // Deep links to a verse further down the stair (#v-3-12): walk down until it exists.
  const deep = /^#v-(\d+)-(\w+)$/.exec(location.hash)
  if (deep) {
    const want = Math.min(Number(deep[1]), 60)
    while (S.leaves.length <= want && !S.done) appendLeaf()
    later(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' }), 60)
  }

  function setCurrent(entry) {
    if (!entry || S.current === entry || destroyed) return
    S.current = entry
    const { ch, k } = entry
    headBook.textContent = L.capFirst(ch.book)
    headCh.textContent = L.roman(ch.chapter) || String(ch.chapter)
    headWhere.textContent = `hexagon ${ch.address.hexagon.slice(0, 4)} · leaf ${L.signature(k)}${k ? ` · ${k} ${k === 1 ? 'flight' : 'flights'} down` : ''}`
    wander.href = L.onward(ch.path).elsewhere + location.search
    if (!document.hidden) document.title = `${L.capFirst(ch.ref)} · The Infinite Scripture`
    // The address bar follows the reader down the stair (replaceState: no history is added, no trap).
    try {
      const path = k === 0 ? originalPath : ch.path
      if (location.pathname !== path) history.replaceState(history.state, '', path + location.search)
    } catch {}
    ctx.memory.update(READ_KEY, (list) => {
      const rest = (Array.isArray(list) ? list : []).filter((e) => e && e.p !== ch.key)
      return [...rest, { p: ch.key, r: ch.ref, t: Date.now() }].slice(-108)
    }, [])
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

  function ringBell() {
    const audio = ctx.audio
    try { audio?.summon?.() } catch (e) { console.warn('[babel] summon', e) }
    try { audio?.bell?.({ soft: true }) } catch (e) { console.warn('[babel] bell', e) }
    const b = wrap.querySelector('.bb-bell')
    b?.classList.remove('is-rung')
    void b?.offsetWidth
    b?.classList.add('is-rung')
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
  const addWall = (m) => { const t = wallText(m); if (t) { wallMessages.unshift(t); wallMessages.length = Math.min(wallMessages.length, 12); paintRitual() } }
  paintRitual()
  sub('temple:awake', paintRitual)
  sub('server:presence', (d) => { if (Number.isFinite(d?.online)) { online = d.online; paintRitual() } })
  sub('server:prayer', (d) => { if (Number.isFinite(d?.count)) { prayers = d.count; paintRitual() } })
  sub('ritual:prayed', (d) => { if (Number.isFinite(d?.count)) { prayers = d.count; paintRitual() } })
  sub('server:wall', (d) => addWall(d?.message ?? d))
  sub('ritual:inscribed', (d) => addWall(d?.message ?? d))

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
    const link = h('a', { class: 'bb-pencil-link', href: path + location.search }, L.shelfKey(path))
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
        h('p', {}, h('a', { href: '/verse/the/catalogue/of/catalogues' + location.search }, 'open the catalogue of catalogues'))))
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
    wrap.remove()
    document.title = originalTitle
    // Give the address bar back the path the reader came in by.
    try { if (location.pathname !== originalPath) history.replaceState(history.state, '', originalPath + location.search) } catch {}
  }
}
