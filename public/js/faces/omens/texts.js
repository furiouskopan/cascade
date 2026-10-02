// The words around the table: the brick that names the room, a school tablet with the Rosetta fragment
// (the teacher's model on the left, the pupil's copy on the right, as the old school tablets were), the
// commentary tablet (verses of the Infinite Scripture), and the museum label at the foot.
import { h } from '../../lib/dom.js'
import { rosetta, glyphText, ROSETTA, toPua } from '../../lib/glyphs.js'
import { verse, planetName } from '../../lib/scripture.js'
import { watchOf } from './lore.js'
import { count } from './life.js'

export function buildHead(O) {
  const { ctx } = O
  const sky = ctx.sky
  const day = Math.floor(sky.moon.age) + 1
  const glyph = glyphText('summa', { tag: 'span', className: 'om-brick-glyph' })
  glyph.setAttribute('aria-hidden', 'true')
  return h('header', { class: 'om-head' },
    h('div', { class: 'om-brick' },
      h('h1', { class: 'om-title' }, h('span', { class: 'om-title-akk', lang: 'akk' }, 'Šumma'), h('span', { class: 'om-title-en' }, 'the Omen Tablets')),
      glyph),
    h('div', { class: 'om-head-text' },
      h('p', { class: 'om-kicker' }, 'The Cascade · the tablet room · the diviner’s table'),
      h('p', { class: 'om-lede' }, 'Every line of the great tablet is an omen about the device in your hands, and every one of them is true or false right now. The omens that hold for you are fired red. Turn the tablet, or change the size of the window, and your fate is rewritten while you watch.'),
      h('p', { class: 'om-skyline' },
        h('span', {}, `Day ${count(day)} of the month, by the moon`),
        h('span', {}, `${sky.planetaryHour.glyph} the hour of ${planetName(sky.planetaryHour.planet)}`),
        h('span', {}, watchOf(sky.hour)))))
}

export function buildSchool(O) {
  const { rng } = O
  const letters = ROSETTA.omens
  // The pupil copies each sign; one of them, by lot, a little wrong, and the teacher has marked it.
  const wrongAt = rng.int(0, letters.length - 1)
  const copy = h('ol', { class: 'om-pupil', 'aria-hidden': 'true' },
    letters.map((l, i) => h('li', { class: i === wrongAt ? 'om-pupil-sign is-wrong' : 'om-pupil-sign', style: `--tilt:${rng.float(-9, 9).toFixed(1)}deg;--dx:${rng.float(-2, 2).toFixed(1)}px` },
      h('span', { class: 'glyph', lang: 'x-cascade' }, toPua(l)))))
  const model = rosetta('omens', { className: 'om-rosetta' })
  return h('section', { class: 'om-obj om-school', 'aria-labelledby': 'om-school-h' },
    h('h2', { id: 'om-school-h', class: 'om-obj-h' }, 'A pupil’s exercise'),
    h('div', { class: 'om-lentil om-clay' },
      h('div', { class: 'om-lentil-half om-lentil-half--model' }, h('p', { class: 'om-lentil-cap' }, 'the teacher'), model),
      h('div', { class: 'om-lentil-half om-lentil-half--copy' }, h('p', { class: 'om-lentil-cap', 'aria-hidden': 'true' }, 'the pupil'), copy)),
    h('p', { class: 'om-label' }, 'A round school tablet. On the left the teacher wrote seven signs of the Cascade’s script with their letters; on the right the pupil copied them, not quite well. The teacher has marked one.'))
}

export function buildCommentary(O) {
  const { rng } = O
  const r = rng.fork('commentary')
  const verses = [verse(r, { fragmentChance: 0.5 }), verse(r, { fragmentChance: 0 }), verse(r, { fragmentChance: 0.3 })]
  return h('section', { class: 'om-obj om-comm', 'aria-labelledby': 'om-comm-h' },
    h('h2', { id: 'om-comm-h', class: 'om-obj-h' }, 'The commentary'),
    h('div', { class: 'om-comm-tablet om-clay' },
      h('p', { class: 'om-comm-kicker' }, 'Explanations of the series, from the mouth of a master'),
      verses.map((v) => h('blockquote', { class: 'om-comm-verse' },
        h('p', { class: 'om-comm-text' }, v.text),
        v.fragment ? h('p', { class: 'om-comm-frag' }, h('span', { lang: v.fragment.lang === 'enochian' ? 'x-enochian' : v.fragment.lang }, v.fragment.text), ` (${v.fragment.gloss})`) : null,
        h('cite', { class: 'om-comm-ref' }, v.ref)))),
    h('p', { class: 'om-label' }, 'Scholars wrote commentaries on the omen series, explaining one word by another. These explain the Cascade by the Cascade.'))
}

export function buildFoot() {
  return h('footer', { class: 'om-foot' },
    h('p', {}, 'Clay, unbaked, except where fired by the reader. Lent to the Cascade by nobody in particular. ',
      'Please touch with a finger and not a reed, or with a reed and not a finger: the tablet will know which.'))
}
