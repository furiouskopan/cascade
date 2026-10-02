// THE INTERSTICE · what the building says. Short, plain sentences, in the voice of a text adventure
// that has been left running in an empty office at night. Everything here is plain text: the face puts
// it into the page with textContent only (Canon §9), including whatever came from the address bar.
import { makeRng } from '../../kernel/rng.js'
import { stepName, keyOf } from './world.js'

const WALL = { left: 'left', right: 'right', far: 'far' }
const DIR_WORD = { far: 'ahead', left: 'to your left', right: 'to your right' }

const NUMBERS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const say = (n) => NUMBERS[n] ?? String(n)
const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

// What the room is, in one sentence: the same for everyone who stands in it.
function what(m) {
  const { room, path } = m
  const name = stepName(path)
  if (!path.length) return 'The Stairwell. This is body, the room every other room is inside. A stair goes down past the edge of the light.'
  const r = makeRng(`interstice/words/${keyOf(path)}`)
  const b = room.box
  const empty = r.pick([
    `An empty div: ${b.padding} pixels of pale green padding, a ${b.border}-pixel border the yellow of old paper, ${b.margin} pixels of dusty margin, and inside it nothing at all.`,
    `A room made of one empty div. Margin ${b.margin}, border ${b.border}, padding ${b.padding}; content, none.`,
    `An empty div with everything but content: a margin of ${b.margin}, a border of ${b.border}, a padding of ${b.padding}, all kept for nobody.`,
    `Nobody has put anything in this div. The padding (${b.padding} pixels) keeps its distance from nothing.`,
  ])
  if (m.seed && !m.taken) return `${name}. This room is not empty. The slot in the far wall stands open, and something lies in it: one letter, with no element around it.`
  if (m.seed && m.taken) return `${name}. Empty now, like all the others. The slot has closed to a hairline.`
  if (room.upside) return `${name}, the Lost: the last child of body.${m.mercy ? '' : ' Everything here hangs from the floor.'} ${empty}`
  return `${name}. ${empty}`
}

function light(m) {
  if (m.solved) return 'Every light in the building is on.'
  if (m.seed) return 'A bare bulb hangs on its flex: the only warm light you have seen in here.'
  return {
    on: 'A fluorescent panel hums overhead.',
    low: 'One tube of the panel overhead has gone out; the other hums for both of them.',
    off: 'The light is out. What you can see comes in through the doorways.',
  }[m.fate.lamp] ?? ''
}

// The ways out, in the order a visitor would look for them.
function ways(m) {
  const parts = []
  for (const dir of ['far', 'left', 'right']) {
    const doors = m.exits.filter((e) => e.dir === dir)
    if (!doors.length) continue
    const names = doors.map((e) => `${stepName(e.to)}${e.warm ? ' (a little warmth comes through it)' : ''}${e.home ? '' : ''}`)
    parts.push(`${DIR_WORD[dir]} to ${list(names)}`)
  }
  if (m.home) parts.push('ahead, a doorway back to the temple')
  const back = m.path.length ? `Behind you, ${stepName(m.path.slice(0, -1))}${m.warmBack ? ' (a warm draught comes from there)' : ''}.` : 'Behind you, the way out of the Interstice.'
  if (!parts.length) return `No doorways but the way you came. ${back}`
  return `Doorways: ${parts.join('; ')}. ${back}`
}

function special(m) {
  const out = []
  if (m.passage && !m.solved) {
    out.push(m.passage.dir === 'far'
      ? 'Along the foot of the far wall, where there is no door, there is a thin line of warm light.'
      : `Along the foot of the ${WALL[m.passage.dir]} wall, where there is no door, there is a thin line of warm light.`)
  }
  const kind = m.room.kind
  if (kind === 'window') {
    const moon = m.sky?.moon
    out.push(moon && moon.illumination > 0.04
      ? `A window in the ${m.room.windowSide} wall shows the moon, ${moon.name}, ${Math.round(moon.illumination * 100)} per cent lit.`
      : `A window in the ${m.room.windowSide} wall shows a sky with no moon in it.`)
  }
  if (kind === 'waiting') out.push(`${cap(say(m.figures ?? 5))} figures made of placeholder grey sit in plastic chairs along the far wall, waiting for content that never came.`)
  if (kind === 'mirror') out.push('The far wall is a dark glass.')
  if (m.wet) out.push('The floor is wet. A folding sign says CAUTION: overflow: visible.')
  if (m.notice) out.push('A notice is taped to the wall.')
  return out.join(' ')
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// The description read aloud when you step into a room (the aria-live region).
export function describe(m) {
  return [what(m), light(m), special(m), ways(m)].filter(Boolean).join(' ')
}

export function pencilled(v) {
  return `Pencilled on the plaster: “${v.text}” (${v.ref})`
}

const SOLID = [
  (w) => `The ${w} wall is solid. Plaster, then more plaster.`,
  (w) => `You put your hand on the ${w} wall. It is exactly as solid as it looks.`,
  (w) => `Nothing that way but the ${w} wall.`,
  (w) => `You knock on the ${w} wall. It knocks back, politely.`,
]
export function solid(dir, n) {
  if (dir === 'far') return n % 2 ? 'You knock on the far wall. It is the content box, and there is nothing in it.' : 'The far wall is solid, and empty, and blue.'
  if (dir === 'back') return 'There is no way back from here but the way out.'
  return SOLID[n % SOLID.length](WALL[dir] ?? dir)
}

export const GIVE = (dir) => (dir === 'far'
  ? 'Your hand goes into the far wall a little way, as if it were not quite there. Push again.'
  : `Your hand goes into the ${WALL[dir]} wall a little way, as if it were not quite there. Push again.`)

export const THROUGH = (dir) => `You step through the ${dir === 'far' ? 'far' : WALL[dir]} wall. It was only painted on: it has never taken a pointer event in its life.`

export const STILL = {
  7: 'The hum dips, as if the building were listening.',
  33: 'While you stood still, the far wall grew a doorway. It was always in the tree; it had only never been painted.',
  108: 'Every panel goes dark but one. In the dark the plaques count from the other end.',
  stir: 'The lights come back, one panel at a time.',
}

export const RESTLESS = 'Your footsteps are the only footsteps in the building.'

export const RETURNED = 'While you were away, this room grew one more doorway than it had.'

export const NOTHING_TO_TAKE = 'There is nothing here to take. This room is :empty, like the rest.'

export const XYZZY = 'A hollow voice says: “:empty”.'

export function arrival({ mistake }) {
  return mistake ? `You asked for “${mistake}”. There is no such page, so you are here instead.` : ''
}

// What picking up the letter says. `how`: {letter, mistake, mended}
export function taken({ letter, mistake, mended }) {
  const L = letter.toUpperCase()
  const lines = [`You take the ${L}. It weighs nothing; text never does.`]
  if (mended) {
    lines.push(mended.kind === 'extra'
      ? `It is the ${L} that fell into the address you typed. Without it, the address is whole again: ${mended.to}`
      : `It is the ${L} that fell out of the address you typed. Put it back and the address is whole again: ${mended.to}`)
  } else if (mistake && mistake.toLowerCase().includes(letter)) {
    lines.push(`It fell out of “${mistake}”. Every address that goes wrong drops a letter somewhere, and this one was posted here and never collected.`)
  } else {
    lines.push('Nobody lost it. It was here before the address you came by.')
  }
  lines.push('Now every room in the Interstice is :empty, and the only thing that was ever in one is in your hand. All the lights come on.')
  return lines.join(' ')
}

export const WAY_HOME = 'A doorway has opened in the far wall: back to the temple.'

export const MIRROR = 'Something moves in the glass the way your hand moved, thirty-three seconds ago.'

export const WAITING_DONE = 'You have walked the room in its true order, which is not the order it is seen in. The figures nod to you, one after another, in DOM order.'

export function waiting(i, of, at) {
  return `A figure made of placeholder grey, waiting for content: number ${i} of ${of} in the tree, and number ${at} in the row.`
}

export const UPSIDE = 'Room four hundred and four, the last child of body. Here the floor is overhead.'
export const UPSIDE_MERCY = 'Room four hundred and four, the last child of body. It hangs from its floor, except under mercy, as now.'

export const STAIRWELL_SIGN = 'Down the stair: rung −2147483648'
