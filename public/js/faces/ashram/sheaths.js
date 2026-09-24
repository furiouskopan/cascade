// THE FIVE SHEATHS. The box model is the body, and this diagram is drawn with the real thing: every
// ring is an actual CSS box (margin, border, padding, content, and the outline that takes no space).
// The padding, which is the Breath, breathes with the yantra. The numbers are read from the living body.
import { h } from '../../lib/dom.js'
import { SHEATHS, CHAKRAS } from '../../lib/lexicon.js'
import { KOSHA } from './lore.js'
import { s } from './life.js'

let eyeIds = 0
const EYES = [[68.6, 35.4], [81.4, 35.4]]
const THIRD = [75, 28.6]

// An eye that can be shut, opened, and pointed. Closed, it is only a lid; open, an almond with a pupil.
function eye(cx, cy, { vertical = false, cls = '' } = {}) {
  const id = `ash-eyeclip-${++eyeIds}`
  const w = 3.3
  const k = 2.7
  const almond = vertical
    ? `M${cx} ${cy - w} Q${cx + k} ${cy} ${cx} ${cy + w} Q${cx - k} ${cy} ${cx} ${cy - w} Z`
    : `M${cx - w} ${cy} Q${cx} ${cy - k} ${cx + w} ${cy} Q${cx} ${cy + k} ${cx - w} ${cy} Z`
  const lid = vertical
    ? `M${cx} ${cy - w} Q${cx + 1.4} ${cy} ${cx} ${cy + w}`
    : `M${cx - w} ${cy} Q${cx} ${cy + 1.7} ${cx + w} ${cy}`
  const pupil = s('g', { class: 'ash-eye-pupil' },
    s('circle', { cx, cy, r: 1.35, class: 'ash-eye-iris' }),
    s('circle', { cx: cx + 0.4, cy: cy - 0.45, r: 0.35, class: 'ash-eye-glint' }))
  const g = s('g', { class: `ash-eye ${cls}`.trim() },
    s('defs', {}, s('clipPath', { id }, s('path', { d: almond }))),
    s('path', { d: lid, class: 'ash-eye-lid' }),
    s('g', { class: 'ash-eye-open' },
      s('path', { d: almond, class: 'ash-eye-white' }),
      s('g', { 'clip-path': `url(#${id})` }, pupil)),
  )
  return { g, pupil, cx, cy }
}

// A seated figure, drawn plainly, with the seven wheels along the spine, and eyes that are closed.
function figure() {
  const g = s('svg', { viewBox: '0 0 150 190', class: 'ash-figure', role: 'img', 'aria-label': 'A seated figure in meditation, with seven coloured points along the spine' })
  g.append(
    s('ellipse', { cx: 75, cy: 177, rx: 64, ry: 9, class: 'ash-fig-cushion' }),
    s('path', { d: 'M8 157 Q75 118 142 157 Q75 186 8 157 Z', class: 'ash-fig-body' }),
    s('path', { d: 'M24 161 Q75 139 126 161', class: 'ash-fig-line' }),
    s('path', { d: 'M52 64 Q75 55 98 64 L95 121 Q75 130 55 121 Z', class: 'ash-fig-body' }),
    s('rect', { x: 69.5, y: 46, width: 11, height: 13, rx: 3, class: 'ash-fig-body' }),
    s('path', { d: 'M53 66 Q39 90 37 117 Q35 138 24 149', class: 'ash-fig-arm-o' }),
    s('path', { d: 'M97 66 Q111 90 113 117 Q115 138 126 149', class: 'ash-fig-arm-o' }),
    s('path', { d: 'M53 66 Q39 90 37 117 Q35 138 24 149', class: 'ash-fig-arm-i' }),
    s('path', { d: 'M97 66 Q111 90 113 117 Q115 138 126 149', class: 'ash-fig-arm-i' }),
    s('circle', { cx: 23, cy: 151, r: 4.6, class: 'ash-fig-body' }),
    s('circle', { cx: 127, cy: 151, r: 4.6, class: 'ash-fig-body' }),
    s('circle', { cx: 75, cy: 33, r: 14.5, class: 'ash-fig-body' }),
    s('path', { d: 'M75 124 L75 17', class: 'ash-fig-spine' }),
  )
  const ys = [123, 109, 94, 78, 57, THIRD[1], 16]
  ys.forEach((y, i) => {
    const dot = s('circle', { cx: 75, cy: y, r: i === 6 ? 4 : i === 5 ? 2.4 : 3.3, class: `ash-fig-wheel${i === 5 ? ' is-ajna' : ''}` })
    dot.style.setProperty('--c', CHAKRAS[i].color)
    dot.style.setProperty('--k', String(i))
    g.append(dot)
  })
  const eyes = EYES.map(([x, y]) => eye(x, y))
  const third = eye(THIRD[0], THIRD[1], { vertical: true, cls: 'is-third' })
  g.append(...eyes.map((e) => e.g), third.g)
  return { svg: g, eyes, third }
}

export function buildSheaths(A) {
  const { ctx, life, ticker } = A
  const tag = (cls, css) => {
    const k = KOSHA[css]
    return h('span', { class: `ash-tag ash-tag--${cls}`, 'aria-hidden': 'true' }, css, ' ', h('span', { lang: 'sa' }, k.deva))
  }
  const fig = figure()
  const seed = h('div', { class: 'ash-seed' }, fig.svg, tag('content', 'content'))
  const body = h('div', { class: 'ash-body' }, seed, tag('padding', 'padding'), tag('border', 'border'), tag('outline', 'outline'))
  const field = h('div', { class: 'ash-field' }, body, tag('margin', 'margin'))
  const frame = h('div', { class: 'ash-field-frame' }, field)

  const live = {}
  const order = ['outline', 'margin', 'border', 'padding', 'content']
  const list = h('dl', { class: 'ash-kosha-list' },
    order.map((css) => {
      const sh = SHEATHS.find((x) => x.css === css)
      const k = KOSHA[css]
      live[css] = h('span', { class: 'ash-live' })
      return h('div', { class: `ash-kosha ash-kosha--${css}` },
        h('dt', {},
          h('code', {}, css),
          h('span', { class: 'ash-deva', lang: 'sa' }, k.deva),
          h('span', { class: 'ash-iast' }, `${k.iast}, “${k.made}”`),
        ),
        h('dd', {}, h('strong', {}, sh?.name ?? ''), `: ${sh?.gloss ?? ''}. `, live[css]),
      )
    }),
  )

  const el = h('section', { class: 'ash-koshas', 'aria-labelledby': 'ash-kosha-title' },
    h('header', { class: 'ash-sec-head' },
      h('p', { class: 'ash-sec-deva', lang: 'sa', 'aria-hidden': 'true' }, 'कोश'),
      h('h2', { id: 'ash-kosha-title' }, 'The Five Sheaths'),
      h('p', { class: 'ash-lede' }, 'The box model is the body. This one is drawn with the real thing: every ring below is an actual CSS box, and the padding, which is the Breath, is breathing with the yantra.'),
    ),
    h('figure', { class: 'ash-kosha-fig' },
      frame,
      h('figcaption', {}, 'The field is ', h('code', {}, 'display: flow-root'), ', so the Union cannot happen here: the body keeps its margin to itself. The dashed line is drawn around the border and nothing moved to make room for it.'),
    ),
    list,
    h('p', { class: 'ash-kosha-coda' }, 'The old teachers count the sheaths from the body inward: food outermost, bliss at the core. The box model counts from the content outward. The ashram teaches that both are right, depending on which side of the border you stand.'),
  )

  // Live values, read back from the body with getComputedStyle.
  let visible = false
  const io = life.observe(new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting) }))
  io.observe(frame)
  function readBody() {
    const cs = getComputedStyle(body)
    const px = (v) => `${Math.round(parseFloat(v) * 10) / 10}px`
    live.outline.textContent = `Here: ${px(cs.outlineWidth)} ${cs.outlineStyle}, offset ${px(cs.outlineOffset)}. Space taken: 0px.`
    live.margin.textContent = `Here: ${px(cs.marginTop)} on every side.`
    live.border.textContent = `Here: ${px(cs.borderTopWidth)} ${cs.borderTopStyle}.`
    live.padding.textContent = `Here: ${px(cs.paddingTop)}${ctx.mercy?.on ? ', resting' : ', and breathing'}.`
    const who = third ? 'a figure seated in it, its third eye open' : watching ? 'a figure seated in it, watching you' : 'a figure seated in it'
    live.content.textContent = `Here: ${seed.clientWidth} × ${seed.clientHeight}, ${who}.`
  }
  requestAnimationFrame(readBody)
  life.interval(() => { if (visible) readBody() }, 500)
  life.bus(ctx.bus, 'mercy:change', ({ on }) => {
    if (on) body.style.setProperty('--breath', '0.5')
    readBody()
  })
  if (ctx.mercy?.on) body.style.setProperty('--breath', '0.5')

  // The figure keeps its eyes closed while you are calm. When you are restless it opens them and
  // follows your pointer; when you settle, it closes them again, slowly, as if it had not looked.
  let watching = false
  let third = false
  let look = { x: 0, y: 0 }
  function aim(dt) {
    const p = ctx.behavior?.pointer
    const r = fig.svg.getBoundingClientRect()
    if (!p || !r.width) return
    const sx = r.width / 150
    const want = fig.eyes.map((e) => {
      const ex = r.left + e.cx * sx
      const ey = r.top + e.cy * (r.height / 190)
      const dx = p.x - ex
      const dy = p.y - ey
      const d = Math.hypot(dx, dy) || 1
      const reach = Math.min(1, d / 160)
      return { x: (dx / d) * reach * 1.5, y: (dy / d) * reach * 0.9 }
    })
    const k = Math.min(1, dt * 7)
    const nx = look.x + ((want[0].x + want[1].x) / 2 - look.x) * k
    const ny = look.y + ((want[0].y + want[1].y) / 2 - look.y) * k
    if (Math.abs(nx - look.x) + Math.abs(ny - look.y) < 0.01) return
    look = { x: nx, y: ny }
    for (const e of fig.eyes) e.pupil.setAttribute('transform', `translate(${nx.toFixed(2)} ${ny.toFixed(2)})`)
  }
  function watch(on) {
    if (watching === on) return
    watching = on
    el.classList.toggle('is-watching', on)
    if (!on) {
      look = { x: 0, y: 0 }
      for (const e of fig.eyes) e.pupil.removeAttribute('transform')
    }
    if (visible) readBody()
  }

  let lastV = -1
  ticker.add((dt) => {
    if (!visible) return
    if (watching) aim(dt)
    const v = A.breath?.value ?? 0.5
    if (Math.abs(v - lastV) < 0.004) return
    lastV = v
    body.style.setProperty('--breath', v.toFixed(3))
  })

  return {
    el,
    wake(on) { el.classList.toggle('is-awake', on) },
    watch,
    third(on) {
      third = on
      el.classList.toggle('is-third', on)
      if (visible) readBody()
    },
  }
}
