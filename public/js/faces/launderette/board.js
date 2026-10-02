// THE NOTICE BOARD. The live Wall of strangers (ctx.ritual.state.wall), pinned up as flyers written in the
// glyph hand, each with tear-off tabs that are roads to the Infinite Scripture (/verse/...). Visitor text only
// ever goes in through textContent. Beside it: the house's own flyers, the lost sock, the care-marks poster
// (this face's Rosetta fragment) and the attendant, who is back soon and has been since 1996.
import { h } from '../../lib/dom.js'
import { rosetta } from '../../lib/glyphs.js'
import { riddleFor } from '../../lib/hints.js'
import { HOUSE_FLYERS, SKY_FLYERS, SOCK, ATTENDANT, RIDDLE } from './lore.js'
import { makeRng } from '../../kernel/rng.js'

const PAPERS = ['#fff3a3', '#ffd0e0', '#cfe8ff', '#fbfaf3', '#d9f7c8', '#ffe0b8']
const PINS = ['#d93a2b', '#2b6fd9', '#f2c230', '#2fa35a', '#efefef']
// What the care marks mean, letter by letter. The first four spell what this place is for.
const MARKS = { w: 'wash', a: 'all, at once', s: 'spin', h: 'hang to dry', k: 'keep from the Inversion', c: 'clear after floating', l: 'lint: remove' }

// The road a message's own words make through the Infinite Scripture.
function roadOf(text) {
  const words = String(text).toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 4)
  return `/verse/${(words.length ? words : ['the', 'wall']).map(encodeURIComponent).join('/')}`
}

function ago(at, now) {
  const m = Math.max(0, Math.round((now - at) / 60000))
  if (m < 2) return 'just now'
  if (m < 60) return `${m} min ago`
  const hrs = Math.round(m / 60)
  if (hrs < 48) return `${hrs} h ago`
  return `${Math.round(hrs / 24)} days ago`
}

// Five tear-off tabs, a few already taken. They all say the same road, as tabs do, so only the first one left
// is offered to the keyboard and to screen readers; the rest are paper.
function tabs(road, rng, label) {
  const torn = new Set(rng.shuffle([0, 1, 2, 3, 4]).slice(0, rng.int(1, 3)))
  const first = [0, 1, 2, 3, 4].find((i) => !torn.has(i))
  return h('ul', { class: 'lnd-tabs', 'aria-label': label },
    [0, 1, 2, 3, 4].map((i) => h('li', { class: torn.has(i) ? 'is-torn' : null, 'aria-hidden': torn.has(i) || i !== first ? 'true' : null },
      torn.has(i) ? null : h('a', { href: road, tabindex: i === first ? null : '-1' }, road))))
}

export function makeBoard(A) {
  const { ctx, life, rng } = A
  const wallList = h('ol', { class: 'lnd-flyers lnd-flyers--wall' })
  const souls = h('p', { class: 'lnd-board-souls' })
  const empty = h('p', { class: 'lnd-board-empty' }, 'No strangers have pinned anything up yet. Use the altar\'s Inscribe rite to write the first flyer.')

  // The house's flyers: the Management's notice (a nudge for the riddle) always, one more by lot, one for the
  // sky if the sky says so, and always the lost sock.
  const [notice, ...others] = HOUSE_FLYERS
  const house = [notice, rng.pick(others)]
  for (const omen of ctx.sky.omens) if (SKY_FLYERS[omen]) { house.unshift(SKY_FLYERS[omen]); break }
  const sockFound = h('p', { class: 'lnd-flyer-found', hidden: true }, SOCK.found)
  const sockFlyer = h('li', { class: 'lnd-flyer lnd-flyer--sock', style: `--rot: ${rng.float(-3, 2).toFixed(2)}deg; --paper: #fbfaf3; --pin: #d93a2b` },
    h('span', { class: 'lnd-pin', 'aria-hidden': 'true' }),
    h('p', { class: 'lnd-flyer-title' }, SOCK.title),
    h('p', { class: 'lnd-flyer-body' }, SOCK.body),
    h('p', { class: 'lnd-flyer-plea' }, SOCK.plea),
    h('span', { class: 'lnd-sock-drawing', 'aria-hidden': 'true' }),
    sockFound,
    tabs(`/verse/${SOCK.tabs[rng.int(0, SOCK.tabs.length - 1)]}`, rng.fork('sock-tabs'), 'Tear-off tabs: a road to the scripture'))
  const houseList = h('ol', { class: 'lnd-flyers lnd-flyers--house' },
    sockFlyer,
    house.map((f, i) => h('li', { class: 'lnd-flyer lnd-flyer--house', style: `--rot: ${rng.float(-3.5, 3.5).toFixed(2)}deg; --paper: ${PAPERS[(i + 3) % PAPERS.length]}; --pin: ${rng.pick(PINS)}` },
      h('span', { class: 'lnd-pin', 'aria-hidden': 'true' }),
      h('p', { class: 'lnd-flyer-title' }, f.title),
      h('p', { class: 'lnd-flyer-body' }, f.body),
      f.sign ? h('p', { class: 'lnd-flyer-sign' }, `— ${f.sign}`) : null)))

  const board = h('section', { class: 'lnd-board', 'aria-labelledby': 'lnd-board-h' },
    h('header', { class: 'lnd-board-head' },
      h('h2', { id: 'lnd-board-h', class: 'lnd-plate' }, 'Notices'),
      souls),
    h('div', { class: 'lnd-cork' }, houseList, wallList, empty))

  // ── The care-marks poster: the Rosetta fragment of this face ──────────────────────────────────────
  const marks = rosetta('launderette', { className: 'lnd-rosetta' })
  for (const pair of marks.querySelectorAll('.rosetta-pair')) {
    const letter = pair.querySelector('dd')?.textContent?.toLowerCase()
    if (MARKS[letter]) pair.append(h('dd', { class: 'lnd-mark-gloss' }, MARKS[letter]))
  }
  const poster = h('section', { class: 'lnd-poster', 'aria-labelledby': 'lnd-poster-h' },
    h('h2', { id: 'lnd-poster-h' }, 'Care marks', h('small', {}, 'how to read a label')),
    marks,
    h('p', { class: 'lnd-poster-note' }, 'Every mark is a letter in the hand of the Cascade. The care labels are printed in it.'))

  // ── The attendant, back soon ────────────────────────────────────────────────────────────────────────
  const notes = h('ol', { class: 'lnd-notes' })
  const bell = h('button', { type: 'button', class: 'lnd-bell' }, h('span', { class: 'lnd-bell-dome', 'aria-hidden': 'true' }), ATTENDANT.bell)
  const attendant = h('section', { class: 'lnd-attendant', 'aria-labelledby': 'lnd-attendant-h' },
    h('h2', { id: 'lnd-attendant-h', class: 'lnd-marker lnd-attendant-sign' }, ATTENDANT.sign, h('small', {}, ATTENDANT.date)),
    bell,
    h('div', { class: 'lnd-notepad', 'aria-live': 'polite' }, notes))
  let tier = Number(ctx.memory?.get?.('launderette.hints', 0)) || 0
  life.on(bell, 'click', () => {
    ctx.audio?.bell?.({ kind: 'hand', freq: 1318.5, gain: 0.06, decay: 0.6 })
    // Once the temple's own hint ladder knows this riddle, the attendant reads from it, so the bell, the
    // altar and the console climb the same three rungs. Until then the attendant keeps a copy.
    let text = null
    let n = 0
    let of = RIDDLE.hints.length
    if (riddleFor('launderette') && ctx.secrets?.hint) {
      const x = ctx.secrets.hint('face')
      if (x?.riddle) { text = x.text; n = x.tier; of = x.of }
    }
    if (!text) {
      n = Math.min(tier, RIDDLE.hints.length - 1)
      text = RIDDLE.hints[n]
      tier = Math.min(RIDDLE.hints.length - 1, n + 1)
      ctx.memory?.set?.('launderette.hints', tier)
    }
    notes.replaceChildren(h('li', { class: 'lnd-note' },
      h('p', { class: 'lnd-note-kicker' }, notes.children.length ? `Note ${n + 1} of ${of}` : `${ATTENDANT.empty} (note ${n + 1} of ${of})`),
      h('p', { class: 'lnd-note-text' }, text),
      h('p', { class: 'lnd-note-more' }, n + 1 < of ? ATTENDANT.more : ATTENDANT.last)))
  })

  // ── The live Wall ─────────────────────────────────────────────────────────────────────────────────
  const shown = new Map()
  function renderWall() {
    const st = ctx.ritual?.state
    const wall = Array.isArray(st?.wall) ? st.wall.slice(-7).reverse() : []
    // Ages are measured against the real clock, because the server stamped the messages with it (?at= only
    // moves the temple's sky, not the strangers' handwriting).
    const now = Date.now()
    const items = wall.map((m) => {
      const key = String(m.id ?? m.text)
      const r = makeRng(`launderette/flyer/${key}`)
      const text = String(m.text ?? '').slice(0, 80)
      const road = roadOf(text)
      const li = shown.get(key) ?? h('li', { class: 'lnd-flyer lnd-flyer--wall', style: `--rot: ${r.float(-4, 4).toFixed(2)}deg; --paper: ${r.pick(PAPERS)}; --pin: ${r.pick(PINS)}` },
        h('span', { class: 'lnd-pin', 'aria-hidden': 'true' }),
        h('p', { class: 'lnd-flyer-text glyph', lang: 'x-cascade' }, text),
        h('p', { class: 'lnd-flyer-meta' }, h('span', { class: 'lnd-flyer-ago' }), ' · a stranger'),
        tabs(road, r.fork('tabs'), 'Tear-off tabs: a road to the scripture'))
      li.querySelector('.lnd-flyer-ago').textContent = ago(Number(m.at) || now, now)
      shown.set(key, li)
      return li
    })
    wallList.replaceChildren(...items)
    empty.hidden = items.length > 0
    setSouls(st?.online)
  }
  function setSouls(n) {
    const online = Number(n)
    souls.textContent = Number.isFinite(online) && online > 0 ? `${online} ${online === 1 ? 'soul' : 'souls'} doing laundry tonight` : ''
  }
  renderWall()
  life.bus(ctx.bus, 'ritual:state', renderWall)
  life.bus(ctx.bus, 'temple:awake', renderWall)
  // The ritual layer files a new message after this face hears of it; read the Wall a moment later.
  life.bus(ctx.bus, 'server:wall', () => life.timeout(renderWall, 60))
  life.bus(ctx.bus, 'ritual:inscribed', () => life.timeout(renderWall, 60))
  life.bus(ctx.bus, 'server:presence', (d) => setSouls(d?.online))
  life.interval(renderWall, 60000)

  function sockCleared() {
    sockFlyer.classList.add('is-found')
    sockFound.hidden = false
  }

  return { board, poster, attendant, sockCleared }
}
