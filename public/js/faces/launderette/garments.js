// THE BASKET. Badly dressed elements, drawn from the lexicon's HERESIES, one of them stained, and one brought
// in from the last face the visitor saw. Each garment is a real element. A wash really applies
// `all: <keyword>` to it, in its style attribute, so the browser itself decides what comes out.
//
// Every garment hangs in a sane lining (.lnd-cloth): a parent that has been reset to plain, sensible values,
// so a garment washed in INHERIT or UNSET inherits from the lining and never from the strange room around it.
import { h } from '../../lib/dom.js'
import { GARMENTS, VISITORS, LABEL_PROPS } from './lore.js'
import { tidyColor } from './life.js'

const LOT = { blink: 3, proud: 3, covenant: 2 }

// Build tonight's basket: the three regulars, one drawn by lot, the stained tee and a visitor.
export function makeBasket(rng, { lastFace }) {
  const kinds = ['best', 'wander', 'tongue', rng.weighted(LOT)]
  const order = rng.shuffle(kinds)
  // The stained tee lies on top of the basket, where the eye falls first.
  order.unshift('tee')
  // A face the room has no garment for (or no last face at all) sends something from the lost property box.
  const visitorKey = lastFace && Object.hasOwn(VISITORS, lastFace) ? lastFace : 'nowhere'
  order.push(`from:${visitorKey}`)
  return order.map((kind, i) => garment(kind, i))
}

function garment(kind, i) {
  if (kind.startsWith('from:')) {
    const key = kind.slice(5)
    const v = VISITORS[key]
    const el = h(v.tag, {}, v.text)
    el.classList.add('lnd-g', 'lnd-g--visitor', `lnd-g--from-${key}`)
    return finish({ id: `g${i}`, kind: 'visitor', from: key, name: v.name, short: v.short, heresy: key === 'nowhere' ? 'nobody\'s' : 'a visitor', what: v.what, el, inline: '' })
  }
  const spec = GARMENTS[kind]
  let el
  if (kind === 'covenant') {
    el = h('table', spec.attrs, h('tbody', {}, h('tr', {}, spec.cells.map((c) => h('td', {}, c)))))
  } else {
    const attrs = { ...(spec.attrs ?? {}) }
    if (spec.id) attrs.id = spec.id
    if (spec.tag === 'button') Object.assign(attrs, { type: 'button', tabindex: '-1' })
    if (spec.inline) attrs.style = spec.inline
    el = h(spec.tag, attrs, spec.text)
  }
  el.classList.add('lnd-g', `lnd-g--${kind}`)
  return finish({ id: `g${i}`, kind, name: spec.name, short: spec.short, heresy: spec.heresy, what: spec.what, el, inline: spec.inline ?? '', stained: kind === 'tee' })
}

function finish(g) {
  g.tagName = g.el.tagName.toLowerCase()
  g.short ??= g.name // what fits on a machine's button
  g.washes = []
  g.where = null // the machine it is in, or null for the basket
  return g
}

// Put a garment's own clothes back on: its original style attribute, or none.
export function redress(g) {
  g.el.removeAttribute('style')
  if (g.inline) g.el.setAttribute('style', g.inline)
  g.washes = []
  g.ironed = []
}

// One group of the dissolving: each property set to the keyword, in the style attribute.
export function dissolve(el, props, kw) {
  for (const p of props) el.style.setProperty(p, kw)
}

// The whole immersion. A shorthand spoken last unsays everything spoken before it in the same attribute.
export function immerse(el, kw) {
  el.style.setProperty('all', kw)
}

const firstFamily = (ff) => String(ff).split(',')[0].trim().replace(/^["']|["']$/g, '')
// 55.21875px -> 55.2px: a care label has no room for the sixteenths of a pixel.
const px = (v) => String(v).replace(/(-?\d+\.\d+)px/g, (_, n) => `${Math.round(Number(n) * 10) / 10}px`)

// What the care label reads: a few computed values, tidied for a small satin label.
export function snapshot(el) {
  const c = getComputedStyle(el)
  const img = c.backgroundImage && c.backgroundImage !== 'none'
  const stained = img && el.classList.contains('lnd-stain')
  const bg = tidyColor(c.backgroundColor)
  const v = {
    display: c.display,
    position: c.position,
    top: c.top,
    float: c.float || c.cssFloat,
    width: c.width,
    color: tidyColor(c.color),
    background: img ? `${bg === 'transparent' ? '' : `${bg} + `}${stained ? 'the stain' : 'an image'}` : bg,
    'font-family': firstFamily(c.fontFamily),
    'font-size': c.fontSize,
    'font-weight': c.fontWeight,
    border: c.borderTopStyle === 'none' || c.borderTopWidth === '0px' ? 'none' : `${c.borderTopWidth} ${c.borderTopStyle}`,
    padding: c.paddingTop === c.paddingLeft ? c.paddingTop : `${c.paddingTop} ${c.paddingLeft}`,
    'animation-name': c.animationName,
    direction: c.direction,
  }
  return LABEL_PROPS.map(([prop, say]) => ({ prop, say, value: px(v[prop] ?? '') }))
}

// The stain is an animation: is it running right now on this element?
export function trembling(el) {
  try {
    return el.getAnimations().some((a) => a.animationName === 'lnd-stain' && a.playState === 'running')
  } catch {
    return false
  }
}
