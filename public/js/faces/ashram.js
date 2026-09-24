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
//   ashram-bowl-sings     press and circle the bowl's rim three times (or walk round it three times with
//                         the arrow keys): the water shows the sound
//   ashram-mala           108 turns of the prayer wheel (counted across visits)
//   ashram-mala-of-breaths 108 breaths taken with the yantra in one sitting
// Also: the Lotus of Letters teaches the petals' glyphs by name (point at one and its petal lights); some
// sittings Float, the ashram cat (position: absolute, never cleared), sleeps somewhere in the hall and
// moves when you are restless near it; the tab title breathes with the yantra; the bowl, struck, brightens
// the yantra, and sung, lights its letters; after 108 s the header says the sitting is "led by you".
// Uncanny details, not marked: the figure in the Five Sheaths opens its eyes and follows your pointer
// while you are restless (its third eye opens at 108 s, and stays open on later sittings); some
// sittings, and every new moon, the yantra has a shadow that breathes out while it breathes in; the
// seeds can also be "spoken" by touching the wheels from the Root upward; leave the tab mid-breath and it
// tells you how long it waited without breathing; and about one sitting in twelve (drawn by lot) is a
// reversed sitting, where the yantra empties while the guide says "breathe in", and after three breaths
// admits that it is breathing for whoever sits across from you. When a schism carries you here from
// another face, the guide says how you came (your stillness, your restlessness, an eclipse, your absence).
// Cost: calm, the breath runs on the compositor (Web Animations whose clock is the count); only a restless
// visitor is breathed for frame by frame. Everything stops under mercy and in a hidden tab.
// Bus: emits `ashram:breath` {phase, seconds, falter} at each phase of the breath (for the audio layer).
import { h } from '../lib/dom.js'
import { makeLife, makeTicker } from './ashram/life.js'
import { buildStage } from './ashram/stage.js'
import { buildLadder } from './ashram/ladder.js'
import { buildSheaths } from './ashram/sheaths.js'
import { buildWheel } from './ashram/wheel.js'
import { buildChamber } from './ashram/chamber.js'
import { buildThreshold, buildMantra, buildSutra, buildFooter } from './ashram/texts.js'
import { buildLetters } from './ashram/letters.js'
import { buildCat } from './ashram/cat.js'

export function render(ctx) {
  const life = makeLife()
  const ticker = makeTicker(ctx, life)
  const rng = ctx.rng.fork('ashram')
  const sittings = ctx.memory?.update?.('ashram.sittings', (n) => (Number(n) || 0) + 1, 0) ?? 1
  // A rare sitting, drawn by lot: about one in twelve, the yantra breathes the other way (see stage.js).
  const rare = ctx.rng.fork('ashram/rare').chance(1 / 12) ? 'reversed' : null
  const A = { ctx, life, ticker, rng, sittings, rare }

  const sky = ctx.sky
  const root = h('div', { class: 'ashram', dataset: rare ? { sitting: rare } : {} })
  root.dataset.tint = rng.pick(['saffron', 'turmeric', 'lotus'])
  if (sky.has('night')) root.classList.add('is-night')
  if (sky.has('full-moon')) root.classList.add('is-full')
  if (sky.has('new-moon')) root.classList.add('is-dark')
  if (sky.has('witching') || sky.has('midnight')) root.classList.add('is-deep')

  const threshold = buildThreshold(A)
  const stage = buildStage(A)
  A.stage = stage
  const letters = buildLetters(A)
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
    letters.el,
    mantraSec.el,
    h('div', { class: 'ash-pair' }, ladder.el, sheaths.el),
    wheel.el,
    sutra.el,
    footer.el,
    chamber.el,
    announce,
  )
  ctx.root.append(root)
  const cat = buildCat(A)
  cat.place()

  // ------------------------------------------------------------ stillness (Canon §3.6)
  life.bus(ctx.bus, 'behavior:still', ({ seconds }) => {
    root.dataset.still = String(seconds)
    stage.still(seconds)
    if (seconds === 7) { root.classList.add('is-still'); sheaths.watch(false) }
    if (seconds === 33) {
      ladder.rise('stillness')
      sheaths.wake(true)
      cat.still()
      ctx.memory?.markSecret?.('stillness', { face: 'ashram' })
      announce.textContent = 'Thirty-three seconds of stillness. The serpent climbs the Ladder of the seven wheels.'
    }
    if (seconds === 108) {
      stage.open(true)
      chamber.open()
      sutra.append108()
      sheaths.third(true)
      threshold.ledByYou?.(true)
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
  // The ritual layer keeps <html data-eclipse> for exactly as long as the sun is covered (by the server's
  // clock); the ashram follows the attribute, so it also knows after a schism, mid-eclipse.
  const eclipse = () => {
    const on = document.documentElement.hasAttribute('data-eclipse')
    root.classList.toggle('is-eclipsed', on)
    return on
  }
  life.observe(new MutationObserver(eclipse)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-eclipse'] })
  life.bus(ctx.bus, 'server:eclipse', (d) => {
    root.classList.add('is-eclipsed')
    stage.say('The sun is covered. Breathe anyway; the yantra does not need light to breathe.', 8000)
    // If nothing marks the heavens, the ashram uncovers its own sun when the eclipse is due to end.
    const ms = Math.max(4000, (Number(d?.until) || Date.now() + 33000) - (Number(d?.now) || Date.now()))
    life.timeout(eclipse, ms + 500)
  })
  eclipse()

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
