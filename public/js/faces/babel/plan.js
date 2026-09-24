// THE PLAN OF A HEXAGON. Procedural SVG, drawn in currentColor so the face colours it with CSS.
// Four walls of five shelves (I-IV), one bare wall, one door to the hallway where the mirror hangs and
// the spiral stair turns. A railed air shaft in the middle, two lamps set across it, and the other
// hexagons, identical, fading in every direction. The shelf that holds this chapter is marked.
const f = (n) => Math.round(n * 100) / 100
const rad = (deg) => (deg * Math.PI) / 180
const vertex = (R, i, cx = 0, cy = 0) => [cx + R * Math.cos(rad(-90 + 60 * i)), cy + R * Math.sin(rad(-90 + 60 * i))]
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const pt = (p) => `${f(p[0])} ${f(p[1])}`

function hexPath(R, cx = 0, cy = 0) {
  return 'M' + [0, 1, 2, 3, 4, 5].map((i) => pt(vertex(R, i, cx, cy))).join(' L') + ' Z'
}

// Five shelves along wall i (a side between vertex i and i+1), as segments inset from the wall.
function shelves(R, i) {
  const a = (R * Math.sqrt(3)) / 2
  return [0, 1, 2, 3, 4].map((j) => {
    const k = (a - a * (0.075 + 0.05 * j)) / a
    const p0 = vertex(R * k, i)
    const p1 = vertex(R * k, i + 1)
    return [lerp(p0, p1, 0.1), lerp(p0, p1, 0.9)]
  })
}

function spiral(cx, cy, r0, r1, turns = 2.6, steps = 64) {
  let d = ''
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const ang = t * turns * Math.PI * 2
    const r = r0 + (r1 - r0) * t
    d += `${s ? 'L' : 'M'}${f(cx + Math.cos(ang) * r)} ${f(cy + Math.sin(ang) * r)} `
  }
  return d
}

export function hexagonPlan(addr, { mini = false, uid = 'hx', label = '' } = {}) {
  const R = 100
  const wall = Math.min(4, Math.max(1, addr.wall)) - 1
  const shelf = Math.min(5, Math.max(1, addr.shelf)) - 1
  let body = ''

  if (!mini) {
    // The other hexagons. They are identical; the Library is all of them.
    for (let i = 0; i < 6; i++) {
      const ang = rad(-60 + 60 * i)
      body += `<path class="hx-far" d="${hexPath(R, Math.cos(ang) * 2.45 * R, Math.sin(ang) * 2.45 * R)}"/>`
    }
    // The hallway (through the left wall), its closet, its mirror, and the spiral stair.
    const x0 = -R * 0.866
    const x1 = -R * 1.584
    const w = R * 0.13
    body += `<path class="hx-hall" d="M${f(x0)} ${f(-w)} L${f(x1)} ${f(-w)} M${f(x0)} ${f(w)} L${f(x1)} ${f(w)}"/>`
    body += `<path class="hx-mirror" d="M${f(-R * 0.93)} ${f(-w)} L${f(-R * 1.1)} ${f(-w)}"/>`
    body += `<circle class="hx-hall" cx="${f(-R * 1.225)}" cy="${f(R * 0.43)}" r="${f(R * 0.24)}"/>`
    body += `<path class="hx-stair" d="${spiral(-R * 1.225, R * 0.43, R * 0.02, R * 0.21)}"/>`
  }

  // The walls. The left wall has a door; the others are whole.
  const v = [0, 1, 2, 3, 4, 5, 6].map((i) => vertex(R, i))
  let walls = ''
  for (let i = 0; i < 6; i++) {
    if (i === 4 && !mini) {
      const gap = 0.13 // half the door, as a fraction of the wall (the wall is R long)
      walls += `M${pt(v[4])} L${pt(lerp(v[4], v[5], 0.5 - gap))} M${pt(lerp(v[4], v[5], 0.5 + gap))} L${pt(v[5])} `
    } else {
      walls += `M${pt(v[i])} L${pt(v[i + 1])} `
    }
  }
  body += `<path class="hx-wall" d="${walls}"/>`

  // Twenty shelves.
  for (let i = 0; i < 4; i++) {
    shelves(R, i).forEach(([p0, p1], j) => {
      const here = i === wall && j === shelf
      body += `<path class="${here ? 'hx-shelf hx-here' : 'hx-shelf'}" d="M${pt(p0)} L${pt(p1)}"/>`
      if (here) {
        const t = 0.06 + 0.88 * ((Math.min(32, Math.max(1, addr.volume)) - 0.5) / 32)
        const [x, y] = lerp(p0, p1, t)
        body += `<circle class="hx-vol" cx="${f(x)}" cy="${f(y)}" r="${mini ? 11 : 6.5}"/>`
      }
    })
  }

  // The air shaft with its low railing, and the two lamps set across it.
  body += `<circle class="hx-shaft" r="${f(R * 0.27)}"/><circle class="hx-rail" r="${f(R * 0.32)}"/>`
  if (!mini) {
    body += `<defs><radialGradient id="${uid}-lamp"><stop offset="0" stop-color="currentColor" stop-opacity=".9"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>`
    for (const [x, y] of [[-R * 0.47, R * 0.16], [R * 0.47, -R * 0.16]]) {
      body += `<circle class="hx-glow" cx="${f(x)}" cy="${f(y)}" r="${f(R * 0.16)}" fill="url(#${uid}-lamp)"/>`
      body += `<circle class="hx-lamp" cx="${f(x)}" cy="${f(y)}" r="${f(R * 0.045)}"/>`
    }
    // Wall numerals, outside each shelved wall.
    ;['I', 'II', 'III', 'IV'].forEach((n, i) => {
      const ang = rad(-60 + 60 * i)
      const r = R * 1.02
      body += `<text class="hx-label${i === wall ? ' hx-label--here' : ''}" x="${f(Math.cos(ang) * r)}" y="${f(Math.sin(ang) * r)}" text-anchor="middle" dominant-baseline="central">${n}</text>`
    })
    body += `<text class="hx-label hx-label--small" x="${f(-R * 1.225)}" y="${f(R * 0.8)}" text-anchor="middle">stair</text>`
    body += `<text class="hx-label hx-label--small" x="${f(-R * 1.24)}" y="${f(-R * 0.22)}" text-anchor="middle">mirror</text>`
  }

  const vb = mini ? '-100 -100 200 200' : '-200 -140 360 280'
  const aria = label ? `role="img" aria-label="${label.replace(/[<>&"]/g, '')}"` : 'aria-hidden="true" focusable="false"'
  return `<svg class="hx${mini ? ' hx--mini' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none" stroke="currentColor" stroke-linecap="round" ${aria}>${body}</svg>`
}

// The moon of this visit, lit on the correct side. phase: 0 new, 0.5 full.
export function moonGlyph(phase, { r = 7 } = {}) {
  const k = Math.cos(phase * 2 * Math.PI)
  const waxing = phase < 0.5
  const rx = f(Math.abs(k) * r)
  const limb = waxing ? 1 : 0
  const term = (k > 0) !== waxing ? 1 : 0
  // The dark of the moon is ink; the lit part is the paper showing through.
  const lit = phase < 0.015 || phase > 0.985 ? '' : `<path class="bb-moon-lit" d="M0 ${-r} A${r} ${r} 0 0 ${limb} 0 ${r} A${rx} ${r} 0 0 ${term} 0 ${-r} Z" stroke="none"/>`
  return `<svg class="bb-moon" xmlns="http://www.w3.org/2000/svg" viewBox="${-r - 1} ${-r - 1} ${2 * r + 2} ${2 * r + 2}" aria-hidden="true" focusable="false"><circle class="bb-moon-dark" r="${r}"/>${lit}<circle r="${r}" fill="none" stroke="currentColor" stroke-width="0.9"/></svg>`
}
