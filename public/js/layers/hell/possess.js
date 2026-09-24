// POSSESSION TEXT. Rarely, when your pointer rests on a word, the word is taken: it turns into glyphs,
// and comes back as what it means in the doctrine (or, if it was a sacred word, as the CSS it always
// was). It gives the word back when you move on. Now and then a word is taken with no pointer at all.
import { TEXT_SPARE, KINDS, bodies } from './core.js'
import { meaningOf, KNOWN } from './words.js'

const WORDCHAR = /[A-Za-z0-9'’!-]/

export function createPossession(env) {
  const { ctx, rng, clock, I } = env
  const odds = 0.14 + 0.46 * I
  const cool = () => rng.float(18000, 45000) / (0.5 + I)
  let active = null
  let restTimer = 0
  let quietUntil = performance.now() + 12000
  let dead = false

  function caret(x, y) {
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y)
      return p ? [p.offsetNode, p.offset] : null
    }
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y)
      return r ? [r.startContainer, r.startOffset] : null
    }
    return null
  }

  function usable(node) {
    const parent = node?.nodeType === 3 ? node.parentElement : null
    return parent && ctx.root.contains(parent) && !parent.closest(TEXT_SPARE) && !parent.closest('.hell-possessed')
  }

  // The word under (x, y), only if the pointer is really on it.
  function wordAt(x, y) {
    const c = caret(x, y)
    if (!c || !usable(c[0])) return null
    const [node, offset] = c
    const text = node.data
    let s = offset
    let e = offset
    while (s > 0 && WORDCHAR.test(text[s - 1])) s--
    while (e < text.length && WORDCHAR.test(text[e])) e++
    while (s < e && /['’!-]/.test(text[s]) && text[s] !== '!') s++
    while (e > s && /['’-]/.test(text[e - 1])) e--
    if (e - s < 3) return null
    const range = document.createRange()
    range.setStart(node, s)
    range.setEnd(node, e)
    const on = [...range.getClientRects()].some((r) => x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 2 && y <= r.bottom + 2)
    return on ? { node, s, e, word: text.slice(s, e) } : null
  }

  function shape(meaning, word) {
    let t = meaning.text
    if (/^[A-Z]{2,}$/.test(word.replace(/[^A-Za-z]/g, '')) && word.length > 2) return t.toUpperCase()
    if (/^[A-Z]/.test(word) && /^[a-z]/.test(t)) t = t[0].toUpperCase() + t.slice(1)
    return t
  }

  // Take the word at [s, e) of a text node.
  function take({ node, s, e, word }, { hold = 0 } = {}) {
    if (active || dead || ctx.mercy?.on) return false
    const meaning = meaningOf(word)
    if (!meaning) return false
    const parent = node.parentNode
    const original = word
    const rest = node.splitText(s)
    const after = rest.splitText(e - s)
    const span = document.createElement('span')
    span.className = 'hell-possessed is-turning'
    span.dataset.kind = meaning.kind
    parent.insertBefore(span, rest)
    span.append(rest)
    const a = { node, rest, after, span, original, parent, timers: [], mo: null, leaveAt: 0 }
    active = a
    const watch = () => a.mo?.observe(parent, { childList: true, characterData: true, subtree: true })
    // The face rewrote this text while it was possessed: give it back at once and step aside.
    a.mo = new MutationObserver(() => heal(a, true))
    watch()
    const write = (fn) => { a.mo.disconnect(); fn(); watch() }
    a.timers.push(setTimeout(() => {
      write(() => {
        rest.data = shape(meaning, original)
        span.className = `hell-possessed is-possessed is-${meaning.kind}`
      })
      a.born = performance.now()
    }, 420))
    a.hold = hold || rng.float(3200, 5200)
    a.poll = setInterval(() => {
      if (!a.born) return
      const p = ctx.behavior?.pointer
      const r = span.getBoundingClientRect()
      const near = p && p.x >= r.left - 6 && p.x <= r.right + 6 && p.y >= r.top - 6 && p.y <= r.bottom + 6
      const age = performance.now() - a.born
      if ((!near && age > a.hold) || age > a.hold + 6000 || ctx.mercy?.on || document.hidden) release(a)
    }, 300)
    return true
  }

  function release(a) {
    if (a !== active || a.releasing) return
    a.releasing = true
    clearInterval(a.poll)
    a.mo.disconnect()
    a.span.className = `hell-possessed is-turning is-${a.span.dataset.kind}`
    a.timers.push(setTimeout(() => heal(a), ctx.mercy?.on ? 0 : 360))
  }

  function heal(a, interrupted = false) {
    if (a.healed) return
    a.healed = true
    clearInterval(a.poll)
    a.timers.forEach(clearTimeout)
    a.mo?.disconnect()
    const { node, rest, after, span, original } = a
    rest.data = original
    if (span.parentNode && node.nextSibling === span && span.nextSibling === after) {
      node.data = node.data + original + after.data
      after.remove()
      span.remove()
    } else if (span.parentNode) {
      span.replaceWith(rest)
    }
    if (active === a) active = null
    quietUntil = performance.now() + (interrupted ? 60000 : cool())
  }

  // The pointer rests.
  const onMove = (e) => {
    clearTimeout(restTimer)
    if (e.pointerType === 'touch' || dead) return
    const { clientX: x, clientY: y } = e
    restTimer = setTimeout(() => {
      if (active || performance.now() < quietUntil || ctx.mercy?.on || document.hidden) return
      const hit = wordAt(x, y)
      if (!hit || !meaningOf(hit.word)) return
      if (rng() >= odds) { quietUntil = performance.now() + 8000; return }
      take(hit)
    }, 1150)
  }
  addEventListener('pointermove', onMove, { passive: true })

  // A word taken with no pointer at all, somewhere in what is being read.
  function unbidden({ force = false } = {}) {
    if (active || dead || ctx.mercy?.on) return false
    const pool = bodies(ctx.root, KINDS.text, { text: true, minChars: 30, margin: -40 })
    for (const { el } of rng.shuffle(pool).slice(0, 8)) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      const hits = []
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!usable(n)) continue
        KNOWN.lastIndex = 0
        for (let m = KNOWN.exec(n.data); m; m = KNOWN.exec(n.data)) hits.push({ node: n, s: m.index, e: m.index + m[0].length, word: m[0] })
      }
      if (!hits.length) continue
      const hit = rng.pick(hits)
      const range = document.createRange()
      range.setStart(hit.node, hit.s)
      range.setEnd(hit.node, hit.e)
      const r = range.getBoundingClientRect()
      if (!force && (r.top < 40 || r.bottom > innerHeight - 40)) continue
      return take(hit, { hold: rng.float(4000, 6500) })
    }
    return false
  }
  function season() {
    if (dead) return
    if (performance.now() >= quietUntil && rng.chance(0.3 + 0.4 * I)) unbidden()
    clock.after(rng.float(40000, 90000) / (0.3 + I), season)
  }
  clock.after(rng.float(25000, 60000) / (0.3 + I), season)

  return {
    // The phantom's hand, or a face, may take the word at a point.
    at(x, y) {
      const hit = wordAt(x, y)
      return hit ? take(hit) : false
    },
    trigger: () => unbidden({ force: true }),
    get active() { return Boolean(active) },
    stop() {
      dead = true
      clearTimeout(restTimer)
      removeEventListener('pointermove', onMove)
      if (active) heal(active)
    },
  }
}
