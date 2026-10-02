// THE GREAT TABLET: an omen series about the Pilgrim's own device.
//
// Each line is "If … : …", begun with the single upright wedge that writes šumma, "if". Lines of kind
// media / supports / container / reed / forced are fired by the stylesheet itself (--om-fire: 1 inside
// the very block that carries their "then"); this module only reads that back to count them, to tell a
// screen reader, and to announce a fate rewritten when the window changes. Lines of the sky and of the
// Pilgrim's conduct are judged here, with their true counts, and their "then" is done here.
import { h } from '../../lib/dom.js'
import { inscription, glyphText } from '../../lib/glyphs.js'
import { planetName } from '../../lib/scripture.js'
import { SERIES, GROUPS, ADDITIONS, INCIPIT, TUNINGS } from './lore.js'
import { count, times } from './life.js'

const CSS_KINDS = new Set(['media', 'supports', 'container', 'reed', 'forced'])
const AT = { media: '@media', reed: '@media', forced: '@media', supports: '@supports', container: '@container' }

export function buildSeries(O) {
  const { ctx, life, rng, say } = O
  const lines = new Map() // id -> line
  const order = []
  let sky = ctx.sky
  let restless = false
  let reading = null // the stylus' progress, while it reads the tablet for the first time

  // ── the tablet ──────────────────────────────────────────────────────────────────────────────
  const tally = h('b', { class: 'om-tally-n' }, '…')
  const tallyOf = h('span', { class: 'om-tally-of' }, '')
  const head = h('header', { class: 'om-great-head' },
    h('p', { class: 'om-great-kicker' }, 'Tablet I of the series'),
    h('h2', { id: 'om-great-h', class: 'om-great-title' },
      h('span', { class: 'om-great-akk', lang: 'akk' }, INCIPIT.akk),
      h('span', { class: 'om-great-en' }, `“${INCIPIT.en}”`)),
    glyphText('summa pilgrim ina viewport sakin', { tag: 'p', className: 'om-great-glyph' }),
    h('p', { class: 'om-tally' }, tally, tallyOf, ' omens hold for this Pilgrim.'),
  )
  head.querySelector('.om-great-glyph').setAttribute('aria-hidden', 'true')

  const stylus = h('span', { class: 'om-stylus', 'aria-hidden': 'true' })
  const cracks = h('div', { class: 'om-cracks', 'aria-hidden': 'true' })
  const thumbs = h('div', { class: 'om-thumbs', 'aria-hidden': 'true' })
  const ovenGlow = h('div', { class: 'om-oven', 'aria-hidden': 'true' })
  // The omen lines are laid out in a grid of their own; the temple's hidden rubrics are written elsewhere.
  const body = h('div', { class: 'om-series', 'data-secrets-skip': '' })
  const additions = h('section', { class: 'om-group om-group--added', 'aria-labelledby': 'om-g-added', hidden: true },
    h('h3', { id: 'om-g-added', class: 'om-group-h' }, h('span', { class: 'om-group-num' }, 'VII'), ' ',
      h('span', { lang: 'akk' }, 'šēlûtum'), h('span', { class: 'om-group-en' }, ' · what was added to the tablet in this sitting')),
    h('ol', { class: 'om-lines' }))

  // The typed word, kept in the clay (the omen of the writing hand).
  const typedGlyph = h('span', { class: 'om-typed-glyph glyph', lang: 'x-cascade', 'aria-hidden': 'true' })
  const typedLatin = h('span', { class: 'om-typed-latin' })
  const typedStrip = h('p', { class: 'om-typed', hidden: true },
    h('span', { class: 'om-typed-label' }, 'Pressed in by the Pilgrim’s hand: '), typedGlyph, ' ', typedLatin)

  const colophon = h('div', { class: 'om-colophon', hidden: true })
  const restore = h('button', { type: 'button', class: 'om-btn om-btn--quiet om-restore', hidden: true }, 'Restore the broken edges')
  const edge = inscription({ className: 'om-edge' })
  const foot = h('footer', { class: 'om-great-foot' }, typedStrip, colophon, restore,
    h('p', { class: 'om-edge-note' }, 'On the lower edge, as scribes wrote when the face was full:'), edge)

  const inner = h('div', { class: 'om-great-in' }, head, body, additions, foot, stylus, thumbs)
  const el = h('section', { class: 'om-great om-tablet', 'aria-labelledby': 'om-great-h' }, cracks, ovenGlow, inner)

  // ── the lines ───────────────────────────────────────────────────────────────────────────────
  let n = 0
  for (const g of GROUPS) {
    const ol = h('ol', { class: 'om-lines' })
    const sec = h('section', { class: `om-group om-group--${g.id}`, 'aria-labelledby': `om-g-${g.id}` },
      h('h3', { id: `om-g-${g.id}`, class: 'om-group-h' }, h('span', { class: 'om-group-num' }, g.num), ' ',
        h('span', { lang: 'akk' }, g.akk), h('span', { class: 'om-group-en' }, ` · ${g.en}`)),
      ol)
    for (const def of SERIES.filter((d) => d.group === g.id)) {
      const line = makeLine(def, def.kind === 'forced' ? 'add.' : String(++n))
      ol.append(line.li)
    }
    body.append(sec)
  }

  function makeLine(def, num) {
    const ifEl = h('span', { class: 'om-if' })
    const thenEl = h('span', { class: 'om-then' })
    const text = h('p', { class: 'om-text' }, ifEl, ': ', thenEl)
    const cond = h('code', { class: 'om-cond' })
    const sr = h('span', { class: 'visually-hidden om-sr' })
    const numEl = h('span', { class: 'om-num', 'aria-hidden': 'true' }, num)
    const li = h('li', { class: `om-omen om-omen--${def.kind}`, 'data-omen': def.id, 'data-kind': def.kind },
      numEl, h('span', { class: 'om-dis', 'aria-hidden': 'true' }), text, cond, sr)
    const line = { def, li, text, ifEl, thenEl, cond, sr, numEl, lit: null }
    if (def.if) { ifEl.textContent = def.if; thenEl.textContent = def.then }
    if (CSS_KINDS.has(def.kind)) cond.textContent = `${AT[def.kind]} ${def.query}`
    if (def.kind === 'reed') {
      // Until it holds, the line is broken off after "re…". The whole line is there, in the clay, for
      // whoever stands like a reed; it is shown by the stylesheet's own @media rule.
      const link = h('a', { href: '/css/faces/omens.css', target: '_blank', rel: 'noopener' }, '/css/faces/omens.css')
      thenEl.replaceChildren('let them read the liver in the Book, and not in the flesh. The Book of this tablet is its stylesheet, ', link, '.')
      text.classList.add('om-reed-whole')
      const broken = h('p', { class: 'om-text om-reed-broken' },
        'If the Pilgrim stands like a re',
        h('span', { class: 'om-break', 'aria-hidden': 'true' }, '[ed …] [… … … … … … … …]'),
        h('span', { class: 'visually-hidden' }, '… the rest of this line is broken away.'),
        h('span', { class: 'om-gloss om-gloss--always' }, 'The editor notes: this line is restored only for a Pilgrim who stands like a reed.'))
      text.before(broken)
      line.broken = broken
    }
    if (def.kind === 'forced') li.classList.add('om-forced')
    lines.set(def.id, line)
    order.push(line)
    return line
  }

  // ── what holds: the stylesheet's verdict, and the face's own ──────────────────────────────────
  const cssFire = (line) => parseFloat(getComputedStyle(line.li).getPropertyValue('--om-fire')) === 1
  const visible = (line) => line.li.isConnected && (line.li.checkVisibility ? line.li.checkVisibility() : line.li.offsetParent !== null)

  function judge(line) {
    const d = line.def
    if (CSS_KINDS.has(d.kind)) return cssFire(line)
    const j = conduct(d.id)
    setText(line.ifEl, j.if)
    setText(line.thenEl, j.then)
    setText(line.cond, j.cond)
    line.li.dataset.holds = String(Boolean(j.holds))
    return Boolean(j.holds)
  }
  function setText(el, t) { if (t != null && el.textContent !== t) el.textContent = t }

  // The omens of the sky and of conduct, judged now, with their true counts.
  function conduct(id) {
    const b = ctx.behavior ?? {}
    switch (id) {
      case 'restless': {
        const r = Number(b.restlessness) || 0
        return { holds: restless, if: 'If the Pilgrim’s hand is restless', then: 'the stylus will slip, and one wedge will be pressed crooked.', cond: `ctx.behavior.restlessness = ${r.toFixed(2)}` }
      }
      case 'thumbs': {
        const c = Number(b.clicks) || 0
        if (c < 3) return { holds: false, if: 'If the Pilgrim presses the clay three times', then: 'the clay will keep a thumbprint for every press.', cond: `ctx.behavior.clicks = ${c}` }
        return { holds: true, if: `If the Pilgrim has pressed the clay ${times(c)}`, then: c <= 12 ? `the clay will keep ${count(c)} thumbprints.` : 'the clay will keep twelve thumbprints, and has no room for the rest.', cond: `ctx.behavior.clicks = ${c}` }
      }
      case 'typed': {
        const word = lastWord(b.typed)
        const shown = String(b.typed ?? '').slice(-14)
        return { holds: Boolean(word), if: 'If the Pilgrim writes upon the page', then: 'the clay will keep the last word, pressed in by their own hand.', cond: `ctx.behavior.typed = "${shown}"` }
      }
      case 'away': {
        const a = Number(b.awayCount) || 0
        if (!a) return { holds: false, if: 'If the Pilgrim turns away from the table', then: 'the clay will dry at the corners.', cond: 'ctx.behavior.awayCount = 0' }
        return { holds: true, if: `If the Pilgrim has turned away from the table ${times(a)}`, then: 'the clay will dry at the corners.', cond: `ctx.behavior.awayCount = ${a}` }
      }
      case 'visits': {
        const v = Number(ctx.visit?.visits) || 1
        if (v < 2) return { holds: false, if: 'If the Pilgrim comes to the table a second time', then: 'one corner will be worn smooth by the hand.', cond: 'ctx.visit.visits = 1' }
        return { holds: true, if: `If the Pilgrim has come to the table ${times(v)}`, then: 'one corner will be worn smooth by the hand.', cond: `ctx.visit.visits = ${v}` }
      }
      case 'moon': {
        const m = sky.moon
        const pct = Math.round(m.illumination * 100)
        const lit = pct === 0 ? 'no part of it lit' : pct === 100 ? 'every part of it lit' : `${count(pct)} parts in a hundred lit`
        return { holds: true, if: `If the moon is ${m.name}, ${lit}`, then: pct < 3 ? 'the grey omens will stay grey, for there is no light to silver them.' : 'the grey omens will be silvered by its light.', cond: `ctx.sky.moon.illumination = ${m.illumination.toFixed(2)}` }
      }
      case 'hour': {
        const p = sky.planetaryHour.planet
        return { holds: true, if: `If the Pilgrim comes in the hour of ${planetName(p)}`, then: `the lyre will be tuned in ${TUNINGS[p]}.`, cond: `ctx.sky.planetaryHour.planet = "${p}"` }
      }
      case 'night':
        return { holds: sky.has('night'), if: 'If the Pilgrim comes in the watches of the night', then: 'the stars will come out over the table.', cond: `ctx.sky.hour = ${sky.hour}` }
      case 'gold':
        return { holds: sky.minute === 33, if: 'If the Pilgrim comes in the thirty-third minute', then: 'a door that is always open will be lit in gold, and so will the summit of the ziggurat.', cond: `ctx.sky.minute = ${sky.minute}` }
      default:
        return { holds: false, if: '', then: '', cond: '' }
    }
  }

  // Re-read every line. Lines that change after the first reading are rewritten where the Pilgrim can see.
  function refresh({ quiet = false } = {}) {
    let holding = 0
    let shown = 0
    const changed = []
    for (const line of order) {
      const lit = judge(line)
      const was = line.lit
      line.lit = lit
      line.li.classList.toggle('is-lit', lit)
      setText(line.sr, lit ? ' (this omen holds for you)' : ' (this omen does not hold for you)')
      if (line.def.kind === 'reed' || line.def.kind === 'forced' ? lit : visible(line)) {
        shown++
        if (lit) holding++
      }
      if (was !== null && was !== lit) changed.push(line)
    }
    tally.textContent = String(holding)
    tallyOf.textContent = ` of ${shown}`
    if (!quiet) for (const line of changed) rewrite(line)
    O.onJudged?.(lineState())
    return changed
  }

  function lineState() {
    const s = {}
    for (const [id, line] of lines) s[id] = line.lit
    return s
  }

  function rewrite(line) {
    const li = line.li
    if (!li.classList.contains('is-read')) return
    li.classList.remove('is-rewriting', 'is-kindled')
    void li.offsetWidth
    li.classList.add('is-rewriting')
    if (line.lit) li.classList.add('is-kindled')
    life.timeout(() => li.classList.remove('is-rewriting'), 1400)
    life.timeout(() => li.classList.remove('is-kindled'), 1800)
    const what = line.def.if ? line.def.if.replace(/^If /, '') : 'one line'
    if (CSS_KINDS.has(line.def.kind)) {
      say(`The tablet is rewritten: “${what}” ${line.lit ? 'now holds, and is fired' : 'no longer holds, and goes grey'}.`)
      O.onRewritten?.(line)
    }
  }

  // ── the first reading: a stylus passes down the tablet and the omens that hold catch fire ─────
  function readAll() {
    reading = null
    for (const line of order) line.li.classList.add('is-read')
    el.classList.add('is-read')
    stylus.classList.remove('is-moving')
  }
  // The reading keeps its own clock: a slow frame makes the stylus skip ahead, never fall behind.
  function startReading() {
    if (ctx.mercy?.on) return readAll()
    // What the Pilgrim can see is read first, top to bottom; then the rest of the tablet.
    const onScreen = (l) => { const r = l.li.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight }
    const shown = order.filter((l) => visible(l))
    const queue = [...shown.filter(onScreen).sort((a, b) => a.li.getBoundingClientRect().top - b.li.getBoundingClientRect().top), ...shown.filter((l) => !onScreen(l))]
    const due = []
    let t = 0
    for (const line of queue) { due.push(t); t += line.lit ? 200 : 115 }
    const t0 = performance.now() + 500
    let i = 0
    reading = queue
    stylus.classList.add('is-moving')
    const step = () => {
      if (life.dead || reading !== queue) return
      if (ctx.mercy?.on) return readAll()
      const now = performance.now() - t0
      let last = null
      while (i < queue.length && due[i] <= now) {
        const line = queue[i++]
        line.li.classList.add('is-read')
        if (line.lit) {
          line.li.classList.add('is-kindled')
          life.timeout(() => line.li.classList.remove('is-kindled'), 1800)
        }
        last = line
      }
      if (last) {
        // The tip of the reed rests on the line's wedge.
        const box = inner.getBoundingClientRect()
        const r = (last.li.querySelector('.om-dis') ?? last.li).getBoundingClientRect()
        stylus.style.translate = `${Math.round(r.left + r.width / 2 - box.left)}px ${Math.round(r.top + 2 - box.top - 6)}px`
      }
      if (i >= queue.length) return void life.timeout(readAll, 450)
      life.timeout(step, Math.max(16, due[i] - now))
    }
    life.timeout(step, 500)
  }

  // ── the omen of the hour, sometimes pressed into the wrong column ───────────────────────────
  const hourLine = lines.get('hour')
  let misplaced = false
  function misplace() {
    misplaced = true
    const li = hourLine.li
    li.classList.add('is-misplaced')
    const fix = h('button', { type: 'button', class: 'om-sic', 'aria-label': 'This line was pressed into the wrong column. Ask the scribe to put it back.' }, 'sic')
    li.append(fix)
    const put = (e) => {
      e?.preventDefault?.()
      if (!misplaced) return
      misplaced = false
      // First, last, invert, play: the line is moved for real, then slid from where it was.
      const before = hourLine.text.getBoundingClientRect()
      li.classList.remove('is-misplaced')
      li.classList.add('is-corrected')
      fix.remove()
      if (!ctx.mercy?.on) {
        const after = hourLine.text.getBoundingClientRect()
        const dx = before.left - after.left, dy = before.top - after.top
        hourLine.text.animate?.([{ transform: `translate(${dx}px, ${dy}px) rotate(-1.4deg)` }, { transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.2,.7,.2,1)' })
      }
      li.append(h('span', { class: 'om-corrected' }, 'corrected by the scribe'))
      ctx.memory?.markSecret?.('omens-correction', { face: 'omens' })
      say('The scribe has pressed the line back into its own column.')
    }
    life.on(fix, 'click', put)
    life.on(hourLine.text, 'click', put)
  }
  if (rng.chance(0.5)) misplace()

  // ── the face's own consequences of conduct and sky ───────────────────────────────────────────
  const slip = order.filter((l) => l.def.kind === 'media')[rng.int(0, 6)]
  slip?.li.setAttribute('data-slip', '')
  const thumbSpots = Array.from({ length: 12 }, () => ({ x: rng.float(4, 96), y: rng.pick([rng.float(0.5, 2.5), rng.float(97, 99.5)]), r: rng.int(-40, 40), s: rng.float(0.85, 1.15) }))
  let thumbsShown = 0
  function conductEffects() {
    const b = ctx.behavior ?? {}
    const c = Number(b.clicks) || 0
    const want = c >= 3 ? Math.min(12, c) : 0
    while (thumbsShown < want) {
      const t = thumbSpots[thumbsShown++]
      thumbs.append(h('i', { class: 'om-thumb', style: `--x:${t.x.toFixed(1)}%;--y:${t.y.toFixed(1)}%;--r:${t.r}deg;--s:${t.s.toFixed(2)}` }))
    }
    el.style.setProperty('--om-dry', String(Math.min(1, (Number(b.awayCount) || 0) / 4)))
    el.toggleAttribute('data-worn', (Number(ctx.visit?.visits) || 1) >= 2)
    el.toggleAttribute('data-restless', restless)
    const word = lastWord(b.typed)
    typedStrip.hidden = !word
    if (word && typedLatin.textContent !== word) {
      typedGlyph.textContent = word
      typedLatin.textContent = `(${word})`
    }
  }
  function skyEffects() {
    el.style.setProperty('--om-moonlight', sky.moon.illumination.toFixed(2))
    O.root.toggleAttribute('data-night', sky.has('night'))
    O.root.toggleAttribute('data-gold', sky.minute === 33)
  }

  // ── stillness: the clay dries, a colophon is pressed, and the tablet is fired ────────────────
  function dry(on) { el.classList.toggle('is-drying', on) }

  function pressColophon() {
    if (!colophon.hidden) return
    const p = planetName(sky.planetaryHour.planet)
    const souls = Number(ctx.ritual?.state?.online) || 0
    const witnesses = souls > 1 ? `, ${count(souls)} souls of the Cascade witnessing` : ''
    const en = `Colophon. Tablet I of the series “${INCIPIT.en}”. Written according to its original, and collated. Read by one Pilgrim who held still for thirty-three breaths, in the hour of ${p}${witnesses}.`
    const g = glyphText('tablet of the series if the pilgrim is set in a viewport written and collated', { tag: 'p', className: 'om-colophon-glyph' })
    g.setAttribute('aria-hidden', 'true')
    colophon.replaceChildren(g, h('p', { class: 'om-colophon-en' }, en))
    colophon.hidden = false
    colophon.classList.add('is-pressing')
  }

  function fire() {
    if (el.classList.contains('is-fired')) return false
    el.classList.add('is-fired')
    add('fired')
    return true
  }

  // A line added to the tablet during the sitting, fired gold.
  let added = 0
  const addedLines = {}
  function add(kind) {
    if (addedLines[kind]) return addedLines[kind]
    const a = ADDITIONS[kind]
    if (!a) return null
    additions.hidden = false
    const li = h('li', { class: 'om-omen om-omen--added is-read is-lit', 'data-omen': `added-${kind}` },
      h('span', { class: 'om-num', 'aria-hidden': 'true' }, String(n + ++added)),
      h('span', { class: 'om-dis', 'aria-hidden': 'true' }),
      h('p', { class: 'om-text' }, h('span', { class: 'om-if' }, a.if), ': ', h('span', { class: 'om-then' }, a.then)))
    additions.querySelector('ol').append(li)
    if (!ctx.mercy?.on) li.classList.add('is-kindled')
    addedLines[kind] = li
    return li
  }
  function remove(kind) {
    const li = addedLines[kind]
    if (!li) return
    li.remove()
    delete addedLines[kind]
    added--
    if (!additions.querySelector('li')) additions.hidden = true
  }

  // ── wiring ──────────────────────────────────────────────────────────────────────────────────
  for (const line of order) {
    if (line.def.kind === 'media' || line.def.kind === 'reed' || line.def.kind === 'forced') {
      life.media(line.def.query, () => refresh())
    }
  }
  // The container omen answers to the tablet's own width.
  if (typeof ResizeObserver === 'function') {
    let w = 0
    life.observe(new ResizeObserver((entries) => {
      const nw = Math.round(entries[0]?.contentRect?.width ?? 0)
      if (Math.abs(nw - w) < 2) return
      w = nw
      refresh()
    })).observe(inner)
  }
  life.bus(ctx.bus, 'behavior:restless', () => { restless = true; conductEffects(); refresh() })
  life.bus(ctx.bus, 'behavior:calm', () => { restless = false; conductEffects(); refresh() })
  life.bus(ctx.bus, 'behavior:click', () => { conductEffects(); refresh() })
  life.bus(ctx.bus, 'behavior:return', () => { conductEffects(); refresh() })
  life.bus(ctx.bus, 'behavior:typed', () => { conductEffects(); refresh() })
  // The sky moves on while the Pilgrim reads (and the restless hand's measure is written down).
  life.interval(() => {
    const now = ctx.readSky?.()
    if (now) sky = now
    skyEffects()
    refresh()
  }, 20000)
  life.interval(() => setText(lines.get('restless').cond, conduct('restless').cond), 2500)

  const eclipse = () => {
    const on = document.documentElement.hasAttribute('data-eclipse')
    if (on) add('eclipse')
    else remove('eclipse')
  }
  life.observe(new MutationObserver(eclipse)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-eclipse'] })

  return {
    el,
    inner,
    cracks,
    restore,
    lines,
    texts: () => [...el.querySelectorAll('.om-text:not(.om-reed-broken)'), ...el.querySelectorAll('.om-colophon-en')],
    hourLine,
    start() {
      skyEffects()
      conductEffects()
      refresh({ quiet: true })
      eclipse()
      startReading()
    },
    refresh,
    readAll,
    dry,
    pressColophon,
    fire,
    add,
    get misplaced() { return misplaced },
  }
}

function lastWord(typed) {
  const words = String(typed ?? '').toLowerCase().replace(/[^a-z\s]/g, ' ').trim().split(/\s+/)
  const w = words[words.length - 1] ?? ''
  return w.slice(-16)
}
