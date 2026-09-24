// POSSESSION / THE INSPECTOR. A fake developer-tools pane in which an invisible hand writes CSS
// against the page. Elements (tree + Styles), Console (with a prompt the visitor may speak into) and
// Sources (the live possessed.css). Hovering a node draws the box model as the Five Sheaths.
// All visitor text is rendered with textContent.
import { h } from '../../lib/dom.js'
import { speaker } from './art.js'

let uid = 0

export function specificity(sel) {
  const s = String(sel).split(',')[0]
  const ids = (s.match(/#[\w-]+/g) || []).length
  const cls = (s.match(/\.[\w-]+|\[[^\]]+\]|(?<!:):(?!:)[\w-]+(\([^)]*\))?/g) || []).length
  const pseudoEl = (s.match(/::[\w-]+/g) || []).length
  const stripped = s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+(\([^)]*\))?/g, ' ')
  const els = (stripped.match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length
  return [ids, cls, els + pseudoEl]
}

export function createDevtools(ctx, life, opts) {
  const { demonName, fileName = 'possessed.css', onSummon, onCommand } = opts
  const n = ++uid
  const counts = { warn: 0, error: 0 }
  let isOpen = false
  let tab = 'elements'
  let selected = null
  let hlTarget = null
  let inspecting = false

  // — Toolbar —
  const tabBtn = (key, label) => h('button', {
    type: 'button', role: 'tab', class: 'dt-tab', id: `dt-${n}-tab-${key}`,
    'aria-controls': `dt-${n}-panel-${key}`, 'aria-selected': key === tab ? 'true' : 'false',
    onclick: () => setTab(key),
  }, label)
  const tabs = { elements: tabBtn('elements', 'Elements'), console: tabBtn('console', 'Console'), sources: tabBtn('sources', 'Sources') }
  const warnBadge = h('span', { class: 'dt-count dt-count--warn', title: 'Warnings' }, h('span', { class: 'dt-ico', 'aria-hidden': 'true' }, '▲'), h('span', { class: 'n' }, '0'))
  const errBadge = h('span', { class: 'dt-count dt-count--err', title: 'Errors' }, h('span', { class: 'dt-ico', 'aria-hidden': 'true' }, '✖'), h('span', { class: 'n' }, '0'))
  const inspectBtn = h('button', { type: 'button', class: 'dt-icon-btn dt-inspect', 'aria-pressed': 'false', 'aria-label': 'Select an element in the page to inspect it', title: 'Select an element in the page to inspect it' },
    h('span', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 2.5h8v3M2.5 2.5v8h3"/><path d="M7 7l6.5 2.4-2.6 1.1 2.4 2.4-1 1-2.4-2.4-1.1 2.6z" fill="currentColor"/></svg>' }))
  const speakerBtn = h('button', { type: 'button', class: 'dt-icon-btn dt-speaker', 'aria-label': 'Unmute', title: 'Unmute (the speaker is cracked)' }, h('span', { html: speaker({ size: 17 }) }))
  const closeBtn = h('button', { type: 'button', class: 'dt-icon-btn dt-x', 'aria-label': 'Close developer tools', title: 'Close' }, '×')
  const bar = h('div', { class: 'dt-bar' },
    inspectBtn,
    h('div', { class: 'dt-tabs', role: 'tablist', 'aria-label': 'Developer tools panels' }, Object.values(tabs)),
    h('div', { class: 'dt-bar-end' }, warnBadge, errBadge, speakerBtn, closeBtn))

  // — Elements: tree, breadcrumbs, styles —
  const tree = h('ol', { class: 'dt-tree', 'aria-label': 'Document tree' })
  const crumbs = h('p', { class: 'dt-crumbs' })
  const rules = h('div', { class: 'dt-rules' })
  const baseRules = h('div', { class: 'dt-rules dt-rules--base' })
  const styles = h('section', { class: 'dt-styles', 'aria-label': 'Styles' },
    h('div', { class: 'dt-filter' }, h('span', { class: 'dt-filter-box' }, 'Filter'), h('span', { class: 'dt-filter-tools', 'aria-hidden': 'true' }, ':hov  .cls  +')),
    h('div', { class: 'dt-rule dt-rule--inline' }, h('div', { class: 'dt-rule-head' }, h('span', { class: 'dt-sel' }, 'element.style'), ' {'), h('div', { class: 'dt-close' }, '}')),
    rules, baseRules)
  const elementsPanel = h('div', { class: 'dt-panel dt-panel--elements', role: 'tabpanel', id: `dt-${n}-panel-elements`, 'aria-labelledby': `dt-${n}-tab-elements` },
    h('div', { class: 'dt-dom' }, tree, crumbs), styles)

  // — Console —
  const logList = h('ol', { class: 'dt-log', role: 'log', 'aria-live': 'off', 'aria-label': 'Console messages' })
  const input = h('input', { type: 'text', id: `dt-${n}-prompt`, autocomplete: 'off', spellcheck: 'false', maxlength: '120', placeholder: 'type help' })
  const prompt = h('form', { class: 'dt-prompt' }, h('label', { class: 'visually-hidden', for: `dt-${n}-prompt` }, 'Speak to the console'), h('span', { class: 'dt-prompt-mark', 'aria-hidden': 'true' }, '›'), input)
  const consolePanel = h('div', { class: 'dt-panel dt-panel--console', role: 'tabpanel', id: `dt-${n}-panel-console`, 'aria-labelledby': `dt-${n}-tab-console`, hidden: true }, logList, prompt)

  // — Sources —
  const source = h('ol', { class: 'dt-source', 'aria-label': `${fileName}, as it is now` })
  const sourcesPanel = h('div', { class: 'dt-panel dt-panel--sources', role: 'tabpanel', id: `dt-${n}-panel-sources`, 'aria-labelledby': `dt-${n}-tab-sources`, hidden: true },
    h('p', { class: 'dt-file' }, h('span', { 'aria-hidden': 'true' }, '\u{1F5CE} '), fileName, h('span', { class: 'dt-file-note' }, ' (not saved anywhere; it is being written now)')),
    source)
  const panels = { elements: elementsPanel, console: consolePanel, sources: sourcesPanel }

  // — Status —
  const typingDot = h('span', { class: 'dt-typing-dot', 'aria-hidden': 'true' })
  const statusText = h('span', { class: 'dt-status-text' }, 'Ready')
  // A second line, as a status bar keeps: the state of the file being written (the demon keeps it current).
  const metaText = h('span', { class: 'dt-status-meta' })
  const status = h('div', { class: 'dt-status' }, typingDot, h('span', { class: 'dt-status-lines' }, statusText, metaText))

  // data-hell="spare": the hell layer's own curses leave the Inspector alone; it is the demon's instrument.
  const el = h('aside', { class: 'dt', 'aria-label': 'Developer tools (possessed)', 'data-open': 'false', 'data-hell': 'spare' }, bar, h('div', { class: 'dt-body' }, elementsPanel, consolePanel, sourcesPanel), status)
  el.inert = true

  const chip = h('button', { type: 'button', class: 'dt-chip', hidden: true, 'aria-label': 'Open developer tools', 'aria-expanded': 'false' },
    h('span', { class: 'dt-chip-code', 'aria-hidden': 'true' }, '</>'),
    h('span', { class: 'dt-chip-n' }, ''))

  // — Highlight overlay: the box model as the Five Sheaths —
  const hlMargin = h('div', { class: 'hl-ring hl-margin' })
  const hlBorder = h('div', { class: 'hl-ring hl-border' })
  const hlPadding = h('div', { class: 'hl-ring hl-padding' })
  const hlContent = h('div', { class: 'hl-content' })
  const hlTip = h('div', { class: 'hl-tip' })
  const overlay = h('div', { class: 'dt-highlight', 'aria-hidden': 'true', hidden: true }, hlMargin, hlBorder, hlPadding, hlContent, hlTip)

  function describe(target) {
    if (!target) return ''
    const tag = target.tagName?.toLowerCase() ?? 'node'
    const id = target.id ? `#${target.id}` : ''
    const cls = typeof target.className === 'string' && target.className ? '.' + target.className.trim().split(/\s+/).slice(0, 3).join('.') : (target.getAttribute?.('class') ? '.' + target.getAttribute('class').trim().split(/\s+/).slice(0, 3).join('.') : '')
    return `${tag}${id}${cls}`
  }

  function place() {
    if (!hlTarget || !hlTarget.isConnected) { overlay.hidden = true; return }
    const r = hlTarget.getBoundingClientRect()
    const cs = getComputedStyle(hlTarget)
    const px = (p) => parseFloat(cs[p]) || 0
    const m = [px('marginTop'), px('marginRight'), px('marginBottom'), px('marginLeft')].map((v) => Math.max(0, v))
    const b = [px('borderTopWidth'), px('borderRightWidth'), px('borderBottomWidth'), px('borderLeftWidth')]
    const p = [px('paddingTop'), px('paddingRight'), px('paddingBottom'), px('paddingLeft')]
    const box = (node, x, y, w, hh, widths) => {
      node.style.transform = `translate(${x}px, ${y}px)`
      node.style.width = `${Math.max(0, w)}px`
      node.style.height = `${Math.max(0, hh)}px`
      if (widths) node.style.borderWidth = widths.map((v) => `${v}px`).join(' ')
    }
    box(hlMargin, r.left - m[3], r.top - m[0], r.width + m[1] + m[3], r.height + m[0] + m[2], m)
    box(hlBorder, r.left, r.top, r.width, r.height, b)
    box(hlPadding, r.left + b[3], r.top + b[0], r.width - b[1] - b[3], r.height - b[0] - b[2], p)
    box(hlContent, r.left + b[3] + p[3], r.top + b[0] + p[0], r.width - b[1] - b[3] - p[1] - p[3], r.height - b[0] - b[2] - p[0] - p[2])
    hlTip.replaceChildren(
      h('b', {}, describe(hlTarget)), ` ${Math.round(r.width)} × ${Math.round(r.height)}`,
      h('br'), h('span', { class: 'sheaths' }, h('i', { class: 's-c' }, 'the Seed'), ' ', h('i', { class: 's-p' }, 'the Breath'), ' ', h('i', { class: 's-b' }, 'the Mind'), ' ', h('i', { class: 's-m' }, 'the Wisdom')))
    const tipY = r.top - m[0] > 60 ? r.top - m[0] - 52 : Math.min(innerHeight - 56, r.bottom + m[2] + 8)
    hlTip.style.transform = `translate(${Math.max(4, Math.min(innerWidth - 260, r.left))}px, ${Math.max(4, tipY)}px)`
    overlay.hidden = false
  }
  let placing = false
  const replace = () => {
    if (placing || !hlTarget) return
    placing = true
    life.frame(() => { placing = false; place() })
  }
  life.listen(window, 'scroll', replace, { passive: true })
  life.listen(window, 'resize', replace, { passive: true })

  function highlight(target) {
    hlTarget = target || null
    if (!hlTarget) overlay.hidden = true
    else place()
  }

  // — Tree —
  let nodes = []
  function setTree(list) {
    nodes = list
    tree.replaceChildren(...list.map((node, i) => {
      const btn = h('button', { type: 'button', class: 'dt-node', 'aria-label': node.aria ?? node.plain },
        h('span', { class: 'dt-twisty', 'aria-hidden': 'true' }, node.leaf ? '' : node.open ? '▾' : '▸'),
        ...node.parts.map(([kind, text]) => h('span', { class: `t-${kind}` }, text)),
        h('span', { class: 'dt-sel0', 'aria-hidden': 'true' }, ' == $0'))
      if (node.el) {
        btn.addEventListener('mouseenter', () => highlight(node.el))
        btn.addEventListener('mouseleave', () => highlight(null))
        btn.addEventListener('focus', () => highlight(node.el))
        btn.addEventListener('blur', () => highlight(null))
        btn.addEventListener('click', () => {
          select(node.el)
          node.el.scrollIntoView?.({ block: 'center', behavior: ctx.mercy.on ? 'auto' : 'smooth' })
        })
      }
      btn.style.setProperty('--d', String(node.depth))
      node.btn = btn
      if (node.possessed) btn.classList.add('is-possessed')
      return h('li', {}, btn)
    }))
    if (selected) select(selected, { quiet: true })
  }

  function select(target, { quiet = false } = {}) {
    selected = target
    let best = null
    for (const node of nodes) {
      node.btn?.classList.toggle('is-selected', false)
      if (node.el && target && (node.el === target || node.el.contains?.(target))) {
        if (!best || best.el.contains(node.el)) best = node
      }
    }
    best?.btn?.classList.add('is-selected')
    if (best?.btn && !quiet && isOpen && tab === 'elements') {
      const top = best.btn.offsetTop - tree.clientHeight / 2
      tree.scrollTop = Math.max(0, top)
    }
    const chain = []
    for (let x = target; x && x !== document.documentElement; x = x.parentElement) chain.unshift(describe(x))
    crumbs.textContent = ['html', ...chain].slice(-5).join('  ›  ')
  }

  function markPossessed(target) {
    for (const node of nodes) if (node.el === target) { node.possessed = true; node.btn?.classList.add('is-possessed') }
  }

  // — Inspect mode —
  function onInspectMove(e) {
    const t = e.target
    if (!(t instanceof Element) || el.contains(t) || chip.contains(t)) return
    if (!t.closest('.corp, .abyss')) return
    highlight(t)
  }
  function onInspectClick(e) {
    const t = e.target
    if (!(t instanceof Element) || el.contains(t)) return
    if (!t.closest('.corp, .abyss')) return
    e.preventDefault()
    e.stopPropagation()
    stopInspect()
    select(t)
    log('echo', `$0 = <${describe(t)}>`)
    const whisper = t.closest('.figure--4') ? 'that one is not in the credits.' : t.closest('.w.rot') ? 'the letters were only moved. they were not changed.' : null
    if (whisper) log('demon', whisper)
    setTab('elements')
  }
  function onInspectKey(e) { if (e.key === 'Escape') stopInspect() }
  function startInspect() {
    inspecting = true
    inspectBtn.setAttribute('aria-pressed', 'true')
    document.addEventListener('pointermove', onInspectMove, true)
    document.addEventListener('click', onInspectClick, true)
    document.addEventListener('keydown', onInspectKey, true)
    ctx.root.classList.add('is-inspecting')
  }
  function stopInspect() {
    if (!inspecting) return
    inspecting = false
    inspectBtn.setAttribute('aria-pressed', 'false')
    document.removeEventListener('pointermove', onInspectMove, true)
    document.removeEventListener('click', onInspectClick, true)
    document.removeEventListener('keydown', onInspectKey, true)
    ctx.root.classList.remove('is-inspecting')
    highlight(null)
  }
  inspectBtn.addEventListener('click', () => (inspecting ? stopInspect() : startInspect()))
  life.add(stopInspect)

  // — Console —
  const MAX_LOG = 140
  function log(level, text, src = '') {
    if (level === 'warn') counts.warn++
    if (level === 'error') counts.error++
    warnBadge.querySelector('.n').textContent = String(counts.warn)
    errBadge.querySelector('.n').textContent = String(counts.error)
    const total = counts.warn + counts.error
    chip.querySelector('.dt-chip-n').textContent = total ? `▲ ${total}` : ''
    const icon = { warn: '▲', error: '✖', info: 'ℹ', demon: '†', echo: '›', you: '›' }[level] ?? ''
    const row = h('li', { class: `dt-msg dt-msg--${level}` },
      h('span', { class: 'dt-msg-ico', 'aria-hidden': 'true' }, icon),
      h('span', { class: 'dt-msg-text' }, String(text)),
      src ? h('span', { class: 'dt-msg-src' }, src) : null)
    logList.append(row)
    while (logList.childElementCount > MAX_LOG) logList.firstElementChild.remove()
    const nearBottom = logList.scrollHeight - logList.scrollTop - logList.clientHeight < 80
    if (nearBottom || level === 'you') logList.scrollTop = logList.scrollHeight
    return row
  }

  prompt.addEventListener('submit', (e) => {
    e.preventDefault()
    const text = input.value.trim().slice(0, 120)
    input.value = ''
    if (!text) return
    log('you', text)
    onCommand?.(text)
  })
  // Typing in the console must not trigger the page's own shortcuts twice; the kernel still hears it.

  // — Styles: rule views —
  function addRule({ sel = '', src = '', kind = 'demon', where = 'top', comment = false } = {}) {
    const selEl = h('span', { class: 'dt-sel' }, sel)
    const specEl = h('span', { class: 'dt-spec', title: 'Grace (specificity): Id, Class, Element' })
    const srcEl = h('span', { class: 'dt-src' }, src)
    const decls = h('ul', { class: 'dt-decls' })
    const closeEl = h('div', { class: 'dt-close', hidden: true }, '}')
    const openEl = h('span', { class: 'dt-brace', hidden: true }, ' {')
    let node
    if (comment) {
      node = h('div', { class: `dt-rule dt-rule--comment dt-rule--${kind}` }, h('div', { class: 'dt-rule-head' }, selEl, srcEl))
    } else {
      node = h('div', { class: `dt-rule dt-rule--${kind}` }, h('div', { class: 'dt-rule-head' }, selEl, openEl, specEl, srcEl), decls, closeEl)
    }
    ;(kind === 'base' || kind === 'ua' || kind === 'offering' ? baseRules : rules)[where === 'top' ? 'prepend' : 'append'](node)
    if (where === 'top' && kind === 'demon') rules.scrollTop = 0
    const view = {
      el: node, selEl, srcEl, specEl, openEl, closeEl, decls,
      showSpec(text) { specEl.textContent = text },
      opened() { openEl.hidden = false },
      closed() { closeEl.hidden = false },
      addDecl(d = {}) {
        const check = h('input', { type: 'checkbox', class: 'dt-check', checked: true, 'aria-label': 'Declaration enabled' })
        const prop = h('span', { class: 'dt-prop' }, d.prop ?? '')
        const colon = h('span', { class: 'dt-colon', hidden: !d.prop }, ': ')
        const swatch = h('span', { class: 'dt-swatch', hidden: true, 'aria-hidden': 'true' })
        const val = h('span', { class: 'dt-val' }, d.value ?? '')
        const imp = h('span', { class: 'dt-imp' }, d.important ? ' !important' : '')
        const semi = h('span', { class: 'dt-semi', hidden: !d.prop }, ';')
        const warn = h('span', { class: 'dt-warn', hidden: true, role: 'img', 'aria-label': 'warning' }, '▲')
        const note = h('span', { class: 'dt-note', hidden: true })
        const row = h('li', { class: 'dt-decl' }, check, prop, colon, swatch, val, imp, semi, warn, note)
        if (kind !== 'demon') check.disabled = true
        decls.append(row)
        return { row, check, prop, colon, swatch, val, imp, semi, warn, note }
      },
    }
    return view
  }

  // — Tabs, open/close —
  function setTab(key) {
    tab = key
    for (const [k, b] of Object.entries(tabs)) b.setAttribute('aria-selected', String(k === key))
    for (const [k, p] of Object.entries(panels)) p.hidden = k !== key
    if (key === 'console') logList.scrollTop = logList.scrollHeight
    opts.onTab?.(key)
  }

  function open(reason = 'user') {
    if (isOpen) return
    isOpen = true
    el.inert = false
    el.dataset.open = 'true'
    chip.hidden = false
    chip.setAttribute('aria-expanded', 'true')
    chip.setAttribute('aria-label', 'Close developer tools')
    ctx.root.classList.add('dt-open')
    opts.onToggle?.(true, reason)
  }
  function close(reason = 'user') {
    if (!isOpen) return
    isOpen = false
    el.dataset.open = 'false'
    el.inert = true
    chip.hidden = false
    chip.setAttribute('aria-expanded', 'false')
    chip.setAttribute('aria-label', 'Open developer tools')
    ctx.root.classList.remove('dt-open')
    stopInspect()
    opts.onToggle?.(false, reason)
  }
  closeBtn.addEventListener('click', () => { close('user'); chip.focus() })
  chip.addEventListener('click', () => (isOpen ? close('user') : open('user')))
  speakerBtn.addEventListener('click', () => onSummon?.(speakerBtn))

  // The status line: who is typing, unless something holds the hand (Mercy, the Apology), which is said instead.
  let typing = false
  let typist = demonName
  let hold = null
  function setTyping(on, who = demonName) {
    typing = on
    typist = who
    el.classList.toggle('is-typing', on && !hold)
    el.classList.toggle('is-held', Boolean(hold))
    statusText.textContent = hold ?? (on ? `${who} is typing…` : 'Ready')
  }
  function setHold(text) {
    hold = text || null
    setTyping(typing, typist)
  }

  function setSource(text) {
    const lines = String(text).split('\n')
    source.replaceChildren(...lines.map((line) => h('li', {}, h('code', {}, line || ' '))))
  }

  return {
    el, chip, overlay, counts,
    get isOpen() { return isOpen },
    get tab() { return tab },
    open, close, setTab, log, addRule, setTree, select, markPossessed, highlight, setTyping, setHold, setSource,
    setMeta(text) { if (metaText.textContent !== text) metaText.textContent = text },
    clear() { logList.replaceChildren() },
    showChip() { chip.hidden = false },
    speakerBtn,
    rulesEl: rules,
  }
}
