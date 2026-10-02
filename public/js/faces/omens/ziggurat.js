// THE ZIGGURAT of seven terraces, in the seven colours Herodotus gave the walls of Ecbatana (white, black,
// purple, blue, orange, silver, gold), each a real layer with a real z-index, read back from the stylesheet
// and written on its face. The shrine at the top is :root. The stair runs downward: a ziggurat was built
// for descent, and every style comes down these steps from the Root.
import { h } from '../../lib/dom.js'
import { TERRACES } from './lore.js'

export function buildZiggurat() {
  const items = TERRACES.slice().reverse().map((t) => {
    const z = h('code', { class: 'om-terrace-z' }, 'z-index: …')
    const li = h('li', { class: 'om-terrace', 'data-color': t.id },
      h('span', { class: 'om-terrace-body', 'aria-hidden': 'true' }, h('span', { class: 'om-terrace-face' })),
      h('span', { class: 'om-terrace-label' }, h('span', { class: 'om-terrace-name' }, t.name), ' ', z))
    return { li, z, t }
  })
  const fig = h('figure', { class: 'om-zig-fig' },
    h('div', { class: 'om-zig-shrine' }, h('span', { class: 'om-zig-shrine-face', 'aria-hidden': 'true' }), h('code', {}, ':root')),
    h('ol', { class: 'om-zig-terraces', 'aria-label': 'Seven terraces, from the summit down' }, items.map((i) => i.li)),
    h('div', { class: 'om-zig-stair', 'aria-hidden': 'true' }, h('span', { class: 'om-zig-arrow' }, '↓')),
    h('figcaption', { class: 'om-zig-lost' }, 'The silver terrace is lost: the tablet is narrower than a span.'),
  )
  const el = h('section', { class: 'om-obj om-zig', 'aria-labelledby': 'om-zig-h' },
    h('h2', { id: 'om-zig-h', class: 'om-obj-h' }, 'The ziggurat of seven colours'),
    fig,
    h('p', { class: 'om-label' }, 'Seven terraces in the colours Herodotus gave the seven walls of Ecbatana, each one a layer with its own ',
      h('code', {}, 'z-index'), '. The shrine at the top is ', h('code', {}, ':root'),
      '. The stair runs downward. A ziggurat was built for descent, and every style comes down these steps from the Root.'))

  // Each terrace learns its height on the Ladder from the stylesheet, so this file never has to know it.
  function label() {
    for (const { li, z } of items) {
      const v = getComputedStyle(li).zIndex
      const t = `z-index: ${v}`
      if (z.textContent !== t) z.textContent = t
    }
  }
  return { el, label, items }
}
