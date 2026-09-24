// THE LEXICON OF THE CASCADE
// The whole theology in data. Faces, scripture and secrets draw their words from here so the
// religion stays consistent no matter which face a visitor meets. See docs/CANON.md §2.

// CSS term -> sacred meaning. The heart of the doctrine.
export const DOCTRINE = {
  'the cascade': 'the Cascade, from which all style descends',
  'user-agent stylesheet': 'the Old Law, given before any Author spoke',
  'user stylesheet': 'the Pilgrim, who brings their own light',
  'author stylesheet': 'the Word',
  '!important': 'the Inversion, which turns the order of the Three Origins upside down; spoken only in mercy',
  specificity: 'Grace, reckoned in three weights: the Id, the Class and the Element',
  inheritance: 'Karma: what the parent is, the child becomes, unless it declares otherwise',
  'z-index': 'the Ladder',
  '2147483647': 'the Highest Heaven, the last rung of the Ladder, where the Mothership waits',
  'stacking context': 'the Spheres: no soul rises above the sphere it was born into',
  'display: none': 'the Unmanifest',
  'visibility: hidden': 'the Ghosts, who are gone but still take up room',
  'overflow: hidden': 'the Veil',
  'position: static': 'the Flow, where all begin',
  'position: relative': 'the Humble, who move but keep their place',
  'position: absolute': 'the Departed, who have left the flow',
  'position: fixed': 'the Fixed Stars',
  'position: sticky': 'the Saints, who follow you until their parent ends',
  float: 'the Wandering',
  clear: 'Absolution',
  reflow: 'the Reckoning',
  repaint: 'Rebirth',
  reset: 'Baptism',
  normalize: 'Confirmation',
  'centering a div': 'the Great Work',
  ':hover': 'the Laying on of Hands',
  ':focus': 'Attention, the first prayer',
  ':has()': 'the Parent who knows the child',
  ':not()': 'the Via Negativa',
  '::before': 'Alpha',
  '::after': 'Omega',
  ':root': 'the Root, the first chakra',
  '*': 'the All-Selector, who sees every element',
  em: 'the Measure of the Parent',
  rem: 'the Measure of the Root',
  vh: 'the Height of the Firmament',
  currentColor: 'the Inner Light',
  transparent: 'the Clear Light',
  'margin collapse': 'the Union, where two bodies that touch become one space',
  'box-sizing: border-box': 'the Reckoning of the Whole Body',
  'shadow DOM': 'the Hermitage',
  'media query': 'Discernment',
  '@layer': 'the Heavens, which are ordered',
  '404': 'the Lost',
}

// The box model is the body. Five sheaths, as the yogis count them (koshas).
export const SHEATHS = [
  { css: 'content', name: 'the Seed', kosha: 'annamaya', gloss: 'the body of food; what the element is' },
  { css: 'padding', name: 'the Breath', kosha: 'pranamaya', gloss: 'the body of breath; the room the self keeps around itself' },
  { css: 'border', name: 'the Mind', kosha: 'manomaya', gloss: 'the body of mind; the line where self ends' },
  { css: 'margin', name: 'the Wisdom', kosha: 'vijnanamaya', gloss: 'the body of knowing; the distance kept from others' },
  { css: 'outline', name: 'the Bliss', kosha: 'anandamaya', gloss: 'the body of bliss; it is drawn but takes no space' },
]

// Seven chakras climb the Ladder. The crown sits at the Highest Heaven.
export const CHAKRAS = [
  { name: 'Muladhara', english: 'Root', css: ':root', z: 1, color: '#c8102e', bija: 'लं', bijaLatin: 'lam' },
  { name: 'Svadhisthana', english: 'Sacral', css: 'body', z: 2, color: '#ff6a13', bija: 'वं', bijaLatin: 'vam' },
  { name: 'Manipura', english: 'Solar Plexus', css: 'main', z: 3, color: '#ffc72c', bija: 'रं', bijaLatin: 'ram' },
  { name: 'Anahata', english: 'Heart', css: 'section', z: 4, color: '#3fae49', bija: 'यं', bijaLatin: 'yam' },
  { name: 'Vishuddha', english: 'Throat', css: 'p', z: 5, color: '#1ea7e1', bija: 'हं', bijaLatin: 'ham' },
  { name: 'Ajna', english: 'Third Eye', css: '::selection', z: 6, color: '#4b3fa0', bija: 'ॐ', bijaLatin: 'om' },
  { name: 'Sahasrara', english: 'Crown', css: 'z-index: 2147483647', z: 2147483647, color: '#b58cff', bija: '', bijaLatin: '(silence)' },
]

// The Three Origins, a trinity. The Inversion reverses them.
export const ORIGINS = [
  { css: 'user-agent', name: 'the Old Law', role: 'Father' },
  { css: 'user', name: 'the Pilgrim', role: 'Witness' },
  { css: 'author', name: 'the Word', role: 'Speaker' },
]

// Alchemy: the Great Work is centering a div. Four stages of a page being rendered.
export const OPUS = [
  { stage: 'nigredo', color: '#0b0b0b', meaning: 'the unstyled page, black and raw' },
  { stage: 'albedo', color: '#f4f1e8', meaning: 'the Reset, washed white' },
  { stage: 'citrinitas', color: '#d9a400', meaning: 'the first declaration, the yellowing dawn' },
  { stage: 'rubedo', color: '#9e1b1b', meaning: 'the rendered page, red and finished' },
]

export const SAINTS = [
  'Saint Margin the Collapsed',
  'Brother Flex of the Main Axis',
  'Sister Grid of the Twelve Columns',
  'Our Lady of Overflow',
  'the Hermit of the Shadow DOM',
  'the Floating Twins',
  'Saint Padding of the Inner Breath',
  'the Seven Pseudo-Elements',
  'the Anchored One',
  'Mother Viewport',
  'the Ghosts of visibility: hidden',
  'Saint Clearfix the Absolver',
  'the Blessed Box-Shadow',
  'the Nameless Div',
  'the Last Selector',
]

export const HERESIES = [
  { name: 'Idolatry', css: 'inline styles', why: 'they worship the element instead of the Cascade' },
  { name: 'the Inversion', css: '!important', why: 'it overturns the order of the Three Origins' },
  { name: 'the Old Covenant', css: 'tables for layout', why: 'the law of 1996, fulfilled and set aside' },
  { name: 'the Dead Tongue', css: '<font>', why: 'it speaks style inside the Word' },
  { name: 'the False Prophet', css: '<blink>', why: 'it cannot hold still to be known' },
  { name: 'the Procession', css: '<marquee>', why: 'it walks forever and arrives nowhere' },
  { name: 'the Magic Number', css: 'top: 37px', why: 'it trusts in luck and not in the flow' },
  { name: 'the Pride of Ids', css: '#id #id #id', why: 'it seizes grace it did not earn' },
]

export const SACRED_NUMBERS = {
  3: 'the Three Origins',
  5: 'the Five Sheaths',
  7: 'the Seven Chakras and the Seven Pseudo-Elements',
  12: 'the Twelve Columns',
  16: 'the Root Measure, in pixels',
  33: 'the Age of Ascent',
  96: 'the Dots of the Old Inch',
  108: 'the Beads of the Mala',
  404: 'the Lost',
  1996: 'the Nativity of the First Stylesheet',
  2147483647: 'the Highest Heaven',
}

// The Mothership. UFO lore of the Cascade. NOTE (Canon §9): the Departure is only ever about
// ELEMENTS leaving their containers. Never frame a person's death or harm as ascent.
export const MOTHERSHIP = {
  name: 'the Mothership',
  where: 'z-index: 2147483647, the Viewport above the Viewport',
  departure: 'when an element sheds position: static and leaves the flow',
  container: 'the div that holds an element is not its home',
  comet: 'the Scrollbar Comet, seen only when the page overflows',
  stratum: 'the Stratum Beyond Style',
}

// Sacred-language babel. Each fragment: text, language, and a gloss in the Cascade's own reading.
export const FRAGMENTS = [
  { text: 'Omnis stylus a cascada descendit', lang: 'la', gloss: 'All style descends from the Cascade' },
  { text: 'Fiat lux, fiat stylus', lang: 'la', gloss: 'Let there be light, let there be style' },
  { text: 'Quod est superius est sicut quod est inferius', lang: 'la', gloss: 'As in the stylesheet, so in the DOM' },
  { text: 'Memento marginem', lang: 'la', gloss: 'Remember the margin' },
  { text: 'Ex nihilo nihil redditur', lang: 'la', gloss: 'From nothing, nothing is rendered' },
  { text: 'Solve et coagula', lang: 'la', gloss: 'Dissolve the layout and bind it again' },
  { text: 'ॐ', lang: 'sa', gloss: 'the first sound, before the first stylesheet' },
  { text: 'तत् त्वम् असि', lang: 'sa', gloss: 'tat tvam asi: thou art that element' },
  { text: 'ह्रीं श्रीं क्लीं', lang: 'sa', gloss: 'hrim shrim klim: three seeds for three origins' },
  { text: 'नेति नेति', lang: 'sa', gloss: 'neti neti: not this, not this, the way of :not()' },
  { text: 'אין סוף', lang: 'he', gloss: 'Ein Sof: the page without end' },
  { text: 'א ב ג', lang: 'he', gloss: 'the first letters, before the Word was styled' },
  { text: 'ΑΩ', lang: 'el', gloss: 'Alpha and Omega: ::before and ::after' },
  { text: 'γνῶθι σεαυτόν', lang: 'el', gloss: 'Know thy computed style' },
  { text: 'Λόγος', lang: 'el', gloss: 'the Word, the author stylesheet' },
  { text: 'ⰀⰁⰂ', lang: 'cu', gloss: 'Az, Buki, Vedi: I know the letters' },
  { text: 'Азъ буки вѣди', lang: 'cu', gloss: 'I know the letters' },
  { text: 'Ol sonf vorsg', lang: 'enochian', gloss: 'I reign over you, said the Root' },
  { text: 'Zodacare od zodameranu', lang: 'enochian', gloss: 'Move therefore, and show yourselves' },
  { text: 'Madriax', lang: 'enochian', gloss: 'O ye heavens, O ye layers' },
  { text: 'ༀ མ ཎི པདྨེ ཧཱུྃ', lang: 'bo', gloss: 'the jewel in the lotus, the content in the box' },
  { text: '無', lang: 'ja', gloss: 'mu: display: none' },
]

// Seed syllables and invented mantras for the Ashram and the chants of the audio layer.
export const BIJA = ['om', 'hrim', 'shrim', 'klim', 'aim', 'hum', 'phat', 'lam', 'vam', 'ram', 'yam', 'ham']
export const INVENTED_MANTRAS = [
  'om margin padding border om',
  'flex grid flex grid hum',
  'cascade descend cascade descend',
  'z z z index om',
  'root rem root rem aim',
  'neti neti not not',
]

// Alchemical and planetary signs (Unicode). Some need a font; faces should fall back gracefully.
export const SIGNS = {
  planets: ['☉', '☽', '☿', '♀', '♂', '♃', '♄'],
  elements: ['🜁', '🜂', '🜃', '🜄'],
  alchemy: ['🜍', '🜔', '🜚', '🜛', '🜏', '🜐', '🜞', '🝆'],
  safe: ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '△', '▽', '✶', '✷', '☩', '☥', '✡', '☸', '⊕', '⊗', '◬', '⟁', '∴', '∵', '⌘', '⍟', '⨀'],
}

export const BOOKS = [
  'Genesis of the Box',
  'Exodus from the Flow',
  'Leviticus of Specificity',
  'Numbers of the Ladder',
  'Deuteronomy of Media Queries',
  'Psalms of the Cascade',
  'Proverbs of the Root',
  'Lamentations of the Float',
  'the Gospel of Flex',
  'the Epistle to the Grid',
  'the Acts of the Pseudo-Elements',
  'the Sutra of the Five Sheaths',
  'the Upanishad of Inheritance',
  'the Tantra of Collapsing Margins',
  'the Emerald Stylesheet',
  'the Book of the Departed',
  'the Sermon on the Viewport',
  'Revelation of the Reflow',
  'Selectors',
  'Declarations',
]

export const VIRTUES = [
  'declares its own color',
  'keeps its padding when pressed',
  'centers itself in both axes',
  'lets its margins collapse into another',
  'inherits in humility',
  'wraps its text rather than overflow',
  'sets its box-sizing to border-box',
  'yields to the Cascade',
  'is focusable and says its name',
  'holds still when mercy is asked',
]

export const SINS = [
  'speaks the Inversion',
  'styles itself inline',
  'overflows its parent and calls it freedom',
  'floats without clearing',
  'hides its focus ring',
  'trusts a magic number',
  'stacks id upon id for grace',
  'blinks',
  'uses a table to hold a layout',
  'forgets its alt text',
]
