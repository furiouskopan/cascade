// THE WOMB-CHAMBER (garbhagṛha). At one hundred and eight seconds of stillness the gates of the yantra
// open and two carved doors part across the viewport. Inside: a lamp, and around the lamp a sheath that is
// drawn with an outline around an element of no size at all, so it takes no space; and what the ashram
// teaches only to the unmoving. The first movement closes the doors again; the ashram remembers.
import { h } from '../../lib/dom.js'
import { yantra } from '../../lib/sigil.js'
import { devaNum, ordinal } from './lore.js'
import { fmt } from './life.js'

export function buildChamber(A) {
  const { ctx, life } = A
  const rng = A.rng.fork('chamber')
  const doorArt = yantra(ctx.rng.fork('ashram/door'), { size: 200, stroke: 0.9 })
  const door = (side) => h('div', { class: `ash-door ash-door--${side}`, 'aria-hidden': 'true' },
    h('div', { class: 'ash-door-art', html: doorArt }),
    h('span', { class: 'ash-door-ring' }))

  // The lamp, and the sheath of bliss around it: width 0, height 0, and a dashed outline 44px away.
  const nothing = h('span', { class: 'ash-nothing', 'aria-hidden': 'true' })
  const measure = h('p', { class: 'ash-nothing-measure' })
  const shrine = h('div', { class: 'ash-shrine' },
    h('span', { class: 'ash-lamp', 'aria-hidden': 'true' }, h('span', { class: 'ash-lamp-flame' })),
    nothing,
  )

  const times = h('p', { class: 'ash-chamber-times' })
  const tally = h('p', { class: 'ash-chamber-tally' })
  const inner = h('div', { class: 'ash-chamber-inner' },
    shrine,
    measure,
    h('p', { class: 'ash-chamber-deva', lang: 'sa' }, 'गर्भगृह'),
    h('p', { class: 'ash-chamber-iast' }, 'garbhagṛha · the womb-chamber'),
    h('p', { class: 'ash-chamber-still' }, 'You have been still for one hundred and eight seconds, one for every bead of the mala.'),
    h('p', { class: 'ash-chamber-gates' }, 'The gates of the yantra were never locked. They were only waiting for the page to stop reflowing.'),
    h('p', { class: 'ash-chamber-teaching' }, 'Of the Five Sheaths, four take up room in the world. The fifth is drawn around you whenever you are given Attention, and it takes up nothing at all. Around the lamp it is drawn about an element of no size, and still you can see it.'),
    h('p', { class: 'ash-chamber-teaching' }, 'There is an eye between the brows that can see sound. Speak its name, ', h('i', {}, 'ajna'), ', anywhere in the temple, and it will open.'),
    tally,
    times,
    h('p', { class: 'ash-chamber-leave' }, 'Move whenever you like. The doors will close behind you, and remember.'),
  )
  const el = h('div', { class: 'ash-chamber', 'aria-hidden': 'true' },
    h('div', { class: 'ash-chamber-glow', 'aria-hidden': 'true' }),
    inner,
    door('l'),
    door('r'),
  )
  let state = 'closed'
  let t1 = 0
  let t2 = 0
  const clear = () => { clearTimeout(t1); clearTimeout(t2) }
  life.add(clear)

  function readNothing() {
    const r = nothing.getBoundingClientRect()
    const cs = getComputedStyle(nothing)
    measure.textContent = `width: ${Math.round(r.width)}px; height: ${Math.round(r.height)}px; outline: ${parseFloat(cs.outlineWidth) || 0}px ${cs.outlineStyle}, ${Math.round(parseFloat(cs.outlineOffset) || 0)}px from nothing.`
  }

  return {
    el,
    get isOpen() { return state === 'open' || state === 'opening' },
    open() {
      if (state === 'open' || state === 'opening') return
      clear()
      const n = ctx.memory?.update?.('ashram.opened', (x) => (Number(x) || 0) + 1, 0) ?? 1
      times.textContent = n > 1
        ? `॥ ${devaNum(n)} ॥ The doors have opened for you ${n} times now.`
        : `This is the first time they have opened for you. ${rng.pick(['Nobody is watching.', 'The bindu is watching, kindly.', 'It will not be the last.'])}`
      const breaths = Number(A.breath?.count) || 0
      const turns = Number(ctx.memory?.get?.('ashram.turns', 0)) || 0
      const all = Number(ctx.memory?.get?.('ashram.breaths', 0)) || 0
      tally.textContent = `In this ${ordinal(A.sittings)} sitting: ${breaths ? `${fmt(breaths)} ${breaths === 1 ? 'breath' : 'breaths'} taken with the yantra` : 'no breaths counted, which is also a way of breathing'}; ${turns ? `${fmt(turns)} ${turns === 1 ? 'turn' : 'turns'} of the wheel remembered` : 'the wheel untouched'}.`
        + (all > breaths ? ` Across every sitting, ${fmt(all)} breaths. The cushion has counted them all.` : '')
      state = 'opening'
      el.setAttribute('aria-hidden', 'false')
      el.classList.add('is-present')
      requestAnimationFrame(readNothing)
      // Let the closed doors appear first, then part them.
      t1 = setTimeout(() => {
        el.classList.add('is-open')
        state = 'open'
      }, ctx.mercy?.on ? 0 : 1400)
      ctx.memory?.markSecret?.('ashram-garbhagriha', { face: 'ashram' })
    },
    close() {
      if (state === 'closed' || state === 'closing') return
      clear()
      state = 'closing'
      el.classList.remove('is-open')
      t2 = setTimeout(() => {
        el.classList.remove('is-present')
        el.setAttribute('aria-hidden', 'true')
        state = 'closed'
      }, ctx.mercy?.on ? 0 : 3200)
    },
  }
}
