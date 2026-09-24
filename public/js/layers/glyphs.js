// THE GLYPH LAYER: the Hand of Descent, awake in the temple.
//
// Sets ctx.glyphs (the script's API, see below) and these behaviours:
//   - Letters typed outside inputs are written into the air beside the pointer as glyphs, then rise.
//   - Words of assent: "amen", "om" or "aum", typed as words, press a seal of glyphs into the air
//     (secrets `amen` / `om`). The audio layer hears the same words and sings them if sound was summoned,
//     so this layer makes no sound of its own.
//   - Typing the NAME of a letter (Azoth, Barun ... Zenith) calls that glyph forward (secret `glyph-name`);
//     naming all twenty-six is `glyph-scribe`. Typing the name of the script itself is `katabasic`.
//   - Copying glyph text whispers "the glyphs were letters all along" (secret `copied-glyphs`).
//   - Typing 2147483647, the last rung of the Ladder, sends every rising glyph off the top of the page.
// Nothing here moves under mercy: apparitions appear still and leave quietly.
// ?debug=glyphs opens the Scribe's Exemplar, the whole hand at once.
import * as script from '../lib/glyphs.js'
import { h } from '../lib/dom.js'

const { ALPHABET, glyphName } = script

// Characters the hand can write in the air (everything the font has a glyph for, except letters' capitals).
const WRITABLE = /^[a-z0-9.,!?'"\-:;()[\]{}*@/\\|#&+=<>%_~^]$/
// Words that are heard, and what the temple answers.
const ASSENT = {
  amen: { secret: 'amen', caption: 'so it is declared, and so it is styled' },
  om: { secret: 'om', caption: 'the first sound, before the first stylesheet' },
  aum: { secret: 'om', caption: 'three sounds and the silence after: waking, dreaming, sleep, and the Root' },
}
const NAMES = Object.fromEntries(Object.entries(ALPHABET).map(([letter, a]) => [a.name.toLowerCase(), letter]))
const SCRIPT_NAME = script.SCRIPT.name.toLowerCase()
const HEARD = new RegExp(`(?:^|[^a-z])(${[...Object.keys(ASSENT), ...Object.keys(NAMES), SCRIPT_NAME].join('|')})$`)
const SETTLE_MS = 620 // a word is heard when the next key is not a letter, or after this silence
const FORGET_MS = 3000 // a longer silence begins a new word

const COPY_WHISPERS = [
  'the glyphs were letters all along',
  'what leaves the temple becomes plain again',
  'every glyph is a letter wearing a stranger’s face',
  'copied, and the script forgot itself',
  'the hand of descent lets go of what you carry out',
]

const MAX_RISERS = 40
const MAX_BLOOMS = 3

export async function init(ctx) {
  const rng = ctx.rng.fork('glyphs')
  const host = document.getElementById('layers') ?? document.body
  const veil = h('div', { class: 'glyph-veil', 'aria-hidden': 'true' })
  const voice = h('div', { class: 'glyph-voice', role: 'status' })
  // What the eye is shown in the veil, the ear is told here (the veil itself is hidden from readers).
  const said = h('p', { class: 'glyph-sr', role: 'status' })
  host.append(veil, voice, said)

  const still = () => Boolean(ctx.mercy?.on)
  const pointer = () => {
    const p = ctx.behavior?.pointer
    return p && Number.isFinite(p.x) ? p : { x: innerWidth / 2, y: innerHeight / 2 }
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

  let sayTimer = 0
  function announce(text) {
    clearTimeout(sayTimer)
    said.textContent = ''
    sayTimer = setTimeout(() => { said.textContent = String(text) }, 60)
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

  function riserSize() {
    return Math.round(clamp(Math.min(innerWidth, innerHeight) * 0.042, 22, 36))
  }

  // Where the next letter goes: after the last one, unless the pointer moved or the hand rested.
  function penAt(at, size) {
    const now = performance.now()
    const p = at ?? pointer()
    if (!pen || now - pen.at > 1500 || Math.hypot(p.x - pen.px, p.y - pen.py) > 24 || at) {
      pen = { px: p.x, py: p.y, x: clamp(p.x + size * 0.6, size, innerWidth - size), y: clamp(p.y - size * 0.2, size * 2, innerHeight - size * 0.5), at: now }
    }
    pen.at = now
    if (pen.x > innerWidth - size * 0.8) {
      pen.x = clamp(pen.px + size * 0.6, size, innerWidth - size)
      pen.y = Math.max(size * 2, pen.y - size * 1.4)
    }
    return pen
  }

  function riseChar(ch, at) {
    const size = riserSize()
    const p = penAt(at, size)
    if (ch === ' ') {
      p.x += size * 0.5
      return null
    }
    const el = h('span', { class: 'glyph glyph-rise', lang: 'x-cascade' }, ch)
    el.style.setProperty('--x', `${Math.round(p.x)}px`)
    el.style.setProperty('--y', `${Math.round(p.y)}px`)
    el.style.setProperty('--size', `${size}px`)
    el.style.setProperty('--dx', `${rng.float(-22, 22).toFixed(1)}px`)
    el.style.setProperty('--dy', `${Math.round(rng.float(80, 140))}px`)
    el.style.setProperty('--rot', `${rng.float(-12, 12).toFixed(1)}deg`)
    const dur = rng.float(1.7, 2.4)
    el.style.setProperty('--dur', `${dur.toFixed(2)}s`)
    p.x += size * 0.66
    if (still()) el.classList.add('is-still')
    while (risers.size >= MAX_RISERS) {
      const oldest = risers.values().next().value
      risers.delete(oldest)
      oldest.remove()
    }
    risers.add(el)
    veil.append(el)
    expire(el, still() ? 1100 : dur * 1000 + 400)
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

  function petal(ch, i, n) {
    const el = h('span', { class: 'glyph glyph-bloom__petal', lang: 'x-cascade' }, ch)
    el.style.setProperty('--i', String(i))
    el.style.setProperty('--n', String(n))
    return el
  }

  function bloom(word, { x, y, caption } = {}) {
    const letters = [...String(word).toLowerCase().replace(/[^a-z]/g, '')].slice(0, 16)
    if (!letters.length || blooms.size >= MAX_BLOOMS) return null
    const p = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : pointer()
    const r = Math.round(clamp(Math.min(innerWidth, innerHeight) * 0.16, 72, 132))
    const legendPx = Math.max(13, Math.round(r * 0.2))
    const reach = Math.round(r + legendPx * 0.8)
    const cx = clamp(p.x, reach + 12, innerWidth - reach - 12)
    const cy = clamp(p.y, reach + 12, Math.max(reach + 12, innerHeight - reach - (caption ? 84 : 12)))
    // The legend: the word and a pause (the colon's two Seeds), around and around.
    const unit = [...letters, ':']
    const turns = Math.max(2, Math.round((2 * Math.PI * r) / (legendPx * 0.62) / unit.length))
    const slots = turns * unit.length
    const legend = Array.from({ length: slots }, (_, i) => petal(unit[i % unit.length], i, slots))
    // The wheel: the letters again, larger, turning against the rim.
    const m = letters.length <= 2 ? 6 : letters.length <= 4 ? 8 : letters.length
    const wheel = Array.from({ length: m }, (_, i) => petal(letters[i % letters.length], i, m))
    const cap = caption
      ? h('p', { class: 'glyph-bloom__caption' }, h('span', { class: 'glyph', lang: 'x-cascade' }, letters.join('')), ' ', caption)
      : null
    const el = h('div', { class: 'glyph-bloom', 'data-word': letters.join('') },
      h('span', { class: 'glyph-bloom__halo' }),
      h('span', { class: 'glyph-bloom__rays' }),
      h('span', { class: 'glyph-bloom__rim' }),
      h('div', { class: 'glyph-bloom__legend' }, legend),
      h('div', { class: 'glyph-bloom__wheel' }, wheel),
      h('span', { class: 'glyph glyph-bloom__heart', lang: 'x-cascade' }, letters[0]),
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
    // Keep the caption on the page at 360px: shift it sideways if the seal sits near an edge.
    if (cap) {
      const rc = cap.getBoundingClientRect()
      const shift = rc.left < 12 ? 12 - rc.left : rc.right > innerWidth - 12 ? innerWidth - 12 - rc.right : 0
      if (shift) cap.style.setProperty('--shift', `${Math.round(shift)}px`)
      announce(`${letters.join('')}: ${caption}`)
    }
    let done = false
    const end = () => {
      if (done) return
      done = true
      blooms.delete(el)
      el.remove()
    }
    setTimeout(end, still() ? 2800 : 3900)
    return el
  }

  // ── Whispers ────────────────────────────────────────────────────────────────────────────────
  function whisper(text, { ms = 4400 } = {}) {
    if (!text) return null
    const lines = voice.querySelectorAll('.glyph-whisper')
    if (lines.length >= 2) lines[0].remove()
    const el = h('p', { class: 'glyph-whisper' }, String(text))
    el.style.setProperty('--dur', `${ms}ms`)
    if (still()) el.classList.add('is-still')
    voice.append(el)
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
    const el = h('div', { class: 'glyph-naming' },
      h('span', { class: 'glyph glyph-naming__glyph', lang: 'x-cascade' }, l),
      h('span', { class: 'glyph-naming__name' }, a.name),
      h('span', { class: 'glyph-naming__sign' }, a.sign),
      h('span', { class: 'glyph-naming__gloss' }, a.gloss),
    )
    if (still()) el.classList.add('is-still')
    naming = el
    veil.append(el)
    announce(`${a.name}, ${a.sign}, the letter ${l.toUpperCase()}: ${a.gloss}`)
    const end = () => { if (naming === el) naming = null; el.remove() }
    setTimeout(end, still() ? 3600 : 4400)
    el.addEventListener('animationend', (e) => { if (e.target === el) end() })
    return el
  }

  // ── The Highest Heaven ──────────────────────────────────────────────────────────────────────
  // Typing the last rung of the Ladder sends every rising glyph all the way up, off the top of the page.
  const HEAVEN = '2147483647'
  let lastAscent = 0

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
        setTimeout(() => whisper('you have called every letter by its name; the hand of descent is yours', { ms: 5600 }), 900)
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
    if (e.repeat && risers.size > MAX_RISERS / 2) return
    if (ch === ' ' || WRITABLE.test(ch)) riseChar(ch)
    if (heard.endsWith(HEAVEN)) ascend()
    const m = letter && heard.match(HEARD)
    if (m) pending = { word: m[1], timer: setTimeout(settle, SETTLE_MS) }
  }
  addEventListener('keydown', onKey)

  // ── Copying glyph text ──────────────────────────────────────────────────────────────────────
  let copies = 0
  let lastCopy = 0

  function selectionIsGlyphs(sel) {
    if (!sel || sel.isCollapsed || !sel.rangeCount) return false
    const text = sel.toString()
    if (!text.trim()) return false
    if (/[-]/.test(text)) return true
    for (let i = 0; i < sel.rangeCount; i++) {
      const range = sel.getRangeAt(i)
      const rootNode = range.commonAncestorContainer
      const start = rootNode.nodeType === Node.TEXT_NODE ? rootNode.parentElement : rootNode
      if (!start) continue
      if (rootNode.nodeType === Node.TEXT_NODE) {
        if (isGlyphFont(start)) return true
        continue
      }
      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT)
      let seen = 0
      for (let node = walker.nextNode(); node && seen < 600; node = walker.nextNode(), seen++) {
        if (!node.data.trim() || !range.intersectsNode(node)) continue
        if (node.parentElement && isGlyphFont(node.parentElement)) return true
      }
    }
    return false
  }

  function isGlyphFont(el) {
    if (el.closest('.glyph, [lang="x-cascade"]')) return true
    return /^\s*["']?Cascade Glyphs/i.test(getComputedStyle(el).fontFamily)
  }

  function onCopy() {
    let glyphy = false
    try { glyphy = selectionIsGlyphs(document.getSelection()) } catch { glyphy = false }
    if (!glyphy) return
    const now = performance.now()
    if (now - lastCopy < 2500) return
    lastCopy = now
    const first = ctx.memory?.markSecret?.('copied-glyphs')
    whisper(first || copies === 0 ? COPY_WHISPERS[0] : COPY_WHISPERS[copies % COPY_WHISPERS.length])
    copies++
    ctx.bus?.emit('glyphs:copied', {})
  }
  document.addEventListener('copy', onCopy)

  // Mercy: whatever is moving stops where it stands (and stays readable until its timer takes it).
  ctx.bus?.on('mercy:change', ({ on } = {}) => {
    if (!on) return
    for (const el of veil.querySelectorAll('.glyph-rise, .glyph-bloom, .glyph-naming')) el.classList.add('is-still')
    for (const el of voice.querySelectorAll('.glyph-whisper')) el.classList.add('is-still')
  })

  // A new face: whatever was written in the air belongs to the old one.
  ctx.bus?.on('face:leaving', () => {
    for (const el of risers) el.remove()
    risers.clear()
    for (const el of blooms) el.remove()
    blooms.clear()
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
    '%': 'the share', '_': 'the ground', '~': 'the sibling', '^': 'the begins-with', '—': 'the long Bar',
    '…': 'three Seeds, and on', '·': 'the middle Seed',
  }
  function exemplar() {
    document.querySelector('.glyph-exemplar')?.remove()
    const cells = Object.entries(ALPHABET).map(([l, a]) => h('div', { class: 'glyph-exemplar__cell' },
      h('span', { class: 'glyph', lang: 'x-cascade' }, l),
      h('small', {}, `${l.toUpperCase()} · ${a.name}`),
      h('small', {}, a.sign),
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
      h('span', { class: 'glyph', lang: 'x-cascade' }, ''),
      h('small', {}, 'U+E000 · the watcher'),
      h('small', {}, 'displaced from nothing'),
    )
    const sizes = [14, 18, 24, 36, 60, 120].map((px) => h('p', { class: 'glyph-exemplar__line glyph', lang: 'x-cascade', style: { fontSize: `${px}px` } },
      px >= 60 ? 'the third word' : script.toPua(script.INSCRIPTION)))
    const close = h('button', { class: 'glyph-exemplar__close', type: 'button', onclick: () => shut() }, 'close the exemplar')
    const onEsc = (e) => { if (e.key === 'Escape') shut() }
    const panel = h('section', { class: 'glyph-exemplar', 'aria-label': 'The Scribe’s Exemplar of the Cascade Glyphs', 'aria-live': 'off' },
      h('header', { class: 'glyph-exemplar__head' },
        h('h2', {}, `${script.SCRIPT.name}, ${script.SCRIPT.epithet}`),
        close),
      h('p', { class: 'glyph-exemplar__intro' }, `${script.SCRIPT.rule} Numerals: ${script.NUMERALS.rule}.`),
      h('div', { class: 'glyph-exemplar__grid' }, cells, digits, marks, watcher),
      sizes,
    )
    function shut() {
      removeEventListener('keydown', onEsc)
      panel.remove()
    }
    addEventListener('keydown', onEsc)
    host.append(panel)
    close.focus({ preventScroll: true })
    return panel
  }
  if (ctx.params?.get('debug') === 'glyphs') exemplar()

  ctx.glyphs = {
    ...script,
    rise,
    bloom,
    whisper,
    name,
    exemplar,
    // Resolves when the glyph font is ready (for canvas drawing or measuring).
    ready: document.fonts?.load ? document.fonts.load(`32px "${script.FONT_FAMILY}"`, 'a').then(() => true, () => false) : Promise.resolve(false),
  }
}
