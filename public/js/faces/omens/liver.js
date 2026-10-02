// THE LIVER OF CLAY, the face's riddle (docs/ROADMAP.md §4.2).
//
// A teaching model of a sheep's liver, its face cut into sixteen zones by incised lines. The zones are a
// real CSS grid: in the stylesheet (the Book) their grid-template-areas are drawn in one way, and on
// screen (the flesh) each zone is carried by a transform and cut by a clip-path into an organic patchwork.
// The reed omen tells the Pilgrim to read the liver in the Book and not in the flesh. Whoever reads it
// and presses its word into the clay (the scribe's field, or typed anywhere on the page) has read the
// liver: the zones return to their places in the Book, and the flesh agrees with the Book.
//
// The word is known here only by its seal, hash('omens:liver:' + word) from kernel/rng.js.
import { h } from '../../lib/dom.js'
import { hash } from '../../kernel/rng.js'
import { MARKS } from './lore.js'
import { signs } from './clay.js'
import { s } from './life.js'

const ZONES = ['z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7', 'z8', 'z9', 'za', 'zb', 'zc', 'zd', 'ze', 'zf', 'zg']
const SEAL = '1wgp54x'
const sealOf = (word) => hash(`omens:liver:${word}`)().toString(36)
// Peg holes, pressed into some of the zones (in percent of the figure).
const HOLES = [[11.3, 50.9], [48.3, 23.7], [67, 50.1], [37.9, 51.8], [77.3, 70.8], [42.7, 78.4], [88.5, 30.6]]
// and in the others, the name of the zone, written small (in percent of the figure)
const WRIT = [[30.5, 25.7], [53.6, 45.5], [16.9, 31.2], [72.2, 24.2], [24.2, 51.2], [82.2, 50.9], [17.9, 70.5], [28.3, 81.7], [59.3, 70.7]]
const NAMES = ['man', 'pad', 'nap', 'bab', 'uba', 'mar', 'dan', 'sul', 'kak']

const WRONG = [
  'The liver does not say that. The diviner writes “unclear” in the margin.',
  'No. The diviner suggests reading the liver in the Book, and not in the flesh.',
  'That is not written on this liver. It may be written on another sheep.',
  'The clay does not take that word. Look again, from a step away.',
]

export function buildLiver(O) {
  const { ctx, life, say } = O
  let solved = false
  let wrong = 0

  const zones = ZONES.map((z) => h('i', { class: 'om-zone', 'data-zone': z }))
  const grain = h('div', { class: 'om-liver-grain', 'aria-hidden': 'true' })
  grain.style.setProperty('--holes', HOLES.map(([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgb(38 24 12 / 0.75) 0 0.55%, rgb(255 240 214 / 0.45) 0.7%, transparent 0.95%)`).join(', '))
  // The names of the zones, pressed small into the clay with the wedge-hand.
  const writ = s('svg', { class: 'om-liver-writ', viewBox: '0 0 1000 625', preserveAspectRatio: 'none', focusable: 'false' })
  writ.innerHTML = WRIT.map(([x, y], i) => {
    const t = signs(NAMES[i % NAMES.length], 0, 0, 1.25, { ink: 'rgb(62 42 22 / 0.5)', lit: 'rgb(255 244 222 / 0.4)' })
    return `<g transform="translate(${(x * 10 - t.width / 2).toFixed(1)} ${(y * 6.25 - 7).toFixed(1)})">${t.svg}</g>`
  }).join('')
  grain.append(writ)
  const fig = h('figure', { class: 'om-liver-fig' },
    h('div', { class: 'om-liver-shadow', 'aria-hidden': 'true' }, h('i')),
    h('div', { class: 'om-liver-gall', 'aria-hidden': 'true' }),
    h('div', { class: 'om-liver-body', 'aria-hidden': 'true' }),
    h('div', { class: 'om-liver-grid', 'aria-hidden': 'true' }, zones),
    grain,
    h('figcaption', { class: 'visually-hidden' }, 'A clay model of a sheep’s liver, its face divided into sixteen zones by incised lines.'),
  )

  const marks = h('dl', { class: 'om-marks', tabindex: '0', 'aria-label': 'The marks a diviner reads on a liver, with their glosses' },
    MARKS.map((m) => h('div', { class: 'om-mark' },
      h('dt', {}, h('i', { lang: 'akk' }, m.akk), ' ', m.en),
      h('dd', { class: 'om-gloss' }, m.css))))

  const input = h('input', { id: 'om-word', name: 'word', class: 'om-scribe-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: '24', placeholder: 'one word' })
  const note = h('p', { class: 'om-scribe-note', 'aria-live': 'polite' })
  const label = h('label', { for: 'om-word', class: 'om-scribe-label' }, 'What does the liver say?')
  const form = h('form', { class: 'om-scribe', novalidate: true, 'data-hell': 'spare' },
    label,
    h('div', { class: 'om-scribe-row' }, input, h('button', { type: 'submit', class: 'om-btn' }, 'Press it into the clay')),
    note)

  const el = h('section', { class: 'om-obj om-liver', 'aria-labelledby': 'om-liver-h', 'data-hell': 'spare' },
    h('h2', { id: 'om-liver-h', class: 'om-obj-h' }, 'The liver of clay'),
    fig,
    h('p', { class: 'om-label' }, 'A model of a sheep’s liver, for teaching diviners. Its zones are cut by incised lines and every zone has its name. ',
      h('em', {}, 'What the liver says is written in the Book.')),
    marks,
    form,
  )

  function read({ again = false } = {}) {
    el.dataset.read = 'true'
    label.textContent = 'The liver has been read.'
    input.disabled = true
    form.querySelector('button').disabled = true
    if (again) note.textContent = 'You read this liver on an earlier day. Its zones still stand where the Book puts them.'
  }

  function solve(word, how) {
    if (solved) return
    solved = true
    read()
    const W = word.toUpperCase()
    note.textContent = `The liver says ${W}, and so does the Book. The flesh agrees with the Book. You are entered in the roll of diviners as bārûm, “the one who sees”.`
    O.onRead?.(word, how)
    if (!ctx.memory?.hasSecret?.('omens-riddle')) ctx.memory?.markSecret?.('omens-riddle', { face: 'omens', by: how })
    say(`The liver has been read: it says ${W}. Its sixteen zones move into the places the Book gives them.`)
  }

  life.on(form, 'submit', (e) => {
    e.preventDefault()
    if (solved) return
    const word = String(input.value).toLowerCase().replace(/[^a-z]/g, '')
    if (!word) {
      note.textContent = 'The clay is waiting for a word.'
      return
    }
    if (sealOf(word) === SEAL) return solve(word, 'field')
    note.textContent = WRONG[wrong++ % WRONG.length]
  })

  // Typed on the page itself (not in a field): any of the last few letters may be the word.
  life.bus(ctx.bus, 'behavior:typed', ({ buffer }) => {
    if (solved) return
    const b = String(buffer ?? '')
    for (let n = 3; n <= 10 && n <= b.length; n++) {
      const tail = b.slice(-n)
      if (!/^[a-z]+$/.test(tail)) break
      if (sealOf(tail) === SEAL) return solve(tail, 'typed')
    }
  })

  if (ctx.memory?.hasSecret?.('omens-riddle')) {
    solved = true
    read({ again: true })
  }

  return { el, fig, solve, get solved() { return solved } }
}
