// THE INTERSTICE · the plan of the floor, drawn as walked: the part of the DOM tree your feet have been
// through, like an old dungeon crawler's automap. Depth runs down the sheet, siblings run across it, and
// each room is labelled with the glyph of its nth-child (A1Z26: the 16th child wears the glyph of p),
// which the key at the foot of the plan (the face's Rosetta fragment) lets you read.
import { keyOf, parentOf, indexOf, same } from './world.js'

const SVGNS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs = {}, text) => {
  const e = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, String(v))
  if (text != null) e.textContent = text
  return e
}

export function makePlan() {
  const pos = new Map() // key -> {x, y, path}
  const anchor = new Map() // parent key -> the index of the first of its children placed
  const links = new Set() // 'a|b'
  const order = []

  function place(path) {
    const k = keyOf(path)
    if (pos.has(k)) return pos.get(k)
    let p = null
    const parent = path.length ? parentOf(path) : null
    const pk = parent ? keyOf(parent) : null
    if (parent && pos.has(pk)) {
      if (!anchor.has(pk)) anchor.set(pk, indexOf(path))
      const at = pos.get(pk)
      p = { x: at.x + (indexOf(path) - anchor.get(pk)), y: at.y + 1 }
    } else if (parent) {
      // a sibling already on the plan?
      for (const [, q] of pos) {
        if (q.path.length === path.length && same(parentOf(q.path), parent)) { p = { x: q.x + (indexOf(path) - indexOf(q.path)), y: q.y }; break }
      }
    }
    if (!p) {
      // a child already on the plan (we came up out of it)?
      for (const [, q] of pos) {
        if (q.path.length === path.length + 1 && same(parentOf(q.path), path)) {
          anchor.set(k, indexOf(q.path))
          p = { x: q.x, y: q.y - 1 }
          break
        }
      }
    }
    if (!p) p = { x: 0, y: 0 }
    const at = { ...p, path }
    pos.set(k, at)
    order.push(k)
    return at
  }

  return {
    walk(from, to) {
      const a = place(to)
      if (from) {
        place(from)
        const pair = [keyOf(from), keyOf(to)].sort().join('|')
        links.add(pair)
      }
      return a
    },
    has: (path) => pos.has(keyOf(path)),
    get count() { return pos.size },
    // Draw the plan into `svg`. marks: {here, origin, seed (path or null), solved, exits: [paths]}
    draw(svg, marks) {
      const pts = [...pos.values()]
      // Doorways of the room you stand in that lead somewhere you have not been: drawn as dashed rooms.
      const here = pos.get(keyOf(marks.here))
      const stubs = (marks.exits ?? []).filter((e) => e.to && !pos.has(keyOf(e.to)))
      const kids = stubs.filter((e) => e.dir === 'far')
      const hk = keyOf(marks.here)
      const stubPts = here ? stubs.map((e) => {
        if (e.dir === 'far') {
          const i = kids.indexOf(e)
          const x = anchor.has(hk) ? here.x + (indexOf(e.to) - anchor.get(hk)) : here.x + i - (kids.length - 1) / 2
          return { x, y: here.y + 1, path: e.to }
        }
        return { x: here.x + (e.dir === 'left' ? -1 : 1), y: here.y, path: e.to }
      }) : []
      const all = [...pts, ...stubPts]
      const xs = all.map((p) => p.x)
      const ys = all.map((p) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const C = 26
      const pad = 18
      const W = (maxX - minX) * C + pad * 2
      const H = (maxY - minY) * C + pad * 2
      const X = (p) => (p.x - minX) * C + pad
      const Y = (p) => (p.y - minY) * C + pad
      svg.setAttribute('viewBox', `0 0 ${Math.max(W, 120)} ${Math.max(H, 90)}`)
      svg.replaceChildren()
      const shiftX = Math.max(0, (120 - W) / 2)
      const shiftY = Math.max(0, (90 - H) / 2)
      const g = el('g', { transform: `translate(${shiftX} ${shiftY})` })
      svg.append(g)
      // the graph paper is drawn in CSS; here only the pencil
      for (const pair of links) {
        const [a, b] = pair.split('|').map((k) => pos.get(k))
        if (!a || !b) continue
        g.append(el('line', { x1: X(a), y1: Y(a), x2: X(b), y2: Y(b), class: 'ix-plan-link' }))
      }
      for (const s of stubPts) {
        g.append(el('line', { x1: X(here), y1: Y(here), x2: X(s), y2: Y(s), class: 'ix-plan-link ix-plan-link--stub' }))
        g.append(el('rect', { x: X(s) - 6, y: Y(s) - 6, width: 12, height: 12, class: 'ix-plan-room ix-plan-room--stub' }))
      }
      for (const p of pts) {
        const isSeed = marks.seed && same(p.path, marks.seed)
        const cls = ['ix-plan-room']
        if (same(p.path, marks.origin)) cls.push('is-origin')
        if (isSeed) cls.push('is-seed')
        g.append(el('rect', { x: X(p) - 8, y: Y(p) - 8, width: 16, height: 16, class: cls.join(' ') }))
        const n = indexOf(p.path)
        const label = !p.path.length ? 'b' : n <= 26 ? String.fromCharCode(96 + n) : null
        if (label) g.append(el('text', { x: X(p), y: Y(p) + 4.2, class: 'ix-plan-glyph', 'text-anchor': 'middle', lang: 'x-cascade' }, label))
        else g.append(el('text', { x: X(p), y: Y(p) + 3, class: 'ix-plan-num', 'text-anchor': 'middle' }, String(n)))
      }
      const o = pos.get(keyOf(marks.origin))
      if (o) g.append(el('path', { d: `M${X(o) - 13} ${Y(o) + 13} l5 -5 l5 5 z`, class: 'ix-plan-in' }))
      if (here) {
        g.append(el('circle', { cx: X(here) + 9, cy: Y(here) - 9, r: 4.2, class: 'ix-plan-here' }))
      }
    },
  }
}
