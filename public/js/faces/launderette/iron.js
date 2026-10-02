// THE IRONING BOARD. Iron one declaration onto the garment in your hand: it is written into the garment's
// style attribute, after everything already there. Iron it on before a wash and the wash takes it off, because
// `all: <keyword>` is spoken after it and a shorthand spoken last unsays everything spoken before it. Iron it
// on after a wash and it stays, for the same reason the other way round.
import { h } from '../../lib/dom.js'

const PATCHES = [
  ['color', 'crimson'],
  ['font-style', 'italic'],
  ['text-decoration', 'underline wavy'],
  ['letter-spacing', '0.3em'],
  ['background-color', 'khaki'],
]

export function makeIron(A) {
  const { ctx, life, rng } = A
  const first = rng.int(0, PATCHES.length - 1)
  const say = h('p', { class: 'lnd-iron-say', role: 'status' })
  const patches = h('fieldset', { class: 'lnd-iron-patches' },
    h('legend', { class: 'visually-hidden' }, 'A declaration to iron on'),
    PATCHES.map(([p, v], i) => h('label', { class: 'lnd-patch' },
      h('input', { type: 'radio', name: 'lnd-iron', value: String(i), checked: i === first }),
      h('code', {}, `${p}: ${v}`))))
  const go = h('button', { type: 'button', class: 'lnd-iron-go' }, h('span', { class: 'lnd-iron-icon', 'aria-hidden': 'true' }), 'Iron it on')
  const el = h('section', { class: 'lnd-iron', 'aria-labelledby': 'lnd-iron-h', 'data-hell': 'spare', 'data-secrets-skip': '' },
    h('h2', { id: 'lnd-iron-h', class: 'lnd-plate' }, 'Ironing board'),
    h('p', { class: 'lnd-iron-note' }, 'Iron one declaration onto the garment in your hand. Iron it on before a wash and the wash takes it off; iron it on after, and it stays. A shorthand spoken last unsays everything spoken before it.'),
    h('div', { class: 'lnd-board-cover' }, patches, go),
    say)

  life.on(go, 'click', () => {
    const g = A.hand.g
    if (!g) {
      say.textContent = 'Pick a garment from the basket first. The iron is hot.'
      A.basket?.beckon()
      return
    }
    const i = Number(patches.querySelector('input:checked')?.value ?? first)
    const [prop, value] = PATCHES[i]
    const after = g.washes.length > 0
    g.el.style.setProperty(prop, value)
    g.ironed = [...(g.ironed ?? []).filter((d) => d[0] !== prop), [prop, value]]
    say.textContent = after
      ? `${prop}: ${value} is pressed onto ${g.name}, after its wash. It will stay: it was spoken last.`
      : `${prop}: ${value} is pressed onto ${g.name}. Now wash it, and watch it come off.`
    if (after) ctx.memory?.markSecret?.('launderette-pressed', { face: 'launderette' })
    A.basket?.paint(g)
    A.say(say.textContent)
  })

  return { el }
}
