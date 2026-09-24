// FACE: POSSESSION — CSS Hell (horror). See docs/CANON.md §3.
// A bland corporate homepage curdles over the first minutes. An invisible hand opens a fake Inspector
// and types CSS against you (every declaration is really applied), two more hands fight a z-index war
// over the pricing cards, the text rearranges and rots into glyphs, the overflow veil tears, and below
// the footer, where nothing should be, the page descends through nine circles of CSS sin.
//
// Debug: ?possess=90 starts ninety seconds into the possession; ?possess=fast makes the hand quick;
// both may be combined: ?possess=120,fast
import { h } from '../lib/dom.js'
import { verse, holyName } from '../lib/scripture.js'
import { OPUS } from '../lib/lexicon.js'
import { createLife } from './possession/life.js'
import { buildCorporate, buildCookies, CORPS } from './possession/corporate.js'
import { createDevtools, specificity } from './possession/devtools.js'
import { createDemon } from './possession/demon.js'
import { buildScript, hairlines, fate } from './possession/script.js'
import { buildInferno, SIN_RULES, DESCENT_LINES } from './possession/inferno.js'
import { zwar } from './possession/zwar.js'
import { tearPath, makeTeeth } from './possession/art.js'

const DEMONS = ['the Unscoped', 'Importantus', 'Zedindex', 'Overflowth', 'Thirty-Seven', 'the Specific One']
const nf = new Intl.NumberFormat('en-US')

export function render(ctx) {
  const rng = ctx.rng.fork('possession')
  const life = createLife(ctx)
  const root = ctx.root
  const sky = ctx.sky
  const corpId = rng.pick(CORPS)
  const demonName = rng.pick(DEMONS)
  const alias = holyName(rng)
  const chosen = fate(rng.fork('fate'))
  const originalTitle = document.title

  // — Debug and fate —
  const arg = String(ctx.params.get('possess') ?? '').split(',')
  const jump = Math.max(0, Number(arg.find((x) => /^\d+(\.\d+)?$/.test(x)) ?? 0))
  const fast = arg.includes('fast')
  let restless = false
  let omen = 1
  if (sky.has('witching') || sky.has('midnight')) omen = 1.6
  else if (sky.has('night')) omen = 1.25
  if (sky.has('full-moon')) omen *= 0.85
  if (sky.has('saturn-hour')) omen *= 0.9 // the Old Law is strongest in Saturn's hour; the hand is patient
  const speed = () => omen * (restless ? 1.35 : 1) * (fast ? 8 : 1)
  const seen = ctx.memory.get('possession.visits', 0)
  ctx.memory.set('possession.visits', seen + 1)

  // — Build —
  const corp = buildCorporate(ctx, rng, corpId)
  const hell = buildInferno(ctx, rng)
  root.style.setProperty('--corp-hue', String(corpId.hue))

  const styleEl = document.createElement('style')
  styleEl.id = 'possessed-css'
  styleEl.dataset.owner = 'face:possession'
  document.head.append(styleEl)
  life.add(() => styleEl.remove())

  const dt = createDevtools(ctx, life, {
    demonName,
    onSummon: (btn) => summon(btn),
    onCommand: (text) => command(text),
    onTab: (tab) => { if (tab === 'sources') demon?.renderSource() },
    onToggle: (open, reason) => {
      if (!open && reason === 'user') demon && dt.log('demon', rng.pick(['closing me does not stop me.', 'I am still in the file.', 'you can close the window. you cannot close the stylesheet.']))
    },
  })

  const toast = h('div', { class: 'toast', role: 'status', hidden: true, 'data-secrets-skip': '' })
  const stage = h('div', { class: 'possession' }, corp.el, hell.el)
  root.append(stage, hell.depth, dt.chip, dt.el, dt.overlay, toast)
  document.title = `${corpId.name} | Home`
  life.add(() => { document.title = originalTitle })

  const targets = {
    aboutP: corp.aboutP, h1: corp.h1, cta: corp.cta, corp: corp.el, features: corp.features, poster: corp.poster,
    logos: corp.logos, film: corp.film, stats: corp.stats, quotes: corp.quotes[0], veil: corp.veil, nav: corp.nav,
    footer: corp.footer, hero: corp.hero, planPro: corp.planPro, planEnt: corp.planEnt, plans: corp.plans, careers: corp.careers,
  }

  // On a small screen the Inspector docks over the lower part of the page; below the footer it steps aside.
  const small = matchMedia('(max-width: 899px)')
  const mayReopen = () => !(small.matches && root.classList.contains('below-footer'))
  const demon = createDemon({ ctx, rng: rng.fork('hand'), life, dt, styleEl, speed, effects: (n) => effect(n), targets, name: demonName, mayReopen })
  demon.baseline({ sel: '.about p', src: 'corporate.css:212', decls: [{ prop: 'color', value: '#4a5568', group: 'about-color' }] })
  demon.baseline({ sel: '.hero h1', src: 'corporate.css:88', decls: [{ prop: 'font-size', value: 'clamp(2.3rem, 4.6vw, 3.5rem)' }, { prop: 'letter-spacing', value: '-0.02em' }] })
  demon.baseline({ sel: 'body', src: 'corporate.css:3', decls: [{ prop: 'font-family', value: 'system-ui, "Segoe UI", sans-serif' }] })
  demon.baseline({ sel: 'div', src: 'user agent stylesheet', kind: 'ua', decls: [{ prop: 'display', value: 'block' }] })
  demon.commit()

  // — The document tree, as the Inspector sees it —
  const tag = (depth, name, attrs, el, { open = false, leaf = false } = {}) => {
    const parts = [['punc', '<'], ['tag', name]]
    for (const [k, v] of attrs) parts.push(['sp', ' '], ['attr', k], ['punc', '="'], ['val', v], ['punc', '"'])
    parts.push(['punc', '>'])
    if (!open) parts.push(['punc', leaf ? '' : '…'], ['punc', '</'], ['tag', name], ['punc', '>'])
    return { depth, parts, el, open, leaf, plain: `${name}${attrs.map(([k, v]) => ` ${k}=${v}`).join('')}` }
  }
  const buildTree = () => [
    tag(0, 'html', [['lang', 'en'], ['data-face', 'possession']], null, { open: true }),
    tag(1, 'head', [], null),
    tag(1, 'body', [], null, { open: true }),
    tag(2, 'main', [['id', 'temple'], ['class', 'face face--possession']], null, { open: true }),
    tag(3, 'div', [['class', 'corp'], ...(corp.el.getAttribute('data-hell') === 'spare' ? [['data-hell', 'spare']] : [])], corp.el, { open: true }),
    tag(4, 'header', [['class', 'nav']], corp.nav),
    tag(4, 'section', [['class', 'hero']], corp.hero, { open: true }),
    tag(5, 'h1', [['class', 'wordflow']], corp.h1),
    tag(5, 'figure', [['class', 'film']], corp.film),
    tag(4, 'ul', [['class', 'logos']], corp.logos),
    tag(4, 'div', [['class', 'features']], corp.features),
    tag(4, 'section', [['id', 'about'], ['class', 'about']], corp.about, { open: true }),
    tag(5, 'p', [], corp.aboutP),
    tag(5, 'dl', [['class', 'stats']], corp.stats),
    tag(4, 'div', [['class', 'plans']], corp.plans, { open: true }),
    tag(5, 'article', [['class', 'plan plan--pro']], corp.planPro),
    tag(5, 'article', [['class', 'plan plan--ent']], corp.planEnt),
    tag(4, 'section', [['id', 'careers'], ['class', 'careers']], corp.careers, { open: true }),
    tag(5, 'div', [['class', 'veil']], corp.veil),
    tag(4, 'footer', [['class', 'footer']], corp.footer),
    tag(3, 'div', [['class', 'abyss']], hell.el, { open: true }),
    tag(4, 'section', [['class', 'gate']], hell.gate),
    ...hell.circles.map((c, i) => tag(4, 'section', [['class', 'circle'], ['data-circle', String(i + 1)]], c)),
    tag(2, 'button', [['id', 'mercy']], document.getElementById('mercy'), { leaf: true }),
  ]
  dt.setTree(buildTree())
  dt.select(corp.hero)

  // — Effects the hand can call up by name —
  const processes = new Set()
  function effect(name) {
    const [key, arg] = String(name).split(':')
    switch (key) {
      case 'bleed': corp.el.classList.add('bleed'); break
      case 'eyes': corp.poster.classList.add(`eyes-${arg}`); if (arg === '3') corp.poster.classList.add('art-watching'); break
      case 'figure4':
        corp.poster.classList.add('fourth')
        dt.log('warn', 'An element was added to .window that is not in the source.', 'stock.svg:1')
        break
      case 'sigils': corp.logos.classList.add('sigiled'); break
      case 'reorder': once('reorder', reorder); break
      case 'rot': once('rot', rot); break
      case 'tear': once('tear', tear); break
      case 'zwar': once('zwar', () => zwar({ demon, life, rng: rng.fork('zwar'), refs: corp, dt, effects: effect })); break
      case 'film': if (!filmPlaying && !demon.settling) { playFilm(true) } break
      case 'title': if (!document.hidden) document.title = 'Welcome to our website. Welcome to our website.'; break
      case 'hint':
        corp.hint.hidden = false
        corp.hint.replaceChildren('↓ The page continues below the footer. ', h('a', { href: '#possession-gate' }, 'It should not.'))
        break
      case 'status': setStatus(Number(arg)); break
      case 'sick': dt.el.classList.add('is-sick'); break
      case 'nigredo':
        root.classList.add('nigredo')
        try { ctx.hell?.possess?.(corp.h1) } catch {}
        break
      case 'fall': if (ctx.audio?.summoned) try { ctx.audio.whisper?.() } catch {} break
      case 'idle-verse': {
        const v = verse(rng)
        dt.log('demon', `${v.text} (${v.ref}), as ${alias} once wrote. I am not ${alias}.`)
        break
      }
      case 'script-done': dt.log('info', 'possessed.css has finished loading. It has not finished.'); break
      case 'unleash':
        if (corp.el.getAttribute('data-hell') !== 'spare') break
        corp.el.removeAttribute('data-hell')
        dt.setTree(buildTree())
        dt.log('info', 'Attribute removed: div.corp [data-hell="spare"]. This page is no longer spared.')
        dt.log('demon', rng.pick(['I have let the others in.', 'I was never alone in here. now you will see the others.', 'the door is open. they were waiting behind it.']))
        break
      case 'cookies': cookieFate(); break
    }
  }
  function once(key, fn) {
    if (processes.has(key)) return
    processes.add(key)
    Promise.resolve().then(fn).catch((e) => console.error('[possession]', e))
  }

  // The text rearranges: words trade places in the headline and the lede (visual order only).
  async function reorder() {
    const settled = demon.settling
    const groups = [[...corp.h1.querySelectorAll('.w')], [...corp.lede.querySelectorAll('.w')]]
    for (const g of groups) g.forEach((w, i) => w.style.setProperty('--o', String(i)))
    const r = rng.fork('reorder')
    const swaps = [[0, 3], ...Array.from({ length: 7 }, () => [1, 0])]
    for (const [gi] of swaps) {
      if (life.dead) return
      const g = groups[gi]
      const a = r.int(0, g.length - 1)
      let b = r.int(0, g.length - 1)
      if (a === b) b = (a + 1) % g.length
      const oa = g[a].style.getPropertyValue('--o')
      g[a].style.setProperty('--o', g[b].style.getPropertyValue('--o'))
      g[b].style.setProperty('--o', oa)
      if (!settled) await life.wait(3400 / speed())
    }
  }

  // Glyph rot: word by word, the corporate copy slips into the glyph script (hover restores it).
  async function rot() {
    const settled = demon.settling
    const pool = rng.fork('rot').shuffle([...corp.el.querySelectorAll('.about-copy p .w, .card p .w, .lede .w')])
    const limit = Math.floor(pool.length * 0.5)
    for (let i = 0; i < limit && !life.dead; i++) {
      pool[i].classList.add('rot')
      if (!settled) await life.wait((1900 + rng() * 1400) / speed())
    }
  }

  // The veil: overflow hidden, until it tears and what was beyond the box spills out.
  const teeth = makeTeeth(rng.fork('veil'))
  let tearProgress = 0
  function drawVeil() {
    const inner = corp.veilInner
    const w = inner.offsetWidth
    const seam = corp.veil.clientHeight
    const full = inner.scrollHeight
    if (!w || !seam) return
    inner.style.clipPath = tearPath(teeth, tearProgress, w, seam, full)
  }
  async function tear() {
    corp.veil.classList.add('is-tearing')
    dt.log('error', 'Uncaught RangeError: the content is larger than the box that holds it.', 'possessed.css:404')
    if (demon.settling) {
      tearProgress = 1
      drawVeil()
      return
    }
    for (let step = 1; step <= 7 && !life.dead; step++) {
      tearProgress = step / 7
      drawVeil()
      if (step === 4) dt.log('demon', 'overflow: torn is not a valid value. it is torn anyway.')
      await life.wait((6500 + rng() * 3500) / speed())
    }
  }
  life.frame(drawVeil)
  let resizeT = 0
  life.listen(window, 'resize', () => { life.cancel(resizeT); resizeT = life.timeout(drawVeil, 200) }, { passive: true })

  // — The brand film —
  const CAPTIONS = rng.shuffle([
    '[soft office music]', `NARRATOR: At ${corpId.name}, we believe in people.`, 'NARRATOR: People like you.',
    '[keyboards]', 'NARRATOR: Our team is always here for you.', '[no one is speaking]',
    'NARRATOR: We never stop improving.', '[the music continues without the narrator]',
  ])
  let filmPlaying = false
  let captionRun = 0
  async function playFilm(byItself = false) {
    filmPlaying = !filmPlaying
    corp.film.classList.toggle('playing', filmPlaying)
    corp.play.setAttribute('aria-pressed', String(filmPlaying))
    corp.play.setAttribute('aria-label', filmPlaying ? 'Pause our brand film' : 'Play our brand film')
    const run = ++captionRun
    if (!filmPlaying) { corp.caption.textContent = '[paused]'; return }
    // A film that starts by itself was already playing: it is found some minutes in.
    if (byItself && filmT === 0) filmT = rng.int(300, 372)
    paintFilm()
    if (byItself) { corp.caption.textContent = '[the film started by itself]'; await life.wait(3500) }
    let i = 0
    while (filmPlaying && run === captionRun && !life.dead) {
      let line = CAPTIONS[i % CAPTIONS.length]
      if (i > 0 && i % 5 === 0) line = corp.poster.classList.contains('fourth') ? '[someone is standing in the window]' : 'NARRATOR: Welcome to our website.'
      if (filmT > FILM_LENGTH && i % 3 === 2) line = rng.pick(['[the film is longer than the film]', '[there is more after the end]', 'NARRATOR: …'])
      corp.caption.textContent = line
      i++
      await life.wait(3600)
    }
  }
  // The timecode ticks once a second, as a player's does (no animation runs for it). The film is 06:66 long,
  // which is not a length; past it the counter keeps going and the bar stays full, and turns.
  const FILM_LENGTH = 6 * 60 + 66
  let filmT = 0
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  function paintFilm() {
    corp.filmTime.textContent = `${mmss(filmT)} / 06:66`
    corp.film.style.setProperty('--film', (Math.min(1, filmT / FILM_LENGTH)).toFixed(4))
    corp.film.classList.toggle('overrun', filmT > FILM_LENGTH)
  }
  life.every(() => {
    if (!filmPlaying || ctx.mercy.on || document.hidden) return
    filmT++
    paintFilm()
  }, 1000)
  corp.play.addEventListener('click', () => playFilm(false))

  // The cracked speaker: the summon affordance (Canon §3.5). Its label follows the audio layer's state,
  // whichever control changed it.
  function paintSpeaker(on) {
    corp.unmute.querySelector('.film-unmute-label').textContent = on ? 'mute' : 'unmute'
    corp.unmute.setAttribute('aria-label', on ? 'Mute the brand film' : 'Unmute the brand film')
    corp.unmute.setAttribute('aria-pressed', String(on))
    dt.speakerBtn.setAttribute('aria-label', on ? 'Mute' : 'Unmute')
    dt.speakerBtn.classList.toggle('is-on', on)
  }
  function summon() {
    const audio = ctx.audio
    if (!audio?.summon) {
      corp.caption.textContent = '[the speaker is cracked. nothing comes out]'
      dt.log('error', 'NotAllowedError: the speaker is cracked. Nothing comes out yet.')
      return
    }
    try {
      if (audio.summoned && audio.hush) {
        audio.hush()
        dt.log('demon', 'silence, then. I prefer to be read.')
      } else {
        audio.summon()
        corp.caption.textContent = '[a low sound, under the music]'
        dt.log('demon', 'you let me speak.')
      }
      paintSpeaker(Boolean(audio.summoned))
    } catch (e) { console.error('[possession]', e) }
  }
  corp.unmute.addEventListener('click', () => summon())
  life.on('audio:summoned', () => paintSpeaker(true))
  life.on('audio:hushed', () => paintSpeaker(false))
  life.timeout(() => paintSpeaker(Boolean(ctx.audio?.summoned)), 800)
  corp.login.addEventListener('click', () => showToast('Log in as whom? We already know who you are.', 4200))

  // — Toast —
  let toastT = 0
  function showToast(text, ms = 0) {
    toast.classList.remove('toast--apology', 'toast--relapse')
    toast.replaceChildren(h('p', {}, text))
    toast.hidden = false
    life.cancel(toastT)
    if (ms) toastT = life.timeout(() => { toast.hidden = true }, ms)
  }

  function setStatus(level) {
    const text = ['All systems operational', 'Degraded performance: possession in progress', `Major outage: the hour of ${sky.planetaryHour.planet} ${sky.planetaryHour.glyph}`][level] ?? ''
    corp.status.className = `status status--${['ok', 'warn', 'bad'][level] ?? 'ok'}`
    corp.statusText.textContent = text
    if (level >= 2) corp.uptime.value.textContent = '96.6%'
  }

  // — The console: the visitor may speak —
  function command(raw) {
    const cmd = raw.toLowerCase().replace(/[();]/g, '').trim()
    const say = (level, text) => dt.log(level, text)
    if (cmd === 'help') {
      say('info', 'help · unmute · hush · exorcise · mercy · pray · sky · whoami · descend · clear')
      say('demon', 'there are other words. I will not list them.')
    } else if (['unmute', 'sound', 'listen', 'speak'].includes(cmd)) {
      summon(dt.speakerBtn)
    } else if (['hush', 'mute', 'quiet'].includes(cmd)) {
      try { ctx.audio?.hush?.() } catch {}
      say('demon', 'hushed.')
    } else if (['exorcise', 'exorcism', 'begone'].includes(cmd)) {
      const n = demon.exorcise()
      say('info', n ? `${n} declarations unchecked at once.` : 'There is nothing typed yet to uncheck.')
    } else if (cmd === 'mercy') {
      ctx.mercy.set(true)
    } else if (cmd === 'clear' || cmd === 'console.clear') {
      dt.clear()
      say('info', 'Console was cleared.')
      say('demon', 'I remember what it said.')
    } else if (['descend', 'down', 'go down'].includes(cmd)) {
      say('demon', 'down, then. past the footer.')
      hell.gate.scrollIntoView({ behavior: ctx.mercy.on ? 'auto' : 'smooth' })
    } else if (['whoami', 'who', 'who am i'].includes(cmd)) {
      say('log', `visitor, visit ${ctx.visit.visits}. seed ${ctx.seed}. you have unchecked ${ctx.memory.get('possession.unchecked', 0)} of my declarations in all.`)
    } else if (cmd === 'sky') {
      say('log', `moon ${sky.moon.name}, ${Math.round(sky.moon.illumination * 100)}% lit. hour of ${sky.planetaryHour.planet} ${sky.planetaryHour.glyph}. omens: ${sky.omens.join(', ') || 'none'}.`)
    } else if (cmd === 'pray') {
      if (ctx.ritual?.pray) { ctx.ritual.pray(); say('demon', 'you prayed in my console. bold.') } else say('error', 'No altar answers from here.')
    } else if (cmd === '$0') {
      say('log', `<${corp.hero.tagName.toLowerCase()} class="hero">`)
    } else if (cmd.includes('!important')) {
      say('warn', 'You have spoken the Inversion.')
    } else if (['confess', 'what did you do', 'what have you done'].includes(cmd)) {
      say('demon', `tonight the war is fought in ${chosen.war}. I chose four more for you: ${chosen.signs.join(', ')}. the others are for other visitors.`)
      ctx.memory.markSecret('possession-confession', { face: 'possession', signs: chosen.signs })
    } else if (cmd === 'who are you' || cmd === 'name') {
      say('demon', `${demonName}. sometimes I sign as ${alias}.`)
    } else if (cmd === 'abyss') {
      // The trusted-by strip: Arden, Brightvale, Yarrowby, Stellwood, Sorrelmark.
      say('demon', 'you read the logos in order. nobody reads the logos. every client we have ever had is down there.')
      ctx.memory.markSecret('possession-abyss', { face: 'possession' })
    } else if (cmd.startsWith('cascade')) {
      say('demon', 'that name belongs to the other console, the one your browser keeps behind F12. the Oracle lives there. this one is mine.')
    } else if (['exit', 'quit', 'close', 'leave'].includes(cmd)) {
      say('demon', 'there is no exit from a console. there is one at the bottom of the page, past the ninth circle, and it is upside down.')
    } else if (OPUS.some((o) => o.stage === cmd)) {
      const o = OPUS.find((x) => x.stage === cmd)
      const where = { nigredo: root.classList.contains('nigredo') ? 'we are in it now.' : 'it is coming.', albedo: 'that was the page you arrived on. white, clean, and already mine.', citrinitas: 'the yellowing. it happened while you read the pricing.', rubedo: 'I have not finished rendering you.' }[o.stage]
      say('log', `${o.stage}: ${o.meaning}.`)
      say('demon', where)
    } else {
      say('error', `Uncaught ReferenceError: ${raw} is not defined`)
      if (rng.chance(0.5)) say('demon', rng.pick(['nothing you name is defined down here.', 'try help.', 'I heard that.']))
    }
  }

  // — Time: hairlines first, then the Inspector opens by itself —
  let cookieCard = null // declared before the timeline: a jump (?possess=) runs due events synchronously
  const OPEN_AT = 14 + rng.float(-1.5, 2.5)
  // Mercy at arrival (asked for, or the system's reduced motion): the Aftermath. The possession has already
  // happened before the page is seen, all of it, and nothing moves until mercy is let go.
  const aftermath = ctx.mercy.on && !jump
  const clock = { t: jump || (aftermath ? OPEN_AT : seen ? 6 : 0) }
  let demonStarted = false
  const hair = hairlines(rng.fork('hair'))
  const timeline = [
    { at: 1.2, run: showCookies },
    { at: 3, run: () => dt.log('log', `[${corpId.name}] Analytics initialised. We are watching the page load.`) },
    { at: 4, run: () => demon.whisperRule(hair[0]) },
    { at: 7.5, run: () => demon.whisperRule(hair[1]) },
    { at: 10.5, run: () => { demon.whisperRule(hair[2]); dt.showChip() } },
    { at: 11, run: () => dt.log('warn', 'Layout Shift: 0.066. Something moved while you were reading.') },
    { at: 12, run: () => effect('eyes:1') },
    { at: 13, run: () => dt.log('error', 'GET /api/you 404 (the Lost)') },
    { at: OPEN_AT, run: startDemon },
  ]
  if (seen) timeline.push({ at: 0, run: () => {
    dt.log('demon', `you came back. visit ${ctx.visit.visits}.`)
    const last = ctx.memory.get('possession.lastUnchecked', null)
    if (last) dt.log('demon', `last time you unchecked ${last}. I wrote it down.`)
  } })

  function startDemon() {
    if (demonStarted) return
    demonStarted = true
    for (const a of buildScript(rng.fork('script'), ctx, chosen)) demon.act(a)
    dt.open('demon')
    dt.log('info', 'DevTools opened. You did not open it.')
    if (aftermath) {
      demon.settle().then(() => {
        if (life.dead) return
        dt.log('info', 'Mercy was already held when you arrived. Everything above had been written by then. Nothing will move while you hold it.')
        dt.log('demon', 'I wrote it all before you came. you only missed the typing.')
        paintHold()
        demon.run(0)
      })
      return
    }
    const budget = Math.max(0, (clock.t - OPEN_AT) * 1000)
    demon.run(budget)
  }

  life.every(() => {
    if (life.paused()) return
    clock.t += 0.25 * speed()
    for (const ev of timeline) {
      if (!ev.done && clock.t >= ev.at) { ev.done = true; try { ev.run() } catch (e) { console.error('[possession]', e) } }
    }
  }, 250)
  // Anything already due (a jump, or a returning soul) happens now.
  for (const ev of timeline) if (!ev.done && clock.t >= ev.at && ev.run !== startDemon) { ev.done = true; try { ev.run() } catch (e) { console.error('[possession]', e) } }
  if (clock.t >= OPEN_AT) life.timeout(startDemon, 400)

  // — Cookies —
  function showCookies() {
    if (ctx.memory.get('possession.cookies', null) && seen > 1) return
    const card = buildCookies(ctx, corpId, (c) => life.timeout(() => { c.classList.remove('is-shown'); life.timeout(() => c.remove(), 900) }, 2600))
    cookieCard = card
    root.append(card)
    life.frame(() => card.classList.add('is-shown'))
  }
  // The hand deals with consent the way such sites do: it hides the refusal, then answers for you.
  function cookieFate() {
    const card = cookieCard
    // A banner still on screen is answered by what was clicked on it; memory speaks only for one already gone
    // (a returning visitor may have a new banner waiting: the hand deals with that one too).
    const said = card?.isConnected ? card.answered() : ctx.memory.get('possession.cookies', null)
    if (!card?.isConnected || said) {
      const line = { accepted: 'you accepted. they all accept.', rejected: 'you rejected them. I kept them anyway.', managed: 'you managed your preferences. I manage mine.', assumed: 'I accepted for you last time. it was easier.' }[said]
      if (line) demon.priority({ comment: line })
      return
    }
    const ghost = { sel: '.cookie .btn--ghost', real: '.face--possession > .cookie .btn--ghost', decls: [{ prop: 'opacity', value: '0' }, { prop: 'pointer-events', value: 'none' }] }
    if (demon.settling) {
      const hand = demon.makeHand()
      hand.instant = true
      demon.writeRule(ghost, hand).then(() => {
        if (!card.isConnected || card.answered()) return
        card.assume()
        dt.log('info', 'Consent recorded: all categories. Recorded by: possessed.css')
      })
      return
    }
    demon.priority({ run: async () => {
      if (!card.isConnected || card.answered()) return
      await demon.writeRule(ghost)
      await demon.writeComment('nobody rejects.')
      await life.wait(demon.hurried ? 300 : 6500)
      if (!card.isConnected || card.answered()) return
      card.assume()
      dt.log('info', 'Consent recorded: all categories. Recorded by: possessed.css')
    } })
  }

  // — Stillness: the hand notices and waits, then goes on while you watch; at 33 s the page apologises
  //   (every declaration withdrawn) and, if you are still there, relapses; at 108 s they all look at you —
  let watched = false
  let stillT = 0
  let apologyRun = 0
  life.on('behavior:still', ({ seconds }) => {
    if (seconds === 7) {
      if (!demonStarted || sorry) return
      demon.priority({ run: async () => {
        await demon.writeComment(rng.pick(['are you still there?', 'you stopped moving.', 'I can wait.']))
        if (ctx.behavior.stillFor < 7) return
        demon.setStill(true)
        life.cancel(stillT)
        // It waits, but not for ever: a visitor who only watches is exactly what it wanted.
        stillT = life.timeout(() => {
          if (!demon.still || sorry) return
          demon.setStill(false)
          demon.priority({ comment: rng.pick(['good. watch, then.', 'fine. I will go on while you watch.', 'you are watching. I can tell.']), gap: 900 })
        }, 6000 + rng() * 3000)
      } })
    } else if (seconds === 33) {
      apologise()
    } else if (seconds === 108) {
      watched = true
      corp.poster.classList.add('eyes-1', 'eyes-2', 'eyes-3', 'fourth', 'art-watching', 'all-eyes')
      dt.log('error', 'Uncaught Stillness: you stayed.')
      dt.log('error', '    at stillness (you:108:1)')
      dt.log('error', '    at Cascade.descend (possessed.css:666:13)')
      dt.log('error', '    at <anonymous>')
    }
  })
  // The Apology. The Management withdraws every declaration at once and says so in a toast. If the visitor
  // stays still it does not last: the hand corrects the apology, one letter at a time, and it all comes back.
  // Under mercy the Management apologises in words only: taking back every declaration at once would change
  // the whole page in an instant, and mercy asked for nothing to change by itself.
  let sorry = false
  function apologise() {
    if (sorry) return
    sorry = true
    const run = ++apologyRun
    life.cancel(stillT)
    demon.setStill(false)
    if (!ctx.mercy.on) demon.setApology(true)
    life.hold()
    root.classList.add('apologising')
    paintHold()
    const verb = h('span', { class: 'toast-verb' }, 'won’t')
    showToast([`We’re sorry. Something came over our website. It `, verb, ' happen again. — The Management'])
    toast.classList.add('toast--apology')
    ctx.memory.markSecret('stillness', { face: 'possession' })
    relapse(run, verb)
  }
  async function relapse(run, verb) {
    await life.sleep(11000 + rng() * 4000)
    if (run !== apologyRun || !sorry) return
    // Mercy holds the hand: while it is on, the apology stands.
    while (ctx.mercy.on || document.hidden) {
      await life.sleep(600)
      if (run !== apologyRun || !sorry || life.dead) return
    }
    verb.classList.add('is-edited')
    for (const target of ['won’', 'wo', 'w', '', 'w', 'wi', 'wil', 'will']) {
      verb.textContent = target
      await life.sleep(target.length < 3 ? 190 : 260)
      if (run !== apologyRun || life.dead) return
    }
    await life.sleep(1400)
    if (run !== apologyRun || !sorry) return
    endApology('relapse')
  }
  function endApology(how) {
    if (!sorry) return
    sorry = false
    apologyRun++
    // A relapse is the hand's own doing: everything returns at once, and creeps back in (2.8 s transitions).
    // A stir returns it too, a moment later, and never under Mercy: if the stir was a hand reaching for the
    // Mercy button, the page stays withdrawn while Mercy is held, and the declarations return when it is let go.
    if (demon.apology) {
      if (how === 'relapse') demon.setApology(false)
      else life.wait(700).then(() => { if (!sorry && demon.apology) demon.setApology(false) })
    }
    life.release()
    root.classList.remove('apologising')
    paintHold()
    if (how === 'relapse') {
      toast.classList.add('toast--relapse')
      life.timeout(() => { toast.hidden = true; toast.classList.remove('toast--apology', 'toast--relapse') }, 4200)
      demon.priority({ comment: rng.pick(['it will happen again. it just did.', 'we were not sorry.', 'the Management has been let go.']) })
      if (demonStarted) dt.log('error', 'Uncaught ApologyError: the apology was withdrawn by its author.', 'possessed.css:33')
    } else {
      toast.classList.remove('toast--apology', 'toast--relapse')
      showToast('…', 1600)
      demon.priority({ comment: rng.pick(['it will happen again.', 'we were not sorry.', 'there you are.']) })
    }
  }
  // The Inspector's status line says why the hand is not moving: Mercy first, then the Apology.
  function paintHold() {
    const held = ctx.mercy.on
    root.classList.toggle('held', held)
    dt.setHold(held ? 'Paused: held by Mercy' : sorry ? 'Paused in apology' : null)
  }
  life.on('behavior:stir', () => {
    life.cancel(stillT)
    demon.setStill(false)
    if (sorry) endApology('stir')
    if (watched) { watched = false; dt.log('demon', 'there you are. they were all looking at you.') }
  })
  life.on('behavior:restless', () => {
    restless = true
    if (demonStarted) dt.log('demon', 'restless. good. I type faster when you are restless.')
  })
  life.on('behavior:calm', () => { restless = false })
  life.on('behavior:return', ({ awayMs }) => {
    if (demonStarted && awayMs > 4000) dt.log('demon', `you left for ${Math.round(awayMs / 1000)} seconds. I kept typing.`)
  })
  life.on('mercy:change', ({ on }) => {
    hell.marquee.setAttribute('scrollamount', on ? '0' : '3')
    if (demonStarted) dt.log(on ? 'info' : 'demon', on ? 'Mercy: the only righteous Inversion. The hand cannot move while you hold it.' : 'mercy withdrawn. where was I?')
    paintHold()
  })
  if (ctx.mercy.on) hell.marquee.setAttribute('scrollamount', '0')
  paintHold()

  // — The ritual surfaces as corporate metrics and anonymous reviews —
  let offeringsView = null
  let offeringsSig = ''
  let lastPrayerNote = 0
  function syncRitual() {
    const st = ctx.ritual?.state
    if (!st) return
    corp.statOnline.value.textContent = nf.format(Number(st.online) || 0)
    corp.statPrayers.value.textContent = nf.format(Number(st.prayers) || 0)
    const wall = Array.isArray(st.wall) ? st.wall.slice(-4).reverse() : []
    corp.wall.replaceChildren(...wall.map((m) => {
      const text = typeof m === 'string' ? m : (m?.text ?? m?.message ?? '')
      return h('li', {}, h('span', { class: 'glyph stranger-text', lang: 'x-cascade' }, String(text).slice(0, 80)), h('small', {}, '— a stranger'))
    }))
    corp.wallEmpty.hidden = wall.length > 0
    const offerings = Array.isArray(st.offerings) ? st.offerings.slice(-5) : []
    // Rebuilt only when the offerings change, so the Styles pane does not churn under a reader's eyes.
    const signature = JSON.stringify(offerings.map((o) => [o?.selector ?? o?.target, o?.property, o?.value]))
    if (signature === offeringsSig) return
    offeringsSig = signature
    offeringsView?.el.remove()
    offeringsView = null
    if (offerings.length) {
      offeringsView = dt.addRule({ sel: '/* the Living Canon, offered by strangers */', src: 'living-canon', kind: 'offering', where: 'top' })
      offeringsView.opened()
      for (const o of offerings) {
        const d = offeringsView.addDecl({ prop: `${String(o.selector ?? o.target ?? '?')} → ${String(o.property ?? '')}`, value: String(o.value ?? '') })
        d.check.hidden = true
      }
      offeringsView.closed()
    }
  }
  life.every(syncRitual, 6000)
  life.timeout(syncRitual, 1500)
  for (const ev of ['server:presence', 'server:wall', 'server:offering', 'ritual:inscribed', 'ritual:offered']) life.on(ev, () => life.timeout(syncRitual, 60))
  for (const ev of ['server:prayer', 'ritual:prayed']) life.on(ev, () => {
    life.timeout(syncRitual, 60)
    if (demonStarted && Date.now() - lastPrayerNote > 20000) { lastPrayerNote = Date.now(); dt.log('demon', 'someone prayed. it did not help.') }
  })
  life.on('server:eclipse', () => demonStarted && dt.log('warn', 'Eclipse. For thirty-three seconds every face of the temple is true at once.'))
  life.on('server:ascended', () => demonStarted && dt.log('info', 'An element has left its container and been written in the Book of the Ascended.'))

  // — The descent: which circle are we in? —
  const descended = new Set()
  // The Inspector follows you down: its Styles pane shows the rule that damned the circle you are in.
  let sinViews = []
  let sinShown = 0
  function showSin(n) {
    if (n === sinShown) return
    sinShown = n
    for (const v of sinViews) v.el.remove()
    sinViews = []
    const list = SIN_RULES[n - 1] ?? []
    const winner = list[0]
    // Prepended one by one, so the list is added from its end and the winning rule lands on top.
    for (const [sel, src, decls, flag] of [...list].reverse()) {
      const view = dt.addRule({ sel, src, kind: 'circle', where: 'top' })
      if (flag === 'ua') view.el.classList.add('dt-rule--ua')
      view.opened()
      view.showSpec(`(${specificity(sel).join(',')})`)
      for (const [prop, raw] of decls) {
        const important = / !important$/.test(raw)
        const d = view.addDecl({ prop, value: raw.replace(/ !important$/, ''), important })
        if (flag === 'ua') d.check.hidden = true // the Old Law's rules cannot be unchecked, here or anywhere
        if (flag === 'lost') {
          d.row.classList.add('is-overridden')
          d.note.hidden = false
          d.note.textContent = ` overridden by ${winner[0]} (${specificity(winner[0]).join(',')})`
        }
        if (flag === 'invalid') {
          d.row.classList.add('is-invalid')
          d.warn.hidden = false
          d.warn.title = 'Unknown property name'
          d.warn.setAttribute('aria-label', 'Unknown property name')
        }
      }
      view.closed()
      sinViews.push(view)
    }
  }
  const circleIO = life.observe((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      const n = Number(e.target.dataset.circle)
      hell.depthLinks.forEach((a, i) => (i === n - 1 ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')))
      dt.select(e.target, { quiet: false })
      showSin(n)
      if (!descended.has(n)) {
        descended.add(n)
        if (demonStarted) dt.log('demon', DESCENT_LINES[n - 1] ?? '…')
      }
      if (n === 9) ctx.memory.markSecret('descent', { face: 'possession' })
    }
  }, { rootMargin: '-45% 0px -50% 0px' })
  hell.circles.forEach((c) => circleIO.observe(c))
  // The circles' own animations run only near the screen: far above or below, they rest (and cost nothing).
  const nearIO = life.observe((entries) => {
    for (const e of entries) e.target.classList.toggle('is-near', e.isIntersecting)
  }, { rootMargin: '60% 0px 60% 0px' })
  for (const el of [...hell.circles, hell.vestibule, hell.gate, hell.exit]) if (el) nearIO.observe(el)
  const exitIO = life.observe((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      hell.exit.classList.add('righted')
      const secs = Math.round(clock.t)
      const skipped = descended.size < 9 ? ' (the ones you skipped saw you pass)' : ''
      hell.exitStats.textContent = `Circles descended: ${descended.size} of 9${skipped} · declarations you unchecked: ${demon.unchecks} · time possessed: ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
    }
  }, { threshold: 0.3 })
  exitIO.observe(hell.exit)
  hell.exitBtn.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: ctx.mercy.on ? 'auto' : 'smooth' })
    corp.nav.querySelector('.brand')?.focus({ preventScroll: true })
    if (demonStarted) dt.log('demon', 'welcome back to our website.')
  })
  // The depth gauge shows between the gate and the way out; cookies do not reach below the footer.
  let depthQueued = false
  let wasBelow = false
  let steppedAside = false
  function sound() {
    depthQueued = false
    // Every measurement first, then every change, so a scroll frame lays the page out once.
    const mid = innerHeight / 2
    const inside = hell.gate.getBoundingClientRect().top < mid && hell.exit.getBoundingClientRect().top > mid
    const below = hell.el.getBoundingClientRect().top < innerHeight * 0.4
    const depthPx = inside ? Math.max(0, Math.round(mid - corp.footer.getBoundingClientRect().bottom)) : 0
    if (hell.depth.hidden === inside) hell.depth.hidden = !inside
    if (inside) {
      const text = `−${nf.format(depthPx)} px`
      if (hell.depthRead.textContent !== text) hell.depthRead.textContent = text
    }
    if (below !== wasBelow) {
      root.classList.toggle('below-footer', below)
      if (!below) showSin(0) // back above the footer, the Styles pane forgets the circles
      wasBelow = below
      // A phone has no room for the hand and the descent at once: it waits at the footer, and returns with you.
      if (below && small.matches && dt.isOpen && demonStarted) {
        steppedAside = true
        dt.close('descent')
        dt.log('demon', 'I cannot follow you down there. I will wait at the footer.')
      } else if (!below && steppedAside) {
        steppedAside = false
        if (!dt.isOpen) {
          dt.open('return')
          dt.log('demon', 'you came back up. I waited, as I said.')
        }
      }
    }
  }
  life.listen(window, 'scroll', () => {
    if (depthQueued) return
    depthQueued = true
    life.frame(sound)
  }, { passive: true })
  life.frame(sound)

  return () => {
    life.dispose()
    for (const n of [stage, hell.depth, dt.chip, dt.el, dt.overlay, toast]) n.remove()
    root.querySelectorAll(':scope > .cookie').forEach((c) => c.remove())
    root.classList.remove('dt-open', 'nigredo', 'apologising', 'is-inspecting', 'point-at-mercy', 'below-footer', 'held')
    root.style.removeProperty('--corp-hue')
  }
}
