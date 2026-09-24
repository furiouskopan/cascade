// POSSESSION / THE DEMON. An invisible hand that types CSS against the page.
// Every declaration it finishes is really applied (in a <style> it owns, inside @layer face and scoped
// under .face--possession), so the page changes because it was written, not because a class toggled.
// The visitor may uncheck any declaration, as in real devtools; the demon answers with more Grace
// (specificity), then with the Inversion (!important), and at last gives up and points at Mercy.
// All CSS here is built from this file's own data. Visitor text never reaches the stylesheet.
import { h } from '../../lib/dom.js'
import { specificity } from './devtools.js'

const HEADER = `/* possessed.css — written into this page by an invisible hand.
   Everything below is @layer face and scoped to .face--possession.
   Declarations marked !important are the Inversion, spoken on purpose (Canon §4);
   Mercy lives in the first layer and still outranks every one of them. */`

// Display selector -> real selector. "#temple" prefixes become real ids; everything stays inside .corp.
export function realSelector(display) {
  return display.split(',').map((part) => {
    let s = part.trim()
    let ids = ''
    while (s.startsWith('#temple')) {
      ids += '#temple'
      s = s.slice(7).trim()
    }
    const scope = s.startsWith('.corp') ? '' : '.corp '
    return `${ids}.face--possession ${scope}${s}`
  }).join(', ')
}

const isColor = (v) => /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(v)

export function createDemon({ ctx, rng, life, dt, styleEl, speed, effects, targets, name }) {
  const rules = []
  const queue = []
  const baselines = new Map() // group -> {spec, view, order}
  let order = 0
  let line = 13
  let apology = false
  let still = false
  let ff = 0 // fast-forward budget in ms: acts are written instantly while it lasts
  let unchecks = 0
  let reopened = 0
  let scriptDone = false
  const hands = new Set()
  const hooks = { commit: new Set() }

  // — The stylesheet —
  function cssText() {
    const out = [HEADER, '@layer face {']
    if (!apology) {
      for (const r of rules) {
        if (r.comment) continue
        const live = r.decls.filter((d) => d.typed && d.enabled && !d.invalid)
        if (!live.length) continue
        out.push(`  ${r.real} {`)
        for (const d of live) out.push(`    ${d.prop}: ${d.value}${d.important ? ' !important; /* THE INVERSION, deliberate. */' : ';'}`)
        out.push('  }')
      }
    }
    out.push('}')
    return out.join('\n')
  }

  function sourceText() {
    const out = [HEADER, '']
    for (const r of rules) {
      if (r.comment) { out.push(`/* ${r.text} */`, ''); continue }
      if (!r.decls.some((d) => d.typed)) continue
      out.push(`${r.sel} {`)
      for (const d of r.decls) {
        if (!d.typed) continue
        const text = `${d.prop}: ${d.value}${d.important ? ' !important' : ''};`
        out.push(d.enabled && !apology ? `  ${text}` : `  /* ${text} */`)
      }
      out.push('}', '')
    }
    return out.join('\n')
  }

  let sourceDirty = true
  function commit() {
    styleEl.textContent = cssText()
    resolveGroups()
    sourceDirty = true
    if (dt.tab === 'sources') renderSource()
    for (const fn of hooks.commit) fn()
  }
  function renderSource() {
    if (!sourceDirty) return
    sourceDirty = false
    dt.setSource(sourceText())
  }

  // Grace decides. Among declarations fighting over one thing, mark the losers as overridden.
  function resolveGroups() {
    const groups = new Map()
    for (const r of rules) for (const d of r.decls) {
      if (!d.group || !d.typed) continue
      if (!groups.has(d.group)) groups.set(d.group, [])
      groups.get(d.group).push(d)
    }
    for (const [key, list] of groups) {
      const base = baselines.get(key)
      const alive = list.filter((d) => d.enabled && !d.invalid && !apology)
      const all = base ? [...alive, base] : alive
      const rank = (d) => [d.important ? 1 : 0, ...d.spec, d.order]
      let win = null
      for (const d of all) {
        if (!win) { win = d; continue }
        const a = rank(d), b = rank(win)
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) { if (a[i] > b[i]) win = d; break }
        }
      }
      for (const d of [...list, ...(base ? [base] : [])]) {
        const lost = d !== win && (d === base || (d.enabled && !d.invalid))
        d.view?.row.classList.toggle('is-overridden', lost)
        if (d.view?.note) {
          d.view.note.hidden = !lost
          d.view.note.textContent = lost && win ? ` overridden by ${win.selLabel} (${win.spec.join(',')})` : ''
        }
      }
    }
  }

  // A baseline rule from corporate.css, shown at the bottom of the Styles pane.
  function baseline({ sel, src, decls, kind = 'base' }) {
    const view = dt.addRule({ sel, src, kind, where: 'bottom' })
    view.opened()
    const spec = specificity(sel)
    view.showSpec(`(${spec.join(',')})`)
    for (const d of decls) {
      const dv = view.addDecl(d)
      const model = { ...d, spec, selLabel: sel, order: -1, view: dv, enabled: true }
      if (d.group) baselines.set(d.group, model)
      if (isColor(d.value)) { dv.swatch.hidden = false; dv.swatch.style.background = d.value }
    }
    view.closed()
  }

  // — Hands: each concurrent writer has its own caret —
  function makeHand(label = name) {
    const caret = h('span', { class: 'dt-caret', 'aria-hidden': 'true' })
    const hand = {
      label,
      place(span) { span.after(caret) },
      lift() { caret.remove() },
      busy(on) {
        on ? hands.add(hand) : hands.delete(hand)
        const n = hands.size
        dt.setTyping(n > 0, n > 1 ? `${name} and ${n - 1} other${n > 2 ? 's' : ''}` : name)
      },
    }
    return hand
  }
  const main = makeHand()

  const pace = () => Math.max(0.2, speed())
  function charDelay(ch) {
    let ms = (34 + rng() * 46) / pace()
    if (ch === ' ' || ch === ':') ms += rng() * 110
    if (ch === ';' || ch === '{') ms += 140 + rng() * 220
    if (rng() < 0.03) ms += 500 + rng() * 700 // the hand hesitates
    return ms
  }

  async function typeText(span, text, hand) {
    if (hand.instant) {
      span.textContent += text
      return
    }
    if (ff > 0) {
      span.textContent += text
      ff -= text.length * 80
      return
    }
    for (const ch of text) {
      if (life.dead) return
      if (/[a-z]/.test(ch) && rng() < 0.035) {
        const wrong = String.fromCharCode(97 + ((ch.charCodeAt(0) - 97 + (rng() < 0.5 ? 1 : 25)) % 26))
        span.textContent += wrong
        hand.place(span)
        await life.wait(160 + rng() * 200)
        span.textContent = span.textContent.slice(0, -1)
        await life.wait(90 / pace())
      }
      span.textContent += ch
      hand.place(span)
      await life.wait(charDelay(ch))
    }
  }

  async function erase(span, hand) {
    if (ff > 0 || hand.instant) { span.textContent = ''; return }
    while (span.textContent.length && !life.dead) {
      span.textContent = span.textContent.slice(0, -1)
      hand.place(span)
      await life.wait((26 + rng() * 22) / pace())
    }
  }

  // — Writing —
  function nextLine(step = 3) {
    line += step + Math.floor(rng() * 9)
    if (rng() < 0.08) line = rng.pick([404, 666, 1996])
    return line
  }

  async function writeComment(text, hand = main) {
    const view = dt.addRule({ comment: true, src: `possessed.css:${nextLine(1)}` })
    const model = { comment: true, text, decls: [], view }
    rules.push(model)
    hand.busy(true)
    hand.place(view.selEl)
    await typeText(view.selEl, `/* ${text} */`, hand)
    hand.lift()
    hand.busy(false)
    sourceDirty = true
    return model
  }

  async function writeRule(spec, hand = main) {
    const view = dt.addRule({ sel: '', src: `possessed.css:${nextLine()}`, kind: 'demon' })
    const r = { sel: spec.sel, real: spec.real ?? realSelector(spec.sel), spec: specificity(spec.sel), decls: [], view, family: spec.family ?? null }
    rules.push(r)
    const target = spec.target ? targets[spec.target] ?? null : null
    if (target) { dt.select(target); dt.markPossessed(target) }
    hand.busy(true)
    hand.place(view.selEl)
    await typeText(view.selEl, spec.sel, hand)
    view.opened()
    view.showSpec(`(${r.spec.join(',')})`)
    for (const d of spec.decls) {
      if (life.dead) return r
      await writeDecl(r, d, hand)
    }
    view.closed()
    hand.lift()
    hand.busy(false)
    return r
  }

  async function writeDecl(r, d, hand) {
    const view = r.view.addDecl({})
    const decl = { prop: d.prop, value: d.value, important: !!d.important, group: d.group ?? null, enabled: true, typed: false, invalid: null, order: ++order, rule: r, spec: r.spec, selLabel: r.sel, view, family: d.family ?? r.family ?? { level: 0, prop: d.prop }, rechecked: 0 }
    view.check.setAttribute('aria-label', `Disable ${d.prop} on ${r.sel}`)
    r.decls.push(decl)
    view.check.addEventListener('change', () => toggle(decl, view.check.checked, 'visitor'))
    hand.place(view.prop)
    await typeText(view.prop, d.prop, hand)
    view.colon.hidden = false
    hand.place(view.val)
    await typeText(view.val, d.value, hand)
    if (d.important) {
      hand.place(view.imp)
      await typeText(view.imp, ' !important', hand)
    }
    view.semi.hidden = false
    hand.place(view.semi)
    decl.typed = true
    if (d.invalid) markInvalid(decl, d.invalid)
    swatch(decl)
    commit()
    if (d.important) {
      dt.log('warn', `${r.sel} { ${d.prop}: ${d.value} !important } — the Inversion was spoken.`, `possessed.css:${line}`)
      if (ctx.audio?.summoned) try { ctx.audio.whisper?.() } catch {}
    }
    if (d.effect) effects(d.effect)
    const quick = hand.instant || ff > 0
    if (d.invalid && d.fix) {
      if (!quick) await life.wait(2200 / pace())
      await erase(view.val, hand)
      await typeText(view.val, d.fix, hand)
      decl.value = d.fix
      decl.invalid = null
      view.row.classList.remove('is-invalid')
      view.warn.hidden = true
      swatch(decl)
      commit()
    }
    if (!quick) await life.wait((200 + rng() * 380) / pace())
    return decl
  }

  function markInvalid(decl, why) {
    decl.invalid = why
    decl.view.row.classList.add('is-invalid')
    decl.view.warn.hidden = false
    decl.view.warn.title = why
    decl.view.warn.setAttribute('aria-label', why)
    dt.log('warn', `${why}: ${decl.prop}: ${decl.value}`, `possessed.css:${line}`)
  }

  function swatch(decl) {
    const show = isColor(decl.value)
    decl.view.swatch.hidden = !show
    if (show) decl.view.swatch.style.background = decl.value
  }

  async function editValue(decl, value, hand = main) {
    if (!decl?.view) return
    hand.busy(true)
    decl.view.row.classList.add('is-editing')
    await erase(decl.view.val, hand)
    await typeText(decl.view.val, value, hand)
    decl.value = value
    swatch(decl)
    decl.view.row.classList.remove('is-editing')
    hand.lift()
    hand.busy(false)
    commit()
  }

  // — The visitor's hand: unchecking —
  function toggle(decl, on, who) {
    decl.enabled = on
    decl.view.check.checked = on
    decl.view.row.classList.toggle('is-disabled', !on)
    commit()
    if (who !== 'visitor') return
    if (!on) {
      unchecks++
      ctx.memory.update('possession.unchecked', (n) => n + 1, 0)
      ctx.memory.set('possession.lastUnchecked', decl.prop)
      if (unchecks === 7 && ctx.memory.markSecret('exorcism', { face: 'possession' })) {
        dt.log('info', 'Seven declarations unchecked. By the old count, that is an exorcism. It will not hold, but it counts.')
      }
      counter(decl)
    } else {
      dt.log('demon', rng.pick(['thank you.', 'you put it back. why?', 'I knew you liked it.']))
    }
  }

  // The answer to an uncheck: check it again, then more Grace, then the Inversion, then Mercy.
  function counter(decl) {
    if (apology || still) return
    const fam = decl.family
    const level = fam.level++
    const sel = decl.rule.sel
    const hasReal = decl.rule.real !== realSelector(sel)
    if (level === 0) {
      queue.unshift({ run: async () => {
        await life.wait(1600 / pace())
        if (decl.enabled) return
        dt.log('demon', `you unchecked ${decl.prop}. I checked it again.`)
        main.place(decl.view.semi)
        await life.wait(700)
        main.lift()
        toggle(decl, true, 'demon')
      } })
    } else if (level === 1 && !hasReal) {
      const more = sel.startsWith('#temple') ? `#temple${sel}` : `#temple ${sel}`
      queue.unshift({ run: async () => {
        dt.log('demon', `(${decl.spec.join(',')}) was not enough. Grace can be taken.`)
        await writeRule({ sel: more, family: fam, decls: [{ prop: decl.prop, value: decl.value, group: decl.group, family: fam }], target: null })
      } })
    } else if (level <= 2) {
      queue.unshift({ run: async () => {
        await writeComment(rng.pick(['you made me say it.', 'then I will invert the Origins.', 'this is on you.']))
        await writeRule({ sel, real: decl.rule.real, family: fam, decls: [{ prop: decl.prop, value: decl.value, group: decl.group, important: true, family: fam }] })
      } })
    } else {
      queue.unshift({ run: async () => {
        dt.log('demon', `fine. keep ${decl.prop}. Mercy is the only righteous Inversion, and you know where it is.`)
        ctx.root.classList.add('point-at-mercy')
        await life.sleep(6000)
        ctx.root.classList.remove('point-at-mercy')
      } })
    }
  }

  // — The script —
  function act(a) { queue.push(a) }

  async function perform(a) {
    if (a.run) return a.run()
    if (a.comment) await writeComment(a.comment)
    else if (a.log) dt.log(a.log[0], a.log[1], a.log[2] ?? '')
    else if (a.sel) await writeRule(a)
    else if (a.edit) {
      const d = findDecl(a.edit[0], a.edit[1])
      if (d) await editValue(d, a.edit[2])
    }
    if (a.effect && !life.dead) effects(a.effect)
  }

  // Silent rules, written while the Inspector is still closed. Nobody saw them go in.
  const whisperer = makeHand()
  whisperer.instant = true
  async function whisperRule(spec) {
    await writeRule(spec, whisperer)
  }

  let running = false
  async function run(budgetMs = 0) {
    if (running) return
    running = true
    ff = budgetMs
    while (!life.dead) {
      while ((still || apology) && !life.dead) await life.wait(400)
      const a = queue.shift()
      if (!a) {
        if (!scriptDone) { scriptDone = true; effects('script-done') }
        await life.wait((22000 + rng() * 26000) / pace())
        idle()
        continue
      }
      try { await perform(a) } catch (e) { console.error('[possession:demon]', e) }
      const gap = a.gap ?? (1400 + rng() * 2800)
      if (ff > 0) ff -= gap
      else await life.wait(gap / pace())
      if (ff <= 0) ff = 0
    }
  }

  function idle() {
    const choices = []
    const h1ls = findDecl('.hero h1', 'letter-spacing')
    if (h1ls && parseFloat(h1ls.value) < 0.3) choices.push(() => editValue(h1ls, `${(parseFloat(h1ls.value) + 0.03).toFixed(2)}em`))
    const echo = findDecl('.hero h1::after', 'content')
    if (echo && (echo.value.match(/Welcome/g) || []).length < 3) choices.push(() => editValue(echo, echo.value.replace(/"$/, ' Welcome to our website."')))
    const off = rules.flatMap((r) => r.decls).filter((d) => d.typed && !d.enabled && d.rechecked < 1)
    if (off.length) choices.push(async () => {
      const d = rng.pick(off)
      d.rechecked++
      dt.log('demon', `${d.prop} was unchecked. I have checked it again. I have all night.`)
      toggle(d, true, 'demon')
    })
    if (!dt.isOpen && reopened < 3) choices.push(async () => {
      reopened++
      dt.open('demon')
      dt.log('demon', 'you closed me. I was still typing.')
    })
    choices.push(async () => effects('idle-verse'))
    queue.push({ run: rng.pick(choices), gap: 1200 })
  }

  function findDecl(sel, prop) {
    for (let i = rules.length - 1; i >= 0; i--) {
      const r = rules[i]
      if (r.sel !== sel) continue
      const d = r.decls.find((x) => x.prop === prop && x.typed)
      if (d) return d
    }
    return null
  }

  return {
    rules, act, run, perform, writeRule, writeComment, editValue, makeHand, whisperRule, baseline, commit, renderSource, findDecl,
    hooks,
    get unchecks() { return unchecks },
    get busy() { return hands.size > 0 },
    // Stillness: the demon stops and waits for you to move.
    setStill(on) { still = on },
    // The Apology: every declaration is withdrawn at once, until the visitor stirs.
    setApology(on) {
      apology = on
      dt.el.classList.toggle('is-apology', on)
      commit()
    },
    get apology() { return apology },
    priority(a) { queue.unshift(a) },
    exorcise() {
      const live = rules.flatMap((r) => r.decls).filter((d) => d.typed && d.enabled)
      for (const d of live) toggle(d, false, 'exorcism')
      unchecks += live.length ? 1 : 0
      queue.unshift({ run: async () => {
        await life.wait(7000 / pace())
        await writeComment(rng.pick(['did you think that would work?', 'every one of them is still in the file.', 'the Cascade does not forget a declaration.']))
        for (const d of live) { if (!d.enabled) toggle(d, true, 'demon'); await life.wait(140) }
      } })
      return live.length
    },
  }
}
