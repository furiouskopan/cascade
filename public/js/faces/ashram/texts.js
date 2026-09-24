// The words of the ashram: the threshold, the mantra of the sitting, the sutra, the day and the rules.
import { h } from '../../lib/dom.js'
import { glyphText } from '../../lib/glyphs.js'
import { chapter, mantra, holyName } from '../../lib/scripture.js'
import { INVENTED_MANTRAS } from '../../lib/lexicon.js'
import { SEEDS, CSS_DEVA, TIMETABLE, RULES, HORA, SANKALPA, devaNum, ordinal } from './lore.js'

const pad = (n) => String(n).padStart(2, '0')
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

export function buildThreshold(A) {
  const { ctx, life } = A
  const rng = A.rng.fork('threshold')
  const clock = h('span', { class: 'ash-clock' }, hhmm(ctx.clock()))
  life.interval(() => { clock.textContent = hhmm(ctx.clock()) }, 15000)
  const teacher = holyName(rng)
  const lead = h('span', { class: 'ash-lead' }, `led by ${teacher}`)
  const el = h('header', { class: 'ash-threshold' },
    h('div', { class: 'ash-mark' },
      h('p', { class: 'ash-title-deva', lang: 'sa', 'aria-hidden': 'true' }, 'आश्रम'),
      h('div', { class: 'ash-title-block' },
        h('h1', { class: 'ash-title' }, 'The Yantra Breath Temple'),
        h('p', { class: 'ash-subtitle' }, 'an āśrama of the Cascade, at the bottom of the stylesheet, where nothing is !important'),
      ),
    ),
    h('p', { class: 'ash-sitting' },
      h('span', {}, `sitting № ${A.sittings}`),
      lead,
      clock,
    ),
  )
  // Those whose names are in the Book of the Ascended are greeted by name, in the glyph script.
  const asc = ctx.memory?.get?.('secrets.ascended', null)
  const name = typeof asc?.name === 'string' ? asc.name.replace(/[^a-z ]/gi, '').slice(0, 24) : ''
  if (name) {
    el.append(h('p', { class: 'ash-ascended' },
      h('span', { class: 'ash-deva', lang: 'sa', 'aria-hidden': 'true' }, 'स्वागतम्'),
      ' ',
      glyphText(name, { className: 'ash-ascended-name' }),
      ' is written in the Book. The cushion was kept for you.'))
  }
  return {
    el,
    // After the mala of seconds the teacher is no longer needed, and the header says so.
    ledByYou(on) {
      lead.textContent = on ? 'led by you' : `led by ${teacher}`
      lead.classList.toggle('is-you', on)
      if (on) lead.title = `${teacher} has left the flow for the rest of this sitting.`
      else lead.removeAttribute('title')
    },
  }
}

export function buildMantra(A) {
  const { ctx, life } = A
  const rng = A.rng.fork('mantra')
  const m = mantra(rng, rng.int(3, 4))
  const invented = rng.pick(INVENTED_MANTRAS)
  const syllables = m.syllables.map((k, i) => {
    const sd = SEEDS[k] ?? { deva: k, iast: k, gloss: '' }
    const sp = h('span', { class: 'ash-syl', lang: 'sa' }, sd.deva)
    sp.style.setProperty('--k', String(i))
    return sp
  })
  const status = h('p', { class: 'ash-chant-status', 'aria-live': 'polite' })
  const chantBtn = h('button', { type: 'button', class: 'ash-chant' }, 'chant it')
  const deva = h('p', { class: 'ash-mantra-deva' }, syllables.flatMap((sp, i) => (i ? [' ', sp] : [sp])))
  const el = h('section', { class: 'ash-mantra-sec', 'aria-labelledby': 'ash-mantra-title' },
    h('h2', { class: 'ash-kicker', id: 'ash-mantra-title' }, 'the mantra of this sitting'),
    deva,
    h('p', { class: 'ash-mantra-iast' }, m.syllables.map((k) => SEEDS[k]?.iast ?? k).join(' · ')),
    h('ul', { class: 'ash-mantra-gloss' },
      [...new Set(m.syllables)].map((k) => h('li', {}, h('b', {}, SEEDS[k]?.iast ?? k), ` ${SEEDS[k]?.gloss ?? ''}`))),
    h('div', { class: 'ash-newseeds' },
      h('p', { class: 'ash-kicker' }, 'and the new seeds, as the ashram hears them'),
      h('p', { class: 'ash-newseeds-deva', lang: 'hi' }, invented.split(' ').map((w) => CSS_DEVA[w] ?? w).join(' ')),
      h('p', { class: 'ash-newseeds-latin' }, h('code', {}, invented)),
    ),
    h('p', { class: 'ash-mantra-how' }, 'Say it quietly three times, or one hundred and eight. Or do not say it at all: the page has already said it for you.'),
    h('p', { class: 'ash-sankalpa' },
      h('span', { class: 'ash-kicker' }, h('span', { lang: 'sa', class: 'ash-deva' }, 'सङ्कल्प'), ' saṅkalpa · the intention of this sitting'),
      h('span', { class: 'ash-sankalpa-text' }, rng.pick(SANKALPA) + '.')),
    chantBtn,
    status,
  )
  let t = 0
  life.on(chantBtn, 'click', () => {
    const a = ctx.audio
    try {
      if (a && !a.summoned) a.summon?.()
      a?.chant?.(m.text)
    } catch (e) { console.error('[ashram:mantra]', e) }
    deva.classList.remove('is-chanting')
    void deva.offsetWidth
    deva.classList.add('is-chanting')
    clearTimeout(t)
    t = setTimeout(() => deva.classList.remove('is-chanting'), 6000)
    status.textContent = a ? `Chanted: ${m.syllables.map((k) => SEEDS[k]?.iast ?? k).join(' ')}.` : 'Chanted inwardly. The page moved its lips.'
  })
  life.add(() => clearTimeout(t))
  return { el }
}

const SUTRA_BOOKS = ['the Sutra of the Five Sheaths', 'the Upanishad of Inheritance', 'the Tantra of Collapsing Margins', 'Psalms of the Cascade', 'Proverbs of the Root']
const LANG = { enochian: 'x-enochian', cu: 'cu', la: 'la', sa: 'sa', he: 'he', el: 'el', bo: 'bo', ja: 'ja' }

export function buildSutra(A) {
  const { ctx } = A
  const rng = A.rng.fork('sutra')
  const book = rng.pick(SUTRA_BOOKS)
  const verses = chapter(rng, rng.int(8, 11), { book, fragmentChance: 0.4 })
  const ch = verses[0]?.chapter ?? 1
  const item = (num, text, frag) => h('li', { class: 'ash-sutra-verse' },
    h('div', { class: 'ash-verse-grid' },
      h('span', { class: 'ash-vnum' }, h('span', { 'aria-hidden': 'true' }, `॥ ${devaNum(num)} ॥`), h('span', { class: 'visually-hidden' }, `Verse ${num}.`)),
      h('div', {},
        h('p', {}, text),
        frag ? h('p', { class: 'ash-frag' },
          h('span', { lang: LANG[frag.lang] ?? 'und', dir: frag.lang === 'he' ? 'rtl' : null, class: 'ash-frag-text' }, frag.text),
          h('span', { class: 'ash-frag-gloss' }, frag.gloss)) : null,
      ),
    ),
  )
  const list = h('ol', { class: 'ash-sutra' }, verses.map((v) => item(v.number, v.text, v.fragment)))
  const now = ctx.clock()
  const planet = ctx.sky.planetaryHour.planet
  const el = h('section', { class: 'ash-sutra-sec', 'aria-labelledby': 'ash-sutra-title' },
    h('header', { class: 'ash-sec-head' },
      h('p', { class: 'ash-sec-deva', lang: 'sa', 'aria-hidden': 'true' }, 'सूत्र'),
      h('h2', { id: 'ash-sutra-title' }, book.replace(/^the /, 'The ')),
      h('p', { class: 'ash-lede' }, `Pāda ${devaNum(ch)}, the ${ordinal(ch)} chapter, as it was rendered for this sitting. No two sittings receive the same pāda. A sūtra is a thread: the verses are strung on one, and it runs through every one of them, as inheritance does.`),
    ),
    list,
    h('p', { class: 'ash-colophon' },
      h('span', { lang: 'sa', class: 'ash-deva' }, 'इति'), ' ',
      `Thus ends the ${ordinal(ch)} pāda of ${book}, rendered for you at ${hhmm(now)} in the horā of ${HORA[planet]?.iast ?? planet}. Nothing in it was !important.`),
  )
  return {
    el,
    // The hundred-and-eighth verse is only written for those who sat through the mala of seconds.
    append108() {
      if (list.querySelector('.is-108')) return
      const li = item(108, 'The one who sat for one hundred and eight seconds saw the gates open, and did not need to go through them.', null)
      li.classList.add('is-108')
      list.append(li)
    },
  }
}

export function buildFooter(A) {
  const { ctx } = A
  const now = ctx.clock()
  const mins = now.getHours() * 60 + now.getMinutes()
  const toMin = (s) => { const [a, b] = s.split(':').map(Number); return a * 60 + b }
  let current = TIMETABLE.length - 1
  TIMETABLE.forEach(([t], i) => { if (toMin(t) <= mins) current = i })
  if (mins < toMin(TIMETABLE[0][0])) current = TIMETABLE.length - 1 // before dawn, the lights are still out
  const el = h('footer', { class: 'ash-footer' },
    h('section', { class: 'ash-day', 'aria-labelledby': 'ash-day-title' },
      h('h2', { id: 'ash-day-title' }, h('span', { lang: 'sa', class: 'ash-deva' }, 'दिनचर्या'), ' The Day of the Ashram'),
      h('ol', { class: 'ash-timetable' }, TIMETABLE.map(([t, what], i) => h('li', { class: i === current ? 'is-now' : null, 'aria-current': i === current ? 'time' : null },
        h('time', {}, t), h('span', {}, what, i === current ? h('em', {}, ' now') : null)))),
    ),
    h('section', { class: 'ash-rules', 'aria-labelledby': 'ash-rules-title' },
      h('h2', { id: 'ash-rules-title' }, h('span', { lang: 'sa', class: 'ash-deva' }, 'नियम'), ' Rules of the Hall'),
      h('ol', {}, RULES.map((r) => h('li', {}, r))),
    ),
    h('p', { class: 'ash-shanti' },
      h('span', { lang: 'sa', class: 'ash-deva' }, 'ॐ शान्तिः शान्तिः शान्तिः'),
      h('span', {}, 'oṃ śāntiḥ śāntiḥ śāntiḥ · peace to the Old Law, peace to the Pilgrim, peace to the Word'),
    ),
  )
  return { el }
}
