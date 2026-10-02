// THE INTERSTICE · the visit's own fate in each room (everything that is NOT the same for everyone).
// The architecture of a room comes from its address (world.js); its lighting, its damage, whether its
// plaque is possessed and the verse somebody pencilled on its plaster come from this visit's fate,
// forked per room from ctx.rng.fork('interstice'), so walking back into a room finds it as you left it.
import { verse, prophecy } from '../../lib/scripture.js'
import { DOCTRINE } from '../../lib/lexicon.js'
import { keyOf } from './world.js'

const DAMAGE = ['tile', 'stain', 'peel', 'crack', 'scuff']

export function fateOf(visit, path, sky) {
  const r = visit.fork(`room/${keyOf(path)}`)
  const night = sky?.has?.('night')
  const lamp = r.weighted(night ? { on: 5, low: 4, off: 2 } : { on: 9, low: 2, off: 1 })
  const many = Number(r.weighted({ 0: 3, 1: 4, 2: 2 }))
  const damage = r.shuffle(DAMAGE).slice(0, many).map((kind) => ({ kind, x: r.float(0.15, 0.85), y: r.float(0.2, 0.8), s: r.float(0.7, 1.3) }))
  const [term, meaning] = r.pick(Object.entries(DOCTRINE))
  return {
    lamp,
    damage,
    possessed: r.chance(0.22) ? { term, meaning } : null,
    verse: verse(r.fork('verse'), { fragmentChance: 0.2 }),
    tilt: r.float(-2.4, 2.4), // how crookedly the pencil wrote
    kept: r.pick(['far', 'left', 'right', 'floor', 'ceil']), // the one panel left lit at 108 s of stillness
    flick: r.float(0, 1),
  }
}

// The notice taped up in the room you came in by: the sky of this visit, in the building's voice.
export function notice(visit, sky) {
  return prophecy(visit.fork('notice'), sky)
}
