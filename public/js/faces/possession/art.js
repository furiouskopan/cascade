// POSSESSION / ART. Procedural imagery for CSS Hell: no downloads, only SVG strings built here.
// Everything returns markup generated from our own data (never from visitor text).

const f = (n) => Math.round(n * 10) / 10

// The corporate mark: a box inside a box (the box model, disguised as a brand).
export function logoMark(kind = 0) {
  const shapes = [
    '<rect x="2" y="2" width="28" height="28" rx="7" fill="var(--brand)"/><rect x="9.5" y="9.5" width="13" height="13" rx="3" fill="#fff" opacity=".92"/>',
    '<rect x="2" y="2" width="28" height="28" rx="14" fill="var(--brand)"/><rect x="10" y="10" width="12" height="12" rx="2" fill="#fff" opacity=".92"/>',
    '<rect x="2" y="4" width="28" height="6" rx="3" fill="var(--brand)"/><rect x="2" y="13" width="20" height="6" rx="3" fill="var(--brand)" opacity=".7"/><rect x="2" y="22" width="12" height="6" rx="3" fill="var(--brand)" opacity=".45"/>',
    '<path d="M16 2 30 26H2Z" fill="var(--brand)"/><circle cx="16" cy="18" r="4.2" fill="#fff" opacity=".92"/>',
  ]
  return `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">${shapes[kind % shapes.length]}</svg>`
}

// Line icons for the feature cards. 24x24, stroked in currentColor.
export const ICONS = {
  integrate: '<rect x="2.5" y="7" width="11" height="10" rx="3"/><rect x="10.5" y="7" width="11" height="10" rx="3"/>',
  scale: '<path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"/>',
  insight: '<path d="M4 20v-6M10 20V9M16 20v-4M22 20V4"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  support: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  inherit: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
}

export function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] ?? ''}</svg>`
}

// A flat "stock photo" of a meeting, as corporate sites have. The faces are blank.
// Classes let the face open their eyes one by one (.eyes-1 .. .eyes-3) and admit the one in the window (.fourth).
export function stockPhoto(rng) {
  const skins = rng.shuffle(['#f1c7a5', '#c68a62', '#8d5a3b', '#e9b48f', '#b77b55'])
  const shirts = rng.shuffle(['#3f8fd2', '#f08a6c', '#f2c14e', '#5bb6a6', '#8f7fd8'])
  const hairs = rng.shuffle(['#2b2522', '#6b3f22', '#c9a26b', '#1c1c1c', '#8a5a3c'])
  const person = (i, cx, base, dir, standing = false) => {
    const hy = base - (standing ? 104 : 84)
    const top = base - (standing ? 82 : 62)
    const torso = `M${cx - 27} ${base} C${cx - 27} ${top + 18} ${cx - 19} ${top} ${cx} ${top} C${cx + 19} ${top} ${cx + 27} ${top + 18} ${cx + 27} ${base}Z`
    const hair = dir === 0
      ? `M${cx - 15.5} ${hy + 1} A15.5 15.5 0 0 1 ${cx + 15.5} ${hy + 1} Q${cx + 9} ${hy - 7} ${cx} ${hy - 6} Q${cx - 9} ${hy - 6} ${cx - 15.5} ${hy + 1}Z`
      : `M${cx - 15.5 * dir} ${hy + 6} A15.5 15.5 0 0 ${dir > 0 ? 1 : 0} ${cx + 12 * dir} ${hy - 9} Q${cx + 2 * dir} ${hy - 6} ${cx - 4 * dir} ${hy + 1} Q${cx - 9 * dir} ${hy + 9} ${cx - 15.5 * dir} ${hy + 6}Z`
    return `<g class="figure figure--${i}">
      <path d="${torso}" fill="${shirts[i]}"/>
      <rect x="${cx - 5}" y="${top - 9}" width="10" height="11" rx="3" fill="${skins[i]}"/>
      <circle cx="${cx}" cy="${hy}" r="15" fill="${skins[i]}"/>
      <path d="${hair}" fill="${hairs[i]}"/>
      <g class="eyes eyes--${i}" fill="#15110f"><ellipse cx="${cx - 5}" cy="${hy + 2}" rx="1.7" ry="2.1"/><ellipse cx="${cx + 5}" cy="${hy + 2}" rx="1.7" ry="2.1"/></g>
    </g>`
  }
  const arm = (x1, y1, x2, y2, c) => `<path d="M${x1} ${y1} Q${f((x1 + x2) / 2)} ${f(Math.max(y1, y2) + 10)} ${x2} ${y2}" stroke="${c}" stroke-width="9" stroke-linecap="round" fill="none"/>`
  return `<svg class="stock" viewBox="0 0 560 330" role="img" aria-label="A stock illustration: three colleagues at a table with laptops, smiling without faces">
    <defs>
      <linearGradient id="px-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6e6f5"/><stop offset="1" stop-color="#f4f8fc"/></linearGradient>
      <filter id="px-soft"><feGaussianBlur stdDeviation="1.4"/></filter>
    </defs>
    <rect width="560" height="330" fill="#e8eef4"/>
    <rect y="262" width="560" height="68" fill="#d7dfe8"/>
    <g class="window">
      <rect x="338" y="34" width="176" height="150" rx="4" fill="#c7d2dd"/>
      <rect x="345" y="41" width="162" height="136" rx="2" fill="url(#px-glass)"/>
      <g class="figure figure--4" filter="url(#px-soft)">
        <circle cx="456" cy="88" r="10.5" fill="#15121a"/>
        <path d="M442 177 C442 124 446 104 456 101 C466 104 470 124 470 177Z" fill="#15121a"/>
      </g>
      <path d="M426 41v136M345 109h162" stroke="#c7d2dd" stroke-width="5"/>
    </g>
    <g class="wall-art">
      <rect x="60" y="48" width="92" height="70" rx="3" fill="#fff" stroke="#cfd8e1" stroke-width="4"/>
      <circle class="art-sun" cx="92" cy="80" r="16" fill="#f2c14e" opacity=".8"/>
      <path class="art-hill" d="M68 110 L100 86 L122 100 L144 84 L144 110Z" fill="#5bb6a6" opacity=".7"/>
      <g class="art-eye" opacity="0"><path d="M84 83 Q106 66 128 83 Q106 100 84 83Z" fill="none" stroke="#6b0f0f" stroke-width="2"/><circle cx="106" cy="83" r="5" fill="#6b0f0f"/></g>
    </g>
    <g class="plant"><path d="M44 262 L40 226 H78 L74 262Z" fill="#e3a36b"/><ellipse cx="50" cy="206" rx="9" ry="24" fill="#6fae84" transform="rotate(-24 50 206)"/><ellipse cx="68" cy="202" rx="9" ry="26" fill="#86c29a" transform="rotate(18 68 202)"/><ellipse cx="59" cy="194" rx="8" ry="28" fill="#5f9f76"/></g>
    ${person(0, 176, 262, 1)}
    ${person(1, 282, 262, 0, true)}
    ${person(2, 392, 262, -1)}
    <rect x="128" y="222" width="310" height="16" rx="6" fill="#b8c4d0"/>
    <path d="M150 238v58M416 238v58" stroke="#a9b6c3" stroke-width="7" stroke-linecap="round"/>
    <g class="laptops">
      <path d="M196 222 l8 -30 h44 l-6 30z" fill="#2c3440"/><path d="M200 219 l6 -24 h38 l-5 24z" fill="#9ec7ee" class="screen"/>
      <path d="M318 222 l-8 -30 h-44 l6 30z" fill="#2c3440"/><path d="M314 219 l-6 -24 h-38 l5 24z" fill="#9ec7ee" class="screen"/>
      <path d="M352 222 l8 -30 h44 l-6 30z" fill="#2c3440"/><path d="M356 219 l6 -24 h38 l-5 24z" fill="#9ec7ee" class="screen"/>
    </g>
    ${arm(196, 214, 222, 219, shirts[0])}
    ${arm(262, 190, 272, 219, shirts[1])}${arm(302, 190, 292, 219, shirts[1])}
    ${arm(372, 214, 350, 219, shirts[2])}
  </svg>`
}

// A cracked speaker grille, muted. The summon affordance.
export function speaker({ size = 40 } = {}) {
  let dots = ''
  for (let y = -12; y <= 12; y += 4) {
    for (let x = -12; x <= 12; x += 4) {
      if (x * x + y * y < 13.5 * 13.5) dots += `<circle cx="${20 + x}" cy="${20 + y}" r="1.35"/>`
    }
  }
  return `<svg class="grille" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true" focusable="false">
    <circle cx="20" cy="20" r="17.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <g fill="currentColor">${dots}</g>
    <path class="crack" d="M8.5 6.5 L14 14 L12.2 18.4 L19.4 23.2 L17.6 29 L23.8 35.6" fill="none" stroke-width="2.4"/>
    <path class="crack-hi" d="M8.5 6.5 L14 14 L12.2 18.4 L19.4 23.2 L17.6 29 L23.8 35.6" fill="none" stroke="currentColor" stroke-width=".7"/>
  </svg>`
}

// The gate: an arch of stone with a keystone.
export function arch() {
  return `<svg class="gate-arch-svg" viewBox="0 0 600 420" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M0 420 V180 Q0 0 300 0 Q600 0 600 180 V420 H520 V190 Q520 60 300 60 Q80 60 80 190 V420Z" fill="currentColor"/>
    <path d="M276 0 H324 L316 64 H284Z" fill="currentColor" opacity=".6"/>
    ${Array.from({ length: 11 }, (_, i) => {
      const a = Math.PI * (i + 1) / 12
      const x1 = 300 - Math.cos(a) * 222, y1 = 190 - Math.sin(a) * 132
      const x2 = 300 - Math.cos(a) * 296, y2 = 180 - Math.sin(a) * 180
      return `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="#000" stroke-opacity=".35" stroke-width="2"/>`
    }).join('')}
  </svg>`
}

// A thicket: bare vertical strokes with branches, for the circle of magic numbers.
export function thicket(rng, { width = 900, height = 260, trees = 14 } = {}) {
  let body = ''
  for (let i = 0; i < trees; i++) {
    const x = f((i + rng.float(0.1, 0.9)) * (width / trees))
    const top = f(rng.float(20, 90))
    body += `<path d="M${x} ${height} C${x + rng.float(-8, 8)} ${f(height * 0.6)} ${x + rng.float(-10, 10)} ${f(top + 40)} ${x + rng.float(-4, 4)} ${top}" stroke-width="${f(rng.float(2, 4.5))}"/>`
    const branches = rng.int(2, 5)
    for (let b = 0; b < branches; b++) {
      const by = f(rng.float(top + 20, height * 0.75))
      const dir = rng.chance(0.5) ? 1 : -1
      const len = rng.float(18, 60)
      body += `<path d="M${x} ${by} q${f(dir * len * 0.5)} ${f(-len * 0.3)} ${f(dir * len)} ${f(-len * 0.7)}" stroke-width="${f(rng.float(1, 2.2))}"/>`
    }
  }
  return `<svg class="thicket-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMax slice" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true" focusable="false">${body}</svg>`
}

// Battlements of the City of Dis.
export function battlements(rng, { width = 1000, height = 120 } = {}) {
  let d = `M0 ${height} V${height * 0.55}`
  let x = 0
  while (x < width) {
    const w = rng.int(26, 44)
    const tower = rng.chance(0.14)
    const hTop = tower ? rng.int(4, 16) : height * 0.35
    d += ` H${x + w * 0.3} V${hTop} H${x + w * 0.7} V${height * 0.55}`
    x += w
  }
  d += ` H${width} V${height}Z`
  return `<svg class="dis-walls" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}" fill="currentColor"/></svg>`
}

// Jagged teeth for the tearing veil: a polygon whose lower edge reaches further down as the tear grows.
// Returns a CSS clip-path value in px for an element of width w, where the seam sits at y = seam and
// the element's full height is fullH. The same number of points at every progress keeps it animatable.
export function tearPath(teeth, progress, w, seam, fullH) {
  const pts = [`0px 0px`, `${f(w)}px 0px`]
  const depthMax = Math.max(0, fullH - seam)
  const right = []
  for (const t of teeth) {
    const reach = Math.max(0, Math.min(1, progress * t.gain - t.lag))
    const y = seam + depthMax * reach * t.depth
    right.push(`${f(t.x * w)}px ${f(y)}px`)
  }
  return `polygon(${pts.join(', ')}, ${right.reverse().join(', ')})`
}

// Teeth for tearPath: seeded, with a deeper wound around one point.
export function makeTeeth(rng, count = 26) {
  const centre = rng.float(0.3, 0.7)
  const spread = rng.float(0.2, 0.32)
  const teeth = []
  for (let i = 0; i <= count; i++) {
    const x = i / count
    const dist = Math.abs(x - centre) / spread
    const core = Math.max(0, 1 - dist * dist)
    const jag = i % 2 ? rng.float(0.55, 0.9) : rng.float(0.9, 1)
    teeth.push({ x, depth: Math.min(1, core * jag + (core > 0 ? 0.04 : 0)), gain: rng.float(1, 1.35), lag: rng.float(0, 0.18) * (1 - core) })
  }
  return teeth
}
