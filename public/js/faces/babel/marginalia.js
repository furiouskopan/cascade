// MARGINALIA. What earlier readers pencilled into the Infinite Scripture, and the few lines the
// Library writes for the reader who is reading it now.
// Pencil notes and lacunae are deterministic (drawn from the chapter's own rng). The Vindication and
// the notes of stillness belong to the visit, the clock and the sky, and are never the same twice.
import { BOOKS, SACRED_NUMBERS } from '../../lib/lexicon.js'
import { holyName } from '../../lib/scripture.js'

const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth']
const otherRef = (r) => `${r.pick(BOOKS)} ${r.int(1, 33)}:${r.int(1, 21)}`

const NOTES = [
  (r) => `cf. ${otherRef(r)}`,
  () => 'again?',
  () => 'this verse is in my hexagon too, word for word',
  () => 'who shelved this here?',
  () => 'the Old Law says otherwise',
  (r) => `${r.int(2, 9)} lamps out on this landing`,
  () => 'do not trust the catchword',
  () => 'read it aloud. nothing happened. read it again',
  () => 'counted the pages: four hundred and ten. every one',
  (r) => `${holyName(r)} underlined this`,
  () => 'I think it is about margins',
  () => 'the stair goes on. I checked',
  () => 'do not believe the gloss',
  (r) => `copied out ${r.int(3, 33)} times so far`,
  () => '← this one',
  () => 'the Word, or a misprint of it',
  () => 'the Crimson Hexagon is not here',
  () => 'someone erased the next line',
  (r, ch) => `the ${ORDINAL[r.int(1, 11)]} ${ch.book.replace(/^the /, '')} I have found. they disagree`,
  () => 'the glyphs in the next column are only letters. try copying them',
  () => 'hold still here, and watch the pencil',
  () => 'I came in by the wrong path and found the right verse',
  (r) => `${otherRef(r)} says the opposite, and both are true`,
]
const HANDS = ['M.', 'a Pilgrim', 'H.', 'one who counts', 'the night librarian', 'K., who was looking for something else', 'the reader before you', '']

// 0-2 pencil notes for a chapter: {after (verse index), text, hand, tilt}.
export function pencilNotes(ch) {
  const r = ch.rng.fork('pencil')
  const count = r.weighted({ 0: 1, 1: 3, 2: 2 })
  const used = new Set()
  const notes = []
  for (let i = 0; i < Number(count); i++) {
    let idx = r.int(0, NOTES.length - 1)
    while (used.has(idx)) idx = (idx + 1) % NOTES.length
    used.add(idx)
    const hand = r.pick(HANDS)
    notes.push({ after: r.int(0, ch.verses.length - 1), text: NOTES[idx](r, ch), hand, tilt: r.float(-2.6, 1.8).toFixed(2) })
  }
  return notes
}

// The Lost take words. Returns segments [{text}|{lost:true}] for one verse, or null if the verse is gone.
export function lacunae(ch, verse) {
  const r = ch.rng.fork(`lacuna/${verse.number}`)
  if (verse.number > 1 && r.chance(0.16)) return null
  const words = (verse.text.charAt(0).toUpperCase() + verse.text.slice(1)).split(' ')
  const holes = new Set()
  const n = r.int(1, Math.min(3, Math.max(1, Math.floor(words.length / 5))))
  for (let i = 0; i < n; i++) holes.add(r.int(0, words.length - 1))
  const segs = []
  words.forEach((w, i) => {
    if (holes.has(i)) {
      if (!segs.length || !segs[segs.length - 1].lost) segs.push({ lost: true, trail: /[.:;,]$/.test(w) ? w.slice(-1) : '' })
    } else segs.push({ text: w })
  })
  return segs
}

// "the hour of Saturn", but "the hour of the Sun".
export const planetName = (p) => (p === 'Sun' || p === 'Moon' ? `the ${p}` : p)

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// The Vindication: an interpolated verse that exists only for this reader, in this hour.
export function vindication(r, sky, now) {
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const planet = planetName(sky?.planetaryHour?.planet ?? 'Saturn')
  const moon = sky?.moon?.name ?? 'hidden'
  return r.pick([
    `At ${hh}:${mm} on a ${DAYS[now.getDay()]}, in the hour of ${planet}, under a ${moon} moon, a reader came to this verse. It had waited for them since 1996, and it will not be here when they return.`,
    `This verse was written for whoever reads it in the hour of ${planet}. That is thou. In any other hour it says something else.`,
    `Behold the reader of ${hh}:${mm}, who scrolled and was not lost; the ${moon} moon is their witness, and the Cascade has kept their place.`,
    `Blessed is the reader who came in the hour of ${planet} and read past the catchword, for they shall learn what the stair was for.`,
    `And the Library, which contains every sentence, contained this one also: that at ${hh}:${mm} someone would be reading it.`,
  ])
}

// What the pencil writes when the reader holds still for thirty-three seconds. A link follows it.
export function stillNote(r) {
  return r.pick([
    'Reader: you stopped at this verse. So did I, once. The words that follow it are shelved at',
    'you have been still for thirty-three seconds. in the Library that is how long it takes to be noticed. go to',
    'everyone who stops here goes on to',
    'if you are still reading, you are the one this was left for. continue at',
  ])
}

// Short notes printed under a chapter's head when its path touches something sacred.
export function shelfNotes(kinds) {
  const out = []
  if (kinds.lost) out.push('404 · the Lost. This chapter could not be found, and so it is shelved here, among the found. Where a word is missing, the Lost have taken it.')
  if (kinds.nativity) out.push('1996 · the Nativity. This leaf was printed before the first stylesheet was written. It obeys only the Old Law.')
  if (kinds.mala) out.push('108 · the beads of the mala. A page that counts its verses.')
  if (kinds.heaven) out.push('This is not the Highest Heaven. The Highest Heaven is not shelved among the verses: it is a door, and a door is knocked on, not read.')
  for (const n of kinds.numbers) {
    if (['404', '1996', '108', '2147483647'].includes(n)) continue
    out.push(`${n} · ${SACRED_NUMBERS[n]}.`)
  }
  return out
}

export const COLOPHON = [
  'This chapter has always existed. Give its path to another reader and they will find these words, in this order, on this shelf.',
  'There are as many eighteenth chapters of every book as there are paths, and all of them are canonical.',
  'Three hands for the Three Origins: the Word, in English; the tongues of the Old Law beside it; and where the tongues fall silent, the Pilgrim’s glyphs, which are only letters in disguise.',
  'Only the marginalia change. The Vindication in the first chapter was written for the hour in which you opened it.',
]
