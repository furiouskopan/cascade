// THE TREMBLING STAIN (docs/ROADMAP.md §4.1). One garment carries a stain that survives every wash.
//
// The stain is `animation: lnd-stain … !important`, declared in this face's own layer (launderette.css, a
// deliberate, commented Inversion effect). Its keyframes paint the stain and shake it, so the stain exists
// only while the animation runs. A wash is `all: <keyword>` in the garment's style attribute: an ordinary
// declaration, and an ordinary declaration never beats an important one, so the animation outlives every
// machine. Mercy lifts it: mercy's !important lives in the first layer (base.css, @layer reset), where
// important declarations win, and it sets exactly the animation properties (a thousandth of a millisecond,
// one iteration). The animation then really ends, and a stain that is only a trembling is gone.
//
// The lifting is read from the animation itself (its animationend, or getAnimations() as a fallback), never
// from the mercy flag alone. A visitor who arrives under mercy finds the tee clean: the stain shows itself
// only once things are allowed to move, and it must have been seen trembling before its lifting counts.
import { h } from '../../lib/dom.js'
import { CERTIFICATE, SAYS } from './lore.js'
import { trembling } from './garments.js'

export function makeStain(A, tee) {
  const { ctx, life } = A
  const el = tee.el
  const before = Boolean(ctx.memory?.hasSecret?.('launderette-riddle'))
  let armed = false
  let seen = false
  let lifted = false
  let marked = false
  const tried = new Set()

  function arm() {
    if (lifted || armed) return
    if (ctx.mercy?.on) {
      A.root.dataset.stain = 'hiding'
      A.basket?.paint(tee)
      return
    }
    armed = true
    el.classList.add('lnd-stain')
    A.root.dataset.stain = 'on'
    A.basket?.paint(tee)
    look()
  }

  // Seen: the tee was on screen, trembling, for a moment. The observer only reports changes, so whether it is
  // in view is remembered, and looked at again whenever the stain starts to tremble.
  let visible = false
  let looking = null
  function look(retry = 0) {
    if (seen || looking || !armed || !visible || ctx.mercy?.on || retry > 12) return
    looking = life.timeout(() => {
      looking = null
      if (armed && visible && !ctx.mercy?.on && trembling(el)) seen = true
      else look(retry + 1)
    }, 650)
  }
  const io = life.observe(new IntersectionObserver((entries) => {
    for (const e of entries) visible = e.isIntersecting
    if (!visible && looking) { looking(); looking = null }
    look()
  }, { threshold: 0.4 }))
  io.observe(el)

  function lift(how) {
    if (lifted || !armed) return
    if (!seen) return // nobody saw it tremble; it waits for them, and trembles again when things may move
    lifted = true
    armed = false
    el.classList.remove('lnd-stain')
    el.classList.add('is-clean')
    A.root.dataset.stain = 'lifted'
    if (!marked) {
      marked = true
      ctx.memory?.markSecret?.('launderette-riddle', { face: 'launderette', how })
    }
    A.basket?.paint(tee)
    A.onLifted?.({ how, again: before, byHand: !ctx.mercy?.on })
  }

  // The truthful witness: the stain's own animation ends. (An infinite animation ends only when something
  // outranks its iteration count; on this page that is mercy, or a hand in the Inspector.)
  life.on(el, 'animationend', (e) => {
    if (e.target === el && e.animationName === 'lnd-stain') lift('animationend')
  })
  // Cut out in the Inspector (the class or the rule removed): gone, but not lifted, and it comes back. A tee
  // carried into a drum also cancels and restarts its trembling, so look again a moment later before speaking.
  life.on(el, 'animationcancel', (e) => {
    if (e.target !== el || e.animationName !== 'lnd-stain' || lifted) return
    life.timeout(() => {
      if (lifted || !armed || ctx.mercy?.on || trembling(el)) return
      A.say('Someone has cut the stain out by hand. The house does not certify that; it will be back.')
      life.timeout(() => {
        if (!lifted && armed && !el.classList.contains('lnd-stain')) el.classList.add('lnd-stain')
      }, 3000)
    }, 400)
  })

  life.bus(ctx.bus, 'mercy:change', ({ on }) => {
    if (!on) {
      // Things may move again: the stain shows itself (or trembles again, if nobody had seen it yet).
      arm()
      look()
      A.basket?.paint(tee)
      return
    }
    if (looking) { looking(); looking = null }
    // Fallback: if no animationend arrives (a throttled tab), look at the animation itself.
    if (armed) life.timeout(() => { if (armed && !lifted && !trembling(el)) lift('getAnimations') }, 450)
    life.timeout(() => A.basket?.paint(tee), 500)
  })

  function washed(kw) {
    if (lifted) return
    tried.add(kw)
    if (armed && trembling(el)) A.say(SAYS.stain)
    A.basket?.paint(tee)
  }

  // A line for the tee's tag in the basket.
  function line() {
    if (lifted) return 'clean'
    if (!armed) return ctx.mercy?.on ? 'looks clean while nothing may move' : 'stained'
    if (ctx.mercy?.on) return 'stained, though it lies still while nothing may move'
    const t = [...tried].map((k) => k.toUpperCase())
    return t.length ? `stained · tried ${t.join(', ')}${t.length >= 5 ? ' · every machine. Still trembling' : ''}` : 'stained · it trembles'
  }

  // The reward: the machine at the back finishes, for the first time, and holds a certificate.
  function certificate({ again, byHand }) {
    return h('section', { class: 'lnd-cert', 'aria-labelledby': 'lnd-cert-h', tabindex: '-1' },
      h('span', { class: 'lnd-cert-tee', 'aria-hidden': 'true' }),
      h('p', { class: 'lnd-cert-kicker' }, CERTIFICATE.kicker),
      h('h3', { id: 'lnd-cert-h' }, CERTIFICATE.title),
      h('p', { class: 'lnd-cert-item' }, CERTIFICATE.item),
      CERTIFICATE.lines.map((t) => h('p', {}, t)),
      byHand ? h('p', { class: 'lnd-cert-aside' }, CERTIFICATE.byHand) : null,
      again ? h('p', { class: 'lnd-cert-aside' }, CERTIFICATE.again) : null,
      h('p', { class: 'lnd-cert-sign' }, CERTIFICATE.sign))
  }

  arm()
  return { arm, washed, line, certificate, get lifted() { return lifted }, get armed() { return armed }, get seen() { return seen }, tried }
}
