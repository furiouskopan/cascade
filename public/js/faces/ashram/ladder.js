// THE LADDER OF THE SEVEN WHEELS. Seven chakras as stacked layers whose z-index values are real
// (set in ashram.css, read back from the living stylesheet). The whole ladder is one stacking context,
// one Sphere, so even the Crown at 2147483647 cannot rise above the mercy button.
// At 33 s of stillness the serpent at the Root climbs the Ladder, literally: its z-index rises rung by
// rung, so it passes under each layer's edge and then over it.
// Secret: type the seeds from the Root upward (lam vam ram yam ham om) and the Crown opens.
import { h } from '../../lib/dom.js'
import { CHAKRAS } from '../../lib/lexicon.js'
import { WHEELS, SEEDS, ASCENT } from './lore.js'
import { s } from './life.js'

const TAU = Math.PI * 2
const f = (n) => Math.round(n * 100) / 100
const P = (r, a) => [r * Math.sin(a), -r * Math.cos(a)]

function petalPath(count, r0, r1, width, phase = 0) {
  let d = ''
  const rm = (r0 + r1) / 2 / Math.cos(width)
  for (let i = 0; i < count; i++) {
    const a = ((i + phase) / count) * TAU
    const [x0, y0] = P(r0, a)
    const [x1, y1] = P(r1, a)
    const [c1x, c1y] = P(rm, a - width)
    const [c2x, c2y] = P(rm, a + width)
    d += `M${f(x0)} ${f(y0)}Q${f(c1x)} ${f(c1y)} ${f(x1)} ${f(y1)}Q${f(c2x)} ${f(c2y)} ${f(x0)} ${f(y0)}`
  }
  return d
}

const tri = (r, down) => {
  const pts = [0, 1, 2].map((k) => P(r, (k / 3) * TAU + (down ? Math.PI : 0)))
  return `M${pts.map((p) => p.map(f).join(' ')).join(' L')} Z`
}

// Each wheel's plate: a square layer, its lotus, and the old sign of its element inside.
function plateSvg(i) {
  const w = WHEELS[i]
  const g = s('svg', { viewBox: '-50 -50 100 100', class: 'ash-plate-svg', 'aria-hidden': 'true', focusable: 'false' })
  g.append(s('rect', { x: -47, y: -47, width: 94, height: 94, rx: 3, class: 'ash-plate-face' }))
  g.append(s('rect', { x: -43, y: -43, width: 86, height: 86, rx: 2, class: 'ash-plate-rule' }))
  if (i === 6) {
    // Twenty rings of fifty petals. There are a thousand; count them if you doubt it.
    let d = ''
    for (let ring = 0; ring < 20; ring++) {
      const r0 = 6 + ring * 1.85
      d += petalPath(50, r0, r0 + 4.2, 0.05, ring % 2 ? 0.5 : 0)
    }
    g.append(s('path', { d, class: 'ash-plate-lotus is-thousand' }))
    g.append(s('circle', { r: 5, class: 'ash-plate-core' }))
    return g
  }
  const n = w.petals
  g.append(s('circle', { r: 22, class: 'ash-plate-ring' }))
  g.append(s('path', { d: petalPath(n, 22, n === 2 ? 44 : 38, Math.min(0.42, (Math.PI / n) * 0.82)), class: 'ash-plate-lotus' }))
  const sign = [
    () => s('rect', { x: -13, y: -13, width: 26, height: 26, class: 'ash-plate-sign' }),
    () => s('path', { d: 'M-14 -4 A15 15 0 0 0 14 -4 A11 11 0 0 1 -14 -4 Z', class: 'ash-plate-sign' }),
    () => s('path', { d: tri(16, true), class: 'ash-plate-sign' }),
    () => s('path', { d: tri(16, false) + tri(16, true), class: 'ash-plate-sign' }),
    () => s('circle', { r: 13, class: 'ash-plate-sign' }),
    () => s('path', { d: tri(15, true) + 'M-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0', class: 'ash-plate-sign' }),
  ][i]
  g.append(sign())
  return g
}

function coilSvg() {
  // Three and a half coils at the base of the spine.
  let d = ''
  const turns = 3.5
  for (let k = 0; k <= 140; k++) {
    const u = k / 140
    const a = u * turns * TAU
    const r = 4 + u * 17
    d += `${k ? 'L' : 'M'}${f(Math.cos(a) * r)} ${f(Math.sin(a) * r * 0.46)}`
  }
  return s('svg', { viewBox: '-26 -14 52 28', class: 'ash-coil', 'aria-hidden': 'true', focusable: 'false' }, s('path', { d }))
}

export function buildLadder(A) {
  const { ctx, life } = A
  const order = [6, 5, 4, 3, 2, 1, 0] // the crown first in the document; z-index says who is on top
  const hourWheel = WHEELS.findIndex((w) => w.planet === ctx.sky?.planetaryHour?.planet)
  const rungs = []
  const list = h('ol', { class: 'ash-ladder', reversed: true },
    order.map((i) => {
      const c = CHAKRAS[i]
      const w = WHEELS[i]
      const zOut = h('b', { class: 'ash-z-value' }, String(c.z))
      const btn = h('button', { type: 'button', class: 'ash-rung-btn' },
        h('span', { class: 'ash-plate' }, plateSvg(i)),
        h('span', { class: 'ash-plate-bija', lang: 'sa', 'aria-hidden': 'true' }, c.bija || '◌'),
        h('span', { class: 'ash-rung-text' },
          h('span', { class: 'ash-z' }, 'z-index: ', zOut),
          h('span', { class: 'ash-rung-name' }, h('span', { lang: 'sa', class: 'ash-deva' }, w.deva), ' ', w.iast),
          h('span', { class: 'ash-rung-sub' }, `the ${c.english} · `, h('code', {}, c.css)),
          h('span', { class: 'visually-hidden' }, ` ${detail(i)}`),
        ),
      )
      const li = h('li', { class: 'ash-rung', dataset: { wheel: String(i) } }, btn)
      li.style.setProperty('--c', c.color)
      if (i === hourWheel) li.classList.add('is-hour')
      rungs[i] = { li, btn, zOut, c }
      life.on(btn, 'click', () => sound(i))
      life.on(btn, 'pointerenter', () => read(i))
      life.on(btn, 'focus', () => read(i))
      return li
    }),
  )
  const serpent = h('div', { class: 'ash-serpent', 'aria-hidden': 'true' },
    h('span', { class: 'ash-serpent-tail' }), h('span', { class: 'ash-serpent-head' }))
  const coil = coilSvg()
  const sphere = h('div', { class: 'ash-sphere' }, list, serpent, coil)
  const readingTitle = h('p', { class: 'ash-reading-title' })
  const readingText = h('p', { class: 'ash-reading-text' })
  const reading = h('div', { class: 'ash-wheel-reading', 'aria-hidden': 'true' }, readingTitle, readingText)
  const note = h('p', { class: 'ash-ladder-note', 'aria-live': 'polite' })
  const el = h('section', { class: 'ash-ladder-sec', 'aria-labelledby': 'ash-ladder-title' },
    h('header', { class: 'ash-sec-head' },
      h('p', { class: 'ash-sec-deva', lang: 'sa', 'aria-hidden': 'true' }, 'चक्र'),
      h('h2', { id: 'ash-ladder-title' }, 'The Ladder of the Seven Wheels'),
      h('p', { class: 'ash-lede' }, 'Seven wheels climb the Ladder, and their z-index values are real: open the inspector and read them. The ladder is a single stacking context, one Sphere, so even the Crown at the Highest Heaven cannot rise above the mercy button. Nothing can.'),
    ),
    sphere,
    reading,
    h('p', { class: 'ash-ladder-hint' }, 'Touch a wheel to sound its seed. Speak the seeds from the Root upward, and the Crown will answer.'),
    note,
  )

  function detail(i) {
    const c = CHAKRAS[i]
    const w = WHEELS[i]
    const seed = c.bija ? `Its seed is ${SEEDS[c.bijaLatin]?.iast ?? c.bijaLatin}` : 'Its seed is silence'
    const petals = w.petals === 1000 ? 'a thousand petals' : `${w.petals} petals`
    return `${seed}; ${petals}; element: ${w.element}. ${w.teaching}`
  }
  function read(i) {
    const w = WHEELS[i]
    readingTitle.replaceChildren(h('span', { lang: 'sa', class: 'ash-deva' }, w.deva), ` ${w.iast}, “${w.meaning}”`)
    readingText.textContent = detail(i) + (i === hourWheel ? ` It is awake in this horā of ${w.planet}.` : '')
    reading.style.setProperty('--c', CHAKRAS[i].color)
  }
  read(hourWheel >= 0 ? hourWheel : 0)
  life.on(list, 'pointerleave', () => read(hourWheel >= 0 ? hourWheel : 0))

  // Read the z-index back from the living stylesheet, so the numbers shown are the numbers applied.
  function readBack() {
    for (const r of rungs) {
      if (!r) continue
      const z = getComputedStyle(r.li).zIndex
      if (z && z !== 'auto') r.zOut.textContent = z
    }
  }
  requestAnimationFrame(readBack)

  // --------------------------------------------------------------- sounding a seed
  const glowTimers = new Map()
  function glow(i, ms = 3200) {
    const r = rungs[i]
    if (!r) return
    r.li.classList.add('is-sounded')
    clearTimeout(glowTimers.get(i))
    glowTimers.set(i, setTimeout(() => r.li.classList.remove('is-sounded'), ms))
  }
  life.add(() => glowTimers.forEach((t) => clearTimeout(t)))
  function sound(i) {
    glow(i)
    const c = CHAKRAS[i]
    const a = ctx.audio
    try {
      if (a?.summoned) (c.bijaLatin === '(silence)' ? a.bell?.({ kind: 'bowl', face: 'ashram' }) : a.chant?.(c.bijaLatin))
    } catch (e) { console.error('[ashram:ladder]', e) }
    note.textContent = c.bija
      ? `${WHEELS[i].iast} sounds ${SEEDS[c.bijaLatin]?.iast ?? c.bijaLatin}${a?.summoned ? '.' : ', silently. The bowl has not been struck.'}`
      : 'The Crown has no seed. It is sounded by silence, which you have just made.'
    if (i < ASCENT.length) ascend(i, 'touch')
    else progress = 0
  }

  // --------------------------------------------------------------- the serpent
  let steps = []
  let risen = false
  let risenBy = null // 'stillness' returns to the Root at the first movement; 'seeds', once spoken, stays
  function clearSteps() { steps.forEach(clearTimeout); steps = [] }
  life.add(clearSteps)
  function yOf(i) {
    const li = rungs[i].li
    const plate = li.querySelector('.ash-plate')
    return li.offsetTop + (plate ? plate.offsetTop + plate.offsetHeight / 2 : li.offsetHeight / 2)
  }
  function place(i, z) {
    serpent.style.transform = `translateY(${f(yOf(i))}px)`
    serpent.style.zIndex = String(z)
  }
  function settle() {
    if (!risen || risenBy === 'seeds') return
    clearSteps()
    risen = false
    risenBy = null
    el.classList.remove('is-risen', 'is-rising')
    rungs.forEach((r) => r.li.classList.remove('is-awake'))
    serpent.classList.add('is-returning')
    place(0, 1)
    steps.push(setTimeout(() => serpent.classList.remove('is-returning'), 2600))
  }
  function rise(reason = 'stillness') {
    if (risen) {
      if (reason === 'seeds') {
        risenBy = 'seeds'
        note.textContent = 'The seeds were spoken from the Root upward, and the serpent was already at the Crown. Now it will stay there for the rest of this sitting.'
      }
      return
    }
    risen = true
    risenBy = reason
    clearSteps()
    el.classList.add('is-rising')
    const finish = () => {
      el.classList.remove('is-rising')
      el.classList.add('is-risen')
      note.textContent = reason === 'seeds'
        ? 'The seeds were spoken from the Root upward. The Crown has opened at z-index 2147483647, and still it has not left its Sphere.'
        : 'The serpent has climbed all seven rungs. It rests at the Highest Heaven, inside its Sphere.'
    }
    if (ctx.mercy?.on) {
      rungs.forEach((r) => r.li.classList.add('is-awake'))
      place(6, CHAKRAS[6].z)
      finish()
      return
    }
    place(0, 1)
    rungs[0].li.classList.add('is-awake')
    for (let k = 1; k <= 6; k++) {
      steps.push(setTimeout(() => {
        serpent.style.transform = `translateY(${f(yOf(k))}px)`
        // It slips under the edge of the next layer, then its z-index rises above it.
        steps.push(setTimeout(() => {
          serpent.style.zIndex = String(CHAKRAS[k].z)
          rungs[k].li.classList.add('is-awake')
        }, 520))
      }, k * 1150))
    }
    steps.push(setTimeout(finish, 6 * 1150 + 900))
  }
  // Rest at the root once laid out.
  requestAnimationFrame(() => place(0, 1))
  life.on(window, 'resize', () => { if (!el.classList.contains('is-rising')) place(risen ? 6 : 0, risen ? CHAKRAS[6].z : 1) })

  // --------------------------------------------------------------- the seeds, spoken or touched
  // Typed (lam vam ram yam ham om) or touched wheel by wheel from the Root: the same ascent.
  let progress = 0
  function ascend(hit, how) {
    if (hit === progress) progress++
    else progress = hit === 0 ? 1 : 0
    if (progress > 1 && progress < ASCENT.length && how === 'touch') {
      note.textContent = `${WHEELS[hit].iast} sounds ${SEEDS[ASCENT[hit]].iast}. ${ASCENT.length - progress} ${ASCENT.length - progress === 1 ? 'wheel' : 'wheels'} still to wake, from the bottom up.`
    }
    if (progress === ASCENT.length) {
      progress = 0
      glow(6, 9000)
      rise('seeds')
      ctx.memory?.markSecret?.('ashram-seeds', { face: 'ashram', how })
    }
  }
  life.bus(ctx.bus, 'behavior:typed', ({ buffer }) => {
    const b = String(buffer ?? '')
    if (b.endsWith('ajna')) { glow(5, 5000); note.textContent = 'Ājñā hears its own name. Somewhere an eye that sees sound is opening.' }
    const hit = ASCENT.findIndex((seed) => b.endsWith(seed))
    if (hit < 0) return
    glow(hit)
    ascend(hit, 'typed')
  })

  return { el, rise, settle, sound, readBack }
}
