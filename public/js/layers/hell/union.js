// THE UNION (tantra of collapsing margins). Two neighbouring bodies in the flow lean toward each other,
// touch, and pass into one space: their margins collapse, and then collapse past what any margin can.
// They hold, and part. A small gloss at the seam does the arithmetic of the Union (the larger margin
// survives; the smaller is absorbed), which is how margin collapse really works.
import { h } from '../../lib/dom.js'
import { bodies, KINDS, quiet, clamp } from './core.js'

const px = (n) => `${Math.round(n * 10) / 10}px`.replace('.0px', 'px')
const GLOSS = {
  sanctum: ['Coniunctio', 'two bodies touch', 'and are one space', 'and part, as margins do'],
  possession: ['margin-collapse.exe', 'they are touching', 'they are one element now', 'let go. let GO.'],
  recruitment: ['~*~ THE UNION ~*~', 'two paragraphs meet!!', 'best friends forever', 'see you at the next reflow!'],
  ashram: ['yoga · the Union', 'the breath of one enters the other', 'one space', 'and each returns to its sheath'],
  departure: ['DOCKING', 'two vessels share one berth', 'hulls in contact', 'undocking · no loss of cargo'],
  babel: ['the Union', 'two verses touch', 'and are read as one', 'and are two again'],
}
const DEFAULT = ['the Union', 'two bodies touch', 'and are one space', 'and part, as margins do']

export function createUnion(env) {
  const { ctx, rng, clock, motions, veils, I } = env
  let current = null
  let dead = false

  function findPair() {
    const pool = bodies(ctx.root, KINDS.block, { maxArea: 0.22, margin: -40, minH: 16 })
    const set = new Map(pool.map((p) => [p.el, p.r]))
    const pairs = []
    for (const [a, ra] of set) {
      const b = a.nextElementSibling
      const rb = b && set.get(b)
      if (!rb) continue
      const gap = rb.top - ra.bottom
      const shared = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
      if (gap < -1 || gap > 96 || shared < 0.4 * Math.min(ra.width, rb.width)) continue
      pairs.push([a, b, ra, rb, gap])
    }
    const ok = rng.shuffle(pairs).find(([a, b]) => quiet(a) && quiet(b))
    return ok ?? null
  }

  async function unite() {
    if (current || dead) return false
    const found = findPair()
    if (!found) return false
    const [a, b, ra, rb, gap] = found
    const csA = getComputedStyle(a)
    const csB = getComputedStyle(b)
    const mA = parseFloat(csA.marginBottom) || 0
    const mB = parseFloat(csB.marginTop) || 0
    const one = mA >= 0 && mB >= 0 ? Math.max(mA, mB) : mA < 0 && mB < 0 ? Math.min(mA, mB) : mA + mB
    const overlap = clamp(Math.min(ra.height, rb.height) * 0.42, 8, 14 + 26 * I)
    const each = (gap + overlap) / 2
    const [kicker, touch, oneSpace, part] = GLOSS[ctx.face] ?? DEFAULT

    const u = { a, b }
    current = u
    for (const el of [a, b]) el.setAttribute('data-hell-moving', 'union')
    const gloss = h('div', { class: 'hell-tag hell-union' },
      h('b', { class: 'hell-union__kicker' }, kicker),
      h('span', { class: 'hell-union__sum' }, `${px(mA)} ⋃ ${px(mB)} = ${px(one)}`),
      h('span', { class: 'hell-union__line' }, touch))
    const line = gloss.lastChild
    // Beside the seam, outside the column when there is room; over its end when there is not.
    veils.mark(a, gloss, (r, w, hh) => [r.right + w + 14 < innerWidth ? r.right + 10 : r.right - w, r.bottom - hh / 2])
    u.gloss = gloss

    const alive = () => !dead && current === u && a.isConnected && b.isConnected
    const go = (el, to, ms, easing) => motions.animate(el, [{ translate: '0px 0px' }, { translate: `0px ${to}px` }], { duration: ms / clock.speed, easing })
    const inA = go(a, each, 7200, 'cubic-bezier(0.45, 0, 0.3, 1)')
    const inB = go(b, -each, 7200, 'cubic-bezier(0.45, 0, 0.3, 1)')
    u.anims = [inA, inB]
    const track = setInterval(() => veils.refresh(), 400)
    u.track = track
    await clock.wait(7200)
    if (!alive()) return part_(u)
    for (const el of [a, b]) el.setAttribute('data-hell-union', '')
    line.textContent = oneSpace
    veils.refresh()
    await clock.wait(rng.float(3000, 5200))
    if (!alive()) return part_(u)
    line.textContent = part
    for (const el of [a, b]) el.removeAttribute('data-hell-union')
    const outA = motions.animate(a, [{ translate: `0px ${each}px` }, { translate: '0px 0px' }], { duration: 6200 / clock.speed, easing: 'cubic-bezier(0.5, 0, 0.3, 1)', fill: 'none' })
    const outB = motions.animate(b, [{ translate: `0px ${-each}px` }, { translate: '0px 0px' }], { duration: 6200 / clock.speed, easing: 'cubic-bezier(0.5, 0, 0.3, 1)', fill: 'none' })
    inA.cancel()
    inB.cancel()
    u.anims = [outA, outB]
    await clock.wait(6300)
    return part_(u)
  }

  function part_(u) {
    if (!u) return false
    clearInterval(u.track)
    for (const an of u.anims ?? []) { try { an.cancel() } catch {} }
    for (const el of [u.a, u.b]) {
      el.removeAttribute('data-hell-moving')
      el.removeAttribute('data-hell-union')
    }
    if (u.gloss) {
      u.gloss.classList.add('is-ending')
      const g = u.gloss
      setTimeout(() => veils.unmark(g), dead || ctx.mercy?.on ? 0 : 700)
    }
    if (current === u) current = null
    return true
  }

  function season() {
    if (dead) return
    if (!current) unite().catch((e) => console.error('[layer:hell] union', e))
    clock.after(rng.float(45000, 110000) / (0.35 + I), season)
  }
  clock.after(rng.float(25000, 70000) / (0.35 + I), season)

  return {
    trigger: () => unite(),
    get active() { return Boolean(current) },
    stop() {
      dead = true
      if (current) part_(current)
      current = null
    },
  }
}
