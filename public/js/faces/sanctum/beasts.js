// THE BESTIARY OF THE MARGINS. Drolleries, as the old illuminators drew them in the bas-de-page:
// snails, hares, apes and wyrms. In the Cascade each creature IS a CSS declaration, and performs it
// when the reader lays a hand on it (click or Enter). Drawn in iron-gall line with thin washes.
import { smooth, spiralPts, f } from './art.js'

const eye = (x, y, r = 2.6) =>
  `<g class="sn-eye"><circle class="sn-eyeball" cx="${x}" cy="${y}" r="${r}"/><circle class="sn-pupil" cx="${x}" cy="${y}" r="${f(r * 0.5)}"/></g>`

function snail() {
  const shell = smooth(spiralPts(66, 49, 21, Math.PI * 0.75, 2.4, -1, 30, 0.08))
  return `<g class="sn-actor">
<path class="w-flesh" d="M16 79 C 14 71 17 62 23 58 C 28 55 33 58 34 63 C 35 68 38 71 44 72 L 96 73 C 102 73 106 76 106 79 C 90 83 42 84 16 79 Z"/>
<path d="M24 59 C 22 50 17 44 12 39"/><path d="M30 58 C 30 49 29 42 31 35"/>
${eye(12, 38, 2.4)}${eye(31, 34, 2.4)}
<circle class="w-ochre" cx="66" cy="49" r="23"/>
<path d="${shell}"/>
<path class="sn-hatch" d="M50 66 l3 -3 M56 70 l3 -3 M62 71 l3 -3 M72 70 l3 -3 M80 66 l3 -3"/>
<path d="M22 76 q 2 2 5 2" />
</g>`
}

function hare() {
  let rungs = ''
  for (let y = 10; y <= 94; y += 10) rungs += `M32 ${y} L48 ${y} `
  return `<path class="sn-ladder" d="M32 99 L32 2 M48 99 L48 2 ${rungs}"/>
<g class="sn-actor">
<path class="w-grey" d="M56 82 C 52 67 58 53 72 51 C 86 49 96 59 94 73 C 93 81 86 85 76 85 L 60 85 C 56 85 55 84 56 82 Z"/>
<path d="M78 85 C 90 87 98 85 100 81"/>
<path d="M62 63 C 57 60 53 58 48 57"/><path d="M48 57 l-2 -2 M48 57 l-2 2"/>
<path class="w-grey" d="M70 51 C 68 43 72 35 80 35 C 88 35 92 41 90 47 C 88 53 78 55 70 51 Z"/>
<path class="w-grey" d="M76 36 C 72 25 70 15 72 7 C 76 13 80 25 80 35 Z"/>
<path class="w-grey" d="M82 35 C 84 23 88 13 92 9 C 92 19 88 29 86 36 Z"/>
${eye(82, 43, 2.3)}
<circle cx="89" cy="46" r="1" class="w-ink"/>
<circle class="w-white" cx="95" cy="72" r="3.5"/>
<path class="w-gold" d="M90 48 L106 55 L108 50 Z"/><path class="w-gold" d="M106 55 L114 58 L116 46 L108 50"/>
</g>`
}

function crane() {
  return `<path class="sn-ground" d="M40 97 C 46 93 50 97 56 93 C 62 97 68 94 76 97"/>
<g class="sn-actor">
<path d="M40 60 C 32 58 26 62 21 66 M41 64 C 33 67 28 71 25 75 M42 62 C 36 64 30 68 27 70"/>
<path class="w-blue" d="M40 60 C 44 48 62 44 76 50 C 86 54 92 62 90 66 C 80 70 56 72 44 68 C 40 66 39 63 40 60 Z"/>
<path class="w-grey sn-wing" d="M50 57 C 58 45 74 44 82 55 C 72 58 60 60 50 57 Z"/>
<path class="w-blue" d="M80 53 C 88 43 86 35 81 29 C 76 23 80 12 89 11 C 95 11 97 15 95 19 C 91 19 88 21 86 25 C 90 32 93 43 86 56 Z"/>
<path class="w-red" d="M86 11 C 90 9 94 10 95 13 C 92 14 89 14 86 13 Z"/>
<path class="w-gold" d="M95 14 L114 18 L95 19 Z"/>
${eye(90, 15, 2)}
<path d="M62 70 L60 93 M60 93 L54 96 M60 93 L66 96 M72 70 C 75 78 81 80 78 86 L 71 84"/>
</g>`
}

function ape() {
  return `<g class="sn-actor">
<path d="M40 80 C 20 84 10 70 18 60 C 24 52 32 58 28 64"/>
<path class="w-ochre" d="M40 85 C 34 71 38 57 50 53 C 62 49 72 57 72 71 C 72 81 66 87 56 87 L 44 87 C 41 87 40 86 40 85 Z"/>
<path d="M46 87 C 50 93 60 93 66 89 M56 87 C 58 95 70 95 74 91"/>
<circle class="w-ochre" cx="45" cy="38" r="4.2"/><circle class="w-ochre" cx="71" cy="38" r="4.2"/>
<circle class="w-ochre" cx="58" cy="40" r="13.5"/>
<path class="w-flesh" d="M51 42 C 51 35 65 35 65 42 C 65 49 61 53 58 53 C 55 53 51 49 51 42 Z"/>
${eye(54.5, 41, 2)}${eye(61.5, 41, 2)}
<path d="M56 48 Q 58 49.5 60 48"/>
<path d="M68 61 C 78 59 84 53 88 46"/><path d="M88 46 L 91 40"/>
<circle class="w-gold" cx="98" cy="30" r="12"/><circle class="w-glass" cx="98" cy="30" r="9"/>
<g class="sn-mirror-face"><circle class="w-ochre" cx="98" cy="31" r="5.5"/><circle cx="96" cy="30" r=".9" class="w-ink"/><circle cx="100" cy="30" r=".9" class="w-ink"/></g>
</g>`
}

function ouroboros() {
  return `<g class="sn-actor sn-ring">
<circle cx="60" cy="52" r="31" class="sn-serpent" />
<circle cx="60" cy="52" r="35.5"/><circle cx="60" cy="52" r="26.5"/>
<circle cx="60" cy="52" r="31" class="sn-scales"/>
<path class="w-green" d="M49 16 C 55 9 69 9 74 16 C 78 22 72 27 66 27 L 55 26 C 49 24 47 19 49 16 Z"/>
<path d="M49 22 L 43 21 M49 20 L 44 17"/>
<path class="w-red" d="M74 18 l6 -1 l2 -3 M80 17 l3 1"/>
${eye(67, 16, 2.2)}
</g>`
}

function cat(uid) {
  return `<defs><clipPath id="${uid}-clip"><rect class="sn-cliprect" x="0" y="0" width="120" height="100"/></clipPath></defs>
<rect class="w-wood" x="28" y="54" width="62" height="38"/>
<g class="sn-actor" clip-path="url(#${uid}-clip)">
<path class="w-grey" d="M90 72 C 101 70 105 62 103 54 C 101 47 107 42 112 46" stroke-width="3.2"/>
<path class="w-grey" d="M43 60 C 41 45 49 36 59 36 C 69 36 77 45 75 60 Z"/>
<path class="w-grey" d="M46 45 L 43 30 L 54 38 Z M72 45 L 75 30 L 64 38 Z"/>
${eye(53, 47, 2.4)}${eye(65, 47, 2.4)}
<path d="M59 51 L 57 53 M59 51 L 61 53 M49 52 L 38 50 M49 54 L 38 56 M69 52 L 80 50 M69 54 L 80 56"/>
</g>
<rect class="w-wood-front" x="28" y="58" width="62" height="36"/>
<path class="sn-hatch" d="M32 64 H86 M32 72 H86 M32 80 H86 M32 88 H86"/>
<g class="sn-paws" clip-path="url(#${uid}-clip)"><path class="w-grey" d="M47 60 C 47 55 53 55 53 60 Z M65 60 C 65 55 71 55 71 60 Z"/></g>`
}

function owl() {
  const breast = [70, 77, 84].map((y) => `M50 ${y} q 2 3 4 0 q 2 3 4 0 q 2 3 4 0 q 2 3 4 0 q 2 3 4 0`).join(' ')
  return `<path class="sn-branch" d="M20 91 C 50 89 80 92 104 88 M84 90 q 8 -8 16 -6"/>
<path class="sn-ghost" d="M42 88 C 36 70 38 48 48 40 L 44 30 L 54 37 C 58 36 62 36 66 37 L 76 30 L 72 40 C 82 48 84 70 78 88 Z"/>
<g class="sn-actor">
<path class="w-ochre" d="M42 88 C 36 70 38 48 48 40 C 54 36 66 36 72 40 C 82 48 84 70 78 88 Z"/>
<path d="M48 42 L 44 30 L 55 37 M72 42 L 76 30 L 65 37"/>
<path class="w-flesh" d="M45 52 C 45 42 58 40 60 48 C 62 40 75 42 75 52 C 75 60 66 62 60 58 C 54 62 45 60 45 52 Z"/>
${eye(53, 51, 4.4)}${eye(67, 51, 4.4)}
<path class="w-gold" d="M58 56 L 60 62 L 62 56 Z"/>
<path d="${breast}"/>
<path d="M44 56 C 40 66 40 78 44 86 M76 56 C 80 66 80 78 76 86"/>
<path d="M54 88 l -2 4 M56 88 l 0 4 M64 88 l 0 4 M66 88 l 2 4"/>
</g>`
}

function wyvern() {
  return `<g class="sn-actor">
<path d="M40 72 C 28 78 17 72 19 62 C 21 54 30 54 32 60 C 33 64 28 66 26 62"/>
<path class="w-red sn-wing" d="M54 52 C 47 36 50 22 58 11 C 60 21 68 25 77 25 C 71 30 67 36 65 44 C 63 48 58 50 54 52 Z"/>
<path d="M58 11 C 58 26 58 38 56 50 M58 11 C 62 26 64 36 60 48"/>
<path class="w-green" d="M38 66 C 40 54 54 48 66 52 C 76 55 80 64 76 72 C 70 80 50 80 40 74 C 37 72 37 69 38 66 Z"/>
<path class="w-green" d="M66 52 C 72 40 80 32 90 30 C 98 28 104 32 102 38 C 100 42 92 42 86 40 C 80 44 76 50 74 56 Z"/>
<path d="M88 30 l 2 -6 l 3 5 M94 29 l 3 -5 l 2 6"/>
${eye(94, 34, 2)}
<path class="sn-tongue" d="M102 38 L 110 40 M110 40 L 113 37 M110 40 L 113 43"/>
<path d="M52 78 L 50 88 L 46 90 M50 88 L 54 90 M66 78 L 68 88 L 64 90 M68 88 L 72 90"/>
<path class="sn-hatch" d="M46 70 l 2 -3 M52 72 l 2 -3 M58 72 l 2 -3 M64 70 l 2 -3"/>
</g>`
}

export const BEASTS = [
  {
    id: 'snail', noun: 'a snail', draw: snail, mode: 'toggle',
    decl: ['float', 'left'], alt: ['float', 'right'],
    gloss: 'The Wandering. It carries its house to the edge of the column and the text flows around it like water round a stone. Asked to clear, it declined.',
  },
  {
    id: 'hare', noun: 'a hare with a trumpet, beside a ladder', draw: hare, mode: 'timed', ms: 4200,
    decl: ['z-index', '2147483647'],
    gloss: 'It climbed to the Highest Heaven and was never again seen beneath anything. It is lonely up there. There is nothing above it to hold.',
  },
  {
    id: 'crane', noun: 'a crane standing on one leg', draw: crane, mode: 'timed', ms: 4200,
    decl: ['position', 'absolute'],
    gloss: 'The Departed: it left the flow, and the flow closed behind it as if it had never been. It is still on the page. It is simply not counted.',
  },
  {
    id: 'ape', noun: 'an ape with a looking-glass', draw: ape, mode: 'toggle',
    decl: ['transform', 'scaleX(-1)'], alt: ['transform', 'none'],
    gloss: 'The ape looks into the glass and the glass looks back reversed. Each believes it is the original. Both are right, and neither has moved.',
  },
  {
    id: 'ouroboros', noun: 'a serpent eating its own tail', draw: ouroboros, mode: 'timed', ms: 4400,
    decl: ['animation-iteration-count', 'infinite'],
    gloss: 'It eats its own keyframes and is never finished. For your sake it turns once and stops. That is mercy.',
  },
  {
    id: 'cat', noun: 'a cat in a box', draw: cat, mode: 'timed', ms: 4200,
    decl: ['overflow', 'hidden'],
    gloss: 'The cat is in the box; the box has overflow: hidden; therefore there is no cat above the rim. So it is written. So it is rendered.',
  },
  {
    id: 'owl', noun: 'an owl on a branch', draw: owl, mode: 'timed', ms: 4200,
    decl: ['visibility', 'hidden'],
    gloss: 'The Ghost. It is gone, and it still takes up room. Do not sit where it was.',
  },
  {
    id: 'wyvern', noun: 'a winged wyrm', draw: wyvern, mode: 'timed', ms: 3600,
    decl: ['color', 'red !important'],
    gloss: 'The wyrm of the Inversion wins every quarrel it enters and is loved by none. The old books draw it upside down, and so it is drawn here.',
  },
]

export function beastSvg(beast, uid) {
  return `<svg class="sn-beast-svg" viewBox="0 0 120 100" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${beast.draw(uid)}</svg>`
}
