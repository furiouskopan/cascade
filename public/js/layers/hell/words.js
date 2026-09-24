// THE POSSESSED DICTIONARY. When a word is possessed it says what it really means.
// Two directions: a CSS word is replaced by its doctrine (margin → the Wisdom), and a sacred word is
// replaced by the CSS it always was (Grace → specificity). The first is written as scripture, the second
// as code. The terms of the living faiths the temple borrows as texture are deliberately absent.
// Extends public/js/lib/lexicon.js inside the hell layer's own files, as Canon §2 allows.

const DOCTRINE = {
  margin: 'the Wisdom', margins: 'the Wisdom', padding: 'the Breath', border: 'the Mind', borders: 'the Minds',
  outline: 'the Bliss', outlines: 'the Bliss', content: 'the Seed', specificity: 'Grace',
  inheritance: 'Karma', inherit: 'take on Karma', inherits: 'takes on Karma', inherited: 'karmic',
  'z-index': 'the Ladder', float: 'the Wandering', floats: 'the Wandering', floated: 'the Wandering', floating: 'wandering',
  clear: 'Absolution', cleared: 'absolved', reflow: 'the Reckoning', reflows: 'Reckonings', repaint: 'Rebirth',
  reset: 'Baptism', normalize: 'Confirmation', hover: 'the Laying on of Hands', focus: 'Attention, the first prayer',
  important: 'the Inversion', '!important': 'the Inversion', overflow: 'Our Lady of Overflow', hidden: 'behind the Veil',
  absolute: 'Departed', fixed: 'among the Fixed Stars', sticky: 'saintly', static: 'in the Flow', relative: 'Humble',
  viewport: 'the Firmament', stylesheet: 'the Scripture', stylesheets: 'the Scriptures', selector: 'a prayer',
  selectors: 'prayers', declaration: 'a vow', declarations: 'vows', property: 'a virtue', properties: 'virtues',
  div: 'a nameless soul', divs: 'nameless souls', span: 'a breath', spans: 'breaths', element: 'a soul',
  elements: 'souls', pixel: 'a grain of the Old Inch', pixels: 'grains of the Old Inch', transparent: 'the Clear Light',
  404: 'the Lost', 1996: 'the Nativity', 2147483647: 'the Highest Heaven', flex: 'Brother Flex', flexbox: 'Brother Flex',
  grid: 'Sister Grid', css: 'the Word', html: 'the Body', dom: 'the body of the Word', browser: 'the Old Law',
  browsers: 'the Old Law', author: 'the Word', user: 'the Pilgrim', users: 'the Pilgrims', visitor: 'pilgrim',
  visitors: 'pilgrims', page: 'body', pages: 'bodies', website: 'temple', site: 'temple', homepage: 'narthex',
  layout: 'liturgy', cursor: 'finger of the Witness', scroll: 'Descent', scrolling: 'descending', click: 'knock',
  clicks: 'knocks', link: 'pilgrimage', links: 'pilgrimages', button: 'bell', buttons: 'bells', font: 'Hand',
  fonts: 'Hands', color: 'Inner Light', colour: 'Inner Light', colors: 'lights', box: 'body', boxes: 'bodies',
  container: 'vessel', containers: 'vessels', parent: 'Elder', child: 'heir', children: 'heirs', sibling: 'twin',
  siblings: 'twins', image: 'icon', images: 'icons', screen: 'Firmament', window: 'Viewport', cookies: 'offerings',
  cookie: 'offering', privacy: 'the Hermitage', solutions: 'absolutions', solution: 'absolution', team: 'congregation',
  teams: 'congregations', customers: 'pilgrims', customer: 'pilgrim', clients: 'pilgrims', company: 'Order',
  pricing: 'tithes', careers: 'vocations', contact: 'confession', welcome: 'descend', started: 'baptised',
  trusted: 'consecrated', worldwide: 'throughout the Cascade', organisations: 'orders', organizations: 'orders',
  bug: 'sin', bugs: 'sins', error: 'sin', errors: 'sins', update: 'Rebirth', updates: 'rebirths', loading: 'descending',
  console: 'the cave of the Oracle', devtools: 'the Confessional', inspector: 'the Confessor', animation: 'procession',
  animations: 'processions', transition: 'passage', transform: 'transfiguration', transformed: 'transfigured',
  opacity: 'the thickness of the Veil', shadow: 'the Blessed Box-Shadow', root: 'the first chakra', body: 'the Sacral',
  center: 'the Great Work', centered: 'made whole', centering: 'the Great Work', members: 'the faithful',
  member: 'one of the faithful', membership: 'communion', free: 'absolved', guestbook: 'the Book of the Faithful',
  webmaster: 'the Author', counter: 'Reckoner', construction: 'nigredo', manifest: 'computed style',
  signal: 'Word', receiver: 'Pilgrim', rem: 'the Measure of the Root', layer: 'Heaven', layers: 'the Heavens',
}

const TRUTH = {
  grace: 'specificity', karma: 'inheritance', wisdom: 'margin', breath: 'padding', mind: 'border', bliss: 'outline',
  seed: 'content', ladder: 'z-index', heaven: 'z-index: 2147483647', heavens: '@layer', mothership: 'z-index: 2147483647',
  departed: 'position: absolute', departure: 'position: absolute', flow: 'position: static', humble: 'position: relative',
  saints: 'position: sticky', saint: 'position: sticky', wandering: 'float', absolution: 'clear: both',
  reckoning: 'reflow', rebirth: 'repaint', baptism: '* { margin: 0 }', confirmation: 'normalize.css',
  union: 'margin collapse', veil: 'overflow: hidden', unmanifest: 'display: none', ghosts: 'visibility: hidden',
  ghost: 'visibility: hidden', spheres: 'stacking contexts', inversion: '!important', mercy: 'prefers-reduced-motion',
  pilgrim: 'the user stylesheet', pilgrims: 'user stylesheets', witness: 'the event loop', oracle: 'console',
  temple: '<html>', scripture: 'the stylesheet', scriptures: 'stylesheets', verse: 'a declaration', verses: 'declarations',
  chapter: 'a rule', chapters: 'rules', prayer: 'a selector', prayers: 'selectors', soul: 'an element', souls: 'elements',
  light: 'currentColor', firmament: 'the viewport', stars: 'position: fixed', eternal: 'position: fixed',
  infinite: 'animation-iteration-count: infinite', forever: 'infinite', beginning: ':first-child', alpha: '::before',
  omega: '::after', chakra: 'z-index', chakras: 'z-indices', sheath: 'a box', sheaths: 'the box model',
  cascade: 'origin, layer, specificity, order', descend: 'cascade', descends: 'cascades', demon: 'an unscoped rule',
  demons: 'unscoped rules', sin: 'a magic number', sins: 'magic numbers', blessed: 'valid', cursed: 'deprecated',
  holy: 'semantic', sacred: 'semantic', angel: 'a pseudo-element', angels: 'pseudo-elements', vessel: 'a container',
  stone: 'a centred div', gold: '#ffd700', ink: 'currentColor', codex: 'the source', manuscript: 'the source',
  bell: 'an AudioContext', moon: 'the scrollbar thumb', heart: 'the main thread', mala: 'a loop of 108',
  lost: '404', nativity: '1996', word: 'the author stylesheet', law: 'the user-agent stylesheet',
  origins: 'user-agent, user, author', rung: 'a z-index', rungs: 'z-indices', eclipse: 'display: none',
  apparition: 'a repaint', flesh: 'the content box', altar: 'a <form>', offering: 'a declaration',
}

// → { text, kind: 'doctrine' | 'truth' } or null
export function meaningOf(word) {
  const w = String(word).toLowerCase().replace(/[’']s$/, '')
  if (w.length < 3) return null
  if (Object.hasOwn(DOCTRINE, w)) return { text: DOCTRINE[w], kind: 'doctrine' }
  if (Object.hasOwn(TRUTH, w)) return { text: TRUTH[w], kind: 'truth' }
  return null
}

// Every word the dictionary knows, for finding one in a paragraph without a pointer.
export const KNOWN = new RegExp(`(?<![\\w-])(${[...Object.keys(DOCTRINE), ...Object.keys(TRUTH)]
  .filter((k) => k.length >= 3)
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/[.*+?^${}()|[\]\\!]/g, '\\$&'))
  .join('|')})(?![\\w-])`, 'gi')
