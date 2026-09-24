// ARBOR DOCUMENTI. The tree of this very page, drawn from the life in the manner of the old herbals:
// its root is :root, its trunk the body, every leaf an element. Branches are named in the script of the
// Cascade (a curious reader who copies them gets the tag names back). The red fruit is Mercy, the gold
// bezant is the temple. It is read from the real document when the codex is laid open, so if the
// Authors change the page, the tree changes with it.
import { bezant, f } from './art.js'

const MAX_DEPTH = 6
const MAX_KIDS = 4
const INK = '#2b1b10'

export function gatherTree(el, depth = 0) {
  const kids = depth < MAX_DEPTH ? [...el.children] : []
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    depth,
    more: Math.max(0, kids.length - MAX_KIDS),
    kids: kids.slice(0, MAX_KIDS).map((k) => gatherTree(k, depth + 1)),
  }
}

function countLeaves(n) {
  n.leaves = n.kids.length ? n.kids.reduce((a, k) => a + countLeaves(k), 0) : 1
  return n.leaves
}

function leafShape(x, y, angle, size, fill) {
  const s = size
  return `<path d="M0 0 Q ${f(s * 0.5)} ${f(-s * 0.45)} ${f(s)} 0 Q ${f(s * 0.5)} ${f(s * 0.45)} 0 0 Z M0 0 L ${f(s * 0.8)} 0" transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})" fill="${fill}" stroke="${INK}" stroke-width=".5"/>`
}

export function arborSvg(root, rng, { W = 140, H = 330, gradId = 'sn-gold' } = {}) {
  countLeaves(root)
  const top = 16
  const base = H - 52
  const gap = (base - top) / MAX_DEPTH
  const nodes = []
  ;(function place(n, x0, x1) {
    n.x = (x0 + x1) / 2 + rng.float(-1.6, 1.6)
    n.y = base - n.depth * gap + (n.depth ? rng.float(-4, 4) : 0)
    nodes.push(n)
    let x = x0
    for (const k of n.kids) {
      const w = ((x1 - x0) * k.leaves) / n.leaves
      place(k, x, x + w)
      x += w
    }
  })(root, 6, W - 6)

  let stems = ''
  let leaves = ''
  let knots = ''
  let labels = ''
  for (const n of nodes) {
    for (const k of n.kids) {
      const my = (n.y + k.y) / 2
      const sw = Math.max(0.6, 3.6 - n.depth * 0.55)
      stems += `<path d="M${f(n.x)} ${f(n.y)} C ${f(n.x)} ${f(my + 4)} ${f(k.x)} ${f(my - 2)} ${f(k.x)} ${f(k.y)}" stroke-width="${f(sw)}"/>`
    }
    // A tuft of little twigs where more children grow than could be drawn.
    if (n.more) {
      for (let i = 0; i < Math.min(3, n.more); i++) {
        const a = -90 + rng.float(-50, 50)
        const r = rng.float(5, 9)
        const ex = n.x + Math.cos((a * Math.PI) / 180) * r
        const ey = n.y + Math.sin((a * Math.PI) / 180) * r
        stems += `<path d="M${f(n.x)} ${f(n.y)} L${f(ex)} ${f(ey)}" stroke-width=".5"/>`
        knots += `<circle cx="${f(ex)}" cy="${f(ey)}" r=".9" fill="${INK}"/>`
      }
    }
    if (n.id === 'mercy') {
      knots += `<g class="sn-arbor-mercy"><path d="M${f(n.x)} ${f(n.y - 5.5)} l -1.5 -3 M${f(n.x)} ${f(n.y - 5.5)} l 2 -2.5" stroke="${INK}" stroke-width=".6"/><circle cx="${f(n.x)}" cy="${f(n.y)}" r="5" fill="#b3301c" stroke="${INK}" stroke-width=".7"/><circle cx="${f(n.x - 1.6)}" cy="${f(n.y - 1.6)}" r="1.3" fill="#f3b8a0" opacity=".8"/></g>`
    } else if (n.id === 'temple') {
      knots += bezant(n.x, n.y, 3.4, gradId)
    } else if (!n.kids.length) {
      const parent = nodes.find((p) => p.kids.includes(n))
      const angle = parent ? (Math.atan2(n.y - parent.y, n.x - parent.x) * 180) / Math.PI : -90
      const fill = rng.pick(['rgba(79,138,95,.62)', 'rgba(79,138,95,.62)', 'rgba(79,138,95,.5)', 'rgba(199,154,46,.7)'])
      leaves += leafShape(n.x, n.y, angle + rng.float(-25, 25), rng.float(7, 10), fill)
    } else {
      knots += `<circle cx="${f(n.x)}" cy="${f(n.y)}" r="${n.depth ? 1.5 : 2.4}" fill="#f1e6c9" stroke="${INK}" stroke-width=".7"/>`
    }
    // Names for the branches that bear more than one leaf, for the trunk, and for Mercy.
    if ((n.kids.length && n.leaves > 1 && n.depth <= 4) || n.id === 'mercy') {
      const right = n.x < W * 0.62
      labels += n.id === 'mercy'
        ? `<text x="${f(n.x)}" y="${f(n.y + 13)}" text-anchor="middle" class="sn-arbor-label sn-arbor-label--mercy">${n.tag}</text>`
        : `<text x="${f(n.x + (right ? 4 : -4))}" y="${f(n.y - 2.5)}" text-anchor="${right ? 'start' : 'end'}" class="sn-arbor-label">${n.tag}</text>`
    }
  }

  // The roots, below the ground line: :root.
  let roots = ''
  for (let i = 0; i < 6; i++) {
    const dx = rng.float(-26, 26)
    const len = rng.float(12, 30)
    roots += `<path d="M${f(root.x + dx * 0.15)} ${f(base + 1)} q ${f(dx * 0.4)} ${f(len * 0.4)} ${f(dx)} ${f(len)}" stroke-width="${f(rng.float(0.6, 1.4))}"/>`
  }
  let hatch = ''
  for (let x = 10; x < W - 10; x += 5) hatch += `M${f(x)} ${f(base + 3 + rng.float(0, 5))} l 2 -1.5 `

  return `<svg class="sn-arbor-svg" viewBox="0 0 ${W} ${H}" fill="none" stroke-linecap="round" aria-hidden="true" focusable="false">
<path d="M6 ${f(base + 1)} C ${W * 0.3} ${f(base - 1)} ${W * 0.7} ${f(base + 3)} ${W - 6} ${f(base)}" stroke="${INK}" stroke-width=".9"/>
<path d="${hatch}" stroke="rgba(43,27,16,.35)" stroke-width=".5"/>
<g stroke="${INK}" opacity=".85">${roots}</g>
<text x="${f(root.x)}" y="${H - 6}" text-anchor="middle" class="sn-arbor-root">:root</text>
<g stroke="${INK}">${stems}</g>${leaves}${knots}
<g class="sn-arbor-labels">${labels}</g>
</svg>`
}
