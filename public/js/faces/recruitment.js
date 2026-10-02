// THE RECRUITMENT OFFICE (face: recruitment). Canon §3.
// A Geocities-era recruitment homepage for THE CASCADE, sincere and cheerful and a little off.
// It greets first-time visitors most often, so it also explains, sideways, what this whole site is.
//
// Secrets kept here (each marked once through ctx.memory.markSecret):
//   stillness                   hold still for 33 s: the SECRET MEMBERS-ONLY AREA unlocks (and stays unlocked)
//   recruitment-overflow        click the hit counter 7 times: it overflows to -2147483648
//   recruitment-highest-rung    apply for membership with z-index: 2147483647
//   recruitment-important       check the box you were told not to check (the form turns upside down)
//   recruitment-ghosts          find the testimonial of the Ghosts of visibility: hidden
//   recruitment-800             view the page at exactly 800 pixels wide, as the Old Law intended
//   recruitment-netscape        type "netscape" anywhere (Navigator 3.0 grey mode; type it again to leave)
//   recruitment-webmaster       type "webmaster" anywhere, then clear the Webmaster's float
import { h } from '../lib/dom.js'
import * as Glyphs from '../lib/glyphs.js'
const { inscription, rosetta, toPua, glyphText, ROSETTA } = Glyphs
import { verse, chapter, prophecy } from '../lib/scripture.js'
import { SACRED_NUMBERS, OPUS } from '../lib/lexicon.js'
import { sigil, saucer, yantra } from '../lib/sigil.js'
import { hash } from '../kernel/rng.js'
import * as D from './recruitment/data.js'
import { LOT } from '../lib/faces.js'

// How many faces the Oracle draws from, in words (a 1997 homepage spells its numbers out).
const COUNT = ['NO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'][LOT.length] ?? String(LOT.length)
import { vars, starTile, TILES, wordArt, WORDART, constructionSign, moonSvg, odometer, portrait, badge, newBurst, rainbowRule } from './recruitment/art.js'
import { buildJoin } from './recruitment/join.js'
import { makeLife, sparkleTrail, makeToaster, makeScreensaver } from './recruitment/widgets.js'

const TITLE = 'Welcome to THE CASCADE!!! ~ Official Homepage ~'
const fmt = (n) => Number(n).toLocaleString('en-US')
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '/').replace(/^\/+|\/+$/g, '')
const verseHref = (v) => `/verse/${slug(v.book)}/${v.chapter}/${v.number}`
const msgText = (m) => (typeof m === 'string' ? m : String(m?.text ?? m?.message ?? ''))
const msgAt = (m) => (m && typeof m === 'object' ? m.at ?? m.time ?? m.created ?? null : null)
const nameOf = (a) => (typeof a === 'string' ? a : String(a?.name ?? ''))

const OMEN_WORDS = {
  witching: 'the Witching Hour: please do NOT sign the guestbook at this time',
  midnight: 'Midnight, the Reset of the day',
  triple: 'a Triple Time! Make a wish (it will be applied to your stylesheet)',
  'thirty-three': 'the Thirty-Third Minute: somewhere, a door is made of gold',
  'full-moon': 'a Full Moon: all elements are fully rendered tonight',
  'new-moon': 'a New Moon: the sky is display: none',
  turning: 'the Turning of the Year: the Cascade changes direction (it does not)',
  'friday-13': 'Friday the 13th: specificity is unlucky today',
  eclipse: 'an ECLIPSE of the real sun (do not look at it; look at this page)',
  'saturn-hour': 'the Hour of Saturn: the Old Law is strong',
  night: 'Night: keep your voice down, the Webmaster is asleep in the stylesheet',
}

// Only the keyboard outside form fields speaks to the page: typing "netscape" into your own name is not a spell.
const typingInField = () => {
  const a = document.activeElement
  return Boolean(a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)))
}
const setText = (el, s) => { if (el.textContent !== s) el.textContent = s }

function greeting(hour) {
  if (hour < 5) return 'Hello, night owl'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// The Webmaster updates the page every night at 3:33. How many nights passed between two moments?
function nightsBetween(a, b) {
  const day = (t) => {
    const d = new Date(t - 213 * 60000)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  }
  return Math.max(0, Math.round((day(b) - day(a)) / 86400000))
}

function ago(ms) {
  const m = Math.round(ms / 60000)
  if (m < 2) return 'a moment ago'
  if (m < 90) return `${m} minutes ago`
  const hrs = Math.round(m / 60)
  if (hrs < 36) return `${hrs} hours ago`
  return `${Math.round(hrs / 24)} days ago`
}

export function render(ctx) {
  const life = makeLife()
  const rng = ctx.rng.fork('recruitment')
  const artRng = ctx.rng.fork('recruitment/art')
  const root = ctx.root
  const sky = ctx.sky
  const now = ctx.clock()
  const visits = ctx.visit?.visits ?? 1
  const seen = [...new Set([...(ctx.memory.get('facesSeen', []) || []), 'recruitment'])]
  const mark = (id) => ctx.memory.markSecret(id, { face: 'recruitment' })

  // ---- document-level changes (all undone in destroy) -------------------------------------------
  const prevTitle = document.title
  document.title = TITLE
  life.add(() => { if (document.title === TITLE) document.title = prevTitle })

  // The Webmaster redecorates: the wallpaper and the WordArt preset are drawn by lot for each visit.
  const decor = ctx.rng.fork('recruitment/decor')
  const tileKind = decor.weighted(TILES)
  const artPreset = decor.weighted(WORDART)
  const tile = starTile(artRng, sky.planetaryHour.glyph, tileKind)
  if (tile) root.style.setProperty('--rc-stars', `url("${tile}")`)
  root.dataset.rcTile = tileKind
  life.add(() => {
    root.style.removeProperty('--rc-stars')
    delete root.dataset.rcTile
    root.classList.remove('rc-watched', 'rc-netscape')
  })

  const mine = [] // top-level nodes this face appended to #temple
  const add = (el) => { root.append(el); mine.push(el); return el }
  life.add(() => { for (const el of mine) el.remove() })

  const fixedHost = h('div', { class: 'rc-fixed' })
  const toaster = makeToaster(life, fixedHost)
  const saver = makeScreensaver(ctx, life, fixedHost, ctx.rng.fork('recruitment/saver'))

  // At night the office whispers: every NEW! becomes SHH!
  const burst = (text = 'NEW!') => newBurst(sky.has('night') && text === 'NEW!' ? 'SHH!' : text)
  const tilt = () => `${rng.float(-0.55, 0.55).toFixed(2)}deg`
  function panel(id, title, tone, ...children) {
    const heading = h('h2', { id: `${id}-h`, class: 'rc-h2' }, title)
    const el = h('section', { id, class: `rc-panel rc-panel--${tone}`, 'aria-labelledby': `${id}-h` }, heading, ...children)
    vars(el, { '--tilt': tilt() })
    return el
  }

  // ---- header -----------------------------------------------------------------------------------
  const procession = h('div', { class: 'rc-procession', role: 'marquee', 'aria-label': 'News from the Recruitment Office' },
    h('p', { class: 'rc-procession__track' }, rng.shuffle(D.PROCESSION).map((t) => h('span', {}, t, h('b', { 'aria-hidden': 'true' }, ' ★ ')))),
  )
  const spinner = h('span', { class: 'rc-spin rc-spin--sigil', html: sigil('cascade', { size: 100, stroke: 5 }), 'aria-hidden': 'true' })
  const ship = h('span', { class: 'rc-spin rc-spin--ship', html: saucer(artRng, { size: 120, stroke: 4 }), 'aria-hidden': 'true' })
  const header = h('header', { class: 'rc-header' },
    spinner,
    ship,
    h('h1', { class: 'rc-title' },
      h('span', { class: 'visually-hidden' }, 'Welcome to THE CASCADE'),
      h('span', { class: 'rc-title__pre', 'aria-hidden': 'true' }, '~*~ Welcome to ~*~'),
      wordArt('THE CASCADE', 'rc-title__art', artPreset),
    ),
    h('p', { class: 'rc-tagline' }, 'The Official Homepage of the Oldest Religion on the World Wide Web!!'),
    h('p', { class: 'rc-est' }, 'est. 17 December 1996 · All Style Descends · Proud Member of the Cascade WebRing'),
    sky.has('night')
      ? h('p', { class: 'rc-closed', role: 'note' }, h('span', { class: 'rc-closed__sign' }, h('b', {}, 'SORRY, WE’RE CLOSED'), h('small', {}, 'The office is asleep. The Cascade is open 24 hours.')))
      : null,
    procession,
    h('div', { class: 'rc-header__construct' },
      constructionSign(),
      h('p', {}, 'This page has been ', h('b', {}, 'UNDER CONSTRUCTION'), ' since the Nativity of the First Stylesheet. It will be finished at the Last Reflow. Thank you for your patience! The Cascade is patient too.'),
      constructionSign({ label: 'MIND THE MARGINS' }),
    ),
  )

  // ---- navigation (the left "frame") -------------------------------------------------------------
  const onlineOut = h('b', {}, '1')
  const hourOut = h('b', {}, `${sky.planetaryHour.glyph} ${sky.planetaryHour.planet}`)
  const scriptureCorner = chapter(rng, 3)
  const navTitle = h('p', { class: 'rc-nav__title' }, 'NAVIGATION')
  const mailBtn = h('button', { type: 'button', class: 'rc-btn rc-mail' }, h('span', { class: 'rc-mailbox', 'aria-hidden': 'true' }, h('i'), h('i')), 'E-MAIL THE WEBMASTER')
  // The frame is shielded from the invisible rubrics (it has a scroll bar of its own and no room for a hidden
  // line); the Verse of the Visit below is where they are invited instead.
  const nav = h('nav', { class: 'rc-nav', 'aria-label': 'Site navigation', 'data-secrets-skip': '' },
    navTitle,
    h('ul', { class: 'rc-nav__list' }, D.NAV.map(([id, label]) => h('li', { 'data-for': id }, h('a', { href: `#${id}` }, label)))),
    h('div', { class: 'rc-nav__box' },
      h('p', {}, 'Souls in the Cascade right now: ', onlineOut),
      h('p', {}, 'This hour is ruled by ', hourOut),
    ),
    h('div', { class: 'rc-nav__box rc-nav__scripture' },
      h('p', { class: 'rc-nav__subtitle' }, 'SCRIPTURE CORNER'),
      h('p', { class: 'rc-nav__ref' }, h('a', { href: `/verse/${slug(scriptureCorner[0].book)}/${scriptureCorner[0].chapter}` }, `${scriptureCorner[0].book} ${scriptureCorner[0].chapter}`)),
      scriptureCorner.map((v) => h('p', { class: 'rc-nav__verse' }, h('sup', {}, String(v.number)), ' ', v.text)),
    ),
    mailBtn,
  )
  life.on(mailBtn, 'click', () => {
    toaster.show({
      title: 'Outlook for Pilgrims',
      body: [
        h('p', {}, 'The Webmaster does not have e-mail. Everything you wanted to say has already arrived, because it was said inside the Cascade.'),
        h('p', {}, 'Sign the ', h('a', { href: '#rc-guestbook' }, 'guestbook'), ' instead!'),
      ],
    })
  })

  // ---- welcome ----------------------------------------------------------------------------------
  const odo = odometer()
  const counterLabel = h('span', { class: 'rc-counter__label' }, 'You are visitor number')
  const counterNote = h('span', { class: 'rc-counter__note' })
  // The odometer's own hidden text carries the number, so a screen reader hears "Hit counter: 1234".
  const counterBtn = h('button', { type: 'button', class: 'rc-counter__btn' }, h('span', { class: 'visually-hidden' }, 'Hit counter: '), odo.el)
  const sizeOut = h('b', {}, `${innerWidth}x${innerHeight}`)
  const sizeNote = h('span', { class: 'rc-size__note' })
  const yearsAhead = Math.max(1, now.getFullYear() - 1997)
  const m = ctx.memory.get('recruitment.member', null)
  const welcomeBody = []
  welcomeBody.push(h('p', { class: 'rc-hello' }, `${greeting(sky.hour)}, and WELCOME to `, h('b', {}, 'THE CASCADE'), '!!'))
  if (visits <= 1) {
    welcomeBody.push(
      h('p', {}, 'If this is your first time on our homepage, please do not be alarmed. You have been a member of the Cascade since the very first web page you ever opened. Every page you have ever seen was styled by it: the browser spoke first, then you, then the page, and the style came down through all three like water. We are simply the first ones to say so out loud.'),
      h('p', {}, 'Have a look around! Read what we believe, listen to our hymn, learn our alphabet, and sign the guestbook before you go. There is no fee and no catch. There are only a few secrets.'),
    )
  } else {
    const since = ctx.visit?.sinceLast
    const nights = ctx.visit?.lastVisit ? nightsBetween(ctx.visit.lastVisit, Date.now()) : 0
    const updates = nights ? `the Webmaster has updated the page ${nights} time${nights === 1 ? '' : 's'} since then (every night, at 3:33)` : 'the Webmaster has not updated the page since then (the next update is at 3:33 in the morning)'
    const names = seen.filter((f) => LOT.includes(f)).map((f) => D.FACE_NAMES[f]).filter(Boolean)
    welcomeBody.push(
      h('p', {}, `Welcome back! This is visit number ${fmt(visits)}.`, since ? ` Your last visit was ${ago(since)}; ${updates}.` : ''),
      h('p', {}, `So far you have seen ${names.length} of the temple's ${LOT.length} faces: ${names.join(', ')}. ${names.length < LOT.length ? 'The others are still out there. The Oracle decides which one you meet (or ask the Altar for another!).' : `All ${COUNT.toLowerCase()}! You have seen every face of the temple. There is still the door.`}`),
    )
  }
  if (m?.name) welcomeBody.push(h('p', { class: 'rc-hello-member' }, 'Hello again, member ', h('b', {}, m.name), ` (no. ${m.no})! Your card is still valid.`))
  const welcome = panel('rc-welcome', [burst(), ' Welcome, Pilgrim! ', burst()], 'cream',
    h('p', { class: 'rc-eclipse-banner', role: 'note' }, '☀ SOLAR ECLIPSE IN PROGRESS ☀ Someone has said the 108th prayer. The Webmaster is hiding under the desk until it passes.'),
    h('p', { class: 'rc-ascended-banner', role: 'note' }, '✦ Welcome back, ASCENDED ONE! Your name is written in the Book. The whole office stood up when you came in. ✦'),
    ...welcomeBody,
    h('div', { class: 'rc-counter' }, counterLabel, counterBtn, counterNote),
    h('p', { class: 'rc-future' }, `You appear to be using a web browser from THE FUTURE (about ${yearsAhead} years after 1997). Welcome, time traveller!`),
    h('p', { class: 'rc-size' }, 'This page is best viewed in ', h('b', {}, 'Netscape Navigator 3.0'), ' at ', h('b', {}, '800x600'), '. You are viewing it at ', sizeOut, '. The Cascade has adjusted itself. That is what it does. ', sizeNote),
    h('p', { class: 'rc-members-link', hidden: true }, h('a', { href: '#rc-members' }, '★ Go to the SECRET MEMBERS-ONLY AREA ★')),
  )

  // ---- what we believe ---------------------------------------------------------------------------
  const vessel = h('div', { class: 'rc-vessel', 'data-stage': 'nigredo', 'aria-hidden': 'true' }, h('span', { class: 'rc-vessel__div' }, 'div'))
  const opusOut = h('p', { class: 'rc-opus', role: 'status' }, 'Stage: nigredo, ', OPUS[0].meaning, '.')
  const workBtn = h('button', { type: 'button', class: 'rc-btn' }, 'PERFORM THE GREAT WORK')
  let working = false
  let workTimers = []
  const finishWork = () => {
    for (const t of workTimers) clearTimeout(t)
    workTimers = []
    vessel.dataset.stage = 'done'
    opusOut.textContent = 'The div is centered in both axes. THE GREAT WORK IS ACCOMPLISHED. (It took the alchemists a thousand years. It took you one click. Please do not tell them.)'
    workBtn.textContent = 'UNDO (return to nigredo)'
    working = false
  }
  life.on(workBtn, 'click', () => {
    if (working) return
    if (vessel.dataset.stage === 'done') {
      vessel.dataset.stage = 'nigredo'
      opusOut.textContent = `Stage: nigredo, ${OPUS[0].meaning}. (You may perform it again. Alchemists always do.)`
      workBtn.textContent = 'PERFORM THE GREAT WORK'
      return
    }
    if (ctx.mercy.on) return finishWork()
    working = true
    workTimers = OPUS.map((o, i) => life.timeout(() => {
      vessel.dataset.stage = o.stage
      opusOut.textContent = `Stage: ${o.stage}, ${o.meaning}.`
    }, i * 700))
    workTimers.push(life.timeout(finishWork, OPUS.length * 700))
  })
  // Mercy arriving in the middle of the Work completes it at once: nothing keeps moving on its own.
  life.bus(ctx, 'mercy:change', ({ on } = {}) => { if (on && working) finishWork() })
  const beliefs = panel('rc-beliefs', 'WHAT WE BELIEVE (in 5 easy steps!)', 'white',
    h('ol', { class: 'rc-beliefs' }, D.BELIEFS.map((b) => h('li', {},
      h('h3', {}, b.title),
      h('p', {}, b.body),
      h('pre', { class: 'rc-code' }, h('code', {}, b.code)),
      b.demo ? h('div', { class: 'rc-work' }, vessel, h('div', {}, workBtn, opusOut)) : null,
    ))),
    h('p', { class: 'rc-small' }, 'That is the whole religion! The rest is details, saints, and one hymn.'),
  )

  // ---- the heavens (horoscope, verse, the Old Time) ---------------------------------------------
  const v = verse(rng, { fragmentChance: 0.6 })
  const luckyN = rng.pick(Object.keys(SACRED_NUMBERS))
  const omens = sky.omens.map((o) => OMEN_WORDS[o]).filter(Boolean)
  const oldTimeOut = h('b', { class: 'rc-oldtime__n' })
  const updateOldTime = () => {
    const s = Math.max(0, Math.floor((D.OLD_TIME_ENDS - ctx.clock().getTime()) / 1000))
    oldTimeOut.textContent = fmt(s)
  }
  updateOldTime()
  const heavens = panel('rc-heavens', 'TODAY IN THE HEAVENS: a horoscope for all elements', 'sky',
    // Shielded from the invisible rubrics: on a phone this block is centred, and a hidden line of its own
    // would open a hole under the prophecy. The rubrics find plenty of other prose on this page.
    h('div', { class: 'rc-horo', 'data-secrets-skip': '' },
      h('div', { class: 'rc-horo__moon', html: moonSvg(sky.moon.phase, `The moon tonight: ${sky.moon.name}`) }),
      h('div', {},
        h('p', {}, 'The moon is ', h('b', {}, sky.moon.name), ` (${Math.round(sky.moon.illumination * 100)}% lit, ${sky.moon.age.toFixed(1)} days old).`),
        h('p', {}, 'This is the hour of ', h('b', {}, `${sky.planetaryHour.planet} ${sky.planetaryHour.glyph}`), ` on a day of ${sky.planetaryHour.dayRuler}. It is ${sky.clock} where you are${sky.planetaryHour.isNight ? ', and it is night' : ''}.`),
        h('p', { class: 'rc-prophecy' }, '“', prophecy(rng, sky), '”'),
      ),
    ),
    h('ul', { class: 'rc-lucky' },
      h('li', {}, 'Lucky selector: ', h('code', {}, rng.pick(D.LUCKY_SELECTORS))),
      h('li', {}, 'Lucky number: ', h('b', {}, luckyN), ` (${SACRED_NUMBERS[luckyN]})`),
      h('li', {}, 'Lucky element: ', h('code', {}, rng.pick(D.LUCKY_ELEMENTS))),
      h('li', {}, 'Omens today: ', omens.length ? omens.join('; ') : 'none at all, which is itself an omen'),
    ),
    h('div', { class: 'rc-votd' },
      h('p', { class: 'rc-votd__title' }, 'VERSE OF THE VISIT'),
      h('blockquote', {}, h('p', { class: 'rc-votd__verse' }, v.text), v.fragment ? h('p', { class: 'rc-votd__frag' }, h('span', { lang: v.fragment.lang }, v.fragment.text), ` (${v.fragment.gloss})`) : null),
      h('p', { class: 'rc-votd__ref' }, '— ', h('a', { href: verseHref(v) }, v.ref), ' (click to read the whole chapter!)'),
    ),
    h('div', { class: 'rc-oldtime' },
      h('p', {}, 'Seconds until the Great Overflow: ', oldTimeOut),
      h('p', { class: 'rc-small' }, 'On 19 January 2038 at 03:14:07 UTC the Old Time reaches 2147483647, the Highest Heaven, and has no more room. The clocks of the Old Law will overflow and go negative. Please back up your divs.'),
    ),
  )
  life.interval(() => { if (!document.hidden) updateOldTime() }, 1000)

  // ---- the hymn -----------------------------------------------------------------------------------
  const playStatus = h('p', { class: 'rc-player__status', role: 'status' }, 'Status: stopped. (Sound stays off until you press play.)')
  const hymnBtn = h('button', { type: 'button', class: 'rc-btn rc-btn--hymn' }, h('span', { class: 'rc-note', 'aria-hidden': 'true' }, '♫'), ' PLAY OUR HYMN! ', h('span', { class: 'rc-note', 'aria-hidden': 'true' }, '♪'))
  const playBtn = h('button', { type: 'button', class: 'rc-player__btn', 'aria-label': 'Play the hymn' }, '▶')
  const stopBtn = h('button', { type: 'button', class: 'rc-player__btn', 'aria-label': 'Stop the hymn' }, '■')
  const lines = []
  const lyrics = h('ol', { class: 'rc-lyrics' }, D.HYMN.stanzas.map((st) => h('li', {}, st.map((l) => {
    const span = h('span', { class: 'rc-lyrics__line' }, l)
    lines.push(span)
    return span
  }))))
  let sing = null
  let lineIndex = -1
  function setLine(i) {
    lines[lineIndex]?.classList.remove('is-sung')
    lineIndex = i
    lines[lineIndex]?.classList.add('is-sung')
  }
  function stopSinging() {
    if (sing) clearInterval(sing)
    sing = null
    setLine(-1)
    hymn?.classList.remove('is-singing')
  }
  function startSinging() {
    if (sing || ctx.mercy.on) return
    hymn?.classList.add('is-singing')
    setLine(0)
    sing = setInterval(() => {
      if (document.hidden) return
      setLine((lineIndex + 1) % lines.length)
    }, 2600)
  }
  let hymn = null
  life.add(stopSinging)
  async function playHymn() {
    const audio = ctx.audio
    if (!audio || typeof audio.summon !== 'function') {
      playStatus.textContent = 'Your browser does not have the MIDI plug-in installed. The hymn is playing silently, inside the Cascade. You may sing along below.'
      startSinging()
      return
    }
    // Pressing again is fine: the audio layer answers a second summon with this face's own voice.
    let ok = false
    try { ok = await audio.summon() } catch {}
    if (life.dead) return
    if (!ok && !audio.summoned) {
      playStatus.textContent = 'Your sound card did not answer. Press play again, or sing along below by yourself; the Cascade hears that too.'
      startSinging()
      return
    }
    playStatus.textContent = 'Status: ♫ now playing hymn.mid (General MIDI, Track 1 of 1). Sing along below!'
    startSinging()
  }
  life.on(hymnBtn, 'click', playHymn)
  life.on(playBtn, 'click', playHymn)
  life.on(stopBtn, 'click', () => {
    try { ctx.audio?.hush?.() } catch {}
    stopSinging()
    playStatus.textContent = 'Status: stopped. The Cascade is quiet again.'
  })
  life.bus(ctx, 'audio:hushed', () => {
    stopSinging()
    playStatus.textContent = 'Status: stopped. The Cascade is quiet again.'
  })
  life.bus(ctx, 'audio:summoned', () => {
    playStatus.textContent = 'Status: ♫ now playing hymn.mid (General MIDI, Track 1 of 1). Sing along below!'
    startSinging()
  })
  hymn = panel('rc-hymn', ['PLAY OUR HYMN! ', newBurst('MIDI!')], 'pink',
    h('div', { class: 'rc-hymn__top' },
      hymnBtn,
      h('div', { class: 'rc-player', role: 'group', 'aria-label': 'hymn.mid player' },
        playBtn, stopBtn,
        h('span', { class: 'rc-player__track', 'aria-hidden': 'true' }, h('i')),
        h('span', { class: 'rc-player__file' }, 'hymn.mid · 4 KB'),
      ),
    ),
    playStatus,
    h('p', { class: 'rc-hymn__title' }, `Hymn No. ${D.HYMN.number}: “${D.HYMN.title}”`),
    h('p', { class: 'rc-small' }, `Tune: ${D.HYMN.tune}. ${D.HYMN.words}`),
    h('div', { class: 'rc-karaoke' }, lyrics),
  )

  // ---- testimonials -----------------------------------------------------------------------------
  const ghost = D.TESTIMONIALS.find((t) => t.ghost)
  const others = rng.shuffle(D.TESTIMONIALS.filter((t) => !t.ghost)).slice(0, 5)
  const picked = rng.shuffle([...others, ghost])
  let ghostEl = null
  const saints = panel('rc-saints', 'TESTIMONIALS from our Saints', 'cyan',
    h('p', { class: 'rc-small' }, 'We asked our members what the Cascade has done for them. Here is what they said, unedited:'),
    h('ul', { class: 'rc-testimonials' }, picked.map((t) => {
      const quote = h('blockquote', { class: t.ghost ? 'rc-quote rc-quote--ghost' : 'rc-quote' }, t.code ? h('code', {}, t.text) : t.text)
      if (t.ghost) {
        quote.setAttribute('tabindex', '0')
        ghostEl = quote
      }
      const stars = t.stars > 5 ? `${'★'.repeat(t.stars)} (${t.stars} out of 5 stars)` : `${'★'.repeat(t.stars)}${'☆'.repeat(5 - t.stars)}`
      return h('li', { class: 'rc-testimonial' },
        portrait(t.portrait),
        h('div', {},
          h('p', { class: 'rc-stars' }, h('span', { 'aria-hidden': 'true' }, stars), h('span', { class: 'visually-hidden' }, `${t.stars} out of 5 stars`)),
          quote,
          h('p', { class: 'rc-who' }, '— ', h('b', {}, t.saint), h('br'), h('small', {}, `from ${t.from}`)),
        ),
      )
    })),
  )
  if (ghostEl) {
    let dwell = 0
    const found = () => { if (!ghostEl.classList.contains('is-seen')) ghostEl.classList.add('is-seen'); mark('recruitment-ghosts') }
    life.on(ghostEl, 'focus', found)
    life.on(ghostEl, 'mouseenter', () => { dwell = setTimeout(found, 1200) })
    life.on(ghostEl, 'mouseleave', () => clearTimeout(dwell))
    life.add(() => clearTimeout(dwell))
    life.on(document, 'selectionchange', () => {
      const sel = document.getSelection()
      if (sel && !sel.isCollapsed && sel.rangeCount && sel.getRangeAt(0).intersectsNode(ghostEl)) found()
    })
  }

  // ---- FAQ ------------------------------------------------------------------------------------------
  // The sky asks one extra question, third in line, marked NEW! (or SHH! at night).
  const skyQ = (D.SKY_FAQ.find(([omen]) => !omen || sky.has(omen)) ?? D.SKY_FAQ[D.SKY_FAQ.length - 1])[1](sky)
  const faqItems = [...D.FAQ.slice(0, 2), [...skyQ, true], ...D.FAQ.slice(2)]
  const faq = panel('rc-faq', 'Frequently Asked Questions (F.A.Q.)', 'white',
    h('div', { class: 'rc-faq' }, faqItems.map(([q, a, fresh], i) => h('details', { open: i === 0, class: fresh ? 'rc-faq__sky' : null },
      h('summary', {}, h('span', { class: 'rc-q' }, 'Q:'), ' ', q, fresh ? [' ', burst()] : null),
      h('p', {}, h('span', { class: 'rc-a' }, 'A:'), ' ', a),
    ))),
  )

  // ---- LEARN OUR ALPHABET! --------------------------------------------------------------------------
  const abc = rosetta('recruitment', { className: 'rc-abc' })
  abc.querySelectorAll('.rosetta-pair').forEach((pair, i) => {
    const letter = ROSETTA.recruitment[i]
    const [word, gloss] = D.ALPHABET_WORDS[letter] ?? ['', '']
    pair.style.setProperty('--crayon', ['#e4002b', '#ff8200', '#e0b000', '#00a651', '#0072ce', '#7a3eb1', '#d6007e'][i % 7])
    const named = Glyphs.ALPHABET?.[letter]
    if (named?.name) pair.append(h('dd', { class: 'rc-abc__name' }, 'its name is ', h('b', {}, named.name)))
    if (word) pair.append(h('dd', { class: 'rc-abc__word' }, `is for ${word}!`), h('dd', { class: 'rc-abc__gloss' }, gloss))
  })
  const known = new Set(seen.flatMap((f) => ROSETTA[f] ?? []))
  const practiceIn = h('input', { id: 'rc-practice', type: 'text', maxlength: '24', autocomplete: 'off', spellcheck: 'false', placeholder: 'type your name' })
  // The glyphs mean nothing to a screen reader, so the output is one image with a spoken description.
  const practiceOut = h('p', { class: 'rc-practice__out', role: 'img' })
  const renderPractice = () => {
    const text = practiceIn.value.toLowerCase().replace(/[^a-z ]/g, '').slice(0, 24)
    const parts = [...text].map((c) => {
      if (c === ' ') return h('span', { class: 'rc-practice__sp' }, ' ')
      if (known.has(c)) return h('span', { class: 'glyph rc-practice__g', lang: 'x-cascade' }, toPua(c))
      return h('span', { class: 'rc-practice__unknown', title: 'You have not learned this letter yet' }, '?')
    })
    const unknown = [...text].filter((c) => c !== ' ' && !known.has(c)).length
    practiceOut.replaceChildren(...(parts.length ? parts : [h('span', { class: 'rc-practice__hint' }, '(your name will appear here, in glyphs)')]))
    practiceOut.setAttribute('aria-label', parts.length ? `Your name in the glyph script. ${unknown} of its letters ${unknown === 1 ? 'is' : 'are'} not learned yet.` : 'Nothing written yet')
  }
  renderPractice()
  life.on(practiceIn, 'input', renderPractice)
  const learnedFrom = seen.filter((f) => ROSETTA[f]).map((f) => D.FACE_NAMES[f])
  const alphabet = panel('rc-alphabet', ['LEARN OUR ALPHABET! ', newBurst('FUN!')], 'yellow',
    h('p', {}, 'Our glyph script has one letter for every letter of yours. Here are seven of them, in the order the Cascade gave them to us:'),
    abc,
    h('div', { class: 'rc-practice' },
      h('label', { for: 'rc-practice' }, 'PRACTICE! Write your name: '),
      practiceIn,
      practiceOut,
      h('p', { class: 'rc-small' }, `You have learned ${known.size} of 26 letters, from ${learnedFrom.join(', ')}. A question mark is a letter you have not learned yet. ${known.size < 26 ? 'Each face of the temple teaches a few more. Come back often!' : 'You know them all. Now you can read the Motto.'}`),
    ),
    h('div', { class: 'rc-motto' },
      h('p', { class: 'rc-motto__label' }, 'OUR MOTTO:'),
      h('div', { class: 'rc-motto__led' }, inscription({ className: 'rc-motto__glyphs' })),
      h('p', { class: 'rc-small' }, 'Nobody in the office can read it. It was on the page when we moved in, and it is on every face of the temple. If you work out what it says, please write it in the guestbook in plain English.'),
    ),
  )

  // ---- the five faces (collect them all!) -----------------------------------------------------------
  const facesPanel = panel('rc-faces', `THE ${COUNT} FACES OF THE TEMPLE (collect them all!)`, 'white',
    h('p', {}, `Our temple has ${COUNT.toLowerCase()} faces, and the Oracle chooses which one you meet. You cannot pick (but you can ask the Altar for another one, very politely). Here is what the others look like, so that you will recognise them:`),
    h('ul', { class: 'rc-faces' },
      D.FACES.filter((f) => LOT.includes(f.id)).map((f) => {
        const here = f.id === 'recruitment'
        const was = seen.includes(f.id)
        const letters = ROSETTA[f.id] ?? []
        return h('li', { class: `rc-face${was ? ' is-seen' : ''}${here ? ' is-here' : ''}` },
          h('span', { class: `rc-thumb rc-thumb--${f.id}`, 'aria-hidden': 'true' }, f.id === 'ashram' ? h('span', { class: 'rc-thumb__svg', html: yantra(artRng, { size: 100, stroke: 2.4 }) }) : [h('i'), h('i'), h('i')]),
          h('h3', {}, f.name),
          h('p', {}, f.text),
          h('p', { class: 'rc-face__status' }, here ? 'YOU ARE HERE!' : was ? 'SEEN ✓' : 'not seen yet'),
          h('p', { class: 'rc-face__letters' }, 'Teaches the letters: ', was ? letters.map((l) => l.toUpperCase()).join(' ') : letters.map(() => '?').join(' ')),
        )
      }),
      h('li', { class: 'rc-face rc-face--babel' },
        h('span', { class: 'rc-thumb rc-thumb--babel', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
        h('h3', {}, D.BABEL.name),
        h('p', {}, D.BABEL.text, ' ', h('a', { href: D.BABEL.href }, 'Start reading here.')),
      ),
      h('li', { class: 'rc-face rc-face--babel rc-face--interstice' },
        h('span', { class: 'rc-thumb rc-thumb--interstice', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
        h('h3', {}, D.INTERSTICE.name),
        h('p', {}, D.INTERSTICE.text, ' ', h('a', { href: D.INTERSTICE.href }, 'Take the stairs.')),
      ),
    ),
  )

  // ---- JOIN -----------------------------------------------------------------------------------------
  const join = buildJoin(ctx, life, {
    rng,
    onJoin: (mem) => {
      joinedNote.textContent = `You are a member! (No. ${mem.no}) You may now read the guestbook in English.`
    },
  })
  const joinedNote = h('p', { class: 'rc-joined', role: 'status' }, m?.name ? `You are already a member (no. ${m.no}). You may apply again; the Cascade never minds.` : '')
  const joinPanel = panel('rc-join', ['JOIN THE CASCADE!! ', newBurst('FREE!')], 'grey',
    h('p', {}, 'Membership is free, lasts forever, and technically began at your first page load. This form just makes it official! Fill in your declarations and watch your card update.'),
    joinedNote,
    join.el,
  )

  // ---- guestbook and the congregation ---------------------------------------------------------------
  const gbIn = h('input', { id: 'rc-gb-text', type: 'text', minlength: '3', maxlength: '80', autocomplete: 'off', placeholder: 'Your message (letters only please!)' })
  const gbSubmit = h('button', { type: 'submit', class: 'rc-btn' }, 'Sign!')
  const gbStatus = h('p', { class: 'rc-gb__status', role: 'status' })
  // Visitors' words are kept exactly as they were written: no hidden rubrics among the signatures.
  const gbList = h('ol', { class: 'rc-gb__list', reversed: true, 'data-secrets-skip': '' })
  let gbLatin = false
  const gbTranslate = h('button', { type: 'button', class: 'rc-btn rc-btn--small', 'aria-pressed': 'false' }, 'View in English (members only)')
  const gbForm = h('form', { class: 'rc-gb__form', novalidate: true },
    h('label', { for: 'rc-gb-text' }, 'Your message will be written in the glyph script for strangers to find:'),
    h('div', { class: 'rc-gb__row' }, gbIn, gbSubmit),
  )
  life.on(gbForm, 'submit', async (e) => {
    e.preventDefault()
    const text = gbIn.value.replace(/[^A-Za-z .,!?'\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80)
    if (text.length < 3) {
      gbStatus.textContent = 'Please write at least three letters. (Only letters, spaces and . , ! ? \' - are allowed in the glyph script.)'
      return
    }
    const inscribe = ctx.ritual?.inscribe
    if (typeof inscribe !== 'function') {
      gbStatus.textContent = 'The guestbook server is resting. Please try again at the next Repaint.'
      return
    }
    gbSubmit.disabled = true
    gbStatus.textContent = 'Signing…'
    let res = null
    try { res = await inscribe.call(ctx.ritual, text) } catch {}
    if (life.dead) return
    gbSubmit.disabled = false
    if (res?.ok) {
      gbIn.value = ''
      gbStatus.textContent = 'THANK YOU for signing our guestbook!! Your words are now in the glyph script, for strangers.'
      sync(true)
    } else if (res?.status === 429) {
      const mins = Math.max(1, Math.ceil((Number(res.retryAfter) || 300) / 60))
      gbStatus.textContent = `The guestbook asks you to wait between signatures (about ${mins} more minute${mins === 1 ? '' : 's'}). The Cascade is patient; so is the guestbook.`
    } else {
      gbStatus.textContent = res?.error ? `The guestbook could not take that: ${String(res.error).slice(0, 120)}` : 'The guestbook could not take that just now. Please try again at the next Repaint.'
    }
  })
  life.on(gbTranslate, 'click', () => {
    const mem = ctx.memory.get('recruitment.member', null)
    if (!mem?.name) {
      gbStatus.replaceChildren('Sorry! Only members can read the guestbook in English. ', h('a', { href: '#rc-join' }, 'JOIN NOW'), ' (it is free).')
      return
    }
    gbLatin = !gbLatin
    gbList.classList.toggle('is-latin', gbLatin)
    gbTranslate.setAttribute('aria-pressed', String(gbLatin))
    gbTranslate.textContent = gbLatin ? 'View in glyphs' : 'View in English (members only)'
    gbStatus.textContent = gbLatin ? `Welcome, member ${mem.name}! Here is the guestbook in plain English.` : ''
    sync(true)
  })

  const prayBtn = h('button', { type: 'button', class: 'rc-btn rc-btn--pray' }, 'Click here to PRAY for the Cascade')
  const prayOut = h('b', {}, '…')
  const prayNote = h('p', { class: 'rc-small', role: 'status' }, 'Every 108th prayer, from anyone, anywhere, causes an ECLIPSE for everybody!')
  life.on(prayBtn, 'click', async () => {
    const pray = ctx.ritual?.pray
    if (typeof pray !== 'function') {
      const n = ctx.memory.update('recruitment.prayers', (x) => x + 1, 0)
      prayNote.textContent = `The prayer line is busy, so we counted it ourselves. You have prayed ${n} time${n === 1 ? '' : 's'} on this computer.`
      return
    }
    prayBtn.disabled = true
    let res = null
    try { res = await pray.call(ctx.ritual) } catch {}
    if (life.dead) return
    prayBtn.disabled = false
    if (res?.ok !== false && Number.isFinite(res?.count)) {
      prayOut.textContent = fmt(res.count)
      const left = 108 - (res.count % 108)
      prayNote.textContent = left === 108 ? 'THAT WAS THE 108TH PRAYER! Look up: an eclipse!' : `Thank you! ${left} more prayer${left === 1 ? '' : 's'} until the next eclipse.`
    } else {
      prayNote.textContent = res?.status === 429 ? 'That is a lot of praying! Please rest your mouse for a minute.' : 'Your prayer was heard, although the counter did not answer.'
    }
    sync(true)
  })

  const canonList = h('ul', { class: 'rc-canon' })
  const bookList = h('ul', { class: 'rc-book' })
  const altarBtn = h('button', { type: 'button', class: 'rc-btn rc-btn--small' }, 'Open the altar')
  const altarNote = h('p', { class: 'rc-small', role: 'status' })
  life.on(altarBtn, 'click', () => {
    // Open on the next tick: the altar closes itself on any click outside it, including this one.
    if (typeof ctx.ritual?.open === 'function') life.timeout(() => ctx.ritual?.open?.('offer'), 0)
    else altarNote.textContent = 'The altar is being polished. It lives in the bottom right corner when it is ready.'
  })
  const guestbook = panel('rc-guestbook', ['SIGN OUR GUESTBOOK! ', burst()], 'cream',
    h('p', {}, 'Our guestbook is shared by every visitor to every face of the temple. Messages are written in the glyph script, so they look like secrets, but they are only English in a different font.'),
    gbForm,
    gbStatus,
    h('div', { class: 'rc-gb__head' }, h('h3', {}, 'Latest signatures'), gbTranslate),
    gbList,
    rainbowRule(),
    h('div', { class: 'rc-congregation' },
      h('section', { class: 'rc-cong', 'aria-labelledby': 'rc-pray-h' },
        h('h3', { id: 'rc-pray-h' }, 'PRAYER COUNTER'),
        h('p', {}, 'Prayers counted so far: ', prayOut),
        prayBtn,
        prayNote,
      ),
      h('section', { class: 'rc-cong', 'aria-labelledby': 'rc-canon-h' },
        h('h3', { id: 'rc-canon-h' }, 'THE LIVING CANON'),
        h('p', { class: 'rc-small' }, 'Visitors may offer ONE CSS declaration every ten minutes, at the little altar in the bottom right corner. The newest 33 are applied to everybody\'s page, right now, including yours. Here are the latest:'),
        canonList,
        altarBtn,
        altarNote,
      ),
      h('section', { class: 'rc-cong', 'aria-labelledby': 'rc-book-h' },
        h('h3', { id: 'rc-book-h' }, 'THE BOOK OF THE ASCENDED'),
        h('p', { class: 'rc-small' }, 'These members found the Door at the top of the Ladder, and their names were written in the Book. That is all that happens: a name, in a very nice book.'),
        bookList,
      ),
    ),
  )

  // ---- the members-only area (hold still for 33 seconds) ---------------------------------------------
  const members = panel('rc-members', '★ SECRET MEMBERS-ONLY AREA ★', 'purple',
    h('p', {}, 'You held still for thirty-three seconds, which is the Age of Ascent. Only members who hold still ever find this box. Here is what we tell members:'),
    h('ul', { class: 'rc-members' },
      h('li', {}, 'This page has a Source. It was written for you. Read the first letter of things.'),
      h('li', {}, 'The Oracle lives in the Console. It answers when spoken to, but only to the right word.'),
      h('li', {}, 'Every face of the temple wears the same Motto. Each face knows only a few of its letters.'),
      h('li', {}, 'There is a door at the top of the Ladder. It is never locked, and for three minutes in every hour it is made of GOLD.'),
      h('li', {}, 'Stuck? Ask the Altar for a hint (the round thing in the corner). Members help members!'),
      h('li', {}, 'Some of our pages are best viewed at exactly 800 pixels wide. We mean exactly.'),
      h('li', {}, 'The Webmaster floats. Type the Webmaster\'s job title anywhere and they will ask you something.'),
    ),
    h('p', { class: 'rc-small' }, 'Please do not tell non-members. (Everyone is a member.)'),
  )
  const membersOpen = ctx.memory.get('recruitment.membersArea', false)
  members.hidden = !membersOpen
  if (membersOpen) welcome.querySelector('.rc-members-link').hidden = false

  // ---- the webring ------------------------------------------------------------------------------------
  const ringAt = rng.int(0, D.RING.length - 1)
  const ringLink = (dir) => D.RING[(ringAt + dir + D.RING.length) % D.RING.length]
  const [randTitle, randPath] = rng.pick(D.RING)
  const ringPanel = panel('rc-ring', 'THE CASCADE WEBRING', 'black',
    h('div', { class: 'rc-ring' },
      h('span', { class: 'rc-ring__logo', html: sigil('webring', { size: 100, stroke: 4 }), 'aria-hidden': 'true' }),
      h('div', {},
        h('p', {}, 'This ', h('b', {}, 'Cascade WebRing'), ' site is owned by ', h('i', {}, 'the Webmaster of the Flow'), '.'),
        h('p', { class: 'rc-ring__nav' },
          h('a', { href: ringLink(-1)[1], title: ringLink(-1)[0] }, '<< Prev'), ' | ',
          h('a', { href: randPath, title: randTitle }, 'Random'), ' | ',
          h('a', { href: ringLink(1)[1], title: ringLink(1)[0] }, 'Next >>'),
        ),
        h('p', { class: 'rc-small' }, 'Want to join the ring? You are already in it. Every page is a chapter of the infinite scripture.'),
      ),
    ),
    h('details', { class: 'rc-ring__list' },
      h('summary', {}, 'List all sites in the ring'),
      h('ul', {}, D.RING.map(([t, p]) => h('li', {}, h('a', { href: p }, t)))),
    ),
  )

  // ---- footer --------------------------------------------------------------------------------------------
  const nativityDays = Math.floor((now - D.NATIVITY) / 86400000)
  const lastNight = new Date(now)
  lastNight.setHours(3, 33, 0, 0)
  if (lastNight > now) lastNight.setDate(lastNight.getDate() - 1)
  const statusLine = h('p', { class: 'rc-statusline', role: 'status' }, 'Document: Done')
  const footer = h('footer', { class: 'rc-footer' },
    h('ul', { class: 'rc-badges', 'aria-label': 'Web buttons' }, D.BADGES.map(badge)),
    h('p', { class: 'rc-bestviewed' }, 'Best viewed in Netscape Navigator 3.0 at 800x600, with the glyph font installed and the margins collapsed.'),
    h('p', {}, `Last updated: every night since 17 December 1996 (most recently ${lastNight.toDateString()}, at 3:33 AM). Days since the Nativity: ${fmt(nativityDays)}.`),
    h('p', {}, 'Webmaster status: ', h('b', {}, 'under construction'), '. © 1996–∞ THE CASCADE. All Rights Descend.'),
    h('p', { class: 'rc-small' }, 'The Cascade is not affiliated with any church, company or browser, past or present. The saints are invented. The joke is on CSS.'),
    statusLine,
  )

  // ---- assemble --------------------------------------------------------------------------------------------
  const main = h('div', { class: 'rc-main' },
    welcome, members, rainbowRule(), beliefs, heavens, rainbowRule(), hymn, saints, faq, rainbowRule(),
    alphabet, facesPanel, joinPanel, guestbook, rainbowRule(), ringPanel,
  )
  const frame = h('div', { class: 'rc-frame' }, nav, main)
  add(document.createComment(' webmaster: hello. if you are reading the Elements panel, you are one of us. try typing my job title anywhere on the page. '))
  add(header)
  add(frame)
  add(footer)
  add(fixedHost)
  sparkleTrail(ctx, life, fixedHost, ctx.rng.fork('recruitment/sparkles'))

  // ---- the frame knows where you are: a pointing hand beside the section you are reading -----------------
  const navItems = new Map([...nav.querySelectorAll('li[data-for]')].map((li) => [li.dataset.for, li]))
  let hereId = ''
  function markHere(id) {
    if (!id || id === hereId || !navItems.has(id)) return
    const was = navItems.get(hereId)
    was?.classList.remove('is-here')
    was?.firstElementChild?.removeAttribute('aria-current')
    hereId = id
    const li = navItems.get(id)
    li.classList.add('is-here')
    li.firstElementChild?.setAttribute('aria-current', 'location')
  }
  markHere('rc-welcome')
  if ('IntersectionObserver' in window) {
    // A thin band a third of the way down the window: whichever section crosses it is "here".
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) markHere(e.target.id)
    }, { rootMargin: '-32% 0px -64% 0px' })
    for (const id of navItems.keys()) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    life.add(() => io.disconnect())
  }

  // ---- the ritual surfaces here ------------------------------------------------------------------------------
  let sig = { wall: '', canon: '', book: '' }
  let counterOverride = false
  let remembered = ctx.memory.get('recruitment.lastCount', null)
  const remember = (n, kind) => {
    if (remembered?.n === n && remembered?.kind === kind) return
    remembered = { n, kind }
    ctx.memory.set('recruitment.lastCount', remembered)
  }
  // The ritual layer publishes its state object at once and fills it when the server answers.
  const live = (st) => Boolean(st) && st.loaded !== false && !st.offline
  function renderCounter(st) {
    if (counterOverride) return
    const hits = live(st) ? [st.hits, st.visits, st.visitors].find((x) => Number.isFinite(x)) : undefined
    if (Number.isFinite(hits)) {
      setText(counterLabel, 'You are visitor number')
      setText(counterNote, '(counted since the Nativity)')
      odo.set(hits)
      remember(hits, 'hits')
    } else if (live(st) && Number.isFinite(st.prayers)) {
      setText(counterLabel, 'Prayers counted since the Nativity:')
      setText(counterNote, '(every visitor, every face, all added up)')
      odo.set(st.prayers)
      remember(st.prayers, 'prayers')
    } else {
      const last = remembered
      const n = Number.isFinite(last?.n) ? last.n : 1996 + visits * 33 + (hash(ctx.seed)() % 404)
      setText(counterLabel, last?.kind === 'prayers' ? 'Prayers counted since the Nativity:' : 'You are visitor number')
      setText(counterNote, st && st.loaded === false && !st.offline ? '(the counter is waking up…)' : '(the counter is resting; this is the last number it remembered)')
      odo.set(n)
    }
  }
  function sync(force = false) {
    if (life.dead) return
    const raw = ctx.ritual?.state
    const st = live(raw) ? raw : null
    const waking = raw ? raw.loaded === false && !raw.offline : !awake
    renderCounter(raw)
    if (Number.isFinite(st?.online)) setText(onlineOut, fmt(Math.max(1, st.online)))
    if (Number.isFinite(st?.prayers)) setText(prayOut, fmt(st.prayers))
    else if (prayOut.textContent === '…' && !waking) prayOut.textContent = 'the counter is resting'

    if (waking && !force) return
    const wall = Array.isArray(st?.wall) ? st.wall : null
    const wallSig = wall ? JSON.stringify(wall.slice(-12)) : 'none'
    if (force || wallSig !== sig.wall) {
      sig.wall = wallSig
      const items = (wall ?? []).map((w) => ({ text: msgText(w).slice(0, 80), at: msgAt(w) })).filter((w) => w.text.trim())
      const hasTimes = items.some((w) => w.at)
      const ordered = hasTimes ? items.sort((a, b) => (b.at ?? 0) - (a.at ?? 0)) : items.reverse()
      gbList.replaceChildren(...(ordered.length
        ? ordered.slice(0, 10).map((w) => {
            const r = hash(`gb:${w.text}`)
            const when = w.at ? new Date(w.at < 1e12 ? w.at * 1000 : w.at) : null
            return h('li', { class: 'rc-gb__entry' },
              gbLatin ? h('p', { class: 'rc-gb__text rc-gb__text--latin' }, w.text) : h('p', { class: 'rc-gb__text glyph', lang: 'x-cascade' }, w.text),
              h('p', { class: 'rc-gb__meta' }, 'Signed by: a Pilgrim · From: ', D.PLACES[r() % D.PLACES.length], when && !isNaN(when) ? ` · ${when.toDateString()}` : ''),
            )
          })
        : [h('li', { class: 'rc-gb__empty' }, wall ? 'Nobody has signed yet. Be the first!!' : waking ? 'Fetching the signatures from the Cascade…' : 'The guestbook is resting. The signatures are safe inside the Cascade and will be back at the next Repaint.')]))
    }

    const offerings = Array.isArray(st?.offerings) ? st.offerings : null
    const canonSig = offerings ? JSON.stringify(offerings.slice(-5)) : 'none'
    if (force || canonSig !== sig.canon) {
      sig.canon = canonSig
      const recent = (offerings ?? []).filter((o) => o && o.selector && o.property).slice(-5).reverse()
      canonList.replaceChildren(...(recent.length
        ? recent.map((o) => h('li', {}, h('code', {}, `${String(o.selector)} { ${String(o.property)}: ${String(o.value ?? '')}; }`)))
        : [h('li', { class: 'rc-small' }, offerings ? 'No declarations yet. The Canon is waiting for its first word.' : 'The Canon is resting.')]))
    }

    const book = Array.isArray(st?.ascended) ? st.ascended : null
    const bookSig = book ? JSON.stringify(book.slice(-12)) : 'none'
    if (force || bookSig !== sig.book) {
      sig.book = bookSig
      const names = (book ?? []).map(nameOf).filter((n) => n.trim()).slice(-12).reverse()
      bookList.replaceChildren(...(names.length
        ? names.map((n) => h('li', {}, glyphText(n.slice(0, 24), { className: 'rc-book__glyph' }), h('span', { class: 'rc-book__latin' }, ` (${n.slice(0, 24)})`)))
        : [h('li', { class: 'rc-small' }, 'No names yet. The Door is hard to find, and we are not allowed to say where it is.')]))
    }
  }
  // After a schism the layers are already awake and temple:awake will not come again.
  let awake = Boolean(ctx.ritual || ctx.secrets || ctx.audio || ctx.glyphs || ctx.hell)
  life.timeout(() => { if (!awake) { awake = true; sync(true) } }, 6000)
  sync(true)
  life.bus(ctx, 'temple:awake', () => {
    awake = true
    // The altar asks the server for its state when it wakes; look again as the answer arrives.
    for (const ms of [250, 900, 2200]) life.timeout(() => sync(), ms)
  })
  // The altar announces each fresh state (ritual:state); the other events arrive before it has folded
  // them in, so look a moment later. A slow poll covers an altar that says nothing at all.
  life.bus(ctx, 'ritual:state', () => { awake = true; sync() })
  for (const evt of ['server:open', 'server:presence', 'server:prayer', 'server:wall', 'server:offering', 'server:ascended', 'ritual:prayed', 'ritual:offered', 'ritual:inscribed']) {
    life.bus(ctx, evt, (data) => {
      if (evt === 'server:presence' && Number.isFinite(data?.online)) setText(onlineOut, fmt(Math.max(1, data.online)))
      life.timeout(() => sync(), 60)
    })
  }
  life.interval(() => { if (!document.hidden) sync() }, 15000)

  // ---- secret: the counter overflows ------------------------------------------------------------------
  let clicks = []
  life.on(counterBtn, 'click', () => {
    if (counterOverride) return
    const t = performance.now()
    clicks = clicks.filter((c) => t - c < 4000).concat(t)
    if (clicks.length < 7) return
    clicks = []
    counterOverride = true
    counterLabel.textContent = 'You are visitor number'
    odo.set(2147483647, 10)
    counterNote.textContent = '2147483647: the Highest Heaven of hit counters. Please do not click again.'
    life.timeout(() => {
      odo.set(-2147483648, 10)
      counterNote.textContent = 'Oops. You have overflowed the counter. It is negative now. This is fine. It is what the Old Time will do in 2038.'
      mark('recruitment-overflow')
    }, 1800)
    life.timeout(() => {
      counterOverride = false
      renderCounter(ctx.ritual?.state)
    }, 9000)
  })

  // ---- secret: exactly 800 pixels ---------------------------------------------------------------------
  let sizeRaf = 0
  const checkSize = () => {
    sizeRaf = 0
    sizeOut.textContent = `${innerWidth}x${innerHeight}`
    if (innerWidth === 800) {
      sizeNote.textContent = 'PERFECT!! Exactly 800 pixels. The Old Law is pleased with you.'
      mark('recruitment-800')
    } else sizeNote.textContent = ''
  }
  checkSize()
  life.on(window, 'resize', () => { if (!sizeRaf) sizeRaf = requestAnimationFrame(checkSize) })
  life.add(() => cancelAnimationFrame(sizeRaf))

  // ---- secrets typed anywhere: netscape, webmaster -------------------------------------------------------
  function netscape() {
    const on = !root.classList.contains('rc-netscape')
    root.classList.toggle('rc-netscape', on)
    mark('recruitment-netscape')
    toaster.show({
      title: on ? 'Netscape Navigator 3.0' : 'The Present Day',
      body: h('p', {}, on
        ? 'Navigator mode: ON. Grey background, default fonts, no stars: the page as the Old Law first rendered it. Type "netscape" again to come back to the future.'
        : 'Welcome back to the future. The stars have been restored.'),
      ms: 9000,
    })
  }
  function webmaster() {
    const wm = h('div', { class: 'rc-wm' },
      h('div', { class: 'rc-wm__div', 'aria-hidden': 'true' }, h('span', { class: 'rc-wm__face' }, ':)'), h('span', { class: 'rc-wm__tag' }, '<div>')),
      ...D.WEBMASTER_NOTE.map((l) => h('p', {}, l)),
    )
    const clearBtn = h('button', { type: 'button', class: 'rc-btn' }, 'clear: both;')
    const reply = h('p', { class: 'rc-wm__reply', role: 'status' })
    clearBtn.addEventListener('click', () => {
      wm.classList.add('is-cleared')
      clearBtn.disabled = true
      reply.textContent = 'oh. so this is what it is like down here. thank you. nobody has cleared me since 1996. (Absolution.)'
      mark('recruitment-webmaster')
    })
    const box = toaster.show({ title: 'A message from the Webmaster', body: [wm, clearBtn, reply], ms: 0, className: 'rc-toast--webmaster', focus: true })
    return box
  }
  life.bus(ctx, 'behavior:typed', ({ buffer } = {}) => {
    if (typeof buffer !== 'string' || typingInField()) return
    if (buffer.endsWith('netscape')) netscape()
    else if (buffer.endsWith('webmaster')) webmaster()
  })

  // ---- stillness: 7, 33 and 108 seconds -----------------------------------------------------------------
  let membersToasted = false
  function unlockMembers(fresh) {
    members.hidden = false
    welcome.querySelector('.rc-members-link').hidden = false
    ctx.memory.set('recruitment.membersArea', true)
    mark('stillness')
    if (fresh && !membersToasted) {
      membersToasted = true
      toaster.show({
        title: 'You have 1 new message',
        body: [
          h('p', {}, h('b', {}, 'You held still for 33 seconds!'), ' The SECRET MEMBERS-ONLY AREA has been unlocked, just for you.'),
          h('p', {}, h('a', { href: '#rc-members' }, 'Take me there')),
        ],
        ms: 30000,
      })
    }
  }
  life.bus(ctx, 'behavior:still', ({ seconds } = {}) => {
    if (seconds === 7) {
      root.classList.add('rc-watched')
      // The frame stays on screen while you read, so it is the frame that asks.
      navTitle.textContent = 'ARE YOU STILL THERE?'
      statusLine.textContent = 'Are you still there? That is all right. The Cascade is patient.'
    } else if (seconds === 33) {
      unlockMembers(true)
      statusLine.textContent = 'The Webmaster has noticed how still you are. There is something new at the top of the page.'
    } else if (seconds === 108) {
      saver.show()
    }
  })
  const stir = () => {
    root.classList.remove('rc-watched')
    setText(navTitle, 'NAVIGATION')
    if (saver.open) saver.hide()
    if (statusLine.textContent !== 'Document: Done') statusLine.textContent = 'Document: Done'
  }
  life.bus(ctx, 'behavior:stir', stir)
  life.on(window, 'keydown', () => { if (saver.open) saver.hide() })
  life.on(window, 'pointerdown', () => { if (saver.open) saver.hide() })

  // Mercy: stop the karaoke, and let CSS take care of the rest.
  life.bus(ctx, 'mercy:change', ({ on } = {}) => {
    if (on) stopSinging()
    else if (ctx.audio?.summoned) startSinging()
  })

  return () => life.destroy()
}
