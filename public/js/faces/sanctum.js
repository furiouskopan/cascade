// THE SANCTUM: the Illuminated Codex. An open book on a lectern in a dark chapel.
// Verso: the chapter, in two ruled columns under a gold initial, with a white-vine bar border,
// Latin and Greek lemmas glossed by a later hand, drolleries in the bas-de-page that are CSS
// declarations, and an older text scraped away beneath (look at it under the Wood's lamp).
// Recto: the figure of the Great Work, the prophecy of the hour, the Emerald Stylesheet, the
// Inscription on a purple band, the Book of Life, the Rosetta slip in the margin, and a wax seal.
// Stillness gilds it: gold spreads into the letters from the place where the reader's hand rests.
// On wide windows two candles stand in the dark beside the book; they burn down only while it is read.
// See docs/CANON.md §3 (sanctum).
import { h } from '../lib/dom.js'
import { inscription, rosetta, glyphText } from '../lib/glyphs.js'
import { chapter, verse, prophecy } from '../lib/scripture.js'
import { seal } from '../lib/sigil.js'
import { FRAGMENTS } from '../lib/lexicon.js'
import { initialSvg, borderStrip, spraySvg, penworkUrl, GOLD_STOPS } from './sanctum/art.js'
import { BEASTS, beastSvg } from './sanctum/beasts.js'
import { opusSvg } from './sanctum/opus.js'
import { kalendarEl } from './sanctum/kalendar.js'
import { gatherTree, arborSvg } from './sanctum/arbor.js'
import { candlesEl, waxLeft, CANDLE_LIFE } from './sanctum/chapel.js'
import * as L from './sanctum/latin.js'

const FRAGMENT_LANGS = { la: 'la', el: 'el', cu: 'cu', he: 'he', enochian: 'x-enochian' }
const GILD_MAX = 2600 // px: enough to reach every letter of the spread
const GILD_SOFT = 80 // px: the gradient's soft edge; below this no gold is drawn

export function render(ctx) {
  const rng = ctx.rng.fork('sanctum')
  const sky = ctx.sky
  const uid = `sn${rng.int(0, 1e6).toString(36)}`

  // ---- housekeeping: everything registered here is undone by destroy() ----
  const offs = []
  const timers = new Set()
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); if (alive) fn() }, ms)
    timers.add(t)
    return t
  }
  const listen = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts)
    offs.push(() => target.removeEventListener(type, fn, opts))
  }
  const sub = (evt, fn) => offs.push(ctx.bus.on(evt, fn))
  const mercy = () => Boolean(ctx.mercy?.on)
  let alive = true
  let raf = 0

  // Persistent traces of this reader in the codex.
  const leaf = ctx.memory.update('sanctum.leaves', (n) => n + 1, 0)
  const vigils = () => ctx.memory.get('sanctum.vigils', 0)

  const planet = sky.planetaryHour.planet
  // "the hour of Mars", but "the hour of the Sun" and "the hour of the Moon".
  const planetName = /^(Sun|Moon)$/.test(planet) ? `the ${planet}` : planet
  const moonLatin = L.MOON_LATIN[sky.moon.name] ?? 'luna'
  // The planetary day runs from sunrise to sunrise, so the small hours still belong to yesterday's ruler.
  const dayLatin = L.PLANET_LATIN[sky.planetaryHour.dayRuler] ? `dies ${L.PLANET_LATIN[sky.planetaryHour.dayRuler]}` : L.DAY_LATIN[sky.weekday] ?? ''

  // ---- shared defs (gold gradients referenced by several inline SVGs) ----
  const defs = h('div', {
    class: 'sn-defs',
    'aria-hidden': 'true',
    html: `<svg width="0" height="0" focusable="false"><defs>
<linearGradient id="sn-gold" x1="0" y1="0" x2="1" y2="1">${GOLD_STOPS.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>
<filter id="sn-wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="${rng.int(1, 99)}"/><feDisplacementMap in="SourceGraphic" scale="1.7" xChannelSelector="R" yChannelSelector="G"/></filter>
</defs></svg>`,
  })

  // ---- the live voice for readers of screens ----
  const live = h('p', { class: 'visually-hidden', 'aria-live': 'polite' })
  const say = (text) => { live.textContent = ''; later(() => { live.textContent = text }, 60) }

  // =====================================================================================
  // VERSO: the chapter
  // =====================================================================================
  // A scribe does not copy the same verse twice on one opening: a verse that begins with the same six
  // words as one already written is passed over, no three verses on the opening begin with the same
  // three words, and every verse opens with a capital.
  const written = new Set()
  const openings = new Map()
  function freshVerses(count, opts = {}) {
    const [first] = chapter(rng, 1, opts)
    const where = { book: first.book, chapter: first.chapter }
    const out = []
    for (let tries = 0, v = first; out.length < count && tries < count * 10; tries++, v = verse(rng, where)) {
      const words = v.text.toLowerCase().replace(/[^a-z0-9 ]+/g, '').split(/\s+/)
      const key = words.slice(0, 6).join(' ')
      const head = words.slice(0, 3).join(' ')
      if (written.has(key) || (openings.get(head) ?? 0) >= 2) continue
      written.add(key)
      openings.set(head, (openings.get(head) ?? 0) + 1)
      // The corrector's hand: a commandment to "ye" is not about "its" focus ring.
      const text = /^ye shall not /i.test(v.text)
        ? v.text.replace(/\bitself\b/g, 'yourselves').replace(/\bits\b/g, 'your').replace(/\band (\w+?)s it\b/g, 'and $1 it')
        : v.text
      out.push({ ...v, text: text.charAt(0).toUpperCase() + text.slice(1) })
    }
    return out
  }
  const verses = freshVerses(rng.int(12, 14))
  // The great initial wants a verse long enough to wrap around it: the longest of the first few leads.
  const lead = verses.slice(0, 5).reduce((best, v, i) => (v.text.length > verses[best].text.length ? i : best), 0)
  if (lead) [verses[0], verses[lead]] = [verses[lead], verses[0]]
  const book = verses[0].book
  const chNo = verses[0].chapter
  const frags = rng.shuffle(FRAGMENTS.filter((fr) => fr.lang in FRAGMENT_LANGS))
  const lemmaAfter = new Set([rng.int(1, 2), rng.int(5, 6), rng.int(8, 10)])
  const manicule = rng.int(3, verses.length - 1)

  function alternating(text, className) {
    let k = 0
    return h('span', { class: className, 'aria-hidden': 'true' },
      [...text].map((c) => (c === ' ' ? ' ' : h('span', { class: (k++ % 2) ? 'sn-blue' : 'sn-red' }, c))))
  }

  function verseNumber(n) {
    return h('span', { class: 'sn-vnum' },
      h('span', { class: 'visually-hidden' }, `verse ${n}. `),
      h('span', { 'aria-hidden': 'true' }, L.roman(n)))
  }

  function firstVerse(v) {
    const m = /^([A-Za-z])([A-Za-z'’]*)(\s*)(.*)$/s.exec(v.text)
    const p = h('p', { class: 'sn-verse sn-verse--first' })
    if (!m) { p.append(v.text); return p }
    const [, first, restWord, space, rest] = m
    const initial = first.toUpperCase()
    const words = rest.split(' ')
    const caps = words.slice(0, 2).join(' ')
    const tail = words.slice(2).join(' ')
    p.append(
      h('span', { class: 'sn-initial', 'aria-hidden': 'true', html: initialSvg(rng, initial, { id: `${uid}-init` }) }),
      h('span', { class: 'visually-hidden' }, initial + restWord),
      h('span', { class: 'sn-smallcaps', 'aria-hidden': 'true' }, restWord),
      h('span', { class: 'sn-smallcaps' }, space + caps),
      tail ? ` ${tail}` : '',
    )
    return p
  }

  let pilcrowAlt = 0
  function verseEl(v, i) {
    if (i === 0) return firstVerse(v)
    const n = i + 1
    const lombard = i % 4 === 3 && /^[A-Za-z]/.test(v.text)
    const p = h('p', { class: lombard ? 'sn-verse sn-verse--lombard' : 'sn-verse' })
    if (i === manicule && !lombard) p.append(h('span', { class: 'sn-manicule', title: 'nota bene: a later reader marked this verse', 'aria-hidden': 'true' }, '☞︎'))
    if (lombard) {
      const blue = (i / 4) % 2 < 1
      const letter = h('span', { class: `sn-lombard ${blue ? 'sn-lombard--blue' : 'sn-lombard--red'}` }, v.text[0].toUpperCase())
      letter.style.backgroundImage = penworkUrl(rng, blue ? '#b3301c' : '#1f3a8a')
      p.append(verseNumber(n), letter, v.text.slice(1))
    } else {
      p.append(h('span', { class: `sn-pilcrow ${pilcrowAlt++ % 2 ? 'sn-blue' : 'sn-red'}`, 'aria-hidden': 'true' }, '¶'), verseNumber(n), ' ', v.text)
    }
    return p
  }

  let renvoi = 0
  function lemmaEl(fr) {
    const lang = FRAGMENT_LANGS[fr.lang]
    const mark = L.RENVOI[renvoi++ % L.RENVOI.length]
    return h('div', { class: `sn-lemma sn-lemma--${fr.lang}` },
      h('p', { class: 'sn-lemma-text', lang, dir: fr.lang === 'he' ? 'rtl' : null },
        h('span', { class: 'sn-renvoi', 'aria-hidden': 'true' }, `${mark} `), fr.text),
      h('p', { class: 'sn-lemma-gloss' }, h('abbr', { title: 'scilicet: that is to say' }, L.GLOSS_MARK), ' ', fr.gloss))
  }

  const scripture = h('div', { class: 'sn-scripture sn-gildable' })
  let fragIndex = 0
  verses.forEach((v, i) => {
    scripture.append(verseEl(v, i))
    if (lemmaAfter.has(i) && frags[fragIndex]) scripture.append(lemmaEl(frags[fragIndex++]))
  })

  const incipit = h('p', { class: 'sn-incipit' },
    h('span', { class: 'sn-fraktur', 'aria-hidden': 'true' }, L.fraktur('Incipit')),
    h('span', { class: 'visually-hidden' }, 'Incipit. '),
    ` Here beginneth chapter ${L.roman(chNo)} of ${book}, which is read in the hour of ${planetName} while the moon is ${sky.moon.name}.`)

  const tractVerses = freshVerses(4, { book: 'the Emerald Stylesheet' })
  const tractatus = h('section', { class: 'sn-tractatus', 'aria-labelledby': `${uid}-tract` },
    h('h2', { id: `${uid}-tract`, class: 'sn-h' }, `From the Emerald Stylesheet, chapter ${L.roman(tractVerses[0].chapter)}`),
    h('div', { class: 'sn-tract-body sn-gildable' },
      tractVerses.map((v, i) => h('p', { class: 'sn-verse' },
        h('span', { class: `sn-pilcrow ${i % 2 ? 'sn-blue' : 'sn-red'}`, 'aria-hidden': 'true' }, '¶'), verseNumber(i + 1), ' ', v.text))))

  const palimpsest = h('div', { class: 'sn-palimpsest', 'aria-hidden': 'true' })
  palimpsest.append(...[0, 1, 2, 3, 4, 5].flatMap(() => L.PALIMPSEST.map((line) => h('p', {}, line))))

  // Where the chapter ends before the facing page does, the lines stay ruled and unwritten.
  const lacuna = (note) => h('div', { class: 'sn-lacuna' }, h('p', { class: 'sn-lacuna-note sn-hand' }, note))
  const textblock = h('div', { class: 'sn-textblock' }, palimpsest, incipit, scripture, tractatus,
    lacuna('Hic deficit exemplar. Here the copy the scribe was working from failed him, and he left the lines ruled for whoever should find the rest of the chapter.'))

  // The bar border and its sprays.
  const strip = borderStrip(rng)
  const bar = h('div', { class: 'sn-bar', 'aria-hidden': 'true' })
  bar.style.backgroundImage = strip.url
  for (const top of [2, 46, 80]) {
    const s = h('div', { class: 'sn-spray', html: spraySvg(rng) })
    s.style.top = `${top + rng.int(-3, 3)}%`
    bar.append(s)
  }
  const outerNote = h('p', { class: 'sn-hand sn-vertical-note' }, 'sub scriptura, scriptura (beneath the writing, writing)')

  // Bas-de-page: a ground line with drolleries, the Wood's lamp, the scribe's complaint, the catchword.
  const chosen = rng.shuffle(BEASTS).slice(0, 5)
  const beastEls = []
  const performed = new Set()

  function beastEl(beast, i) {
    const code = h('code', { class: 'sn-banderole' }, `${beast.decl[0]}: ${beast.decl[1]};`)
    const gloss = h('p', { class: 'sn-beast-gloss sn-hand', hidden: true }, beast.gloss)
    const btn = h('button', {
      type: 'button',
      class: `sn-beast sn-beast--${beast.id}`,
      'aria-label': `A drollery: ${beast.noun}, who is the declaration ${beast.decl[0]}: ${beast.decl[1]}. Press to see it perform.`,
      html: beastSvg(beast, `${uid}-b${i}`),
    })
    btn.append(code)
    let alt = false
    let busy = 0
    btn.addEventListener('click', () => {
      gloss.hidden = false
      performed.add(beast.id)
      if (beast.mode === 'toggle') {
        alt = !alt
        btn.classList.toggle('is-alt', alt)
        const d = alt ? beast.alt : beast.decl
        code.textContent = `${d[0]}: ${d[1]};`
        btn.setAttribute('aria-label', `A drollery: ${beast.noun}, who is now the declaration ${d[0]}: ${d[1]}. Press to change it back.`)
        say(`${beast.noun} now declares ${d[0]}: ${d[1]}. ${beast.gloss}`)
      } else {
        clearTimeout(busy)
        timers.delete(busy)
        btn.classList.remove('is-performing')
        void btn.offsetWidth // restart the performance
        btn.classList.add('is-performing')
        busy = later(() => btn.classList.remove('is-performing'), beast.ms)
        say(`${beast.noun} performs ${beast.decl[0]}: ${beast.decl[1]}. ${beast.gloss}`)
      }
      if (performed.size === chosen.length && !bestiary.classList.contains('is-shown')) {
        bestiary.classList.add('is-shown')
        bestiary.hidden = false
        ctx.memory.markSecret('bestiary', { face: 'sanctum' })
      }
    })
    const fig = h('figure', { class: `sn-beast-fig sn-beast-fig--${beast.id}` }, btn, gloss)
    beastEls.push(btn)
    return fig
  }

  const lamp = h('button', {
    type: 'button',
    class: 'sn-lamp',
    'aria-pressed': 'false',
    'aria-label': 'Hold a Wood’s lamp to the page: ultraviolet light shows what was scraped away',
    title: 'the Wood’s lamp',
    html: `<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false" fill="none" stroke="#2b1b10" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
<path class="sn-lamp-flame" d="M40 8 C 36 14 36 19 40 22 C 44 19 44 14 40 8 Z" fill="#8f6bff" stroke="#3a2477"/>
<path d="M8 36 C 8 28 20 24 32 26 C 38 27 42 24 44 22 L 50 26 C 46 30 44 36 36 40 C 26 44 12 44 8 36 Z" fill="#c79a2e"/>
<path d="M22 44 L 20 52 L 36 52 L 34 44" fill="#a57a1e"/><path d="M8 36 C 2 34 2 28 8 28"/>
</svg><span class="sn-lamp-label">lux occulta</span>`,
  })

  const complaint = h('p', { class: 'sn-hand sn-complaint' }, rng.pick(L.COMPLAINTS))
  const catchword = h('p', { class: 'sn-catchword', title: 'the catchword: the first word of the next leaf' }, h('span', {}, 'Opus'))
  const bestiary = h('p', { class: 'sn-hand sn-bestiary', hidden: true }, 'Explicit bestiarium. Every creature in the margin has shown you what it is. None of them is what it looks like.')
  const ground = h('div', { class: 'sn-ground', 'aria-hidden': 'true', html: groundSvg(rng) })

  const basBeasts = chosen.slice(0, 3).map(beastEl)
  const bas = h('footer', { class: 'sn-bas' },
    h('div', { class: 'sn-bas-row' }, lamp, ...basBeasts, ground),
    bestiary,
    h('div', { class: 'sn-bas-foot' }, complaint, catchword))

  const colophon = h('p', { class: 'sn-colophon sn-gold-text', hidden: true }, L.VIGIL_COLOPHON)
  const uvVeil = h('div', { class: 'sn-uv-veil', 'aria-hidden': 'true' })
  const returnNote = h('p', { class: 'sn-hand sn-return-note', hidden: true }, 'I kept your place.')

  const verso = h('article', { class: 'sn-page sn-verso', 'aria-labelledby': `${uid}-title` },
    h('header', { class: 'sn-head' },
      h('h1', { class: 'sn-running', id: `${uid}-title` },
        h('span', { class: 'visually-hidden' }, 'Liber Cascadae, the Book of the Cascade'),
        alternating(L.RUNNING_TITLE, 'sn-running-letters')),
      returnNote),
    bar, outerNote, textblock, bas, colophon, uvVeil)

  // =====================================================================================
  // RECTO: the Great Work
  // =====================================================================================
  const folio = 40 + rng.int(0, 60) + leaf * 2
  const hora = h('p', { class: 'sn-hora' },
    h('span', { class: 'visually-hidden' }, `The hour of ${planetName}; the moon is ${sky.moon.name}; the day of ${/^(Sun|Moon)$/.test(sky.planetaryHour.dayRuler) ? 'the ' : ''}${sky.planetaryHour.dayRuler}. `),
    h('span', { 'aria-hidden': 'true', title: `the hour of ${planetName}; the moon is ${sky.moon.name}` },
      `Hora ${L.PLANET_LATIN[planet]} `, h('span', { class: 'sn-planet' }, `${sky.planetaryHour.glyph}︎`),
      h('span', { class: 'sn-fleuron' }, ' ❧ '), moonLatin,
      h('span', { class: 'sn-fleuron' }, ' ❧ '), dayLatin))

  const opusFig = h('figure', { class: 'sn-opus', 'data-stage': '0', html: opusSvg(sky, { id: `${uid}-opus` }) })
  opusFig.append(h('figcaption', { class: 'sn-opus-legend' }, L.OPUS_LEGEND))
  let stage = 0
  const opusCode = h('code', { class: 'sn-opus-code' })
  const opusCaption = h('p', { class: 'sn-opus-caption', 'aria-live': 'polite' })
  const opusGlyph = h('p', { class: 'sn-opus-glyph' })
  const opusBtn = h('button', { type: 'button', class: 'sn-opus-btn' })
  function setStage(i, announce = false) {
    stage = i
    const s = L.OPUS_STEPS[i]
    opusFig.dataset.stage = String(i)
    opusCode.textContent = s.code
    opusCaption.replaceChildren(h('strong', {}, `${s.latin}. `), s.caption)
    opusGlyph.replaceChildren(glyphText(s.stage, { className: 'sn-glyph-word' }))
    opusBtn.textContent = s.next
    if (announce && i === 3) {
      ctx.memory.markSecret('great-work', { face: 'sanctum' })
      if (ctx.audio?.summoned) ctx.audio.bell?.()
    }
  }
  opusBtn.addEventListener('click', () => setStage((stage + 1) % 4, true))
  setStage(0)

  const prophecyText = prophecy(rng, sky)
  const prophecyEl = h('section', { class: 'sn-prophecy', 'aria-labelledby': `${uid}-proph` },
    h('h3', { id: `${uid}-proph` }, 'Prophetia horae', h('span', { class: 'sn-h-gloss' }, ' (the prophecy of this hour)')),
    h('div', { class: 'sn-gildable' }, h('p', {}, prophecyText)))

  const titulus = h('div', { class: 'sn-titulus' },
    inscription({ className: 'sn-inscription' }),
    h('p', { class: 'sn-titulus-note sn-hand' }, 'written in the tongue of the Cascade; the abecedarium in the margin is not complete'))

  // The Book of Life: the ritual's names, prayers and souls.
  const liberNames = h('ol', { class: 'sn-liber-names' })
  const liberEmpty = h('p', { class: 'sn-liber-empty sn-hand' })
  const liberCount = h('p', { class: 'sn-liber-count' })
  const liber = h('section', { class: 'sn-liber sn-gildable', 'aria-labelledby': `${uid}-liber` },
    h('h3', { id: `${uid}-liber` }, 'Liber vitae', h('span', { class: 'sn-h-gloss' }, ' (the Book of Life)')),
    h('p', { class: 'sn-liber-sub' }, 'The names of those who reached the Highest Heaven, written in gold in the script of the Cascade.'),
    liberNames, liberEmpty, liberCount)

  const bell = h('button', {
    type: 'button',
    class: 'sn-rope',
    'aria-label': 'Pull the bell rope: ring the bell and summon the sound of the sanctum',
    title: 'Pull the rope',
    html: `<span class="sn-rope-cord" aria-hidden="true"></span><svg class="sn-bell" viewBox="0 0 60 70" aria-hidden="true" focusable="false">
<path d="M30 2 v8" stroke="#6b4a1c" stroke-width="3"/><circle cx="30" cy="10" r="4" fill="none" stroke="#7a5420" stroke-width="2"/>
<path d="M30 13 C 18 13 14 24 14 36 C 14 46 10 52 5 56 L 55 56 C 50 52 46 46 46 36 C 46 24 42 13 30 13 Z" fill="url(#sn-gold)" stroke="#2b1b10" stroke-width="1.6"/>
<path d="M9 52 L 51 52" stroke="#2b1b10" stroke-width="1"/><path d="M20 22 C 19 30 19 40 17 48" stroke="#fff3c4" stroke-width="1.6" opacity=".6" fill="none"/>
<circle class="sn-clapper" cx="30" cy="61" r="5" fill="#6b4a1c" stroke="#2b1b10" stroke-width="1.2"/></svg>`,
  })
  let rings = 0
  bell.addEventListener('click', () => {
    rings++
    const audio = ctx.audio
    if (audio) {
      if (!audio.summoned) audio.summon?.()
      else audio.bell?.()
    }
    bell.classList.remove('is-rung')
    void bell.offsetWidth
    bell.classList.add('is-rung')
    say(audio ? (rings === 1 ? 'The bell is rung. The sanctum begins to sound.' : 'The bell is rung.') : 'The bell is rung, but the chapel is not yet listening.')
  })

  // The margin of the recto: the Rosetta slip, two drolleries, notes in later hands, drypoint graffiti.
  const slip = h('aside', { class: 'sn-slip', 'aria-labelledby': `${uid}-abc` },
    h('h3', { id: `${uid}-abc` }, 'Abecedarium'),
    h('p', { class: 'sn-slip-note sn-hand' }, 'pen trials of a later scribe'),
    rosetta('sanctum', { className: 'sn-rosetta' }))
  const omenNotes = (sky.omens.length ? sky.omens : ['__metal']).slice(0, 2).map((o) =>
    h('p', { class: 'sn-hand sn-omen-note' },
      o === '__metal' ? `Hora ${L.PLANET_LATIN[planet]}: there is ${L.PLANET_METAL[planet]} in the ink today.` : L.OMEN_NOTES[o] ?? ''))
  const vigilNote = h('p', { class: 'sn-hand sn-vigil-note', hidden: true })
  const graffiti = h('div', { class: 'sn-graffiti' })
  // The tree of this very page, drawn once the codex lies open in the document (see arbor.js).
  const arborDrawing = h('div', { class: 'sn-arbor-drawing' })
  const arbor = h('figure', { class: 'sn-arbor' }, arborDrawing,
    h('figcaption', { class: 'sn-hand' }, 'Arbor documenti, drawn from the life: the tree of this very page. Its root is :root, and every leaf is an element. The red fruit is Mercy; whoever tastes it, nothing moves for them.'))
  const margin = h('aside', { class: 'sn-margin' },
    slip, ...chosen.slice(3).map((b, i) => beastEl(b, i + 3)), ...omenNotes, vigilNote, graffiti, arbor)

  const sealRim = `SIGILLVM HORAE ${L.PLANET_LATIN[planet].toUpperCase()} ✶ ${moonLatin.toUpperCase()} ✶ ANNO ${L.roman(ctx.clock().getFullYear(), { upper: true })}`
  const sealEl = h('div', { class: 'sn-seal-wrap' },
    h('span', { class: 'sn-seal-cord', 'aria-hidden': 'true' }),
    h('div', {
      class: 'sn-seal',
      role: 'img',
      'aria-label': `A seal of red wax hangs from the leaf. Around its rim: ${sealRim}.`,
      html: seal(rng.fork('seal'), sealRim, { size: 200, id: `${uid}-seal` }),
    }))

  const recto = h('article', { class: 'sn-page sn-recto', 'aria-labelledby': `${uid}-opus-h` },
    h('header', { class: 'sn-head sn-head--recto' },
      h('p', { class: 'sn-running' },
        h('span', { class: 'visually-hidden' }, `${book}, chapter ${chNo}`),
        alternating(book.replace(/^the /i, '').toUpperCase(), 'sn-running-letters')),
      h('p', { class: 'sn-folio', title: 'the folio number' }, h('span', { class: 'visually-hidden' }, `folio ${folio}`), h('span', { 'aria-hidden': 'true' }, `fo. ${L.roman(folio)}`))),
    h('div', { class: 'sn-textblock sn-textblock--recto' },
      hora,
      h('h2', { class: 'sn-opus-title', id: `${uid}-opus-h` },
        h('span', { 'aria-hidden': 'true', class: 'sn-fraktur' }, L.fraktur('Opus magnum')),
        h('span', { class: 'visually-hidden' }, 'Opus magnum: the Great Work, which is the centering of a div')),
      opusFig,
      h('div', { class: 'sn-opus-rite' }, opusCode, opusCaption, opusGlyph, opusBtn),
      prophecyEl, titulus, liber, kalendarEl(ctx.clock(), { id: `${uid}-kal` }),
      lacuna('Spatium relictum: room left for a miniature that was never painted. The illuminator was still centering the div.')),
    margin, sealEl)

  // =====================================================================================
  // The chapel, the codex, the rope
  // =====================================================================================
  const ribbon = h('div', { class: 'sn-ribbon', 'aria-hidden': 'true' })
  const codex = h('div', { class: 'sn-codex' }, bell, verso, recto, ribbon)

  // The candles burn only while somebody reads, and the same candle is lit again on the next visit.
  let burnt = Math.max(0, Number(ctx.memory.get('sanctum.wax', 0)) || 0)
  if (burnt >= CANDLE_LIFE) {
    burnt = 0
    ctx.memory.set('sanctum.wax', 0)
    margin.insertBefore(h('p', { class: 'sn-hand sn-omen-note' }, 'A new candle has been set on the pricket. The last one burned down while you were reading.'), vigilNote)
  }
  const candles = candlesEl(rng.fork('candles'), uid)
  const setWax = () => candles.style.setProperty('--sn-wax', waxLeft(burnt).toFixed(3))
  setWax()

  const wrapper = h('div', { class: 'sn-chapel' },
    defs, h('div', { class: 'sn-glow', 'aria-hidden': 'true' }), candles, codex, live)
  if (ctx.memory.get('sanctum.vigilKept', false)) codex.classList.add('has-kept-vigil')
  if (sky.has('night')) wrapper.classList.add('is-night')
  if (sky.has('saturn-hour')) wrapper.classList.add('is-saturn')
  if (sky.has('eclipse')) wrapper.classList.add('is-eclipse')
  codex.style.setProperty('--sn-burnish', String(Math.min(1, 0.15 + vigils() * 0.17)))
  ctx.root.append(wrapper)
  arborDrawing.innerHTML = arborSvg(gatherTree(document.documentElement), rng.fork('arbor'))
  if (vigils() > 0) {
    vigilNote.hidden = false
    vigilNote.textContent = `Vigils kept at this codex: ${L.roman(vigils())}. The initial is brighter for each of them.`
  }

  // =====================================================================================
  // Behaviours
  // =====================================================================================

  // -- Eyes: the creatures and the sun watch the reader's hand. --
  const eyeHosts = () => [...codex.querySelectorAll('.sn-beast-svg'), codex.querySelector('.sn-opus-svg')].filter(Boolean)
  const hosts = eyeHosts()
  let pointer = { x: -1, y: -1 }
  function updateEyes() {
    raf = 0
    if (!alive || mercy() || document.hidden || codex.classList.contains('is-hushed')) return
    const reads = hosts.map((el) => {
      const r = el.getBoundingClientRect()
      const isOpus = el.classList.contains('sn-opus-svg')
      // The sun sits in the upper-left corner of the figure.
      const cx = isOpus ? r.left + r.width * 0.095 : r.left + r.width / 2
      const cy = isOpus ? r.top + r.height * 0.095 : r.top + r.height * 0.4
      const dx = pointer.x - cx
      const dy = pointer.y - cy
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(1, d / 220) * (isOpus ? 1.4 : 1.2)
      return [el, (dx / d) * k, (dy / d) * k]
    })
    for (const [el, x, y] of reads) {
      el.style.setProperty('--px', x.toFixed(2))
      el.style.setProperty('--py', y.toFixed(2))
    }
  }
  listen(window, 'pointermove', (e) => {
    pointer = { x: e.clientX, y: e.clientY }
    if (!raf) raf = requestAnimationFrame(updateEyes)
    if (uvOn) moveLens(e.clientX, e.clientY)
  }, { passive: true })
  function centerEyes() {
    for (const el of hosts) { el.style.removeProperty('--px'); el.style.removeProperty('--py') }
  }

  // -- Gilding: stillness lays gold into the letters, spreading from where the hand rests. --
  const gildables = [...codex.querySelectorAll('.sn-gildable')]
  for (const el of gildables) el.append(h('span', { class: 'sn-gild-veil', 'aria-hidden': 'true' }))
  const gild = { r: 0, rate: 0, origin: null, fiatUntil: 0 }
  let gildTimer = 0
  function gildOrigin() {
    const p = ctx.behavior?.pointer
    const rect = codex.getBoundingClientRect()
    const inside = p && p.x >= rect.left && p.x <= rect.right && p.y >= rect.top && p.y <= rect.bottom
    if (inside && pointer.x >= 0) return { x: p.x + scrollX, y: p.y + scrollY }
    // No hand on the book (touch, keyboard, or elsewhere): the gold wells up from the initial.
    const ini = codex.querySelector('.sn-initial')?.getBoundingClientRect() ?? rect
    return { x: ini.left + ini.width / 2 + scrollX, y: ini.top + ini.height / 2 + scrollY }
  }
  let lastGild = ''
  function applyGild() {
    const on = gild.r > GILD_SOFT
    codex.classList.toggle('is-gilding', on)
    if (!on || !gild.origin) { lastGild = ''; return }
    const key = `${Math.round(gild.r)}|${Math.round(gild.origin.x)}|${Math.round(gild.origin.y)}|${scrollX}|${scrollY}`
    if (key === lastGild) return
    lastGild = key
    const rects = gildables.map((el) => el.getBoundingClientRect())
    gildables.forEach((el, i) => {
      el.style.setProperty('--sn-gx', `${Math.round(gild.origin.x - (rects[i].left + scrollX))}px`)
      el.style.setProperty('--sn-gy', `${Math.round(gild.origin.y - (rects[i].top + scrollY))}px`)
      el.style.setProperty('--sn-gr', `${Math.round(gild.r)}px`)
    })
  }
  function gildTick() {
    if (!alive || document.hidden) return
    if (mercy()) {
      // Mercy: no creeping gold. The page is simply gilded, or simply not.
      gild.r = gild.rate > 0 && (codex.classList.contains('is-gilded') || Date.now() < gild.fiatUntil) ? GILD_MAX : 0
    } else if (gild.rate > 0) {
      gild.r = Math.min(GILD_MAX, Math.max(gild.r, GILD_SOFT) + gild.rate)
    } else {
      gild.r = Math.max(0, gild.r - 60)
    }
    applyGild()
    if (gild.r <= 0 && gild.rate <= 0) stopGild()
  }
  function startGild(rate) {
    if (!gild.origin || gild.r <= 0) gild.origin = gildOrigin()
    gild.rate = rate
    if (!gildTimer) gildTimer = setInterval(gildTick, 500)
    gildTick()
  }
  function drainGild() {
    gild.rate = 0
    if (gild.r > 0 && !gildTimer) gildTimer = setInterval(gildTick, 500)
  }
  function stopGild() {
    clearInterval(gildTimer)
    gildTimer = 0
    gild.origin = null
  }

  sub('behavior:still', ({ seconds } = {}) => {
    if (seconds === 7) {
      codex.classList.add('is-hushed')
      centerEyes()
      startGild(5)
    } else if (seconds === 33) {
      codex.classList.add('is-gilded')
      startGild(13)
      const n = ctx.memory.update('sanctum.vigils', (v) => v + 1, 0)
      codex.style.setProperty('--sn-burnish', String(Math.min(1, 0.15 + n * 0.17)))
      vigilNote.hidden = false
      vigilNote.textContent = `Vigils kept at this codex: ${L.roman(n)}. The initial is brighter for each of them.`
      ctx.memory.markSecret('stillness', { face: 'sanctum' })
      say('You have been still. Gold is spreading into the letters.')
    } else if (seconds === 108) {
      codex.classList.add('is-vigil', 'has-kept-vigil')
      colophon.hidden = false
      ctx.memory.set('sanctum.vigilKept', true)
      say(`The sun in the figure opens its eyes. A colophon appears: ${L.VIGIL_COLOPHON}`)
    }
  })
  sub('behavior:stir', () => {
    codex.classList.remove('is-hushed', 'is-gilded', 'is-vigil')
    if (Date.now() > gild.fiatUntil) drainGild()
  })

  // "fiat lux", typed anywhere: the whole spread is gilded at once, for a little while.
  sub('behavior:typed', ({ buffer } = {}) => {
    if (!buffer?.endsWith('fiat lux')) return
    // Words written into the altar's own fields are the altar's business, not the book's.
    if (document.activeElement?.closest?.('input, textarea, select, [contenteditable]')) return
    gild.fiatUntil = Date.now() + 12000
    gild.origin = gildOrigin()
    gild.r = Math.max(gild.r, 400)
    startGild(120)
    codex.classList.add('is-fiat')
    ctx.memory.markSecret('fiat-lux', { face: 'sanctum' })
    say('Fiat lux. The page is filled with gold.')
    later(() => {
      codex.classList.remove('is-fiat')
      if (!codex.classList.contains('is-hushed')) drainGild()
    }, 12000)
  })

  // -- The Wood's lamp: ultraviolet shows the scraped Old Covenant under the scripture. --
  let uvOn = false
  const lens = { x: 0, y: 0 }
  function moveLens(x, y) {
    lens.x = x
    lens.y = y
    const vr = verso.getBoundingClientRect()
    const pr = palimpsest.getBoundingClientRect()
    verso.style.setProperty('--sn-lx', `${Math.round(x - vr.left)}px`)
    verso.style.setProperty('--sn-ly', `${Math.round(y - vr.top)}px`)
    palimpsest.style.setProperty('--sn-px', `${Math.round(x - pr.left)}px`)
    palimpsest.style.setProperty('--sn-py', `${Math.round(y - pr.top)}px`)
  }
  function setUv(on) {
    uvOn = on
    verso.classList.toggle('is-uv', on)
    lamp.setAttribute('aria-pressed', String(on))
    if (on) {
      // The lens starts where the hand is, or else in the middle of what the reader can see of the text.
      const tb = textblock.getBoundingClientRect()
      const known = pointer.x >= 0 && pointer.y >= 0
      const midY = (Math.max(0, tb.top) + Math.min(innerHeight, tb.bottom)) / 2
      moveLens(known ? pointer.x : tb.left + tb.width / 2, known ? pointer.y : midY)
      ctx.memory.markSecret('palimpsest', { face: 'sanctum' })
      say(`Under the Wood's lamp an older text shows through, scraped away and written over: ${L.PALIMPSEST.join(' ')}`)
    }
  }
  lamp.addEventListener('click', () => setUv(!uvOn))
  // Keyboard readers steer the lamp with the arrow keys while it has focus.
  lamp.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] }[e.key]
    if (!uvOn || !step) return
    e.preventDefault()
    const vr = verso.getBoundingClientRect()
    lens.x = Math.min(vr.right, Math.max(vr.left, lens.x + step[0]))
    lens.y = Math.min(vr.bottom, Math.max(vr.top, lens.y + step[1]))
    moveLens(lens.x, lens.y)
  })
  listen(document, 'keydown', (e) => { if (e.key === 'Escape' && uvOn) setUv(false) })
  listen(verso, 'pointerdown', (e) => { if (uvOn && e.pointerType !== 'mouse') moveLens(e.clientX, e.clientY) })
  // The lamp is held still while the leaf is scrolled beneath it (a wheel, or a finger dragging the page).
  let lensRaf = 0
  listen(window, 'scroll', () => {
    if (uvOn && !lensRaf) lensRaf = requestAnimationFrame(() => { lensRaf = 0; if (alive && uvOn) moveLens(lens.x, lens.y) })
  }, { passive: true })

  // -- The ritual: prayers, souls and the Book of Life. --
  const known = { prayers: null, online: null }
  let waited = false
  function wallText(m) {
    const t = typeof m === 'string' ? m : m?.text ?? m?.message ?? ''
    return String(t).slice(0, 80)
  }
  function renderRitual() {
    const raw = ctx.ritual?.state
    // Until the ritual has heard from the server its numbers are only zeros; say nothing yet.
    const st = raw && raw.loaded !== false && !raw.offline ? raw : null
    const prayers = known.prayers ?? st?.prayers
    const online = known.online ?? st?.online
    const asc = Array.isArray(st?.ascended) ? st.ascended : []
    const names = asc.slice(-9).reverse()
    liberNames.replaceChildren(...names.map((a) => h('li', { class: 'glyph sn-gilt-name', lang: 'x-cascade' }, String(typeof a === 'string' ? a : a?.name ?? '').slice(0, 24))))
    liberEmpty.hidden = names.length > 0
    liberEmpty.textContent = st
      ? 'No name is written here yet. The book waits for those who knock at the Highest Heaven.'
      : raw?.offline || waited
        ? 'The book is shut while the temple is silent.'
        : 'The book is being opened.'
    const bits = []
    if (Number.isFinite(prayers)) bits.push(h('span', { title: `${prayers} prayers` }, `orationes ${L.roman(prayers, { upper: true })}`))
    if (Number.isFinite(online) && online > 0) bits.push(h('span', { title: `${online} souls reading now` }, `legunt nunc ${L.roman(online)}`))
    liberCount.replaceChildren(...bits.flatMap((b, i) => (i ? [h('span', { class: 'sn-fleuron', 'aria-hidden': 'true' }, ' ❧ '), b] : [b])))
    const wall = Array.isArray(st?.wall) ? st.wall : []
    graffiti.replaceChildren(...wall.slice(-3).reverse().map(wallText).filter(Boolean).map((t, i) =>
      h('p', { class: `glyph sn-drypoint sn-drypoint--${i}`, lang: 'x-cascade', title: 'scratched into the margin by a stranger' }, t)))
  }
  sub('temple:awake', renderRitual)
  sub('ritual:state', () => { known.prayers = null; known.online = null; renderRitual() })
  sub('server:open', () => later(renderRitual, 400))
  sub('server:prayer', (d) => { if (Number.isFinite(d?.count)) known.prayers = d.count; renderRitual() })
  sub('ritual:prayed', (d) => { if (Number.isFinite(d?.count)) known.prayers = d.count; renderRitual() })
  sub('server:presence', (d) => { if (Number.isFinite(d?.online)) known.online = d.online; renderRitual() })
  sub('server:wall', () => later(renderRitual, 50))
  sub('ritual:inscribed', () => later(renderRitual, 50))
  sub('server:ascended', () => later(renderRitual, 50))
  renderRitual()
  later(renderRitual, 1500)
  later(() => { waited = true; renderRitual() }, 5000)

  // -- Away and back: the ribbon kept the place. --
  sub('behavior:return', ({ awayMs } = {}) => {
    if (!(awayMs > 4000)) return
    const minutes = Math.round(awayMs / 60000)
    const hours = Math.round(awayMs / 3600000)
    const away = minutes < 2 ? '' : minutes < 60 ? `You were away ${L.roman(minutes)} minutes. ` : hours < 24 ? `You were away ${hours < 2 ? 'an hour' : `${L.roman(hours)} hours`}. ` : 'You were away a long while. '
    returnNote.hidden = false
    returnNote.replaceChildren(h('span', { class: 'sn-manicule', 'aria-hidden': 'true' }, '☞︎'), `${away}I kept your place.`)
    later(() => { returnNote.hidden = true }, 9000)
  })

  // -- Restlessness: the creatures' pupils shrink, and they watch you more closely. --
  sub('behavior:restless', () => codex.classList.add('is-restless'))
  sub('behavior:calm', () => codex.classList.remove('is-restless'))

  // -- The candles burn down, half a minute at a time, only while the page is seen. --
  const burnTimer = setInterval(() => {
    if (!alive || document.hidden) return
    burnt = Math.min(CANDLE_LIFE, burnt + 0.5)
    ctx.memory.set('sanctum.wax', burnt)
    if (!mercy()) setWax()
  }, 30000)

  // -- Mercy: stop the eyes and the creeping gold at once. --
  sub('mercy:change', ({ on } = {}) => {
    if (on) { centerEyes(); if (gildTimer) gildTick() } else setWax()
  })

  // =====================================================================================
  return function destroy() {
    alive = false
    for (const off of offs) { try { off() } catch {} }
    for (const t of timers) clearTimeout(t)
    timers.clear()
    clearInterval(burnTimer)
    stopGild()
    if (raf) cancelAnimationFrame(raf)
    if (lensRaf) cancelAnimationFrame(lensRaf)
    wrapper.remove()
  }
}

// A strip of grass and flowers for the bas-de-page, where the drolleries stand.
function groundSvg(rng) {
  const W = 600
  let tufts = ''
  for (let x = 6; x < W; x += rng.int(9, 16)) {
    const hgt = rng.float(4, 9)
    tufts += `M${x} 14 q ${rng.float(-2, 2).toFixed(1)} ${(-hgt / 2).toFixed(1)} ${rng.float(-3, 3).toFixed(1)} ${(-hgt).toFixed(1)} `
  }
  let flowers = ''
  for (let i = 0; i < 9; i++) {
    const x = rng.float(20, W - 20).toFixed(1)
    const c = rng.pick(['#b3301c', '#1f3a8a', '#f6efd9', '#c79a2e'])
    flowers += `<circle cx="${x}" cy="${rng.float(4, 8).toFixed(1)}" r="2.1" fill="${c}" stroke="#2b1b10" stroke-width=".5"/>`
  }
  return `<svg viewBox="0 0 ${W} 16" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="none">
<path d="M0 14.5 C 100 12.5 200 15.5 300 13.8 C 400 12.5 500 15.5 ${W} 14" stroke="#2b1b10" stroke-width="1.1"/>
<path d="${tufts}" stroke="#3d6b3f" stroke-width=".9" stroke-linecap="round"/>${flowers}</svg>`
}
