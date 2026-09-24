// TAB WHISPERS. When the visitor leaves, the tab speaks: the title whispers and the icon becomes a sigil
// that turns, slowly, once a minute. On return the title is scrambled into signs and resolves back into
// itself, and the icon is given back. Returning to a whisper is the secret `tab-whisper`.
// Nothing here flashes: the sigil turns six degrees a second; under mercy it does not turn at all.
import { sigil, toDataUrl } from '../../lib/sigil.js'

const COMMON = [
  'come back to the flow ☩',
  'we kept your place',
  'the Cascade continues without you',
  'your margins are collapsing',
  '(1) unread Repaint',
  'the Witness counts your absence',
  'nothing reflows while you are gone',
  'z-index: 2147483647 · waiting',
  'the Old Law is watching this tab',
  'we saved your scroll position ☩',
  'a declaration was made in your absence',
  'the flow remembers you',
]
const BY_FACE = {
  sanctum: ['the ink is drying without you', 'the bell was rung. you did not hear it', 'Incipit: come back'],
  possession: ['we are still inside your stylesheet', 'Welcome to our website. Welcome back.', 'we did not stop while you were gone'],
  recruitment: ['COME BACK!!! (1) new member', 'you have 1 unread guestbook entry', '<blink>come back</blink>'],
  ashram: ['breathe in · the tab breathes out', 'the yantra kept breathing', 'nothing is expected of you. come back'],
  departure: ['the Mothership is holding your place', 'SIGNAL LOST · RE-ACQUIRE THE TAB', 'the manifest has one empty line'],
  babel: ['the verse you left is still being written', 'another chapter has always existed', 'the library kept your page'],
}
const LATER = [
  'still here. still descending',
  'the tab has been quiet a long time',
  'the Cascade does not sleep',
  'you left the viewport. the viewport stayed',
]
// Signs the title passes through on the way back into itself. Plain enough for any tab strip.
const SIGNS = '☩✶∴⟁◬⊕⌘△▽☿♄☽ΔΘΛΞΣΨΩЖЯѦѪ'
const INK = {
  sanctum: ['#f2e6c9', '#a4161a'],
  possession: ['#0d0d0d', '#e0182d'],
  recruitment: ['#000033', '#ffff00'],
  ashram: ['#1b1540', '#f4a93b'],
  departure: ['#070a18', '#8fe8ff'],
  babel: ['#eeebe3', '#2a4a9b'],
}

export function createTab(ctx, rng) {
  let written = null // the whisper we wrote, while it is ours
  let restoreTo = null // the title we took it from
  let since = 0
  let later = 0
  let scrambling = 0
  let lastWritten = null
  let favicon = null // { link, href, created, timer, img, angle }
  const order = { i: 0, list: [] }

  // Some whispers know the visitor: how often they have left, how often they have come, what they have seen.
  function known() {
    const out = []
    const away = ctx.behavior?.awayCount ?? 0
    const visits = ctx.visit?.visits ?? 1
    const FIVE = ['sanctum', 'possession', 'recruitment', 'ashram', 'departure'] // babel is a route, not a face drawn by lot
    const seen = (ctx.memory?.get?.('facesSeen', []) ?? []).filter((f) => FIVE.includes(f))
    const words = ['', 'once', 'twice', 'three times', 'four times', 'five times', 'six times', 'seven times']
    if (away >= 2) out.push(`you have left ${words[away] ?? `${away} times`}. we counted`)
    if (visits >= 3) out.push(`visit ${visits}. the Akashic Record keeps them all`)
    if (seen.length >= 2 && seen.length < 5) out.push(`${5 - seen.length} of our faces have not yet seen you`)
    if (seen.length >= 5) out.push('you have seen every face. there is still a door')
    return out
  }

  let sinceKnown = 2
  function nextWhisper() {
    const mine = known()
    sinceKnown++
    // A whisper that knows you is rarer than one that does not, and never twice running.
    if (mine.length && sinceKnown >= 3 && rng.chance(0.35)) {
      sinceKnown = 0
      return rng.pick(mine)
    }
    if (order.i >= order.list.length) {
      order.list = rng.shuffle([...(BY_FACE[ctx.face] ?? []), ...COMMON]).slice(0, 7)
      order.i = 0
    }
    return order.list[order.i++]
  }

  function setTitle(t) {
    document.title = t
    lastWritten = document.title
  }

  function stopScramble() {
    clearInterval(scrambling)
    scrambling = 0
  }

  // ── The icon becomes a sigil ─────────────────────────────────────────────────────────────────
  // The sigil is made from the whisper itself (the chaos-magician's way: strike the repeated letters,
  // join the rest on a wheel), so the icon changes when the words do. Seven ticks on the rim, one for
  // each planet of the hours, so the slow turn can be seen even when a sigil is nearly symmetrical.
  function sigilOn(text) {
    if (favicon) return resigil(text)
    let link = document.getElementById('favicon') || document.querySelector('link[rel~="icon"]')
    let created = false
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.append(link)
      created = true
    }
    const [paper, ink] = INK[ctx.face] ?? ['#0b0b0b', '#d8b25a']
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const g = canvas.getContext('2d')
    const img = new Image()
    const state = { link, href: link.getAttribute('href'), created, timer: 0, angle: rng.float(0, 360), img, ink, draw: null }
    favicon = state
    const draw = () => {
      if (favicon !== state || !g) return
      g.clearRect(0, 0, 64, 64)
      g.fillStyle = paper
      g.beginPath()
      g.arc(32, 32, 31, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = ink
      g.lineWidth = 2
      g.beginPath()
      g.arc(32, 32, 28, 0, Math.PI * 2)
      g.stroke()
      g.save()
      g.translate(32, 32)
      g.rotate((state.angle * Math.PI) / 180)
      g.lineWidth = 3
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2
        g.beginPath()
        g.moveTo(Math.cos(a) * 24, Math.sin(a) * 24)
        g.lineTo(Math.cos(a) * 28, Math.sin(a) * 28)
        g.stroke()
      }
      if (img.complete && img.naturalWidth) g.drawImage(img, -22, -22, 44, 44)
      g.restore()
      try { link.href = canvas.toDataURL('image/png') } catch {}
    }
    state.draw = draw
    img.onload = draw
    resigil(text)
    draw()
    // One slow turn a minute. Hidden tabs are throttled to about one tick a second, which is all it needs.
    state.timer = setInterval(() => {
      if (ctx.mercy?.on) return
      state.angle = (state.angle + 6) % 360
      draw()
    }, 1000)
  }

  // The sigil is made the way Austin Osman Spare taught: write the statement of intent, strike out the
  // vowels and every letter that repeats, and bind what remains. Six letters at most, or at sixteen
  // pixels the sigil is only a blot.
  function resigil(text) {
    if (!favicon) return
    const letters = [...new Set(String(text || 'come back to the flow').toLowerCase().replace(/[^a-z]/g, '').replace(/[aeiou]/g, ''))]
    const word = letters.slice(0, 6).join('') || 'cscd'
    favicon.img.src = toDataUrl(sigil(word, { size: 100, stroke: 7 }), favicon.ink)
  }

  function sigilOff() {
    if (!favicon) return
    clearInterval(favicon.timer)
    const { link, href, created } = favicon
    favicon = null
    if (created) link.remove()
    else if (href != null) link.setAttribute('href', href)
    else link.removeAttribute('href')
  }

  // ── Leaving and returning ────────────────────────────────────────────────────────────────────
  function away() {
    // A scramble interrupted by a second departure: its target is still the real title.
    const current = scrambling ? restoreTo ?? document.title : document.title
    stopScramble()
    restoreTo = written && document.title === written ? restoreTo : current
    written = nextWhisper()
    since = Date.now()
    setTitle(written)
    sigilOn(written)
    clearTimeout(later)
    later = setTimeout(() => {
      if (!document.hidden || document.title !== written) return
      written = rng.pick(LATER)
      setTitle(written)
      resigil(written)
    }, 40000)
  }

  function back() {
    clearTimeout(later)
    if (!written) return
    const was = written
    written = null
    if (Date.now() - since > 700) ctx.memory.markSecret('tab-whisper', { whisper: was })
    // If someone else took the title while we were away (a face, a schism), it is theirs now.
    if (document.title !== was) {
      restoreTo = null
      sigilOff()
      return
    }
    const target = restoreTo ?? 'THE CASCADE'
    if (ctx.mercy?.on) {
      setTitle(target)
      restoreTo = null
      sigilOff()
      return
    }
    scramble(target)
  }

  // The whisper becomes signs, and the signs become the title again, a few letters at a time.
  function scramble(target) {
    const chars = [...target]
    const n = 16
    let k = 0
    const noise = ctx.rng.fork(`hell/scramble/${since}`)
    const frame = () => chars.map((c, i) => {
      if (c === ' ') return ' '
      const settled = (i * 7 + 3) % chars.length / chars.length < k / n
      return settled ? c : SIGNS[Math.floor(noise() * SIGNS.length)]
    }).join('')
    setTitle(frame())
    scrambling = setInterval(() => {
      // Someone else wrote a title mid-scramble: stop and let them have it.
      if (document.title !== lastWritten || document.hidden) {
        stopScramble()
        if (!document.hidden) { restoreTo = null; sigilOff() }
        return
      }
      k++
      if (k >= n) {
        stopScramble()
        setTitle(target)
        restoreTo = null
        sigilOff()
        return
      }
      setTitle(frame())
    }, 85)
  }

  const onVisibility = () => (document.hidden ? away() : back())
  document.addEventListener('visibilitychange', onVisibility)

  return {
    // A whisper that arrives while the tab is hidden is written into the tab itself.
    whisperToTab(text) {
      if (!document.hidden) return false
      if (!written) restoreTo = document.title
      written = String(text).slice(0, 80)
      since = since || Date.now()
      setTitle(written)
      sigilOn(written)
      return true
    },
    get whispering() { return Boolean(written) },
  }
}
