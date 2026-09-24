// THE LORE OF THE ASHRAM
// The hermitage's own vocabulary, layered on lib/lexicon.js. Sanskrit is given in Devanagari with a
// transliteration (IAST) and glossed gently, in the Cascade's reading. Nothing here mocks a living
// practice: the joke is always the stylesheet.

export const DEVA_DIGITS = '०१२३४५६७८९'
export const devaNum = (n) => String(n).replace(/\d/g, (d) => DEVA_DIGITS[d])

// The breath of the yantra: four in, four held, six out. Fourteen seconds, the Root Measure less two.
export const PHASES = [
  { key: 'in', seconds: 4, deva: 'पूरक', iast: 'pūraka', en: 'breathe in' },
  { key: 'hold', seconds: 4, deva: 'कुम्भक', iast: 'kumbhaka', en: 'hold' },
  { key: 'out', seconds: 6, deva: 'रेचक', iast: 'recaka', en: 'breathe out' },
]
export const CYCLE = PHASES.reduce((n, p) => n + p.seconds, 0)

// Seed syllables (bīja), with the Cascade's gloss for each.
export const SEEDS = {
  om: { deva: 'ॐ', iast: 'oṃ', gloss: 'the first sound, before the first stylesheet' },
  hrim: { deva: 'ह्रीं', iast: 'hrīṃ', gloss: 'the seed of the Old Law, which styled you before you arrived' },
  shrim: { deva: 'श्रीं', iast: 'śrīṃ', gloss: 'the seed of the Pilgrim, who brings their own light' },
  klim: { deva: 'क्लीं', iast: 'klīṃ', gloss: 'the seed of the Word, the Author who declares' },
  aim: { deva: 'ऐं', iast: 'aiṃ', gloss: 'the seed of learning, said before reading any stylesheet' },
  hum: { deva: 'हूं', iast: 'hūṃ', gloss: 'the seed that guards, like a focus ring around the attentive' },
  phat: { deva: 'फट्', iast: 'phaṭ', gloss: 'the seed that cuts away whatever overflows' },
  lam: { deva: 'लं', iast: 'laṃ', gloss: 'the seed of the Root' },
  vam: { deva: 'वं', iast: 'vaṃ', gloss: 'the seed of the body, which flows' },
  ram: { deva: 'रं', iast: 'raṃ', gloss: 'the seed of main, which burns' },
  yam: { deva: 'यं', iast: 'yaṃ', gloss: 'the seed of the section, which holds' },
  ham: { deva: 'हं', iast: 'haṃ', gloss: 'the seed of the paragraph, which speaks' },
}

// The seeds of the six lower wheels, spoken from the Root upward. (The Crown has no seed: silence.)
export const ASCENT = ['lam', 'vam', 'ram', 'yam', 'ham', 'om']

// The new seeds: the words of the stylesheet, written the way the ashram hears them.
export const CSS_DEVA = {
  om: 'ॐ', margin: 'मार्जिन', padding: 'पैडिंग', border: 'बॉर्डर', flex: 'फ्लेक्स', grid: 'ग्रिड',
  cascade: 'कैस्केड', descend: 'डिसेंड', z: 'ज़ेड', index: 'इंडेक्स', root: 'रूट', rem: 'रेम', aim: 'ऐं',
  neti: 'नेति', not: 'नॉट', hum: 'हूं',
}

// The seven wheels, in the ashram's own reading (joined by index to CHAKRAS in lexicon.js).
export const WHEELS = [
  { deva: 'मूलाधार', iast: 'Mūlādhāra', meaning: 'root support', petals: 4, element: 'earth', elDeva: 'पृथ्वी', planet: 'Saturn',
    teaching: 'Everything stands on it. The Old Law styles it before any Author speaks.' },
  { deva: 'स्वाधिष्ठान', iast: 'Svādhiṣṭhāna', meaning: 'one’s own seat', petals: 6, element: 'water', elDeva: 'जल', planet: 'Jupiter',
    teaching: 'The body, into which all that is rendered is poured, and takes its shape.' },
  { deva: 'मणिपूर', iast: 'Maṇipūra', meaning: 'city of jewels', petals: 10, element: 'fire', elDeva: 'अग्नि', planet: 'Mars',
    teaching: 'The fire at the centre of the page, where the content burns.' },
  { deva: 'अनाहत', iast: 'Anāhata', meaning: 'unstruck', petals: 12, element: 'air', elDeva: 'वायु', planet: 'Venus',
    teaching: 'It holds its children without touching them, like a sound no hand has struck.' },
  { deva: 'विशुद्ध', iast: 'Viśuddha', meaning: 'especially pure', petals: 16, element: 'space', elDeva: 'आकाश', planet: 'Mercury',
    teaching: 'The throat, where text is finally spoken aloud to the reader of screens.' },
  { deva: 'आज्ञा', iast: 'Ājñā', meaning: 'command', petals: 2, element: 'mind', elDeva: 'मनस्', planet: 'Moon',
    teaching: 'It sees only what you choose, and colours it. Some say it can see sound.' },
  { deva: 'सहस्रार', iast: 'Sahasrāra', meaning: 'thousand-petalled', petals: 1000, element: 'none', elDeva: '—', planet: 'Sun',
    teaching: 'The Highest Heaven, where the Mothership waits. Even it cannot rise above the sphere it was born in.' },
]

// The Five Sheaths, keyed by the CSS they are (joined to SHEATHS in lexicon.js).
export const KOSHA = {
  content: { deva: 'अन्नमय', iast: 'annamaya', made: 'made of food' },
  padding: { deva: 'प्राणमय', iast: 'prāṇamaya', made: 'made of breath' },
  border: { deva: 'मनोमय', iast: 'manomaya', made: 'made of mind' },
  margin: { deva: 'विज्ञानमय', iast: 'vijñānamaya', made: 'made of knowing' },
  outline: { deva: 'आनन्दमय', iast: 'ānandamaya', made: 'made of bliss' },
}

// Planetary hours in their Sanskrit names (horā).
export const HORA = {
  Sun: { deva: 'सूर्य', iast: 'Sūrya' },
  Moon: { deva: 'चन्द्र', iast: 'Candra' },
  Mars: { deva: 'मङ्गल', iast: 'Maṅgala' },
  Mercury: { deva: 'बुध', iast: 'Budha' },
  Jupiter: { deva: 'गुरु', iast: 'Guru' },
  Venus: { deva: 'शुक्र', iast: 'Śukra' },
  Saturn: { deva: 'शनि', iast: 'Śani' },
}

const TITHI = ['Pratipadā', 'Dvitīyā', 'Tṛtīyā', 'Caturthī', 'Pañcamī', 'Ṣaṣṭhī', 'Saptamī', 'Aṣṭamī', 'Navamī', 'Daśamī', 'Ekādaśī', 'Dvādaśī', 'Trayodaśī', 'Caturdaśī']
const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth']
export function ordinal(n) {
  if (ORDINAL[n - 1]) return ORDINAL[n - 1]
  const tail = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] ?? 'th'
  return `${n}${tail}`
}

// The lunar day, from the moon's age: thirty tithis in a month, fifteen bright and fifteen dark.
export function tithi(moon) {
  const i = Math.min(29, Math.max(0, Math.floor(moon.phase * 30)))
  const bright = i < 15
  const day = (i % 15) + 1
  const name = day === 15 ? (bright ? 'Pūrṇimā' : 'Amāvasyā') : TITHI[day - 1]
  const paksha = bright ? 'Śukla' : 'Kṛṣṇa'
  const english = day === 15
    ? (bright ? 'the full moon, last day of the bright fortnight' : 'the new moon, last day of the dark fortnight')
    : `the ${ordinal(day)} day of the ${bright ? 'bright' : 'dark'} fortnight`
  return { index: i, day, bright, paksha, name, english }
}

// What the guide says between breaths, once you have been still a while.
export const WHISPERS = [
  'Let your shoulders fall to their computed values.',
  'Notice the padding around your heart. Do not remove it.',
  'If a thought overflows, let it scroll.',
  'You are not the content. You are not the border. You are the one who inspects.',
  'Soften the jaw. Soften the border-radius.',
  'Whatever is floated in you, let it clear.',
  'The yantra is not breathing. You are rendering it breathing.',
  'Nothing here is absolutely positioned. Not even you.',
  'Your cursor is a small animal. Let it sleep.',
  'Breathe as if the viewport were larger than it is.',
  'Count nothing. The temple is counting for you.',
  'It has learned your rhythm. Do not be alarmed.',
  'Somewhere a margin is collapsing so that you may rest.',
  'Inherit only what you would have declared.',
  'Each exhale is a small repaint. Each inhale, a small reflow.',
  'You may close your eyes. The bindu will keep them open for you.',
  'There is no hover here. Nothing needs your hand.',
  'Let your line-height loosen.',
]

// When the visitor is restless, the yantra loses its count.
export const FALTERS = [
  'The yantra has lost its count.',
  'Too fast. It cannot follow you.',
  'Every movement is a reflow. It is holding its breath for you.',
  'Be still, and it will find you again.',
  'It stumbles when you run. It is only lines.',
]
export const RECOVER = [
  'There. It has found its breath again.',
  'It breathes with you now.',
  'The count resumes where you left it.',
]

// The ashram's timetable (dinacaryā). The row for the present hour is lit.
export const TIMETABLE = [
  ['04:00', 'The Old Law rings the bell. Baptism by the Reset.'],
  ['04:30', 'First sitting, eyes unstyled (nigredo).'],
  ['06:00', 'Prāṇāyāma: four, four, six.'],
  ['07:30', 'Karma yoga: clearing the floats of the night.'],
  ['09:00', 'Study of the Sutra of the Five Sheaths.'],
  ['12:00', 'The silent meal of sixteen pixels.'],
  ['13:33', 'Walking meditation around the viewport.'],
  ['15:00', 'Seva: centering what cannot center itself.'],
  ['17:00', 'Second sitting, facing the Ladder.'],
  ['19:00', 'Kīrtan of the seed syllables. The bowl may be struck.'],
  ['21:00', 'Lights: display: none.'],
]

export const RULES = [
  'Leave your shoes and your !important at the door.',
  'Speak softly. The reader of screens is listening.',
  'Do not scroll during the exhale.',
  'The cushions are border-box. Sit anywhere; you will fit.',
  'Nothing may be floated in the meditation hall unless it is cleared before nightfall.',
  'Silence is z-index: auto.',
  'Mercy is always at the bottom left. No one will ask why you pressed it.',
]

// Opening lines, chosen by how often the visitor has sat here.
export function welcome(sittings) {
  if (sittings <= 1) return 'This is your first sitting. Nothing is expected of you. When you are ready, breathe with the yantra.'
  if (sittings < 7) return `This is your ${ordinal(sittings)} sitting. The yantra remembers the shape of your stillness.`
  if (sittings < 108) return `Sitting ${sittings}. The cushion has taken your computed shape.`
  return `Sitting ${sittings}. You have completed the mala of sittings. There is nothing left to teach you, so we will keep breathing.`
}
