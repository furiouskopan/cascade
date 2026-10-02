// THE WORDS OF THE LAUNDERETTE. Everything the room says, in one place. Deadpan, 3:33 AM, a little sad.
// "Baptism" stays about CSS here (lexicon: reset = Baptism): five washes, one property, no priests.

// The five machines, left to right. Each applies `all: <kw>` to whatever is in its drum, for real.
export const WASHES = [
  {
    kw: 'initial', label: 'INITIAL', wash: 'the First Wash', short: 'before even the Old Law',
    doctrine: 'Every property goes back to its initial value, the one in the specification, written before any stylesheet spoke. Not even the browser\'s own clothes survive: a div comes out display: inline. "Block" was never its nature, only the Old Law\'s gift.',
  },
  {
    kw: 'inherit', label: 'INHERIT', wash: 'the Wash of Karma', short: 'everything from its parent',
    doctrine: 'Every property is taken from the parent, even the ones that are never inherited. It comes out dressed exactly like whatever held it in the drum, which here is a plain, sensible lining.',
  },
  {
    kw: 'unset', label: 'UNSET', wash: 'the Wash of Discernment', short: 'inherited ones inherit, the rest go initial',
    doctrine: 'Each property is judged by its nature. What is inherited (colour, lettering) is taken from the parent; everything else goes back to its initial value, so a div still comes out inline.',
  },
  {
    kw: 'revert', label: 'REVERT', wash: 'the Wash of Return', short: 'back to the Old Law\'s clothes',
    doctrine: 'Every author\'s word is rolled back to the browser\'s own stylesheet, the Old Law. A div is a block again, a button is a grey button again, and a <font> forgets its attributes, because they were the author\'s words too.',
  },
  {
    kw: 'revert-layer', label: 'REVERT-LAYER', wash: 'the Wash of the Previous Heaven', short: 'back one cascade layer', plastic: true,
    doctrine: 'Rolled back to the previous Heaven (cascade layer). Spoken in a style attribute it washes off only what was written on the garment itself; whatever it wore from the layers, it keeps. Most garments come out exactly as they went in.',
  },
]

// What the drum takes off, in order, as it turns. Each group is set to the keyword before the whole
// immersion (`all`) finishes the job, so the styles really do dissolve one by one through the glass.
export const GROUPS = [
  { says: 'the dye runs', props: ['background-color', 'background-image'] },
  { says: 'the seams let go', props: ['border', 'border-radius', 'box-shadow'] },
  { says: 'the colour bleeds', props: ['color', 'text-shadow', 'text-decoration'] },
  { says: 'the lettering fades', props: ['font', 'letter-spacing', 'text-transform'] },
  { says: 'it shrinks to fit', props: ['padding', 'margin', 'width', 'height'] },
  { says: 'it loses its shape', props: ['position', 'inset', 'float', 'transform', 'rotate', 'display'] },
]

// The care label: before and after, for these properties (about a dozen, as care labels go).
export const LABEL_PROPS = [
  ['display', 'display'],
  ['position', 'position'],
  ['top', 'top'],
  ['float', 'float'],
  ['width', 'width'],
  ['color', 'colour'],
  ['background', 'background'],
  ['font-family', 'lettering'],
  ['font-size', 'size'],
  ['font-weight', 'weight'],
  ['border', 'border'],
  ['padding', 'padding'],
  ['animation-name', 'animation'],
  ['direction', 'direction'],
]

// The garments. Three are always in the basket, one more is drawn by lot, the stained tee is always there,
// and one garment came from the last face the visitor saw.
export const GARMENTS = {
  best: {
    tag: 'button', name: 'Sunday Best', heresy: 'Idolatry, and a magic number',
    what: 'a button in inline styles, pushed 37px down by a magic number',
    text: 'SUBMIT',
    inline: 'position: relative; top: 37px; background: #ff3fb4; color: #c8ff3c; font: 700 16px/1 "Comic Sans MS", "Chalkboard SE", cursive; border: 4px outset #ffd23f; padding: 6px 14px; text-shadow: 2px 2px 0 #2b2bff; box-shadow: 4px 4px 0 #161616; letter-spacing: 0.06em; border-radius: 0',
  },
  wander: {
    tag: 'div', name: 'the Wanderer', heresy: 'the Wandering (a float)',
    what: 'a div floated left in 1998, never cleared',
    text: 'float: left',
  },
  tongue: {
    tag: 'font', name: 'the Old Tongue', heresy: 'the Dead Tongue',
    what: 'a real <font>; its style is spoken in attributes',
    text: 'Welcome!',
    attrs: { color: '#b0127a', face: 'Comic Sans MS, Chalkboard SE, cursive', size: '5' },
  },
  blink: {
    tag: 'blink', name: 'the False Prophet', heresy: 'the False Prophet',
    what: 'a <blink> that cannot hold still to be known',
    text: 'NEW!!',
  },
  proud: {
    tag: 'span', name: 'the Proud One', heresy: 'the Pride of Ids',
    what: 'a span styled through three ids: all grace, no humility',
    text: 'V.I.P.', id: 'lnd-pride',
  },
  covenant: {
    tag: 'table', name: 'the Old Covenant', heresy: 'tables for layout',
    what: 'a table holding up a layout, as the law of 1996 required',
    attrs: { border: '2', cellpadding: '4', bgcolor: '#c4c0b8' },
    cells: ['nav', 'body'],
  },
  tee: {
    tag: 'span', name: 'one white tee', short: 'the white tee', heresy: 'the Inversion',
    what: 'a white tee with a stain that trembles',
    text: 'MY OTHER SHIRT IS display: none',
  },
}

// An element brought in from the last face the visitor saw (memory lastFace). Rebuilt here in that face's
// manner, because only one face's stylesheet is ever loaded.
export const VISITORS = {
  sanctum: { tag: 'span', text: 'Q', short: 'the drop cap', name: 'a drop cap from the Codex', what: 'vermilion and gold leaf; it smells of gall ink' },
  possession: { tag: 'p', text: 'Welcome to our website.', short: 'the paragraph', name: 'a paragraph from CSS Hell', what: 'blood-red, with a green glow it will not explain' },
  recruitment: { tag: 'a', text: 'CLICK HERE!!', short: 'the link', name: 'a link from the 1997 homepage', what: 'blue, underlined, yellow behind; it has no href and never had one' },
  ashram: { tag: 'span', text: 'ॐ', short: 'the seed syllable', name: 'a seed syllable from the Ashram', what: 'saffron and glowing; it hums when wet' },
  departure: { tag: 'code', text: 'ZCZC QSL', short: 'the teletype', name: 'a line of teletype from the Mothership', what: 'phosphor green on black, capitals only' },
  babel: { tag: 'cite', text: 'Selectors 3:16', short: 'the reference', name: 'a verse reference from the Library', what: 'sepia and small capitals; the Old Law gave it its italics' },
  omens: { tag: 'span', text: 'šumma', short: 'the omen', name: 'an omen pressed in clay', what: 'terracotta, under raking light' },
  interstice: { tag: 'div', text: '', short: 'the empty div', name: 'an empty div from the Interstice', what: 'nothing inside it but its own box, tinted like the Inspector' },
  launderette: { tag: 'span', text: 'odd sock', short: 'the odd sock', name: 'something you left in a dryer last time', what: 'nobody else claimed it' },
  nowhere: { tag: 'div', text: 'nameless', short: 'the nameless div', name: 'a nameless div from the lost property box', what: 'no class, no id, no face it came from' },
}

// Curated fragments of the other faces' styles, tumbling in the dryers. A face not yet seen tumbles as
// a blank white sheet.
export const DRYER_SHEETS = {
  sanctum: ['.drop-cap {', '  color: vermilion;', '  font-variant: small-caps;', '}'],
  possession: ['p {', '  color: blood !important;', '}'],
  recruitment: ['body {', '  font-family: "Comic Sans MS";', '  color: #ffff00;', '}'],
  ashram: ['.yantra {', '  animation: breathe 14s;', '}'],
  departure: ['.ship {', '  z-index: 2147483647;', '}'],
  babel: ['.verse::first-letter {', '  initial-letter: 3;', '}'],
  omens: ['@media (orientation: portrait) {', '  .tablet { rotate: 90deg; }', '}'],
  interstice: ['div:empty {', '  margin: 33px;', '}'],
}

// The house's own flyers, pinned beside the strangers' (the live Wall).
export const HOUSE_FLYERS = [
  { title: 'NOTICE', body: 'The machines wash what was written on a garment. They cannot wash what was declared above it.', sign: 'the Management, 1996' },
  { title: 'PLEASE', body: 'No centring of divs on the folding table. It is for folding.', sign: 'the Management' },
  { title: 'NO DYEING', body: 'in the machines. Bring your own colour and take it home with you.', sign: '' },
  { title: 'LAST WASH 3:33', body: 'It is always 3:33. You are not late.', sign: '' },
  { title: 'FOUND', body: 'One ::before, no element attached. Ask at the counter.', sign: '' },
  { title: 'WANTED', body: 'Someone to fold fitted sheets. Will pay in tokens.', sign: 'ask for Saint Margin' },
]
export const SKY_FLYERS = {
  'full-moon': { title: 'FULL MOON', body: 'Hot wash half price tonight. The moon will not notice.', sign: '' },
  'new-moon': { title: 'NEW MOON', body: 'Dark outside. The window is only a mirror tonight. Please do not wave at it.', sign: '' },
  'friday-13': { title: 'FRIDAY 13', body: 'Machine 13 is closed. We do not have a machine 13.', sign: '' },
  eclipse: { title: 'ECLIPSE', body: 'The sun is covered today. Tumble dry on low.', sign: '' },
  witching: { title: '3 A.M.', body: 'For once the clock is right. Enjoy it while it lasts.', sign: '' },
}

export const SOCK = {
  title: 'LOST',
  body: 'ONE SOCK (float: left).',
  plea: 'IF FOUND PLEASE CLEAR.',
  found: 'FOUND · CLEARED · thank you',
  tabs: ['the/lost/sock', 'float/left', 'please/clear'],
}

// What the machine at the back holds when its door unlatches for one breath (108 s of stillness).
export const ENDLESS = [
  'the other sock. Its tag says float: right.',
  'a till receipt from 17 December 1996, for one stylesheet, paid in full.',
  'a div with nothing in it, still warm from the drum.',
  'a single ::after, folded small and still damp.',
  'thirty-three pixels of lint, perfectly square.',
  'a note in the attendant\'s hand. It says: back soon.',
  'a button with no label. It has been pressed many times.',
]

// The free sheet left on a chair.
export const HEADLINES = [
  'LOCAL DIV STILL INLINE AFTER WASH',
  'MACHINE AT THE BACK "NEARLY DONE", SAYS MACHINE',
  'ATTENDANT EXPECTED BACK SOON',
  'TUBE DIMS; NOBODY MENTIONS IT',
  'FIVE WASHES, ONE PROPERTY: A READER WRITES',
  'SOCK SEEN FLOATING LEFT OF THE NEWS',
]

// The house tells newcomers what this is, sideways.
export const HOW_TO = [
  'Pick a garment from the basket.',
  'Load it into a machine (drag it, or pick it and press the machine\'s button).',
  'Press START. The machine applies all: <keyword> to it, for real.',
  'Read the care label. One garment has a stain no machine will lift.',
]

// The riddle (docs/ROADMAP.md §4.1): three public hints, a nudge, a clue and a near-answer. They never
// say a Word. The same three are proposed for lib/hints.js (RIDDLES.launderette).
export const RIDDLE = {
  title: 'The Trembling Stain',
  where: 'the All-Night Launderette: one garment in the basket trembles',
  secret: 'launderette-riddle',
  hints: [
    'Wash the stained tee in every machine and read its care labels. Nearly everything about it changes, except one line. What sort of thing is that stain?',
    'The stain is an animation declared with !important. A wash is an ordinary declaration (all: …), and an ordinary declaration never beats an important one, wherever it is written. You need something that is important too, and outranks it.',
    'Every page of the temple has a small button in the bottom-left corner that stops all motion. Its own !important is declared in the first cascade layer, and among important declarations the first layer wins. Press it while the stain is trembling.',
  ],
}

// What the attendant left on the counter, one note a ring (the in-page hint ladder).
export const ATTENDANT = {
  sign: 'ATTENDANT BACK SOON',
  date: '17 · XII · 96',
  bell: 'Ring for the attendant',
  empty: 'Nobody comes. A note has been left on the counter instead:',
  more: 'Ring again for a stronger note.',
  last: 'That was the last note on the pad.',
}

// The reward: a certificate, folded and pressed, from the machine that never finishes (until now).
export const CERTIFICATE = {
  kicker: 'Issued at 3:33 a.m., the only hour we keep',
  title: 'Certificate of Cleanliness',
  item: 'One white tee. Stain: animation: lnd-stain, declared !important in the face\'s own Heaven.',
  lines: [
    'Why no machine could lift it: a wash is all: <keyword>, an ordinary declaration, and an ordinary declaration never beats an important one, not even from the garment\'s own style attribute.',
    'Why the button in the corner could: it is important too, and it is declared in the first Heaven (@layer reset). Among important declarations the order of the Heavens turns over, and the first Heaven wins. It governs exactly the animation properties: it gave the trembling a thousandth of a millisecond and one iteration.',
    'A stain that is only a trembling is gone the moment it stops. One Inversion, undone by an earlier one.',
  ],
  sign: 'Folded and pressed. Thank you for your custom.',
  again: 'Lifted again. The house remembers the first time.',
  byHand: 'Lifted by a hand that edits the Word itself. The house accepts it, with raised eyebrows.',
}

// The machines' little speeches (announced politely, shown on the drum's ticker).
export const SAYS = {
  pick: (g) => `You pick up ${g}.`,
  drop: (g) => `You put ${g} back in the basket.`,
  load: (g, m) => `${g} goes into ${m}.`,
  start: (m) => `${m}: the door locks and the drum begins to turn.`,
  done: (g, m) => `${m} has finished. ${g} has a new care label.`,
  out: (g) => `You take ${g} out of the machine.`,
  busy: 'That machine is busy.',
  empty: 'Pick a garment from the basket first.',
  self: 'A washer has started by itself. There is nothing in it. It washes nothing, carefully.',
  breath: 'The machine at the back unlatches its door, for one breath.',
  shut: 'The door at the back closes again. It is still nearly done.',
  stain: 'The stain is still there. It trembles.',
  lifted: 'The stain is out.',
  coin: 'A coin drops. Somewhere a motor wakes.',
  sock: 'You clear the sock. The paragraph it was floating beside comes down beneath it, absolved.',
  lint: 'You sweep the lint away.',
}

// Restless visitors make the machines walk further (the face's own small hell).
export const RESTLESS = 'The machines walk a little further on the tiles.'
