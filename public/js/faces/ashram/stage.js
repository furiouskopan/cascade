// THE STAGE: the Yantra that breathes (4 in, 4 held, 6 out), the Lotus of Letters (the Rosetta on its
// petals), the guide who counts, the plinth that carries the Inscription, and the reading of the sky.
// The yantra breathes deeper the longer you are still, and falters when you are restless. Calm, its breath
// runs on the compositor (Web Animations whose clock is the count); restless, script takes the lines over.
import { h } from '../../lib/dom.js'
import { yantra } from '../../lib/sigil.js'
import { inscription, rosetta } from '../../lib/glyphs.js'
import { prophecy } from '../../lib/scripture.js'
import { CHAKRAS } from '../../lib/lexicon.js'
import { PHASES, CYCLE, SEEDS, ASCENT, WHISPERS, FALTERS, RECOVER, HORA, WHEELS, tithi, devaNum, welcome, arrival } from './lore.js'
import { s, clamp, easeInOut, wobble, moonPath } from './life.js'
import { buildBowl } from './bowl.js'

const TAU = Math.PI * 2
const r2 = (n) => Math.round(n * 100) / 100
const polar = (r, a) => [r2(r * Math.sin(a)), r2(-r * Math.cos(a))]

// The Lotus of Letters: the generated lotus is too narrow to write on, so its outer ring is redrawn
// as twelve broad petals in the old manner (a wide foot on the ring, swelling, then a pointed tip),
// each with a vein inside. Radii are in yantra units (the yantra is 200 across); LOTUS.mid is where
// the letters sit (ashram.css reads it from --lotus-r).
export const LOTUS = { r0: 60, r1: 80.5, w: 0.215, mid: 68.4 }
function lotusPath(n, r0, r1, w) {
  const L = r1 - r0
  let d = ''
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU
    const footL = polar(r0, a - w)
    const footR = polar(r0, a + w)
    const tip = polar(r1, a)
    const c1 = polar(r0 + L * 0.5, a - w * 1.12)
    const c2 = polar(r0 + L * 0.84, a - w * 0.42)
    const c3 = polar(r0 + L * 0.84, a + w * 0.42)
    const c4 = polar(r0 + L * 0.5, a + w * 1.12)
    d += `M${footL.join(' ')} C${c1.join(' ')} ${c2.join(' ')} ${tip.join(' ')} C${c3.join(' ')} ${c4.join(' ')} ${footR.join(' ')} A${r0} ${r0} 0 0 0 ${footL.join(' ')} Z `
  }
  return d
}

// Sort the generated yantra into named groups, so its parts can move separately.
function anatomy(svg) {
  const g = (cls) => s('g', { class: cls })
  const gates = g('ash-y-gates')
  const rings = g('ash-y-rings')
  const lotus = g('ash-y-lotus')
  const up = g('ash-y-up'); const upI = g('ash-y-up-i'); up.append(upI)
  const down = g('ash-y-down'); const downI = g('ash-y-down-i'); down.append(downI)
  const bindu = g('ash-y-bindu'); const binduI = g('ash-y-bindu-i'); bindu.append(binduI)
  let n = 0
  for (const el of [...svg.children]) {
    if (el.tagName === 'path') {
      if (n < 3) gates.append(el)
      else if (n < 5) {
        el.setAttribute('class', n === 3 ? 'is-outer' : 'is-inner')
        if (n === 3) {
          el.setAttribute('d', lotusPath(12, LOTUS.r0, LOTUS.r1, LOTUS.w))
          lotus.append(el, s('path', { class: 'is-vein', d: lotusPath(12, LOTUS.r0 + 1.6, LOTUS.r1 - 3.6, LOTUS.w * 0.72) }))
        } else lotus.append(el)
      }
      else if (/^M0 -/.test(el.getAttribute('d') || '')) upI.append(el)
      else downI.append(el)
      n++
    } else if (el.tagName === 'circle') {
      if (el.getAttribute('fill') === 'currentColor') binduI.append(el)
      else rings.append(el)
    }
  }
  // The mala inside the gates: 108 beads, one lit for every breath taken together.
  const mala = g('ash-y-mala')
  const beads = []
  for (let i = 0; i < 108; i++) {
    const a = (i / 108) * TAU - Math.PI / 2
    const big = i % 27 === 0
    const b = s('circle', { cx: (82 * Math.cos(a)).toFixed(2), cy: (82 * Math.sin(a)).toFixed(2), r: big ? 1.15 : 0.62, class: big ? 'is-marker' : null })
    beads.push(b)
    mala.append(b)
  }
  binduI.prepend(s('circle', { r: 7, class: 'ash-y-halo' }))
  svg.append(gates, mala, rings, lotus)
  // The parts that come apart when you are restless (the two triangles and the bindu) are each drawn on a
  // sheet of their own, laid over the rest, so the compositor can turn them without the whole gilded
  // drawing being repainted every frame. They look like one yantra; they are four.
  const sheet = (cls, part) => s('svg', {
    viewBox: svg.getAttribute('viewBox'),
    class: `ash-y-sheet ${cls}`,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  }, part)
  const downL = sheet('ash-y-sheet--down', down)
  const upL = sheet('ash-y-sheet--up', up)
  const binduL = sheet('ash-y-sheet--bindu', bindu)
  return { gates, mala, beads, lotus, up, upI, down, downI, bindu, binduI, upL, downL, binduL, sheets: [downL, upL, binduL] }
}

function readingOf(ctx, rng) {
  const sky = ctx.sky
  const t = tithi(sky.moon)
  const planet = sky.planetaryHour.planet
  const hora = HORA[planet] ?? { deva: '', iast: planet }
  const wi = WHEELS.findIndex((w) => w.planet === planet)
  const wheel = WHEELS[wi]
  const chakra = CHAKRAS[wi]
  const moon = s('svg', { viewBox: '-12 -12 24 24', class: 'ash-moon', role: 'img', 'aria-label': `The moon tonight: ${sky.moon.name}, ${Math.round(sky.moon.illumination * 100)} percent lit` },
    s('circle', { r: 10, class: 'ash-moon-dark' }),
    s('path', { d: moonPath(sky.moon.phase, 10), class: 'ash-moon-lit' }),
  )
  const omens = sky.omens.filter((o) => o !== 'night')
  return h('section', { class: 'ash-reading', 'aria-labelledby': 'ash-reading-title' },
    h('h2', { class: 'ash-kicker', id: 'ash-reading-title' }, 'the reading for this hour'),
    h('div', { class: 'ash-reading-sky' },
      moon,
      h('div', {},
        h('p', { class: 'ash-tithi' }, h('span', { class: 'ash-tithi-name' }, `${t.paksha} ${t.name}`), h('span', {}, t.english)),
        h('p', { class: 'ash-moon-line' }, `the moon is ${sky.moon.name}, ${Math.round(sky.moon.illumination * 100)}% lit`),
      ),
    ),
    h('p', { class: 'ash-hora' },
      h('span', { class: 'ash-hora-glyph', 'aria-hidden': 'true' }, sky.planetaryHour.glyph),
      h('span', {}, 'Horā of ', h('span', { lang: 'sa', class: 'ash-deva' }, hora.deva), ' ', hora.iast, ` (${planet})`),
      wheel ? h('span', { class: 'ash-hora-wakes' }, `It wakes ${wheel.iast}, the ${chakra.english}.`) : null,
    ),
    h('blockquote', { class: 'ash-prophecy' }, h('p', {}, prophecy(rng, sky))),
    omens.length ? h('p', { class: 'ash-omens' }, `omens: ${omens.join(' · ')}`) : null,
  )
}

export function buildStage(A) {
  const { ctx, life, ticker } = A
  const rng = A.rng.fork('stage')
  const whispers = rng.shuffle(WHISPERS)
  let wi = 0

  // --- the yantra: its outer lotus always has twelve petals, Anāhata's number, to carry the letters.
  const yr = ctx.rng.fork('ashram/yantra')
  const shim = { pick: (arr) => (arr.includes(12) ? 12 : yr.pick(arr)), int: (a, b) => yr.int(a, b) }
  const yHolder = h('div', { class: 'ash-yantra', html: yantra(shim, { size: 200, stroke: 0.62 }) })
  const svg = yHolder.querySelector('svg')
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', 'A yantra: three gated squares, a ring of one hundred and eight beads, a lotus of twelve petals, interlocking triangles, and the bindu at the centre. It breathes.')
  const Y = anatomy(svg)
  yHolder.append(...Y.sheets)

  // --- the Lotus of Letters: the Rosetta on the even petals, the seeds of the six wheels on the odd.
  const petals = h('div', { class: 'ash-petals' },
    rosetta('ashram', { className: 'ash-rosetta' }),
    h('div', { class: 'ash-petal-seeds', 'aria-hidden': 'true' }, ASCENT.map((k) => h('span', { lang: 'sa' }, SEEDS[k].deva))),
  )
  // Each sitting draws the yantra in its own manner, and turns the lotus to its own petal.
  petals.style.setProperty('--turn', `${rng.int(0, 5) * 60}deg`)
  petals.style.setProperty('--lotus-r', `${(LOTUS.mid / 2).toFixed(2)}cqw`)
  const aura = h('div', { class: 'ash-aura', 'aria-hidden': 'true' })
  const breather = h('div', { class: 'ash-breather' }, aura, yHolder, petals)
  // Some sittings (and every new moon) the yantra has a shadow, turned half a petal, that breathes
  // out while it breathes in. The guide will mention it once, and only once.
  const shadowed = rng.chance(0.22) || ctx.sky.has('new-moon')
  let ghost = null
  if (shadowed) {
    // The shadow has no bindu: nothing at its centre looks back.
    const copies = [svg, Y.downL, Y.upL].map((n) => {
      const copy = n.cloneNode(true)
      copy.removeAttribute('role')
      copy.removeAttribute('aria-label')
      copy.setAttribute('aria-hidden', 'true')
      return copy
    })
    ghost = h('div', { class: 'ash-ghost', 'aria-hidden': 'true' }, copies)
  }
  const mandalaEl = h('div', { class: 'ash-mandala' }, ghost, breather)
  let onScreen = true
  const io = life.observe(new IntersectionObserver((es) => { onScreen = es.some((e) => e.isIntersecting) }))
  io.observe(mandalaEl)

  // --- the guide
  const phaseDeva = h('p', { class: 'ash-phase-deva', lang: 'sa' }, PHASES[0].deva)
  const phaseEn = h('span', { class: 'ash-phase-en' }, PHASES[0].en)
  const phaseCount = h('span', { class: 'ash-phase-count' }, '4')
  const phaseIast = h('p', { class: 'ash-phase-iast' }, PHASES[0].iast)
  const ticks = h('ol', { class: 'ash-ticks', 'aria-hidden': 'true' },
    PHASES.flatMap((p) => Array.from({ length: p.seconds }, () => h('li', { dataset: { phase: p.key } }))))
  const tickEls = [...ticks.children]
  const whisper = h('p', { class: 'ash-whisper' }, arrival(ctx) ?? welcome(A.sittings))
  const breathsEl = h('p', { class: 'ash-breaths' })
  const mercyNote = h('p', { class: 'ash-mercy-note' }, 'In for four, hold for four, out for six. The yantra keeps still for mercy; breathe on your own. It trusts you.')
  const guide = h('section', { class: 'ash-guide', 'aria-labelledby': 'ash-guide-title' },
    h('h2', { class: 'ash-kicker', id: 'ash-guide-title' }, 'breathe with the yantra'),
    h('div', { class: 'ash-phase' }, phaseDeva, h('p', { class: 'ash-phase-line' }, phaseEn, phaseCount), phaseIast),
    ticks,
    h('p', { class: 'ash-ratio' }, h('span', {}, 'in ', h('b', {}, devaNum(4))), h('span', {}, 'hold ', h('b', {}, devaNum(4))), h('span', {}, 'out ', h('b', {}, devaNum(6)))),
    mercyNote,
    whisper,
    breathsEl,
  )

  // --- the plinth, carved with the Inscription
  const plinth = h('div', { class: 'ash-plinth' },
    h('span', { class: 'ash-plinth-mark', 'aria-hidden': 'true' }, '॥'),
    inscription({ className: 'ash-inscription' }),
    h('span', { class: 'ash-plinth-mark', 'aria-hidden': 'true' }, '॥'),
  )

  // --- the reading, and the bowl beneath it
  const bowl = buildBowl(A)
  const side = h('div', { class: 'ash-side' }, readingOf(ctx, rng), bowl.el)

  const el = h('section', { class: 'ash-stage', 'aria-label': 'The yantra', dataset: { form: rng.pick(['line', 'painted', 'gilded']) } },
    guide,
    h('div', { class: 'ash-center' }, mandalaEl, plinth),
    side,
  )

  // ---------------------------------------------------------------- the breath
  let t = 0 // seconds into the current cycle
  let breaths = 0
  let holding = false
  let amp = 0.07
  let falter = 0
  let shownPhase = -1
  let shownCount = -1
  let bent = { up: 0, down: 0, bx: 0, by: 0 }
  let whisperLock = 0
  let ghostSpoken = false
  const state = { value: 0.5, phase: 'in', falter: 0, count: 0 }
  A.breath = state

  // The tab breathes too: its title follows the phases while you can see it. It only ever overwrites
  // a title it wrote itself (or the one it found), so the hell layer's whispers are left alone.
  const foundTitle = document.title
  const ownTitles = new Set()
  const TITLES = {
    in: 'पूरक · breathe in · the Cascade',
    hold: 'कुम्भक · hold · the Cascade',
    out: 'रेचक · breathe out · the Cascade',
    rest: 'आश्रम · the Yantra Breath Temple',
  }
  function breatheTitle(key) {
    if (document.hidden) return
    const now = document.title
    if (now !== foundTitle && !ownTitles.has(now)) return
    const next = TITLES[key] ?? TITLES.rest
    ownTitles.add(next)
    if (now !== next) document.title = next
  }
  life.add(() => { if (ownTitles.has(document.title)) document.title = foundTitle })

  // Some sittings (about one in twelve) the yantra breathes for whoever sits across from you: it empties
  // while the guide says "breathe in". Everything that breathes with it follows the yantra, not the words.
  const reversed = A.rare === 'reversed'
  const counted = (x) => (x < 4 ? easeInOut(x / 4) : x < 8 ? 1 : 1 - easeInOut((x - 8) / 6))
  const breathValue = reversed ? (x) => 1 - counted(x) : counted
  function phaseAt(x) {
    let acc = 0
    for (let i = 0; i < PHASES.length; i++) {
      acc += PHASES[i].seconds
      if (x < acc) return { i, left: acc - x }
    }
    return { i: PHASES.length - 1, left: 0 }
  }

  function say(text, lockMs = 0) {
    if (!text || performance.now() < whisperLock) return
    whisperLock = lockMs ? performance.now() + lockMs : 0
    whisper.classList.remove('is-new')
    void whisper.offsetWidth
    whisper.textContent = text
    whisper.classList.add('is-new')
  }

  function paintBreaths() {
    breathsEl.textContent = breaths === 0
      ? 'Each breath you take together lights one bead of the mala inside the gates.'
      : `${breaths} ${breaths === 1 ? 'breath' : 'breaths'} together · ${devaNum(breaths % 108 || 108)} of १०८ beads`
    const lit = breaths % 108 === 0 && breaths ? 108 : breaths % 108
    Y.beads.forEach((b, i) => b.classList.toggle('is-lit', i < lit))
  }
  paintBreaths()

  function onPhase(i) {
    const p = PHASES[i]
    phaseDeva.textContent = p.deva
    phaseEn.textContent = p.en
    phaseIast.textContent = p.iast
    el.dataset.phase = p.key
    state.phase = p.key
    breatheTitle(p.key)
    ctx.bus.emit('ashram:breath', { phase: p.key, seconds: p.seconds, falter: Number(falter.toFixed(2)) })
  }

  function onCycle() {
    breaths++
    state.count = breaths
    ctx.memory?.update?.('ashram.breaths', (n) => (Number(n) || 0) + 1, 0)
    paintBreaths()
    const still = ctx.behavior?.stillFor ?? 0
    if (reversed && breaths === 3 && !holding) {
      whisperLock = 0
      say('Look again. It has been emptying whenever it told you to breathe in. Tonight it breathes for whoever sits across from you.', 12000)
    } else if (reversed && breaths === 9 && still >= 7 && !holding) {
      say('Nobody is sitting across from you. It knows. It is breathing for them anyway.', 9000)
    } else if (ghost && !ghostSpoken && breaths >= 2 && still >= 7 && !holding) {
      ghostSpoken = true
      say('There are two of it tonight. Only one of them is breathing with you.', 9000)
    } else if (still >= 7 && !holding) say(whispers[wi++ % whispers.length])
    if (breaths === 108) ctx.memory?.markSecret?.('ashram-mala-of-breaths', { face: 'ashram' })
  }

  // Two ways of breathing, one count. Calm, the yantra breathes on the compositor: Web Animations whose
  // clock IS the count, so a still visitor costs the temple almost nothing. Restless, the count stumbles
  // and the lines lose their alignment frame by frame, from script. Whatever else breathes with the yantra
  // (the padding of the Five Sheaths, the cat) follows the same clock through A.breath.follow().
  const canAnimate = typeof breather.animate === 'function'
  const STEPS = 56 // a keyframe every quarter second; the easing between them is linear
  const cycleFrames = (fn) => Array.from({ length: STEPS + 1 }, (_, i) => ({ offset: i / STEPS, ...fn(breathValue((i / STEPS) * CYCLE)) }))
  const breatherFrame = (v) => ({ transform: `scale(${(1 - amp + amp * v).toFixed(4)})` })
  const auraFrame = (v) => ({ opacity: (0.45 + 0.55 * v).toFixed(3) })
  let mode = 'rest' // 'css' | 'js' | 'rest' (mercy)
  let main = null // the breather's Animation; in css mode its currentTime is the count
  let auraAnim = null
  let ghostAnim = null
  let unTick = null
  let lastCoarse = 0
  const followers = new Set()

  function play(target, frames, at) {
    const anim = target.animate(frames, { duration: CYCLE * 1000, iterations: Infinity, easing: 'linear' })
    anim.currentTime = at * 1000
    if (document.hidden) anim.pause()
    return anim
  }
  function setStyles(target, styles) {
    for (const [k, v] of Object.entries(styles)) {
      if (k.startsWith('--')) target.style.setProperty(k, v)
      else target.style[k] = v
    }
  }
  // A follower that moves the layout (`layout: true`, the padding of the Five Sheaths) is not animated
  // at every frame: calm, it is posed from the count ten times a second (see coarse), and only when its
  // pose has changed, so the page lays itself out a few times a second and the eye cannot tell.
  function startFollower(f) {
    f.anim?.cancel()
    f.anim = null
    if (f.layout || !canAnimate) pose(f, breathValue(t))
    else f.anim = play(f.el, cycleFrames(f.frame), t)
  }
  // A follower is written only when its pose has actually changed.
  function pose(f, v) {
    const styles = f.frame(v)
    const key = Object.values(styles).join('|')
    if (key === f.last) return
    f.last = key
    setStyles(f.el, styles)
  }
  // follow(el, (v) => styles) keeps an element breathing with the yantra; v runs 0 (empty) to 1 (full).
  function follow(target, frame, { active = true, layout = false } = {}) {
    const f = { el: target, frame, anim: null, active, layout, last: null }
    followers.add(f)
    if (active) mode === 'css' ? startFollower(f) : pose(f, mode === 'rest' ? 0.5 : state.value)
    return {
      setActive(on) {
        if (f.active === on || life.dead) return
        f.active = on
        if (!on) { f.anim?.cancel(); f.anim = null; return }
        mode === 'css' ? startFollower(f) : pose(f, mode === 'rest' ? 0.5 : state.value)
      },
      remove() { f.anim?.cancel(); followers.delete(f) },
    }
  }
  state.follow = follow

  // The shadow keeps its own time from the moment it is drawn. It is never re-synced: when you are
  // restless and the count stumbles, it goes on breathing without you. It is not following you.
  function ghostPlay() {
    if (!ghost || ghostAnim || !canAnimate || ctx.mercy?.on) return
    ghostAnim = play(ghost, cycleFrames((v) => ({ transform: `rotate(15deg) scale(${(0.96 + 0.15 * (1 - v)).toFixed(4)})` })), t)
  }

  function count(x) {
    const { i, left } = phaseAt(x)
    if (i !== shownPhase) { shownPhase = i; onPhase(i) }
    const c = Math.max(1, Math.ceil(left - 1e-6))
    if (c !== shownCount) {
      shownCount = c
      phaseCount.textContent = String(c)
      const sec = Math.min(CYCLE - 1, Math.floor(x))
      tickEls.forEach((li, k) => { li.classList.toggle('is-now', k === sec); li.classList.toggle('is-past', k < sec) })
    }
    el.classList.toggle('is-faltering', falter > 0.12)
  }
  const depthWanted = () => 0.055 + 0.065 * clamp((ctx.behavior?.stillFor ?? 0) / 33, 0, 1) // deeper the longer you are still

  const bentZero = () => !bent.up && !bent.down && !bent.bx && !bent.by
  function unbend() {
    bent = { up: 0, down: 0, bx: 0, by: 0 }
    for (const sheet of Y.sheets) sheet.style.removeProperty('transform')
  }
  // Where the yantra is on the screen, measured before anything is written in a frame, and only again
  // after a scroll or a resize (or a second later): reading it every frame would force a layout.
  let rect = null
  let rectAt = 0
  const staleRect = () => { rect = null }
  life.on(window, 'scroll', staleRect, { passive: true })
  life.on(window, 'resize', staleRect, { passive: true })

  function stopCss() {
    main?.cancel(); auraAnim?.cancel()
    main = null; auraAnim = null
    for (const f of followers) { f.anim?.cancel(); f.anim = null }
  }
  function enterCss() {
    if (!canAnimate) return enterJs()
    unTick?.(); unTick = null
    stopCss()
    mode = 'css'
    lastCoarse = 0
    if (!bentZero()) unbend()
    breather.style.transform = breatherFrame(breathValue(t)).transform
    main = play(breather, cycleFrames(breatherFrame), t)
    auraAnim = play(aura, cycleFrames(auraFrame), t)
    for (const f of followers) if (f.active) startFollower(f)
    ghostPlay()
    count(t)
  }
  function enterJs() {
    if (mode === 'js' || ctx.mercy?.on) return
    // Hand the pose over to the script before the animations let go of it.
    const v = breathValue(t)
    breather.style.transform = breatherFrame(v).transform
    aura.style.opacity = auraFrame(v).opacity
    for (const f of followers) if (f.active) pose(f, v)
    stopCss()
    mode = 'js'
    unTick = ticker.add(tick)
  }

  // Calm: read the count from the animation's clock a few times a second, and watch for restlessness.
  function coarse() {
    if (mode !== 'css' || !main) return
    const now = performance.now()
    const dt = lastCoarse ? Math.min(0.5, (now - lastCoarse) / 1000) : 0
    lastCoarse = now
    const r = clamp(ctx.behavior?.restlessness ?? 0, 0, 1)
    falter += (r - falter) * Math.min(1, dt * 2.5)
    state.falter = falter
    if (falter > 0.03 || holding) { enterJs(); return }
    const ct = Number(main.currentTime) || 0
    const nt = (((ct / 1000) % CYCLE) + CYCLE) % CYCLE
    if (nt < t - CYCLE / 2) onCycle() // the clock came round again
    t = nt
    state.value = breathValue(t)
    count(t)
    for (const f of followers) if (f.active && f.layout) pose(f, state.value)
    // It deepens only at the top of the breath, where every depth looks the same, so nothing jumps. (In a
    // reversed sitting the top of the breath is not the hold; it is the moment the guide says "breathe in".)
    const want = depthWanted()
    if (state.value > 0.995 && Math.abs(want - amp) > 0.003) {
      amp = want
      main.effect?.setKeyframes?.(cycleFrames(breatherFrame))
    }
  }
  life.interval(coarse, 100)

  // Restless: the count stumbles, stops while the spell lasts, and the drawing comes apart a little.
  function tick(dt, now) {
    if (onScreen && falter > 0.04 && (!rect || now - rectAt > 1000)) { rect = svg.getBoundingClientRect(); rectAt = now }
    const r = clamp(ctx.behavior?.restlessness ?? 0, 0, 1)
    falter += (r - falter) * Math.min(1, dt * 2.5)
    state.falter = falter
    amp += (depthWanted() - amp) * Math.min(1, dt * 0.6)
    let rate = 1
    if (falter > 0.05) rate = 1 + wobble(now / 900, 3) * falter * 3.4
    if (holding) rate = 0
    t += dt * Math.max(0, rate)
    if (t >= CYCLE) { t -= CYCLE; onCycle() }
    count(t)

    const v = breathValue(t)
    state.value = v
    for (const f of followers) if (f.active) pose(f, v)
    if (falter < 0.012 && !holding && (!onScreen || bentZero())) { enterCss(); return }
    if (!onScreen) return // the count goes on; nobody needs to see the lines move
    const sc = 1 - amp + amp * v
    const tr = falter > 0.03 ? falter : 0
    const tx = tr ? wobble(now / 160, 1) * tr * 7 : 0
    const ty = tr ? wobble(now / 190, 7) * tr * 5 : 0
    const rot = tr ? wobble(now / 400, 5) * tr * 2.4 : 0
    breather.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(4)})`
    aura.style.opacity = (0.45 + 0.55 * v * (1 - falter * 0.6)).toFixed(3)

    // The triangles lose their alignment and the bindu wanders toward your pointer.
    const want = { up: falter * 16, down: -falter * 10, bx: 0, by: 0 }
    if (falter > 0.04) {
      const p = ctx.behavior?.pointer
      if (p && rect?.width) {
        const nx = clamp((p.x - (rect.left + rect.width / 2)) / (rect.width / 2), -1, 1)
        const ny = clamp((p.y - (rect.top + rect.height / 2)) / (rect.height / 2), -1, 1)
        want.bx = nx * falter * 9
        want.by = ny * falter * 9
      }
    }
    const k = Math.min(1, dt * 3)
    const next = {
      up: bent.up + (want.up - bent.up) * k,
      down: bent.down + (want.down - bent.down) * k,
      bx: bent.bx + (want.bx - bent.bx) * k,
      by: bent.by + (want.by - bent.by) * k,
    }
    const moved = Math.abs(next.up - bent.up) + Math.abs(next.down - bent.down) + Math.abs(next.bx - bent.bx) + Math.abs(next.by - bent.by)
    if (moved > 0.004 || (falter < 0.012 && (bent.up || bent.down || bent.bx || bent.by))) {
      bent = falter < 0.012 && moved < 0.01 ? { up: 0, down: 0, bx: 0, by: 0 } : next
      // One unit of the drawing is half a percent of its sheet (the yantra is 200 units across).
      Y.upL.style.transform = `rotate(${bent.up.toFixed(2)}deg)`
      Y.downL.style.transform = `rotate(${bent.down.toFixed(2)}deg)`
      Y.binduL.style.transform = `translate(${(bent.bx / 2).toFixed(3)}%, ${(bent.by / 2).toFixed(3)}%)`
    }
  }

  function rest() {
    unTick?.(); unTick = null
    stopCss()
    ghostAnim?.cancel(); ghostAnim = null
    mode = 'rest'
    breather.style.transform = 'scale(0.95)'
    aura.style.opacity = '0.7'
    if (ghost) ghost.style.transform = 'rotate(15deg) scale(0.99)'
    for (const f of followers) if (f.active) pose(f, 0.5)
    unbend()
    el.classList.remove('is-faltering')
  }

  function applyMercy(on) {
    el.classList.toggle('is-merciful', on)
    if (on) {
      rest()
      phaseDeva.textContent = 'प्राणायाम'
      phaseEn.textContent = 'at your own pace'
      phaseCount.textContent = ''
      phaseIast.textContent = 'prāṇāyāma'
      tickEls.forEach((li) => li.classList.remove('is-now', 'is-past'))
      delete el.dataset.phase
      breatheTitle('rest')
    } else {
      shownPhase = -1
      shownCount = -1
      falter = 0
      enterCss()
    }
  }
  applyMercy(Boolean(ctx.mercy?.on))
  life.bus(ctx.bus, 'mercy:change', ({ on }) => applyMercy(Boolean(on)))
  // A hidden tab holds its breath: the animations stop where they are, and so does the count.
  life.on(document, 'visibilitychange', () => {
    for (const a of [main, auraAnim, ghostAnim, ...[...followers].map((f) => f.anim)]) {
      if (!a) continue
      try { document.hidden ? a.pause() : a.play() } catch {}
    }
    lastCoarse = 0
  })
  life.add(() => { unTick?.(); stopCss(); ghostAnim?.cancel(); followers.clear() })

  // ---------------------------------------------------------------- the visitor
  life.bus(ctx.bus, 'behavior:restless', () => {
    holding = true
    if (mode === 'css') enterJs()
    say(rng.pick(FALTERS), 2600)
  })
  life.bus(ctx.bus, 'behavior:calm', () => {
    holding = false
    whisperLock = 0
    say(rng.pick(RECOVER), 2400)
  })
  let leftDuring = null
  life.bus(ctx.bus, 'behavior:away', () => { leftDuring = PHASES[Math.max(0, shownPhase)]?.en ?? null })
  life.bus(ctx.bus, 'behavior:return', ({ awayMs }) => {
    if (!leftDuring) return
    const secs = Math.round((awayMs ?? 0) / 1000)
    const when = leftDuring === 'hold' ? 'while it was holding its breath' : leftDuring === 'breathe in' ? 'in the middle of an inhale' : 'in the middle of an exhale'
    whisperLock = 0
    say(secs > 2 ? `You left ${when}. It waited ${secs} seconds for you without breathing.` : 'It noticed you blink.', 5200)
    leftDuring = null
  })

  // The yantra hears the bowl: struck, its rings brighten for as long as the bowl rings; sung (the rim
  // circled three times), the letters on the petals light and stay lit for the rest of the sitting.
  let struckTimer = 0
  let heardBowl = false
  life.add(() => clearTimeout(struckTimer))
  A.onStrike = () => {
    el.classList.add('is-struck')
    clearTimeout(struckTimer)
    struckTimer = setTimeout(() => el.classList.remove('is-struck'), 7600)
    if (!heardBowl) {
      heardBowl = true
      whisperLock = 0
      say('The bowl has been struck. Follow the tail of its sound: it lasts as long as an exhale.', 6000)
    }
  }
  A.onSing = () => {
    el.classList.add('is-sung')
    whisperLock = 0
    say('The bowl is singing. The letters on the petals are listening.', 8000)
  }

  return {
    el,
    say,
    bowl,
    yantra: Y,
    still(sec) {
      el.dataset.still = String(sec)
      whisperLock = 0
      if (sec === 7) say('You are still. It notices.', 3000)
      if (sec === 33) say('Thirty-three seconds. The serpent at the Root has lifted its head.', 5000)
      if (sec === 108) say('One hundred and eight. The gates are open.', 8000)
    },
    stir() { delete el.dataset.still },
    open(on) { el.classList.toggle('is-open', on) },
  }
}
