// THE WAR OF GRACE (specificity war). Two rules claim one element. The rules are REAL: they are written
// into <style id="hell-grace"> inside @layer hell, and the browser's own cascade decides who wins, exactly
// as the tag beside the element says. Each round the loser seizes more Grace (a class, an ancestor, an
// id, the Pride of Ids) and the element's colour and bearing trade sides, never faster than one change
// every 1.6 s. At the end somebody speaks the Inversion, or both are cleared, and the element returns.
import { h } from '../../lib/dom.js'
import { bodies, KINDS, aboveStart, inkRect, seen } from './core.js'

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi']
const NOT_IDS = ['#void', '#the-lost', '#nobody', '#the-old-law', '#mothership', '#the-last-selector']
const PSEUDOS = [':nth-child(n)', ':nth-of-type(n)', ':not(:empty)']
// What each side declares, by lot: a colour, and a bearing. Both sides declare the SAME properties
// with different values, so the whole of the element's look belongs to whoever holds more Grace.
const BEARINGS = [
  ['font-weight: 800', 'font-weight: 300'],
  ['font-style: normal; font-variant-caps: all-small-caps', 'font-style: italic; font-variant-caps: normal'],
  ['letter-spacing: 0.08em', 'letter-spacing: -0.015em'],
  ['text-decoration: underline wavy 1px', 'text-decoration: line-through 1px'],
  ['font-style: italic', 'font-style: normal'],
]
const HEAD = {
  sanctum: 'Gratia',
  possession: 'specificity',
  recruitment: 'GRACE WAR!!',
  ashram: 'Grace · anugraha',
  departure: 'GRACE · CONTESTED SIGNAL',
  babel: 'Grace',
}
let serial = 0 // war names stay unique across schisms

const spec = (s) => [
  s.anc.filter((a) => a.id).length + s.nots.length,
  s.anc.reduce((n, a) => n + a.classes.length, 0) + s.attrs + s.pseudos.length,
  s.anc.filter((a) => a.tag).length + (s.tag ? 1 : 0),
]
const fmt = (t) => `(${t.join(',')})`
const cmp = (a, b) => (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2])
const identOk = (s) => /^-?[_a-zA-Z][\w-]{0,30}$/.test(s)

export function createWars(env) {
  const { ctx, rng, veils, clock, I } = env
  const style = h('style', { id: 'hell-grace', 'data-owner': 'layer:hell' })
  document.head.append(style)
  const wars = new Set()
  const max = I < 0.35 ? 1 : I < 0.75 ? 2 : 3
  let dead = false

  // ── The rules ───────────────────────────────────────────────────────────────────────────────
  // Mercy's gate adds no Grace (:where), so the scores shown are the scores the browser counts.
  const GATE = ':where(:not([data-mercy="on"]))'
  function selector(w, s, gate = false) {
    const root = document.documentElement
    const parts = s.anc.slice().sort((x, y) => x.depth - y.depth).map((a) =>
      `${a.tag ? a.tagName : ''}${a.id ? `#${CSS.escape(a.id)}` : ''}${a.classes.map((c) => `.${CSS.escape(c)}`).join('')}${gate && a.el === root ? GATE : ''}`)
    const self = `${s.tag ? w.tagName : ''}${`[data-war="${w.id}"]`.repeat(s.attrs)}${s.pseudos.join('')}${s.nots.map((n) => `:not(${n})`).join('')}`
    const sel = [...parts, self].join(' ')
    if (!gate || s.anc.some((a) => a.el === root)) return sel
    return `:where(html:not([data-mercy="on"])) ${sel}`
  }
  const gated = (w, s) => selector(w, s, true)
  function render() {
    let css = '/* THE WAR OF GRACE (layer:hell). Two rules claim one element; the Cascade decides, as it always has.\n'
    css += '   These rules are real. Inspect the element and watch the loser get struck through.\n'
    css += '   Where a rule says !important it is a deliberate Inversion (Canon §4), spoken by a side losing a war. */\n@layer hell {\n'
    for (const w of wars) {
      if (w.over) continue
      for (const key of w.order) {
        const s = w[key]
        const imp = s.important ? ' !important' : ''
        css += `  ${gated(w, s)} { ${s.decls.map((d) => `${d}${imp}`).join('; ')}; }\n`
      }
    }
    style.textContent = `${css}}\n`
  }

  // ── Grace: what a losing side may seize ─────────────────────────────────────────────────────
  function lineage(el) {
    const out = []
    let depth = 0
    for (let p = el.parentElement; p; p = p.parentElement) out.push(p)
    out.reverse()
    return out.map((p) => ({
      el: p,
      depth: depth++,
      tagName: p.tagName.toLowerCase(),
      id: p.id && identOk(p.id) ? p.id : '',
      classes: [...p.classList].filter((c) => identOk(c) && !c.startsWith('hell') && !/^is-/.test(c)).slice(0, 3),
    }))
  }
  function entry(s, a) {
    let e = s.anc.find((x) => x.el === a.el)
    if (!e) {
      e = { el: a.el, depth: a.depth, tagName: a.tagName, tag: false, id: '', classes: [] }
      s.anc.push(e)
    }
    return e
  }
  function options(w, s, round) {
    const o = []
    for (const a of w.line) {
      const e = s.anc.find((x) => x.el === a.el)
      const free = a.classes.filter((c) => !e?.classes.includes(c))
      if (free.length) o.push([3, () => { const c = rng.pick(free); entry(s, a).classes.push(c); return `+ .${c}` }])
      if (!e?.tag && ['html', 'body', 'main', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'ul', 'ol', 'div'].includes(a.tagName)) {
        o.push([1.3, () => { entry(s, a).tag = true; return `+ ${a.tagName}` }])
      }
      if (a.id && !e?.id && round >= 2) o.push([1.4, () => { entry(s, a).id = a.id; return `+ #${a.id}` }])
    }
    if (!s.tag) o.push([1.6, () => { s.tag = true; return `+ ${w.tagName}` }])
    if (s.attrs < 3) o.push([1, () => { s.attrs++; return 'doubles its attribute' }])
    const pseudo = PSEUDOS.find((p) => !s.pseudos.includes(p))
    if (pseudo) o.push([1, () => { s.pseudos.push(pseudo); return `+ ${pseudo}` }])
    const not = NOT_IDS.find((n) => !s.nots.includes(n) && !document.querySelector(n))
    if (not && round >= 3) o.push([0.9, () => { s.nots.push(not); return `+ :not(${not})` }])
    return o
  }
  function escalate(w, s, round) {
    const o = options(w, s, round)
    if (!o.length) return null
    const total = o.reduce((n, [wt]) => n + wt, 0)
    let r = rng() * total
    for (const [wt, fn] of o) if ((r -= wt) < 0) return fn()
    return o[o.length - 1][1]()
  }
  function winner(w) {
    const { a, b } = w
    if (a.important !== b.important) return a.important ? 'a' : 'b'
    const c = cmp(spec(a), spec(b))
    if (c) return c > 0 ? 'a' : 'b'
    return w.order[1] // a tie: the later rule is heard
  }

  // ── The tag ─────────────────────────────────────────────────────────────────────────────────
  function drawTag(w, status) {
    const win = winner(w)
    const tie = !cmp(spec(w.a), spec(w.b)) && w.a.important === w.b.important
    const row = (key) => h('div', { class: `hell-war__row${win === key ? ' is-winning' : ''}`, 'data-side': key },
      h('i', { class: 'hell-war__swatch' }),
      h('code', { class: 'hell-war__sel' }, shorten(selector(w, w[key]))),
      w[key].important ? h('b', { class: 'hell-war__imp' }, '!important') : null,
      h('span', { class: 'hell-war__score' }, fmt(spec(w[key]))),
    )
    w.tag.replaceChildren(
      h('div', { class: 'hell-war__head' }, h('b', {}, HEAD[ctx.face] ?? 'Grace'), h('span', {}, `war ${w.id} · round ${w.round}`)),
      row(w.order[0]), row(w.order[1]),
      h('div', { class: 'hell-war__status' }, tie && !status.includes('tie') ? `${status} · tie, the later is heard` : status),
    )
    veils.refresh()
  }
  const shorten = (s) => (s.length > 42 ? `…${s.slice(-41)}` : s)

  // ── A war ───────────────────────────────────────────────────────────────────────────────────
  function choose() {
    const taken = [...wars].map((w) => w.el)
    const clash = (el) => taken.some((t) => t === el || t.contains(el) || el.contains(t))
    // A war wants a field worth fighting over: a heading or a short paragraph, not a folio number.
    const fit = ({ el, r }) => !clash(el) && !el.hasAttribute('data-war') && inkRect(el).width >= 90 && r.height >= 16
    let pool = bodies(ctx.root, KINDS.heading, { text: true, minChars: 3, margin: -40 })
      .filter((b) => fit(b) && b.el.textContent.trim().length <= 140)
    if (!pool.length || rng.chance(0.35)) {
      pool = pool.concat(bodies(ctx.root, KINDS.text, { text: true, minChars: 24, margin: -40 })
        .filter((b) => fit(b) && b.el.textContent.trim().length <= 260))
    }
    // Nothing is fought over that the visitor cannot see (behind a banner, under a fixed bar).
    return rng.shuffle(pool).find(({ el, r }) => seen(el, r))?.el ?? null
  }

  async function wage() {
    const el = choose()
    if (!el) return false
    const id = ROMAN[serial++ % ROMAN.length]
    const [da, db] = rng.pick(BEARINGS)
    const tagName = el.tagName.toLowerCase()
    const w = {
      id, el, tagName, round: 0, over: false, line: lineage(el),
      order: rng.chance(0.5) ? ['a', 'b'] : ['b', 'a'],
      a: { name: 'a', anc: [], tag: true, attrs: 1, pseudos: [], nots: [], important: false, decls: ['color: var(--hell-war-a)', ...da.split('; ')] },
      b: { name: 'b', anc: [], tag: false, attrs: 1, pseudos: [], nots: [], important: false, decls: ['color: var(--hell-war-b)', ...db.split('; ')] },
    }
    w.tag = veils.mark(el, h('div', { class: 'hell-tag hell-war' }), aboveStart)
    el.setAttribute('data-war', id)
    wars.add(w)
    render()
    drawTag(w, 'two rules claim one element')
    const alive = () => !dead && !w.over && el.isConnected
    // Never faster than one change in 1.6 s, however hot the war (Canon §8, §9).
    const beat = () => clock.wait(Math.max(1600, env.rng.float(1700, 3300) / (0.85 + I * 0.35)))
    const rounds = rng.int(4, 8)
    for (let i = 1; i <= rounds; i++) {
      await beat()
      if (!alive()) return end(w)
      w.round = i
      const before = winner(w)
      const loser = before === 'a' ? w.b : w.a
      const step = escalate(w, loser, i)
      if (!step) break
      render()
      const now = winner(w)
      drawTag(w, `${step} → ${now !== before ? 'wins' : 'not enough grace'}`)
      if (spec(loser)[0] >= 3) break // the Pride of Ids
    }
    // The finale, by lot.
    await beat()
    if (!alive()) return end(w)
    w.round++
    const fin = rng.weighted({ inversion: 3 + I * 2, clear: 2, revert: 1.2 })
    if (fin === 'inversion') {
      const first = winner(w) === 'a' ? w.b : w.a
      first.important = true
      render()
      drawTag(w, spec(first)[0] >= 3 ? 'the Pride of Ids · then the Inversion' : 'the loser speaks the Inversion')
      await beat()
      if (!alive()) return end(w)
      const second = first === w.a ? w.b : w.a
      second.important = true
      w.round++
      render()
      drawTag(w, '!important answers !important · Grace decides')
      await beat()
      if (!alive()) return end(w)
      w.tag.classList.add('is-struck')
      drawTag(w, 'nobody is saved · Mercy is the only righteous Inversion')
    } else if (fin === 'clear') {
      w.tag.classList.add('is-struck')
      drawTag(w, 'clear: both · the rules are struck out')
    } else {
      w.tag.classList.add('is-struck')
      drawTag(w, 'revert-layer · the Cascade forgets them both')
    }
    await clock.wait(1800)
    return end(w)
  }

  function end(w) {
    if (!wars.has(w)) return
    w.over = true
    render()
    w.tag.classList.add('is-ending')
    const { el, tag } = w
    setTimeout(() => {
      wars.delete(w)
      veils.unmark(tag)
      if (el.getAttribute('data-war') === w.id) el.removeAttribute('data-war')
      render()
    }, ctx.mercy?.on || dead ? 0 : 1100)
  }

  // New wars begin while fewer than `max` are being fought.
  function muster() {
    if (dead) return
    if (wars.size < max) wage().catch((e) => console.error('[layer:hell] war', e))
    clock.after(rng.float(9000, 26000) / (0.35 + I), muster)
  }
  clock.after(rng.float(6000, 20000) / (0.4 + I), muster)

  return {
    trigger: () => wage(),
    get count() { return wars.size },
    stop() {
      dead = true
      for (const w of [...wars]) {
        w.over = true
        veils.unmark(w.tag)
        if (w.el.getAttribute('data-war') === w.id) w.el.removeAttribute('data-war')
      }
      wars.clear()
      style.remove()
    },
  }
}
