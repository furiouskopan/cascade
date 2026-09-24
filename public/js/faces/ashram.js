// THE ASHRAM: the Yantra Breath Temple (docs/CANON.md §3). Meditative, and a little uncanny.
// A deep-indigo hermitage where a yantra breathes (4 in, 4 held, 6 out) with your stillness and
// falters with your restlessness; seven chakras stacked as literal z-index layers; the Five Sheaths
// drawn with the real box model; bīja mantras; a prayer wheel that prays through the ritual; a singing
// bowl that summons sound; and, at one hundred and eight seconds of stillness, a door.
//
// Secrets kept here (each marked with ctx.memory.markSecret):
//   stillness             33 s still: the serpent climbs the Ladder, z-index by z-index
//   ashram-garbhagriha    108 s still: the gates open onto the womb-chamber
//   ashram-seeds          type lam vam ram yam ham om, in that order: the Crown opens
//   ashram-bowl-sings     press and circle the bowl's rim three times: the water shows the sound
//   ashram-mala           108 turns of the prayer wheel (counted across visits)
//   ashram-mala-of-breaths 108 breaths taken with the yantra in one sitting
// Uncanny details, not marked: the figure in the Five Sheaths opens its eyes and follows your pointer
// while you are restless (its third eye opens at 108 s, and stays open on later sittings); some
// sittings, and every new moon, the yantra has a shadow that breathes out while it breathes in; the
// seeds can also be "spoken" by touching the wheels from the Root upward.
// Bus: emits `ashram:breath` {phase, seconds, falter} at each phase of the breath (for the audio layer).
import { h } from '../lib/dom.js'
import { makeLife, makeTicker } from './ashram/life.js'
import { buildStage } from './ashram/stage.js'
import { buildLadder } from './ashram/ladder.js'
import { buildSheaths } from './ashram/sheaths.js'
import { buildWheel } from './ashram/wheel.js'
import { buildChamber } from './ashram/chamber.js'
import { buildThreshold, buildMantra, buildSutra, buildFooter } from './ashram/texts.js'

export function render(ctx) {
  const life = makeLife()
  const ticker = makeTicker(ctx, life)
  const rng = ctx.rng.fork('ashram')
  const sittings = ctx.memory?.update?.('ashram.sittings', (n) => n + 1, 0) ?? 1
  const A = { ctx, life, ticker, rng, sittings }

  const sky = ctx.sky
  const root = h('div', { class: 'ashram' })
  root.dataset.tint = rng.pick(['saffron', 'turmeric', 'lotus'])
  if (sky.has('night')) root.classList.add('is-night')
  if (sky.has('full-moon')) root.classList.add('is-full')
  if (sky.has('new-moon')) root.classList.add('is-dark')
  if (sky.has('witching') || sky.has('midnight')) root.classList.add('is-deep')

  const threshold = buildThreshold(A)
  const stage = buildStage(A)
  const mantraSec = buildMantra(A)
  const ladder = buildLadder(A)
  const sheaths = buildSheaths(A)
  const wheel = buildWheel(A)
  const sutra = buildSutra(A)
  const footer = buildFooter(A)
  const chamber = buildChamber(A)
  const announce = h('p', { class: 'visually-hidden', 'aria-live': 'polite' })

  root.append(
    threshold.el,
    stage.el,
    mantraSec.el,
    h('div', { class: 'ash-pair' }, ladder.el, sheaths.el),
    wheel.el,
    sutra.el,
    footer.el,
    chamber.el,
    announce,
  )
  ctx.root.append(root)

  // ------------------------------------------------------------ stillness (Canon §3.6)
  life.bus(ctx.bus, 'behavior:still', ({ seconds }) => {
    root.dataset.still = String(seconds)
    stage.still(seconds)
    if (seconds === 7) { root.classList.add('is-still'); sheaths.watch(false) }
    if (seconds === 33) {
      ladder.rise('stillness')
      sheaths.wake(true)
      ctx.memory?.markSecret?.('stillness', { face: 'ashram' })
      announce.textContent = 'Thirty-three seconds of stillness. The serpent climbs the Ladder of the seven wheels.'
    }
    if (seconds === 108) {
      stage.open(true)
      chamber.open()
      sutra.append108()
      sheaths.third(true)
      root.classList.add('was-opened')
      announce.textContent = 'One hundred and eight seconds of stillness. The gates of the yantra have opened onto the womb-chamber.'
    }
  })
  life.bus(ctx.bus, 'behavior:stir', () => {
    delete root.dataset.still
    root.classList.remove('is-still')
    stage.stir()
    stage.open(false)
    ladder.settle()
    sheaths.wake(false)
    chamber.close()
  })

  // The figure in the Five Sheaths opens its eyes when you are restless, and closes them when you calm.
  life.bus(ctx.bus, 'behavior:restless', () => sheaths.watch(true))
  life.bus(ctx.bus, 'behavior:calm', () => sheaths.watch(false))
  // Whoever has once sat through the mala of seconds finds the third eye already open.
  if (Number(ctx.memory?.get?.('ashram.opened', 0)) > 0) sheaths.third(true)

  // ------------------------------------------------------------ eclipse (Canon §7)
  const eclipse = () => {
    const until = Number(ctx.ritual?.state?.eclipseUntil) || 0
    const on = document.documentElement.hasAttribute('data-eclipse') || until > Date.now()
    root.classList.toggle('is-eclipsed', on)
    return on
  }
  life.bus(ctx.bus, 'server:eclipse', (d) => {
    root.classList.add('is-eclipsed')
    stage.say('The sun is covered. Breathe anyway; the yantra does not need light to breathe.', 8000)
    const ms = Math.max(4000, (Number(d?.until) || Date.now() + 33000) - Date.now())
    life.timeout(eclipse, ms + 500)
  })
  life.bus(ctx.bus, 'temple:awake', eclipse)

  // ------------------------------------------------------------ the hour changes while you sit
  life.interval(() => {
    const now = ctx.readSky?.()
    if (!now) return
    root.classList.toggle('is-night', now.has('night'))
  }, 60000)

  return () => {
    life.destroy()
    root.remove()
  }
}
