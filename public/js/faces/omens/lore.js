// THE SERIES. The words of the great tablet, and the condition each one is written under.
//
// Every omen of kind media, supports or container is a real rule in /css/faces/omens.css: the omen line is
// fired (--om-fire: 1) inside the same @media, @supports or @container block that carries its "then", so
// the tablet and the page cannot disagree. `query` is that block's condition, letter for letter; the face
// listens to it with matchMedia only to know when to announce a rewritten fate.
// Omens of the sky and of the Pilgrim's conduct are read by the face itself (sky, behaviour, visits) and
// their "then" is done by the face, with the true counts written into the line.

export const INCIPIT = { akk: 'šumma pilgrim ina viewport šakin', en: 'If the Pilgrim is set in a viewport' }

export const GROUPS = [
  { id: 'tablet', num: 'I', akk: 'ṭuppum', en: 'the shape of the tablet' },
  { id: 'hand', num: 'II', akk: 'qātum', en: 'the hand of the Pilgrim' },
  { id: 'eye', num: 'III', akk: 'īnum', en: 'the eye of the Pilgrim' },
  { id: 'mind', num: 'IV', akk: 'ṭēmum', en: 'what the tablet knows' },
  { id: 'sky', num: 'V', akk: 'šamû', en: 'the sky over the table' },
  { id: 'ways', num: 'VI', akk: 'alākum', en: 'the comings and goings of the Pilgrim' },
]

// kind: media | supports | container | reed (media, hidden until it holds) | sky | conduct
export const SERIES = [
  // I. the shape of the tablet
  { id: 'portrait', group: 'tablet', kind: 'media', query: '(orientation: portrait)',
    if: 'If the tablet stands on its end', then: 'the columns will fall into one, and the Pilgrim will read downward, as water runs.' },
  { id: 'span', group: 'tablet', kind: 'media', query: '(max-width: 25cm)',
    if: 'If the tablet is narrower than a span, twenty-five centimetres of the Old Law', then: 'the ziggurat will lose a terrace. The silver one will not be rebuilt.' },
  { id: 'forearm', group: 'tablet', kind: 'media', query: '(min-width: 32cm)',
    if: 'If the tablet is wider than a forearm', then: 'the omens will be written in two columns, and the scribe will be paid for both.' },
  { id: 'brick', group: 'tablet', kind: 'media', query: '(min-aspect-ratio: 2/1)',
    if: 'If the tablet lies like a brick, twice as broad as it is tall', then: 'the light will come in low, and every shadow on the table will be long.' },
  { id: 'narrow', group: 'tablet', kind: 'container', query: 'om-tablet (max-width: 34em)',
    if: 'If the great tablet is narrower than thirty-four signs', then: 'the scribe will leave the line numbers out of the margin, for there is no room for them.' },
  { id: 'reed', group: 'tablet', kind: 'reed', query: '(max-aspect-ratio: 1/2)',
    if: 'If the Pilgrim stands like a reed', then: 'let them read the liver in the Book, and not in the flesh. The Book of this tablet is its stylesheet, /css/faces/omens.css.' },
  // II. the hand of the Pilgrim
  { id: 'finger', group: 'hand', kind: 'media', query: '(pointer: coarse)',
    if: 'If the Pilgrim touches with a finger and not a reed', then: 'the buttons will grow, for a finger is broad.' },
  { id: 'stylus', group: 'hand', kind: 'media', query: '(pointer: fine)',
    if: 'If the Pilgrim points with a reed', then: 'the hand that points will become a stylus.' },
  { id: 'nohover', group: 'hand', kind: 'media', query: '(hover: none)',
    if: 'If the Pilgrim’s hand cannot hover over the clay', then: 'the glosses will be written out in full, and the editor will not wait to be asked.' },
  { id: 'restless', group: 'hand', kind: 'conduct' },
  { id: 'thumbs', group: 'hand', kind: 'conduct' },
  { id: 'typed', group: 'hand', kind: 'conduct' },
  // III. the eye of the Pilgrim
  { id: 'night-choice', group: 'eye', kind: 'media', query: '(prefers-color-scheme: dark)',
    if: 'If the Pilgrim comes in a night of their own choosing', then: 'a lamp will be lit on the table, and the clay will be read by it.' },
  { id: 'still-choice', group: 'eye', kind: 'media', query: '(prefers-reduced-motion: reduce)',
    if: 'If the Pilgrim has asked the world to hold still', then: 'mercy is already in them, and the mercy button will be fired.' },
  { id: 'deep', group: 'eye', kind: 'media', query: '(prefers-contrast: more)',
    if: 'If the Pilgrim asks for the wedges to be cut deeper', then: 'every sign will be cut twice as deep.' },
  { id: 'fine-eye', group: 'eye', kind: 'media', query: '(min-resolution: 2dppx)',
    if: 'If the Pilgrim’s eye counts two dots for every dot of the Old Law', then: 'the rulings will be cut as fine as a hair.' },
  { id: 'gamut', group: 'eye', kind: 'media', query: '(color-gamut: p3)',
    if: 'If the Pilgrim’s eye sees colours the Old Law never named', then: 'the fired clay will be redder than red.' },
  { id: 'forced', group: 'eye', kind: 'forced', query: '(forced-colors: active)',
    if: 'If the Pilgrim’s colours prevail', then: 'Here the Pilgrim’s colours prevail over the Word, as is right.' },
  // IV. what the tablet knows
  { id: 'balance', group: 'mind', kind: 'supports', query: '(text-wrap: balance)',
    if: 'If the tablet knows how to balance a line', then: 'every omen will end evenly, and no word will be left alone at the end of one.' },
  { id: 'timeline', group: 'mind', kind: 'supports', query: '(animation-timeline: scroll())',
    if: 'If the tablet knows the timeline of the scroll', then: 'the light will rake across the clay as the Pilgrim reads.' },
  // V. the sky over the table
  { id: 'moon', group: 'sky', kind: 'sky' },
  { id: 'hour', group: 'sky', kind: 'sky' },
  { id: 'night', group: 'sky', kind: 'sky' },
  { id: 'gold', group: 'sky', kind: 'sky' },
  // VI. the comings and goings of the Pilgrim
  { id: 'away', group: 'ways', kind: 'conduct' },
  { id: 'visits', group: 'ways', kind: 'conduct' },
]

// The lines the tablet gains during a visit.
export const ADDITIONS = {
  fired: { if: 'If the Pilgrim is still for one hundred and eight breaths', then: 'the tablet will outlive the king.' },
  read: { if: 'If the Pilgrim reads the liver in the Book and not in the flesh', then: 'the flesh will agree with the Book.' },
  eclipse: { if: 'If the sun is covered while the Pilgrim reads', then: 'the diviner will write “evil” in the margin, and beneath it, smaller, “but not for the Pilgrim”.' },
}

// The seven tunings of the old lyre texts, one for each ruler of the hour (Chaldean order).
export const TUNINGS = {
  Saturn: 'išartum', Jupiter: 'kitmum', Mars: 'embūbum', Sun: 'pītum', Venus: 'nīd qablim', Mercury: 'nīš gabarî', Moon: 'qablītum',
}
export const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']

// The marks a diviner reads on a liver, and what the Cascade calls them.
export const MARKS = [
  { akk: 'manzāzum', en: 'the Station', css: 'position' },
  { akk: 'padānum', en: 'the Path', css: 'the flow' },
  { akk: 'naplastum', en: 'the View', css: 'the viewport' },
  { akk: 'bāb ekallim', en: 'the Palace Gate', css: ':root' },
  { akk: 'ubānum', en: 'the Finger', css: 'the pointer' },
  { akk: 'martum', en: 'the Gall', css: 'overflow' },
  { akk: 'danānum', en: 'the Strength', css: 'specificity' },
  { akk: 'šulmum', en: 'the Well-being', css: 'mercy' },
]

// Herodotus gave the seven walls of Ecbatana these colours, from the outermost to the innermost.
export const TERRACES = [
  { id: 'white', name: 'white' },
  { id: 'black', name: 'black' },
  { id: 'purple', name: 'purple' },
  { id: 'blue', name: 'blue' },
  { id: 'orange', name: 'orange' },
  { id: 'silver', name: 'silver' },
  { id: 'gold', name: 'gold' },
]

// The Babylonian night was kept in three watches.
export function watchOf(hour) {
  if (hour >= 18 && hour < 22) return 'the evening watch'
  if (hour >= 22 || hour < 2) return 'the middle watch'
  if (hour >= 2 && hour < 6) return 'the morning watch'
  return 'by daylight'
}

// Stone for a cylinder seal, drawn by lot from the first-visit seed.
export const STONES = [
  { id: 'lapis', name: 'lapis lazuli' },
  { id: 'carnelian', name: 'carnelian' },
  { id: 'hematite', name: 'haematite' },
  { id: 'chalcedony', name: 'chalcedony' },
  { id: 'serpentine', name: 'serpentine' },
]
