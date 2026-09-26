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
