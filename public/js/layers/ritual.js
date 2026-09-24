// THE ALTAR. The shared ritual of the Cascade (docs/CANON.md §7).
//
//   ctx.ritual = { state, pray(), offer(selector, property, value), inscribe(text), refresh(),
//                  open(tab?), close(), toggle(), grammar }
//
// Three rites, performed together by everyone who is in the temple at once:
//   PRAY      one bead on the world's mala. Every 108th prayer covers the sun for 33 seconds (the Eclipse).
//   OFFER     one CSS declaration to the Living Canon. The last 33 are applied to every visitor's temple.
//   INSCRIBE  words for strangers on the Wall, shown in the glyph script (they copy as English).
//
// Part I is THE GRAMMAR OF OFFERINGS: pure functions, no DOM at module level. The server imports it from
// this very file (server/routes/ritual.js), so the temple and the altar obey one law and cannot drift apart.
// Visitors never write CSS. They choose a congregation and a property from fixed lists and speak a value
// that must parse; the CSS is then composed from the parsed pieces, never from the string they typed.
// Part II is the altar itself.

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// I. THE GRAMMAR OF OFFERINGS
// ─────────────────────────────────────────────────────────────────────────────────────────────────────

export const LIMITS = Object.freeze({
  canon: 33, // declarations applied to every temple (the Age of Ascent)
  keep: 333, // offerings the server remembers; older ones are fulfilled and forgotten
  wall: 108, // messages kept on the Wall (the beads of the mala)
  wallMin: 3,
  wallMax: 80,
  wallRaw: 400, // longest raw text even considered
  valueMax: 64, // longest raw value even considered
  eclipseEvery: 108,
  eclipseMs: 33_000,
  offerCooldownMs: 10 * 60_000,
  wallCooldownMs: 5 * 60_000,
  prayPerMinute: 30,
})

// The Word that is hidden is spared: no offering may touch the Inscription, the Rosetta or the Ladder,
// because the rabbit hole (§6) must stay legible for every pilgrim.
const SPARE = ':not([data-inscription], [data-inscription] *, .rosetta, .rosetta *, #ladder, #ladder *)'
const NOT_GLYPH = ':not(.glyph, .glyph *)' // fonts and cases never touch glyph text (it would turn to tofu)
const NOT_FOCUS = ':not(:focus-visible)' // an offered outline never hides the focus ring

const target = (label, show, base, gloss, pseudo = '') => Object.freeze({ label, show, base, gloss, pseudo })

// The congregations. Logical names on the wire, scoped selectors only here, always under #temple.
export const TARGETS = Object.freeze({
  headings: target('headings', '#temple :is(h1,h2,h3,h4,h5,h6)', '#temple :is(h1, h2, h3, h4, h5, h6)', 'the Titles, h1 to h6'),
  paragraphs: target('paragraphs', '#temple p', '#temple p', 'the Body of the Word'),
  links: target('links', '#temple a', '#temple a', 'the Roads'),
  buttons: target('buttons', '#temple button', '#temple button', 'the Bells: every summoning thing'),
  glyphs: target('glyphs', '#temple .glyph', '#temple .glyph', 'the Private Letters (never the Inscription)'),
  sigils: target('sigils', '#temple svg', '#temple :is(svg, .sigil)', 'the Drawn Names'),
  selection: target('selection', '#temple ::selection', '#temple *', 'what the Pilgrim holds', '::selection'),
  lists: target('lists', '#temple li', '#temple li', 'the Litanies'),
  quotes: target('quotes', '#temple blockquote', '#temple :is(blockquote, q)', 'the Sayings'),
  emphasis: target('emphasis', '#temple :is(em,strong,mark)', '#temple :is(em, strong, mark, b, i)', 'the Raised Voice'),
  code: target('code', '#temple code', '#temple :is(code, kbd, samp, pre)', 'the Plain Tongue'),
  'first-letters': target('first letters', '#temple p::first-letter', '#temple p', 'the Initials', '::first-letter'),
})

const ALL = Object.keys(TARGETS)
const TEXTUAL = ['headings', 'paragraphs', 'links', 'buttons', 'glyphs', 'lists', 'quotes', 'emphasis', 'code', 'first-letters']
const BODIES = ['headings', 'paragraphs', 'links', 'buttons', 'glyphs', 'sigils', 'lists', 'quotes', 'emphasis', 'code']
const BLOCKS = ['headings', 'paragraphs', 'lists', 'quotes']
const UNGLYPHED = TEXTUAL.filter((t) => t !== 'glyphs')
const SOFT = new Set(['sigils', 'glyphs', 'headings', 'buttons']) // may be blurred up to 2px; the rest 0.6px
const HARD = new Set(['sigils', 'buttons']) // may be inverted fully; text only by 0.3
const TILT = { headings: 12, buttons: 12, sigils: 12, glyphs: 12, paragraphs: 3, lists: 3, quotes: 3, code: 3 }

class Heresy extends Error {}
const heresy = (message) => {
  throw new Heresy(message)
}

const NUM = /^-?(?:\d{1,4}(?:\.\d{1,4})?|\.\d{1,4})$/
const DIM = /^(-?(?:\d{1,4}(?:\.\d{1,4})?|\.\d{1,4}))([a-z%]{0,4})$/

function fmt(n) {
  const r = Math.round(n * 1000) / 1000
  return Object.is(r, -0) ? '0' : String(r)
}

function units(ranges) {
  return Object.entries(ranges).map(([u, [a, b]]) => `${fmt(a)}${u} to ${fmt(b)}${u}`).join(', or ')
}

function num(tok, min, max, name) {
  if (!NUM.test(tok)) heresy(`${name} must be a plain number from ${fmt(min)} to ${fmt(max)}.`)
  const n = Number(tok)
  if (!(n >= min && n <= max)) heresy(`${name} must lie between ${fmt(min)} and ${fmt(max)}. The Cascade is generous, not infinite.`)
  return n
}

// dim('0.3em', { em: [-0.1, 0.5] }, 'letter-spacing') -> '0.3em'. A bare 0 takes the first unit.
function dim(tok, ranges, name) {
  const m = DIM.exec(tok)
  if (!m) heresy(`${name} wants a number and a unit: ${units(ranges)}.`)
  const n = Number(m[1])
  const unit = m[2]
  if (unit === '' && n === 0) return `0${Object.keys(ranges)[0]}`
  if (!Object.hasOwn(ranges, unit)) heresy(unit ? `${name} does not know the unit "${unit}". It knows ${units(ranges)}.` : `${name} needs a unit: ${units(ranges)}.`)
  const [min, max] = ranges[unit]
  if (!(n >= min && n <= max)) heresy(`${name} must lie between ${fmt(min)}${unit} and ${fmt(max)}${unit}. The Cascade is generous, not infinite.`)
  return fmt(n) + unit
}

// 0.5 or 50% -> 0.5
function amount(tok, min, max, name) {
  const pct = /^(\d{1,3}(?:\.\d{1,4})?|\.\d{1,4})%$/.exec(tok)
  const n = pct ? Number(pct[1]) / 100 : NUM.test(tok) ? Number(tok) : NaN
  if (!Number.isFinite(n)) heresy(`${name}() takes a number or a percentage.`)
  if (!(n >= min && n <= max)) heresy(`${name}() must lie between ${fmt(min)} and ${fmt(max)}.`)
  return fmt(n)
}

function kw(tok, list, name) {
  if (!list.includes(tok)) heresy(`${name} knows only: ${list.join(', ')}.`)
  return tok
}

// Split on spaces outside parentheses. Parentheses may not nest: nothing is called from inside a call.
function splitTop(v) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of v) {
    if (ch === '(') {
      depth++
      if (depth > 1) heresy('No call may be nested inside another.')
    } else if (ch === ')') {
      depth--
      if (depth < 0) heresy('A parenthesis closes that never opened.')
    }
    if (ch === ' ' && depth === 0) {
      if (cur) out.push(cur)
      cur = ''
    } else cur += ch
  }
  if (depth !== 0) heresy('A parenthesis opens and never closes.')
  if (cur) out.push(cur)
  return out
}

function single(v, name) {
  const t = splitTop(v)
  if (t.length !== 1) heresy(`${name} takes a single value.`)
  return t[0]
}

const NAMED = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood ' +
  'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen ' +
  'darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray ' +
  'darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia ' +
  'gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender ' +
  'lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink ' +
  'lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon ' +
  'mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise ' +
  'mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid ' +
  'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red ' +
  'rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow ' +
  'springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen').split(' '))

const COLOR_HINT = 'a #hex colour (#c9a227), a colour name (crimson) or hsl(40 70% 50%)'

function color(tok) {
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/.test(tok)) return tok
  if (NAMED.has(tok)) return tok
  if (tok === 'transparent') heresy('transparent is the Clear Light. It cannot be offered, only received.')
  if (tok === 'currentcolor' || tok === 'inherit' || tok === 'initial' || tok === 'unset' || tok === 'revert') heresy('Karma already gives every element its inheritance. Offer a colour of your own.')
  if (/^rgba?\(/.test(tok) || /^(?:hwb|lab|lch|oklab|oklch|color)\(/.test(tok)) heresy(`That tongue is not spoken at this altar. Offer ${COLOR_HINT}.`)
  const m = /^hsla?\(([0-9a-z.%,/ -]{1,48})\)$/.exec(tok)
  if (m) {
    const parts = m[1].replace(/[,/]/g, ' ').trim().split(/ +/)
    if (parts.length === 3 || parts.length === 4) {
      const hue = /^(\d{1,3}(?:\.\d{1,3})?)(?:deg)?$/.exec(parts[0])
      const sat = /^(\d{1,3}(?:\.\d{1,3})?)%$/.exec(parts[1])
      const lit = /^(\d{1,3}(?:\.\d{1,3})?)%$/.exec(parts[2])
      if (hue && sat && lit) {
        const H = Number(hue[1])
        const S = Number(sat[1])
        const L = Number(lit[1])
        if (H > 360 || S > 100 || L > 100) heresy('hsl() takes a hue from 0 to 360, then saturation and lightness from 0% to 100%.')
        let alpha = ''
        if (parts[3] !== undefined) {
          const a = amount(parts[3], 0, 1, 'the alpha of hsl')
          if (Number(a) < 0.5) heresy('An offering may be faint, but not fainter than half. Alpha must be at least 0.5.')
          if (Number(a) < 1) alpha = ` / ${a}`
        }
        return `hsl(${fmt(H)} ${fmt(S)}% ${fmt(L)}%${alpha})`
      }
    }
    heresy('hsl() is spoken thus: hsl(40 70% 50%), or with a faintness: hsl(40 70% 50% / 0.8).')
  }
  heresy(`That is not a colour the Cascade knows. Offer ${COLOR_HINT}.`)
}

const looksLikeColor = (tok) => /^[#a-z]/.test(tok)

const FONTS = Object.fromEntries([
  ['serif', 'serif'],
  ['sans-serif', 'sans-serif'],
  ['monospace', 'monospace'],
  ['cursive', 'cursive'],
  ['fantasy', 'fantasy'],
  ['system-ui', 'system-ui'],
  ['Georgia', "Georgia, 'Times New Roman', serif"],
  ['Palatino', "'Palatino Linotype', Palatino, 'Book Antiqua', serif"],
  ['Garamond', "Garamond, 'EB Garamond', 'Palatino Linotype', serif"],
  ['Times New Roman', "'Times New Roman', Times, serif"],
  ['Comic Sans MS', "'Comic Sans MS', 'Comic Neue', cursive"],
  ['Courier New', "'Courier New', Courier, monospace"],
  ['Impact', "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif"],
  ['Trebuchet MS', "'Trebuchet MS', 'Segoe UI', sans-serif"],
  ['Verdana', 'Verdana, Geneva, sans-serif'],
  ['Cascade Glyphs', "'Cascade Glyphs', serif"],
].map(([name, stack]) => [name.toLowerCase(), Object.freeze({ name, stack })]))
const GLYPH_FONT_TARGETS = ['headings', 'emphasis', 'first-letters']

const TEXT_DECO_LINES = ['none', 'underline', 'overline', 'line-through']
const TEXT_DECO_STYLES = ['solid', 'double', 'dotted', 'dashed', 'wavy']
const OUTLINE_STYLES = ['solid', 'dotted', 'dashed', 'double', 'groove', 'ridge', 'inset', 'outset']
const EMPHASIS_FILL = ['filled', 'open']
const EMPHASIS_SHAPES = ['dot', 'circle', 'double-circle', 'triangle', 'sesame']
const CURSORS = ['auto', 'default', 'pointer', 'wait', 'progress', 'help', 'crosshair', 'cell', 'text', 'vertical-text', 'alias', 'copy', 'move',
  'no-drop', 'not-allowed', 'grab', 'grabbing', 'zoom-in', 'zoom-out', 'col-resize', 'row-resize', 'all-scroll', 'context-menu']
const LIST_STYLES = ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman', 'lower-greek', 'lower-alpha',
  'upper-alpha', 'hebrew', 'armenian', 'georgian', 'devanagari', 'bengali', 'gujarati', 'gurmukhi', 'kannada', 'malayalam', 'tamil',
  'telugu', 'thai', 'lao', 'khmer', 'myanmar', 'tibetan', 'mongolian', 'persian', 'arabic-indic', 'cjk-ideographic',
  'cjk-heavenly-stem', 'cjk-earthly-branch', 'hiragana', 'katakana', 'disclosure-open', 'disclosure-closed', 'none']
const CAPS = ['normal', 'small-caps', 'all-small-caps', 'petite-caps', 'all-petite-caps', 'unicase', 'titling-caps']
const DICE_COLORS = ['crimson', 'gold', 'goldenrod', 'indigo', 'teal', 'orchid', 'tomato', 'slateblue', 'seagreen', 'darkorange',
  'deeppink', 'royalblue', 'firebrick', 'darkviolet', 'cadetblue', 'peru', 'olivedrab', 'mediumvioletred', '#c9a227', '#9e1b1b', '#4b3fa0']

const SH_OFF = { em: [-0.15, 0.15], px: [-4, 4] }
const SH_BLUR = { px: [0, 12], em: [0, 0.5] }
const BOX_OFF = { px: [-8, 8], em: [-0.5, 0.5] }
const BOX_BLUR = { px: [0, 24], em: [0, 1.5] }
const BOX_SPREAD = { px: [-4, 8], em: [-0.25, 0.5] }

function sampleColor(r) {
  return r.chance(0.55) ? r.pick(DICE_COLORS) : `hsl(${r.int(0, 359)} ${r.int(35, 90)}% ${r.int(32, 70)}%)`
}
const round2 = (n) => fmt(Math.round(n * 100) / 100)

function filterFn(tok, t) {
  const m = /^([a-z-]{3,12})\(([^()]{1,14})\)$/.exec(tok)
  if (!m) heresy('filter takes one or two calls, such as hue-rotate(90deg) or sepia(0.6).')
  const [, fn, raw] = m
  const arg = raw.trim()
  switch (fn) {
    case 'hue-rotate': return `hue-rotate(${dim(arg, { deg: [-360, 360], turn: [-1, 1] }, 'hue-rotate()')})`
    case 'blur': return `blur(${dim(arg, SOFT.has(t) ? { px: [0, 2] } : { px: [0, 0.6] }, 'blur()')})`
    case 'invert': return `invert(${amount(arg, 0, HARD.has(t) ? 1 : 0.3, 'invert')})`
    case 'sepia': return `sepia(${amount(arg, 0, 1, 'sepia')})`
    case 'saturate': return `saturate(${amount(arg, 0, 3, 'saturate')})`
    case 'grayscale': return `grayscale(${amount(arg, 0, 1, 'grayscale')})`
    case 'brightness': return `brightness(${amount(arg, 0.7, 1.3, 'brightness')})`
    case 'contrast': return `contrast(${amount(arg, 0.8, 1.5, 'contrast')})`
    default: return heresy(`${fn}() is not among the permitted filters: hue-rotate, blur, invert, sepia, saturate, grayscale, brightness, contrast.`)
  }
}

function sampleFilter(r, t) {
  const pool = [
    () => `hue-rotate(${r.int(15, 345)}deg)`,
    () => `sepia(${round2(r.float(0.2, 0.9))})`,
    () => `saturate(${round2(r.float(0.2, 2.6))})`,
    () => `grayscale(${round2(r.float(0.3, 1))})`,
    () => `blur(${round2(r.float(0.2, SOFT.has(t) ? 1.6 : 0.5))}px)`,
    () => `invert(${round2(r.float(0.1, HARD.has(t) ? 1 : 0.3))})`,
    () => `contrast(${round2(r.float(0.85, 1.4))})`,
  ]
  const [a, b] = r.shuffle(pool)
  return r.chance(0.35) ? `${a()} ${b()}` : a()
}

const P = Object.create(null)
const define = (name, def) => {
  P[name] = Object.freeze(def)
}

define('color', {
  targets: ALL,
  hint: (t) => t === 'selection'
    ? `${COLOR_HINT}.`
    : `${COLOR_HINT}. Karma tempers it: the element keeps 55% of what it inherited.`,
  parse: (v) => color(single(v, 'color')),
  css: (v, t) => (t === 'selection' ? v : `color-mix(in oklab, ${v} 45%, currentColor)`),
  sample: (r) => sampleColor(r),
})
define('background-color', {
  targets: ['selection', 'emphasis', 'code', 'first-letters'],
  hint: (t) => t === 'selection' ? `${COLOR_HINT}.` : `${COLOR_HINT}. Laid on as a veil of 40%, so the Word still shows through.`,
  parse: (v) => color(single(v, 'background-color')),
  css: (v, t) => (t === 'selection' ? v : `color-mix(in oklab, ${v} 40%, transparent)`),
  sample: (r) => sampleColor(r),
})
define('text-shadow', {
  targets: [...TEXTUAL, 'selection'],
  hint: () => 'x y [blur] colour: offsets up to ±0.15em (±4px), blur up to 12px. e.g. 0.05em 0.05em 6px gold',
  parse: (v) => {
    const t = splitTop(v)
    if (t.length < 3 || t.length > 4) heresy('text-shadow takes x, y, an optional blur, and a colour: 0.05em 0.05em 6px gold.')
    const c = color(looksLikeColor(t[0]) ? t.shift() : t.pop())
    if (t.length < 2 || t.length > 3) heresy('text-shadow takes x, y, an optional blur, and a colour.')
    const [x, y, b = '0'] = t
    return `${dim(x, SH_OFF, "the shadow's x")} ${dim(y, SH_OFF, "the shadow's y")} ${dim(b, SH_BLUR, "the shadow's blur")} ${c}`
  },
  sample: (r) => `${r.pick(['0', '0.04em', '-0.04em', '0.08em', '1px', '-2px'])} ${r.pick(['0', '0.04em', '0.08em', '1px', '2px'])} ${r.int(0, 12)}px ${sampleColor(r)}`,
})
define('box-shadow', {
  targets: ['buttons', 'quotes', 'code'],
  hint: () => '[inset] x y [blur [spread]] colour: offsets ±8px, blur to 24px, spread −4px to 8px. e.g. 0 0 18px 2px gold',
  parse: (v) => {
    const t = splitTop(v)
    const inset = t[0] === 'inset'
    if (inset) t.shift()
    if (t.length < 3 || t.length > 5) heresy('box-shadow takes [inset] x y [blur [spread]] and a colour.')
    const c = color(looksLikeColor(t[0]) ? t.shift() : t.pop())
    if (t.length < 2 || t.length > 4) heresy('box-shadow takes [inset] x y [blur [spread]] and a colour.')
    const [x, y, b = '0', s] = t
    const parts = [dim(x, BOX_OFF, "the shadow's x"), dim(y, BOX_OFF, "the shadow's y"), dim(b, BOX_BLUR, "the shadow's blur")]
    if (s !== undefined) parts.push(dim(s, BOX_SPREAD, "the shadow's spread"))
    return `${inset ? 'inset ' : ''}${parts.join(' ')} ${c}`
  },
  sample: (r) => `${r.chance(0.3) ? 'inset ' : ''}${r.int(-3, 3)}px ${r.int(-3, 4)}px ${r.int(4, 24)}px ${r.int(-2, 6)}px ${sampleColor(r)}`,
})
define('letter-spacing', {
  targets: TEXTUAL,
  hint: () => '-0.1em to 0.5em, or normal. e.g. 0.3em',
  parse: (v) => (v === 'normal' ? v : dim(single(v, 'letter-spacing'), { em: [-0.1, 0.5] }, 'letter-spacing')),
  sample: (r) => `${round2(r.float(-0.06, 0.45))}em`,
})
define('word-spacing', {
  targets: BLOCKS,
  hint: () => '0em to 1em, or normal. e.g. 0.6em',
  parse: (v) => (v === 'normal' ? v : dim(single(v, 'word-spacing'), { em: [0, 1] }, 'word-spacing')),
  sample: (r) => `${round2(r.float(0.1, 1))}em`,
})
define('line-height', {
  targets: BLOCKS,
  hint: () => 'a plain number from 1.1 to 2.4, or normal. e.g. 1.9',
  parse: (v) => (v === 'normal' ? v : fmt(num(single(v, 'line-height'), 1.1, 2.4, 'line-height'))),
  sample: (r) => round2(r.float(1.2, 2.3)),
})
define('text-indent', {
  targets: ['paragraphs', 'quotes'],
  hint: () => '0em to 4em. e.g. 2em',
  parse: (v) => dim(single(v, 'text-indent'), { em: [0, 4] }, 'text-indent'),
  sample: (r) => `${r.int(1, 4)}em`,
})
define('text-align', {
  targets: BLOCKS,
  hint: () => 'left, right, center, justify, start or end',
  parse: (v) => kw(v, ['left', 'right', 'center', 'justify', 'start', 'end'], 'text-align'),
  sample: (r) => r.pick(['left', 'right', 'center', 'justify']),
})
define('text-transform', {
  targets: UNGLYPHED,
  scope: NOT_GLYPH,
  hint: () => 'none, uppercase, lowercase or capitalize',
  parse: (v) => kw(v, ['none', 'uppercase', 'lowercase', 'capitalize'], 'text-transform'),
  sample: (r) => r.pick(['uppercase', 'lowercase', 'capitalize']),
})
define('font-style', {
  targets: TEXTUAL,
  hint: () => 'normal, italic, oblique, or oblique with an angle from -14deg to 14deg',
  parse: (v) => {
    const t = splitTop(v)
    if (t.length === 1) return kw(t[0], ['normal', 'italic', 'oblique'], 'font-style')
    if (t.length === 2 && t[0] === 'oblique') return `oblique ${dim(t[1], { deg: [-14, 14] }, 'the oblique angle')}`
    return heresy('font-style is normal, italic, oblique, or oblique 10deg.')
  },
  sample: (r) => r.pick(['italic', 'oblique', `oblique ${r.int(-14, 14)}deg`, 'normal']),
})
define('font-weight', {
  targets: TEXTUAL,
  hint: () => '100 to 900 in hundreds, or normal, bold, lighter, bolder',
  parse: (v) => {
    const w = single(v, 'font-weight')
    if (['normal', 'bold', 'lighter', 'bolder'].includes(w)) return w
    if (!/^[1-9]00$/.test(w)) heresy('font-weight is counted in hundreds, from 100 to 900, or is normal, bold, lighter, bolder.')
    return w
  },
  sample: (r) => r.pick(['100', '300', '700', '900', 'bold', 'lighter']),
})
define('font-variant-caps', {
  targets: UNGLYPHED,
  scope: NOT_GLYPH,
  hint: () => CAPS.join(', '),
  parse: (v) => kw(v, CAPS, 'font-variant-caps'),
  sample: (r) => r.pick(CAPS.slice(1)),
})
define('font-family', {
  targets: UNGLYPHED,
  scope: NOT_GLYPH,
  hint: (t) => `one name from the list, without quotes: ${Object.values(FONTS).filter((f) => f.name !== 'Cascade Glyphs' || GLYPH_FONT_TARGETS.includes(t)).map((f) => f.name).join(', ')}`,
  parse: (v, t) => {
    const f = Object.hasOwn(FONTS, v) ? FONTS[v] : null
    if (!f) heresy('That font is not in the Canon. Name one from the list, without quotes: Georgia, Palatino, Garamond, Comic Sans MS, Impact...')
    if (f.name === 'Cascade Glyphs' && !GLYPH_FONT_TARGETS.includes(t)) heresy('The glyph script may be offered only to headings, emphasis and first letters. The Word must stay readable.')
    return f.name
  },
  css: (v) => FONTS[v.toLowerCase()].stack,
  sample: (r, t) => r.pick(Object.values(FONTS).filter((f) => f.name !== 'Cascade Glyphs' || GLYPH_FONT_TARGETS.includes(t)).map((f) => f.name)),
})
define('font-size', {
  targets: ['first-letters'],
  hint: () => '1em to 2.2em: an illuminated initial. e.g. 1.8em',
  parse: (v) => dim(single(v, 'font-size'), { em: [1, 2.2] }, 'font-size'),
  sample: (r) => `${round2(r.float(1.2, 2.2))}em`,
})
define('text-decoration', {
  targets: TEXTUAL,
  hint: () => `a line (${TEXT_DECO_LINES.join(', ')}), then optionally a style (${TEXT_DECO_STYLES.join(', ')}) and a colour. e.g. underline wavy crimson`,
  parse: (v) => {
    const t = splitTop(v)
    if (!t.length || t.length > 3) heresy('text-decoration is a line, then optionally a style and a colour: underline wavy crimson.')
    const out = [kw(t[0], TEXT_DECO_LINES, 'the line of text-decoration')]
    let i = 1
    if (t[i] !== undefined && TEXT_DECO_STYLES.includes(t[i])) out.push(t[i++])
    if (t[i] !== undefined) out.push(color(t[i++]))
    if (i !== t.length) heresy('text-decoration is a line, then optionally a style and a colour: underline wavy crimson.')
    if (out[0] === 'none' && out.length > 1) heresy('none needs no style and no colour.')
    return out.join(' ')
  },
  sample: (r) => `${r.pick(['underline', 'overline', 'line-through'])} ${r.pick(TEXT_DECO_STYLES)} ${sampleColor(r)}`,
})
define('text-emphasis-style', {
  targets: ['headings', 'emphasis', 'links', 'glyphs'],
  hint: () => `filled or open, then a shape: ${EMPHASIS_SHAPES.join(', ')}. e.g. open sesame`,
  parse: (v) => {
    const t = splitTop(v)
    if (t.length === 1 && t[0] === 'none') return 'none'
    if (t.length === 1) {
      if (EMPHASIS_FILL.includes(t[0]) || EMPHASIS_SHAPES.includes(t[0])) return t[0]
    } else if (t.length === 2 && EMPHASIS_FILL.includes(t[0]) && EMPHASIS_SHAPES.includes(t[1])) return `${t[0]} ${t[1]}`
    return heresy(`text-emphasis-style is filled or open, then a shape: ${EMPHASIS_SHAPES.join(', ')}.`)
  },
  sample: (r) => `${r.pick(EMPHASIS_FILL)} ${r.pick(EMPHASIS_SHAPES)}`,
})
define('vertical-align', {
  targets: ['links', 'emphasis', 'code', 'glyphs'],
  hint: () => 'baseline, sub, super, middle, text-top or text-bottom',
  parse: (v) => kw(v, ['baseline', 'sub', 'super', 'middle', 'text-top', 'text-bottom'], 'vertical-align'),
  sample: (r) => r.pick(['sub', 'super', 'middle', 'text-top']),
})
define('opacity', {
  targets: BODIES,
  hint: () => '0.5 to 1. Nothing offered may fade past half.',
  parse: (v) => amount(single(v, 'opacity'), 0.5, 1, 'opacity'),
  sample: (r) => round2(r.float(0.55, 0.95)),
})
define('rotate', {
  targets: Object.keys(TILT),
  hint: (t) => `-${TILT[t] ?? 3}deg to ${TILT[t] ?? 3}deg. e.g. ${Math.min(TILT[t] ?? 3, 7)}deg`,
  parse: (v, t) => dim(single(v, 'rotate'), { deg: [-TILT[t], TILT[t]] }, `rotate for ${TARGETS[t].label}`),
  sample: (r, t) => `${round2(r.float(-TILT[t], TILT[t]))}deg`,
})
define('scale', {
  targets: ['headings', 'buttons', 'sigils', 'glyphs', 'quotes'],
  hint: () => 'a plain number from 0.9 to 1.12',
  parse: (v) => fmt(num(single(v, 'scale'), 0.9, 1.12, 'scale')),
  sample: (r) => round2(r.float(0.9, 1.12)),
})
define('filter', {
  targets: BODIES,
  hint: (t) => `one or two of: hue-rotate(0 to 360deg), sepia(0 to 1), saturate(0 to 3), grayscale(0 to 1), blur(to ${SOFT.has(t) ? 2 : 0.6}px), invert(to ${HARD.has(t) ? 1 : 0.3}), brightness(0.7 to 1.3), contrast(0.8 to 1.5)`,
  parse: (v, t) => {
    const fns = splitTop(v)
    if (fns.length < 1 || fns.length > 2) heresy('filter takes one or two calls, such as hue-rotate(90deg) sepia(0.4).')
    const out = fns.map((f) => filterFn(f, t))
    if (out.length === 2 && out[0].split('(')[0] === out[1].split('(')[0]) heresy('Do not call the same filter twice.')
    return out.join(' ')
  },
  sample: (r, t) => sampleFilter(r, t),
})
define('outline', {
  targets: BODIES,
  scope: NOT_FOCUS,
  hint: () => `the Bliss, drawn but taking no space: [1px to 3px] style [colour]. Styles: ${OUTLINE_STYLES.join(', ')}. e.g. 1px dotted gold`,
  parse: (v) => {
    const t = splitTop(v)
    if (!t.length || t.length > 3) heresy('outline is [width] style [colour]: 1px dotted gold.')
    let width = null
    let style = null
    let c = null
    for (const tok of t) {
      if (/^[\d.]/.test(tok)) {
        if (width) heresy('outline takes one width.')
        width = dim(tok, { px: [1, 3] }, 'the outline width')
      } else if (OUTLINE_STYLES.includes(tok)) {
        if (style) heresy('outline takes one style.')
        style = tok
      } else {
        if (c) heresy('outline takes one colour.')
        c = color(tok)
      }
    }
    if (!style) heresy(`outline needs a style: ${OUTLINE_STYLES.join(', ')}.`)
    return [width ?? '1px', style, c].filter(Boolean).join(' ')
  },
  sample: (r) => `${r.int(1, 3)}px ${r.pick(OUTLINE_STYLES)} ${sampleColor(r)}`,
})
define('outline-offset', {
  targets: BODIES,
  scope: NOT_FOCUS,
  hint: () => '0px to 8px. e.g. 4px',
  parse: (v) => dim(single(v, 'outline-offset'), { px: [0, 8], em: [0, 0.5] }, 'outline-offset'),
  sample: (r) => `${r.int(0, 8)}px`,
})
define('border-radius', {
  targets: ['buttons', 'quotes', 'code', 'emphasis', 'sigils'],
  hint: () => '0% to 50%, or 0em to 2em. e.g. 50%',
  parse: (v) => dim(single(v, 'border-radius'), { '%': [0, 50], em: [0, 2], px: [0, 32] }, 'border-radius'),
  sample: (r) => r.chance(0.5) ? `${r.int(0, 50)}%` : `${round2(r.float(0, 2))}em`,
})
define('cursor', {
  targets: BODIES,
  hint: () => `a keyword (not none): ${CURSORS.slice(0, 10).join(', ')}...`,
  parse: (v) => {
    if (v === 'none') heresy('The pointer may not be taken from the Pilgrim.')
    return kw(v, CURSORS, 'cursor')
  },
  sample: (r) => r.pick(CURSORS),
})
define('list-style-type', {
  targets: ['lists'],
  hint: () => 'a counting style: lower-roman, lower-greek, hebrew, georgian, devanagari, tibetan, cjk-ideographic, disclosure-open...',
  parse: (v) => kw(v, LIST_STYLES, 'list-style-type'),
  sample: (r) => r.pick(LIST_STYLES),
})

export const PROPERTIES = P

// Checked in order, before the grammar, so each heresy is named. The grammar would refuse them anyway.
const FORBIDDEN = [
  [/[^\x20-\x7e]/, 'Only the plain printable letters of the Old Law may be offered. Hidden and foreign characters are turned away.'],
  [/url\s*\(/i, 'url( is the Door Outward, and it is sealed. Nothing may be fetched from beyond the temple.'],
  [/expression|javascript|vbscript|behaviou?r|binding|-moz-|-webkit-|-ms-/i, 'The old incantations of the browser wars are not spoken here.'],
  [/\b(?:var|env|attr|calc|min|max|clamp|image|image-set|cross-fade|element|paint|src|counter|counters|format|local)\s*\(/i, 'Only plain values may be offered: no calls that reach elsewhere or reckon for themselves.'],
  [/\\/, 'The backslash escapes, and nothing escapes the Cascade.'],
  [/[;{}]/, 'You may speak one declaration only. Semicolons and braces belong to the Author.'],
  [/\/\*|\*\//, 'No comments. The Canon keeps its own.'],
  [/@/, 'The at-sign summons rules, and offerings may not summon.'],
  [/!/, 'The Inversion is heresy, save in mercy, and mercy is not yours to offer.'],
  [/[<>]/, 'Angle brackets belong to the Word, not to its style.'],
  [/["'`]/, 'No quotes are needed: fonts are called by name, without quotation.'],
  [/:/, 'Speak only the value. The property is already chosen.'],
  [/[^a-z0-9 #%.,()/-]/i, 'Only letters, digits, spaces and # % . , ( ) / - may be offered.'],
]

const refuse = (field, error) => ({ ok: false, field, error })

// The whole law. Returns { ok, selector, property, value (canonical), cssValue, cssSelector, rule } or
// { ok: false, field, error }. Never throws. The canonical value re-validates to itself.
export function validateOffering(selector, property, value) {
  try {
    if (typeof selector !== 'string' || !Object.hasOwn(TARGETS, selector)) return refuse('selector', `No such congregation. Offer to one of: ${ALL.join(', ')}.`)
    if (typeof property !== 'string' || !Object.hasOwn(P, property)) return refuse('property', 'That property is not written in the Canon. Choose one from the list.')
    const def = P[property]
    const t = TARGETS[selector]
    if (!def.targets.includes(selector)) return refuse('property', `The ${t.label} cannot receive ${property}.`)
    if (typeof value !== 'string') return refuse('value', 'An offering is spoken in words, not in things.')
    if (value.length > LIMITS.valueMax) return refuse('value', 'Too long. An offering is at most sixty-four characters: brevity is a sheath of Wisdom.')
    for (const [re, msg] of FORBIDDEN) if (re.test(value)) return refuse('value', msg)
    const v = value.trim().replace(/ {2,}/g, ' ').toLowerCase()
    if (!v) return refuse('value', 'Silence is not an offering. Speak a value.')
    const canonical = def.parse(v, selector)
    const cssValue = def.css ? def.css(canonical, selector) : canonical
    const cssSelector = `html:not([data-mercy="on"]) ${t.base}${SPARE}${def.scope ?? ''}${t.pseudo}`
    return { ok: true, selector, property, value: canonical, cssValue, cssSelector, rule: `${cssSelector} { ${property}: ${cssValue}; }` }
  } catch (e) {
    return refuse('value', e instanceof Heresy ? e.message : 'The Cascade could not read that offering.')
  }
}

export function propertiesFor(selector) {
  return Object.keys(P).filter((p) => P[p].targets.includes(selector))
}

export function hintFor(selector, property) {
  return Object.hasOwn(P, property) && Object.hasOwn(TARGETS, selector) ? P[property].hint(selector) : ''
}

// A value fate would choose, valid by construction. `r` is a kernel rng (pick, int, float, chance, shuffle).
export function sampleValue(selector, property, r) {
  return Object.hasOwn(P, property) ? P[property].sample(r, selector) : ''
}

// The <style id="living-canon"> text. Every rule is re-validated here; the CSS is built only from the
// canonical pieces, and a stored string that does not parse is simply not spoken.
export function buildCanonCss(offerings) {
  const rules = []
  for (const o of Array.isArray(offerings) ? offerings : []) {
    const v = validateOffering(o?.selector, o?.property, o?.value)
    if (v.ok) rules.push(`  ${v.rule}`)
  }
  return `/* THE LIVING CANON. ${rules.length} declaration${rules.length === 1 ? '' : 's'} offered by visitors, re-read by the Cascade before they are spoken. The last word wins. Mercy veils them all. You who read this in the inspector: the altar stands in the lower right corner, and it opens when its name is typed. */\n` +
    `@layer offerings {\n${rules.join('\n')}\n}\n`
}

// THE WALL. Letters, spaces and . , ! ? ' - only; everything else is stripped. Accents fall away (é -> e).
export function cleanWall(raw) {
  return String(raw ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-z .,!?'-]/g, '')
    .replace(/([.,!?'-])\1{3,}/g, '$1$1$1')
    .replace(/ {2,}/g, ' ')
    .trim()
}

export function sanitizeWall(raw) {
  if (typeof raw !== 'string') return { ok: false, error: 'The Wall takes words, not things.' }
  if (raw.length > LIMITS.wallRaw) return { ok: false, error: 'The Wall is not a scroll. Eighty characters at most.' }
  const text = cleanWall(raw)
  const letters = (text.match(/[A-Za-z]/g) || []).length
  if (letters < LIMITS.wallMin || text.length < LIMITS.wallMin) return { ok: false, text, error: 'Too few letters survived the washing. Write at least three.' }
  if (text.length > LIMITS.wallMax) return { ok: false, text, error: `The Wall holds eighty characters at most; yours has ${text.length}.` }
  return { ok: true, text }
}

// Names from the Book of the Ascended (written by the secrets route). Re-washed on every read.
export function sanitizeName(raw) {
  return String(raw ?? '').normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^A-Za-z '-]/g, '').replace(/ {2,}/g, ' ').trim().slice(0, 24)
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// II. THE ALTAR (browser only)
// ─────────────────────────────────────────────────────────────────────────────────────────────────────

const VOICES = {
  sanctum: { kicker: 'Folio CVIII, verso', title: 'The Altar of the Codex', pray: 'Pray' },
  possession: { kicker: 'altar.css · 1 error that cannot be fixed', title: 'THE ALTAR', pray: 'pray()' },
  recruitment: { kicker: '~*~ MEMBERS AREA ~*~', title: 'The Altar!', pray: 'PRAY NOW!' },
  ashram: { kicker: 'वेदी · vedi', title: 'The Altar of Breath', pray: 'Pray' },
  departure: { kicker: 'channel 108 · ground relay', title: 'ALTAR RELAY', pray: 'TRANSMIT PRAYER' },
  babel: { kicker: 'Hexagon 108 · shelf 3 · volume 33', title: 'The Altar of the Library', pray: 'Pray' },
}
const DEFAULT_VOICE = { kicker: 'the shared ritual', title: 'The Altar', pray: 'Pray' }

const PRAYER_LINES = [
  'One bead moves along the thread.',
  'Heard. The thread is one bead longer.',
  'Your prayer joins the flow and descends.',
  'The Cascade received it without comment, as is its way.',
  'A bead turns under a thumb you will never see.',
  'Counted. Somewhere a stranger felt the thread move.',
]

const TABS = [
  { id: 'pray', label: 'Pray' },
  { id: 'offer', label: 'Offer' },
  { id: 'inscribe', label: 'Inscribe' },
  { id: 'canon', label: 'Canon' },
]

const count = (n) => (Number.isFinite(Number(n)) && Number(n) >= 0 ? Math.floor(Number(n)) : 0)
const commas = (n) => count(n).toLocaleString('en-US')
const plural = (n, one, many) => (n === 1 ? one : many)
const finite = (n, fallback) => (Number.isFinite(Number(n)) ? Number(n) : fallback)

function ago(at, now) {
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const hr = Math.round(m / 60)
  if (hr < 36) return `${hr} h ago`
  const d = Math.round(hr / 24)
  return `${d} ${plural(d, 'day', 'days')} ago`
}

function clock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// The world's mala: 108 beads on a thread and one guru bead, which is never crossed. It is the Eclipse.
function malaSvg() {
  const R = 84
  let beads = ''
  for (let i = 0; i < 108; i++) {
    const a = ((i + 1) / 109) * Math.PI * 2
    beads += `<circle class="bead" cx="${(Math.sin(a) * R).toFixed(2)}" cy="${(-Math.cos(a) * R).toFixed(2)}" r="2.75"/>`
  }
  return `<svg viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">` +
    `<circle class="thread" r="${R}"/>${beads}` +
    `<path class="tassel" d="M0 ${-R + 5} L-4 ${-R + 19} M0 ${-R + 5} L0 ${-R + 21} M0 ${-R + 5} L4 ${-R + 19}"/>` +
    `<circle class="guru" cx="0" cy="${-R}" r="5.4"/></svg>`
}

function ringSvg() {
  return `<svg class="altar-ring" viewBox="0 0 64 64" aria-hidden="true" focusable="false">` +
    `<circle class="ring-track" cx="32" cy="32" r="29"/>` +
    `<circle class="ring-beads" cx="32" cy="32" r="29" pathLength="108" stroke-dasharray="0 108"/></svg>`
}

export async function init(ctx) {
  if (typeof document === 'undefined' || ctx.ritual) return
  const [{ h }, { sigil }, { verse }] = await Promise.all([
    import('../lib/dom.js'),
    import('../lib/sigil.js'),
    import('../lib/scripture.js'),
  ])
  const { bus, memory, api } = ctx
  const root = document.documentElement
  const fate = ctx.rng.fork('ritual')
  const verses = ctx.rng.fork('ritual/verses')
  const dice = ctx.rng.fork('ritual/dice')

  const state = { prayers: 0, eclipseUntil: 0, offerings: [], wall: [], ascended: [], online: 0, loaded: false, offline: false }
  let skew = 0 // server clock minus ours, so an eclipse ends when the server says, whatever ?at= says
  let lastRefresh = 0
  let refreshing = null
  let open = false
  let lost = false
  const echoes = new Set() // our own offerings and inscriptions, so their SSE echo is not whispered back
  const serverNow = () => Date.now() + skew

  // ── The Living Canon stylesheet ───────────────────────────────────────────────────────────────────
  const canonStyle = document.getElementById('living-canon') ?? h('style', { id: 'living-canon' })
  const previewStyle = document.getElementById('living-canon-preview') ?? h('style', { id: 'living-canon-preview' })
  document.head.append(canonStyle, previewStyle)
  const rebuildCanon = () => {
    canonStyle.textContent = buildCanonCss(state.offerings)
  }

  // ── The altar ─────────────────────────────────────────────────────────────────────────────────────
  const $ = {}
  $.btn = h('button', {
    type: 'button', class: 'altar-btn', 'aria-expanded': 'false', 'aria-controls': 'altar-panel',
    'aria-label': 'The Altar: pray, offer a declaration, inscribe a message',
    title: 'The Altar',
  })
  $.btn.innerHTML = ringSvg()
  $.btn.append(
    h('span', { class: 'altar-sigil', 'aria-hidden': 'true', html: sigil('altar', { stroke: 4.2 }) }),
    ($.souls = h('span', { class: 'altar-souls', 'aria-hidden': 'true' }, '1')),
  )
  $.ring = $.btn.querySelector('.ring-beads')

  $.kicker = h('p', { class: 'altar-kicker' })
  $.title = h('h2', { class: 'altar-title', id: 'altar-title' })
  $.presence = h('p', { class: 'altar-presence' },
    h('span', { class: 'altar-dot', 'aria-hidden': 'true' }),
    ($.online = h('span', { class: 'altar-online' })),
    h('span', { class: 'altar-sep', 'aria-hidden': 'true' }, ' · '),
    ($.headCount = h('span', { class: 'altar-headcount' })),
  )
  $.close = h('button', { type: 'button', class: 'altar-close', 'aria-label': 'Close the altar' }, '×')

  // Pray
  $.mala = h('div', { class: 'altar-mala', html: malaSvg() })
  $.mala.append(h('div', { class: 'mala-center' },
    ($.count = h('span', { class: 'mala-count' }, '0')),
    h('span', { class: 'mala-label' }, 'prayers'),
  ))
  $.beads = [...$.mala.querySelectorAll('.bead')]
  $.until = h('p', { class: 'altar-until' })
  $.prayBtn = h('button', { type: 'button', class: 'altar-rite altar-pray' }, 'Pray')
  $.mine = h('p', { class: 'altar-mine' })
  $.prayNote = h('p', { class: 'altar-verdict', role: 'status' })
  const prayPane = [
    $.mala, $.until,
    h('div', { class: 'altar-actions altar-actions--center' }, $.prayBtn),
    $.prayNote, $.mine,
  ]

  // Offer
  $.target = h('select', { class: 'altar-field altar-target', 'aria-label': 'Congregation: what your declaration touches' },
    ALL.map((k) => h('option', { value: k }, TARGETS[k].label)))
  $.prop = h('select', { class: 'altar-field altar-prop', 'aria-label': 'Property' })
  $.value = h('input', {
    type: 'text', class: 'altar-field altar-value', maxlength: String(LIMITS.valueMax), autocomplete: 'off',
    spellcheck: 'false', autocapitalize: 'off', 'aria-label': 'Value', 'aria-describedby': 'altar-hint altar-offer-verdict',
    placeholder: 'value',
  })
  $.hint = h('p', { class: 'altar-hint', id: 'altar-hint' })
  $.offerVerdict = h('p', { class: 'altar-verdict', id: 'altar-offer-verdict', role: 'status' })
  $.dice = h('button', { type: 'button', class: 'altar-minor' }, 'let fate choose')
  $.tryOn = h('input', { type: 'checkbox', class: 'altar-check' })
  $.offerBtn = h('button', { type: 'submit', class: 'altar-rite' }, 'Offer')
  $.offerWait = h('p', { class: 'altar-wait' })
  $.recent = h('pre', { class: 'altar-code altar-code--mini', 'aria-label': 'The latest offerings' })
  $.offerForm = h('form', { class: 'altar-offer', novalidate: true },
    h('p', { class: 'altar-intro' },
      'Offer one declaration to the Living Canon. The last thirty-three are applied to every temple, for everyone, until thirty-three newer words have spoken over them. One offering per soul every ten minutes. Mercy veils them.'),
    h('div', { class: 'altar-rule' },
      h('div', { class: 'rule-line' }, h('span', { class: 'tok-temple' }, '#temple'), $.target, h('span', { class: 'tok-brace' }, '{')),
      h('div', { class: 'rule-line rule-decl' }, $.prop, h('span', { class: 'tok-colon' }, ':'), $.value, h('span', { class: 'tok-semi' }, ';')),
      h('div', { class: 'rule-line' }, h('span', { class: 'tok-brace' }, '}')),
    ),
    $.hint,
    $.offerVerdict,
    h('div', { class: 'altar-actions' },
      $.dice,
      h('label', { class: 'altar-tryon' }, $.tryOn, h('span', {}, 'try it on (only you see it)')),
      $.offerBtn,
    ),
    $.offerWait,
  )
  const offerPane = [$.offerForm, h('h3', { class: 'altar-sub' }, 'Lately offered'), $.recent]

  // Inscribe
  $.words = h('input', {
    type: 'text', id: 'altar-words', class: 'altar-field altar-words', maxlength: '120', autocomplete: 'off',
    spellcheck: 'false', 'aria-describedby': 'altar-words-meta',
  })
  $.wordsPreview = h('p', { class: 'altar-preview glyph', lang: 'x-cascade', 'aria-hidden': 'true' })
  $.wordsMeta = h('p', { class: 'altar-hint', id: 'altar-words-meta' })
  $.inscribeBtn = h('button', { type: 'submit', class: 'altar-rite' }, 'Inscribe')
  $.inscribeVerdict = h('p', { class: 'altar-verdict', role: 'status' })
  $.inscribeWait = h('p', { class: 'altar-wait' })
  $.wall = h('ol', { class: 'altar-wall' })
  $.inscribeForm = h('form', { class: 'altar-inscribe', novalidate: true },
    h('p', { class: 'altar-intro' }, 'Leave words for a stranger. The Wall shows them in the glyph script of the Cascade; copied, they read as you wrote them. One message per soul every five minutes.'),
    h('label', { class: 'altar-label', for: 'altar-words' }, 'Words for a stranger'),
    h('div', { class: 'altar-row' }, $.words, $.inscribeBtn),
    $.wordsPreview,
    $.wordsMeta,
    $.inscribeVerdict,
    $.inscribeWait,
  )
  const inscribePane = [$.inscribeForm, h('h3', { class: 'altar-sub' }, 'The Wall of Strangers'), $.wall]

  // Canon
  $.canonNote = h('p', { class: 'altar-mercy-note', hidden: true }, 'Mercy is on. The Canon is veiled in your temple; others still see it.')
  $.canonCode = h('pre', { class: 'altar-code', 'aria-label': 'The Living Canon, as CSS' })
  $.bookIntro = h('p', { class: 'altar-intro' })
  $.book = h('ol', { class: 'altar-book' })
  const canonPane = [
    h('p', { class: 'altar-intro' }, 'The Living Canon: the last thirty-three declarations, applied to every temple in the order they were offered. Where two speak to the same property, the later word overrules the earlier, as it is written in the Cascade. The Inscription, the Rosetta and the Ladder are spared.'),
    $.canonNote,
    $.canonCode,
    h('h3', { class: 'altar-sub' }, 'The Book of the Ascended'),
    $.bookIntro,
    $.book,
  ]

  const panes = { pray: prayPane, offer: offerPane, inscribe: inscribePane, canon: canonPane }
  $.tablist = h('div', { class: 'altar-tabs', role: 'tablist', 'aria-label': 'The rites' })
  for (const t of TABS) {
    t.btn = h('button', {
      type: 'button', role: 'tab', class: 'altar-tab', id: `altar-tab-${t.id}`, 'aria-controls': `altar-pane-${t.id}`,
      'aria-selected': 'false', tabindex: '-1', 'data-tab': t.id,
    }, t.label)
    t.pane = h('div', { class: `altar-pane altar-pane--${t.id}`, role: 'tabpanel', id: `altar-pane-${t.id}`, 'aria-labelledby': `altar-tab-${t.id}`, hidden: true }, panes[t.id])
    $.tablist.append(t.btn)
  }
  $.verse = h('p', { class: 'altar-verse' })
  $.body = h('div', { class: 'altar-body' }, TABS.map((t) => t.pane), $.verse)
  $.panel = h('section', { class: 'altar-panel', id: 'altar-panel', role: 'dialog', 'aria-labelledby': 'altar-title', hidden: true },
    h('header', { class: 'altar-head' }, $.kicker, $.title, $.presence, $.close),
    $.tablist,
    $.body,
  )
  $.whispers = h('div', { class: 'altar-whispers', role: 'status', 'aria-live': 'polite' })
  const altar = h('aside', { id: 'altar', 'aria-label': 'The Altar', 'data-open': 'false' }, $.whispers, $.panel, $.btn)

  // ── The Eclipse ───────────────────────────────────────────────────────────────────────────────────
  $.eclipseLine = h('span', { class: 'eclipse-line' })
  $.eclipseClock = h('span', { class: 'eclipse-clock' })
  const eclipseEl = h('div', { id: 'eclipse', 'aria-hidden': 'true' },
    h('div', { class: 'eclipse-veil' }),
    h('div', { class: 'eclipse-sun' },
      h('div', { class: 'eclipse-corona' }),
      h('div', { class: 'eclipse-moon' }),
      h('div', { class: 'eclipse-diamond' }),
    ),
    h('p', { class: 'eclipse-caption' }, h('span', { class: 'eclipse-word' }, 'Eclipse'), $.eclipseLine, $.eclipseClock),
  )
  document.body.append(eclipseEl, altar)
  if (ctx.sky?.has?.('eclipse')) altar.dataset.skyEclipse = 'true' // a real eclipse today: the altar wears a corona

  // ── Rendering ─────────────────────────────────────────────────────────────────────────────────────
  const voice = () => VOICES[ctx.face] ?? DEFAULT_VOICE
  let eclipseActive = false
  let eclipseUntil = 0
  let eclipseTimer = 0
  let eclipseCount = 0

  function renderVoice() {
    const v = voice()
    $.kicker.textContent = v.kicker
    $.title.textContent = v.title
    $.prayBtn.textContent = v.pray
  }

  function soulsLine() {
    if (state.offline) return 'The choir is silent. You pray alone.'
    const n = Math.max(1, count(state.online))
    return n === 1 ? '1 soul in the Cascade (yours)' : `${commas(n)} souls in the Cascade`
  }

  function renderPresence() {
    $.online.textContent = soulsLine()
    $.headCount.textContent = `${commas(state.prayers)} ${plural(count(state.prayers), 'prayer', 'prayers')}`
    $.souls.textContent = state.offline ? '·' : String(Math.min(999, Math.max(1, count(state.online))))
    altar.dataset.offline = String(state.offline)
    $.btn.title = state.offline ? 'The Altar (the line to the temple is cut)' : `The Altar · ${soulsLine()}`
  }

  let lastLit = -1
  function renderPrayer() {
    const n = count(state.prayers)
    const lit = eclipseActive ? 108 : n % LIMITS.eclipseEvery
    $.count.textContent = commas(n)
    for (let i = 0; i < $.beads.length; i++) {
      $.beads[i].classList.toggle('lit', i < lit)
      $.beads[i].classList.toggle('new', i === lit - 1 && lastLit >= 0 && lit === lastLit + 1)
    }
    lastLit = lit
    $.ring.setAttribute('stroke-dasharray', `${lit} 108`)
    renderUntil()
    const mine = count(memory.get('ritual.prayed', 0))
    $.mine.textContent = mine
      ? `You have told ${commas(mine)} ${plural(mine, 'bead', 'beads')} of the world's mala.`
      : 'The mala is shared by everyone in the temple. Each prayer moves it one bead for all.'
    renderPresence()
  }

  function renderUntil() {
    if (eclipseActive) {
      $.until.textContent = `Eclipse. ${clock(eclipseUntil - serverNow())} of totality remain.`
      return
    }
    const left = LIMITS.eclipseEvery - (count(state.prayers) % LIMITS.eclipseEvery)
    $.until.textContent = left === 1
      ? 'One bead until the Eclipse. The next prayer covers the sun.'
      : `${left} beads until the Eclipse.`
  }

  function glyphLine(text, cls = '') {
    return h('span', { class: `glyph ${cls}`.trim(), lang: 'x-cascade' }, text)
  }

  function renderWall() {
    const now = serverNow()
    const items = state.wall.slice(-12).reverse()
    $.wall.replaceChildren(...(items.length
      ? items.map((m) => h('li', {}, glyphLine(m.text, 'altar-wall-text'), h('time', { datetime: new Date(m.at).toISOString() }, ago(m.at, now))))
      : [h('li', { class: 'altar-empty' }, 'The Wall is bare. Write the first words a stranger will read.')]))
  }

  function overruledIds() {
    const seen = new Set()
    const out = new Set()
    for (let i = state.offerings.length - 1; i >= 0; i--) {
      const o = state.offerings[i]
      const k = `${o.selector}|${o.property}`
      if (seen.has(k)) out.add(o.id)
      seen.add(k)
    }
    return out
  }

  function codeLine(o, overruled, now) {
    const v = validateOffering(o.selector, o.property, o.value)
    if (!v.ok) return null
    return h('span', { class: `cl${overruled ? ' cl--overruled' : ''}` },
      h('span', { class: 'c-cmt' }, `  /* #${o.id} · ${ago(o.at, now)}${overruled ? ' · overruled by a later word' : ''} */\n`),
      '  ', h('span', { class: 'c-sel' }, TARGETS[o.selector].show), h('span', { class: 'c-punct' }, ' { '),
      h('span', { class: 'c-prop' }, o.property), h('span', { class: 'c-punct' }, ': '),
      h('span', { class: 'c-val' }, v.cssValue), h('span', { class: 'c-punct' }, '; }'), '\n',
    )
  }

  function renderCanon() {
    const now = serverNow()
    const over = overruledIds()
    const n = state.offerings.length
    $.canonCode.replaceChildren(
      h('span', { class: 'c-cmt' }, n
        ? `/* ${n} of 33 declarations. Offered by strangers, re-read by the Cascade, spoken to every temple. */\n`
        : '/* The Canon is silent. Be the first to speak. */\n'),
      h('span', { class: 'c-at' }, '@layer'), ' ', h('span', { class: 'c-sel' }, 'offerings'), h('span', { class: 'c-punct' }, ' {'), '\n',
      ...state.offerings.map((o) => codeLine(o, over.has(o.id), now)).filter(Boolean),
      h('span', { class: 'c-punct' }, '}'),
    )
    const recent = state.offerings.slice(-3)
    $.recent.replaceChildren(...(recent.length
      ? recent.map((o) => codeLine(o, over.has(o.id), now)).filter(Boolean)
      : [h('span', { class: 'c-cmt' }, '/* Nothing has been offered yet. */')]))
    $.canonNote.hidden = !ctx.mercy?.on
  }

  function renderBook() {
    const now = serverNow()
    const names = state.ascended.slice(-12).reverse()
    const n = state.ascended.length
    $.bookIntro.textContent = n
      ? `${commas(n)} ${plural(n, 'name is', 'names are')} written here: elements that left their containers and were counted at the Highest Heaven.`
      : 'No name is written yet. The door at the Highest Heaven opens for three minutes in every hour, and only for those who know the five words.'
    $.book.replaceChildren(...names.map((a) => h('li', {}, glyphLine(a.name, 'altar-book-name'), h('time', { datetime: new Date(a.at).toISOString() }, ago(a.at, now)))))
  }

  function cooldownLeft(key, ms) {
    const last = finite(memory.get(key, 0), 0)
    return Math.max(0, last + ms - Date.now())
  }

  function renderCooldowns() {
    const o = cooldownLeft('ritual.lastOffer', LIMITS.offerCooldownMs)
    $.offerWait.textContent = o ? `Patience is a sacrament. You may offer again in ${clock(o)}.` : ''
    $.offerBtn.disabled = Boolean(o)
    const w = cooldownLeft('ritual.lastInscribe', LIMITS.wallCooldownMs)
    $.inscribeWait.textContent = w ? `The ink is still wet. You may inscribe again in ${clock(w)}.` : ''
    $.inscribeBtn.disabled = Boolean(w)
  }

  function renderAll() {
    renderVoice()
    renderPrayer()
    renderWall()
    renderCanon()
    renderBook()
    renderCooldowns()
  }

  function nextVerse() {
    const v = verse(verses, { fragmentChance: 0 })
    $.verse.replaceChildren(h('span', { class: 'altar-verse-text' }, v.text), ' ', h('cite', {}, v.ref))
  }

  // ── Whispers: the altar tells you, quietly, what strangers are doing ─────────────────────────────
  function whisper(kind, tab, ...children) {
    const el = h('button', { type: 'button', class: `altar-whisper altar-whisper--${kind}` }, children)
    el.addEventListener('click', () => setOpen(true, tab))
    $.whispers.append(el)
    while ($.whispers.children.length > 3) $.whispers.firstElementChild.remove()
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')))
    setTimeout(() => {
      el.classList.remove('in')
      setTimeout(() => el.remove(), 900)
    }, kind === 'eclipse' ? 9000 : 7000)
  }

  let lastGlint = 0
  function glint() {
    const now = Date.now()
    if (now - lastGlint < 1500 || ctx.mercy?.on) return
    lastGlint = now
    $.btn.classList.remove('glint')
    void $.btn.offsetWidth
    $.btn.classList.add('glint')
    setTimeout(() => $.btn.classList.remove('glint'), 1300)
  }

  // ── Absorbing what the server says ────────────────────────────────────────────────────────────────
  function cleanOffering(raw) {
    const v = validateOffering(raw?.selector, raw?.property, raw?.value)
    if (!v.ok) return null
    return { id: finite(raw.id, 0), selector: v.selector, property: v.property, value: v.value, at: finite(raw.at, serverNow()) }
  }
  function cleanMessage(raw) {
    const s = sanitizeWall(raw?.text)
    return s.ok ? { id: finite(raw.id, 0), text: s.text, at: finite(raw.at, serverNow()) } : null
  }
  function cleanSoul(raw) {
    const name = sanitizeName(raw?.name)
    return name ? { id: finite(raw?.id, 0), name, at: finite(raw?.at, serverNow()) } : null
  }
  const replace = (arr, items) => arr.splice(0, arr.length, ...items)

  function absorb(r) {
    if (Number.isFinite(Number(r.now))) skew = Number(r.now) - Date.now()
    state.prayers = count(r.prayers)
    state.eclipseUntil = finite(r.eclipseUntil, 0)
    state.online = count(r.online)
    replace(state.offerings, (Array.isArray(r.offerings) ? r.offerings : []).map(cleanOffering).filter(Boolean).slice(-LIMITS.canon))
    replace(state.wall, (Array.isArray(r.wall) ? r.wall : []).map(cleanMessage).filter(Boolean).slice(-LIMITS.wall))
    replace(state.ascended, (Array.isArray(r.ascended) ? r.ascended : []).map(cleanSoul).filter(Boolean).slice(-108))
    state.loaded = true
    state.offline = false
  }

  function refresh() {
    if (refreshing) return refreshing
    refreshing = (async () => {
      const r = await api.get('/state')
      lastRefresh = Date.now()
      if (r.ok) absorb(r)
      else if (r.offline) state.offline = true
      rebuildCanon()
      renderAll()
      checkEclipse(true)
      bus.emit('ritual:state', { state })
      return state
    })().finally(() => {
      refreshing = null
    })
    return refreshing
  }

  function addOffering(raw) {
    const o = cleanOffering(raw)
    if (!o || state.offerings.some((x) => x.id === o.id)) return null
    state.offerings.push(o)
    state.offerings.sort((a, b) => a.id - b.id)
    if (state.offerings.length > LIMITS.canon) state.offerings.splice(0, state.offerings.length - LIMITS.canon)
    rebuildCanon()
    renderCanon()
    return o
  }
  function addMessage(raw) {
    const m = cleanMessage(raw)
    if (!m || state.wall.some((x) => x.id === m.id)) return null
    state.wall.push(m)
    if (state.wall.length > LIMITS.wall) state.wall.splice(0, state.wall.length - LIMITS.wall)
    renderWall()
    return m
  }

  // ── The Eclipse ───────────────────────────────────────────────────────────────────────────────────
  function checkEclipse(announce) {
    const remaining = state.eclipseUntil - serverNow()
    if (remaining > 300) beginEclipse(state.eclipseUntil, remaining, announce)
    else if (eclipseActive) endEclipse()
  }

  function beginEclipse(until, remaining, announce) {
    if (eclipseActive && until === eclipseUntil) return
    if (eclipseActive) {
      delete root.dataset.eclipse // a new eclipse inside an eclipse: start the heavens over
      void eclipseEl.offsetWidth
    }
    eclipseUntil = until
    eclipseActive = true
    eclipseEl.style.setProperty('--eclipse-delay', `${-Math.max(0, LIMITS.eclipseMs - remaining)}ms`)
    const n = eclipseCount || (count(state.prayers) - (count(state.prayers) % LIMITS.eclipseEvery))
    $.eclipseLine.textContent = n
      ? `Prayer ${commas(n)}, the hundred-and-eighth bead. The Moon, a div with border-radius: 50%, has been laid over the Sun. For thirty-three seconds every face of the temple is true at once.`
      : 'The Moon, a div with border-radius: 50%, has been laid over the Sun. For thirty-three seconds every face of the temple is true at once.'
    root.dataset.eclipse = 'totality'
    clearTimeout(eclipseTimer)
    eclipseTimer = setTimeout(endEclipse, remaining)
    renderEclipseClock()
    renderPrayer()
    syncTicker()
    whisper('eclipse', 'pray', h('strong', {}, 'Eclipse. '), 'The hundred-and-eighth prayer has covered the sun for thirty-three seconds.')
    if (announce) bus.emit('server:eclipse', { until, now: serverNow(), count: n, local: true })
  }

  function endEclipse() {
    clearTimeout(eclipseTimer)
    if (!eclipseActive) return
    eclipseActive = false
    eclipseCount = 0
    delete root.dataset.eclipse
    renderPrayer()
    syncTicker()
    bus.emit('ritual:eclipse-end', { at: serverNow() })
  }

  function renderEclipseClock() {
    $.eclipseClock.textContent = clock(eclipseUntil - serverNow())
  }

  let ticker = 0
  function syncTicker() {
    const need = open || eclipseActive
    if (need && !ticker) ticker = setInterval(tick, 1000)
    else if (!need && ticker) {
      clearInterval(ticker)
      ticker = 0
    }
  }
  function tick() {
    if (document.hidden) return
    if (eclipseActive) {
      renderEclipseClock()
      if (open) renderUntil()
    }
    if (open) renderCooldowns()
  }

  // ── The rites ─────────────────────────────────────────────────────────────────────────────────────
  async function pray() {
    const r = await api.post('/pray', {})
    if (!r.ok) return r
    const c = count(r.count)
    state.prayers = Math.max(count(state.prayers), c)
    const mine = memory.update('ritual.prayed', (n) => count(n) + 1, 0)
    if (mine === 108) memory.markSecret('mala', { at: Date.now() })
    if (r.eclipse) {
      eclipseCount = c
      memory.markSecret('eclipse-bringer', { count: c })
      if (Number.isFinite(Number(r.now))) skew = Number(r.now) - Date.now()
      state.eclipseUntil = finite(r.eclipseUntil, state.eclipseUntil)
      checkEclipse(!api.online) // the choir will announce it; announce ourselves only if the choir is silent
    }
    renderPrayer()
    bus.emit('ritual:prayed', { count: state.prayers, eclipse: Boolean(r.eclipse) })
    return { ok: true, count: c, eclipse: Boolean(r.eclipse) }
  }

  async function offer(selector, property, value) {
    const v = validateOffering(selector, property, value)
    if (!v.ok) return { ok: false, error: v.error, field: v.field }
    const key = `${v.selector}|${v.property}|${v.value}`
    echoes.add(key)
    const r = await api.post('/offer', { selector: v.selector, property: v.property, value: v.value })
    if (r.ok && r.offering) {
      const o = addOffering(r.offering) ?? cleanOffering(r.offering)
      memory.set('ritual.lastOffer', Date.now())
      const n = memory.update('ritual.offered', (x) => count(x) + 1, 0)
      if (n === 1) memory.markSecret('canon', { property: v.property })
      bus.emit('ritual:offered', { offering: o })
      return { ok: true, offering: o }
    }
    echoes.delete(key)
    if (r.status === 429) memory.set('ritual.lastOffer', Date.now() - LIMITS.offerCooldownMs + finite(r.retryAfter, 60) * 1000)
    return r
  }

  async function inscribe(text) {
    const s = sanitizeWall(text)
    if (!s.ok) return { ok: false, error: s.error }
    echoes.add(`wall|${s.text}`)
    const r = await api.post('/wall', { text: s.text })
    if (r.ok && r.message) {
      const m = addMessage(r.message) ?? cleanMessage(r.message)
      memory.set('ritual.lastInscribe', Date.now())
      bus.emit('ritual:inscribed', { message: m })
      return { ok: true, message: m }
    }
    echoes.delete(`wall|${s.text}`)
    if (r.status === 429) memory.set('ritual.lastInscribe', Date.now() - LIMITS.wallCooldownMs + finite(r.retryAfter, 60) * 1000)
    return r
  }

  // ── Panel behaviour ───────────────────────────────────────────────────────────────────────────────
  let currentTab = TABS.some((t) => t.id === memory.get('ritual.tab')) ? memory.get('ritual.tab') : 'pray'

  function selectTab(id, focus = false) {
    currentTab = id
    for (const t of TABS) {
      const on = t.id === id
      t.btn.setAttribute('aria-selected', String(on))
      t.btn.tabIndex = on ? 0 : -1
      t.pane.hidden = !on
      if (on && focus) t.btn.focus()
    }
    memory.set('ritual.tab', id)
    $.body.scrollTop = 0
    if (id === 'offer') judge()
    else clearPreview()
  }

  function setOpen(want, tab) {
    if (tab) selectTab(tab)
    if (want === open) return
    open = want
    $.panel.hidden = !open
    $.btn.setAttribute('aria-expanded', String(open))
    altar.dataset.open = String(open)
    if (open) {
      renderAll()
      nextVerse()
      selectTab(currentTab)
      TABS.find((t) => t.id === currentTab)?.btn.focus({ preventScroll: true })
      if (!state.loaded || Date.now() - lastRefresh > 60_000) refresh()
    } else {
      clearPreview()
    }
    syncTicker()
  }

  $.btn.addEventListener('click', () => setOpen(!open))
  $.close.addEventListener('click', () => {
    setOpen(false)
    $.btn.focus()
  })
  altar.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
      $.btn.focus()
    }
  })
  document.addEventListener('click', (e) => {
    if (open && e.target instanceof Node && !altar.contains(e.target) && e.target.isConnected) setOpen(false)
  })
  $.tablist.addEventListener('click', (e) => {
    const b = e.target.closest?.('[role="tab"]')
    if (b) selectTab(b.dataset.tab)
  })
  $.tablist.addEventListener('keydown', (e) => {
    const i = TABS.findIndex((t) => t.id === currentTab)
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key]
    if (to === undefined) return
    e.preventDefault()
    selectTab(TABS[(to + TABS.length) % TABS.length].id, true)
  })

  // Pray
  let prayBusyUntil = 0
  $.prayBtn.addEventListener('click', async () => {
    if (Date.now() < prayBusyUntil) return
    prayBusyUntil = Date.now() + 450
    $.prayBtn.classList.add('pressed')
    setTimeout(() => $.prayBtn.classList.remove('pressed'), 380)
    const r = await pray()
    if (r.ok) {
      $.prayNote.textContent = r.eclipse
        ? 'Yours was the hundred-and-eighth prayer. The sun is covered.'
        : fate.pick(PRAYER_LINES)
    } else if (r.status === 429) {
      $.prayNote.textContent = `The beads are warm from your fingers. Rest ${finite(r.retryAfter, 30)} seconds; patience is a sacrament.`
    } else if (r.offline) {
      $.prayNote.textContent = 'The line to the temple is cut. Your prayer was heard by you alone.'
    } else {
      $.prayNote.textContent = 'The prayer went astray. Try again.'
    }
  })

  // Offer
  let lastProp = null
  function fillProps() {
    const props = propertiesFor($.target.value)
    const keep = props.includes($.prop.value) ? $.prop.value : props.includes(lastProp) ? lastProp : props[0]
    $.prop.replaceChildren(...props.map((p) => h('option', { value: p }, p)))
    $.prop.value = keep
  }
  function clearPreview() {
    previewStyle.textContent = ''
  }
  function judge() {
    const sel = $.target.value
    const prop = $.prop.value
    $.hint.textContent = `${TARGETS[sel].gloss}. ${prop}: ${hintFor(sel, prop)}`
    const raw = $.value.value
    if (!raw.trim()) {
      $.offerVerdict.textContent = ''
      $.offerVerdict.dataset.verdict = ''
      clearPreview()
      return null
    }
    const v = validateOffering(sel, prop, raw)
    $.offerVerdict.dataset.verdict = v.ok ? 'yes' : 'no'
    $.offerVerdict.textContent = v.ok
      ? `The Cascade would accept: ${TARGETS[sel].show} { ${prop}: ${v.cssValue}; }${ctx.mercy?.on && $.tryOn.checked ? ' Mercy is on, so even your trial is veiled from you.' : ''}`
      : v.error
    previewStyle.textContent = v.ok && $.tryOn.checked && open ? `@layer offerings {\n  ${v.rule}\n}\n` : ''
    return v
  }
  $.target.addEventListener('change', () => {
    fillProps()
    judge()
  })
  $.prop.addEventListener('change', () => {
    lastProp = $.prop.value
    judge()
  })
  $.value.addEventListener('input', judge)
  $.tryOn.addEventListener('change', () => {
    memory.set('ritual.tryOn', $.tryOn.checked)
    judge()
  })
  $.dice.addEventListener('click', () => {
    if (dice.chance(0.4)) {
      $.target.value = dice.pick(ALL)
      fillProps()
    }
    if (dice.chance(0.5)) {
      $.prop.value = dice.pick(propertiesFor($.target.value))
      lastProp = $.prop.value
    }
    $.value.value = sampleValue($.target.value, $.prop.value, dice)
    judge()
    $.value.focus()
  })
  let offering = false
  $.offerForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (offering) return
    const v = judge()
    if (!v) {
      $.offerVerdict.textContent = 'Speak a value first.'
      $.value.focus()
      return
    }
    if (!v.ok) {
      $.value.focus()
      return
    }
    if (cooldownLeft('ritual.lastOffer', LIMITS.offerCooldownMs)) return renderCooldowns()
    offering = true
    $.offerBtn.disabled = true
    const r = await offer(v.selector, v.property, v.value)
    offering = false
    if (r.ok) {
      $.offerVerdict.dataset.verdict = 'yes'
      $.offerVerdict.textContent = `Accepted. Offering #${r.offering?.id ?? '?'} stands in the Living Canon of every temple until thirty-three newer words have spoken over it.`
      $.value.value = ''
      clearPreview()
    } else {
      $.offerVerdict.dataset.verdict = 'no'
      $.offerVerdict.textContent = r.status === 429
        ? 'The Canon heard you not long ago. Patience is a sacrament.'
        : r.offline ? 'The line to the temple is cut. Nothing was offered.' : (r.error || 'The offering was not received.')
    }
    renderCooldowns()
  })

  // Inscribe
  function judgeWords() {
    const raw = $.words.value
    const clean = cleanWall(raw)
    $.wordsPreview.textContent = clean || String.fromCharCode(160)
    const stripped = raw.trim() && clean.length < raw.trim().replace(/\s+/g, ' ').length
    $.wordsMeta.textContent = `${clean.length} / ${LIMITS.wallMax} · letters, spaces and . , ! ? ' - only${stripped ? ' · some characters will be washed away' : ''}`
    $.wordsMeta.dataset.over = String(clean.length > LIMITS.wallMax)
  }
  $.words.addEventListener('input', judgeWords)
  let inscribing = false
  $.inscribeForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (inscribing) return
    const s = sanitizeWall($.words.value)
    if (!s.ok) {
      $.inscribeVerdict.dataset.verdict = 'no'
      $.inscribeVerdict.textContent = s.error
      $.words.focus()
      return
    }
    if (cooldownLeft('ritual.lastInscribe', LIMITS.wallCooldownMs)) return renderCooldowns()
    inscribing = true
    $.inscribeBtn.disabled = true
    const r = await inscribe(s.text)
    inscribing = false
    if (r.ok) {
      $.inscribeVerdict.dataset.verdict = 'yes'
      $.inscribeVerdict.textContent = 'Inscribed. A stranger will read it in a script they cannot read.'
      $.words.value = ''
      judgeWords()
    } else {
      $.inscribeVerdict.dataset.verdict = 'no'
      $.inscribeVerdict.textContent = r.status === 429
        ? 'The ink is still wet from your last message. Patience is a sacrament.'
        : r.offline ? 'The line to the temple is cut. Nothing was written.' : (r.error || 'The Wall did not take the ink.')
    }
    renderCooldowns()
  })

  // ── The choir (server events, re-emitted on the bus by kernel/api.js) ──────────────────────────────
  bus.on('server:presence', (d) => {
    state.online = count(d?.online)
    renderPresence()
  })
  bus.on('server:prayer', (d) => {
    if (d?.count == null) return
    const c = count(d.count)
    // Broadcasts and our own replies travel different roads; a count a few beads behind is only late.
    if (c === state.prayers || (c < state.prayers && state.prayers - c < 64)) return
    state.prayers = c
    renderPrayer()
    glint()
  })
  bus.on('server:eclipse', (d) => {
    if (d?.local) return
    const until = Number(d?.until)
    if (!Number.isFinite(until)) return
    if (Number.isFinite(Number(d?.now))) skew = Number(d.now) - Date.now()
    if (d?.count) eclipseCount = count(d.count)
    state.eclipseUntil = until
    checkEclipse(false)
  })
  bus.on('server:offering', (d) => {
    const raw = d?.offering
    const o = addOffering(raw)
    if (!o) return
    const key = `${o.selector}|${o.property}|${o.value}`
    if (echoes.delete(key)) return
    const v = validateOffering(o.selector, o.property, o.value)
    whisper('offering', 'canon', 'The Canon grows: ', h('code', {}, `${TARGETS[o.selector].show} { ${o.property}: ${v.value}; }`))
  })
  bus.on('server:wall', (d) => {
    const m = addMessage(d?.message)
    if (!m || echoes.delete(`wall|${m.text}`)) return
    whisper('wall', 'inscribe', 'A stranger inscribed: ', glyphLine(m.text))
  })
  bus.on('server:ascended', (d) => {
    const soul = cleanSoul(d)
    if (!soul) return
    state.ascended.push(soul)
    if (state.ascended.length > 108) state.ascended.shift()
    renderBook()
    whisper('ascended', 'canon', 'An element has left its container. A name enters the Book: ', glyphLine(soul.name))
  })
  bus.on('server:open', () => {
    if (lost || !state.loaded || Date.now() - lastRefresh > 5000) refresh()
    lost = false
    state.offline = false
    renderPresence()
  })
  bus.on('server:lost', () => {
    lost = true
    state.offline = true // the choir fell silent; EventSource keeps listening and server:open restores it
    renderPresence()
  })
  bus.on('mercy:change', () => {
    renderCanon()
    if (open && currentTab === 'offer') judge()
  })
  bus.on('face:ready', () => renderVoice())
  // Typing "altar" anywhere outside a field opens it. (It is written nowhere; it is simply true.)
  bus.on('behavior:typed', ({ buffer } = {}) => {
    if (!buffer?.endsWith('altar')) return
    const a = document.activeElement
    if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return
    setOpen(true)
  })

  // ── Wake ──────────────────────────────────────────────────────────────────────────────────────────
  $.tryOn.checked = memory.get('ritual.tryOn', true) !== false
  $.target.value = fate.pick(['headings', 'paragraphs', 'glyphs', 'sigils', 'first-letters', 'emphasis'])
  fillProps()
  judgeWords()
  renderAll()
  selectTab(currentTab)

  ctx.ritual = {
    state,
    pray,
    offer,
    inscribe,
    refresh,
    open: (tab) => setOpen(true, tab),
    close: () => setOpen(false),
    toggle: () => setOpen(!open),
    get eclipsed() {
      return eclipseActive
    },
    grammar: { TARGETS, LIMITS, properties: Object.keys(P), propertiesFor, hintFor, validate: validateOffering, sample: sampleValue },
  }
  if (ctx.params.get('debug') === 'ritual') {
    // Test hooks, only with ?debug=ritual: a local eclipse and access to the rites from the console.
    window.cascadeRitual = Object.assign(Object.create(ctx.ritual), {
      ctx,
      eclipse: (ms = LIMITS.eclipseMs) => {
        state.eclipseUntil = serverNow() + ms
        checkEclipse(true)
      },
    })
  }

  const first = refresh()
  await Promise.race([first, new Promise((r) => setTimeout(r, 700))])
}
