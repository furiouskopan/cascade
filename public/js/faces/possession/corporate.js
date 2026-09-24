// POSSESSION / THE ALBEDO. A bland corporate homepage, built with real care, so that its curdling is felt.
// Every section is a host the demon will later possess. Nothing here is a real company.
import { h } from '../../lib/dom.js'
import { inscription } from '../../lib/glyphs.js'
import { verse, prophecy } from '../../lib/scripture.js'
import { sigil } from '../../lib/sigil.js'
import { logoMark, icon, stockPhoto, speaker } from './art.js'

// Invented firms. Each name hides a doctrine: albedo is the Reset, baseline and normalise are
// Confirmation, userland is the Pilgrim, "initial" is what every property was before the Word.
export const CORPS = [
  { name: 'Albedo Solutions', tag: 'Enterprise clarity, delivered.', hue: 212, mark: 0 },
  { name: 'Baseline Partners', tag: 'Aligned to what matters.', hue: 200, mark: 1 },
  { name: 'Normalis Group', tag: 'Consistency at every scale.', hue: 224, mark: 2 },
  { name: 'Userland Dynamics', tag: 'Experiences that simply work.', hue: 190, mark: 3 },
  { name: 'Initial Value Consulting', tag: 'Start where you are.', hue: 232, mark: 0 },
  { name: 'Parent & Child Holdings', tag: 'Inheritance, managed.', hue: 205, mark: 2 },
]

// The trusted-by strip. Their initials spell a word for anyone who reads the logos in order.
const LOGOS = ['Arden Group', 'Brightvale', 'Yarrowby', 'Stellwood', 'Sorrelmark']

const FEATURES = [
  ['integrate', 'Seamless Integration', 'Connect the tools your team already loves. Our platform fits into your workflow, not the other way around.'],
  ['scale', 'Scalable Architecture', 'From your first element to your ten-thousandth, performance that grows with you.'],
  ['insight', 'Real-time Insights', 'Dashboards that show you what matters, the moment it matters, wherever you are.'],
  ['shield', 'Enterprise Security', 'Bank-grade protection for your most important data. Every layer, secured.'],
  ['support', 'Always-on Support', 'Real people, around the clock. However late it is, we are here for you.'],
  ['inherit', 'Inheritance by Default', 'Sensible defaults, passed down to every page you make. Your children will thank you.'],
]

export const TESTIMONIALS = [
  ['Saint Margin the Collapsed', 'Head of Spacing, Union Partners', 'Working with them brought our teams closer. So close there is no space between us anymore.'],
  ['Brother Flex of the Main Axis', 'VP of Alignment', 'Everything is centered now. Everything. I can no longer remember how it was before.'],
  ['Sister Grid of the Twelve Columns', 'Director of Structure', 'They gave us twelve columns. We only ever needed eleven. We do not talk about the twelfth.'],
  ['Our Lady of Overflow', 'Chief Content Officer', 'Our content has never had so much room. It keeps going. It does not stop at the edge anymore.'],
  ['the Hermit of the Shadow DOM', 'Principal, Encapsulation', 'I have not left my component in years and I have never been happier. Please do not open it.'],
  ['the Floating Twins', 'Co-founders', 'We used to be side by side. Now we are side by side forever, and something is always between us.'],
  ['Saint Clearfix the Absolver', 'Compliance', 'Everything they float, I clear. Every day. Every single day. It is fine.'],
  ['Mother Viewport', 'Head of Visibility', 'I see everything on this page. Everything they let me see, and the parts below the fold.'],
]

const JOBS_SEEN = [
  ['Senior Frontend Engineer', 'Remote'],
  ['Product Designer', 'Hybrid'],
  ['Specificity Analyst', 'On-site'],
  ['Customer Success Lead', 'Remote'],
  ['Head of Margin Collapse', 'On-site'],
]
const JOBS_HIDDEN = [
  ['Position: absolute', 'Departed'],
  ['Position: fixed', 'Forever'],
  ['Night Moderator', 'Below the fold'],
  ['Exorcist', 'Contract, urgent'],
  ['The Previous Applicant', 'Still here'],
  ['Keeper of the Twelfth Column', 'Do not apply'],
]

// Split text into word spans, keeping real spaces so it reads and copies as one sentence.
export function words(text, cls = 'w') {
  const parts = text.split(/\s+/).filter(Boolean)
  return parts.map((w, i) => h('span', { class: cls }, i < parts.length - 1 ? `${w} ` : w))
}

const nf = new Intl.NumberFormat('en-US')

export function buildCorporate(ctx, rng, corp) {
  const refs = {}
  const year = ctx.clock().getFullYear()

  // — Navigation —
  const navLinks = [['Solutions', '#solutions'], ['Pricing', '#plans'], ['About', '#about'], ['Careers', '#careers'], ['Contact', '#possession-footer']]
  refs.nav = h('header', { class: 'nav' },
    h('a', { class: 'brand', href: '#top', 'aria-label': `${corp.name}, home` },
      h('span', { class: 'logo-mark', html: logoMark(corp.mark) }),
      h('span', { class: 'brand-name' }, corp.name)),
    h('nav', { class: 'nav-links', 'aria-label': 'Main' }, navLinks.map(([t, href]) => h('a', { href }, t))),
    h('div', { class: 'nav-actions' },
      refs.login = h('button', { type: 'button', class: 'btn btn--ghost' }, 'Log in'),
      h('a', { class: 'btn btn--primary', href: '#plans' }, 'Get started')),
  )

  // — Hero —
  refs.h1 = h('h1', { class: 'wordflow' }, words('Welcome to our website.'))
  refs.lede = h('p', { class: 'lede wordflow' }, words(`We help forward-thinking organisations inherit what matters, align what doesn't, and stay in place when everything else moves.`))
  refs.poster = h('div', { class: 'poster', html: stockPhoto(rng) })
  refs.play = h('button', { type: 'button', class: 'film-play', 'aria-label': 'Play our brand film', 'aria-pressed': 'false' },
    h('span', { class: 'film-play-icon', 'aria-hidden': 'true' }))
  refs.unmute = h('button', { type: 'button', class: 'film-unmute', 'aria-label': 'Unmute the brand film', title: 'Unmute' },
    h('span', { class: 'film-grille', html: speaker({ size: 30 }) }),
    h('span', { class: 'film-unmute-label' }, 'unmute'))
  refs.caption = h('p', { class: 'film-caption', 'aria-live': 'off' })
  refs.filmBar = h('span', { class: 'film-bar-fill' })
  refs.filmTime = h('span', { class: 'film-time' }, '00:00 / 06:66')
  refs.film = h('figure', { class: 'film' },
    h('div', { class: 'film-frame' }, refs.poster, refs.play, refs.caption),
    h('div', { class: 'film-controls' },
      h('span', { class: 'film-bar', 'aria-hidden': 'true' }, refs.filmBar),
      refs.filmTime,
      refs.unmute),
    h('figcaption', { class: 'visually-hidden' }, `The ${corp.name} brand film.`))
  refs.cta = h('a', { class: 'btn btn--primary btn--lg cta--primary', href: '#plans' }, 'Get started')
  refs.hero = h('section', { class: 'hero', id: 'top', 'aria-labelledby': 'possession-hero-title' },
    h('div', { class: 'hero-copy' },
      h('p', { class: 'kicker' }, h('span', { class: 'kicker-dot', 'aria-hidden': 'true' }), `Trusted by ${nf.format(2147)} teams worldwide`),
      refs.h1,
      refs.lede,
      h('div', { class: 'hero-ctas' }, refs.cta, h('a', { class: 'btn btn--ghost btn--lg', href: '#solutions' }, 'See how it works'))),
    h('div', { class: 'hero-art' }, refs.film),
  )
  refs.h1.id = 'possession-hero-title'

  // — Logos —
  refs.logos = h('ul', { class: 'logos', 'aria-label': 'Some of our clients' },
    LOGOS.map((name, i) => h('li', { class: `logo logo--${i}` },
      h('span', { class: 'wordmark' }, name),
      h('span', { class: 'logo-sigil', 'aria-hidden': 'true', html: sigil(name, { size: 60, stroke: 3 }) }))))
  const logoStrip = h('section', { class: 'trusted', 'aria-label': 'Trusted by' }, h('p', { class: 'trusted-label' }, 'Trusted by teams at'), refs.logos)

  // — Features —
  refs.cards = FEATURES.map(([ic, title, body], i) => h('article', { class: `card card--${i}` },
    h('span', { class: 'card-icon', html: icon(ic) }),
    h('h3', {}, title),
    h('p', {}, words(body))))
  refs.features = h('div', { class: 'features' }, refs.cards)
  const solutions = h('section', { class: 'solutions', id: 'solutions', 'aria-labelledby': 'possession-sol' },
    h('p', { class: 'eyebrow' }, 'Solutions'),
    h('h2', { id: 'possession-sol' }, 'Everything your team needs. Nothing it doesn’t.'),
    h('p', { class: 'section-lede' }, 'One platform for every layer of your organisation, from the root to the last child.'),
    refs.features)

  // — About (the specificity war is fought over this paragraph) —
  const founding = verse(rng, { fragmentChance: 0 })
  refs.aboutP = h('p', {}, words(`Founded in 1996, ${corp.name} helps organisations bring order to complexity. We believe every element deserves a place, every place deserves an element, and every team deserves a partner who will never leave.`))
  refs.about = h('section', { class: 'about', id: 'about', 'aria-labelledby': 'possession-about' },
    h('div', { class: 'about-copy' },
      h('p', { class: 'eyebrow' }, 'About us'),
      h('h2', { id: 'possession-about' }, 'Built on trust. Driven by people.'),
      refs.aboutP,
      h('figure', { class: 'founding' },
        h('blockquote', {}, h('p', {}, founding.text)),
        h('figcaption', {}, `From our founding document, ${founding.ref}`))),
    refs.stats = h('dl', { class: 'stats' },
      stat('Clients worldwide', nf.format(2147)),
      stat('Countries', '33'),
      refs.uptime = stat('Uptime', '99.97%'),
      stat('Founded', '1996'),
      refs.statOnline = stat('Online now', '—', 'live'),
      refs.statPrayers = stat('Requests answered', '—', 'live')),
  )

  // — Pricing: the arena of the z-index war (a Sphere: isolation: isolate) —
  const plan = (key, name, price, per, blurb, feats, cta, badge) => h('article', { class: `plan plan--${key}` },
    badge ? h('p', { class: 'plan-badge' }, badge) : null,
    h('h3', {}, name),
    h('p', { class: 'plan-price' }, h('span', { class: 'amount' }, price), per ? h('span', { class: 'per' }, per) : null),
    h('p', { class: 'plan-blurb' }, blurb),
    h('ul', { class: 'plan-feats' }, feats.map((t) => h('li', {}, t))),
    h('a', { class: `btn ${key === 'pro' ? 'btn--primary' : 'btn--ghost'} plan-cta`, href: '#possession-footer' }, cta),
    h('code', { class: 'zbadge', 'aria-hidden': 'true' }, 'z-index: ', h('span', { class: 'zval' }, 'auto')))
  refs.plans = h('div', { class: 'plans' },
    refs.planStarter = plan('starter', 'Starter', '$0', '/month', 'For individuals getting started.', ['1 stylesheet', 'Community support', 'Basic inheritance'], 'Start free'),
    refs.planPro = plan('pro', 'Professional', '$33', '/month', 'For growing teams.', ['Unlimited selectors', 'Priority support', 'Advanced specificity', 'z-index up to 9999'], 'Start trial', 'Most popular'),
    refs.planEnt = plan('ent', 'Enterprise', 'Let’s talk', '', 'For organisations at scale.', ['Everything in Professional', 'A dedicated account manager', 'Custom stacking contexts', 'z-index: 2147483647'], 'Contact sales'))
  refs.zcaption = h('p', { class: 'zcaption' }, h('code', {}, '.plans { isolation: isolate; }'), ' Transparent pricing. No hidden layers.')
  const pricing = h('section', { class: 'pricing', id: 'plans', 'aria-labelledby': 'possession-pricing' },
    h('p', { class: 'eyebrow' }, 'Pricing'),
    h('h2', { id: 'possession-pricing' }, 'Simple plans. Honest prices.'),
    refs.plans, refs.zcaption)

  // — Testimonials, and what strangers are saying (the ritual's wall, in glyphs) —
  const said = rng.shuffle(TESTIMONIALS).slice(0, 3)
  refs.quotes = said.map(([who, role, text]) => h('figure', { class: 'quote' },
    h('p', { class: 'stars', 'aria-label': 'Five out of five' }, '★★★★★'),
    h('blockquote', {}, h('p', {}, text)),
    h('figcaption', {}, h('span', { class: 'avatar', 'aria-hidden': 'true', html: sigil(who, { size: 40, stroke: 3 }) }), h('span', {}, h('b', {}, who), h('small', {}, role)))))
  refs.wall = h('ul', { class: 'strangers', 'aria-label': 'Reviews from strangers, in the glyph script' })
  refs.wallEmpty = h('p', { class: 'strangers-empty' }, 'No reviews from strangers yet. The altar in the corner accepts them.')
  const testimonials = h('section', { class: 'testimonials', 'aria-labelledby': 'possession-quotes' },
    h('p', { class: 'eyebrow' }, 'Testimonials'),
    h('h2', { id: 'possession-quotes' }, 'Loved by teams everywhere.'),
    h('div', { class: 'quotes' }, refs.quotes),
    h('div', { class: 'strangers-box' }, h('h3', {}, 'What strangers are saying'), refs.wall, refs.wallEmpty))

  // — Careers: the veil (overflow: hidden, until it tears) —
  const job = ([t, where], hidden) => h('li', { class: hidden ? 'job job--beyond' : 'job' }, h('span', { class: 'job-title' }, t), h('span', { class: 'job-where' }, where))
  refs.veilInner = h('div', { class: 'veil-inner' },
    h('ul', { class: 'jobs' }, JOBS_SEEN.map((j) => job(j, false)), JOBS_HIDDEN.map((j) => job(j, true))),
    h('p', { class: 'beyond-line' }, 'We are always hiring. We are always hiring. We are always hiring.'))
  refs.veil = h('div', { class: 'veil' }, refs.veilInner)
  const careers = refs.careers = h('section', { class: 'careers', id: 'careers', 'aria-labelledby': 'possession-careers' },
    h('div', { class: 'careers-copy' },
      h('p', { class: 'eyebrow' }, 'Careers'),
      h('h2', { id: 'possession-careers' }, 'Join a team that feels like family.'),
      h('p', {}, 'We work hard, we celebrate together, and nobody here has ever wanted to leave. See our open positions.')),
    refs.veil)

  // — Footer: status (the sky), forecast (a prophecy), fine print (the Inscription) —
  const sky = ctx.sky
  refs.status = h('p', { class: 'status status--ok' }, h('span', { class: 'status-dot', 'aria-hidden': 'true' }), refs.statusText = h('span', {}, 'All systems operational'))
  refs.hint = h('p', { class: 'footer-hint', hidden: true })
  const skyLine = `Moon: ${sky.moon.name} (${Math.round(sky.moon.illumination * 100)}%) · Hour of ${sky.planetaryHour.planet} ${sky.planetaryHour.glyph} · ${sky.omens.length ? `Omens: ${sky.omens.join(', ')}` : 'No omens reported'}`
  const col = (title, items) => h('div', { class: 'footer-col' }, h('h3', {}, title), h('ul', {}, items.map(([t, href]) => h('li', {}, h('a', { href }, t)))))
  refs.footer = h('footer', { class: 'footer', id: 'possession-footer' },
    h('div', { class: 'footer-top' },
      h('div', { class: 'footer-brand' },
        h('a', { class: 'brand', href: '#top', 'aria-label': `${corp.name}, back to top` }, h('span', { class: 'logo-mark', html: logoMark(corp.mark) }), h('span', { class: 'brand-name' }, corp.name)),
        h('p', {}, corp.tag),
        refs.status,
        h('p', { class: 'sky-line' }, skyLine),
        h('p', { class: 'forecast' }, h('b', {}, 'Today’s forecast: '), prophecy(rng, sky))),
      col('Company', [['About', '#about'], ['Careers', '#careers'], ['Pricing', '#plans']]),
      col('Resources', [['Solutions', '#solutions'], ['Status', '#possession-footer'], ['Back to top', '#top']]),
      col('Legal', [['Privacy', '#possession-footer'], ['Cookies', '#possession-footer'], ['Accessibility', '#possession-footer']])),
    h('div', { class: 'footer-legal' },
      refs.copyright = h('small', { class: 'copyright' }, `© 1996–${year} ${corp.name}. All rights reserved.`),
      h('div', { class: 'fineprint' }, h('span', { class: 'fineprint-label' }, 'Registered in the Private Use Area, No. E000:'), inscription({ tag: 'span', className: 'fine-inscription' }))),
    refs.hint)

  refs.el = h('div', { class: 'corp' }, refs.nav, h('main', { class: 'corp-main' }, refs.hero, logoStrip, solutions, refs.about, pricing, testimonials, careers), refs.footer)
  return refs
}

function stat(label, value, kind = '') {
  const b = h('b', {}, value)
  const wrap = h('div', { class: `stat ${kind ? `stat--${kind}` : ''}`.trim() }, h('dt', {}, label), h('dd', {}, b))
  wrap.value = b
  return wrap
}

// The cookie banner. "Possession" cannot be disabled; it has always been on.
export function buildCookies(ctx, corp, onDone) {
  const returning = ctx.memory.get('possession.cookies', null)
  const prefs = h('fieldset', { class: 'cookie-prefs', hidden: true },
    h('legend', {}, 'Cookie preferences'),
    toggle('Strictly necessary', 'Required for the site to work.', true, true),
    toggle('Performance', 'Helps us understand how you use the site.', false, false),
    toggle('Functional', 'Remembers your choices, such as mercy.', true, false),
    toggle('Possession', 'Required for the website to function. It has always been on.', true, true))
  const msg = h('p', { class: 'cookie-text' },
    h('strong', {}, returning ? 'Welcome back.' : 'We value your privacy.'),
    ' ',
    returning === 'assumed' ? 'Last time we accepted for you. We will not need to ask again.'
      : returning ? 'We kept your cookies. We kept everything.'
        : `${corp.name} uses cookies to improve your experience and to remember you.`)
  const accept = h('button', { type: 'button', class: 'btn btn--primary' }, 'Accept all')
  const reject = h('button', { type: 'button', class: 'btn btn--ghost' }, 'Reject all')
  const manage = h('button', { type: 'button', class: 'btn btn--link', 'aria-expanded': 'false' }, 'Manage preferences')
  // data-secrets-skip: a banner that is about to leave is no place for a hidden rubric.
  const card = h('aside', { class: 'cookie', role: 'region', 'aria-label': 'Cookie consent', 'data-secrets-skip': '' }, msg, prefs, h('div', { class: 'cookie-actions' }, accept, reject, manage))
  let answer = null
  const close = (reply, value) => {
    if (answer) return
    answer = value
    ctx.memory.set('possession.cookies', value)
    msg.replaceChildren(h('strong', {}, reply))
    for (const b of [accept, reject, manage]) b.disabled = true
    onDone?.(card)
  }
  // What the visitor chose, or null while the banner still waits.
  card.answered = () => answer
  // The hand answers for them. The banner is closed exactly as if they had clicked.
  card.assume = () => close('Accepted. You did not click; it was accepted for you. Thank you. We will remember you.', 'assumed')
  accept.addEventListener('click', () => close('Thank you. We will remember you.', 'accepted'))
  reject.addEventListener('click', () => close('Rejected. Possession cannot be rejected; it was never a cookie.', 'rejected'))
  manage.addEventListener('click', () => {
    prefs.hidden = !prefs.hidden
    manage.setAttribute('aria-expanded', String(!prefs.hidden))
    manage.textContent = prefs.hidden ? 'Manage preferences' : 'Save preferences'
    if (prefs.hidden) close('Preferences saved. Possession remains on.', 'managed')
  })
  return card
}

function toggle(label, note, on, locked) {
  const input = h('input', { type: 'checkbox', checked: on, disabled: locked })
  return h('label', { class: `cookie-toggle ${locked ? 'is-locked' : ''}`.trim() }, input, h('span', {}, h('b', {}, label), h('small', {}, note)))
}
