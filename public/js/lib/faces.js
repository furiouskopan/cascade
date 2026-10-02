// THE FACE REGISTRY. What the temple knows about each of its faces, in one place: how a face is reached,
// how the Oracle leans towards it, how hard it is cursed, and how it sounds. Read by the Oracle
// (kernel/oracle.js), the hell layer (layers/hell.js, layers/hell/*) and the audio layer (layers/audio.js,
// layers/audio/drones.js). A new face is one entry here plus its own files, public/js/faces/<name>.js and
// public/css/faces/<name>.css (docs/CANON.md §3). No DOM in this module, so the server may import it too.
//
//   <name>: {
//     title    the face's name for people
//     how it is reached, one of:
//       lot: true        drawn by the Oracle's lot (it then needs `oracle`)
//       route: '/verse'  owns every address that starts with this prefix (babel)
//       route: '*'       owns every address the temple does not otherwise know ('/' stays with the lot)
//       neither          reached only by ctx.switchFace() or ?face= (a secret face)
//     oracle   (lot faces) the Oracle's leanings. Every number multiplies the face's weight:
//       weight     the base weight
//       newcomer   on a visitor's first visit
//       omens      { 'full-moon': ×, 'witching|midnight': × }  a key of several omens counts once if any
//                  of them holds; applied in written order. The omens of ctx.sky: witching, midnight,
//                  triple, thirty-three, full-moon, new-moon, turning, friday-13, eclipse, saturn-hour, night
//       planets    { Venus: × }  the ruler of the planetary hour
//       restless   the visitor was restless last time (remembered restlessness > 0.3)
//       still      a returning visitor who was still last time (remembered restlessness < 0.08)
//       schism     { restless: ×, still: ×, return: ×, eclipse: × }  its pull when a schism happens for that reason
//       In order: weight, newcomer, omens, planets, ×1.6 if a returning visitor has not seen it yet,
//       ×0.2 if it was the last face seen, restless, still.
//     hell     intensity  0..1 (the witching hour and midnight raise it ×1.5, capped at 1)
//              lean       { curse: × }  leanings on the odds of each curse drawn by lot
//                         (phantom war melt drift rot union zwar possess)
//              lift       drift also creeps upward by this share of each step (default 0)
//              words      optional, the face's own voice in the curses (else the temple's plain words):
//                         { whispers: [tab titles while the visitor is away], ink: [paper, ink] of the sigil
//                           favicon, inversion: [kicker, title, gloss], union: [kicker, touch, one space, part],
//                           war: 'head of the specificity war', zwar: 'what the Ladder says at its top rung' }
//     sound    tonic      the reciting tone in Hz (chants, the Amen)
//              drone      the name of a builder in layers/audio/drones.js, or a drone recipe (below)
//              bell       the face's bell, for ctx.audio.bell() and its greeting when a face without a
//                         bespoke greeting is summoned: church tubular hand bowl glass gong gm (default hand)
//              prayer     [bell, Hz] rung when a prayer is counted (default ['hand', 880])
//              hush       the hush control's words: { glyph, on, off, hint: [hint to hush, hint to summon] }
//
//   A drone recipe (layers/audio/drones.js plays it; every field is optional):
//     { wave      sine triangle square sawtooth organ reed pulse jawari voice (default sine)
//       partials  [ratio | [ratio, level]] over the tonic, each a slightly detuned pair (default [1, 1.5, 2])
//       tonic     Hz (default sound.tonic)      level   0..0.5 overall (default 0.1)
//       detune    cents between the pair (4)    cutoff  lowpass Hz (2400)      hall  reverb send 0..1 (0.5)
//       sway      [Hz, depth 0..1], a slow breathing of the level (default [0.05, 0.25])
//       noise     { kind: white | pink | brown, band: Hz, level }  air, hum or hiss under the tones
//       bells     { kind, every: [min s, max s], ratios: [over the tonic], gain }  rung now and then
//       label     what the Third Eye says it hears }
//
//   For example, a face of Phase 1 would add:
//     launderette: {
//       title: 'The All-Night Launderette', lot: true,
//       oracle: { weight: 1, omens: { witching: 3, night: 1.5 }, planets: { Moon: 1.4 }, schism: { return: 2 } },
//       hell: { intensity: 0.35, lean: { war: 1.3, drift: 0.8 } },
//       sound: {
//         tonic: 120, bell: 'gm', prayer: ['gm', 1046.5],
//         drone: { wave: 'sawtooth', partials: [1, 2, [3, 0.3]], level: 0.06, cutoff: 700,
//                  noise: { kind: 'pink', band: 240, level: 0.02 }, label: 'the tubes humming on the mains' },
//         hush: { glyph: '⏻', on: 'lights out', off: 'coin in', hint: ['Lights out', 'Put a coin in the slot'] },
//       },
//     },

export const REGISTRY = {
  sanctum: {
    title: 'The Illuminated Codex',
    lot: true,
    oracle: { weight: 1, omens: { 'full-moon': 2, 'saturn-hour': 2 } },
    hell: { intensity: 0.3, lean: { rot: 1.3, melt: 1.2, drift: 0.8 } },
    sound: {
      tonic: 146.83,
      drone: 'sanctum',
      bell: 'tubular',
      prayer: ['hand', 1174.66],
      hush: { glyph: '✠', on: 'silentium', off: 'sonet', hint: ['Silentium: hush the organ and the bells', 'Sonet: let the organ sound again'] },
    },
  },
  possession: {
    title: 'CSS Hell',
    lot: true,
    oracle: { weight: 1, omens: { 'witching|midnight': 4, 'friday-13': 3, 'turning|eclipse': 2, night: 1.5 }, restless: 1.5, schism: { restless: 4 } },
    hell: { intensity: 1 },
    sound: {
      tonic: 110,
      drone: 'possession',
      bell: 'church',
      prayer: ['church', 220],
      hush: { glyph: '◖', on: 'mute', off: 'unmute', hint: ['Mute (it will not help)', 'Unmute (you asked for this)'] },
    },
  },
  recruitment: {
    title: 'The 1997 Cult Homepage',
    lot: true,
    // The Recruiters always greet newcomers first.
    oracle: { weight: 1, newcomer: 6, planets: { Mercury: 1.6 } },
    hell: { intensity: 0.4, lean: { war: 1.3, phantom: 1.5, union: 1.2 } },
    sound: {
      tonic: 174.61,
      drone: 'recruitment',
      bell: 'gm',
      prayer: ['gm', 1046.5],
      hush: { glyph: '♫', on: 'STOP MIDI', off: 'PLAY HYMN', hint: ['STOP MIDI: stop our hymn', 'PLAY HYMN: play our hymn!!'] },
    },
  },
  ashram: {
    title: 'The Yantra Breath Temple',
    lot: true,
    oracle: { weight: 1, omens: { 'full-moon': 2.5 }, planets: { Venus: 1.8 }, still: 1.4, schism: { still: 3 } },
    hell: { intensity: 0.15, lean: { union: 1.6, drift: 0.6, war: 0.6, phantom: 0.7 } },
    sound: {
      tonic: 136.1, // Sa
      drone: 'ashram',
      bell: 'bowl',
      prayer: ['hand', 1661.2],
      hush: { glyph: 'ॐ', on: 'mauna', off: 'nāda', hint: ['Mauna: the vow of silence', 'Nāda: let the sound return'] },
    },
  },
  departure: {
    title: 'The Mothership',
    lot: true,
    oracle: { weight: 1, omens: { 'new-moon': 3, 'triple|thirty-three': 2, 'turning|eclipse': 2 } },
    // The Departed rise: its drift creeps upward.
    hell: { intensity: 0.5, lean: { drift: 1.7, zwar: 1.3, phantom: 1.1 }, lift: 0.45 },
    sound: {
      tonic: 130.81,
      drone: 'departure',
      bell: 'glass',
      prayer: ['glass', 1318.5],
      hush: { glyph: '⌁', on: 'RX OFF', off: 'TUNE IN', hint: ['RX OFF: switch the receiver off', 'TUNE IN: tune in to the Mothership'] },
    },
  },
  babel: {
    title: 'The Infinite Scripture',
    route: '/verse',
    hell: { intensity: 0.2, lean: { rot: 1.6, possess: 1.5, drift: 0.8 } },
    sound: {
      tonic: 110,
      drone: 'babel',
      bell: 'hand',
      prayer: ['hand', 880],
      hush: { glyph: '𝄐', on: 'hush', off: 'listen', hint: ['Hush the choir', 'Listen to this chapter sing'] },
    },
  },

  // ── Phase 1 (docs/ROADMAP.md §4). The Launderette and the Omens are in the lot; the Interstice owns every
  //    address the temple does not know.
  launderette: {
    title: 'The All-Night Launderette',
    lot: true,
    // Always 3:33 AM inside: it is most likely at the witching hour, and most of all at 3:33.
    oracle: { weight: 1, omens: { witching: 5, 'thirty-three': 1.6, night: 1.5 }, planets: { Moon: 1.4 } },
    hell: {
      intensity: 0.35,
      lean: { union: 1.5, drift: 1.2, melt: 0.8 },
      words: {
        whispers: ['your wash is done', 'the machine at the back is nearly done', 'you left a sock in the dryer', 'someone moved your washing', 'the tubes are still humming'],
        ink: ['#e6f1ea', '#1f57b8'],
        inversion: ['SPIN CYCLE', 'You have spoken the Inversion.', 'Everything in the drum is upside down for a few seconds. It will not come out in the wash.'],
        union: ['one load', 'two garments touch', 'and share one drum', 'and are sorted again'],
        war: 'Care instructions',
        zwar: 'the top shelf is for detergent, not for page elements',
      },
    },
    sound: {
      tonic: 100, // the tubes hum at twice the mains
      drone: { wave: 'sawtooth', partials: [1, 2, [3, 0.3]], level: 0.05, cutoff: 700, sway: [0.03, 0.2],
        noise: { kind: 'pink', band: 240, level: 0.02 }, label: 'the tubes humming on the mains, and a drum turning' },
      bell: 'gm',
      prayer: ['gm', 987.77],
      hush: { glyph: '⏻', on: 'lights out', off: 'coin in', hint: ['Lights out: let the machines rest', 'Put a coin in the slot'] },
    },
  },
  omens: {
    title: 'Šumma, the Omen Tablets',
    lot: true,
    oracle: { weight: 1, omens: { 'new-moon': 2, eclipse: 3 }, planets: { Moon: 2 } },
    hell: { intensity: 0.35, lean: { rot: 1.4, war: 0.8, phantom: 0.8 } },
    sound: {
      tonic: 146.83,
      drone: { wave: 'triangle', partials: [1, 1.5, [2, 0.5], [3, 0.2]], level: 0.06, cutoff: 1800, hall: 0.6,
        sway: [0.04, 0.3], label: 'a lyre string left ringing in a room of clay' },
      bell: 'hand',
      prayer: ['hand', 1174.66],
      hush: { glyph: '▽', on: 'lay the lyre down', off: 'pluck', hint: ['Lay the lyre down', 'Pluck the lyre'] },
    },
  },
  interstice: {
    title: 'The Interstice',
    route: '*',
    // The rooms themselves are spared (data-hell="spare"): the curses work on the plaque's neighbours, the
    // plan and the words. Every passage here is a Union, so margins collapse more often than they melt.
    hell: {
      intensity: 0.35,
      lean: { phantom: 1.3, union: 1.4, possess: 1.2, drift: 0.7, melt: 0.5 },
      words: {
        whispers: ['the light is still on in your room', '404 · we kept your room as you left it', 'your room has one more doorway now', 'nobody has been in since you left'],
        ink: ['#11161b', '#c6b26f'],
        inversion: ['nth-child(404)', 'You have spoken the Inversion.', 'Now every room hangs from its floor, as the Lost always has.'],
        union: ['margin collapse', 'two rooms touch', 'and a doorway opens where they meet', 'and the wall closes over it again'],
        war: 'Who names this room',
        zwar: 'there is no up in the Interstice, only further in',
      },
    },
    sound: {
      tonic: 50, // the mains, in the walls
      drone: { wave: 'sine', partials: [1, [2, 0.6], [3, 0.35], [4, 0.15]], level: 0.05, cutoff: 600, hall: 0.3,
        sway: [0.02, 0.15], noise: { kind: 'brown', band: 120, level: 0.012 }, label: 'the mains humming inside an empty wall' },
      bell: 'glass',
      prayer: ['glass', 783.99],
      hush: { glyph: '◌', on: 'light off', off: 'pull cord', hint: ['Switch the light off', 'Pull the light cord'] },
    },
  },
}

// Every face, in the registry's order.
export const FACE_NAMES = Object.keys(REGISTRY)
// The faces the Oracle draws by lot, and the rest (reached by an address, a rite or a secret).
export const LOT = FACE_NAMES.filter((n) => REGISTRY[n].lot)
export const HIDDEN = FACE_NAMES.filter((n) => !REGISTRY[n].lot)

export const isFace = (name) => typeof name === 'string' && Object.hasOwn(REGISTRY, name)
export const faceInfo = (name) => (isFace(name) ? REGISTRY[name] : null)

// The face that owns an address, or null when the Oracle chooses. A prefix route wins over '*'.
const HOME = new Set(['', '/index', '/index.html'])
export function routeFace(pathname = '/') {
  const path = String(pathname).replace(/\/+$/, '')
  let anywhere = null
  for (const name of FACE_NAMES) {
    const route = REGISTRY[name].route
    if (route === '*') anywhere ??= name
    else if (typeof route === 'string' && route && path.startsWith(route)) return name
  }
  return anywhere && !HOME.has(path) ? anywhere : null
}
