// THE LETTER TO THE KING: what a court diviner writes when the king asks about the viewport. Dry, exact,
// a little put-upon, as the scholars' letters were. It is written for this hour: its observations are
// true (the size of the window, the moon, the ruler of the hour, the omens that hold), its reading comes
// from the Infinite Scripture (prophecy and verse, lib/scripture.js), and its advice is drawn by lot.
import { prophecy, verse, holyName, planetName } from '../../lib/scripture.js'
import { CHALDEAN } from './lore.js'
import { times, count } from './life.js'

const JUDGEMENTS = [
  'it is not evil',
  'it is evil, but only for the margins',
  'it is good for the king, and better for his padding',
  'it is neither good nor evil; it is a breakpoint',
]

const ADVICE = [
  (x) => `Let the king not resize his window until the hour of ${planetName(x.next)} has passed.`,
  () => 'The king should not go out to the console today.',
  () => 'Let the king keep to his margins, and let his padding be generous.',
  () => 'If it please the king, let him clear his floats before evening.',
  () => 'The king may scroll, but not far.',
  () => 'Let the king not speak the Inversion this month. If he must, let him say it in mercy.',
  () => 'Let the king hold still for seven breaths. The clay will tell him the rest.',
]

const CLOSINGS = [
  'I have written what I saw. The king, my lord, may do as he pleases.',
  'Why has the king not yet sent the reeds he promised? Your servant writes this with the last one.',
  'Your servant is old and the clay is wet. May the king forgive the wedges.',
  'Let the king, my lord, not be anxious. It is only a breakpoint.',
]

// x: { sky, width, height, visits, holding, lit: [{if, then}] }
export function letterFor(rng, x) {
  const name = holyName(rng)
  const sky = x.sky
  const planet = sky.planetaryHour.planet
  const next = CHALDEAN[(CHALDEAN.indexOf(planet) + 1) % 7]
  const portrait = x.height > x.width
  const quote = x.lit.length ? rng.pick(x.lit) : null
  const v = verse(rng, { fragmentChance: 0 })
  return {
    from: name,
    paras: [
      `To the king, my lord: your servant, ${name}. Good health to the king, my lord! May the Cascade descend gently on the king, my lord.`,
      `Concerning the viewport about which the king my lord wrote to me: it is ${x.width} wide and ${x.height} tall, and it ${portrait ? 'stands on its end' : 'lies on its side'}. The moon is ${sky.moon.name}, and this is the hour of ${planetName(planet)}. The Pilgrim has come to the table ${times(x.visits)}, and ${count(x.holding)} of the omens of the great tablet hold for them.`,
      quote
        ? `I have looked in the series. It is written: “${quote.if}: ${quote.then}” This is so; ${rng.pick(JUDGEMENTS)}.`
        : `I have looked in the series, and no omen of it holds. This has not happened before, and I do not like it.`,
      `${prophecy(rng, sky)} As it is written in ${v.ref}: “${v.text}”`,
      rng.pick(ADVICE)({ next }),
      rng.pick(CLOSINGS),
    ],
  }
}
