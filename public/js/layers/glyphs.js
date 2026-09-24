// THE GLYPH LAYER: the Hand of Descent, awake in the temple.
//
// Sets ctx.glyphs (the script's API, see the end of this file) and these behaviours:
//   - Letters typed outside inputs are written into the air beside the pointer as glyphs, then rise.
//     Every visit is written by one HAND, drawn by lot and by the sky: upright, leaning, falling (always
//     at the witching hour and at midnight, when the Hand of Descent does what its name says), or in the
//     glass (right to left, and turned). A strange hand explains itself once, in a whisper.
//   - Words of assent: "amen", "om" or "aum", typed as words, press a seal of glyphs into the air
//     (secrets `amen` / `om`). The audio layer hears the same words and sings them if sound was summoned,
//     so this layer makes no sound of its own.
//   - Typing the NAME of a letter (Azoth, Barun ... Zenith) calls that glyph forward with its sign, its
//     gloss and its anatomy (secret `glyph-name`); naming all twenty-six presses the Great Seal of the
//     whole hand (`glyph-scribe`). Typing the name of the script itself is `katabasic`.
//   - Copying glyph text whispers "the glyphs were letters all along" (secret `copied-glyphs`); copying
//     letters displaced into the Private Use Area (the Inscription) whispers something else.
//   - Typing 2147483647, the last rung of the Ladder, sends every written glyph off the top of the page.
//   - During an eclipse the hand writes in shadow; the ascended write in gold (glyphs.css).
// Nothing here moves under mercy: apparitions appear still and leave quietly.
// ?debug=glyphs opens the Scribe's Exemplar (the whole hand at once), exposes window.cascadeGlyphs, and
// accepts &hand=upright|leaning|falling|glass.
import * as script from '../lib/glyphs.js'
import { h } from '../lib/dom.js'

const { ALPHABET, glyphName, anatomy, isDisplaced } = script

// Characters the hand can write in the air (everything the font has a glyph for, except letters' capitals).
const WRITABLE = /^[a-z0-9.,!?'"\-:;()[\]{}*@/\\|#&+=<>%_~^‘’“”–—…·]$/
// Words that are heard, and what the temple answers.
const ASSENT = {
  amen: { secret: 'amen', caption: 'so it is declared, and so it is styled' },
  om: { secret: 'om', caption: 'the first sound, before the first stylesheet' },
  aum: { secret: 'om', caption: 'three sounds and the silence after them: waking, dreaming, deep sleep, and the fourth, which holds the three' },
}
const NAMES = Object.fromEntries(Object.entries(ALPHABET).map(([letter, a]) => [a.name.toLowerCase(), letter]))
const SCRIPT_NAME = script.SCRIPT.name.toLowerCase()
const HEARD = new RegExp(`(?:^|[^a-z])(${[...Object.keys(ASSENT), ...Object.keys(NAMES), SCRIPT_NAME].join('|')})$`)
const SETTLE_MS = 620 // a word is heard when the next key is not a letter, or after this silence
const FORGET_MS = 3000 // a longer silence begins a new word
const HEAVEN = '2147483647'

// Plain letters worn as glyphs (the casual secret) and letters displaced into the private place (the puzzle)
// are copied differently, and the temple says so differently.
const COPY_WHISPERS = {
  latin: [
    'the glyphs were letters all along',
    'what leaves the temple becomes plain again',
    'every glyph is a letter wearing a stranger’s face',
    'copied, and the script forgot itself',
    'the hand of descent lets go of what you carry out',
  ],
  displaced: [
    'these letters were carried into a private place, and copying does not bring them back',
    'the Rosetta was torn into five leaves, one for each face of the temple',
    'a displaced letter is still a letter',
    'what is written in the private place is read with the Rosetta, not with the clipboard',
  ],
}

// The hand that writes this visit.
const HANDS = {
  upright: { title: 'the upright hand', gloss: 'the hand stands on the line and lets each letter rise' },
  leaning: { title: 'the leaning hand', gloss: 'the hand leans today, like Iota, which has not decided to be vertical' },
  falling: { title: 'the falling hand', gloss: 'at this hour the hand writes downward, as its name always said' },
  glass: { title: 'the hand in the glass', gloss: 'today the scribe writes in the glass: right to left, and turned' },
}
const TELL_HAND_AFTER = 16 // glyphs written before a strange hand explains itself

const MAX_RISERS = 40
const MAX_BLOOMS = 3
// Mercy (bottom-left) and the altar (bottom-right) keep the last 84px of the viewport, and the whispers
// are spoken just above them (glyphs.css .glyph-voice: 92px up, a line or two tall). A seal keeps clear of
// both, so its caption is never read through a whisper; the caption needs about 74px under the seal.
const VOICE_ZONE = 92 + 64
const CAPTION_ROOM = 74
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven']

export async function init(ctx) {
  const rng = ctx.rng.fork('glyphs')
  const debug = ctx.params?.get('debug') === 'glyphs'
  // The apparitions hang in the air above the whole temple and above the eclipse's veil (ritual.css,
  // z-index 2147482000), so the hand can write in shadow against it; they stay below the temple's own
  // controls (the hush, mercy, the altar) and never take a click (glyphs.css).
  const host = document.body
  const veil = h('div', { class: 'glyph-veil', 'aria-hidden': 'true' })
  const voice = h('div', { class: 'glyph-voice', role: 'status' })
  // What the eye is shown in the veil, the ear is told here (the veil itself is hidden from readers).
  const said = h('p', { class: 'glyph-sr', role: 'status' })
  host.append(veil, voice, said)

  const still = () => Boolean(ctx.mercy?.on)
  const pointer = () => {
    const p = ctx.behavior?.pointer
    return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? p : { x: innerWidth / 2, y: innerHeight / 2 }
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const omen = (o) => Boolean(ctx.sky?.has?.(o))

  let sayTimer = 0
  function announce(text) {
    clearTimeout(sayTimer)
    said.textContent = ''
    sayTimer = setTimeout(() => { said.textContent = String(text) }, 60)
  }

  // ── The hand of this visit ──────────────────────────────────────────────────────────────────
  function chooseHand() {
    const forced = debug ? ctx.params.get('hand') : null
    if (forced && HANDS[forced]) return forced
    if (omen('witching') || omen('midnight')) return 'falling'
    return ctx.rng.fork('glyphs/hand').weighted({
      upright: 12,
      leaning: 4,
      falling: omen('night') ? 1.5 : 0.5,
      glass: omen('eclipse') || omen('new-moon') ? 3 : 0.6,
    })
  }
  let hand = 'upright'
  let handTold = false
  let written = 0
  function setHand(name) {
    if (!HANDS[name]) return hand
    hand = name
    handTold = name === 'upright'
    veil.dataset.hand = name
    // Inherited by every glyph the hand writes (glyphs.css): the glass turns them, the lean slants them.
    veil.style.setProperty('--mx', name === 'glass' ? '-1' : '1')
    veil.style.setProperty('--skew', name === 'leaning' ? '-12deg' : '0deg')
    pen = null
    return hand
  }

  // Removes an apparition when its animation ends, or after `ms` if it never animates (mercy).
  function expire(el, ms) {
    let done = false
    const end = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      risers.delete(el)
      el.remove()
    }
    const timer = setTimeout(end, ms)
    el.addEventListener('animationend', (e) => { if (e.target === el) end() })
    return end
  }

  // ── Rising letters ────────────────────────────────────────────────────────────────────────────
  const risers = new Set()
  let pen = null
  setHand(chooseHand())

  function riserSize() {
    return Math.round(clamp(Math.min(innerWidth, innerHeight) * 0.042, 22, 36))
  }

  // Where the next letter goes: after the last one, unless the pointer moved or the hand rested.
  // The hand in the glass writes leftward.
  function penAt(at, size) {
    const now = performance.now()
    const p = at ?? pointer()
    const dir = hand === 'glass' ? -1 : 1
    const start = () => clamp(p.x + dir * size * 0.6, size, innerWidth - size)
    if (!pen || now - pen.at > 1500 || Math.hypot(p.x - pen.px, p.y - pen.py) > 24 || at) {
      pen = { px: p.x, py: p.y, x: start(), y: clamp(p.y - size * 0.2, size * 2, innerHeight - size * 0.5), at: now }
    }
    pen.at = now
    if (pen.x > innerWidth - size * 0.8 || pen.x < size * 0.8) {
      // The line is full: begin again above it.
      pen.x = start()
      pen.y = Math.max(size * 2, pen.y - size * 1.4)
    }
    return pen
  }

  function riseChar(ch, at) {
    const size = riserSize()
    const p = penAt(at, size)
    const dir = hand === 'glass' ? -1 : 1
    if (ch === ' ') {
      p.x += dir * size * 0.5
      return null
    }
    const fall = hand === 'falling'
    const el = h('span', { class: 'glyph glyph-rise', lang: 'x-cascade' }, ch)
    el.style.setProperty('--x', `${Math.round(p.x)}px`)
    el.style.setProperty('--y', `${Math.round(p.y)}px`)
    el.style.setProperty('--size', `${size}px`)
    el.style.setProperty('--dx', `${(hand === 'leaning' ? rng.float(10, 46) : rng.float(-22, 22)).toFixed(1)}px`)
    // --dy is how far the letter climbs; the falling hand's letters sink instead.
    el.style.setProperty('--dy', `${Math.round(fall ? -rng.float(70, 130) : rng.float(80, 140))}px`)
    el.style.setProperty('--rot', `${(fall ? rng.float(-24, 24) : rng.float(-12, 12)).toFixed(1)}deg`)
    const dur = rng.float(1.7, 2.4)
    el.style.setProperty('--dur', `${dur.toFixed(2)}s`)
    p.x += dir * size * 0.66
    if (still()) el.classList.add('is-still')
    while (risers.size >= MAX_RISERS) {
      const oldest = risers.values().next().value
      risers.delete(oldest)
      oldest.remove()
    }
    risers.add(el)
    veil.append(el)
    expire(el, still() ? 1100 : dur * 1000 + 400)
    if (++written >= TELL_HAND_AFTER && !handTold) {
      handTold = true
      whisper(HANDS[hand].gloss, { ms: 5600 })
    }
    return el
  }

  // Public: make any text rise as glyphs, from a point or from the pointer.
  function rise(text, { x, y } = {}) {
    const at = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined
    let first = true
    for (const ch of String(text).toLowerCase().slice(0, 64)) {
      if (ch !== ' ' && !WRITABLE.test(ch)) continue
      riseChar(ch, first ? at : undefined)
      first = false
    }
  }

  // ── Seals (the bloom) ─────────────────────────────────────────────────────────────────────────
  // A word of assent is pressed into the air like a seal: a legend of the word running round the rim
  // between two rules (tops outward, as on every seal), a wheel of its letters turning the other way,
  // thirty-two hairline rays, and the first letter at the heart.
  const blooms = new Set()
  const stands = new Map() // seal -> the box it stands in, caption included

  function petal(ch, i, n) {
    const el = h('span', { class: 'glyph glyph-bloom__petal', lang: 'x-cascade' }, ch)
    el.style.setProperty('--i', String(i))
    el.style.setProperty('--n', String(n))
    return el
  }

  function seal({ word, legend, wheel, heart, caption, x, y, grand = false }) {
    if (!legend.length || blooms.size >= MAX_BLOOMS) return null
    const p = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : pointer()
    const small = Math.min(innerWidth, innerHeight)
    const r = Math.round(grand ? clamp(small * 0.22, 96, 176) : clamp(small * 0.16, 72, 132))
    const legendPx = Math.max(13, Math.round(r * 0.2))
    const reach = Math.round(r + legendPx * 0.8)
    // Keep the seal, and the caption under it, clear of the whispers, mercy and the altar at the foot.
    const foot = VOICE_ZONE + (caption ? CAPTION_ROOM : 8)
    const cx = clamp(p.x, reach + 12, Math.max(reach + 12, innerWidth - reach - 12))
    const cy = clamp(p.y, reach + 12, Math.max(reach + 12, innerHeight - reach - foot))
    // The legend: the word and a pause (the colon's two Seeds), around and around. The Great Seal
    // carries the whole alphabet once.
    const unit = [...legend, ':']
    const turns = grand ? 1 : Math.max(2, Math.round((2 * Math.PI * r) / (legendPx * 0.62) / unit.length))
    const slots = turns * unit.length
    const rim = Array.from({ length: slots }, (_, i) => petal(unit[i % unit.length], i, slots))
    const spokes = wheel.map((ch, i) => petal(ch, i, wheel.length))
    const cap = caption
      ? h('p', { class: 'glyph-bloom__caption' }, h('span', { class: 'glyph', lang: 'x-cascade' }, word), ' ', caption)
      : null
    const el = h('div', { class: `glyph-bloom${grand ? ' glyph-bloom--grand' : ''}`, 'data-word': word },
      h('span', { class: 'glyph-bloom__halo' }),
      h('span', { class: 'glyph-bloom__rays' }),
      h('span', { class: 'glyph-bloom__rim' }),
      h('div', { class: 'glyph-bloom__legend' }, rim),
      h('div', { class: 'glyph-bloom__wheel' }, spokes),
      h('span', { class: 'glyph glyph-bloom__heart', lang: 'x-cascade' }, heart),
      cap,
    )
    el.style.setProperty('--x', `${Math.round(cx)}px`)
    el.style.setProperty('--y', `${Math.round(cy)}px`)
    el.style.setProperty('--r', `${r}px`)
    el.style.setProperty('--reach', `${reach}px`)
    el.style.setProperty('--legend', `${legendPx}px`)
    el.style.setProperty('--turn', `${rng.float(-40, -18).toFixed(1)}deg`)
    if (still()) el.classList.add('is-still')
    blooms.add(el)
    veil.append(el)
    // Where the seal stands (the whispers keep out of it, see placeVoice).
    const box = { top: cy - reach, bottom: cy + reach, left: cx - reach, right: cx + reach }
    // Keep the caption on the page at 360px: shift it sideways if the seal sits near an edge.
    if (cap) {
      const rc = cap.getBoundingClientRect()
      const shift = rc.left < 12 ? 12 - rc.left : rc.right > innerWidth - 12 ? innerWidth - 12 - rc.right : 0
      if (shift) cap.style.setProperty('--shift', `${Math.round(shift)}px`)
      box.bottom = Math.max(box.bottom, rc.bottom)
      box.left = Math.min(box.left, rc.left + shift)
      box.right = Math.max(box.right, rc.right + shift)
      announce(`${word}: ${caption}`)
    }
    stands.set(el, box)
    placeVoice()
    let done = false
    const end = () => {
      if (done) return
      done = true
      blooms.delete(el)
      stands.delete(el)
      el.remove()
    }
    setTimeout(end, grand ? (still() ? 5200 : 6700) : still() ? 2800 : 3900)
    return el
  }

  // Public: press a seal of any word (letters only, at most sixteen).
  function bloom(word, { x, y, caption } = {}) {
    const letters = [...String(word).toLowerCase().replace(/[^a-z]/g, '')].slice(0, 16)
    if (!letters.length) return null
    const m = letters.length <= 2 ? 6 : letters.length <= 4 ? 8 : letters.length
    return seal({
      word: letters.join(''),
      legend: letters,
      wheel: Array.from({ length: m }, (_, i) => letters[i % letters.length]),
      heart: letters[0],
      caption,
      x,
      y,
    })
  }

  // The Great Seal of the Scribe: the whole alphabet on the rim, the script's own name on the wheel,
  // and at the heart the watcher, the letter displaced from nothing (U+E000).
  function greatSeal() {
    return seal({
      word: SCRIPT_NAME,
      legend: Object.keys(ALPHABET),
      wheel: [...SCRIPT_NAME],
      heart: String.fromCodePoint(script.PUA_OFFSET),
      caption: 'you have called every letter by its name; the hand of descent is yours',
      x: innerWidth / 2,
      y: innerHeight * 0.42,
      grand: true,
    })
  }

  // ── Whispers ────────────────────────────────────────────────────────────────────────────────
  // Whispers are spoken at the foot of the page. While a seal or a Naming stands there (a long whisper on
  // a phone climbs three lines high), the voice speaks from the top of the page instead, so no line is
  // ever read through another. Checked only when something appears, never in a loop.
  function placeVoice() {
    voice.classList.remove('glyph-voice--aloft')
    if (!voice.childElementCount) return
    const v = voice.getBoundingClientRect()
    const boxes = [...stands.values()]
    if (naming?.isConnected) boxes.push(naming.getBoundingClientRect())
    const hit = boxes.some((r) => r.bottom > v.top - 8 && r.top < v.bottom + 8 && r.right > v.left && r.left < v.right)
    voice.classList.toggle('glyph-voice--aloft', hit)
  }

  function whisper(text, { ms = 4400 } = {}) {
    if (!text) return null
    const lines = voice.querySelectorAll('.glyph-whisper')
    if (lines.length >= 2) lines[0].remove()
    const el = h('p', { class: 'glyph-whisper' }, String(text))
    el.style.setProperty('--dur', `${ms}ms`)
    if (still()) el.classList.add('is-still')
    voice.append(el)
    placeVoice()
    let done = false
    const end = () => {
      if (done) return
      done = true
      el.remove()
    }
    setTimeout(end, ms + 200)
    el.addEventListener('animationend', end)
    return el
  }

  // ── The Naming ──────────────────────────────────────────────────────────────────────────────
  let naming = null

  function name(letter) {
    const l = String(letter).toLowerCase()
    const a = ALPHABET[l]
    if (!a) return null
    naming?.remove()
    const body = anatomy(l)
    const el = h('div', { class: 'glyph-naming' },
      h('span', { class: 'glyph glyph-naming__glyph', lang: 'x-cascade' }, l),
      h('span', { class: 'glyph-naming__name' }, a.name),
      h('span', { class: 'glyph-naming__sign' }, a.sign),
      h('span', { class: 'glyph-naming__gloss' }, a.gloss),
      body && h('span', { class: 'glyph-naming__anatomy' },
        // The count is written in Katabasic numerals too: Seeds count one, the Stem counts five.
        h('span', { class: 'glyph', lang: 'x-cascade' }, String(body.strokes)),
        ` ${COUNT_WORDS[body.strokes]} strokes: ${body.text}`),
    )
    if (still()) el.classList.add('is-still')
    naming = el
    veil.append(el)
    placeVoice()
    announce(`${a.name}, ${a.sign}, the letter ${l.toUpperCase()}${body ? `, written in ${COUNT_WORDS[body.strokes]} strokes` : ''}: ${a.gloss}`)
    const end = () => { if (naming === el) naming = null; el.remove() }
    setTimeout(end, still() ? 3600 : 4400)
    el.addEventListener('animationend', (e) => { if (e.target === el) end() })
    return el
  }

  // ── The Highest Heaven ──────────────────────────────────────────────────────────────────────
  // Typing the last rung of the Ladder sends every written glyph all the way up, off the top of the page,
  // even those of the falling hand.
  let lastAscent = -Infinity

  function ascend() {
    const now = performance.now()
    if (now - lastAscent < 4000) return
    lastAscent = now
    if (!still()) {
      for (const el of risers) {
        const y = parseFloat(el.style.getPropertyValue('--y')) || innerHeight
        el.style.setProperty('--dy', `${Math.round(y + 120)}px`)
        el.style.setProperty('--dx', '0px')
      }
    }
    whisper('there is no rung above this one')
    ctx.bus?.emit('glyphs:heaven', {})
  }

  // ── Hearing words ───────────────────────────────────────────────────────────────────────────
  let heard = ''
  let lastKey = 0
  let pending = null // { word, timer }
  let sealTimer = 0

  function answer(word) {
    const assent = ASSENT[word]
    if (assent) {
      bloom(word, { caption: assent.caption })
      ctx.memory?.markSecret?.(assent.secret)
      ctx.bus?.emit('glyphs:bloom', { word })
      return
    }
    if (word === SCRIPT_NAME) {
      const { SCRIPT } = script
      whisper(`${SCRIPT.name}, ${SCRIPT.epithet}: six strokes, one nib held at ${SCRIPT.nib} degrees`, { ms: 5600 })
      ctx.memory?.markSecret?.('katabasic')
      return
    }
    const letter = NAMES[word]
    if (letter) {
      name(letter)
      ctx.memory?.markSecret?.('glyph-name', { letter })
      const named = ctx.memory?.update?.('glyphs.named', (list) => (Array.isArray(list) ? (list.includes(letter) ? list : [...list, letter]) : [letter]), []) ?? []
      if (named.length >= 26 && ctx.memory?.markSecret?.('glyph-scribe')) {
        // The last Naming is allowed to finish before the Great Seal is pressed.
        clearTimeout(sealTimer)
        sealTimer = setTimeout(() => {
          naming?.remove()
          naming = null
          greatSeal()
          ctx.bus?.emit('glyphs:scribe', {})
        }, still() ? 3700 : 4500)
      }
      ctx.bus?.emit('glyphs:named', { letter, name: glyphName(letter) })
    }
  }

  function settle() {
    if (!pending) return
    clearTimeout(pending.timer)
    const { word } = pending
    pending = null
    answer(word)
  }

  function isEditable(target) {
    const el = target instanceof Element ? target : null
    if (!el) return false
    if (el.isContentEditable) return true
    return Boolean(el.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'))
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return
    if (isEditable(e.target) || isEditable(document.activeElement)) return
    const key = e.key
    if (key === 'Enter' && pending) return settle()
    if (!key || [...key].length !== 1) return
    const now = performance.now()
    if (now - lastKey > FORGET_MS) heard = ''
    lastKey = now

    if (key === 'ॐ') { // OM (U+0950), for those whose keyboards know it
      heard = ''
      riseChar('o')
      answer('om')
      // The audio layer hears the letters o and m; the sign itself only this layer hears, so it asks.
      if (ctx.audio?.summoned) ctx.audio.chant?.('om', { gain: 0.55 })
      return
    }
    const ch = key.toLowerCase()
    const letter = ch >= 'a' && ch <= 'z'
    if (pending) {
      if (letter) {
        clearTimeout(pending.timer)
        pending = null
      } else settle()
    }
    heard = (heard + ch).slice(-24)
    // A held key writes only until the air is half full; the words are still heard.
    const flood = e.repeat && risers.size > MAX_RISERS / 2
    if (!flood && (ch === ' ' || WRITABLE.test(ch))) riseChar(ch)
    if (heard.endsWith(HEAVEN)) ascend()
    const m = letter && heard.match(HEARD)
    if (m) pending = { word: m[1], timer: setTimeout(settle, SETTLE_MS) }
  }
  addEventListener('keydown', onKey)

  // ── Copying glyph text ──────────────────────────────────────────────────────────────────────
  const copies = { latin: 0, displaced: 0 }
  let lastCopy = -Infinity

  // 'displaced' when the selection holds Private Use Area glyphs, 'latin' when it holds plain letters set
  // in the glyph hand (or rotting into it, see layers/hell/rot.js), otherwise null.
  function selectionKind(sel) {
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null
    const text = sel.toString()
    if (!text.trim()) return null
    if (isDisplaced(text) || /[\u{E000}-\u{F8FF}]/u.test(text)) return 'displaced'
    for (let i = 0; i < sel.rangeCount; i++) {
      const range = sel.getRangeAt(i)
      const rootNode = range.commonAncestorContainer
      if (rootNode.nodeType === Node.TEXT_NODE) {
        if (rootNode.parentElement && isGlyphFont(rootNode.parentElement)) return 'latin'
        continue
      }
      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT)
      let seen = 0
      for (let node = walker.nextNode(); node && seen < 600; node = walker.nextNode(), seen++) {
        if (!node.data.trim() || !range.intersectsNode(node)) continue
        if (node.parentElement && isGlyphFont(node.parentElement)) return 'latin'
      }
    }
    return null
  }

  function isGlyphFont(el) {
    if (el.closest('.glyph, [lang="x-cascade"]')) return true
    return /^\s*["']?(Cascade Glyphs|Hell Rot)/i.test(getComputedStyle(el).fontFamily)
  }

  function onCopy() {
    let kind = null
    try { kind = selectionKind(document.getSelection()) } catch { kind = null }
    if (!kind) return
    const now = performance.now()
    if (now - lastCopy < 2500) return
    lastCopy = now
    ctx.memory?.markSecret?.('copied-glyphs', { displaced: kind === 'displaced' })
    const lines = COPY_WHISPERS[kind]
    whisper(lines[copies[kind]++ % lines.length])
    ctx.bus?.emit('glyphs:copied', { displaced: kind === 'displaced' })
  }
  document.addEventListener('copy', onCopy)

  // Mercy: letters in flight are let go at once (held still, each would jump back to where it was written,
  // forty at a time). Seals, Namings and whispers stop as they are and stay readable until their timers.
  ctx.bus?.on('mercy:change', ({ on } = {}) => {
    if (!on) return
    for (const el of risers) el.remove()
    risers.clear()
    pen = null
    for (const el of veil.querySelectorAll('.glyph-bloom, .glyph-naming')) el.classList.add('is-still')
    for (const el of voice.querySelectorAll('.glyph-whisper')) el.classList.add('is-still')
  })

  // A new face: whatever was written in the air belongs to the old one.
  ctx.bus?.on('face:leaving', () => {
    for (const el of risers) el.remove()
    risers.clear()
    for (const el of blooms) el.remove()
    blooms.clear()
    stands.clear()
    naming?.remove()
    naming = null
    pen = null
    if (pending) { clearTimeout(pending.timer); pending = null }
  })

  // ── The Exemplar (?debug=glyphs) ────────────────────────────────────────────────────────────
  const MARK_NAMES = {
    '.': 'the small Eye', ',': 'the falling Seed', ':': 'two Seeds', ';': 'Seeds and a fall', '!': 'the raised Ray',
    '?': 'the Eye on a stem', "'": 'one tongue', '"': 'two tongues', '-': 'the short Bar', '(': 'the Bowl opening',
    ')': 'the Bowl closing', '[': 'the Bar opening', ']': 'the Bar closing', '{': 'the rule begins', '}': 'the rule ends',
    '*': 'the All-Selector', '@': 'the at-rule', '/': 'the Ray rising', '\\': 'the Ray falling', '|': 'the tall Stem',
    '#': 'the Id', '&': 'the Union', '+': 'the adjacent', '=': 'the equal Bars', '<': 'the lesser', '>': 'the child',
    '%': 'the share', '_': 'the ground', '~': 'the sibling', '^': 'the begins-with', '–': 'the middle Bar', '—': 'the long Bar',
    '…': 'three Seeds, and on', '·': 'the middle Seed',
  }
  let shutExemplar = null

  function exemplar() {
    shutExemplar?.()
    const before = document.activeElement
    const cells = Object.entries(ALPHABET).map(([l, a]) => h('div', { class: 'glyph-exemplar__cell' },
      h('span', { class: 'glyph', lang: 'x-cascade' }, l),
      h('small', {}, `${l.toUpperCase()} · ${a.name}`),
      h('small', {}, a.sign),
      h('small', { class: 'glyph-exemplar__anatomy' }, anatomy(l)?.text ?? ''),
    ))
    const digits = [...'0123456789'].map((d, i) => h('div', { class: 'glyph-exemplar__cell' },
      h('span', { class: 'glyph', lang: 'x-cascade' }, d),
      h('small', {}, `${d} · ${script.NUMERALS.digits[i]}`),
    ))
    const marks = Object.entries(MARK_NAMES).map(([m, gloss]) => h('div', { class: 'glyph-exemplar__cell' },
      h('span', { class: 'glyph', lang: 'x-cascade' }, m),
      h('small', {}, `“${m}” · ${gloss}`),
    ))
    const watcher = h('div', { class: 'glyph-exemplar__cell' },
      h('span', { class: 'glyph', lang: 'x-cascade' }, String.fromCodePoint(script.PUA_OFFSET)),
      h('small', {}, 'U+E000 · the watcher'),
      h('small', {}, 'displaced from nothing'),
    )
    const strokes = h('ul', { class: 'glyph-exemplar__strokes' },
      script.STROKES.map((s) => h('li', {}, h('b', {}, s.name), ` (${s.css}): ${s.gloss}`)))
    const sizes = [14, 18, 24, 36, 60, 120].map((px) => h('p', { class: 'glyph-exemplar__line glyph', lang: 'x-cascade', style: { fontSize: `${px}px` } },
      px >= 60 ? 'the third word' : script.toPua(script.INSCRIPTION)))
    const close = h('button', { class: 'glyph-exemplar__close', type: 'button', onclick: () => shut() }, 'close the exemplar')
    const onEsc = (e) => { if (e.key === 'Escape') shut() }
    const panel = h('section', { class: 'glyph-exemplar', 'aria-label': 'The Scribe’s Exemplar of the Cascade Glyphs', 'aria-live': 'off' },
      h('header', { class: 'glyph-exemplar__head' },
        h('h2', {}, `${script.SCRIPT.name}, ${script.SCRIPT.epithet}`),
        close),
      h('p', { class: 'glyph-exemplar__intro' }, `${script.SCRIPT.rule} Numerals: ${script.NUMERALS.rule}. This visit is written by ${HANDS[hand].title}: ${HANDS[hand].gloss}.`),
      strokes,
      h('div', { class: 'glyph-exemplar__grid' }, cells, digits, marks, watcher),
      sizes,
    )
    function shut() {
      removeEventListener('keydown', onEsc)
      panel.remove()
      if (shutExemplar === shut) shutExemplar = null
      if (before instanceof HTMLElement && before.isConnected && before !== document.body) before.focus({ preventScroll: true })
    }
    shutExemplar = shut
    addEventListener('keydown', onEsc)
    host.append(panel)
    close.focus({ preventScroll: true })
    return panel
  }
  if (debug) exemplar()

  ctx.glyphs = {
    ...script,
    rise,
    bloom,
    whisper,
    name,
    exemplar,
    // The hand that writes this visit: { name, title, gloss }.
    get hand() {
      return { name: hand, ...HANDS[hand] }
    },
    // Resolves when the glyph font is ready (for canvas drawing or measuring).
    ready: document.fonts?.load ? document.fonts.load(`32px "${script.FONT_FAMILY}"`, 'a').then(() => true, () => false) : Promise.resolve(false),
  }

  if (debug) {
    // Test hooks, only with ?debug=glyphs.
    window.cascadeGlyphs = Object.assign(Object.create(ctx.glyphs), { ctx, setHand, greatSeal, HANDS })
  }
}
