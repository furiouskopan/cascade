// THE LOTUS OF LETTERS. The six letters written on the yantra's petals (the ashram's Rosetta fragment,
// Canon §6), taught one by one in the manner of an alphabet primer: the glyph, the letter it stands for,
// its name in Katabasic and what it depicts. Pointing at a letter lights its petal on the yantra.
// The names come from lib/glyphs.js (ALPHABET, SCRIPT, STROKES); the page reads them defensively, so it
// still teaches the letters if the glyph layer ever renames its exports.
import { h } from '../../lib/dom.js'
import * as G from '../../lib/glyphs.js'
import { devaNum } from './lore.js'

export function buildLetters(A) {
  const { ctx, life } = A
  const letters = G.ROSETTA?.ashram ?? ['t', 'h', 'e', 's', 'l', 'u']
  const alphabet = G.ALPHABET ?? {}
  const script = G.SCRIPT ?? { name: 'Katabasic', epithet: 'the Hand of Descent', nib: 33 }
  const strokes = Array.isArray(G.STROKES) ? G.STROKES : []

  const cards = letters.map((l, i) => {
    const info = alphabet[l] ?? {}
    return h('li', { class: 'ash-letter', dataset: { letter: l } },
      h('span', { class: 'ash-letter-num', 'aria-hidden': 'true' }, `${devaNum(i + 1)}`),
      h('span', { class: 'ash-letter-glyph glyph', lang: 'x-cascade', 'aria-hidden': 'true' }, G.toPua(l)),
      h('span', { class: 'ash-letter-eq' },
        h('span', { class: 'visually-hidden' }, 'The glyph for '),
        h('b', {}, l.toUpperCase()),
        info.name ? h('span', { class: 'ash-letter-name' }, ` ${info.name}`) : null),
      info.sign ? h('span', { class: 'ash-letter-sign' }, info.sign) : null,
      info.gloss ? h('span', { class: 'ash-letter-gloss' }, info.gloss) : null,
    )
  })
  const list = h('ol', { class: 'ash-letters' }, cards)

  const strokeLine = strokes.length
    ? h('p', { class: 'ash-strokes' },
      h('span', { class: 'ash-kicker' }, `the ${strokes.length === 6 ? 'six' : strokes.length} strokes`),
      strokes.map((s, i) => h('span', { class: 'ash-stroke' }, i ? ' · ' : '', h('i', {}, s.name), ` (${s.css})`)))
    : null

  const el = h('section', { class: 'ash-letters-sec', 'aria-labelledby': 'ash-letters-title' },
    h('header', { class: 'ash-letters-head' },
      h('p', { class: 'ash-sec-deva', lang: 'sa', 'aria-hidden': 'true' }, 'अक्षर'),
      h('h2', { id: 'ash-letters-title' }, 'The Lotus of Letters'),
      h('p', { class: 'ash-lede' },
        `Six letters of ${script.name}, ${script.epithet}, grow on the petals of the yantra, each written with one nib held at ${script.nib ?? 33} degrees. `,
        'The other twenty are said to grow in the other halls of the temple, and a patient pilgrim collects them all. ',
        'The word ', h('i', {}, 'akṣara'), ' means a letter, and also what does not perish.'),
    ),
    list,
    strokeLine,
  )

  // Pointing at a letter lights its petal on the yantra.
  const petalOf = (l) => [...ctx.root.querySelectorAll('.ash-rosetta .rosetta-pair')]
    .find((p) => p.querySelector('dd')?.textContent?.trim().toLowerCase() === l)
  let lit = null
  function light(l) {
    const p = l ? petalOf(l) : null
    if (p === lit) return
    lit?.classList.remove('is-named')
    lit = p
    lit?.classList.add('is-named')
  }
  life.on(list, 'pointerover', (e) => light(e.target.closest?.('.ash-letter')?.dataset.letter))
  life.on(list, 'pointerleave', () => light(null))

  return { el }
}
