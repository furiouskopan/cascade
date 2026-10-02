// LACUNA ROT. A line that is read for a long time breaks at its edges, as tablets do: the ends of its
// lines are lost under the editor's brackets, [ … ] and ⸢x⸣. Nothing is removed. The real text stays
// underneath, whole, for screen readers and for copying; the break is an aria-hidden shard laid over it.
// The hand restores it ("restored by the editor"), and so does mercy. Under mercy nothing new breaks.
import { h } from '../../lib/dom.js'

const MAX_BROKEN = 5
const TICK = 4000

export function makeLacunae(O, targets, restoreButton) {
  const { ctx, life, rng } = O
  const seen = new Map() // el -> seconds read
  const visibleNow = new Set()
  const broken = new Set()
  const thresholds = new WeakMap()
  let restoredOnce = false

  const io = life.observe(new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio > 0.9) visibleNow.add(e.target)
      else visibleNow.delete(e.target)
    }
  }, { threshold: [0, 0.9, 1] }))

  function watch(el) {
    if (!el || seen.has(el)) return
    seen.set(el, 0)
    thresholds.set(el, rng.float(22, 52))
    io.observe(el)
  }
  for (const el of targets()) watch(el)

  function breakEdges(el) {
    if (broken.has(el) || el.classList.contains('is-restored')) return
    el.style.setProperty('--lac-l', `${rng.float(1.6, 3.4).toFixed(2)}ch`)
    el.style.setProperty('--lac-r', `${rng.float(4.4, 5.6).toFixed(2)}ch`)
    if (!el.querySelector(':scope > .om-lac')) {
      el.append(
        h('span', { class: 'om-lac om-lac--l', 'aria-hidden': 'true' }),
        h('span', { class: 'om-lac om-lac--r', 'aria-hidden': 'true', 'data-damaged': rng.chance(0.5) ? 'x' : 'ki' }),
        h('span', { class: 'om-lac-note', 'aria-hidden': 'true' }),
      )
    }
    el.classList.add('has-lacuna')
    broken.add(el)
    const restoreOne = () => restoreEl(el)
    life.on(el, 'pointerenter', restoreOne)
    life.on(el, 'click', restoreOne)
    restoreButton.hidden = false
  }

  function restoreEl(el) {
    if (!broken.has(el)) return
    broken.delete(el)
    el.classList.add('is-restored')
    el.classList.remove('has-lacuna')
    if (!restoredOnce) {
      restoredOnce = true
      ctx.memory?.markSecret?.('omens-restored', { face: 'omens' })
    }
    if (!broken.size) restoreButton.hidden = true
  }
  function restoreAll() { for (const el of [...broken]) restoreEl(el) }

  life.on(restoreButton, 'click', () => { restoreAll(); O.say?.('The editor has restored every broken edge.') })
  life.bus(ctx.bus, 'mercy:change', ({ on }) => { if (on) restoreAll() })

  life.interval(() => {
    if (ctx.mercy?.on) return
    for (const el of targets()) watch(el)
    for (const el of visibleNow) {
      if (broken.has(el) || el.classList.contains('is-restored')) continue
      const t = (seen.get(el) ?? 0) + TICK / 1000
      seen.set(el, t)
      if (t >= thresholds.get(el) && broken.size < MAX_BROKEN) breakEdges(el)
    }
  }, TICK)

  return {
    restoreAll,
    // For the witness tool: break a line at once.
    breakNow(el) { if (el) { watch(el); breakEdges(el) } },
  }
}
