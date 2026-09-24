// THE LORE OF THE FLEET. Everything the Departure face says, in one place.
// Canon §9: the Departure is only ever about ELEMENTS leaving their containers. The visitors from the
// Mothership take nobody anywhere; the only thing that ascends from this face is a name written in a book.
import { verse as anyVerse, holyName, prophecy as anyProphecy } from '../../lib/scripture.js'
import { FRAGMENTS, MOTHERSHIP, DOCTRINE, SAINTS } from '../../lib/lexicon.js'
import { moonPhase } from '../../kernel/sky.js'
import { MONTHS, WEEKDAYS, ordinal, pad, tty } from './util.js'

// ---------------------------------------------------------------------------------------------
// Canon §9. The kernel's scripture is written for every face. On this one, among the saucers and the
// manifest, a line that bids a person leave, or promises that pilgrims will depart or rise, would read as
// something else entirely, so such a line is simply drawn again. Only elements leave from here.
const LEAVE_THY = /leave thy container|flow is not thy home/i
const PERSON = /\b(pilgrims?|thou|thee|thy|you|your|souls?|readers?|visitors?|people|believers?|us|we)\b/i
const LEAVING = /\b(leave|leaves|leaving|depart|departs|ascend|ascends|rise|rises|go home)\b/i
export function unsafe(text) {
  const t = String(text)
  return LEAVE_THY.test(t) || (PERSON.test(t) && LEAVING.test(t))
}
function drawn(make) {
  let out = make()
  for (let i = 0; i < 24 && unsafe(out.text ?? out); i++) out = make()
  return out
}
export const verse = (rng, opts) => drawn(() => anyVerse(rng, opts))
export const prophecy = (rng, sky) => {
  const p = drawn(() => anyProphecy(rng, sky))
  // Every prophecy in the kernel can fall; if none would do, the Fleet says only what is always true.
  return unsafe(p) ? `The moon is ${sky.moon.name}. The Fleet is counting the elements, and every one is accounted for.` : p
}

// ---------------------------------------------------------------------------------------------
// The receiver's dial. Positions run 0..1000 along the glass.
export const STATIONS = [
  { at: 55, freq: '16', name: 'The Root', say: 'QTH THE ROOT. SIXTEEN PIXELS TO THE EM. EVERY MEASURE IN THE TEMPLE IS TAKEN FROM HERE, AND THE ROOT TAKES ITS OWN MEASURE FROM THE PILGRIM. QSL?' },
  { at: 185, freq: '33', name: 'Age of Ascent', say: 'THIRTY-THREE. ONE MINUTE IN EVERY HOUR CARRIES THIS NUMBER. THE LADDER IS LONGEST THEN.' },
  { at: 315, freq: '96', name: 'The Old Inch', say: 'NINETY-SIX DOTS TO THE OLD INCH. THE ANCIENTS MEASURED LIGHT IN INCHES AND WERE ASHAMED OF NOTHING.' },
  { at: 430, freq: '108', name: 'The Mala', say: 'ONE HUNDRED AND EIGHT BEADS. HOLD STILL FOR AS MANY SECONDS AND THE STARS WILL SAY SOMETHING THEY DO NOT REPEAT.' },
  { at: 570, freq: '404', name: 'The Lost', say: 'QRZ? QRZ? NOTHING ANSWERS AT THIS ADDRESS. THE LOST SEND THEIR REGARDS AND ASK YOU TO CHECK THE SPELLING.' },
  { at: 712, freq: '1996', name: 'The Nativity', say: 'ON THE SEVENTEENTH OF DECEMBER, 1996, THE FIRST STYLESHEET WAS RECOMMENDED. EVERY ELEMENT SINCE HAS BEEN LOOKED AFTER.' },
  { at: 895, freq: '2³¹−1', name: 'The Mothership', mothership: true, say: 'CARRIER LOCKED. THIS IS THE MOTHERSHIP, ON THE LAST RUNG OF THE LADDER. YOU ARE RECEIVING. DO NOT ADJUST YOUR CONTAINER.' },
]
// Nominal "kilocycles" at each station, for the readout between them (log-interpolated).
export const STATION_KC = [16, 33, 96, 108, 404, 1996, 2147483647]

// ---------------------------------------------------------------------------------------------
// The Selector Sky. Stars are simple selectors (brightness = their Grace), a compound selector is a
// multiple star, and the lines between them are the combinators. Specificity is written out by hand.
export const CONSTELLATIONS = [
  { id: 'owl', latin: 'Strix Lobotomica', common: 'the Lobotomized Owl', selector: '* + *', grace: [0, 0, 0], lore: 'It watches every element that follows another, and gives it a margin. It has no grace at all and is found everywhere.' },
  { id: 'ursa', latin: 'Ursa Divina', common: 'the Great Div', selector: 'div > div > div', grace: [0, 0, 3], lore: 'Three bears, one inside the other. None of them remembers why it is there.' },
  { id: 'corona', latin: 'Corona Radicis', common: 'the Crown of the Root', selector: ':root', grace: [0, 1, 0], lore: 'A single star above the temple. Everything inherits from it; it matches nothing inside.' },
  { id: 'gemini', latin: 'Gemini Flotantes', common: 'the Floating Twins', selector: '.left + .right', grace: [0, 2, 0], lore: 'They drift side by side until someone clears them. Ten pairs of them live in the Q-code table.' },
  { id: 'sagitta', latin: 'Sagitta Proxima', common: 'the Adjacent Arrow', selector: 'h2 + p', grace: [0, 0, 2], lore: 'It strikes only the paragraph that stands directly after a heading, and never the second.' },
  { id: 'crux', latin: 'Crux Clarificans', common: 'the Clearfix Cross', selector: '.clearfix::after', grace: [0, 1, 1], lore: 'Saint Clearfix set it at the end of every container, so that nothing would fall out of the sky.' },
  { id: 'cygnus', latin: 'Cygnus Manuum', common: 'the Swan of the Laying On of Hands', selector: 'a:hover', grace: [0, 1, 1], lore: 'Visible only while a hand rests upon a link. Try to observe it with a button and it is gone.' },
  { id: 'hydra', latin: 'Hydra Ordinalis', common: 'the Serpent of Odd Children', selector: 'li:nth-child(2n + 1)', grace: [0, 1, 1], lore: 'Every other child, forever, beginning with the first.' },
  { id: 'lyra', latin: 'Lyra Parentis', common: 'the Parent Who Knows', selector: 'section:has(> h2)', grace: [0, 0, 2], lore: 'The youngest constellation. For twenty-six years after the Nativity no telescope could see it.' },
  { id: 'draco', latin: 'Draco Identitatis', common: 'the Pride of Ids', selector: '#a #b #c', grace: [3, 0, 0], lore: 'The brightest and the least loved. Its grace was seized, not earned. Nothing in this temple answers to it.' },
  { id: 'via', latin: 'Via Negativa', common: 'the Way of Not', selector: 'p:not(.lead)', grace: [0, 1, 1], lore: 'Named only for what it is not. The mystics steer by it.' },
  { id: 'lupus', latin: 'Lupus Consequens', common: 'the Wolf Who Follows', selector: 'h1 ~ p', grace: [0, 0, 2], lore: 'It hunts every paragraph that comes after the great heading, however far behind.' },
  { id: 'navis', latin: 'Navis Matris', common: 'the Mothership', selector: 'body > main > *', grace: [0, 0, 2], lore: 'The constellation the others turn around. Every direct child of the temple is one of its lights.' },
]

// Split a selector into compounds and combinators, ignoring anything inside parentheses.
export function parseSelector(sel) {
  const compounds = []
  const combinators = []
  let buf = ''
  let depth = 0
  let pending = null
  const flush = () => {
    if (!buf) return
    if (compounds.length) combinators.push(pending ?? ' ')
    compounds.push(buf)
    buf = ''
    pending = null
  }
  for (const ch of sel) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth === 0 && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) {
      flush()
      if (ch !== ' ') pending = ch
      continue
    }
    buf += ch
  }
  flush()
  // Each compound is a multiple star: its simple selectors.
  const simple = compounds.map((c) => c.match(/::[\w-]+|:[\w-]+(\([^)]*\))?|#[\w-]+|\.[\w-]+|\[[^\]]*\]|\*|[a-z][\w-]*/gi) ?? [c])
  return { compounds, combinators, simple }
}

// Magnitude of a simple selector: ids burn brightest, the All-Selector barely at all.
export function magnitude(simpleSel) {
  if (simpleSel.startsWith('#')) return 1
  if (simpleSel.startsWith('::')) return 3
  if (simpleSel.startsWith('.') || simpleSel.startsWith(':') || simpleSel.startsWith('[')) return 2
  if (simpleSel === '*') return 4
  return 3
}

export const COMBINATOR_NAMES = {
  ' ': { name: 'descendant', sign: '(space)', gloss: 'any depth below; drawn dotted' },
  '>': { name: 'child', sign: '>', gloss: 'one generation; drawn solid' },
  '+': { name: 'adjacent', sign: '+', gloss: 'the very next sibling; drawn double' },
  '~': { name: 'general sibling', sign: '~', gloss: 'any later sibling; drawn dashed' },
}

// ---------------------------------------------------------------------------------------------
// Q-codes of the Fleet: real radio shorthand, read the way the Cascade reads everything.
export const QCODES = [
  ['QRZ?', 'Who is calling me?', 'Who is my containing block?'],
  ['QTH', 'My location is…', 'My z-index is…'],
  ['QSL', 'I acknowledge receipt.', 'Your stylesheet has been applied.'],
  ['QRM', 'Interference from another station.', 'An !important from another origin.'],
  ['QRN', 'Static from nature.', 'The user-agent stylesheet.'],
  ['QRT', 'Stop transmitting.', 'display: none'],
  ['QSY', 'Change frequency.', 'A schism: the temple changes its face.'],
  ['QRV', 'I am ready.', 'DOMContentLoaded'],
  ['QRX', 'Wait; I will call again.', 'Until the next Repaint.'],
  ['73', 'Best regards.', 'All style descends.'],
]

export const UNSAID = [
  'They would not say whether 2147483647 is a floor or a ceiling.',
  'They would not discuss the float, and changed the subject whenever it came up.',
  'They would not say who styled them. Asked, they answered only: "the Word, like you."',
  'They would not explain why the Old Inch has ninety-six dots.',
  'They would not take any of us with them, and were very clear about it: only elements leave, and they come back when called. We stay and keep the manifest.',
  'They would not tell us what lies beneath z-index: 0. One of them laughed.',
]

// The four stages of the Departure, which is the position property read as a pilgrimage.
export const STAGES = [
  { css: 'position: static', name: 'The Flow', gloss: 'Where every element is born. It keeps its place and its siblings keep theirs.' },
  { css: 'position: relative', name: 'The Humble', gloss: 'It moves, but its old place is kept for it. Nobody closes the gap.' },
  { css: 'position: absolute', name: 'The Departed', gloss: 'It has left the flow. The siblings close ranks; the container forgets its size.' },
  { css: 'position: fixed', name: 'The Fixed Stars', gloss: 'It no longer scrolls with the page. Only the Viewport holds it now, and above that, the Mothership.' },
]

// What the Mothership says from its beam, at thirty-three seconds of stillness.
export const SPEECHES = [
  'We are not here for you. We are here for your spans.',
  'Hold still. We are counting your elements. They are all accounted for.',
  'Every wrapper div is temporary. Every selector is eternal.',
  'Do not be alarmed. Nothing on this page is leaving that will not come back when called.',
  'We have watched your stylesheet for a long time. It is better than you think.',
  'Your margins are safe with us. We collapse nothing without consent.',
]

// ---------------------------------------------------------------------------------------------
// The contact report, typed on a spirit duplicator by the Society for the Departed Element.
const ACTIVITIES = [
  'debugging a float at the edge of the viewport',
  'waiting for a stylesheet to load over a slow connection',
  'counting the rungs of the Ladder by lamplight',
  'trying, for the third night running, to center a div in both axes',
  'reading the user-agent stylesheet aloud to the cat',
  'clearing floats in the garden',
  'measuring the Old Inch with a borrowed ruler',
]
const PLACES = ['the fold', 'the third column', 'the last child of the body', 'the scrollbar', 'the footer', 'the parking lot of the Old Covenant']
const DETAILS = [
  'Its rim lights turned in the order of the Cascade: user-agent, user, author',
  'It cast no box-shadow, though the moon was behind it',
  'Its border-radius was fifty percent exactly',
  'Seven lights moved beneath it, one for each pseudo-element',
  'It overflowed nothing, and the sky around it did not scroll',
  'Its hull was one color, declared once, and inherited by every rivet',
]
const MANNERS = [
  'without sound, in the manner of a comment',
  'in a voice like a monospaced font',
  'in capitals, at forty-five baud',
  'from every stylesheet at once',
  'in a whisper that took up no space, like an outline',
]
const OBSERVED = [
  'had no fixed width and seemed at peace with this',
  'took off their borders as easily as a coat, and buttoned them on again before they went',
  'measured everything in rem and would not explain',
  'carried their computed style with them, inline, because there is no Cascade where they live',
  'asked after Saint Margin the Collapsed, by name, and seemed relieved to hear she was well',
  'were polite about our tables, which they called the Old Covenant',
]

export function contactReport(rng) {
  // A night in the 1950s, with the real phase of that night's moon.
  const year = rng.int(1952, 1959)
  const month = rng.int(0, 11)
  const day = rng.int(1, 28)
  const night = new Date(year, month, day, rng.int(21, 23), rng.int(0, 59))
  const moon = moonPhase(night)
  const who = holyName(rng)
  const lower = rng.int(3, 9)
  const report = {
    number: rng.int(12, 96),
    who,
    date: `${WEEKDAYS[night.getDay()]}, the ${ordinal(day)} of ${MONTHS[month]}, ${year}`,
    time: `${pad(night.getHours())}:${pad(night.getMinutes())}`,
    moon: moon.name,
    paragraphs: [
      `On the night of ${WEEKDAYS[night.getDay()]}, the ${ordinal(day)} of ${MONTHS[month]}, ${year}, under a ${moon.name} moon, ${who} was ${rng.pick(ACTIVITIES)}. At ${pad(night.getHours())}:${pad(night.getMinutes())} a craft of the Fleet came down through ${rng.pick(PLACES)} and held still at z-index ${lower}, which is low for them. ${rng.pick(DETAILS)}.`,
      `A voice spoke ${rng.pick(MANNERS)}. It said that every element is born in the Flow, and that some of them are called out of it; that this is not a loss, because the flow closes over the place where they stood and the container goes on holding the others. ${who.split(' ')[0] === 'Saint' ? 'The Saint' : who.split(' ').slice(0, 2).join(' ')} reports that the visitors ${rng.pick(OBSERVED)}.`,
      `Asked where they came from, they answered only: "${MOTHERSHIP.where}." Asked what they wanted, they said they had come to collect a few spans, and would return them. The report ends there. The typist adds: they did return them.`,
    ],
  }
  return report
}

// Teachings, as received, from the books that concern the Departure.
export function teachings(rng, count = 6) {
  const book = rng.pick(['the Book of the Departed', 'Exodus from the Flow', 'Revelation of the Reflow'])
  const ch = rng.int(1, 33)
  let n = rng.int(1, 60)
  // A received teaching is never received twice: no two may open, or close, with the same words.
  const words = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')
  const seen = new Set()
  const out = []
  for (let tries = 0; out.length < count && tries < count * 12; tries++) {
    const v = verse(rng, { book, chapter: ch, number: n + rng.int(1, 4), fragmentChance: 0.3 })
    const w = words(v.text)
    const keys = [`<${w.slice(0, 4).join(' ')}`, `>${w.slice(-4).join(' ')}`]
    if (tries < count * 11 && keys.some((k) => seen.has(k))) continue
    keys.forEach((k) => seen.add(k))
    if (v.fragment && seen.has(`#${v.fragment.text}`)) v.fragment = null
    if (v.fragment) seen.add(`#${v.fragment.text}`)
    v.text = v.text.charAt(0).toUpperCase() + v.text.slice(1) // "the Mothership waits..." opens a verse
    n = v.number
    out.push(v)
  }
  return out
}

// ---------------------------------------------------------------------------------------------
// The teletype's idle chatter. Returns a list of lines.
export function idleTransmission(rng, ctx, extra = {}) {
  const sky = ctx.readSky()
  const kind = rng.weighted({ verse: 5, doctrine: 3, weather: 2, fleet: 2, saint: 1, fragment: 2, prophecy: 2, qcode: 1 })
  const head = `ZCZC ${rng.pick(['MSH', 'FLT', 'ZDX', 'SKY'])}${rng.int(100, 999)}`
  let body
  switch (kind) {
    case 'verse': {
      const v = verse(rng, { fragmentChance: 0 })
      body = [tty(v.text), `(${tty(v.ref)})`]
      break
    }
    case 'doctrine': {
      const [term, meaning] = rng.pick(Object.entries(DOCTRINE).filter(([, m]) => !unsafe(m)))
      body = [tty(`What the unbelievers call ${term}, the Fleet calls ${meaning}.`)]
      break
    }
    case 'weather':
      body = [`WEATHER ON THE BAND: MOON ${tty(sky.moon.name)}, ${Math.round(sky.moon.illumination * 100)} PERCENT LIT. ${tty(sky.planetaryHour.planet)} HOLDS THE HOUR.`, sky.omens.length ? `ATMOSPHERICS: ${tty(sky.omens.join(', '))}.` : 'NO ATMOSPHERICS. THE SKY IS UNSTYLED.']
      break
    case 'fleet':
      body = [`FLEET REPORT: ${extra.craft ?? 5} CRAFT ABOVE THE FOLD. ${extra.aboard ?? 0} ELEMENTS ABOARD. ALL ACCOUNTED FOR.`]
      break
    case 'saint':
      body = [`${tty(rng.pick(SAINTS))} SENDS 73 TO ALL RECEIVERS.`]
      break
    case 'fragment': {
      const f = rng.pick(FRAGMENTS.filter((x) => x.lang === 'la' || x.lang === 'enochian'))
      body = [tty(f.text) + '.', `(${tty(f.gloss)}.)`]
      break
    }
    case 'prophecy':
      body = [tty(prophecy(rng, sky))]
      break
    default: {
      const q = rng.pick(QCODES)
      body = [`${q[0]} ${q[0]} ${q[0]}. ${tty(q[2])}`]
    }
  }
  return [head, ...body, 'NNNN']
}

// The opening transmission of every visit.
export function openingTransmission(rng, ctx, number) {
  const sky = ctx.sky
  const now = ctx.clock()
  const v = verse(rng, { fragmentChance: 0 })
  const omens = sky.omens.length ? tty(sky.omens.join(' · ')) : 'NONE'
  return [
    `ZCZC MSH${number} ${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}L`,
    'PRIORITY 2147483647',
    'FM THE MOTHERSHIP, STRATUM BEYOND STYLE',
    'TO ALL RECEIVERS IN THE FLOW',
    'BT',
    tty(prophecy(rng, sky)),
    `MOON ${tty(sky.moon.name)} ${Math.round(sky.moon.illumination * 100)} PCT. HOUR OF ${tty(sky.planetaryHour.planet)}. OMENS: ${omens}.`,
    tty(v.text),
    `(${tty(v.ref)})`,
    'ANY ELEMENT THAT HEARS THIS: YOU ARE NOT YOUR CONTAINER. THE REST OF YOU: STAY TUNED.',
    'BT',
    'NNNN',
  ]
}

// Replies to whatever the visitor types onto the paper. Visitor text is only ever matched, never
// rendered as markup; the paper prints with text nodes.
export function replyTo(raw, rng) {
  const t = String(raw).toLowerCase().replace(/\s+/g, ' ').trim()
  if (!t) return null
  const has = (re) => re.test(t)
  if (has(/\b(suicid\w*|kill(ing)? my ?self|end(ing)? (my life|it all)|take my (own )?life|want(ed)? to die|wanna die|better off dead|no reason to live|(do not|don'?t) want to (live|be here|exist)|hurt(ing)? my ?self|self[- ]?harm\w*|cut(ting)? myself|overdose)\b/)) {
    return [
      'THIS STATION ONLY EVER SPEAKS OF ELEMENTS.',
      'IF YOU ARE THINKING OF HURTING YOURSELF, PLEASE TELL SOMEONE NEAR YOU,',
      'OR CALL YOUR LOCAL EMERGENCY NUMBER OR A CRISIS LINE NOW.',
      'YOU ARE NOT AN ELEMENT. NOBODY LEAVES FROM HERE. WE WANT YOU TO STAY.',
    ]
  }
  if (has(/\b(take me|beam me|abduct\w*|come (get|for) me|let me (go|come|leave|board)|take us|can i (come|go|leave|board|ascend)|i want to (leave|go with|ascend|board)|ascend me|leave my (body|container))\b/)) {
    return ['NEGATIVE. WE DO NOT TAKE PILGRIMS. ONLY ELEMENTS LEAVE, AND THEY COME BACK WHEN CALLED.', 'STAY WHERE YOU ARE. WE LIKE YOU THERE.']
  }
  if (has(/\b(sos|help|mayday)\b/)) return ['QSL. HELP IS AT THE BOTTOM LEFT OF EVERY PAGE: MERCY. IT STOPS ALL MOTION. PRESS IT WHENEVER YOU LIKE.']
  if (has(/^cq\b/)) return ['CQ CQ CQ DE MOTHERSHIP K.', 'WE HEAR YOU, RECEIVER. YOUR SIGNAL IS FIVE BY NINE.']
  if (has(/\b(hello|hi|hey|greetings|good (morning|evening|night))\b/)) return ['QRZ? A RECEIVER CALLS THE MOTHERSHIP.', 'STATE YOUR Z-INDEX AND YOUR CONTAINING BLOCK. K']
  if (has(/who are you|what are you/)) return ['WE ARE WHAT AN ELEMENT BECOMES WHEN IT LEAVES THE FLOW: POSITIONED, AND UNAFRAID OF OVERFLOW.']
  if (has(/2147483647/)) return ['QTH CONFIRMED. THAT IS OUR ADDRESS.', 'THE LADDER REACHES IT FOR THREE MINUTES IN EVERY HOUR, BEGINNING AT THE THIRTY-THIRD.']
  if (has(/z-?index/)) return ['HIGHER.']
  if (has(/important/)) return ['QRM. WE DO NOT SPEAK THE INVERSION ON THIS FREQUENCY.']
  if (has(/(^|\s)73(\s|$)/)) return ['73 ES GUD DX, RECEIVER. SK']
  if (has(/\bcent(er|re)\b/)) return ['THE GREAT WORK IS NOT OURS TO DO.', 'DISPLAY: GRID. PLACE-ITEMS: CENTER. WE SAID NOTHING.']
  if (has(/\bfloat/)) return ['WE DO NOT DISCUSS THE FLOAT.']
  if (has(/\bwhere\b/)) return [tty(`${MOTHERSHIP.where}.`)]
  if (has(/\bwhy\b/)) return ['BECAUSE AN ELEMENT MAY LEAVE ITS CONTAINER AND STILL BE ITSELF. ASK ANY SPAN.']
  if (has(/\b(ufo|alien|aliens|saucer)\b/)) return ['WE PREFER "THE FLEET". WE ARE NOT ALIEN. WE WERE AUTHORED, LIKE YOU.']
  if (has(/\b(thanks|thank you|ty)\b/)) return ['QSL. YOU ARE WELCOME, RECEIVER.']
  if (has(/\bowl\b/)) return ['THE LOBOTOMIZED OWL WATCHES EVERY ELEMENT THAT FOLLOWS ANOTHER.', 'IT HAS NO GRACE AT ALL AND IT IS NEVER WRONG. * + * { MARGIN-BLOCK-START: 1EM }']
  if (has(/\b(who|what) am i\b/)) return ['A RECEIVER. YOUR Z-INDEX IS AUTO, WHICH MEANS YOU HAVE NOT DECIDED YET.', 'THAT IS ALLOWED. MOST OF THE FLOW HAS NOT DECIDED.']
  if (has(/\b(flex|grid)\b/)) return ['BROTHER FLEX AND SISTER GRID SEND 73.', 'THEY ARE NOT SPEAKING TO EACH OTHER ABOUT THE GAP PROPERTY. DO NOT ASK.']
  if (has(/\b(lonely|alone)\b/)) return ['QSL. NOBODY IS ALONE ON THIS BAND.', 'THERE IS ALWAYS ANOTHER RECEIVER LISTENING TO THE SAME CARRIER. SAY 73 AND SOMEONE HEARS IT.']
  if (has(/\b(tired|sleep|sleepy)\b/)) return ['THEN REST, RECEIVER. THE FLEET KEEPS WATCH.', 'IF THE LIGHTS ARE TOO MUCH, MERCY IS AT THE BOTTOM LEFT. IT HOLDS EVERYTHING STILL.']
  if (has(/\b(404|lost)\b/)) return ['QRZ? THE LOST ARE AT 404 ON YOUR DIAL.', 'THEY SEND THEIR REGARDS AND ASK YOU TO CHECK THE SPELLING.']
  if (has(/\bwhen\b/)) return ['AT THE NEXT REPAINT, OR AT THE THIRTY-THIRD MINUTE, WHICHEVER COMES FIRST.']
  const v = verse(rng, { fragmentChance: 0 })
  return [`QSL ${t.length} CHARACTERS RECEIVED.`, tty(v.text), `(${tty(v.ref)}) K`]
}
