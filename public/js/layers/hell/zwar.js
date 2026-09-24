// THE Z-WAR (the war of the Ladder). Two neighbouring bodies are pulled across each other and fight over
// which one is on top, bidding rung after rung up the Ladder: 1, 2, 3, 5, 7, 12, 33, 108, 404, 999.
// The z-index values are real, and the tag beside each body shows the rung it holds. At 999 one of them
// reaches for 2147483647 and is refused: the Highest Heaven is not for page elements, and the war ends.
// (Real rungs stay below 1000, under the temple's own layers, so no war ever covers the mercy button.)
import { h } from '../../lib/dom.js'
import { bodies, KINDS, quiet, clamp, aboveStart } from './core.js'

const RUNGS = [1, 2, 3, 5, 7, 12, 33, 108, 404, 999]
const NAMES = { 1: 'Muladhara', 2: 'Svadhisthana', 3: 'Manipura', 5: 'Vishuddha', 7: 'the Seventh', 12: 'the Twelve', 33: 'the Age of Ascent', 108: 'the Mala', 404: 'the Lost', 999: 'the Last Rung' }
const REFUSAL = {
  sanctum: 'the Highest Heaven is not for scribes',
  possession: 'z-index: 2147483647 — reserved. by me.',
  recruitment: 'SORRY!! That rung is for the Mothership only!',
  ashram: 'the crown is not climbed. it is released.',
  departure: 'RUNG 2147483647 · RESERVED FOR THE MOTHERSHIP',
  babel: 'no volume is shelved that high',
}

export function createZwar(env) {
  const { ctx, rng, clock, motions, veils, I } = env
  let current = null
  let dead = false

  function findPair() {
    const pool = bodies(ctx.root, `${KINDS.figure}, ${KINDS.heading}, li, p, blockquote`, { maxArea: 0.2, margin: -30, minW: 40, minH: 18 })
    const set = new Map(pool.map((p) => [p.el, p.r]))
    const pairs = []
    for (const [a, ra] of set) {
      const b = a.nextElementSibling
      const rb = b && set.get(b)
      if (!rb) continue
      // Side by side, or one above the other: either way they must be near.
      const across = rb.left - ra.right
      const down = rb.top - ra.bottom
      const sideBySide = across > -4 && across < 140 && Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top) > 10
      const stacked = down > -4 && down < 90 && Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left) > 30
      if (sideBySide) pairs.push([a, b, ra, rb, 'x', across])
      else if (stacked) pairs.push([a, b, ra, rb, 'y', down])
    }
    return rng.shuffle(pairs).find(([a, b]) => quiet(a) && quiet(b) && positionable(a) && positionable(b)) ?? null
  }
  // A body that is statically placed may be lifted to position: relative only if nothing inside it
  // depends on it staying static (no absolutely placed children of its own).
  function positionable(el) {
    const pos = getComputedStyle(el).position
    if (pos !== 'static') return true
    for (const c of el.children) if (getComputedStyle(c).position === 'absolute') return false
    return true
  }

  async function fight() {
    if (current || dead) return false
    const found = findPair()
    if (!found) return false
    const [a, b, ra, rb, axis, gap] = found
    const size = axis === 'x' ? Math.min(ra.width, rb.width) : Math.min(ra.height, rb.height)
    const overlap = clamp(size * 0.3, 14, 22 + 30 * I)
    const each = (gap + overlap) / 2
    const w = { a, b, tags: [], anims: [] }
    current = w
    for (const el of [a, b]) {
      el.setAttribute('data-hell-moving', 'zwar')
      el.setAttribute('data-hell-z', getComputedStyle(el).position === 'static' ? 'lift' : 'hold')
    }
    const z = new Map([[a, 0], [b, 1]])
    const setZ = (el, i) => { z.set(el, i); el.style.setProperty('--hell-z', String(RUNGS[i])) }
    setZ(a, 0)
    setZ(b, 1)
    const tag = (el) => {
      const t = h('div', { class: 'hell-tag hell-z' }, h('code', {}, 'z-index: '), h('b', {}, String(RUNGS[z.get(el)])), h('span', {}, ''))
      veils.mark(el, t, aboveStart)
      w.tags.push(t)
      return t
    }
    const ta = tag(a)
    const tb = tag(b)
    const say = (t, el, note, top) => {
      t.children[1].textContent = String(RUNGS[z.get(el)])
      t.children[2].textContent = note ? ` · ${note}` : ''
      t.classList.toggle('is-top', top)
    }
    say(ta, a, NAMES[RUNGS[0]], false)
    say(tb, b, NAMES[RUNGS[1]], true)

    const dir = axis === 'x' ? (d) => `${d}px 0px` : (d) => `0px ${d}px`
    const tilt = rng.float(0.6, 1.6)
    w.anims = [
      motions.animate(a, [{ translate: '0px 0px', rotate: '0deg' }, { translate: dir(each), rotate: `${-tilt}deg` }], { duration: 2400 / clock.speed, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' }),
      motions.animate(b, [{ translate: '0px 0px', rotate: '0deg' }, { translate: dir(-each), rotate: `${tilt}deg` }], { duration: 2400 / clock.speed, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' }),
    ]
    w.track = setInterval(() => veils.refresh(), 450)
    const alive = () => !dead && current === w && a.isConnected && b.isConnected
    await clock.wait(2600)
    // Bidding: the one beneath climbs past the one above, never faster than one change in 1.6 s.
    let under = a
    for (;;) {
      if (!alive()) return end(w)
      const over = under === a ? b : a
      const next = z.get(over) + 1
      if (next >= RUNGS.length) {
        say(under === a ? ta : tb, under, '2147483647?', false)
        await clock.wait(1800)
        if (!alive()) return end(w)
        const t = under === a ? ta : tb
        t.classList.add('is-refused')
        t.children[2].textContent = ` · ${REFUSAL[ctx.face] ?? 'the Highest Heaven is not for page elements'}`
        veils.refresh()
        await clock.wait(3200)
        return end(w)
      }
      // Sometimes a bid skips rungs, out of pride.
      const leap = Math.min(RUNGS.length - 1, next + (rng.chance(0.25 + I * 0.2) ? 1 : 0))
      setZ(under, leap)
      say(under === a ? ta : tb, under, NAMES[RUNGS[leap]], true)
      say(under === a ? tb : ta, over, '', false)
      veils.refresh()
      under = over
      await clock.wait(rng.float(1600, 2600))
    }
  }

  function end(w) {
    if (!w) return false
    clearInterval(w.track)
    for (const t of w.tags) t.classList.add('is-ending')
    const tags = w.tags
    setTimeout(() => tags.forEach((t) => veils.unmark(t)), dead || ctx.mercy?.on ? 0 : 700)
    const done = () => {
      for (const el of [w.a, w.b]) {
        el.removeAttribute('data-hell-moving')
        el.removeAttribute('data-hell-z')
        el.style.removeProperty('--hell-z')
        if (!el.getAttribute('style')) el.removeAttribute('style')
      }
    }
    if (dead || ctx.mercy?.on || !w.a.isConnected) {
      for (const an of w.anims) { try { an.cancel() } catch {} }
      done()
    } else {
      // Both slide home; the rungs are given back only when they no longer overlap.
      const home = (el, an) => {
        const t = getComputedStyle(el)
        an.cancel()
        return motions.animate(el, [{ translate: t.translate === 'none' ? '0px 0px' : t.translate, rotate: t.rotate === 'none' ? '0deg' : t.rotate }, { translate: '0px 0px', rotate: '0deg' }], { duration: 1800 / clock.speed, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'none' })
      }
      const [aa, ab] = w.anims
      const ba = home(w.a, aa)
      home(w.b, ab)
      ba.addEventListener('finish', done)
      ba.addEventListener('cancel', done)
    }
    if (current === w) current = null
    return true
  }

  function season() {
    if (dead) return
    if (!current) fight().catch((e) => console.error('[layer:hell] zwar', e))
    clock.after(rng.float(40000, 100000) / (0.2 + I), season)
  }
  clock.after(rng.float(15000, 45000) / (0.2 + I), season)

  return {
    trigger: () => fight(),
    get active() { return Boolean(current) },
    stop() {
      dead = true
      if (current) end(current)
      current = null
    },
  }
}
