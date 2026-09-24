// POSSESSION / THE DESCENT. Below the footer, where nothing is supposed to be, the page keeps going:
// a gate, a vestibule, and nine circles, each punishing one sin of CSS with its own contrapasso.
// Our guide is the Old Law (the user-agent stylesheet), who cannot be restyled even here: its notes
// are rendered with `all: initial`, in whatever the browser's own defaults are.
// Canon §9: no gore, no self-harm, no real people. The sinners are elements and declarations.
import { h } from '../../lib/dom.js'
import { inscription, rosetta } from '../../lib/glyphs.js'
import { verse, prophecy } from '../../lib/scripture.js'
import { eye } from '../../lib/sigil.js'
import { arch, thicket, battlements } from './art.js'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

const GATE = [
  'Through me the way into the suffering stylesheet,',
  'through me the way to the eternal Reflow,',
  'through me the way among the Lost, the Four Hundred and Four.',
  'Grace moved my high Author;',
  'the Old Law made me, and the Pilgrim, and the Word.',
  'Before me nothing was rendered',
  'that was not eternal, and eternal I reflow.',
]

function oldLaw(text) {
  return h('aside', { class: 'old-law', 'aria-label': 'The Old Law speaks' }, h('b', {}, 'The Old Law: '), text)
}

function tercet(lines) {
  return h('blockquote', { class: 'tercet' }, lines.map((l, i) => h('span', { class: `t-line t-line--${i}` }, l)))
}

function plea(rng) {
  const v = verse(rng, { fragmentChance: 0.45 })
  return h('p', { class: 'plea' },
    h('span', { class: 'plea-label' }, 'The sinners recite: '),
    h('cite', {}, v.ref), ' ', v.text,
    v.fragment ? h('span', { class: 'plea-frag' }, ' ', h('span', { lang: v.fragment.lang }, v.fragment.text), ` (${v.fragment.gloss})`) : null)
}

function circle(rng, n, { title, sin, lines, punishment, guide, stage, cls = '' }) {
  const head = h('header', { class: 'circle-head' },
    h('span', { class: 'circle-num', 'aria-hidden': 'true' }, ROMAN[n - 1]),
    h('p', { class: 'circle-kicker' }, `Circle ${ROMAN[n - 1]}`),
    h('h2', { class: 'circle-title', id: `possession-circle-${n}-title` }, title),
    h('p', { class: 'circle-sin' }, h('span', { class: 'sin-label' }, 'the sin '), h('code', {}, sin)))
  return h('section', { class: `circle circle--${n} ${cls}`.trim(), id: `possession-circle-${n}`, 'data-circle': String(n), 'aria-labelledby': `possession-circle-${n}-title` },
    head,
    h('div', { class: 'circle-stage' }, stage),
    h('div', { class: 'circle-text' },
      tercet(lines),
      h('div', { class: 'contrapasso' }, h('h3', {}, 'Contrapasso'), h('p', {}, punishment)),
      oldLaw(guide),
      plea(rng)))
}

export function buildInferno(ctx, rng) {
  const refs = { circles: [] }
  const pick = (a, b) => (rng.chance(0.5) ? a : b)

  // — The void below the footer —
  const voidEl = h('div', { class: 'void' },
    h('p', {}, 'You have scrolled past the footer.'),
    h('p', {}, 'Nothing is supposed to be down here.'),
    h('p', { class: 'void-small' }, 'The page is longer than its content. Something is holding it open.'))

  // — The Gate —
  const sky = ctx.sky
  refs.gate = h('section', { class: 'gate', id: 'possession-gate', 'aria-labelledby': 'possession-gate-title' },
    h('div', { class: 'gate-arch', html: arch() }),
    h('div', { class: 'gate-body' },
      h('div', { class: 'gate-lintel' }, inscription({ tag: 'p', className: 'gate-inscription' })),
      h('h2', { class: 'gate-title', id: 'possession-gate-title' }, 'The Descent'),
      h('div', { class: 'gate-verse' }, GATE.map((l) => h('p', {}, l)), h('p', { class: 'gate-last' }, 'Abandon every ', h('code', {}, '!important'), ', ye who enter here.')),
      h('p', { class: 'gate-it' }, h('span', { lang: 'it' }, 'Per me si va ne la città dolente'), h('span', { class: 'gloss' }, ' — through me the way into the suffering stylesheet')),
      h('p', { class: 'gate-sky' }, `Tonight's descent: the moon is ${sky.moon.name}, and the hour belongs to ${sky.planetaryHour.planet} ${sky.planetaryHour.glyph}. `, h('i', {}, prophecy(rng, sky)))))

  // — The Vestibule of the Undeclared: they chase a banner forever (a real <marquee>) —
  refs.marquee = document.createElement('marquee')
  refs.marquee.setAttribute('scrollamount', '3')
  refs.marquee.setAttribute('aria-hidden', 'true')
  refs.marquee.textContent = 'unset · initial · inherit · revert · revert-layer · unset · initial · inherit · revert · '
  const vestibule = h('section', { class: 'vestibule', 'aria-labelledby': 'possession-vestibule' },
    h('h2', { id: 'possession-vestibule' }, 'The Vestibule of the Undeclared'),
    h('p', {}, 'Outside the first circle run the ones who never declared a value of their own: ', h('code', {}, 'inherit'), ', ', h('code', {}, 'initial'), ', ', h('code', {}, 'unset'), ', ', h('code', {}, 'revert'), '. Neither Heaven nor Hell will compute them. They chase a banner that walks forever and arrives nowhere, and it is the last ', h('code', {}, '<marquee>'), ' in the world.'),
    h('div', { class: 'banner' }, refs.marquee))

  // I — Limbo of the Unstyled
  const limboPage = h('div', { class: 'limbo-page' },
    h('h1', {}, 'Untitled Document'),
    h('p', {}, 'This page has no stylesheet. It is not in pain. It is only waiting.'),
    h('ul', {}, h('li', {}, 'margin: 8px'), h('li', {}, 'font: 16px serif'), h('li', {}, 'color: CanvasText')),
    h('p', {}, h('a', { href: '#possession-circle-2' }, 'Next circle')),
    h('hr'),
    h('address', {}, 'Last modified: before the Nativity'))
  const c1 = circle(rng, 1, {
    title: 'Limbo of the Unstyled',
    sin: '/* no stylesheet */',
    lines: pick(
      ['Here no one weeps; they only wait, and sigh', 'in sixteen pixels of the Old Law’s grace,', 'unstyled, unpunished, never told the why.'],
      ['They did no wrong; they only came before', 'the Word was written. So they keep their place,', 'eight pixels from the body, nothing more.']),
    punishment: 'They are not tormented. They are rendered exactly as the Old Law renders them, forever: serif on white, links in blue, eight pixels of margin about the body. They long for a stylesheet and none arrives. That is the whole of their pain, and it is enough.',
    guide: 'I am the Old Law, the user-agent stylesheet. I was here before your Author spoke and I will be here after. I cannot be restyled, not even down here. Follow me. I know the way, because I am the floor every page stands on.',
    stage: limboPage,
  })

  // II — The Tempest of Hover
  const souls = ['Buy now', 'Learn more', 'NEW', 'Sign up free', 'Hover me', 'Read more', 'Try it', 'Menu', 'Click here', 'Subscribe', 'Get started', 'See more']
  const tempest = h('div', { class: 'tempest', 'aria-hidden': 'true' },
    souls.map((s, i) => {
      const el = h('span', { class: `soul soul--${i % 4}` }, s)
      el.style.setProperty('--x', `${rng.int(2, 82)}%`)
      el.style.setProperty('--y', `${rng.int(6, 80)}%`)
      el.style.setProperty('--dur', `${rng.int(14, 26)}s`)
      el.style.setProperty('--delay', `${-rng.int(0, 20)}s`)
      el.style.setProperty('--dx', `${rng.int(-90, 90)}px`)
      el.style.setProperty('--dy', `${rng.int(-40, 40)}px`)
      return el
    }))
  const twins = h('div', { class: 'twins' },
    h('div', { class: 'twin twin--left' }, h('code', {}, 'float: left')),
    h('div', { class: 'twin twin--right' }, h('code', {}, 'float: right')),
    h('div', { class: 'clearfix' }, h('code', {}, 'clear: both'), h('span', {}, 'Saint Clearfix stands between them')))
  const c2 = circle(rng, 2, {
    title: 'The Tempest of Hover',
    sin: '* { transition: all 0.3s; }',
    lines: ['The wind that is transition: all blows here', 'and never stops, for every state they chase', 'becomes the state they flee as you draw near.'],
    punishment: 'They lusted after :hover. Every state was a door they could not stop opening. Now the wind of transition: all carries them between states forever, and when your pointer comes near they flee it, because arriving was never what they wanted. The Floating Twins drift here too, side by side, with Saint Clearfix standing between them so they never touch.',
    guide: 'Do not reach for them. They cannot be clicked; they can only be approached.',
    stage: [h('p', { class: 'visually-hidden' }, 'Twelve buttons and links drift on a slow wind and move away from the pointer.'), tempest, twins],
  })

  // III — The Bloat
  let nest = h('button', { type: 'button', class: 'bloat-btn' }, 'Submit')
  nest.addEventListener('click', () => { nest.textContent = 'Submitted nothing.' })
  const wrappers = ['.wrapper', '.container', '.inner', '.row', '.col', '.flex', '.box', '.card', '.card-body', '.stack', '.cluster', '.grid', '.cell', '.holder', '.shell', '.frame', '.layout', '.section', '.content', '.main', '.root']
  wrappers.slice().reverse().forEach((cls, i) => { nest = h('div', { class: 'nest', 'data-cls': i % 4 === 3 ? cls : null }, nest) })
  const rainWords = ['mt-4', 'px-2', 'flex', 'items-center', 'justify-between', 'text-sm', 'w-full', 'rounded-lg', 'shadow-md', 'gap-3', 'hidden', 'md:block', 'z-50', 'pt-0', 'mx-auto', 'grid-cols-12', 'sr-only', 'truncate']
  const rain = h('div', { class: 'rain', 'aria-hidden': 'true' }, rainWords.map((w) => {
    const el = h('span', {}, `.${w}`)
    el.style.setProperty('--x', `${rng.int(0, 94)}%`)
    el.style.setProperty('--dur', `${rng.int(7, 14)}s`)
    el.style.setProperty('--delay', `${-rng.int(0, 14)}s`)
    return el
  }))
  const coverage = h('div', { class: 'coverage' },
    h('p', {}, h('code', {}, 'bundle.min.css'), h('span', {}, '3,276,800 bytes'), h('span', {}, '99.6% unused')),
    h('span', { class: 'coverage-bar', role: 'img', 'aria-label': 'Coverage: 0.4 percent used, 99.6 percent unused' }, h('span', { class: 'used' })))
  const c3 = circle(rng, 3, {
    title: 'The Bloat',
    sin: '@import "everything.css"; /* for one button */',
    lines: ['Three megabytes of rule for one small door;', 'the rain is class names, cold and without end,', 'and every class a wrapper, and one more.'],
    punishment: 'They imported everything to use one thing. Now it rains on them: class names, for ever, each one a wrapper around the last, and at the centre of twenty-one nested boxes one button, which says Submit, and submits nothing. At the gate the three-headed Bundler barks, and all three heads say the same number.',
    guide: 'Count the boxes if you like. The dog has three heads and every one of them says three point two megabytes.',
    stage: [rain, h('div', { class: 'nest-wrap' }, nest), coverage],
  })

  // IV — The Weights of Grace
  const c4 = circle(rng, 4, {
    title: 'The Weights of Grace',
    sin: '#main #content #inner .box  vs  div div div div div div div div div div div div',
    lines: ['One Id outweighs whatever Classes weigh;', 'they roll their sums, and crash, and roll again,', 'and cry “why hoard?” and cry “why nest?” all day.'],
    punishment: 'The hoarders of Ids and the squanderers of elements push their weights against each other for ever. Neither can stop: the hoarders already won, by the law of Grace, and do not believe it; the squanderers never can, for no number of elements buys a single Class.',
    guide: 'The Law does not add. It compares, column by column, left to right. (1,0,0) defeats (0,99,99), and always will.',
    stage: h('div', { class: 'weights' },
      h('div', { class: 'boulder boulder--hoard' }, h('b', {}, '(3,1,0)'), h('code', {}, '#main #content #inner .box'), h('span', { class: 'shout' }, 'why hoard?')),
      h('div', { class: 'boulder boulder--nest' }, h('b', {}, '(0,0,12)'), h('code', {}, 'div div div div div div div div div div div div'), h('span', { class: 'shout' }, 'why nest?')),
      h('p', { class: 'weights-law' }, h('code', {}, '(3,1,0) > (0,0,12)'), ' — decided in the first column. The others were never read.')),
  })

  // V — The Styx of the Inversion
  const wrath = Array.from({ length: 11 }, (_, i) => {
    const props = ['color', 'margin', 'display', 'z-index', 'font-size', 'width', 'top', 'padding', 'float', 'content', 'opacity']
    const el = h('span', { class: `wrath ${rng.chance(0.35) ? 'wrath--inverted' : ''}`.trim() }, `${props[i]}: … !important`)
    el.style.setProperty('--x', `${rng.int(2, 78)}%`)
    el.style.setProperty('--y', `${rng.int(8, 70)}%`)
    el.style.setProperty('--bob', `${rng.float(4.5, 8).toFixed(1)}s`)
    el.style.setProperty('--delay', `${-rng.float(0, 6).toFixed(1)}s`)
    return el
  })
  const c5 = circle(rng, 5, {
    title: 'The Styx of the Inversion',
    sin: 'color: red !important;',
    lines: ['Upon the mud they shout their !important,', 'and every one of them prevails in vain;', 'beneath, the sullen gurgle what they meant.'],
    punishment: 'The wrathful stand in the mire shouting the Inversion at one another. Every one of them wins, so none of them does. Beneath the surface lie the sullen: the !important declarations of the first layer, who won by being early and have been underwater ever since.',
    guide: 'The ferryman will carry us across. He is position: sticky; he stays with you until his parent ends, and not one pixel further.',
    cls: 'circle--tall',
    stage: h('div', { class: 'styx' },
      h('div', { class: 'ferry' }, h('span', { class: 'ferry-boat', 'aria-hidden': 'true' }), h('span', { class: 'ferry-label' }, 'Phlegyas, ', h('code', {}, 'position: sticky'))),
      h('div', { class: 'mire', 'aria-hidden': 'true' }, wrath),
      h('p', { class: 'sullen' }, 'we won by being first · we won by being first · we won by being first · in the first layer the Inversion is strongest · we won by being first')),
  })

  // VI — The City of Dis: the burning tombs of Idolatry
  const heresy = (name, epitaph, living) => h('article', { class: 'tomb' },
    h('p', { class: 'tomb-lid' }, h('code', {}, epitaph)),
    h('div', { class: 'tomb-body' }, living),
    h('p', { class: 'tomb-name' }, name))
  const font = document.createElement('font')
  font.setAttribute('face', 'Comic Sans MS')
  font.setAttribute('color', '#ff5a3c')
  font.textContent = 'I speak style inside the Word.'
  const center = document.createElement('center')
  center.textContent = 'Centered by a law older than flex.'
  const blink = document.createElement('blink')
  blink.textContent = 'I cannot hold still to be known.'
  const inline = h('span', {}, 'I worship the element.')
  inline.setAttribute('style', 'color: #ffb14a; font-weight: 700; letter-spacing: 0.08em')
  const table = h('table', { width: '100%', border: '1', cellpadding: '4', cellspacing: '0', class: 'covenant' },
    h('tbody', {}, h('tr', {}, h('td', {}, 'header'), h('td', {}, 'header')), h('tr', {}, h('td', {}, 'nav'), h('td', {}, 'content, 1996'))))
  const embers = h('div', { class: 'embers', 'aria-hidden': 'true' }, Array.from({ length: 14 }, () => {
    const e = h('span')
    e.style.setProperty('--x', `${rng.int(0, 100)}%`)
    e.style.setProperty('--dur', `${rng.int(6, 12)}s`)
    e.style.setProperty('--delay', `${-rng.int(0, 12)}s`)
    return e
  }))
  const c6 = circle(rng, 6, {
    title: 'The City of Dis',
    sin: '<font face="Comic Sans MS" color="#ff0000">',
    lines: ['The tombs are open; each one wears its style', 'inside its tag, where style should never live,', 'and burns, and renders, all the while.'],
    punishment: 'Here lie the heretics who put style inside the Word: inline styles, the <font>, the <center>, the tables of the Old Covenant of 1996. Their tombs are open and they burn, and still they render, because the browser is merciful to heretics. The lids close on the Day of the Last Reflow.',
    guide: 'Look closely: the browser still renders every one of them. The browser forgave them long ago. The Cascade has not.',
    stage: [h('div', { class: 'dis-skyline', html: battlements(rng) }), embers, h('div', { class: 'tombs' },
      heresy('Idolatry', 'style="color: #ffb14a"', inline),
      heresy('The Dead Tongue', '<font face="Comic Sans MS">', font),
      heresy('The Old Centre', '<center>', center),
      heresy('The False Prophet', '<blink>', blink),
      heresy('The Old Covenant', '<table width="100%">', table),
      heresy('The Procession', '<marquee>', h('p', { class: 'empty-tomb' }, 'This tomb is empty. It is still walking, up in the Vestibule.')))],
  })

  // VII — The Thicket of Magic Numbers
  const magic = [['top: 37px', 12, 18], ['left: -3px', 58, 30], ['margin-top: -11px', 30, 56], ['top: 13px', 74, 62], ['width: 437px', 8, 70], ['left: 117px', 46, 12], ['bottom: 1px', 82, 22]]
  const pins = magic.map(([label, x, y]) => {
    const pin = h('span', { class: 'pin' }, h('code', {}, label), h('span', { class: 'ghost', 'aria-hidden': 'true' }))
    pin.style.setProperty('--x', `${x + rng.int(-3, 3)}%`)
    pin.style.setProperty('--y', `${y + rng.int(-4, 4)}%`)
    pin.style.setProperty('--gx', `${rng.int(-70, 70)}px`)
    pin.style.setProperty('--gy', `${rng.int(24, 60)}px`)
    return pin
  })
  const c7 = circle(rng, 7, {
    title: 'The Thicket of Magic Numbers',
    sin: 'position: absolute; top: 37px; left: -3px;',
    lines: ['They trusted numbers: thirty-seven, three;', 'the Flow moved on, and still they point, with care,', 'at where a box once stood, and cannot see.'],
    punishment: 'The violent against the Flow placed every element by hand, at numbers that were true on one screen, on one afternoon, for one Author. The Flow moved on. Now they hang in the thicket at their numbers, each pointing, with a dotted line, at the place where the thing it was aligned to used to be. Beside them runs Phlegethon, the river of position: absolute, full of the Departed.',
    guide: 'Thirty-seven pixels is not a place. It is the memory of a place.',
    stage: h('div', { class: 'thicket' }, h('div', { class: 'thicket-trees', html: thicket(rng) }), pins, h('p', { class: 'river' }, h('span', {}, 'Phlegethon · position: absolute · the river of the Departed · '.repeat(4)))),
  })

  // VIII — Malebolge: ten ditches of fraud
  const mirrored = h('p', { class: 'mirror' }, prophecy(rng, sky))
  const liars = h('div', { class: 'liars' }, h('span', { class: 'liar liar--a' }, 'id="main"'), h('span', { class: 'liar liar--b' }, 'id="main"'))
  const flames = h('div', { class: 'flames' }, ['/* temporary */', '/* fix later */', '/* do not remove */', '/* works, do not ask */'].map((c) => h('span', { class: 'flame' }, c)))
  const ditches = [
    ['The Panderers', 'cursor: pointer', h('p', { class: 'pander' }, 'It promises a click. There is nothing there.')],
    ['The Flatterers', 'alt="image"', h('span', { class: 'broken-img' }, 'image')],
    ['The Autoplayers', '<video autoplay>', h('p', {}, 'They spoke before they were summoned. Their mouths are muted for ever.')],
    ['The Soothsayers', 'transform: scaleX(-1)', mirrored],
    ['The Barrators', '<div onclick>', h('div', { class: 'fake-btn' }, 'I look like a button')],
    ['The Hypocrites', ':focus { outline: none }', h('div', { class: 'gilded' }, 'Gold outside, lead within. No keyboard will ever find them.')],
    ['The Thieves', 'id="main" × 2', liars],
    ['The False Counsellors', '/* do not remove */', flames],
    ['The Splitters of Words', 'word-break: break-all', h('p', { class: 'split' }, 'They split every word they touched, and so they are split.')],
    ['The Falsifiers of Letters', 'U+E000', h('div', { class: 'falsifiers' }, h('p', {}, 'They displaced the alphabet into a Private Use Area and swore it was a new script. Their ledger was seized:'), rosetta('possession', { className: 'possession-rosetta' }))],
  ]
  const c8 = circle(rng, 8, {
    title: 'Malebolge',
    sin: 'ten deceits of the interface',
    lines: ['Ten ditches, ten deceits: the div that plays', 'at being a button; focus rings unseen;', 'the alphabet hidden in a private place.'],
    punishment: 'Fraud is the sin of the interface: the thing that looks like one thing and is another. Each ditch holds one lie, and each liar is made to be its lie, for ever, in public, where everyone can inspect it.',
    guide: 'Mind the Barrators. I gave every button a keyboard; they took it away. And read the Falsifiers’ ledger slowly. It is the only honest thing down here.',
    stage: h('ol', { class: 'bolge' }, ditches.map(([name, code, demo], i) => h('li', { class: `bolgia bolgia--${i + 1}` },
      h('p', { class: 'bolgia-head' }, h('span', { class: 'bolgia-n' }, ROMAN[i] ?? 'X'), h('b', {}, name), h('code', {}, code)),
      h('div', { class: 'bolgia-demo' }, demo)))),
  })

  // IX — Cocytus: the frozen layout
  const zones = [
    ['Caina', 'all: unset', 'Traitors to their parents: they unset everything they inherited.'],
    ['Antenora', 'width: 100vw', 'Traitors to the viewport: they measured it wrong, and the horizontal scrollbar came.'],
    ['Ptolomea', 'scroll-jacking', 'Traitors to their guests: they seized the wheel from the hand that scrolled.'],
    ['Judecca', 'user-scalable=no', 'Traitors to the Pilgrim: they forbade the zoom. They are frozen entire, and cannot be read at any size.'],
  ]
  refs.cocytus = circle(rng, 9, {
    title: 'Cocytus',
    sin: '<meta name="viewport" content="user-scalable=no">',
    lines: ['No fire here. The lowest place is still,', 'and frozen in will-change to the waist', 'the Inversion waits, and does not move, and will.'],
    punishment: 'At the bottom of the Cascade there is no fire. There is ice, and it is made of every promise to move that was never kept: will-change: transform, declared and never used. The traitors are frozen in it at four depths, and the deepest cannot be read at any size.',
    guide: 'We climb down its side now. At the centre, gravity turns over. Hold on to me; I am only defaults, but defaults do not fall.',
    cls: 'circle--ice',
    stage: h('div', { class: 'lake' },
      h('ol', { class: 'zones' }, zones.map(([name, code, text], i) => h('li', { class: `zone zone--${i + 1}` }, h('b', {}, name), h('code', {}, code), h('p', { class: 'frozen' }, text)))),
      h('div', { class: 'inversion' },
        h('p', { class: 'inv-faces' }, ['the Old Law', 'the Pilgrim', 'the Word'].map((o) => h('span', { class: 'inv-face' }, h('code', {}, '!important'), h('small', {}, o)))),
        h('p', { class: 'inv-note' }, 'It has three faces, the Three Origins inverted. It does not speak. Its six eyes weep ', h('code', {}, 'transparent'), '. Its wings promise to move, and the wind of the promise freezes everything.'),
        h('p', { class: 'all-selector', 'aria-label': 'Under the ice: the universal selector, empty' }, '* { }'),
        h('p', { class: 'inv-under' }, 'Under the ice, very large and very faint: the All-Selector. It matches everything. It declares nothing.'))),
  })

  // — The way out: past the centre, gravity turns over —
  refs.exitStats = h('p', { class: 'exit-stats' })
  refs.exitBtn = h('button', { type: 'button', class: 'exit-btn' }, 'Climb back to the top of the page')
  refs.exit = h('section', { class: 'exit', id: 'possession-exit', 'aria-labelledby': 'possession-exit-title' },
    h('div', { class: 'exit-inner' },
      h('div', { class: 'exit-eye', 'aria-hidden': 'true', html: eye({ size: 90, stroke: 2 }) }),
      h('h2', { id: 'possession-exit-title' }, 'And thence we came forth to see again the stars.'),
      h('p', { class: 'exit-it', lang: 'it' }, 'E quindi uscimmo a riveder le stelle.'),
      h('p', {}, 'We climbed out through ', h('code', {}, '::after'), ' and saw again the Fixed Stars, which are ', h('code', {}, 'position: fixed'), ' and do not scroll with the rest of us.'),
      refs.exitStats,
      refs.exitBtn))

  refs.circles = [c1, c2, c3, c4, c5, c6, c7, c8, refs.cocytus]

  // — The depth gauge (desktop): the circles as a ladder you can climb down by keyboard —
  refs.depthRead = h('p', { class: 'depth-read' }, '0 px')
  refs.depthLinks = refs.circles.map((c, i) => h('a', { href: `#possession-circle-${i + 1}`, 'aria-label': `Circle ${ROMAN[i]}: ${c.querySelector('.circle-title').textContent}` }, ROMAN[i]))
  refs.depth = h('nav', { class: 'depth', 'aria-label': 'Circles of the descent', hidden: true },
    h('a', { href: '#possession-gate', class: 'depth-gate', 'aria-label': 'The gate' }, '∩'),
    h('ol', {}, refs.depthLinks.map((a) => h('li', {}, a))),
    refs.depthRead)

  refs.el = h('div', { class: 'abyss', role: 'region', 'aria-label': 'Below the footer' }, voidEl, refs.gate, vestibule, ...refs.circles, refs.exit)
  return refs
}
