// THE FLEET. Saucers from sigil.js crossing the sky behind the page, in three manners of flight
// the old contact reports describe: the glide, the falling leaf, and the hover-and-hop.
// All motion is CSS, so mercy stops it; at rest each craft is parked somewhere visible.
import { h } from '../../lib/dom.js'
import { saucer } from '../../lib/sigil.js'
import { vars } from './util.js'

export function fleet(ctx, rng) {
  const el = h('div', { class: 'dep-fleet', 'aria-hidden': 'true' })
  const sky = ctx.sky
  let n = rng.int(3, 5)
  if (sky.has('new-moon')) n += 3 // the fleet is thicker on moonless nights
  if (sky.has('eclipse') || sky.has('turning')) n += 1
  if (sky.has('thirty-three')) n += 1
  const crafts = []
  for (let i = 0; i < n; i++) {
    const depth = i === 0 ? rng.float(0.75, 1) : rng.float(0.2, 1)
    const size = Math.round(36 + depth * 118)
    const pattern = rng.weighted({ glide: 3, leaf: 2, hop: 2 })
    const dur = Math.round((pattern === 'hop' ? 70 : 55) + (1 - depth) * 110 + rng.float(0, 40))
    const craft = h('div', { class: `dep-craft dep-craft--${pattern}` })
    vars(craft, {
      y: `${rng.float(5, 74).toFixed(1)}vh`,
      size: `${size}px`,
      dur: `${dur}s`,
      delay: `${(-rng.float(0.05, 0.95) * dur).toFixed(1)}s`,
      adir: rng.chance(0.5) ? 'normal' : 'reverse',
      rest: `${rng.float(4, 82).toFixed(1)}vw`,
      alpha: (0.3 + depth * 0.65).toFixed(2),
      tilt: `${rng.float(-7, 7).toFixed(1)}deg`,
      bob: `${rng.float(4.5, 8).toFixed(1)}s`,
    })
    const bob = h('div', { class: 'dep-craft-bob', html: saucer(rng.fork(`craft/${i}`), { size: 200, stroke: 2.4 }) })
    // The glow is baked in as a wide, faint copy of the hull lines (no CSS filter: filters over moving
    // children cost a repaint every frame).
    const svgEl = bob.querySelector('svg')
    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    halo.setAttribute('class', 'dep-halo')
    for (const n of svgEl.querySelectorAll('path, ellipse')) halo.append(n.cloneNode(false))
    svgEl.prepend(halo)
    craft.append(bob)
    el.append(craft)
    crafts.push(craft)
  }
  return {
    el,
    count: n,
    // The fleet acknowledges a signal: every light swells, slowly, three times.
    ack(life) {
      el.classList.remove('is-acking')
      void el.offsetWidth
      el.classList.add('is-acking')
      life.timeout(() => el.classList.remove('is-acking'), 6200)
    },
  }
}
