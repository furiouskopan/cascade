// THE CASCADE — boot liturgy.
// 1. Read fate, firmament and memory.  2. The Oracle picks a face.  3. Mount the face.
// 4. Wake the layers (glyphs, hell, audio, ritual, secrets). They persist across schisms.
import { makeRng, freshSeed } from './kernel/rng.js'
import { readSky } from './kernel/sky.js'
import { memory, recordVisit } from './kernel/memory.js'
import { bus } from './kernel/bus.js'
import { startBehavior } from './kernel/behavior.js'
import { chooseFace, schismCandidate, faceWeights } from './kernel/oracle.js'
import { initMercy } from './kernel/mercy.js'
import { api } from './kernel/api.js'
import { faceInfo } from './lib/faces.js'

const params = new URLSearchParams(location.search)
if (params.has('reset')) memory.forget()

// ?at=2026-10-31T03:33 pins the clock for testing omens; the offset keeps it ticking.
const pinned = params.has('at') ? new Date(params.get('at')) : null
const offset = pinned && !isNaN(pinned) ? pinned.getTime() - Date.now() : 0
const clock = () => new Date(Date.now() + offset)

const seed = params.get('seed') || freshSeed()

const ctx = {
  seed,
  rng: makeRng(seed),
  params,
  clock,
  sky: readSky(clock()),
  readSky: () => readSky(clock()),
  memory,
  bus,
  api,
  visit: recordVisit(),
  root: document.getElementById('temple'),
  face: null,
  schisms: 0,
  startedAt: performance.now(),
}
ctx.mercy = initMercy(params)
ctx.behavior = startBehavior()

let current = null

function loadCss(href) {
  const link = document.getElementById('face-css')
  return new Promise((resolve) => {
    if (link.getAttribute('href') === href) return resolve()
    const done = () => { clearTimeout(t); resolve() }
    const t = setTimeout(done, 1500)
    link.addEventListener('load', done, { once: true })
    link.addEventListener('error', done, { once: true })
    link.setAttribute('href', href)
  })
}

async function mountFace(name) {
  await loadCss(`/css/faces/${name}.css`)
  document.documentElement.dataset.face = name
  ctx.root.replaceChildren()
  ctx.root.className = `face face--${name}`
  const mod = await import(`./faces/${name}.js`)
  const destroy = await mod.render(ctx)
  // A face may keep a moment for itself (e.g. `export const keeps = ['still']`): no schism for that reason.
  current = { name, destroy: typeof destroy === 'function' ? destroy : null, keeps: new Set(mod.keeps ?? []) }
  memory.set('lastFace', name)
  memory.update('facesSeen', (s) => (s.includes(name) ? s : [...s, name]), [])
  bus.emit('face:ready', { face: name, schism: ctx.schisms > 0 })
}

async function switchFace(name, reason = 'will') {
  if (!name || name === ctx.face) return
  bus.emit('face:leaving', { face: ctx.face, to: name, reason })
  try { current?.destroy?.() } catch (e) { console.error(e) }
  ctx.schisms++
  ctx.face = name
  await mountFace(name)
}
ctx.switchFace = switchFace

// Schisms: rare mid-visit changes of face, driven by the visitor's own behavior.
function trySchism(reason) {
  // Faces that own an address (babel's /verse/) keep it: the path chose them, not fate.
  if (faceInfo(ctx.face)?.route || ctx.schisms >= 2 || current?.keeps.has(reason)) return
  if (performance.now() - ctx.startedAt < 45000 && reason !== 'eclipse') return
  const next = schismCandidate(ctx, reason)
  if (next) switchFace(next, reason)
}
bus.on('behavior:restless', () => trySchism('restless'))
bus.on('behavior:still', ({ seconds }) => seconds >= 108 && trySchism('still'))
bus.on('behavior:return', ({ awayMs }) => awayMs > 60000 && trySchism('return'))
// Let the face show its own eclipse first; the schism, if fate wills one, comes after.
bus.on('server:eclipse', () => setTimeout(() => trySchism('eclipse'), 15000))

// An asked schism: the visitor asks for another face (the altar, or cascade.another()), so one sitting can
// show every face. At most once a minute, never away from a face that owns its address (babel's shelves choose
// the face), and faces this visitor has not seen are favoured. Returns {ok, face} or {ok: false, reason, wait?}.
let lastAsked = -Infinity
ctx.askFace = () => {
  if (faceInfo(ctx.face)?.route) return { ok: false, reason: 'route' }
  const wait = lastAsked + 60000 - performance.now()
  if (wait > 0) return { ok: false, reason: 'wait', wait: Math.ceil(wait / 1000) }
  const w = faceWeights(ctx)
  const seen = memory.get('facesSeen', [])
  for (const f of Object.keys(w)) if (!seen.includes(f)) w[f] *= 4
  w[ctx.face] = 0
  const next = ctx.rng.fork(`asked/${ctx.schisms}`).weighted(w)
  if (!next) return { ok: false, reason: 'none' }
  lastAsked = performance.now()
  switchFace(next, 'asked')
  return { ok: true, face: next }
}

addEventListener('pagehide', () => memory.set('restlessness', ctx.behavior.restlessness))

const LAYERS = ['glyphs', 'hell', 'audio', 'ritual', 'secrets']

async function boot() {
  ctx.face = chooseFace(ctx)
  try {
    await mountFace(ctx.face)
  } catch (e) {
    console.error('[face]', e)
    ctx.root.textContent = 'The temple is being rebuilt. Return at the next Repaint.'
  }
  await Promise.all(LAYERS.map(async (name) => {
    try {
      const mod = await import(`./layers/${name}.js`)
      await mod.init?.(ctx)
    } catch (e) {
      console.error(`[layer:${name}]`, e)
    }
  }))
  api.stream()
  bus.emit('temple:awake', { face: ctx.face, seed })
}

boot()
