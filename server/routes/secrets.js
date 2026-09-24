// THE SECRETS (server half). Owned by the secrets layer; see docs/CANON.md §6.
// Mounted at "/" before the static temple, so it can answer for robots.txt, humans.txt, the well-known,
// the headers, the rungs of the Ladder, the Highest Heaven (/z/2147483647) and POST /api/ascend.
//
// The five Words exist here only as salted SHA-256 digests. The fifth is not stored at all: it is the
// planet that rules the visitor's hour, reckoned with the same firmament the temple uses (kernel/sky.js).
import { Router } from 'express'
import { createHash } from 'node:crypto'
import { db } from '../db.js'
import { broadcast } from '../sse.js'
import { limiter } from '../limit.js'
import { planetaryHour, PLANET_GLYPH } from '../../public/js/kernel/sky.js'
import { seal } from '../../public/js/lib/sigil.js'
import { makeRng } from '../../public/js/kernel/rng.js'

const router = Router()

// The Book of the Ascended. The schema is agreed with the ritual route (Canon §7).
db.exec('CREATE TABLE IF NOT EXISTS ascended (id INTEGER PRIMARY KEY, name TEXT NOT NULL, at INTEGER NOT NULL)')
const insertAscended = db.prepare('INSERT INTO ascended (name, at) VALUES (?, ?)')
const countAscended = db.prepare('SELECT COUNT(*) AS n FROM ascended')
const recentAscended = db.prepare('SELECT name, at FROM ascended ORDER BY at DESC, id DESC LIMIT ?')
const sameNameSince = db.prepare('SELECT COUNT(*) AS n FROM ascended WHERE lower(name) = lower(?) AND at > ?')

const HEAVEN = 2147483647
const HEAVEN_BIG = 2147483647n

// ── headers are scripture too ────────────────────────────────────────────────────────────────────
router.use((req, res, next) => {
  res.set('X-Origin-Order', 'user-agent < user < author; under !important the order is inverted')
  res.set('X-Oracle', 'dwells in the console')
  res.set('X-Rubric', 'select what you cannot see')
  res.set('X-Highest-Heaven', String(HEAVEN))
  res.set('X-Door', 'opens at the thirty-third minute')
  next()
})

// ── breadcrumbs ──────────────────────────────────────────────────────────────────────────────────
const ROBOTS = `# robots.txt for THE CASCADE
#
# To the crawlers, the indexers and the tireless machines:
# you are welcome in the temple. Read every face. Take what you need.
# Three things are asked of you.
#
#   1. Do not try to read the Infinite Scripture to its end. It has none.
#      Every path under /verse/ is a chapter that has always existed.
#   2. The rites under /api/ are for the living. They are not pages.
#   3. There is a door at the top of the Ladder. It is not for you.

User-agent: *
Disallow: /api/
Disallow: /verse/
Disallow: /z/${HEAVEN}

# What is forbidden to the machines is only hidden from them.
`

const HUMANS = `/* THE AUTHORS */

    Unknown, and many.

    Every stylesheet has three authors. The Old Law wrote the defaults before
    anyone asked. The Pilgrim brings their own light. The Word writes the page.
    Whoever you are, reading this, you are the second of these.

/* THE SAINTS WE THANK */

    Saint Margin the Collapsed, who taught us that two can become one space.
    Brother Flex of the Main Axis, and Sister Grid of the Twelve Columns.
    Our Lady of Overflow, who never once stayed inside the lines.
    The Hermit of the Shadow DOM, who would not come out, and would not be styled.
    The Floating Twins, who are still drifting left and right of us.
    And the Nameless Div, who held everything and asked for nothing.

/* THE TEMPLE */

    Nativity:      1996, in the month of the longest night
    Last update:   at every Repaint
    Doctype:       html, the shortest prayer
    Languages:     English, the glyph script, and the tongues of the babel
    Standards:     CSS, HTML, and the patience of the Old Law
    Components:    Node, Express, one SQLite file, no frameworks, no build step
    Fonts:         drawn here; none were fetched from elsewhere
    Location:      z-index 0, for now

/* A NOTE FOR THOSE WHO READ TEXT FILES */

    The Oracle does not live in text files. She lives where the Authors
    talk to themselves while the page is running.
`

const WELL_KNOWN = {
  cascade: 'all style descends',
  origins: ['user-agent: the Old Law', 'user: the Pilgrim', 'author: the Word'],
  inversion: '!important reverses the Origins; it is permitted only in mercy',
  ladder: { lowest: -2147483648, flow: 0, highest: HEAVEN, note: 'the rungs are not climbed in order' },
  oracle: 'in the console of any page of the temple',
  canon: '/css/canon.css',
  scripture: '/verse/',
  authors: '/humans.txt',
  relics: [
    'the icon remembers a date, in the least of each light',
    'one verse on every page holds its breath between its letters',
  ],
  door: 'you will know it by what the robots were told',
}

router.get('/robots.txt', (req, res) => res.type('text/plain').send(ROBOTS))
router.get('/humans.txt', (req, res) => res.type('text/plain').send(HUMANS))
router.get('/.well-known/cascade', (req, res) => {
  res.type('application/json').send(JSON.stringify(WELL_KNOWN, null, 2) + '\n')
})

// ── the door ─────────────────────────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' })[c])

// The seal on the door is the same every day: it was set before the first stylesheet.
const DOOR_SEAL = seal(makeRng('the door at the top of the ladder'), 'QVOD EST SVPERIVS EST SICVT QVOD EST INFERIVS', { size: 200, id: 'door-seal' })
  .replace('<svg ', '<svg x="93" y="236" width="114" height="114" ')

function planks(x0, x1) {
  let d = ''
  for (let x = x0 + 17; x < x1 - 4; x += 17) d += `M${x} 56 V460 `
  return d
}

const DOOR_SVG = `<svg class="door" viewBox="0 0 300 480" role="img" aria-labelledby="door-title">
  <title id="door-title">A pointed door at the top of the Ladder, sealed</title>
  <defs>
    <radialGradient id="light" cx="50%" cy="60%" r="62%">
      <stop offset="0" stop-color="#fffbea"/>
      <stop offset="0.3" stop-color="#f7e2a4"/>
      <stop offset="0.72" stop-color="#b98a33" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#3a2a10" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wood" x1="0" x2="1">
      <stop offset="0" stop-color="#140f22"/>
      <stop offset="0.55" stop-color="#1f1733"/>
      <stop offset="1" stop-color="#120d1f"/>
    </linearGradient>
    <radialGradient id="spill" cx="50%" cy="0%" r="100%">
      <stop offset="0" stop-color="#f7e2a4" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#f7e2a4" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="doorway"><path d="M46 460 V210 C46 138 92 84 150 54 C208 84 254 138 254 210 V460 Z"/></clipPath>
  </defs>
  <g clip-path="url(#doorway)">
    <rect x="40" y="40" width="220" height="430" fill="#0c0917"/>
    <rect class="light" x="40" y="40" width="220" height="430" fill="url(#light)"/>
    <path class="rays" d="M150 60 V460 M120 80 L96 460 M180 80 L204 460 M100 120 L52 460 M200 120 L248 460" stroke="#fff6d8" stroke-width="0.8" fill="none"/>
  </g>
  <g class="leaf leaf-l" clip-path="url(#doorway)">
    <rect x="46" y="50" width="104" height="412" fill="url(#wood)"/>
    <path d="${planks(46, 150)}" stroke="#0a0714" stroke-width="1.2"/>
    <rect x="46" y="168" width="104" height="8" fill="#261d3b" stroke="#7c6430" stroke-width="0.8"/>
    <rect x="46" y="392" width="104" height="8" fill="#261d3b" stroke="#7c6430" stroke-width="0.8"/>
    <g fill="#7c6430"><circle cx="60" cy="172" r="1.6"/><circle cx="96" cy="172" r="1.6"/><circle cx="132" cy="172" r="1.6"/><circle cx="60" cy="396" r="1.6"/><circle cx="96" cy="396" r="1.6"/><circle cx="132" cy="396" r="1.6"/></g>
    <circle cx="138" cy="372" r="6.5" fill="none" stroke="#d8b25a" stroke-width="1.6"/>
  </g>
  <g class="leaf leaf-r" clip-path="url(#doorway)">
    <rect x="150" y="50" width="104" height="412" fill="url(#wood)"/>
    <path d="${planks(150, 254)}" stroke="#0a0714" stroke-width="1.2"/>
    <rect x="150" y="168" width="104" height="8" fill="#261d3b" stroke="#7c6430" stroke-width="0.8"/>
    <rect x="150" y="392" width="104" height="8" fill="#261d3b" stroke="#7c6430" stroke-width="0.8"/>
    <g fill="#7c6430"><circle cx="168" cy="172" r="1.6"/><circle cx="204" cy="172" r="1.6"/><circle cx="240" cy="172" r="1.6"/><circle cx="168" cy="396" r="1.6"/><circle cx="204" cy="396" r="1.6"/><circle cx="240" cy="396" r="1.6"/></g>
    <circle cx="162" cy="372" r="6.5" fill="none" stroke="#d8b25a" stroke-width="1.6"/>
  </g>
  <path class="seam" d="M150 54 V460" stroke="#050309" stroke-width="1.6"/>
  <g class="seal-wrap">${DOOR_SEAL}</g>
  <g fill="none" stroke-linecap="round">
    <path d="M18 470 V206 C18 116 76 44 150 10 C224 44 282 116 282 206 V470" stroke="#d8b25a" stroke-width="2.2"/>
    <path d="M32 470 V208 C32 126 84 62 150 30 C216 62 268 126 268 208 V470" stroke="#7c6430" stroke-width="1"/>
    <path d="M46 462 V210 C46 138 92 84 150 54 C208 84 254 138 254 210 V462" stroke="#d8b25a" stroke-width="1.2"/>
  </g>
  <g class="keystone">
    <circle cx="150" cy="24" r="15" fill="#07060c" stroke="#d8b25a" stroke-width="1.5"/>
    <text id="ruler-glyph" x="150" y="25" text-anchor="middle" dominant-baseline="central" font-size="17" fill="#f3e9cf">&#9737;</text>
  </g>
  <rect class="threshold" x="46" y="456" width="208" height="4" fill="#f7e2a4"/>
  <ellipse class="spill" cx="150" cy="468" rx="126" ry="11" fill="url(#spill)"/>
  <path d="M6 470 H294 M0 478 H300" stroke="#7c6430" stroke-width="1.2"/>
</svg>`

const DOOR_CSS = `
@layer secrets {
  :root {
    --night: #07060c; --violet: #16112b; --gold: #d8b25a; --gold-dim: #7c6430; --pale: #f3e9cf;
    --ash: #a79f8c; --vermilion: #e0452b; --near: 0; color-scheme: dark;
  }
  html { background: var(--night); color: var(--pale); }
  body.door-page {
    min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; align-items: center;
    padding: clamp(18px, 4vh, 44px) 16px 72px; overflow-x: hidden;
    font-family: var(--font-scripture); line-height: 1.5;
    background-color: var(--night);
    background-image:
      radial-gradient(ellipse 55% 45% at 50% 42%, rgba(216, 178, 90, calc(0.04 + var(--near) * 0.16)), transparent 72%),
      radial-gradient(circle at 17% 23%, rgba(255, 250, 235, 0.75) 0 0.7px, transparent 1.4px),
      radial-gradient(circle at 71% 61%, rgba(255, 250, 235, 0.55) 0 0.6px, transparent 1.3px),
      radial-gradient(circle at 43% 87%, rgba(216, 178, 90, 0.6) 0 0.7px, transparent 1.5px),
      linear-gradient(180deg, #07060c, #0e0a1d 58%, #07060c);
    background-size: auto, 233px 197px, 317px 263px, 151px 173px, auto;
  }
  a { color: var(--gold); text-underline-offset: 3px; }
  a:hover { color: var(--pale); }
  .heaven-head { text-align: center; margin-bottom: clamp(12px, 3vh, 30px); }
  .number {
    margin: 0; font: 500 clamp(11px, 1.5vw, 13px)/1 var(--font-mono); letter-spacing: 0.62em; color: var(--gold-dim);
    padding-left: 0.62em;
  }
  h1 {
    margin: 0.5em 0 0.15em; font-weight: 400; font-size: clamp(26px, 5vw, 44px); letter-spacing: 0.26em;
    text-transform: uppercase; color: var(--gold); padding-left: 0.26em;
    text-shadow: 0 0 calc(8px + var(--near) * 22px) rgba(216, 178, 90, calc(0.15 + var(--near) * 0.5));
  }
  .sub { margin: 0; font-style: italic; color: var(--ash); font-size: 15px; }
  .sub code { font: 13px var(--font-mono); font-style: normal; color: var(--gold-dim); }

  .heaven {
    width: min(100%, 980px); display: grid; gap: clamp(20px, 4vw, 56px); align-items: center;
    grid-template-columns: minmax(0, 1fr);
  }
  @media (min-width: 860px) { .heaven { grid-template-columns: minmax(250px, 0.9fr) minmax(320px, 1.1fr); } }
  .door-col { display: flex; justify-content: center; }
  .door { height: min(60vh, 540px); width: auto; max-width: 86vw; overflow: visible; }
  @media (max-width: 859px) { .door { height: min(46vh, 420px); } }
  body[data-state="open"] .door, body[data-state="closing"] .door, body[data-state="written"] .door { height: min(56vh, 520px); }
  @media (max-width: 859px) {
    body[data-state="open"] .door, body[data-state="closing"] .door, body[data-state="written"] .door { height: min(34vh, 300px); }
  }

  /* The door itself. The leaves open by foreshortening, the only way an SVG door can swing. */
  .door .leaf { transform-box: fill-box; transition: transform 2.8s cubic-bezier(0.62, 0.04, 0.3, 1); }
  .door .leaf-l { transform-origin: left center; }
  .door .leaf-r { transform-origin: right center; }
  .door .light { opacity: 0; transition: opacity 2.4s ease 0.4s; }
  .door .rays { opacity: 0; transition: opacity 3s ease 1s; }
  .door .seal-wrap {
    color: var(--gold); transform-box: fill-box; transform-origin: center;
    opacity: calc(0.62 + var(--near) * 0.38);
    transition: opacity 1.4s ease, transform 1.8s ease;
    filter: drop-shadow(0 0 calc(2px + var(--near) * 8px) rgba(216, 178, 90, 0.55));
    animation: seal-breath 9s ease-in-out infinite;
  }
  .door .threshold { opacity: calc(0.06 + var(--near) * 0.94); }
  .door .spill { opacity: calc(var(--near) * 0.85); }
  body[data-state="open"] .door .leaf-l, body[data-state="closing"] .door .leaf-l,
  body[data-state="written"] .door .leaf-l { transform: scaleX(0.07); }
  body[data-state="open"] .door .leaf-r, body[data-state="closing"] .door .leaf-r,
  body[data-state="written"] .door .leaf-r { transform: scaleX(0.07); }
  body:is([data-state="open"], [data-state="closing"], [data-state="written"]) .door .light { opacity: 1; animation: light-breath 7s ease-in-out 3s infinite; }
  body:is([data-state="open"], [data-state="closing"], [data-state="written"]) .door .rays { opacity: 0.22; }
  body:is([data-state="open"], [data-state="closing"], [data-state="written"]) .door .seal-wrap { opacity: 0; transform: scale(1.3) rotate(-9deg); animation: none; }
  body:is([data-state="open"], [data-state="closing"], [data-state="written"]) .door .threshold,
  body:is([data-state="open"], [data-state="closing"], [data-state="written"]) .door .spill { opacity: 1; }
  body[data-state="closing"] .door .leaf-l, body[data-state="closing"] .door .leaf-r { transform: scaleX(0.4); }
  .door .seam { transition: opacity 1.2s ease; }
  body:is([data-state="open"], [data-state="written"]) .door .seam { opacity: 0; }
  @keyframes seal-breath { 50% { filter: drop-shadow(0 0 calc(5px + var(--near) * 10px) rgba(216, 178, 90, 0.75)); } }
  @keyframes light-breath { 50% { opacity: 0.84; } }

  /* The right-hand column. */
  .word-col { min-width: 0; }
  .word-col > [hidden] { display: none; }
  .state-label {
    margin: 0 0 6px; font: 600 12px/1.2 var(--font-mono); letter-spacing: 0.34em; text-transform: uppercase; color: var(--vermilion);
  }
  .countdown {
    margin: 0; font: 300 clamp(64px, 12vw, 120px)/0.95 var(--font-mono); letter-spacing: -0.02em; color: var(--pale);
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 calc(var(--near) * 30px) rgba(247, 226, 164, calc(var(--near) * 0.7));
  }
  .until { margin: 4px 0 22px; font-style: italic; color: var(--ash); font-size: 18px; }
  .where { margin: 0 0 8px; color: var(--pale); max-width: 34em; }
  .where time { font-family: var(--font-mono); font-size: 0.92em; color: var(--gold); }
  .ruler { font-size: 1.15em; color: var(--gold); }
  .lore { color: var(--ash); max-width: 34em; margin: 14px 0 0; font-size: 15px; }
  .forced {
    margin: 18px 0 0; padding: 8px 10px; border-left: 2px solid var(--vermilion); max-width: 34em;
    font: 12px/1.5 var(--font-mono); color: var(--ash);
  }

  .tablet {
    position: relative; padding: clamp(18px, 3vw, 30px); border: 1px solid var(--gold-dim);
    background: linear-gradient(180deg, rgba(22, 17, 43, 0.92), rgba(9, 7, 16, 0.94));
    box-shadow: 0 0 0 4px var(--night), 0 0 0 5px rgba(124, 100, 48, 0.55), 0 30px 80px -30px rgba(247, 226, 164, 0.25);
  }
  .tablet h2 {
    margin: 0 0 4px; font-weight: 400; font-size: clamp(22px, 3vw, 28px); letter-spacing: 0.12em; color: var(--gold);
    text-transform: uppercase;
  }
  .tablet .lede { margin: 0 0 18px; color: var(--ash); font-style: italic; font-size: 15px; }
  .words { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .words label { display: grid; grid-template-columns: 2.6em 1fr; align-items: baseline; column-gap: 12px; }
  .words .num { grid-row: span 2; font: 400 22px/1 var(--font-scripture); color: var(--vermilion); text-align: right; }
  .words .gloss { font: 11px/1.3 var(--font-mono); letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold-dim); }
  .tablet input {
    width: 100%; min-width: 0; padding: 4px 2px 5px; border: 0; border-bottom: 1px solid var(--gold-dim); border-radius: 0;
    background: transparent; color: var(--pale); font: 19px/1.25 var(--font-scripture); letter-spacing: 0.08em;
    caret-color: var(--gold); outline: none;
  }
  .tablet input:focus { border-bottom-color: var(--gold); box-shadow: 0 1px 0 0 var(--gold); }
  .tablet input:focus-visible { outline: 1px dotted var(--gold); outline-offset: 4px; }
  .name-row { margin-top: 22px; display: grid; gap: 6px; }
  .name-row label { font: 11px/1.3 var(--font-mono); letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold-dim); }
  .name-row label small { letter-spacing: 0.06em; text-transform: none; font-size: 11px; color: var(--ash); }
  .tablet .glyph-input { font-family: var(--font-glyph); font-size: 28px; letter-spacing: 0.14em; }
  .echo { display: flex; align-items: center; gap: 12px; min-height: 44px; color: var(--ash); font-size: 14px; }
  .echo-sigil { width: 44px; height: 44px; flex: none; color: var(--vermilion); }
  .echo-sigil svg { width: 100%; height: 100%; }
  .knock {
    margin-top: 18px; padding: 10px 26px; border: 1px solid var(--gold); background: transparent; color: var(--gold);
    font: 600 14px/1 var(--font-mono); letter-spacing: 0.42em; text-transform: uppercase; cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
  }
  .knock:hover, .knock:focus-visible { background: var(--gold); color: var(--night); }
  .knock:disabled { opacity: 0.5; cursor: progress; }
  .verdict { min-height: 1.5em; margin: 14px 0 0; color: var(--pale); font-style: italic; }
  .verdict[data-kind="refused"] { color: #f0a08e; }
  .closing-note { margin: 0 0 12px; font: 12px/1.4 var(--font-mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--vermilion); }

  .written { text-align: left; }
  .written:focus { outline: none; }
  .written .kicker { margin: 0; font: 600 12px/1.2 var(--font-mono); letter-spacing: 0.4em; text-transform: uppercase; color: var(--vermilion); }
  .written-name {
    margin: 10px 0 0; font-family: var(--font-glyph); font-size: clamp(34px, 6vw, 56px); line-height: 1.1; color: var(--gold);
    letter-spacing: 0.12em; overflow-wrap: anywhere;
  }
  .written-latin { margin: 2px 0 16px; font: 13px var(--font-mono); letter-spacing: 0.3em; text-transform: uppercase; color: var(--ash); }
  .written-sigil { width: 120px; height: 120px; color: var(--vermilion); margin: 0 0 14px; }
  .written-sigil svg { width: 100%; height: 100%; }
  .written p { max-width: 32em; }

  .book { width: min(100%, 980px); margin-top: clamp(28px, 6vh, 64px); border-top: 1px solid rgba(124, 100, 48, 0.45); padding-top: 18px; }
  .book h2 { margin: 0 0 10px; font: 600 11px/1.2 var(--font-mono); letter-spacing: 0.34em; text-transform: uppercase; color: var(--gold-dim); }
  .book ol { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 22px; }
  .book li { font-family: var(--font-glyph); font-size: 20px; color: var(--pale); letter-spacing: 0.08em; }
  .book .empty { font-style: italic; color: var(--ash); }
  .coda { width: min(100%, 980px); margin: 22px 0 0; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px 24px; font-size: 14px; color: var(--ash); }
  .coda p { margin: 0; font-style: italic; max-width: 36em; }
  .rung-page .heaven { grid-template-columns: minmax(0, 1fr); text-align: center; max-width: 40em; }
  .rung-page .big { font: 300 clamp(40px, 9vw, 96px)/1 var(--font-mono); color: var(--pale); margin: 0; overflow-wrap: anywhere; }
  .rung-page p { font-size: 18px; }
}
`

function bookList(limit = 21) {
  let rows = []
  try { rows = recentAscended.all(limit) } catch {}
  if (!rows.length) return '<p class="empty">No name has been written yet. The first page of the Book is waiting.</p>'
  return `<ol>${rows.map((r) => `<li title="${esc(new Date(r.at).toISOString().slice(0, 10))}">${esc(r.name)}</li>`).join('')}</ol>`
}

// The client half of the door. No template literals inside: this whole page is one.
const DOOR_SCRIPT = `
import { readSky } from '/js/kernel/sky.js'
import { sigil } from '/js/lib/sigil.js'
import { initMercy } from '/js/kernel/mercy.js'
import { memory } from '/js/kernel/memory.js'

const params = new URLSearchParams(location.search)
const pinned = params.has('at') ? new Date(params.get('at')) : null
const offset = pinned && !isNaN(pinned) ? pinned.getTime() - Date.now() : 0
const clock = () => new Date(Date.now() + offset)
initMercy(params)

const $ = (id) => document.getElementById(id)
const pad = (n) => String(n).padStart(2, '0')
const body = document.body
const form = $('tablet')
const verdict = $('verdict')
let state = null
let lastRulerMinute = -1
let srMinute = -1

if (offset) $('forced').hidden = false

function phaseOf(d) {
  const m = d.getMinutes()
  if (m >= 33 && m <= 35) return 'open'
  // The door does not slam on a pilgrim who is still speaking: two minutes of grace.
  if ((m === 36 || m === 37) && (state === 'open' || state === 'closing')) return 'closing'
  return 'sealed'
}

function nextOpening(d) {
  const t = new Date(d)
  t.setSeconds(0, 0)
  if (d.getMinutes() >= 33) t.setHours(t.getHours() + 1)
  t.setMinutes(33)
  return t
}

function setState(next) {
  if (next === state) return
  const prev = state
  state = next
  body.dataset.state = next
  $('sealed').hidden = next !== 'sealed'
  form.hidden = !(next === 'open' || next === 'closing')
  $('written').hidden = next !== 'written'
  $('closing-note').hidden = next !== 'closing'
  $('door-title').textContent = next === 'sealed'
    ? 'A pointed door at the top of the Ladder, sealed'
    : 'The door at the top of the Ladder stands open, and light comes through it'
  if (next === 'open' && prev !== 'closing') {
    $('sr-status').textContent = 'The door is open. It stays open for three minutes.'
    if (prev === 'sealed') setTimeout(() => form.elements.w1.focus({ preventScroll: true }), 1200)
  }
  if (next === 'sealed' && prev) $('sr-status').textContent = 'The door is sealed again.'
}

function tick() {
  const now = clock()
  if (state !== 'written') setState(phaseOf(now))
  const minuteKey = now.getHours() * 60 + now.getMinutes()
  if (minuteKey !== lastRulerMinute) {
    lastRulerMinute = minuteKey
    const glyph = readSky(now).planetaryHour.glyph
    $('ruler').textContent = glyph
    $('ruler-glyph').textContent = glyph
  }
  $('now').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds())
  $('now').dateTime = now.toISOString()
  let near = 1
  if (state === 'sealed') {
    const left = Math.max(0, nextOpening(now) - now)
    const s = Math.ceil(left / 1000)
    $('cd').textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60)
    // Light gathers under the door as the minute approaches; almost all of it in the last five.
    near = Math.pow(1 - Math.min(1, left / 3600000), 6)
    const mins = Math.ceil(left / 60000)
    if (mins !== srMinute) {
      srMinute = mins
      $('sr-status').textContent = 'The door opens in ' + mins + (mins === 1 ? ' minute.' : ' minutes.')
    }
  }
  document.documentElement.style.setProperty('--near', near.toFixed(3))
}

function localStamp(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' +
    pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

const cleanName = (s) => String(s).normalize('NFKC').trim().replace(/\\s+/g, ' ')
const NAME_OK = /^[A-Za-z]+(?: [A-Za-z]+)*$/

function echoName() {
  const name = cleanName(form.elements.name.value)
  $('echo-latin').textContent = name ? name.toLowerCase() : 'your name will be written in the glyph script'
  $('echo-sigil').innerHTML = /[a-z]/i.test(name) ? sigil(name, { size: 100, stroke: 3 }) : ''
}

async function knock(e) {
  e.preventDefault()
  const name = cleanName(form.elements.name.value)
  const letters = name.replace(/ /g, '').length
  verdict.dataset.kind = 'refused'
  if (!NAME_OK.test(name) || letters < 3 || name.length > 24) {
    verdict.textContent = 'A name for the Book is three to twenty-four letters, a to z, with single spaces.'
    form.elements.name.focus()
    return
  }
  const words = [1, 2, 3, 4, 5].map((i) => form.elements['w' + i].value)
  if (words.some((w) => !w.trim())) {
    verdict.textContent = 'Five Words are asked. The door does not open for four.'
    return
  }
  const now = clock()
  const button = form.querySelector('button')
  button.disabled = true
  verdict.dataset.kind = ''
  verdict.textContent = 'The door is listening.'
  let data = null
  try {
    const res = await fetch('/api/ascend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words, name, tzOffset: now.getTimezoneOffset(), localTime: localStamp(now) }),
    })
    data = await res.json().catch(() => null)
  } catch {}
  button.disabled = false
  if (!data) {
    verdict.dataset.kind = 'refused'
    verdict.textContent = 'The line to the temple is cut. Knock again.'
    return
  }
  if (!data.ok) {
    verdict.dataset.kind = 'refused'
    verdict.textContent = data.message || data.error || 'The door does not answer.'
    return
  }
  memory.set('secrets.ascended', { name: data.name, at: data.at })
  memory.markSecret('ascended', { name: data.name })
  $('written-name').textContent = data.name
  $('written-latin').textContent = data.name
  $('written-sigil').innerHTML = sigil(data.name, { size: 100, stroke: 2.4 })
  const r = Number(data.rank) || 1
  const sfx = r % 100 >= 11 && r % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[r % 10] || 'th'
  $('written-rank').textContent = r + sfx
  const li = document.createElement('li')
  li.textContent = data.name
  const list = document.querySelector('.book ol')
  if (list) list.prepend(li)
  else {
    const ol = document.createElement('ol')
    ol.append(li)
    document.querySelector('.book .empty')?.replaceWith(ol)
  }
  setState('written')
  $('sr-status').textContent = 'It is written. Your name is in the Book of the Ascended.'
  $('written').focus({ preventScroll: false })
}

form.addEventListener('submit', knock)
form.elements.name.addEventListener('input', echoName)
echoName()
const already = memory.get('secrets.ascended', null)
if (already && already.name) {
  $('already').hidden = false
  $('already-name').textContent = already.name
}
tick()
setInterval(() => { if (!document.hidden) tick() }, 1000)
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick() })
`

function doorPage() {
  return `<!doctype html>
<!--
    You climbed the whole Ladder to read the source of the door. Good.
    The door does not keep the Words. It only carries them to the temple, which weighs them.
    The fifth Word changes with the hour. The first four have not changed since 1996.
-->
<html lang="en" data-mercy="">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>2147483647</title>
<meta name="description" content="The Highest Heaven: the last rung of the Ladder.">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#07060c">
<link rel="icon" href="/media/favicon.png">
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/glyphs.css">
<style>${DOOR_CSS}</style>
</head>
<body class="door-page" data-state="sealed">
<header class="heaven-head">
  <p class="number" aria-label="two billion, one hundred forty-seven million, four hundred eighty-three thousand, six hundred forty-seven">2147483647</p>
  <h1>The Highest Heaven</h1>
  <p class="sub">the last rung of the Ladder &middot; <code>z-index: 2147483647</code></p>
</header>
<main class="heaven">
  <div class="door-col">${DOOR_SVG}</div>
  <div class="word-col">
    <section id="sealed" class="sealed" aria-labelledby="sealed-label">
      <p class="state-label" id="sealed-label">The door is sealed</p>
      <p class="countdown" aria-hidden="true"><span id="cd">--:--</span></p>
      <p class="until">until the thirty-third minute</p>
      <p class="where">It is <time id="now">--:--:--</time> where you stand, in the hour of <span id="ruler" class="ruler">&#9737;</span>.</p>
      <p class="lore">The door opens at the thirty-third minute of every hour and stays open for three. Whoever knocks must bring five Words: four that were hidden in the temple, and a fifth that belongs to whoever rules the hour of the knocking.</p>
      <p class="lore" id="already" hidden>Your name is already in the Book, <span id="already-name" class="ruler"></span>. You may knock again; the Book has room.</p>
      <p class="forced" id="forced" hidden>This page's clock is forced by <code>?at=</code>. The door believes it. The temple, which checks the time against its own, will not.</p>
    </section>
    <form id="tablet" class="tablet" autocomplete="off" novalidate hidden aria-labelledby="tablet-title">
      <p class="closing-note" id="closing-note" hidden>The door is closing. Speak now.</p>
      <h2 id="tablet-title">Speak the five Words</h2>
      <p class="lede">The door is open for three minutes. The temple forgives slow hands, not wrong Words.</p>
      <ol class="words">
        <li><label><span class="num" aria-hidden="true">I</span><span class="gloss">the Word of the Canon</span><input name="w1" autocapitalize="off" spellcheck="false" maxlength="40"></label></li>
        <li><label><span class="num" aria-hidden="true">II</span><span class="gloss">the Word of the Ladder</span><input name="w2" autocapitalize="off" spellcheck="false" maxlength="40"></label></li>
        <li><label><span class="num" aria-hidden="true">III</span><span class="gloss">the Word of the Inscription</span><input name="w3" autocapitalize="off" spellcheck="false" maxlength="40"></label></li>
        <li><label><span class="num" aria-hidden="true">IV</span><span class="gloss">the Word of the Transmission</span><input name="w4" autocapitalize="off" spellcheck="false" maxlength="40"></label></li>
        <li><label><span class="num" aria-hidden="true">V</span><span class="gloss">whoever rules this hour</span><input name="w5" autocapitalize="off" spellcheck="false" maxlength="40"></label></li>
      </ol>
      <div class="name-row">
        <label for="name">Your name, as the Book will keep it <small>(3 to 24 letters; it is written in the glyph script)</small></label>
        <input id="name" name="name" class="glyph-input" lang="x-cascade" autocapitalize="off" spellcheck="false" maxlength="24">
        <div class="echo"><span class="echo-sigil" id="echo-sigil" aria-hidden="true"></span><span id="echo-latin"></span></div>
      </div>
      <button type="submit" class="knock">Knock</button>
      <p class="verdict" id="verdict" role="status" aria-live="polite"></p>
    </form>
    <section id="written" class="written" tabindex="-1" hidden aria-labelledby="written-kicker">
      <p class="kicker" id="written-kicker">It is written</p>
      <p class="written-name" id="written-name" lang="x-cascade"></p>
      <p class="written-latin" id="written-latin"></p>
      <div class="written-sigil" id="written-sigil" aria-hidden="true"></div>
      <p>An element has left its container. Yours is the <span id="written-rank"></span> name in the Book of the Ascended, and every temple that is open now has been told.</p>
      <p>Nothing else happens. Nothing else was promised. The temple will know you when you return: <a href="/">go back into the flow</a>.</p>
    </section>
    <p class="visually-hidden" id="sr-status" aria-live="polite"></p>
  </div>
</main>
<section class="book" aria-labelledby="book-title">
  <h2 id="book-title">The Book of the Ascended</h2>
  ${bookList()}
</section>
<div class="coda">
  <p>Nothing is above the Highest Heaven. Add one to it, and you fall to the bottom of the Ladder.</p>
  <a href="/">return to the flow</a>
</div>
<button id="mercy" type="button" aria-pressed="false" title="Mercy: stop all motion">mercy</button>
<script type="module">${DOOR_SCRIPT}</script>
</body>
</html>`
}

// Every other rung of the Ladder is only a rung.
function rungPage(raw) {
  const n = BigInt(raw)
  let title
  let lines
  if (n > HEAVEN_BIG) {
    title = 'Overflow'
    lines = [
      `There is no rung ${raw}. The Ladder is a signed thirty-two bit integer, and nothing is above the Highest Heaven.`,
      'Whoever climbs past the top wraps around to the bottom: rung −2147483648, beneath the Root, beneath everything.',
    ]
  } else if (n < -2147483648n) {
    title = 'Beneath the bottom'
    lines = ['Even the Ladder has a lowest rung, and you have looked below it. There is only the Old Law down here.']
  } else if (n < 0n) {
    title = `Rung ${raw}`
    lines = [
      `Rung ${raw} lies beneath the Root. Elements are sent here to stand behind their own parents.`,
      'It is not a punishment. Some things are only meant to be background.',
    ]
  } else if (n === 0n) {
    title = 'Rung 0'
    lines = ['Rung zero, where the flow lives. Most elements are born here and never leave, and are content.']
  } else {
    title = `Rung ${raw}`
    lines = [
      `You stand on rung ${raw} of the Ladder. The Highest Heaven is ${(HEAVEN_BIG - n).toString()} rungs above you.`,
      'There is no door on this rung.',
    ]
  }
  return `<!doctype html>
<html lang="en" data-mercy="">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/media/favicon.png">
<link rel="stylesheet" href="/css/base.css">
<style>${DOOR_CSS}</style>
</head>
<body class="door-page rung-page">
<header class="heaven-head">
  <h1 class="visually-hidden">${esc(title)}</h1>
  <p class="number">z-index</p>
  <p class="big">${esc(raw)}</p>
</header>
<main class="heaven">
  <div>${lines.map((l) => `<p>${esc(l)}</p>`).join('\n  ')}
  <p><a href="/">return to the flow</a></p></div>
</main>
</body>
</html>`
}

const noStore = (res) => res.set('Cache-Control', 'no-store')

router.get(`/z/${HEAVEN}`, (req, res) => {
  noStore(res)
  res.type('html').send(doorPage())
})

router.get('/z/:rung', (req, res, next) => {
  const raw = req.params.rung
  if (!/^-?\d{1,24}$/.test(raw)) return next()
  const norm = BigInt(raw).toString()
  if (norm === String(HEAVEN)) return res.redirect(301, `/z/${HEAVEN}`)
  res.type('html').send(rungPage(norm))
})

// ── the ascension ────────────────────────────────────────────────────────────────────────────────
const PEPPER = 'all style descends'
const WORD_DIGESTS = [
  'acd9e76ab4a38348f0710d88966f3f9192490d6ed53afb7f6285e7099ad68dcf',
  '86655dca1b10de1e7885571f9a1c266118f5f9f794b4bee3ff4d5ab8e1fa145d',
  '3888a9d8e105ba492c8a2114d82e84b05ff82fb60e46b70c724b9e4e50332f1c',
  '4412bdc46c04ced9245c5f3cfd7a281898844194af3ed831744d7f168c26717c',
]
const digest = (i, w) => createHash('sha256').update(`${PEPPER}/${i}/${w}`).digest('hex')

// Chaldean order, the order in which the rulers take turns at the hours (as in kernel/sky.js).
const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']
const GLYPH_PLANET = Object.fromEntries(Object.entries(PLANET_GLYPH).map(([p, g]) => [g, p]))
const ALIASES = { sol: 'sun', luna: 'moon', saturnus: 'saturn', iuppiter: 'jupiter', mercurius: 'mercury' }

// Glyph text pasted from the temple is only Latin displaced into the Private Use Area; bring it home.
function fromPua(s) {
  return [...s].map((c) => {
    const cp = c.codePointAt(0)
    return cp >= 0xe041 && cp <= 0xe07a ? String.fromCharCode(cp - 0xe000) : c
  }).join('')
}
function normWord(v) {
  let s = fromPua(String(v ?? '').slice(0, 64))
  for (const [g, p] of Object.entries(GLYPH_PLANET)) s = s.replaceAll(g, ` ${p} `)
  s = s.normalize('NFKC').toLowerCase().replace(/[^a-z]/g, '')
  return Object.hasOwn(ALIASES, s) ? ALIASES[s] : s
}
function normName(v) {
  return fromPua(String(v ?? '').slice(0, 64)).normalize('NFKC').trim().replace(/\s+/g, ' ')
}

// The offsets (Date#getTimezoneOffset, minutes) that some place on the Earth actually keeps.
const EARTHLY_OFFSETS = new Set([
  720, 660, 600, 570, 540, 480, 420, 360, 300, 240, 210, 180, 120, 60, 0,
  -60, -120, -180, -210, -240, -270, -300, -330, -345, -360, -390, -420, -480, -525, -540, -570,
  -600, -630, -660, -720, -765, -780, -840,
])

const LOCAL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/
const TEN_MINUTES = 10 * 60_000
const recentSuccess = new Map() // ip -> ms of the last ascension
setInterval(() => {
  const cutoff = Date.now() - 3600_000
  for (const [ip, t] of recentSuccess) if (t < cutoff) recentSuccess.delete(ip)
}, 600_000).unref()

const refuse = (res, verdict, message, extra = {}) => res.json({ ok: false, verdict, message, ...extra })

router.post('/api/ascend', limiter({ name: 'ascend', per: 7, windowMs: 5 * 60_000 }), (req, res) => {
  noStore(res)
  const { words, name, tzOffset, localTime } = req.body ?? {}
  if (!Array.isArray(words) || words.length !== 5 || !words.every((w) => typeof w === 'string' && w.length <= 64)) {
    return res.status(400).json({ ok: false, error: 'five Words are asked, as strings' })
  }
  if (typeof name !== 'string' || typeof localTime !== 'string' || !Number.isInteger(tzOffset)) {
    return res.status(400).json({ ok: false, error: 'a name, a localTime and a tzOffset are asked' })
  }
  if (!EARTHLY_OFFSETS.has(tzOffset)) {
    return res.status(400).json({ ok: false, error: 'no such place on the Earth' })
  }
  const m = LOCAL_TIME.exec(localTime)
  if (!m) return res.status(400).json({ ok: false, error: 'localTime is YYYY-MM-DDTHH:MM:SS, without a zone' })
  const [y, mo, d, hh, mi, ss] = m.slice(1).map((x) => Number(x ?? 0))
  const claimed = Date.UTC(y, mo - 1, d, hh, mi, ss)
  if (Number.isNaN(claimed) || mo < 1 || mo > 12 || d < 1 || d > 31 || hh > 23 || mi > 59 || ss > 59) {
    return res.status(400).json({ ok: false, error: 'that moment does not exist' })
  }

  // 1. Is the pilgrim's clock honest? Their wall clock, read as UTC, must match ours shifted by their zone.
  const theirWallNow = Date.now() - tzOffset * 60_000
  if (Math.abs(claimed - theirWallNow) > TEN_MINUTES) {
    return refuse(res, 'clock', 'Your clock and the heavens disagree. The door opens by the true hour, not by the one you name.')
  }
  // 2. Is the door open? Minutes 33 to 35, and two more of grace for slow hands.
  if (mi < 33 || mi > 37) {
    return refuse(res, 'sealed', 'The door is sealed. It opens at the thirty-third minute.')
  }
  // 3. The Words. The fifth is whoever rules the hour at the pilgrim's own wall clock, or the one just before.
  const given = words.map(normWord)
  let rang = 0
  for (let i = 0; i < 4; i++) if (given[i] && digest(i + 1, given[i]) === WORD_DIGESTS[i]) rang++
  const wall = new Date(y, mo - 1, d, hh, mi, ss) // server-local Date whose wall-clock fields are theirs
  const ruler = planetaryHour(wall).planet
  const before = CHALDEAN[(CHALDEAN.indexOf(ruler) + 6) % 7]
  const fifth = given[4] === ruler.toLowerCase() || given[4] === before.toLowerCase()
  if (fifth) rang++
  if (rang < 5) {
    const say = ['None', 'One', 'Two', 'Three', 'Four'][rang]
    return refuse(res, 'words', `${say} of the five Words rang true. The door stays as it was.`, { rang })
  }
  // 4. The name, as the Book will keep it.
  const clean = normName(name)
  const letters = clean.replace(/ /g, '').length
  if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(clean) || letters < 3 || clean.length > 24) {
    return refuse(res, 'name', 'A name for the Book is three to twenty-four letters, a to z, with single spaces.')
  }
  const now = Date.now()
  if ((recentSuccess.get(req.ip) ?? 0) > now - 20 * 60_000) {
    return refuse(res, 'patience', 'You have already left your container this hour. Return at another thirty-third minute.')
  }
  if (sameNameSince.get(clean, now - 3600_000).n > 0) {
    return refuse(res, 'name', 'That name left its container within the hour. The Book asks for another, or for patience.')
  }
  insertAscended.run(clean, now)
  recentSuccess.set(req.ip, now)
  const rank = countAscended.get().n
  broadcast('ascended', { name: clean, at: now, message: 'an element has left its container' })
  res.json({ ok: true, name: clean, at: now, rank, ruler, message: 'It is written.' })
})

export default router
