// POSSESSION / THE SCRIPT. What the invisible hand will write, and roughly in what order.
// Tiers keep the escalation honest (hairline -> war -> possession -> nigredo); inside each tier the
// order is drawn from the visit's rng, and so are the colour of the war and four signature curses
// out of thirteen, so no two visits curdle the same way.

const GREETINGS = [
  'you didn’t notice.',
  'I have been here since the page loaded.',
  'don’t close this. I was just getting started.',
  'hello. this is the stylesheet speaking.',
  'every page has one of me. most never open the inspector.',
]

const FAREWELLS = [
  'the page continues below the footer. so do I.',
  'go down. past the footer. I will keep typing up here.',
  'there are nine more stylesheets below this one.',
]

// Written while the Inspector is still closed; applied without anyone seeing them go in.
export function hairlines(rng) {
  return rng.shuffle([
    { sel: '.nav-links a:nth-child(3)', decls: [{ prop: 'translate', value: '0 1px' }], target: 'nav' },
    { sel: '.logo-mark', decls: [{ prop: 'rotate', value: '3deg' }], target: 'nav' },
    { sel: '.copyright::after', decls: [{ prop: 'content', value: '" All rights descended."' }], target: 'footer' },
    { sel: '.hero h1', decls: [{ prop: 'word-spacing', value: '0.05em' }], target: 'h1' },
    { sel: '.stars', decls: [{ prop: 'letter-spacing', value: '0.12em' }], target: 'quotes' },
    { sel: '.kicker-dot', decls: [{ prop: 'background', value: '#b3261e' }], target: 'hero' },
  ]).slice(0, 3)
}

// The colour the specificity war is fought in. The hand always tries a word first; the Old Law does not
// know the word, so it types a number instead. `light` is the same colour after the nigredo.
const WARS = {
  blood: { dark: '#6b0f0f', light: '#c0685d' },
  bile: { dark: '#56601a', light: '#b5c95a' },
  rust: { dark: '#7a3a12', light: '#d0843e' },
  ash: { dark: '#4d4540', light: '#a79d92' },
  ichor: { dark: '#6a5412', light: '#d8b25a' },
}

// Signature curses. Each visit draws four of these, so no two possessions end in the same page.
// Every one is a real CSS sin with a real CSS mechanism; mercy (base.css) stops the transitions.
const SIGNATURES = {
  ghost: [
    { comment: 'a ghost. it is gone, and it still takes up room.', gap: 1200 },
    { sel: '.card:nth-child(5) h3', target: 'features', decls: [{ prop: 'visibility', value: 'hidden' }] },
  ],
  promises: [
    { sel: '.plan-feats li::before', target: 'plans', decls: [{ prop: 'content', value: '"\\2717"' }, { prop: 'color', value: '#9e1b1b' }] },
    { log: ['demon', 'every feature is still listed. none of them is included.'] },
  ],
  rating: [
    { sel: '.stars', target: 'quotes', decls: [{ prop: 'clip-path', value: 'inset(0 58% 0 0)' }] },
    { log: ['warn', 'Average rating fell to 2.0 out of 5. No review was edited.'] },
  ],
  heaven: [
    { sel: '.kicker::after', target: 'hero', decls: [{ prop: 'content', value: '"Trusted by 2,147,483,647 teams worldwide"' }, { prop: 'font-size', value: '.85rem' }] },
    { sel: '.kicker', target: 'hero', decls: [{ prop: 'font-size', value: '0' }] },
    { log: ['demon', 'every team that ever was. they are all on the highest rung now.'] },
  ],
  tilt: [
    { comment: 'the page is not level. it never was.', gap: 900 },
    { sel: '.corp-main', target: 'corp', decls: [{ prop: 'rotate', value: '-0.35deg' }] },
  ],
  shout: [
    { comment: 'louder.', gap: 700 },
    { sel: 'h2', target: 'corp', decls: [{ prop: 'text-transform', value: 'uppercase' }, { prop: 'letter-spacing', value: '.02em' }] },
  ],
  backwards: [
    { sel: '.features', target: 'features', decls: [{ prop: 'direction', value: 'rtl' }] },
    { log: ['demon', 'the grid runs the other way now. read it from the end.'] },
  ],
  loading: [
    { sel: '.corp', target: 'corp', decls: [{ prop: 'cursor', value: 'progress' }] },
    { comment: 'it is still loading. it will always be loading.' },
  ],
  scrollbar: [
    { sel: 'html', real: 'html[data-face="possession"]', target: 'corp', decls: [{ prop: 'scrollbar-color', value: '#7a1010 #120c0b' }] },
    { comment: 'even the scrollbar is mine.' },
  ],
  price: [
    { sel: '.plan--starter .per::after', target: 'plans', decls: [{ prop: 'content', value: '", paid in stillness"' }] },
  ],
  forever: [
    { sel: '.careers h2::after', target: 'careers', decls: [{ prop: 'content', value: '" Forever."' }] },
    { log: ['demon', 'nobody here has ever wanted to leave. nobody here has ever left.'] },
  ],
  sinking: [
    { sel: '.nav-links', target: 'nav', decls: [{ prop: 'rotate', value: '1.1deg' }, { prop: 'transform-origin', value: '0 50%' }] },
    { comment: 'the menu is sinking.' },
  ],
  fog: [
    { sel: '.footer-col a:not(:hover, :focus-visible)', target: 'footer', decls: [{ prop: 'color', value: 'transparent' }, { prop: 'text-shadow', value: '0 0 5px var(--ink)' }] },
    { comment: 'the fine print was never meant to be read. touch it and it clears.' },
  ],
}

// Which curses and which colour this visit draws. Exported so the face can name them (e.g. in the console).
export function fate(rng) {
  const war = rng.weighted({ blood: 4, bile: 1, rust: 1, ash: 1, ichor: 1 })
  const signs = rng.shuffle(Object.keys(SIGNATURES)).slice(0, 4)
  return { war, colour: WARS[war], signs }
}

export function buildScript(rng, ctx, chosen = fate(rng)) {
  const acts = []
  const push = (...a) => acts.push(...a)
  const night = ctx.sky.has('witching') || ctx.sky.has('midnight') || ctx.sky.has('night')
  const { war, colour } = chosen
  const signs = chosen.signs.map((k) => SIGNATURES[k])

  // A — the opening, and the specificity war over one paragraph.
  push({ comment: rng.pick(GREETINGS), gap: 1800 })
  push({ log: ['warn', '[Violation] ‘load’ handler took 666ms'] , gap: 900 })
  push({ sel: 'p', target: 'aboutP', decls: [{ prop: 'color', value: war, invalid: 'Invalid property value', fix: colour.dark, group: 'about-color' }], gap: 1800 })
  push({ log: ['demon', 'overridden by .about p. one class. it thinks one class makes it holy.'], gap: 1400 })
  push({ sel: '#about p', target: 'aboutP', decls: [{ prop: 'color', value: colour.dark, group: 'about-color' }] })
  push({ log: ['info', 'Grace (1,0,1) outweighs (0,1,1). An Id is heavier than any number of Classes.'] })

  // B — the war spreads. The two hands of the z-index war join here.
  const B = rng.shuffle([
    { sel: '.hero h1', target: 'h1', decls: [{ prop: 'letter-spacing', value: '0.06em' }] },
    { sel: '.cta--primary::after', target: 'cta', decls: [{ prop: 'content', value: '" — it already has"' }] },
    { sel: ':root', real: '#temple.face--possession', target: 'corp', decls: [{ prop: '--brand', value: '#7a1010' }] },
    { sel: '.card:nth-child(odd)', target: 'features', decls: [{ prop: 'rotate', value: '-0.8deg' }] },
    { sel: '.card:nth-child(even)', target: 'features', decls: [{ prop: 'rotate', value: '0.6deg' }, { prop: 'translate', value: '0 7px' }] },
    { sel: '.features', target: 'features', decls: [{ prop: 'gap', value: '2px' }, { prop: 'background', value: '#3d0606' }], effect: 'bleed' },
    { sel: 'h1 .w, .lede .w', target: 'h1', decls: [{ prop: 'order', value: 'var(--o)' }], effect: 'reorder' },
    { sel: '.stock', target: 'poster', decls: [{ prop: 'filter', value: 'saturate(0.55) sepia(0.2) hue-rotate(-14deg)' }], effect: 'eyes:1' },
  ])
  const warAt = rng.int(1, 3)
  B.splice(warAt, 0, { effect: 'zwar', gap: 3200 })
  // The consent banner is dealt with early; nobody should have to read it for long.
  B.splice(rng.int(0, 2), 0, { effect: 'cookies', gap: 600 })
  // The first signature curse surfaces while the war is still spreading.
  B.splice(rng.int(4, B.length), 0, ...signs[0])
  push(...B)
  push({ log: ['error', 'Uncaught (in promise) DOMException: the element refused to stay in its container.', 'possessed.css:404'] })

  // C — possession proper: the text rearranges, the glyphs creep in, the veil tears.
  const C = rng.shuffle([
    { sel: '.logos', target: 'logos', decls: [{ prop: 'filter', value: 'grayscale(1) contrast(1.4)' }], effect: 'sigils' },
    { sel: '.hero-art', target: 'film', decls: [{ prop: 'translate', value: '1.4rem 2.4rem' }] },
    { sel: '.rot', target: 'aboutP', decls: [{ prop: 'font-family', value: '"Cascade Glyphs", serif' }], effect: 'rot' },
    { sel: '.corp', target: 'corp', decls: [{ prop: '--paper', value: '#efe8d6' }, { prop: '--paper-2', value: '#e6dcc4' }] },
    { sel: '::selection', target: 'corp', decls: [{ prop: 'background', value: '#7a1010' }, { prop: 'color', value: '#d7f5a0' }] },
    { sel: '.quote blockquote p::before', target: 'quotes', decls: [{ prop: 'content', value: '"They asked us to say: "' }] },
    { sel: '.stat b::after', target: 'stats', decls: [{ prop: 'content', value: '"?"' }], effect: 'status:1' },
    { sel: '.careers .veil', target: 'veil', decls: [{ prop: 'overflow', value: 'torn', invalid: 'Invalid property value' }], effect: 'tear' },
    { effect: 'eyes:2', gap: 1500 },
    { effect: 'film', gap: 1500 },
  ])
  // Two more signatures ride in the middle of the possession, each kept whole (their acts stay in order):
  // groups are inserted as single items and flattened afterwards, so one never lands inside another.
  const Cg = C.map((a) => [a])
  Cg.splice(rng.int(1, Cg.length), 0, signs[1])
  Cg.splice(rng.int(1, Cg.length), 0, signs[2])
  push({ comment: rng.pick(['citrinitas.', 'now the yellowing.', 'the page is ripening.']), gap: 1500 })
  push(...Cg.flat())

  // D — nigredo: the page goes dark, the fourth one comes to the window, the hand points down.
  push({ comment: rng.pick(['nigredo.', 'now the blackening.', 'the Great Work, reversed.']), gap: 1500 })
  const D = rng.shuffle([
    { sel: '*', target: 'corp', decls: [{ prop: 'outline', value: '1px solid #8a03032e' }] },
    { sel: 'h2::first-letter', target: 'corp', decls: [{ prop: 'color', value: '#9e1b1b' }] },
    { sel: '.nav', target: 'nav', decls: [{ prop: '--paper', value: '#140e0d' }, { prop: '--ink', value: '#cbbfae' }, { prop: '--line', value: '#3a2522' }] },
    { sel: '.fineprint', target: 'footer', decls: [{ prop: 'color', value: '#d7f5a0' }], effect: 'hint' },
    { effect: 'figure4', gap: 2000 },
    { effect: 'title', gap: 800 },
    { effect: 'sick', gap: 800 },
  ])
  const Dg = D.map((a) => [a])
  Dg.splice(rng.int(0, Dg.length), 0, signs[3])
  push(...Dg.flat())
  push({ sel: '.corp', target: 'corp', effect: 'nigredo', decls: [
    { prop: '--paper', value: '#120c0b' }, { prop: '--paper-2', value: '#1b1311' }, { prop: '--card', value: '#1a1210' },
    { prop: '--ink', value: '#d4c8b4' }, { prop: '--ink-soft', value: '#9c8f7c' }, { prop: '--line', value: '#3a2522' },
  ] })
  push({ edit: ['#about p', 'color', colour.light], gap: 1200 })
  push({ effect: 'status:2', gap: 1200 })
  push({ effect: 'eyes:3', gap: 1500 })
  push({ sel: '.hero h1::after', target: 'h1', decls: [{ prop: 'content', value: '" Welcome to our website."' }] })
  if (night) push({ comment: 'it is night where you are. I am faster at night.', gap: 1200 })
  push({ comment: rng.pick(FAREWELLS), effect: 'hint' })
  return acts
}
