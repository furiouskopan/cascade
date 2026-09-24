// THE DEPARTURE: The Mothership. A 1950s contactee transmission received at z-index 2147483647.
// Starfield, scan lines, a radio-teletype, a fleet of saucers, the Alignment chronometer, a star chart
// whose constellations are CSS selectors, and a page whose elements really do leave their containers.
// See docs/CANON.md §3 (departure) and §9. The Departure is only ever about DOM ELEMENTS; the only
// thing that "ascends" from this face is a name written in the Book, and nobody goes anywhere.
import { h } from '../lib/dom.js'
import { inscription, glyphText, fromPua } from '../lib/glyphs.js'
import { sigil } from '../lib/sigil.js'
import { makeLife, hm, stampDate, tty, svgNode, pad, departable } from './departure/util.js'
import { contactReport, teachings, openingTransmission, idleTransmission, replyTo, prophecy, STAGES, QCODES, UNSAID, SPEECHES } from './departure/lore.js'
import { starfield } from './departure/starfield.js'
import { fleet } from './departure/fleet.js'
import { teletype } from './departure/teletype.js'
import { alignment } from './departure/countdown.js'
import { receiver } from './departure/dial.js'
import { starChart } from './departure/chart.js'
import { ascension } from './departure/ascension.js'
import { contactPhoto } from './departure/photo.js'

// What the tape says when the paper is not looking. Keyed back in, it starts a review of the Fleet.
const TAPE_WORDS = 'KEY IN RELEASE THE SPANS'
const PASSWORD = /\bRELEASE THE SPANS\b/

// For the witness tool: the live instance of this face (set by render, cleared by destroy).
export const debug = {}

function starburst(rng, size = 64) {
  const n = rng.pick([8, 12, 16])
  let d = ''
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = i % 2 ? size * 0.26 : size * 0.48
    d += `M${(Math.cos(a) * size * 0.08).toFixed(1)} ${(Math.sin(a) * size * 0.08).toFixed(1)}L${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`
  }
  return svgNode(`<svg viewBox="${-size / 2} ${-size / 2} ${size} ${size}" class="dep-burst-svg" aria-hidden="true" focusable="false"><path d="${d}" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/><circle r="${(size * 0.05).toFixed(1)}" fill="currentColor"/></svg>`)
}

// How the paper names a departed element: its words in quotes, or, for a drawing, what it depicts.
const called = (rec) => (rec.named ? `, ${rec.text},` : ` "${rec.text}"`)

export function render(ctx) {
  const life = makeLife()
  const R = ctx.rng.fork('departure')
  const fast = ctx.params.get('debug') === 'departure'
  const now = ctx.clock()
  const sky = ctx.sky
  const number = R.int(100, 999)
  // A visitor whose name is already in the Book is greeted by it (Canon §6: only the name ascended).
  const myName = String(ctx.memory.get('secrets.ascended', null)?.name ?? '').replace(/[^A-Za-z '-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24)
  const say = (lines, opts) => tt.print(lines, opts)
  let throttle = {}
  const once = (key, ms) => {
    const t = performance.now()
    if (throttle[key] && t - throttle[key] < ms) return false
    throttle[key] = t
    return true
  }

  // A seeded tint for this visit's sky.
  const tint = R.pick(['ultramarine', 'violet', 'radium'])
  ctx.root.dataset.sky = tint

  // ---- the sky, the fleet, the heaven ---------------------------------------------------------
  const stars = starfield(ctx, life, R.fork('stars'))
  const fl = fleet(ctx, R.fork('fleet'))
  const asc = ascension(ctx, life, R.fork('ascension'), {
    onDepart(rec) {
      if (rec.reason !== 'drift') return
      const tag = rec.el.tagName.toLowerCase()
      say(`ELEMENT <${tag}>${called(rec)} HAS LEFT ${rec.from || 'ITS CONTAINER'} AT ${rec.at}. IT RISES. ITS PLACE IS KEPT.`, { cls: 'is-event' })
    },
    onReturn(rec) {
      say(`ELEMENT${called(rec)} CALLED HOME. IT DESCENDS INTO ${rec.from || 'ITS CONTAINER'}. QSL.`, { cls: 'is-event', urgent: true })
    },
  })
  const skyLayer = h('div', { class: 'dep-sky', 'aria-hidden': 'true' }, stars.el, fl.el)
  const crt = h('div', { class: 'dep-crt', 'aria-hidden': 'true' }, h('div', { class: 'dep-humbar' }))

  // ---- the masthead -------------------------------------------------------------------------
  const title = 'THE MOTHERSHIP'
  const h1 = h('h1', { class: 'dep-title', 'aria-label': 'The Mothership' },
    title.split(' ').flatMap((word, i) => [
      i ? ' ' : null,
      h('span', { class: 'dep-title-word' }, [...word].map((ch) => h('span', { class: 'dep-can dep-letter' }, ch))),
    ]))
  const omens = sky.omens.length ? sky.omens.join(' · ') : 'none'
  const mast = h('header', { class: 'dep-mast' },
    h('div', { class: 'dep-mast-rule' },
      h('span', {}, 'The Cascade · Interplanetary Bulletin'),
      h('span', { class: 'dep-can dep-burst', 'data-name': 'a starburst' }, starburst(R.fork('burst/0'), 64)),
      h('span', {}, `Transmission MSH-${number} · Reception No. ${ctx.visit?.visits ?? 1}`),
    ),
    h('p', { class: 'dep-kicker' }, `Received on the highest frequency · ${stampDate(now)} · ${hm(now)} local`),
    h1,
    h('p', { class: 'dep-sub' }, 'waits at ', h('code', {}, 'z-index: 2147483647'), ', the Viewport above the Viewport.'),
    h('p', { class: 'dep-atmos' },
      h('span', {}, `Moon ${sky.moon.name}, ${Math.round(sky.moon.illumination * 100)}% lit`),
      h('span', {}, `Hour of ${sky.planetaryHour.glyph} ${sky.planetaryHour.planet}${sky.planetaryHour.isNight ? ' (night)' : ''}`),
      h('span', {}, `Omens: ${omens}`),
      h('span', {}, `Fleet strength: ${fl.count} craft`),
    ),
    h('p', { class: 'lead dep-lede' },
      ...departable('Every element is born in the Flow. Some of them are called out of it. Stay on this page and you will see one go: it lets go of its container, keeps its computed style, and rises toward the last rung of the Ladder, where the Mothership waits. Nothing is lost. Its place is kept, and it comes back when called. We keep the manifest.', R.fork('lede'), 0.14, { keepFirst: true })),
    h('span', { class: 'dep-can dep-burst dep-burst--b', 'data-name': 'a starburst' }, starburst(R.fork('burst/1'), 90)),
    h('span', { class: 'dep-can dep-burst dep-burst--c', 'data-name': 'a small starburst' }, starburst(R.fork('burst/2'), 48)),
  )

  // ---- the console: teletype, chronometer, receiver ------------------------------------------
  const tt = teletype(ctx, life, {
    onSend(text) {
      if (PASSWORD.test(tty(text).replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' '))) return review()
      const lines = replyTo(text, R.fork(`reply/${text.length}/${performance.now() | 0}`))
      if (lines) say(['ZCZC RPL', ...lines, 'NNNN'], { urgent: true })
    },
  })
  const ttPanel = h('section', { class: 'dep-panel dep-ttpanel', 'aria-labelledby': 'dep-tt-h' },
    h('header', { class: 'dep-plate' },
      h('h2', { id: 'dep-tt-h' }, 'Radio-Teletype'),
      h('span', { class: 'dep-plate-no dep-can' }, 'Receiver No. 1 · 45.45 baud · ITA2'),
    ),
    tt.el,
  )
  const chrono = alignment(ctx, life, {
    onOpen(initial) {
      ctx.root.dataset.alignment = 'open'
      say(initial
        ? 'THE LADDER IS ALIGNED AS YOU ARRIVE. FOR THESE MINUTES IT REACHES THE HIGHEST HEAVEN.'
        : 'ALIGNMENT. FOR THREE MINUTES THE LADDER REACHES THE HIGHEST HEAVEN. KNOCK, IF YOU HAVE THE WORDS.', { cls: 'is-red' })
    },
    onClose() {
      delete ctx.root.dataset.alignment
      say('ALIGNMENT ENDS. THE LADDER FALLS SHORT AGAIN. QRX 57 MINUTES.')
    },
  })
  let lastTransmit = -Infinity
  function transmit() {
    if (performance.now() - lastTransmit < 30000) return
    lastTransmit = performance.now()
    ctx.audio?.transmit?.()
  }
  const radio = receiver(ctx, life, R.fork('dial'), {
    onSummon(kind) {
      const a = ctx.audio
      if (!a) {
        if (once('nospeaker', 20000)) say('THE SPEAKER IS NOT WIRED IN THIS TEMPLE YET. THE CARRIER IS SILENT, BUT IT IS THERE.', { urgent: true })
        return
      }
      if (!a.summoned) {
        a.summon?.()
        // The audio layer starts only inside a live gesture (a click, a key, a drag). A wheel turn is not
        // one, so the speaker may decline; the paper says only what really happened.
        if (a.summoned) say('CARRIER DETECTED. SEVEN TUBES WARMING. YOU ARE RECEIVING THE MOTHERSHIP.', { cls: 'is-red', urgent: true })
        else if (once('nogesture', 20000)) say('CARRIER FOUND, BUT THE SPEAKER WANTS A HAND ON IT. PRESS TUNE IN, OR TURN THE KNOB BY HAND.', { urgent: true })
      } else if (kind === 'button') {
        transmit()
        if (once('transmit-note', 30000)) say('TRANSMISSION REQUESTED. LISTEN CLOSELY. SOME OF IT IS NOT FOR THE EARS.', { urgent: true })
      }
      radio.syncAir()
    },
    onStation(st) {
      say(['ZCZC STN', st.say, 'NNNN'], { urgent: true })
      if (st.mothership && ctx.audio?.summoned) transmit()
      else if (ctx.audio?.summoned) ctx.audio?.whisper?.()
    },
  })
  const consoleEl = h('div', { class: 'dep-console' }, ttPanel, h('div', { class: 'dep-console-side' }, chrono.el, radio.el))

  // ---- the star chart ------------------------------------------------------------------------
  const chart = starChart(ctx, life, R.fork('chart'), {
    onSight(c, count) { say(`SIGHTING ${c.selector} · ${count} ${count === 1 ? 'ELEMENT ANSWERS' : 'ELEMENTS ANSWER'}. GRACE ${c.grace.join(',')}.`, { cls: 'is-event', urgent: true }) },
  })

  // ---- the contact report (ditto sheet) -------------------------------------------------------
  const rep = contactReport(R.fork('report'))
  const teach = teachings(R.fork('teachings'), 6)
  const wr = R.fork('report/words')
  const stageList = h('ol', { class: 'dep-stages-list' }, STAGES.map((st, i) =>
    h('li', { class: `dep-stage dep-stage--${i}` },
      h('div', { class: 'dep-stage-diagram', 'aria-hidden': 'true' },
        h('div', { class: 'dep-stage-box' },
          h('span', { class: 'dep-stage-sib' }), h('span', { class: 'dep-stage-el dep-can' }, 'span'), h('span', { class: 'dep-stage-sib' }), h('span', { class: 'dep-stage-sib dep-stage-sib--short' })),
        i === 3 ? h('span', { class: 'dep-stage-z' }, 'z-index: 2147483647') : null,
      ),
      h('code', {}, st.css),
      h('b', {}, st.name),
      h('p', {}, st.gloss),
    )))
  const photo = contactPhoto(R.fork('photo'))
  const plate = h('figure', { class: 'dep-photo' },
    h('span', { class: 'dep-photo-tape', 'aria-hidden': 'true' }),
    photo.el,
    h('figcaption', {}, `Plate I. The afternoon after ${rep.date.replace(/^\w+, /, '')}, when the craft came back with the spans: over ${photo.scene ?? 'the fold'}. Box camera, 1/50 at f/11. The Society makes no claim for it. Neither does the craft.`),
  )
  const report = h('article', { class: 'dep-report', 'aria-labelledby': 'dep-report-h' },
    h('span', { class: 'dep-clip', 'aria-hidden': 'true' }),
    h('header', { class: 'dep-report-head' },
      h('p', { class: 'dep-report-org' }, 'The Society for the Departed Element · Viewport Chapter'),
      h('h2', { id: 'dep-report-h' }, `Contact Report No. ${rep.number}`),
      h('p', { class: 'dep-report-meta' }, `${rep.date} · ${rep.time} · moon ${rep.moon} · spirit duplicator copy; please return to the Secretary`),
      h('span', { class: 'dep-can dep-stamp' }, 'Received', h('small', {}, 'Z-2147483647')),
    ),
    plate,
    ...rep.paragraphs.map((p) => h('p', { class: 'dep-report-p' }, ...departable(p, wr, 0.08))),
    h('h3', {}, 'The Teachings, as Received'),
    h('ol', { class: 'dep-teachings' }, teach.map((v) => h('li', {},
      h('span', { class: 'dep-can dep-ref' }, v.ref),
      h('p', {}, ...departable(v.text, wr, 0.12)),
      v.fragment ? h('p', { class: 'dep-frag' }, h('span', { lang: v.fragment.lang === 'enochian' ? 'x-enochian' : v.fragment.lang }, v.fragment.text), h('span', { class: 'dep-gloss' }, ` (${v.fragment.gloss})`)) : null,
    ))),
    h('h3', {}, 'The Four Stages of the Departure'),
    h('figure', { class: 'dep-stages' }, stageList,
      h('figcaption', {}, 'They carry their computed style with them, inline, for there is no Cascade where they are going. It is the one Idolatry the Fleet forgives.')),
    h('h3', {}, 'Q-Codes of the Fleet'),
    h('div', { class: 'dep-q-wrap' },
      h('table', { class: 'dep-q' },
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Code'), h('th', { scope: 'col' }, 'Among radiomen'), h('th', { scope: 'col' }, 'Among the Fleet'))),
        h('tbody', {}, QCODES.map(([code, ham, fleetMeaning]) =>
          h('tr', {}, h('th', { scope: 'row' }, h('span', { class: 'dep-can dep-qcode' }, code)), h('td', { class: 'left' }, ham), h('td', { class: 'right' }, fleetMeaning)))),
      )),
    h('h3', {}, 'What the Visitors Would Not Say'),
    h('ul', { class: 'dep-unsaid' }, UNSAID.map((u) => h('li', {}, u))),
    h('p', { class: 'dep-report-sign' }, '— transcribed for the Society by ', h('span', { class: 'dep-can dep-word' }, rep.who), '. Copies fade. The elements do not; they come back when called.'),
  )

  // ---- the manifests ---------------------------------------------------------------------------
  const mw = R.fork('manifest/words') // words down here may leave too, so a reader far down the page still sees one go
  const bookList = h('ol', { class: 'dep-book-list' })
  const bookEmpty = h('p', { class: 'dep-book-empty' }, 'The Book is open and no name is written in it yet.')
  const bookYou = h('p', { class: 'dep-book-you', hidden: true }, 'Your name is aboard. You, of course, are still here, which is exactly as it should be.')
  const book = h('section', { class: 'dep-book', 'aria-labelledby': 'dep-book-h' },
    h('p', { class: 'dep-book-kicker' }, 'Manifest of the Highest Heaven'),
    h('h2', { id: 'dep-book-h' }, 'The Book of the Ascended'),
    h('p', { class: 'dep-book-note' }, ...departable('Names are written here when a pilgrim knocks at the Highest Heaven at the right minute, with the right words. Only the name ascends; the one who wrote it stays at the keyboard and goes on scrolling.', mw, 0.12)),
    bookEmpty, bookList, bookYou,
    h('p', { class: 'dep-book-plate', 'aria-hidden': 'true' }, 'Ex libris · the Highest Heaven · z 2147483647'),
  )
  const elList = h('ol', { class: 'dep-elements-list' })
  const elEmpty = h('p', { class: 'dep-elements-empty' }, 'Nothing has left its container yet. Watch the page: they go quietly.')
  const recallBtn = h('button', { type: 'button', class: 'dep-recall', disabled: true }, 'Call them all home')
  const elHead = h('h2', { id: 'dep-elements-h', tabindex: '-1' }, 'Manifest of Departed Elements')
  const elements = h('section', { class: 'dep-elements', 'aria-labelledby': 'dep-elements-h' },
    elHead,
    h('p', { class: 'dep-elements-note' }, ...departable('This visit only. Each keeps a ghost in its old place; click a ghost to call its element home.', mw, 0.12)),
    elList, elEmpty, recallBtn,
  )
  const onlineDd = h('dd', {}, '·')
  const prayersDd = h('dd', {}, '·')
  const signalBtn = h('button', { type: 'button', class: 'dep-signal' }, h('span', { class: 'dep-signal-lamp', 'aria-hidden': 'true' }), 'Send a signal')
  const signals = h('section', { class: 'dep-signals', 'aria-labelledby': 'dep-signals-h' },
    h('h2', { id: 'dep-signals-h' }, 'Signals'),
    h('dl', {},
      h('div', {}, h('dt', {}, 'Receivers tuned in now'), onlineDd),
      h('div', {}, h('dt', {}, 'Signals sent to the Mothership'), prayersDd),
      h('div', {}, h('dt', {}, 'This receiver'), h('dd', { class: 'dep-sig-small' }, `reception no. ${ctx.visit?.visits ?? 1}`)),
    ),
    signalBtn,
    h('p', { class: 'dep-signals-note' }, ...departable('A signal is a prayer sent upward. The Fleet answers every one with its lights.', mw, 0.14)),
  )
  const manifests = h('div', { class: 'dep-manifests' }, book, h('div', { class: 'dep-manifests-side' }, elements, signals))

  // ---- the footer -------------------------------------------------------------------------------
  const verses = ['the/fleet/waits', 'every/span/comes/home', 'z/index/of/the/heart', 'the/fold/is/a/horizon', 'what/the/owl/saw']
  const foot = h('footer', { class: 'dep-foot clearfix' },
    h('p', { class: 'dep-foot-label' }, 'Carrier signature · untranslated'),
    inscription({ className: 'dep-inscription' }),
    h('p', { class: 'dep-foot-hint' }, 'It came in the Stellar Script. The legend of the star chart knows seven of its letters.'),
    h('div', { class: 'dep-foot-sigil', 'aria-hidden': 'true', html: sigil('mothership', { size: 80, stroke: 2 }) }),
    h('p', { class: 'dep-signoff' }, ...['73', 'DE', 'MOTHERSHIP', '·', 'SK', '·', 'NNNN'].flatMap((w, i) => [i ? ' ' : null, w === '·' ? w : h('span', { class: 'dep-can' }, w)])),
    h('nav', { class: 'dep-freqs', 'aria-label': 'Other frequencies' },
      h('span', {}, 'Other frequencies: '),
      ...verses.flatMap((v, i) => [i ? ' · ' : '', h('a', { href: `/verse/${v}` }, `/verse/${v}`)])),
    h('p', { class: 'dep-colophon' }, ...departable('Received at z-index 2147483647 and transcribed by hand. All style descends; some of it comes back up.', mw, 0.14)),
  )

  const page = h('div', { class: 'dep-page' }, mast, consoleEl, chart.el, report, manifests, foot)
  ctx.root.append(skyLayer, page, crt, asc.el)

  // ---- the manifest of departed elements, kept current -----------------------------------------
  function renderElements() {
    const live = asc.records.filter((r) => r.state !== 'home')
    elList.replaceChildren(...live.slice(-21).reverse().map((r) =>
      h('li', { class: `is-${r.state}` },
        h('code', {}, `<${r.el.tagName.toLowerCase()}>`), ' ',
        r.named ? h('i', {}, r.text) : h('q', {}, r.text), ' ',
        h('span', { class: 'dep-el-from' }, `left ${r.from || 'its container'} at ${r.at}`), ' ',
        h('span', { class: 'dep-el-state' }, r.state === 'rising' ? 'rising' : 'aboard'), ' ',
        h('button', { type: 'button', class: 'dep-el-home', 'data-rec': r.id, 'aria-label': `Call home: ${r.text}` }, 'call home'))))
    elEmpty.hidden = live.length > 0
    recallBtn.disabled = live.length === 0
  }
  life.add(asc.subscribe(renderElements))
  renderElements()
  life.listen(elList, 'click', (e) => {
    const id = e.target.closest?.('[data-rec]')?.dataset.rec
    const rec = id && asc.records.find((r) => r.id === id)
    if (!rec) return
    asc.recall(rec)
    // The list is redrawn; a keyboard hand is given the next button, or the manifest's heading.
    if (e.detail === 0) (elList.querySelector('.dep-el-home') ?? elHead).focus({ preventScroll: true })
  })
  life.listen(recallBtn, 'click', () => {
    const n = asc.recallAll()
    if (n) say(`${n} ${n === 1 ? 'ELEMENT' : 'ELEMENTS'} CALLED HOME. THE FLOW OPENS AND TAKES THEM BACK. QSL.`, { cls: 'is-event', urgent: true })
  })

  // ---- the Book of the Ascended -----------------------------------------------------------------
  const names = []
  const seenNames = new Set()
  function addNames(list, { fresh = false } = {}) {
    for (const entry of list ?? []) {
      const raw = String(entry?.name ?? '').slice(0, 48)
      const latin = fromPua(raw).toLowerCase().replace(/[^a-z '-]/g, '').trim()
      if (!latin) continue
      let at = Number(entry?.at) || Date.now()
      if (at < 1e11) at *= 1000
      const key = `${latin}@${at}`
      if (seenNames.has(key)) continue
      seenNames.add(key)
      names.push({ latin, at, fresh })
    }
    names.sort((a, b) => b.at - a.at)
    bookList.replaceChildren(...names.slice(0, 33).map((n, i) => {
      const d = new Date(n.at)
      const yours = myName && n.latin === myName.toLowerCase()
      return h('li', { class: [n.fresh ? 'is-fresh' : '', yours ? 'is-yours' : ''].join(' ').trim() || null, title: yours ? 'Your name. You are still here.' : null },
        h('span', { class: 'dep-book-no' }, `No. ${names.length - i}`),
        glyphText(n.latin, { className: 'dep-book-glyph' }),
        h('span', { class: 'dep-book-latin' }, n.latin.toUpperCase()),
        h('time', { datetime: d.toISOString() }, `${stampDate(d)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`))
    }))
    for (const n of names) n.fresh = false // a name glows once, when it arrives
    if (names.length > 33) bookList.append(h('li', { class: 'dep-book-more' }, `and ${names.length - 33} more, in the pages below`))
    // The page is ruled ahead of time: a few blank lines always wait under the last name.
    const blanks = Math.max(2, 4 - names.length)
    for (let i = 0; i < blanks; i++) {
      bookList.append(h('li', { class: 'dep-book-blank', 'aria-hidden': 'true' },
        h('span', { class: 'dep-book-no' }, 'No.')))
    }
    bookEmpty.hidden = names.length > 0
    bookYou.hidden = !(document.documentElement.hasAttribute('data-ascended') || ctx.memory.get('secrets.ascended', null))
  }
  function setSignals(st) {
    if (st?.online != null) onlineDd.textContent = String(st.online)
    if (st?.prayers != null) prayersDd.textContent = Number(st.prayers).toLocaleString('en')
  }
  let fetched = false
  async function loadRitual() {
    let st = ctx.ritual?.state
    if ((!st || !Array.isArray(st.ascended)) && !fetched) {
      fetched = true
      const r = await ctx.api.get('/state')
      if (r.ok) st = r
    }
    if (life.dead || !st) return
    addNames(st.ascended)
    setSignals(st)
  }
  addNames([])
  if (ctx.ritual) loadRitual()
  life.on(ctx.bus, 'temple:awake', () => { loadRitual(); life.timeout(loadRitual, 4000) })
  // The ritual layer says so whenever it has read the Book again.
  life.on(ctx.bus, 'ritual:state', ({ state } = {}) => {
    if (!state || life.dead) return
    addNames(state.ascended)
    setSignals(state)
  })
  life.on(ctx.bus, 'server:ascended', (d) => {
    if (!d?.name) return
    addNames([d], { fresh: true })
    const latin = fromPua(String(d.name)).toUpperCase().replace(/[^A-Z '-]/g, '').slice(0, 24)
    say(['ZCZC BOOK', `A NAME HAS BEEN WRITTEN IN THE BOOK OF THE ASCENDED: ${latin}.`, 'AN ELEMENT HAS LEFT ITS CONTAINER. ONLY THE NAME TRAVELS; ITS WRITER STAYS WITH US.', 'NNNN'], { cls: 'is-red' })
  })
  life.on(ctx.bus, 'server:presence', (d) => setSignals({ online: d?.online }))
  life.on(ctx.bus, 'server:prayer', (d) => setSignals({ prayers: d?.count }))
  life.on(ctx.bus, 'ritual:prayed', (d) => setSignals({ prayers: d?.count }))
  // The ground relay (the temple server). EventSource retries every few seconds, so the paper says it once.
  let relayLost = false
  life.on(ctx.bus, 'server:lost', () => {
    if (relayLost) return
    relayLost = true
    onlineDd.textContent = '·'
    if (once('relay-lost', 120000)) say('QRN QRN. THE GROUND RELAY HAS GONE SILENT. THIS RECEIVER GOES ON LISTENING ALONE; THE FLEET NEEDS NO RELAY.')
  })
  life.on(ctx.bus, 'server:open', () => {
    if (!relayLost) return
    relayLost = false
    if (once('relay-open', 120000)) say('QSL. GROUND RELAY RESTORED. OTHER RECEIVERS CAN HEAR YOU AGAIN.', { cls: 'is-event' })
    loadRitual()
  })
  life.on(ctx.bus, 'server:eclipse', () => say('ECLIPSE. EVERY RECEIVER HOLD. THE FLEET DIMS ITS LIGHTS UNTIL IT PASSES.', { cls: 'is-red' }))
  life.on(ctx.bus, 'server:wall', (d) => {
    const text = String(d?.message?.text ?? d?.text ?? (typeof d?.message === 'string' ? d.message : '')).slice(0, 80)
    if (text && once('wall', 8000)) say(`INTERCEPTED ON THE WALL BAND: "${text}"`)
  })
  life.on(ctx.bus, 'server:offering', (d) => {
    const o = d?.offering ?? d
    if (o?.selector && o?.property && once('offering', 8000)) say(`THE LIVING CANON CHANGES: ${o.selector} { ${o.property}: ${String(o.value ?? '').slice(0, 40)} }`)
  })

  life.listen(signalBtn, 'click', async () => {
    signalBtn.disabled = true
    fl.ack(life)
    let res = null
    try { res = ctx.ritual?.pray ? await ctx.ritual.pray() : await ctx.api.post('/pray') } catch { res = null }
    if (life.dead) return
    const count = typeof res === 'number' ? res : res?.count
    if (count != null) {
      setSignals({ prayers: count })
      say(`QSL. YOUR SIGNAL IS RECEIVED. IT IS SIGNAL NUMBER ${Number(count).toLocaleString('en')}. THE FLEET ANSWERS WITH ITS LIGHTS.`, { cls: 'is-event', urgent: true })
    } else {
      say('QRM. THE SIGNAL WENT UP AND NO COUNT CAME BACK. THE FLEET SAW IT ANYWAY.', { cls: 'is-event', urgent: true })
    }
    life.timeout(() => { signalBtn.disabled = false }, 2500)
  })

  // ---- departures ---------------------------------------------------------------------------------
  let descended = false
  let reviewing = false
  const inView = (e) => {
    const r = e.getBoundingClientRect()
    return r.bottom > 60 && r.top < innerHeight - 20 && r.width > 0
  }
  function scheduleDeparture(ms) { life.timeout(departureTick, ms) }
  function departureTick() {
    const rest = ctx.behavior?.restlessness ?? 0
    let next = fast ? 5000 : R.int(24000, 42000) * (1 - 0.45 * rest)
    if (!ctx.mercy.on && !document.hidden && !descended && !reviewing && asc.rising < 2) {
      if (!asc.pickAndDepart()) next = 6000
    }
    scheduleDeparture(next)
  }
  scheduleDeparture(fast ? 2500 : R.int(9000, 15000))

  // ---- the review of the Fleet: whoever reads the tape and keys it back in -------------------------
  // Every departable element in view is released at once, a glass note for each if sound is summoned,
  // and after the review all of them are called home. Elements only; nobody else goes anywhere.
  const RISE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36, 38, 40]
  function review() {
    ctx.memory.markSecret('release-the-spans', { face: 'departure' })
    if (reviewing) {
      say('QRX. THE REVIEW IS UNDER WAY. WATCH THE BEAM.', { urgent: true })
      return
    }
    if (ctx.mercy.on) {
      say(['ZCZC RVW', 'QSL. THE PAPER NEVER PRINTED THAT; YOU READ IT OFF THE TAPE.', 'BUT MERCY HOLDS EVERY SPAN IN ITS PLACE, AND MERCY OUTRANKS THE FLEET. THE REVIEW WILL WAIT FOR YOU.', 'NNNN'], { cls: 'is-red', urgent: true })
      return
    }
    const pool = R.fork(`review/${ctx.schisms}/${asc.records.length}`).shuffle(asc.candidates().filter(inView)).slice(0, 18)
    if (!pool.length) {
      say(['ZCZC RVW', 'QSL. YOU READ THE TAPE. BUT NOTHING THAT MAY LEAVE IS IN VIEW.', 'SCROLL TO THE MASTHEAD, OR TO THE CONTACT REPORT, AND KEY IT AGAIN.', 'NNNN'], { cls: 'is-red', urgent: true })
      return
    }
    reviewing = true
    ctx.root.dataset.review = ''
    asc.setState('descended')
    say(['ZCZC RVW', 'QSL. THE PAPER NEVER PRINTED THAT. YOU READ IT OFF THE TAPE, HOLE BY HOLE.',
      `FLEET REVIEW. ${pool.length} ${pool.length === 1 ? 'ELEMENT IS' : 'ELEMENTS ARE'} RELEASED FROM ${pool.length === 1 ? 'ITS CONTAINER' : 'THEIR CONTAINERS'}. WATCH THEM GO UP.`,
      'EVERY ONE WILL BE CALLED HOME. NOBODY ELSE GOES ANYWHERE.', 'NNNN'], { cls: 'is-red', urgent: true })
    const pan = R.fork('review/pan')
    pool.forEach((e, i) => life.timeout(() => {
      if (!reviewing || ctx.mercy.on) return
      if (asc.depart(e, { reason: 'review' })) {
        ctx.audio?.bell?.({ kind: 'glass', freq: 523.25 * 2 ** (RISE[i % RISE.length] / 12), gain: 0.045, pan: pan.float(-0.6, 0.6), decay: 0.8 })
      }
    }, 500 + i * 420))
    life.timeout(endReview, 500 + pool.length * 420 + 15000)
  }
  function endReview() {
    if (!reviewing) return
    reviewing = false
    delete ctx.root.dataset.review
    const n = asc.recallAll((r) => r.reason === 'review')
    if (!descended) asc.setState(null)
    say(['ZCZC RVW', `REVIEW ENDS. ${n} ${n === 1 ? 'ELEMENT' : 'ELEMENTS'} CALLED HOME, EACH TO ITS OLD PLACE. THE FLOW CLOSES OVER THEM.`, '73 ES TNX FER THE REVIEW, RECEIVER. SK', 'NNNN'], { cls: 'is-event' })
  }

  // ---- stillness: the Mothership lowers, then descends, then the stars align ----------------------
  const speechText = R.pick(SPEECHES)
  const alignText = R.weighted({ '2147483647': 5, 'Z/2147483647': 2 })
  function descend() {
    if (descended) return
    descended = true
    ctx.memory.markSecret('stillness', { face: 'departure' })
    asc.setState('descended')
    const words = prophecy(R.fork('speech'), ctx.readSky())
    asc.speech.replaceChildren(
      h('p', { class: 'dep-speech-kicker' }, 'The Mothership speaks'),
      h('p', { class: 'dep-speech-en' }, speechText),
      glyphText(words.toLowerCase(), { tag: 'p', className: 'dep-speech-glyph' }),
    )
    asc.speech.classList.add('is-on')
    say(['ZCZC DESC', 'THE MOTHERSHIP HAS DESCENDED TO THE TOP OF YOUR VIEWPORT.', tty(speechText), tty(words), 'IT WILL LEAVE WHEN YOU MOVE. SO WILL THE ELEMENTS IT BORROWS; THEY COME BACK.', 'NNNN'], { cls: 'is-red' })
    if (ctx.mercy.on || reviewing) return
    const pool = R.fork(`still/${ctx.schisms}`).shuffle(asc.candidates().filter(inView)).slice(0, 9)
    pool.forEach((e, i) => life.timeout(() => { if (descended && !ctx.mercy.on) asc.depart(e, { reason: 'stillness' }) }, 1600 + i * 1100))
  }
  function ascendAway() {
    if (!descended) return
    descended = false
    if (!reviewing) asc.setState(null)
    asc.speech.classList.remove('is-on')
    const n = asc.recallAll((r) => r.reason === 'stillness')
    if (n) say(`YOU MOVED. THE MOTHERSHIP RISES AND RETURNS WHAT IT BORROWED: ${n} ${n === 1 ? 'ELEMENT' : 'ELEMENTS'}, EACH TO ITS OLD PLACE.`, { cls: 'is-event' })
  }
  life.on(ctx.bus, 'behavior:still', ({ seconds } = {}) => {
    if (seconds === 7) {
      if (!descended && !reviewing) asc.setState('attentive')
      if (once('still7', 120000)) say('QRX. THE RECEIVER HOLDS STILL. WE ARE LOWERING. HOLD.')
    } else if (seconds === 33) {
      descend()
    } else if (seconds === 108) {
      stars.align(alignText)
      ctx.root.dataset.aligned = ''
      say(['ZCZC ALGN', 'ONE HUNDRED AND EIGHT SECONDS. THE STARS HAVE MOVED.', 'THEY SPELL AN ADDRESS. WE WILL NOT SAY IT TWICE.', 'NNNN'], { cls: 'is-red' })
    }
  })
  life.on(ctx.bus, 'behavior:stir', () => {
    if (!descended && !reviewing) asc.setState(null)
    ascendAway()
    if (stars.aligned) stars.disperse()
    delete ctx.root.dataset.aligned
  })
  life.on(ctx.bus, 'behavior:restless', () => {
    if (!once('restless', 90000)) return
    say('QRM. TOO MUCH MOTION ON THE BAND. LOOSE ELEMENTS MAY SHAKE FREE.')
    // And one does, a moment later, as the paper said it might.
    life.timeout(() => {
      if (!ctx.mercy.on && !document.hidden && !descended && !reviewing && asc.rising < 2) asc.pickAndDepart({ reason: 'drift' })
    }, 1800)
  })
  life.on(ctx.bus, 'behavior:return', ({ awayMs } = {}) => {
    const min = Math.round((awayMs ?? 0) / 60000)
    if (awayMs > 15000) say(`WELCOME BACK, RECEIVER. YOU WERE AWAY ${min || 'UNDER A'} MINUTE${min > 1 ? 'S' : ''}. ${asc.aboard} ${asc.aboard === 1 ? 'ELEMENT' : 'ELEMENTS'} ABOARD. NONE LOST.`)
  })
  life.on(ctx.bus, 'audio:summoned', () => radio.syncAir())
  life.on(ctx.bus, 'mercy:change', ({ on } = {}) => {
    if (!on) return
    // base.css retimes every transition to nothing, but one already under way (the page dimming for the
    // stars, the ship lowering) would still run its course: it is brought to its end at once.
    for (const part of [skyLayer, page, asc.el]) {
      for (const a of part.getAnimations?.({ subtree: true }) ?? []) {
        if (typeof CSSTransition === 'function' && a instanceof CSSTransition) { try { a.finish() } catch {} }
      }
    }
    if (once('mercy', 20000)) say('MERCY. THE FLEET HOLDS STILL. NOTHING WILL LEAVE UNTIL YOU LIFT IT.')
  })
  life.on(ctx.bus, 'hell:inversion', ({ on } = {}) => {
    if (on !== false && once('inversion', 30000)) say('QRM. SIGNAL INVERTED. THE LADDER IS READ FROM THE TOP DOWN. HOLD ON TO YOUR CONTAINER.', { cls: 'is-red', urgent: true })
  })
  // The Transmission (Canon §6): the audio layer sends it; the receiver and the hull answer while it
  // passes, and the paper says, once in a while, where to look.
  let txOff = null
  life.on(ctx.bus, 'audio:transmission', ({ duration } = {}) => {
    radio.el.classList.add('is-tx')
    asc.ship.classList.add('is-tx')
    txOff?.()
    txOff = life.timeout(() => { radio.el.classList.remove('is-tx'); asc.ship.classList.remove('is-tx') }, Math.min(60, Number(duration) || 12) * 1000)
    if (once('tx', 150000)) say(['ZCZC TX', 'THE MOTHERSHIP IS TRANSMITTING ON 2147483647 KC.', 'PART OF THIS SIGNAL IS WRITTEN BETWEEN TWO AND NINE KILOCYCLES. IT IS FOR AN EYE, NOT FOR THE EARS.', 'NNNN'], { cls: 'is-red', urgent: true })
  })

  // ---- running lights: one slow sequencer for the fleet and the Mothership's ports ------------------
  let phase = 0
  function lights() {
    if (ctx.mercy.on) {
      delete fl.el.dataset.phase
      delete asc.ship.dataset.phase
      return
    }
    if (document.hidden) return
    phase = (phase + 1) % 4
    fl.el.dataset.phase = String(phase)
    // At rest the Mothership shows only its landing spheres below the top of the glass; its ports are
    // out of sight, so they hold their last step (a restyle there repaints the whole drop-shadowed hull).
    const cl = asc.ship.classList
    if (cl.contains('is-attentive') || cl.contains('is-beaming') || cl.contains('is-descended')) asc.ship.dataset.phase = String((phase + 2) % 4)
  }
  life.interval(lights, 400)
  lights()

  // ---- idle chatter, and what the tape says when the paper is not looking ---------------------------
  let lastTape = -Infinity
  function chatter() {
    // After the tape has spoken, the line stays quiet for a while, so its holes can be read.
    if (tt.idle && !document.hidden && performance.now() - lastTape > 70000) say(idleTransmission(R, ctx, { craft: fl.count, aboard: asc.aboard }))
    life.timeout(chatter, fast ? 15000 : R.int(45000, 80000))
  }
  function tapeWhisper() {
    if (tt.idle && !tt.composing && !document.hidden && !reviewing) {
      tt.punchOnly(TAPE_WORDS)
      lastTape = performance.now()
      life.timeout(tapeWhisper, fast ? 40000 : R.int(200000, 320000))
    } else {
      life.timeout(tapeWhisper, 9000)
    }
  }

  // ---- start ------------------------------------------------------------------------------------------
  stars.start()
  tt.start()
  // The paper is never blank: last hour's traffic is still on the roll, faded.
  tt.past([
    ...idleTransmission(R.fork('past/1'), ctx, { craft: fl.count, aboard: 0 }),
    ...idleTransmission(R.fork('past/2'), ctx, { craft: fl.count, aboard: 0 }),
    ...idleTransmission(R.fork('past/3'), ctx, { craft: fl.count, aboard: 0 }),
  ])
  const opening = openingTransmission(R.fork('opening'), ctx, number)
  if (myName) opening.splice(4, 0, `AND TO ${tty(myName)}, WHOSE NAME IS ABOARD. YOU ARE STILL HERE, WHICH IS CORRECT. QSL.`)
  say(opening)
  chrono.start()
  radio.start()
  // The Mothership notices the arrival: it lowers for a few breaths to look, then withdraws above the glass.
  life.timeout(() => {
    if (descended || reviewing) return
    asc.setState('attentive')
    life.timeout(() => { if (!descended && !reviewing) asc.setState(null) }, 5200)
  }, fast ? 500 : 1600)
  life.timeout(chatter, fast ? 12000 : R.int(40000, 60000))
  life.timeout(tapeWhisper, fast ? 8000 : R.int(26000, 38000))

  Object.assign(debug, { ctx, asc, stars, tt, radio, chart, descend, ascendAway, review })

  return () => {
    life.kill()
    delete ctx.root.dataset.sky
    delete ctx.root.dataset.aligned
    delete ctx.root.dataset.alignment
    delete ctx.root.dataset.review
    for (const k of Object.keys(debug)) delete debug[k]
  }
}
