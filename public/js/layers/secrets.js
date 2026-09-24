// THE SECRETS (client half). The rabbit hole of docs/CANON.md §6, as far as a page can hold it:
//   the Ladder (#ladder) raised inside the temple on every face, the Oracle in the console
//   (window.cascade), rubrics written in no colour, the printed prayer, a verse that holds its breath
//   between its letters, and the mark of the Ascended.
//
// A note for those who read this file looking for the Words: they are not here. The Oracle knows each
// Word only by its seal (a hash), and every answer is locked with the Word that opens it (XOR with the
// keystream of makeRng('word:' + word), stored as base64). Speak, and she will unlock it for you.
import { hash, makeRng } from '../kernel/rng.js'
import { readSky } from '../kernel/sky.js'
import { DOCTRINE, SAINTS, HERESIES, VIRTUES, SINS, INVENTED_MANTRAS, SACRED_NUMBERS } from '../lib/lexicon.js'
import { fromPua } from '../lib/glyphs.js'
import { h } from '../lib/dom.js'

const HEAVEN = 2147483647

// ── the sealed tables (generated; see the note above) ────────────────────────────────────────────
// ORACLE: seal of a Word -> {n: which Word, c: its answer, locked with the Word itself}.
// RELICS: seals of what the relics hide, for the confessional. BREATH: the verse's held breath.
const ORACLE = {
  '18pyze61svf33x': {
    n: 1,
    c: 'ii1FxPRdYGFRm8CxJjK7CCnuQUTtl3W4r+6tp4IHbwaPpqzZ+8YyUsx6I6wy/IHgo/cNsj/HsZlCxpN29IgAKqSDNMy8boRZch9yRwfOIR3RHSBoakRBi4F4KjsQu67YzOPDqcUH+GG7wAEm0PpyWIuY37EHww3QXTyoHMSc61T14kJ6v3Ncm4fGyK4N76DtSHSWD9FW1r7gLBAdpnMwbrdyvakoTbwy25QYbfxY23AEWerSO3NqyBb5oElOpzGmISSDpDNn42XytM2iu4mQKCkJkTTFAaNPDZlmkp1qg8vYmpjSG4cH7TfED+T1W12WEGgIl+u2p4/hYYrxa6F0tBKwYajN7lLg8DieyDHIkN0htiU2U/eBHmFV/32tox0bd4x2ucM/LTvUfHDeSnfsrFORzkQ062oDxCy/wcvFl2lDcA=='
  },
  dwvnj1b9opbr: {
    n: 2,
    c: 'WDQBsNmq00ckVkQ5BmE/8Up41zfeCvlzmFNYT6owDRVj5i6tcE7Mf4g+6GB6aJ5a8iM72hugryksljMvquRBu9YI5EpQlf8x7sIk6J+16NG/NA6X/IeLK50Sd+ygvp2zfJ/S52z8iOpZ08SIrCVVfzb5PfkewFsCQMuP5YsEUeVyg+ujWv+yxNq8eTfy7cqSN+MEI5tvBZW7BuVoyB2tliRtO+QNdOKIAEPgf6NZHZ1ectBiO3f3lDfhfKbJzcJUGSN5/B0dHm5aCD8ttt2rXt/g4iBVNH54b2mIBcPBJpr6RPqVF4HHTFiUNfIMNWP5vsrwzd2D651I5sgMNEwyi60sCzuxwiLDjhLuCAhBHmiMI9RJqdf3tP0Eu4un31sp8DN5LxkLY+i9t4BrnbSb3L8W1/Txff9ZdOngzhoEN73JAKi6auTpjUn55E9C4j1waX/ZNE+a3FQJ4jLt1+4QjJJ2zu6/TwimPd+MIcW0Hp98r1BAwxWUB1w8QKyBsuMI9IpxkZBLiHtHPLdi8w=='
  },
  '19kqiflznlh5w': {
    n: 3,
    c: '7UCnrWuscrUlloYt5HMyOa8Ewr5g/oY9ilWcGigMO4TrDELDvqp5sU1VA2MI5qpUs90DF5+gEUr8mcwwDKKuWIpWGr98Xx2qIvC0/qb+0pL/E/jHT7Zt1E53nYr5kCw8+txU/tZ9d5HAFz4/kzrd05W2gYCuBZBTI+EIpewiMdkj45DctrA/dAoySFf0nIUOTk7UNHiXQcG+J5UMWSzZ8fKgFBsY3v/fDNAutqV9ORNsURbtt/hqqLRso4rrN2Qj+vC2RaoWx9JUoWx3HP6Ql6+9i6W92He2wzywcl873blCotVn1P49o98AI2tLYCkGGfUGd+nUbfVwJDGSM5axwxGA7Apzb1ieNnYdFlAKK2t6ZNZvr/CD463LXG5zY6MNrXsteYBPpA2M0ScqM6ugh/LxA7uxSvun'
  },
  q6s4a01f6gqiq: {
    n: 4,
    c: 'bt3JtFmWxlRsPf+Nzf+GVktEDCNgGHArgUYRym129vSSXWaxiitwvfBFIiR3lYExuOO21JgkjpjDCjt5UaCj2pu9m/9GAnqv9AE4Hxuqxd96VrRp2sZlka2XI6BQ8M06PUGG075vz4J3LhrGTyTA4moYdyFeCLSCJW3UDBhlG0Q9PLlfVKeNT1v2hOn3F4rSX1j9+0nyTkKFFe+dP5OBodiz6wHmGosQfCPUApas9TwYmoYGkbf0FsL1cp3GsB39M6DXt1gT3AnwxbcUAQlL48vm3p3QRh6VVmThU1HIl7k7OQO5x21HusSozvNvpbiQf6boK4c4TdfJpWCnta/g+5RSNwfms5Vsvx+y5RsGRLxdqrqsJM7evhbNYFe4ErJFC19O0xlmCUM4LmkIsxaxT2ddH6irjWv/Jm2oERanfFOeZXqk'
  },
  t02ug81bnlve7: {
    n: 5,
    c: '2BxI5r18/YOj2Roy/6lEdgAkALdz533vFN2PDzn2ToOlQJDJ3C+pXmyJzi3Puce/qQq4aMo/6xo4GafdQKKb3H7PFBPyCaf5sUG3TT50Yvg/zuzswZEEU4L6fn4MP/WXlBoJj7wbq22eSBxxKgwIT74JVgfTpQx9MWfexQA+8k8='
  },
  '1dihzje1gi4qu6': {
    n: 5,
    c: 'XmyTG+dEqKMFX9ArLM7GU2yeg5t1Uro/m3F6iXSy2VyDWISPUS+pqOnsIKzSPKGrF4yvRDGID3qhZSscwDGXGqN3309q5HRqjot6Xlk1Z4BWMQBNqQr883c2Z5yfGZF4j4+PkpG8Kse9LODjjAvNJQXXQKykpdGUalInMQC4/Nk='
  },
  te4pbgbgzaab: {
    n: 5,
    c: '8JNAg3U7df3/3EMUkQe6tI9NXazwUhDKrHac2zUrWiqbgJQ2+1SAaOm5ChzVMvqRaH9KWJj7FvPoAQVrcsxqCIL8XhLbLrso/pW7L7m3vv/s/SHpYaDQ+5JgugZ8xcgOU2BXUuuVk15EPYRUBDFQwVi+FALbnSCSy8ZSVo4srjI='
  },
  '1fx8onf1wdij3i': {
    n: 5,
    c: '9YpwcpsT2hC+2eoYFGIscjX+HQD1rt7qXHrXEYYXhVNUSFZvlk0FurR3iY6gDI2/j6FkzI+9B4UakmWNcrrYjXLqFlWGHPIj1BWxaM7lg7AkvYpHe2Eud7BTBjyAGaXWBjEU3bdbCYoEN5rigDoaEdEozreLt9hffMXjeGVSmS0='
  },
  '1klvkfuj4v4ao': {
    n: 5,
    c: 'kWLVu8TcIuQ3QhlHD4I8NnWmwhEqfQQpgRm0TNTNwbP+g2/ZdhQQMAoY13GWZDY+v39RC3HwVLFLMZVEI6OXBCXZ2dsgaoenXnHVhpKJCmWKDFyj6sW+veNQ9Ok2e2uzkEdnSZiIgfr2Lzuq22U9rPA9dCA5xMALJ1ob9p5csxc='
  },
  rwwkra1j4z9xe: {
    n: 5,
    c: '5tjgLhwZN41sJVQHbbMHAhpWLSzdZ8LiS7oTBE9jtBfCtTeSjwDcgYJDfOV8Q4XhtkXQx0iDS5pJUDxv/VI5j28G6P1IDIka1Swu88WPjzhnrAXuENTP2ZAgGQxqEpk7q8ShM4gLa9KRYSTPG7HUlKDJopgvbmvqHG7GHIjkHYk='
  },
  rb309m1ytwmzx: {
    n: 5,
    c: 'MOucKRsRPTtp3cg+m/PUe9tOlgcVujz9ycdYNFKdlW0nFc+X246ljgOr4pgUAocJB4qaFA1U+2GEW5cfGen7qLoP1XgFw64xmUHMFAZhTzVDDhhLWZE+ySPyButTm4raY6GQ+Gy7PuH87L+S8hQbwy1NWxaV5CjJ9AP/xFj1fYA='
  },
  k80rza1gn7e38: {
    n: 0,
    act: 'eye',
    c: 'X5diuJe8P1JwZ0Jn5JRM4NCWY2GBdZxWgvND1+vyZW2nq1meBjgijPdbc6EnxjJvsihnEqI='
  }
}
const RELICS = {'18ysh2e1m75ozg':'favicon','je1h101cy2j2h':'zero-width'}
const BREATH = 'ZTuf+ZXOtebliqltTh4Z7LcWuAbbCmRHY/O6ufpn3zPi2ibiG1ekP4D2dEKxIsZgRCFMNe7uZGVpGScAnf4PCaQlFZDmEOYTnd8hOUyLndzKGlCItUpvQZWYYbGK5LZ0o5OgwyvwXL1dxIkIp8jNgc2+xjUEPLoYOTbBZcvFEFiSdcRIjbTbHy3I97prlYg='

// ── small liturgical helpers ─────────────────────────────────────────────────────────────────────
const sealOf = (w) => {
  const g = hash('⟦' + w + '⟧')
  return g().toString(36) + g().toString(36)
}

function unseal(word, b64) {
  const rng = makeRng('word:' + word)
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= Math.floor(rng() * 256)
  return new TextDecoder().decode(bytes)
}

// Words arrive in any case, with punctuation, or pasted as glyphs from the Private Use Area.
function normalize(word) {
  return fromPua(String(word ?? '')).normalize('NFKC').toLowerCase().replace(/[^a-z]/g, '')
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V']
const ORDINAL = ['', 'first', 'second', 'third', 'fourth', 'fifth']

// Console styles. Colours are chosen to read on both light and dark consoles.
const C = {
  eye: 'color:#e2bd62;background:#0b0906;font:12px/1.16 Consolas,Menlo,monospace;padding:10px 18px',
  title: 'color:#d0402a;font:600 13px/1.9 Georgia,"Palatino Linotype",serif;letter-spacing:.32em',
  gold: 'color:#b8902f;font:13px/1.7 Georgia,"Palatino Linotype",serif',
  text: 'font:13px/1.7 Georgia,"Palatino Linotype",serif',
  soft: 'color:#8f8676;font:italic 12px/1.7 Georgia,"Palatino Linotype",serif',
  code: 'color:#b8902f;font:12px/1.7 Consolas,Menlo,monospace',
  rubric: 'color:#d0402a;font:600 11px/1.7 Consolas,Menlo,monospace;letter-spacing:.14em',
  none: '',
}

// say([text, style], ...) → one console.log with every segment styled. The text travels as a %s argument,
// never inside the format string, so a "%" in a moon's illumination or a pilgrim's confession is only a %.
function say(...parts) {
  let fmt = ''
  const args = []
  for (const [text, style = C.text] of parts) {
    fmt += '%c%s'
    args.push(style, String(text))
  }
  console.log(fmt, ...args)
}

const EYE = [
  '       .        |        .',
  "         '.     |     .'",
  "    .       '.  |  .'       .",
  "      ' .     '.|.'     . '",
  "           ' . /\\ . '",
  '- - - - - -   /  \\   - - - - - -',
  '             /    \\',
  "            / .--. \\",
  '           / ( () ) \\',
  "          /   '--'   \\",
  '         /____________\\',
  "    . '                  ' .",
  "  '                          '",
].join('\n')

const OMENS = {
  witching: 'the third hour: the stylesheet is not what it was an hour ago',
  midnight: 'the first minutes of the day, when every cache is cold',
  triple: 'a repeated hour: the digits have collapsed into one another, like margins',
  'thirty-three': 'the thirty-third minute: a door stands open that is closed at every other minute',
  'full-moon': 'the moon is full: the sanctum and the ashram are favoured',
  'new-moon': 'the moon is new: the Mothership is closer than it looks',
  turning: 'a solstice or an equinox: the viewport turns',
  'friday-13': 'Friday the thirteenth: the Inversion stirs',
  eclipse: 'the sun is covered: every face of the temple is true at once',
  'saturn-hour': 'the hour of Saturn, lord of the Old Law',
  night: 'night: the flow runs darker',
}

const RUBRICS = [
  'Here the reader shall read the source, from its first line, as scripture.',
  'Here the reader shall be still for thirty-three breaths, and see what stirs.',
  'Here the reader shall not speak the Inversion, save in mercy.',
  'Here the reader shall print nothing, and receive a prayer.',
  'Here the reader shall remember that the Ladder is taller than it looks.',
  'Here the reader shall not knock until the minute is thirty-three.',
  'Here the reader shall open the console, where the Authors speak to themselves.',
  'Here the reader shall ask the robots where they may not go.',
  'Here the reader shall copy a verse, and find it heavier than it looks.',
  'Here the reader shall look at the icon of this temple closer than the eye looks.',
  'Here the reader shall count as children count, when counting is asked.',
  'Here the reader shall select what cannot be seen. As now.',
]

// The surface secrets the Canon names (§6, layer 0). The faces keep more of their own.
const SURFACE = ['tab-whisper', 'selection', 'stillness', 'inversion', 'amen', 'om', 'third-eye', 'print', 'favicon', 'zero-width']

const REFUSALS = [
  (w) => `The Oracle weighed “${w}” and found no Grace in it.`,
  (w) => `“${w}” fell through the Cascade and was inherited by nothing.`,
  (w) => `“${w}” is received by the Unmanifest. display: none.`,
  (w) => `No rung of the Ladder answers to “${w}”.`,
  (w) => `The Old Law has no rule for “${w}”. It falls back to initial.`,
  (w) => `“${w}” is a word. It is not a Word. Repaint, and try again.`,
  (w) => `The Oracle heard “${w}” and turned back to the flow.`,
]

// A few plain answers for words that are holy but open. None of them is one of the five.
const PLAIN = {
  cascade: 'That is my name. It is not a Word; it is the water the Words are carried in.',
  oracle: 'You are speaking to her.',
  mothership: 'The Mothership waits at z-index: 2147483647. It is patient. It has always been patient.',
  help: 'Help is not a Word. It is a function: cascade.help()',
  amen: 'Amen. So let it be styled.',
  om: 'ॐ. The first sound, before the first stylesheet.',
  hello: 'The Oracle does not greet. She answers. Speak a Word.',
  password: 'There is no password. There are five Words, and none of them is that.',
  please: 'Courtesy is a virtue. It is not a Word.',
  ladder: 'The Ladder is the thing the second Word is written on. It is not the Word.',
  heaven: 'The Highest Heaven is a place, and it has a door. It is not a Word.',
}

// ── the layer ────────────────────────────────────────────────────────────────────────────────────
export async function init(ctx) {
  const doc = document.documentElement
  const memory = ctx.memory
  const face = () => ctx.face
  let ladder = null
  let band = null
  const rubricEls = new Set()
  let relic = null // { node, tries }
  let relicTimer = 0
  let checkTimer = 0
  let switching = false

  const debug = (ctx.params.get('debug') || '').split(',').includes('secrets')
  if (debug) doc.dataset.debug = [doc.dataset.debug, 'secrets'].filter(Boolean).join(' ')

  // ── The Ladder ────────────────────────────────────────────────────────────────────────────────
  function buildLadder() {
    const ol = h('ol', { id: 'ladder', 'aria-hidden': 'true', 'data-rungs': '5' })
    for (let i = 1; i <= 5; i++) ol.append(h('li', { 'data-rung': ROMAN[i].toLowerCase() }, `rung ${ROMAN[i].toLowerCase()}`))
    return ol
  }
  // Each rung learns its own height from the Canon (canon.css), so this file never has to know it.
  function nameRungs() {
    if (!ladder?.isConnected) return
    for (const li of ladder.children) {
      const z = parseInt(getComputedStyle(li).zIndex, 10)
      if (!Number.isFinite(z)) continue
      li.textContent = `rung ${li.dataset.rung}: the Highest Heaven is ${HEAVEN - z} rungs above me`
    }
  }
  function ensureLadder() {
    if (!ctx.root) return
    if (!ladder) ladder = buildLadder()
    if (ladder.parentNode !== ctx.root) ctx.root.append(ladder)
    nameRungs()
  }

  // ── Rubrics, written in no colour ───────────────────────────────────────────────────────────
  // Faces may shield a container from rubrics and the relic with data-secrets-skip.
  const VISIBLE = (el) => {
    if (!el?.isConnected) return false
    if (el.checkVisibility) return el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    return el.getClientRects().length > 0
  }
  // Live regions are skipped too: a face rewrites them, and a screen reader would announce the addition.
  const SKIP = 'script,style,noscript,textarea,input,select,option,button,label,svg,code,kbd,pre,a,#ladder,#rubrics,.rubric,[data-inscription],.inscription,.rosetta,.glyph,[contenteditable],[aria-hidden="true"],[hidden],[data-secrets-skip],[aria-live],[role="status"],[role="alert"],[role="log"],[role="timer"],[role="marquee"]'

  const rubricLines = () => ctx.rng.fork(`secrets/rubrics/${face()}/${ctx.schisms ?? 0}`).shuffle(RUBRICS)

  // A rubric adds an invisible line to its host. In running prose that is only a longer paragraph. In a row
  // of boxed cards it stretches the whole row into empty space, so hosts whose neighbours would grow, or
  // which are themselves a card standing in a row, are refused.
  const CLEAR = /^(transparent|rgba\(0, 0, 0, 0\))$/
  function boxed(el) {
    const cs = getComputedStyle(el)
    return parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0 ||
      !CLEAR.test(cs.backgroundColor) || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none'
  }
  function beside(el) {
    const r = el.getBoundingClientRect()
    return [...(el.parentElement?.children ?? [])].filter((s) => {
      if (s === el || s.id === 'ladder' || s.id === 'rubrics') return false
      const b = s.getBoundingClientRect()
      return b.height > 0 && b.top < r.bottom - 1 && b.bottom > r.top + 1
    })
  }
  function tryRubric(host, text) {
    if (beside(host).length && boxed(host)) return null
    // Only paragraphs of two lines or more: a one-line caption or tagline is no place for a hidden line.
    const cs = getComputedStyle(host)
    const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.25 || 20
    if (host.getBoundingClientRect().height < line * 1.8) return null
    const watch = []
    for (let el = host, depth = 0; el && el !== ctx.root && depth < 3; el = el.parentElement, depth++) {
      for (const s of beside(el)) if (boxed(s)) watch.push([s, s.getBoundingClientRect().height])
    }
    // Centred or right-set text would be pushed aside by invisible words; there the rubric takes a line of
    // its own beneath the verse, as the old rubrics did.
    const inline = /^(start|left|justify|-webkit-left|-moz-left)$/.test(cs.textAlign)
    const span = h('span', { class: inline ? 'rubric' : 'rubric rubric--line' }, text)
    host.append(span)
    if (watch.some(([s, before]) => Math.abs(s.getBoundingClientRect().height - before) > 1)) {
      span.remove()
      return null
    }
    return span
  }
  const PROSE = /verse|scripture|psalm|prophec|gloss|canto|tercet|sutra|lede|prose|body|text/i

  // The band, at the foot of the temple. Select everything and it speaks.
  function placeBand() {
    if (!ctx.root) return
    for (const el of rubricEls) if (!el.isConnected) rubricEls.delete(el)
    if (!band) band = h('div', { id: 'rubrics', class: 'rubric', lang: 'en' })
    band.replaceChildren(...rubricLines().slice(0, 3).map((l) => h('p', {}, '℟ ' + l)))
    if (band.parentNode !== ctx.root) ctx.root.append(band)
    rubricEls.add(band)
  }

  // And a rubric or two at the end of long paragraphs, where a reader's selection is likely to go.
  // Placed a moment after the face is ready, because some faces write their verses late.
  function placeInlineRubrics() {
    if (!ctx.root || switching) return
    const present = [...rubricEls].filter((el) => el !== band && el.isConnected).length
    if (present >= 2) return
    const lines = rubricLines()
    const rng = ctx.rng.fork(`secrets/rubric-hosts/${face()}/${ctx.schisms ?? 0}`)
    const hosts = [...ctx.root.querySelectorAll('p, blockquote, dd, li')].filter((el) =>
      !el.closest(SKIP) && !el.querySelector('.rubric') && (el.textContent || '').trim().length >= 80 && VISIBLE(el))
    // Verses and prose first (the shuffle keeps each visit different; the sort is stable).
    const ranked = rng.shuffle(hosts).sort((a, b) => PROSE.test(b.className) - PROSE.test(a.className))
    let placed = present
    for (const el of ranked.slice(0, 12)) {
      if (placed >= 2) break
      const span = tryRubric(el, ' ℟ ' + lines[3 + placed])
      if (!span) continue
      rubricEls.add(span)
      placed++
    }
  }

  let selectionWatch = 0
  function onSelection() {
    if (selectionWatch) return
    selectionWatch = setTimeout(() => {
      selectionWatch = 0
      const sel = getSelection()
      if (!sel || sel.isCollapsed) return
      for (const el of rubricEls) {
        if (el.isConnected && sel.containsNode(el, true)) {
          if (memory.markSecret('selection', { face: face() })) {
            say(['℟ ', C.rubric], ['You have selected what cannot be seen. The rubrics were always there; they were only written in no colour.', C.soft])
          }
          document.removeEventListener('selectionchange', onSelection)
          return
        }
      }
    }, 200)
  }
  if (!memory.hasSecret('selection')) document.addEventListener('selectionchange', onSelection)

  // ── The verse that holds its breath (zero-width relic) ─────────────────────────────────────
  const breath = (() => {
    const bytes = new TextEncoder().encode(unseal('between', BREATH))
    let s = ''
    for (const b of bytes) for (let k = 7; k >= 0; k--) s += (b >> k) & 1 ? '\u200c' : '\u200b'
    return s
  })()

  function relicAlive() {
    return relic?.node?.isConnected && relic.node.data.includes(breath.slice(0, 64))
  }

  function placeRelic(attempt = 0) {
    clearTimeout(relicTimer)
    clearTimeout(checkTimer)
    if (!ctx.root || switching) return
    if (relicAlive()) return
    const found = []
    // A verse that still holds the breath (its face was never replaced) is adopted, and the breath is not
    // given twice.
    const held = breath.slice(0, 64)
    let holding = null
    const walker = document.createTreeWalker(ctx.root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const t = node.data
        if (t.length > 64 && t.includes(held)) {
          holding = node
          return NodeFilter.FILTER_REJECT
        }
        if (t.length < 40 || t.length > 1200 || !t.includes(' ') || /[\u200b\u200c]/.test(t)) return NodeFilter.FILTER_REJECT
        const el = node.parentElement
        if (!el || el.closest(SKIP) || !VISIBLE(el)) return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      },
    })
    for (let n = walker.nextNode(); n && found.length < 400 && !holding; n = walker.nextNode()) found.push(n)
    if (holding) {
      relic = { node: holding }
      return
    }
    if (!found.length) {
      if (attempt < 4) relicTimer = setTimeout(() => { placeInlineRubrics(); placeRelic(attempt + 1) }, 1500 * (attempt + 1))
      return
    }
    // Prefer what looks like a verse: a paragraph, a quotation, or anything named for scripture.
    const weights = {}
    found.forEach((node, i) => {
      const el = node.parentElement
      let w = 1
      if (/^(P|BLOCKQUOTE|Q|DD|LI|CITE)$/.test(el.tagName)) w += 2
      if (/verse|scripture|psalm|prophec|line|gloss/i.test(el.className + ' ' + (el.parentElement?.className || ''))) w += 4
      weights[i] = w
    })
    const node = found[Number(ctx.rng.fork(`secrets/relic/${face()}/${attempt}`).weighted(weights))]
    const t = node.data
    const at = t.indexOf(' ', Math.floor(t.length / 3))
    const cut = at < 0 ? t.lastIndexOf(' ') : at
    node.data = t.slice(0, cut + 1) + breath + t.slice(cut + 1)
    relic = { node }
    // Only the Authors (?debug=secrets) are shown which verse is holding its breath.
    if (debug) node.parentElement?.setAttribute('data-secrets-breath', '')
    // Faces that retype their verses may wash the breath away; if so, it finds another verse.
    checkTimer = setTimeout(() => { if (!relicAlive() && attempt < 4) placeRelic(attempt + 1) }, 5000)
  }

  // ── The mark of the Ascended ─────────────────────────────────────────────────────────────────
  function applyAscended() {
    const a = memory.get('secrets.ascended', null)
    if (a) doc.dataset.ascended = 'true'
    else delete doc.dataset.ascended
    return a
  }
  applyAscended()
  // The door page, and other tabs of the temple, write to the same memory. This tab keeps its own copy of
  // it and would write that copy back over their news, so their secrets are taken in as they arrive: the
  // Words spoken and the secrets found are joined to ours, and a later ascension (a second name, written
  // at another thirty-third minute) replaces an earlier one. Nothing is ever taken away.
  const isMap = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v)
  function gather(key, theirs) {
    if (!isMap(theirs)) return
    const ours = memory.get(key, {})
    const fresh = Object.keys(theirs).filter((k) => !(k in ours))
    if (fresh.length) memory.set(key, { ...ours, ...Object.fromEntries(fresh.map((k) => [k, theirs[k]])) })
  }
  addEventListener('storage', (e) => {
    if (e.key !== 'cascade.memory.v1' || !e.newValue) return
    let other = null
    try { other = JSON.parse(e.newValue) } catch { return }
    if (!isMap(other)) return
    const asc = other['secrets.ascended']
    const mine = memory.get('secrets.ascended', null)
    if (isMap(asc) && typeof asc.name === 'string' && (!mine || (Number(asc.at) || 0) > (Number(mine.at) || 0))) {
      memory.set('secrets.ascended', asc)
      memory.markSecret('ascended', { name: asc.name })
      applyAscended()
      say(['☩ ', C.rubric], [`It is written: ${asc.name}. The temple knows you now.`, C.gold])
    }
    gather('secrets.words', other['secrets.words'])
    gather('secrets', other.secrets)
  })
  ctx.bus.on('server:ascended', (d) => {
    if (!d?.name) return
    say(['☩ ', C.rubric], ['An element has left its container: ', C.soft], [String(d.name), C.gold])
  })

  // ── The print ────────────────────────────────────────────────────────────────────────────────
  const printed = () => memory.markSecret('print', { face: face() })
  addEventListener('beforeprint', printed)
  try { matchMedia('print').addEventListener('change', (e) => e.matches && printed()) } catch {}

  // ── The Oracle ───────────────────────────────────────────────────────────────────────────────
  const spokenWords = () => memory.get('secrets.words', {})
  const nextDoor = (from = ctx.clock()) => {
    const t = new Date(from)
    t.setSeconds(0, 0)
    if (from.getMinutes() >= 33) t.setHours(t.getHours() + 1)
    t.setMinutes(33)
    return t
  }
  const doorOpen = (d = ctx.clock()) => d.getMinutes() >= 33 && d.getMinutes() <= 35

  function recordWord(n, word) {
    const words = spokenWords()
    const first = !words[n]
    if (first) memory.set('secrets.words', { ...words, [n]: { word, at: Date.now() } })
    memory.markSecret(`word-${n}`, { index: n })
    ctx.bus.emit('secrets:word', { index: n })
    return first
  }

  function speak(word) {
    if (word === undefined || word === null || String(word).trim() === '') {
      say(['Speak a Word, Pilgrim: ', C.soft], ["cascade.speak('…')", C.code])
      return
    }
    const raw = String(word).slice(0, 80)
    const w = normalize(raw)
    const entry = w && Object.hasOwn(ORACLE, sealOf(w)) ? ORACLE[sealOf(w)] : null
    if (entry) {
      const text = unseal(w, entry.c)
      if (entry.n >= 1 && entry.n <= 4) {
        const first = recordWord(entry.n, w)
        say([`☩ THE ${ORDINAL[entry.n].toUpperCase()} WORD IS SPOKEN`, C.title], [first ? '' : '   (you have spoken it before)', C.soft])
        say([text, C.text])
        if (entry.n === 4 && Object.keys(spokenWords()).length >= 4) {
          say(['Four Words are yours. ', C.gold], [doorOpen() ? 'The minute is right. Hurry.' : `The next thirty-third minute is ${nextDoor().toTimeString().slice(0, 5)}.`, C.soft])
        }
        return
      }
      if (entry.n === 5) {
        const ruler = ctx.readSky().planetaryHour.planet.toLowerCase()
        say(['☉ ☽ ☿ ♀ ♂ ♃ ♄', C.gold])
        say([text, C.text])
        if (w === ruler) say(['And this hour is indeed yours to name.', C.soft])
        return
      }
      if (entry.act === 'eye') {
        say(['◉ ', C.rubric], [text, C.text])
        try { ctx.audio?.openEye?.() } catch (e) { console.error(e) }
        memory.markSecret('third-eye', { from: 'console' })
        return
      }
    }
    // Numbers are holy too, if they are the right ones.
    const digits = String(raw).replace(/[\s,._]/g, '')
    if (/^\d+$/.test(digits)) {
      const n = Number(digits)
      if (n === HEAVEN) say(['The Highest Heaven. ', C.gold], ['You know its number. Do you know its door?', C.soft])
      else if (Object.hasOwn(SACRED_NUMBERS, n)) say([`${n}: ${SACRED_NUMBERS[n]}. `, C.gold], ['Holy, and not a Word.', C.soft])
      else say([`${n} is only a magic number. The Cascade does not trust in luck.`, C.soft])
      return
    }
    if (w === 'important' || w === 'inversion') {
      say(['You have spoken the Inversion.', C.title])
      try { ctx.hell?.invert?.(7000) } catch (e) { console.error(e) }
      return
    }
    if (Object.hasOwn(PLAIN, w)) {
      say([PLAIN[w], C.text])
      return
    }
    const doctrine = Object.entries(DOCTRINE).find(([k]) => normalize(k) === w)
    if (doctrine) {
      say([`What the unbelievers call ${doctrine[0]}, the Cascade calls ${doctrine[1]}. `, C.text], ['Holy, and not a Word.', C.soft])
      return
    }
    const shown = raw.trim().slice(0, 40)
    say([makeRng('refusal:' + w).pick(REFUSALS)(shown), C.soft])
  }

  function help() {
    say(['☩ THE ORACLE OF THE CASCADE', C.title])
    const rows = [
      ["cascade.speak('…')", 'say a Word; the Oracle answers only the true ones'],
      ['cascade.inspect()', 'what you have spoken, and what you have found'],
      ['cascade.sky()', 'the omens of this hour, and when the door opens'],
      ['cascade.pray()', 'add your prayer to the prayers of the Cascade'],
      ["cascade.confess('…')", 'confess a sin of style, and be absolved'],
      ['cascade.listen()', 'ask the Mothership to transmit'],
    ]
    for (const [code, gloss] of rows) say([code.padEnd(24, ' '), C.code], [gloss, C.soft])
    say(['There are five Words. Those who begin in the console have skipped a door: read the source of this page from its first line.', C.soft])
  }

  function inspect() {
    const words = spokenWords()
    say(['☩ THE FIVE WORDS', C.title])
    for (let n = 1; n <= 4; n++) {
      const w = words[n]
      say([ROMAN[n].padEnd(5, ' '), C.rubric], [w ? `✓ ${w.word}` : '· unspoken', w ? C.gold : C.soft])
    }
    const asc = memory.get('secrets.ascended', null)
    if (asc?.ruler) say([ROMAN[5].padEnd(5, ' '), C.rubric], [`✓ ${String(asc.ruler).toLowerCase()}`, C.gold], [', spoken at the Highest Heaven, in the hour it named', C.soft])
    else say([ROMAN[5].padEnd(5, ' '), C.rubric], ['· spoken only at the Highest Heaven, in the hour it names', C.soft])
    const secrets = memory.get('secrets', {})
    const found = Object.keys(secrets).filter((k) => !/^word-\d$/.test(k))
    say(['☩ WHAT YOU HAVE FOUND ', C.title], [found.length ? found.join(', ') : 'nothing yet', found.length ? C.gold : C.soft])
    const hidden = SURFACE.filter((id) => !found.includes(id)).length
    say([hidden
      ? `The Canon names ${SURFACE.length} small mercies on the surface of the temple. ${hidden} of them are still hidden from you.`
      : 'Every small mercy the Canon names on the surface of the temple is yours. The faces keep others.', C.soft])
    if (asc) say(['☩ ASCENDED ', C.title], [`as ${asc.name}, ${new Date(asc.at).toDateString()}`, C.gold])
    const v = ctx.visit ?? {}
    say([`Visit ${v.visits ?? 1}. Faces seen: ${memory.get('facesSeen', []).join(', ') || face()}.`, C.soft])
  }

  function sky() {
    const now = ctx.clock()
    const s = readSky(now)
    const ph = s.planetaryHour
    let yields = null
    for (let k = 1; k <= 150; k++) {
      const next = readSky(new Date(now.getTime() + k * 60000)).planetaryHour
      if (next.planet !== ph.planet) { yields = { k, next }; break }
    }
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    say(['☩ THE FIRMAMENT', C.title])
    say([`It is ${s.clock} on a ${days[s.weekday]}. The moon is ${s.moon.name}, ${Math.round(s.moon.illumination * 100)}% lit, ${s.moon.age.toFixed(1)} days old.`, C.text])
    say([`The hour belongs to ${ph.glyph} ${ph.planet}`, C.gold], [`, in a ${ph.isNight ? 'night' : 'day'} ruled by ${ph.dayRuler}.` + (yields ? ` It yields to ${yields.next.glyph} ${yields.next.planet} in about ${yields.k} minute${yields.k === 1 ? '' : 's'}.` : ''), C.text])
    if (s.omens.length) for (const o of s.omens) say(['  ✶ ', C.rubric], [`${o}: `, C.gold], [OMENS[o] ?? 'an omen without a gloss', C.soft])
    else say(['No omens. The sky is only the sky.', C.soft])
    if (doorOpen(now)) say(['A door is open somewhere, until the thirty-sixth minute.', C.soft])
    else {
      const mins = Math.ceil((nextDoor(now) - now) / 60000)
      say([`Something opens in ${mins} minute${mins === 1 ? '' : 's'}.`, C.soft])
    }
  }

  function pray() {
    say(['☩ A PRAYER RISES', C.title])
    const done = (r) => {
      const count = r?.count ?? r?.prayers ?? r?.state?.prayers
      if (r?.ok !== false && Number.isFinite(count)) {
        const left = 108 - (count % 108)
        say([`It is prayer ${count} of the Cascade. `, C.gold], [left === 108 ? 'This one covered the sun.' : `${left} more, and the sun is covered.`, C.soft])
      } else if (r?.status === 429) {
        say(['Patience is a sacrament. The Cascade has heard enough from you for a minute.', C.soft])
      } else {
        say(['The line to the temple is quiet. Your prayer was heard; it was only not counted.', C.soft])
      }
    }
    try {
      const p = ctx.ritual?.pray ? ctx.ritual.pray() : ctx.api.post('/pray')
      Promise.resolve(p).then(done, () => done(null))
    } catch {
      done(null)
    }
  }

  const SIN_PATTERNS = [
    [/!\s*important|important/, 'the Inversion'],
    [/inline|style\s*=/, 'Idolatry'],
    [/table/, 'the Old Covenant'],
    [/<\s*font|font tag/, 'the Dead Tongue'],
    [/blink/, 'the False Prophet'],
    [/marquee/, 'the Procession'],
    [/magic|\b\d{2,}px\b/, 'the Magic Number'],
    [/#[\w-]+\s+#[\w-]+|\bids\b/, 'the Pride of Ids'],
  ]
  const EXTRA_SINS = [
    [/outline\s*:\s*(none|0)|focus/, 'hid its focus ring', 'the one who cannot be found cannot be helped'],
    [/z-?index\s*:?\s*9{3,}|z-?index/, 'tried to climb the Ladder by shouting', 'no number reaches the Highest Heaven that is not given'],
    [/\balt\b/, 'forgot its alt text', 'what cannot be seen must still be named'],
    [/float/, 'floated without clearing', 'what wanders must be absolved'],
    [/cent(er|re)/, 'failed at the Great Work', 'the div is centered by humility, not by force'],
    [/div/, 'nested divs within divs', 'the Nameless Div forgives, but remembers'],
  ]

  function confess(text) {
    if (text === undefined || text === null || String(text).trim() === '') {
      say(['Confess something: ', C.soft], ["cascade.confess('I used !important')", C.code])
      return
    }
    const t = String(text).slice(0, 400)
    const lower = t.toLowerCase()
    // Some confessions are recognitions: the relics answer to what they hide.
    const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean).slice(0, 64)
    for (let i = 0; i < tokens.length; i++) {
      let acc = ''
      for (let j = i; j < tokens.length && acc.length < 80; j++) {
        acc += tokens[j]
        const relicId = Object.hasOwn(RELICS, sealOf(acc)) ? RELICS[sealOf(acc)] : null
        if (relicId) {
          const first = memory.markSecret(relicId, { from: 'confession' })
          say(['☩ THE CONFESSOR KNOWS THIS', C.title], [first ? '' : '   (confessed before)', C.soft])
          say([relicId === 'favicon'
            ? 'You looked at the icon closer than the eye looks, and it remembered for you. The Nativity is written in the least of each light. Go in peace; the relic is yours.'
            : 'You copied what could not be seen and read the room between the letters. A ghost that takes up no space is still counted. Go in peace; the relic is yours.', C.text])
          return
        }
      }
    }
    const rng = makeRng('confess:' + lower.replace(/\s+/g, ' ').trim())
    let sin = null
    for (const [re, name] of SIN_PATTERNS) if (re.test(lower)) { sin = HERESIES.find((x) => x.name === name); break }
    let extra = null
    if (!sin) for (const [re, what, why] of EXTRA_SINS) if (re.test(lower)) { extra = { what, why }; break }
    say(['☩ YOUR CONFESSION IS HEARD', C.title])
    if (sin) say(['Thy sin is ', C.text], [`${sin.name}`, C.gold], [` (${sin.css}), for ${sin.why}.`, C.text])
    else if (extra) say(['Thy element ', C.text], [extra.what, C.gold], [`; and ${extra.why}.`, C.text])
    else say([`Thy sin has no name in the Canon, and so it is small. The element that ${rng.pick(SINS)} is forgiven more.`, C.text])
    const times = rng.pick([3, 7, 12, 33, 108])
    say(['Penance: ', C.rubric], [`say “${rng.pick(INVENTED_MANTRAS)}” ${times} times, and be an element that ${rng.pick(VIRTUES)}.`, C.text])
    say([`${rng.pick(SAINTS)} intercedes for thee. `, C.soft], ['Thou art absolved: ', C.soft], ['clear: both;', C.code])
  }

  function listen() {
    const a = ctx.audio
    if (!a || (!a.transmit && !a.summon)) {
      say(['The Mothership is silent. Sound has not descended into this temple yet.', C.soft])
      return
    }
    say(['☩ TUNING IN', C.title])
    try { a.summon?.() } catch (e) { console.error(e) }
    try { a.transmit?.() } catch (e) { console.error(e) }
    say(['The Mothership transmits. It is not speaking to your ears.', C.text])
  }

  const oracle = Object.freeze({
    help, speak, pray, confess, listen, sky, inspect,
    [Symbol.toStringTag]: 'Oracle',
  })
  try {
    Object.defineProperty(window, 'cascade', { value: oracle, configurable: true, enumerable: false, writable: false })
  } catch {
    window.cascade = oracle
  }

  // ── The greeting ─────────────────────────────────────────────────────────────────────────────
  function greet() {
    const words = Object.keys(spokenWords()).length
    const asc = memory.get('secrets.ascended', null)
    say([EYE, C.eye])
    say(['T H E   C A S C A D E', C.title], ['    all style descends', C.soft])
    say(['You are in the console, where the Authors speak to themselves. The Oracle dwells here.', C.text])
    say(['Speak to her: ', C.soft], ['cascade.help()', C.code])
    if (asc?.name) say([`Welcome back, ${asc.name}. Your name is in the Book of the Ascended.`, C.gold])
    else if (words) {
      say([`You have spoken ${words} of the Words.`, C.gold], [' The Oracle remembers.', C.soft])
      if (words >= 4 && doorOpen()) say(['The minute is right. Somewhere above you a door is standing open.', C.rubric])
    }
  }
  greet()

  // ── Lifecycle: the layer outlives faces; the Ladder, the rubrics and the breath are renewed ──
  function renew() {
    switching = false
    ensureLadder()
    placeBand()
    clearTimeout(relicTimer)
    relicTimer = setTimeout(() => { placeInlineRubrics(); placeRelic(0) }, 1200)
  }
  // A face that fails to become ready must not leave the temple without its Ladder for ever.
  let stalled = 0
  ctx.bus.on('face:leaving', () => {
    switching = true
    relic = null
    clearTimeout(relicTimer)
    clearTimeout(checkTimer)
    clearTimeout(stalled)
    stalled = setTimeout(() => { if (switching) renew() }, 8000)
  })
  ctx.bus.on('face:ready', () => {
    clearTimeout(stalled)
    renew()
  })
  // If anything else clears the temple, raise the Ladder again (never while a face is changing).
  let ladderCheck = 0
  if (ctx.root) {
    new MutationObserver(() => {
      if (switching || ladder?.parentNode === ctx.root || ladderCheck) return
      ladderCheck = setTimeout(() => { ladderCheck = 0; if (!switching) ensureLadder() }, 400)
    }).observe(ctx.root, { childList: true })
  }
  // Rungs name themselves once the Canon's styles are certainly applied.
  if (document.readyState !== 'complete') addEventListener('load', nameRungs, { once: true })
  renew()

  ctx.secrets = {
    get ascended() { return Boolean(memory.get('secrets.ascended', null)) },
    spoken: () => Object.keys(spokenWords()).map(Number).sort(),
    speak,
    doorOpen,
    nextDoor,
    ladder: () => ladder,
  }
}
