// RECEIVER No. 1: a radio-teletype page printer. Prints in capitals on canary paper at a steady
// clatter, and punches every character into a paper tape in real ITA2 (Baudot–Murray) code,
// with LTRS/FIGS shifts, carriage returns and line feeds where a real machine would put them.
// Focus the paper and type to transmit; Enter sends, and the Mothership answers.
// Sometimes the punch runs while the paper stands still: the tape carries a line the paper never prints
// (punchOnly). Whoever reads the holes may key it in.
// Mercy: every line prints at once. Visitor text is only ever set with text nodes.
import { h } from '../../lib/dom.js'
import { tty } from './util.js'

const LTRS = {
  A: '11000', B: '10011', C: '01110', D: '10010', E: '10000', F: '10110', G: '01011', H: '00101', I: '01100',
  J: '11010', K: '11110', L: '01001', M: '00111', N: '00110', O: '00011', P: '01101', Q: '11101', R: '01010',
  S: '10100', T: '00001', U: '11100', V: '01111', W: '11001', X: '10111', Y: '10101', Z: '10001',
}
// Figures share the letter codes, under the FIGS shift.
const FIGS = { 1: 'Q', 2: 'W', 3: 'E', 4: 'R', 5: 'T', 6: 'Y', 7: 'U', 8: 'I', 9: 'O', 0: 'P', '-': 'A', '?': 'B', ':': 'C', '.': 'M', ',': 'N', '(': 'K', ')': 'L', "'": 'J', '/': 'X', '+': 'Z', '=': 'V' }
const CODE = { SPACE: '00100', CR: '00010', LF: '01000', FIGS: '11011', LTRS: '11111' }

const CHAR_MS = 38
const LINE_MS = 240
const MAX_LINES = 90
const TAPE_PITCH = 9

export function teletype(ctx, life, { onSend, label = 'Receiver No. 1' } = {}) {
  const head = h('span', { class: 'dep-tty-head', 'aria-hidden': 'true' })
  const roll = h('div', { class: 'dep-roll' })
  const paper = h('div', {
    class: 'dep-paper', tabindex: '0', role: 'log', 'aria-live': 'off',
    'aria-label': 'Teletype paper. Focus it and type to transmit to the Mothership; Enter sends.',
  }, roll)
  const tape = h('canvas', { class: 'dep-tape', 'aria-hidden': 'true' })
  const kbd = h('p', { class: 'dep-tty-kbd' }, 'Or click the paper and type straight onto it.')
  const field = h('input', {
    id: 'dep-tty-field', class: 'dep-tty-field', type: 'text', maxlength: '60',
    autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', enterkeyhint: 'send',
  })
  const form = h('form', { class: 'dep-tty-form' },
    h('label', { for: 'dep-tty-field' }, 'Transmit'),
    field,
    h('button', { type: 'submit' }, 'Send'),
  )
  // The tape can be pulled back by hand (drag, sideways scroll, or the arrow keys) to read what went by.
  const slot = h('div', {
    class: 'dep-tape-slot', tabindex: '0', role: 'slider', 'aria-orientation': 'horizontal',
    'aria-label': 'Paper tape, punched in ITA2. Pull it back to read what was punched.',
    'aria-valuemin': '0', 'aria-valuemax': '0', 'aria-valuenow': '0', 'aria-valuetext': 'at the punch',
  }, tape, h('span', { class: 'dep-tape-label dep-can', 'aria-hidden': 'true' }, 'ITA2 · pull to read back'))
  const el = h('div', { class: 'dep-tty' },
    slot,
    paper,
    form,
    kbd,
  )

  const queue = []
  let busy = false
  let cols = 60
  let shift = 'LTRS'
  const holes = []
  let composing = null // { line, text }
  let atBottom = true

  // ---- the tape ------------------------------------------------------------------------------
  let back = 0 // how many codes the tape has been pulled back by hand
  let slack = null
  // The tape's size is read only when the page is measured (never per character, which would force a layout).
  let tapeW = 0, tapeH = 0
  const sizeTape = () => { tapeW = tape.clientWidth; tapeH = tape.clientHeight }
  const visibleCodes = () => Math.ceil((tapeW || 300) / TAPE_PITCH)
  const maxBack = () => Math.max(0, holes.length - Math.floor(visibleCodes() * 0.5))
  function setBack(v) {
    back = Math.max(0, Math.min(maxBack(), Math.round(v)))
    slot.setAttribute('aria-valuemax', String(maxBack()))
    slot.setAttribute('aria-valuenow', String(back))
    slot.setAttribute('aria-valuetext', back ? `pulled back ${back} codes` : 'at the punch')
    el.classList.toggle('is-pulled', back > 0)
    drawTape()
    slack?.()
    // Left alone, the machine takes up the slack again.
    slack = back ? life.timeout(() => setBack(0), 30000) : null
  }
  function punchCode(bits) {
    holes.push(bits)
    if (back) back++ // a pulled tape stays where the hand left it
    if (holes.length > 600) holes.splice(0, holes.length - 600)
    if (back && back > maxBack()) back = maxBack()
  }
  function punch(ch) {
    if (ch === ' ') return punchCode(CODE.SPACE)
    if (LTRS[ch]) {
      if (shift !== 'LTRS') { punchCode(CODE.LTRS); shift = 'LTRS' }
      return punchCode(LTRS[ch])
    }
    if (FIGS[ch]) {
      if (shift !== 'FIGS') { punchCode(CODE.FIGS); shift = 'FIGS' }
      return punchCode(LTRS[FIGS[ch]])
    }
    punchCode(CODE.LTRS) // unknown to Murray: rubbed out, all five holes
  }
  function punchLineEnd() { punchCode(CODE.CR); punchCode(CODE.LF) }

  let tapeQueued = false
  function drawTape() {
    if (tapeQueued) return
    tapeQueued = true
    life.raf(() => { tapeQueued = false; paintTape() })
  }
  function paintTape() {
    if (!tapeW) sizeTape()
    const w = tapeW || 300
    const hgt = tapeH || 34
    const dpr = Math.min(2, devicePixelRatio || 1)
    if (tape.width !== Math.round(w * dpr)) { tape.width = Math.round(w * dpr); tape.height = Math.round(hgt * dpr) }
    const c = tape.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.clearRect(0, 0, w, hgt)
    // Five data channels, with the small feed (sprocket) hole between channels 2 and 3.
    const rows = [0.15, 0.31, 0.6, 0.76, 0.92].map((f) => f * hgt)
    const feedY = 0.455 * hgt
    const n = Math.ceil(w / TAPE_PITCH)
    const end = holes.length - back
    const start = Math.max(0, end - n - 1)
    c.fillStyle = '#17132b'
    for (let i = start; i < end; i++) {
      const x = w - 18 - (end - 1 - i) * TAPE_PITCH
      if (x < -TAPE_PITCH) continue
      c.beginPath(); c.arc(x, feedY, 1.2, 0, Math.PI * 2); c.fill()
      const bits = holes[i]
      for (let b = 0; b < 5; b++) {
        if (bits[b] !== '1') continue
        c.beginPath(); c.arc(x, rows[b], 2.5, 0, Math.PI * 2); c.fill()
      }
    }
  }

  let pull = null
  life.listen(slot, 'pointerdown', (e) => {
    if (e.button !== 0) return
    pull = { x: e.clientX, b: back }
    slot.setPointerCapture?.(e.pointerId)
    el.classList.add('is-pulling')
  })
  life.listen(slot, 'pointermove', (e) => { if (pull) setBack(pull.b + (e.clientX - pull.x) / TAPE_PITCH) })
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) life.listen(slot, t, () => { pull = null; el.classList.remove('is-pulling') })
  // Only a sideways scroll pulls the tape; an upright wheel still scrolls the page.
  life.listen(slot, 'wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
    e.preventDefault()
    setBack(back - e.deltaX / TAPE_PITCH)
  }, { passive: false })
  life.listen(slot, 'keydown', (e) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 20, PageDown: -20 }[e.key]
    if (step) { e.preventDefault(); setBack(back + step * 2) }
    else if (e.key === 'Home') { e.preventDefault(); setBack(0) }
    else if (e.key === 'End') { e.preventDefault(); setBack(maxBack()) }
  })

  // ---- the paper -----------------------------------------------------------------------------
  function measure() {
    sizeTape()
    const probe = h('span', { class: 'dep-probe' }, 'MMMMMMMMMM')
    roll.append(probe)
    const cw = probe.getBoundingClientRect().width / 10
    probe.remove()
    const inner = paper.clientWidth - 28
    if (cw > 0 && inner > 0) cols = Math.max(18, Math.min(72, Math.floor(inner / cw) - 1))
  }

  function wrap(text) {
    const words = String(text).split(' ')
    const lines = []
    let cur = ''
    for (let w of words) {
      while (w.length > cols) { if (cur) { lines.push(cur); cur = '' } lines.push(w.slice(0, cols)); w = w.slice(cols) }
      if (!cur) cur = w
      else if (cur.length + 1 + w.length <= cols) cur += ' ' + w
      else { lines.push(cur); cur = w }
    }
    if (cur) lines.push(cur)
    return lines
  }

  function newLine(cls) {
    const text = document.createTextNode('')
    const line = h('div', { class: `dep-line ${cls ?? ''}`.trim() })
    line.append(text)
    line.style.setProperty('--wob', `${((holes.length * 7) % 5) - 2}`)
    roll.insertBefore(line, composing?.line ?? null)
    while (roll.children.length > MAX_LINES) roll.firstElementChild.remove()
    return { line, text }
  }

  function follow() {
    if (atBottom) paper.scrollTop = paper.scrollHeight
  }
  life.listen(paper, 'scroll', () => {
    atBottom = paper.scrollHeight - paper.scrollTop - paper.clientHeight < 24
  }, { passive: true })

  function instant() { return ctx.mercy.on || document.hidden }

  let lastPrinted = null
  function pump() {
    if (busy || life.dead) return
    const item = queue.shift()
    if (!item) return
    busy = true
    if (item.text != null) lastPrinted = item
    if (item.tape != null) {
      punchTape(item)
      return
    }
    if (item.gap) {
      life.timeout(() => { busy = false; pump() }, instant() ? 0 : item.gap)
      return
    }
    const { line, text } = newLine(item.cls)
    line.append(head)
    const s = item.text
    if (instant()) {
      text.data = s
      for (const ch of s) punch(ch)
      punchLineEnd()
      drawTape(); follow()
      busy = false
      life.timeout(pump, 0)
      return
    }
    let i = 0
    const tick = () => {
      if (instant()) {
        text.appendData(s.slice(i))
        for (const ch of s.slice(i)) punch(ch)
        i = s.length
      } else {
        text.appendData(s[i])
        punch(s[i])
        i++
      }
      drawTape()
      if (i < s.length) { life.timeout(tick, CHAR_MS); return }
      punchLineEnd()
      follow()
      life.timeout(() => { busy = false; pump() }, LINE_MS)
    }
    follow()
    tick()
  }

  // The punch runs, the paper does not move. Leader (two LTRS) first, as on any real tape.
  function punchTape(item) {
    const s = item.tape
    el.classList.add('is-tapeonly')
    punchCode(CODE.LTRS); punchCode(CODE.LTRS); shift = 'LTRS'
    let i = 0
    const done = () => {
      el.classList.remove('is-tapeonly')
      drawTape()
      life.timeout(() => { busy = false; pump() }, instant() ? 0 : LINE_MS * 2)
    }
    const tick = () => {
      if (instant()) {
        for (const ch of s.slice(i)) punch(ch)
        i = s.length
      } else {
        punch(s[i])
        i++
      }
      drawTape()
      if (i < s.length) life.timeout(tick, CHAR_MS * 1.6)
      else done()
    }
    tick()
  }
  function punchOnly(text) {
    queue.push({ tape: tty(text) })
    pump()
  }

  // Print a message: a string or a list of lines. Long lines are wrapped at the paper's width.
  // Urgent messages (answers to something the visitor just did) go to the head of the queue; the
  // machine finishes the line it is on, then prints them.
  function print(lines, { cls, gap = 800, urgent = false } = {}) {
    const items = []
    for (const raw of [].concat(lines)) {
      for (const l of wrap(tty(raw))) items.push({ text: l, cls: cls ?? (/^(ZCZC|PRIORITY|NNNN)/.test(l) ? 'is-red' : ''), urgent })
    }
    if (gap) items.push({ gap: urgent ? 500 : gap, urgent })
    if (urgent) {
      // Ahead of the routine traffic, but behind any answer already waiting, so two answers never
      // interleave. Breaking into a routine message halfway, the operator keys BK first, as they did.
      let at = queue.findIndex((q) => !q.urgent)
      if (at < 0) at = queue.length
      if (at === 0 && queue[0]?.text != null && lastPrinted && !lastPrinted.urgent) items.unshift({ text: 'BK', cls: 'is-red', urgent })
      queue.splice(at, 0, ...items)
    } else {
      queue.push(...items)
    }
    if (queue.length > 160) queue.splice(0, queue.length - 160)
    pump()
  }

  // ---- the keyboard --------------------------------------------------------------------------
  // Two ways to transmit: a labelled field (works with any keyboard, real or virtual, and with screen
  // readers), or, on a desktop, clicking the paper and typing straight onto it. Both echo onto the
  // roll as an outgoing line and punch the tape.
  const maxLen = () => Math.min(60, cols - 3)
  function compose(text) {
    const next = tty(text).slice(0, maxLen())
    if (!composing) {
      const node = document.createTextNode('> ')
      const line = h('div', { class: 'dep-line is-out is-composing' })
      line.append(node)
      roll.append(line)
      composing = { line, node, text: '' }
    }
    const prev = composing.text
    if (next.startsWith(prev)) for (const ch of next.slice(prev.length)) punch(ch)
    else punchCode(CODE.LTRS) // a real tape can only be rubbed out, never un-punched
    composing.text = next
    composing.node.data = '> ' + next
    composing.line.append(head)
    drawTape()
    atBottom = true
    follow()
  }
  function send() {
    if (!composing) return
    const sent = composing.text
    composing.line.classList.remove('is-composing')
    head.remove()
    punchLineEnd(); drawTape()
    composing = null
    field.value = ''
    if (sent.trim()) life.timeout(() => onSend?.(sent), instant() ? 0 : 900)
  }

  life.listen(paper, 'focus', () => { kbd.textContent = 'Keyboard connected to the paper. Type, and press Enter to transmit.'; el.classList.add('is-keyed') })
  life.listen(paper, 'blur', () => { kbd.textContent = 'Or click the paper and type straight onto it.'; el.classList.remove('is-keyed') })
  life.listen(paper, 'keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === 'Enter') { e.preventDefault(); send(); return }
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (composing?.text) compose(composing.text.slice(0, -1))
      return
    }
    if (e.key.length !== 1) return
    e.preventDefault()
    compose((composing?.text ?? '') + e.key)
  })
  life.listen(field, 'input', () => compose(field.value))
  life.listen(form, 'submit', (e) => { e.preventDefault(); send() })

  let resizeTimer = null
  life.listen(window, 'resize', () => {
    resizeTimer?.()
    resizeTimer = life.timeout(() => { measure(); paintTape() }, 200)
  })

  // Traffic already on the roll before this visit began: printed at once, faded, then a tear.
  function past(lines) {
    for (const raw of lines) {
      for (const l of wrap(tty(raw))) {
        const { line, text } = newLine(/^(ZCZC|PRIORITY|NNNN)/.test(l) ? 'is-old is-red' : 'is-old')
        text.data = l
        for (const ch of l) punch(ch)
        punchLineEnd()
      }
    }
    const { text } = newLine('is-tear')
    text.data = '- '.repeat(Math.floor((cols - 3) / 2)).trim()
    drawTape()
    atBottom = true
    follow()
  }

  return {
    el,
    print,
    past,
    punchOnly,
    get composing() { return Boolean(composing?.text) },
    start() {
      measure()
      paintTape()
      // Fonts may arrive late and change the width of a character.
      document.fonts?.ready?.then(() => { if (!life.dead) { measure(); paintTape() } })
    },
    get idle() { return !busy && queue.length === 0 },
    label,
  }
}
