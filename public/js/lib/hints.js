// THE HINTS. Every step of the rabbit hole has three hints, each one stronger: a nudge, a clue, and a
// near-answer (docs/ROADMAP.md §2: hints are public). They are plain text on purpose, and they never say
// a Word: the Words are still found in the temple, known to the Oracle only by their seals, and to the
// door only as the server's digests.
//
// The secrets layer asks hintFor(progress, tier) for the step a visitor is on (cascade.hint() in the
// console, and the altar's "ask for a hint"). docs/HINTS.md is written from this file:
//   node tools/build-hints.mjs            rewrite docs/HINTS.md
//   node tools/build-hints.mjs --check    exit 1 if docs/HINTS.md is out of date

export const CHAINS = [
  {
    id: 'ascent',
    title: 'The Ascent',
    blurb: 'Five Words lead to a door at the top of the Ladder. Solving it writes your name in the Book of the Ascended. With these hints it takes about half an hour to an hour, in one sitting.',
    steps: [
      {
        id: 'word-1',
        title: 'The first Word',
        hints: [
          'Most visitors only look at the page. The first Word is for those who read what the page is made of.',
          'View the page source (Ctrl+U, or Cmd+Option+U). The comment at the very top says which stylesheet holds the Canon.',
          'Open /css/canon.css. Chapter 0 has seven verses: read the first letter of each, in order. You can say the Word to the Oracle in the developer console (F12): cascade.speak(\'…\').',
        ],
      },
      {
        id: 'word-2',
        title: 'The second Word',
        hints: [
          'The second Word is written on the Ladder. The Ladder is on every face, but the eye was never meant to see it.',
          'Open the developer tools and find the element #ladder inside the temple (search the Elements panel). It has five rungs; look at each rung\'s z-index in the Computed tab.',
          'The five z-index values are small numbers. Count them as children count letters: 1 is A, 2 is B, 3 is C.',
        ],
      },
      {
        id: 'word-3',
        title: 'The third Word',
        hints: [
          'Every face carries the same line of glyphs, the Inscription. The third Word is described in it.',
          'Each face teaches a few letters of the glyph script, and one chapter of the Infinite Scripture teaches all of them: /verse/of/the/alphabet.',
          'Decode the Inscription letter by letter. It names the Word by a riddle about the Five Sheaths, which are the five parts of the CSS box model. Which one is drawn but takes up no space?',
        ],
      },
      {
        id: 'word-4',
        title: 'The fourth Word',
        hints: [
          'The fourth Word is not written anywhere. It is heard, though it is not meant for your ears.',
          'Wake the sound on any face (a bell, a bowl, a hymn button), then ask the Mothership to transmit: type cascade.listen() in the console, or wait a minute on the Mothership\'s face.',
          'Type ajna anywhere on the page (not in a text field) to open the Third Eye, a live picture of the sound. Watch it while the Transmission plays: its high notes draw block letters.',
        ],
      },
      {
        id: 'door',
        title: 'The door',
        hints: [
          'There is a door. The robots were told not to go there.',
          'Read /robots.txt. The door is at the top of the Ladder, and it is always open. Bring the four Words and a fifth.',
          'The fifth Word is the planet that rules the current hour; the door\'s keystone shows its sign (♄ ♃ ♂ ☉ ♀ ☿ ☽). Type the planet\'s name. Knock at the thirty-third minute of the hour and your name is written in gold.',
        ],
      },
      {
        id: 'after',
        title: 'After the Book',
        hints: [
          'Your name is in the Book. The temple keeps small secrets on its surface too: try selecting everything on a page, printing it, holding perfectly still, or typing !important.',
          'In the console, cascade.inspect() counts the small secrets you have not found yet, and cascade.sky() reads the omens of the hour.',
          'Every face hides a few secrets of its own. Ask the altar for another face and look again.',
        ],
      },
    ],
  },
]

// Each face may keep a riddle of its own (docs/ROADMAP.md §4), solved on that face in one sitting. Solving it
// marks its secret, and from then on the face's hints give way to the chain's.
export const RIDDLES = {
  launderette: {
    title: 'The Trembling Stain',
    where: 'The All-Night Launderette: one garment in the basket trembles.',
    secret: 'launderette-riddle',
    hints: [
      'Wash the stained tee in every machine and read its care labels. Nearly everything about it changes, except one line. What sort of thing is that stain?',
      'The stain is an animation declared with !important. A wash is an ordinary declaration (all: …), and an ordinary declaration never beats an important one, wherever it is written. You need something that is important too, and outranks it.',
      'Every page of the temple has a small button in the bottom-left corner that stops all motion. Its own !important is declared in the first cascade layer, and among important declarations the first layer wins. Press it while the stain is trembling.',
    ],
  },
  omens: {
    title: 'The liver of clay',
    where: 'Šumma, the Omen Tablets: one omen on the great tablet is broken off.',
    secret: 'omens-riddle',
    hints: [
      'One line near the top of the great tablet is broken off after "If the Pilgrim stands like a re…". The editor says it is restored only for a Pilgrim who stands like a reed. A reed is tall and thin: make your window at least twice as tall as it is wide (a phone held upright usually is), then read that line again.',
      'The restored line tells you to read the liver "in the Book, and not in the flesh". The flesh is the clay liver you can see on the page. The Book is this face\'s stylesheet: open /css/faces/omens.css (view the page source, or type that address) and find the part called THE LIVER, AS THE BOOK DRAWS IT.',
      'There, the liver\'s grid-template-areas are drawn as four big block letters: the names z1 to zg are the strokes and the dots are bare clay. Step back from the text, read the word, and type it into "What does the liver say?" under the liver (or just type it anywhere on the page).',
    ],
  },
  interstice: {
    title: 'The room that is not :empty',
    where: 'The Interstice: any address the temple does not know, such as /nowhere (or the Stairwell, /404).',
    secret: 'interstice-riddle',
    hints: [
      'Every room in the Interstice is empty except one, and that one is only a few rooms from the room you came in by (the plan of the floor marks that room with a small blue triangle). Not every way through looks like a doorway.',
      'Read the room descriptions: some doorways let "a little warmth" through, and they lead toward it. Further on, one wall with no door shows a thin line of warm light along its foot. That wall only looks solid. Move your pointer over it until the pointer turns into a hand, or press Tab until you reach "a wall that is not quite there".',
      'From the room you came in by, go through the doorways with warmth coming through them (one or two rooms). In the room with the warm line under a wall, click that wall where the pointer becomes a hand, or Tab to it and press Enter (a side wall also gives way if you press the arrow key toward it twice). In the room behind it the slot in the far wall is open: click the letter in it, press Enter on it, or type take.',
    ],
  },
}

export const riddleFor = (face) => (Object.hasOwn(RIDDLES, face) ? RIDDLES[face] : null)

export function riddleHint(face, tier = 0) {
  const r = riddleFor(face)
  if (!r) return null
  const i = Math.max(0, Math.min(r.hints.length - 1, Math.floor(Number(tier) || 0)))
  return { chain: r.title, step: `riddle:${face}`, title: r.title, tier: i, of: r.hints.length, text: r.hints[i] }
}

const ASCENT = CHAINS[0]

// progress: { spoken: [n, ...] (the Words 1-4 this visitor has spoken), ascended: boolean }
// Words may be found out of order; the step is the first one still missing.
export function stepFor({ spoken = [], ascended = false } = {}) {
  if (ascended) return ASCENT.steps.find((s) => s.id === 'after')
  for (let n = 1; n <= 4; n++) if (!spoken.includes(n)) return ASCENT.steps[n - 1]
  return ASCENT.steps.find((s) => s.id === 'door')
}

// tier is 0, 1 or 2 (beyond 2 the strongest hint is repeated).
export function hintFor(progress, tier = 0) {
  const step = stepFor(progress)
  const i = Math.max(0, Math.min(step.hints.length - 1, Math.floor(Number(tier) || 0)))
  return { chain: ASCENT.title, step: step.id, title: step.title, tier: i, of: step.hints.length, text: step.hints[i] }
}
