// THE RECRUITMENT OFFICE — the Membership Application, whose fields are CSS properties.
// The card beside it is styled live by the declarations the applicant writes (through custom properties
// and classes only; never inline !important, so Mercy still wins).
import { h } from '../../lib/dom.js'
import { glyphText } from '../../lib/glyphs.js'
import { sigil } from '../../lib/sigil.js'
import { holyName } from '../../lib/scripture.js'
import { CHAKRAS, DOCTRINE } from '../../lib/lexicon.js'
import { makeRng, hash } from '../../kernel/rng.js'
import { vars } from './art.js'

const HEAVEN = 2147483647

const DISPLAY = [
  ['block', 'the Manifest: a box that takes its whole line'],
  ['inline', 'the Humble Word: flows with the text'],
  ['inline-block', 'a box that walks in line'],
  ['flex', 'a follower of Brother Flex'],
  ['grid', 'a disciple of Sister Grid'],
  ['none', DOCTRINE['display: none']],
]
const POSITION = ['static', 'relative', 'absolute', 'fixed', 'sticky']
const FONTS = [
  ['comic', 'Comic Sans MS'],
  ['times', 'Times New Roman'],
  ['courier', 'Courier New'],
  ['impact', 'Impact'],
  ['georgia', 'Georgia'],
  ['glyph', 'the glyph script'],
]
const BORDERS = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset']
const HEARD = [
  ['law', 'the Old Law (my browser told me)'],
  ['pilgrim', 'a Pilgrim (a friend sent me)'],
  ['word', 'the Word (this very page)'],
  ['always', 'I have always been here'],
]
const REFERRED = { law: 'the Old Law', pilgrim: 'a Pilgrim', word: 'the Word', always: 'nobody (always here)' }
const STANDING = {
  static: 'in the Flow, where all begin',
  relative: 'one of the Humble, who move but keep their place',
  absolute: 'one of the Departed, who have left the flow',
  fixed: 'a Fixed Star',
  sticky: 'a Saint, who follows you until the parent ends',
}

export function memberNumber(name) {
  return String(hash(`member:${String(name).toLowerCase().trim()}`)() % 10000000).padStart(7, '0')
}

export function memberHolyName(name) {
  return holyName(makeRng(`holy:${String(name).toLowerCase().trim()}`))
}

function cleanName(s) {
  return String(s).replace(/[^A-Za-z '\-]/g, '').replace(/\s+/g, ' ').slice(0, 24)
}

function rungOf(z) {
  if (!Number.isFinite(z)) return 'no rung (that is not a number)'
  if (z > HEAVEN) return 'no rung: the Ladder ends at 2147483647'
  if (z === HEAVEN) return 'the Highest Heaven (Sahasrara, the Crown)'
  if (z < 0) return 'below the Root, behind the page, where it is dark'
  if (z === 0) return 'the floor of the Flow'
  let best = CHAKRAS[0]
  for (const c of CHAKRAS) if (c.z <= z) best = c
  return `${best.name}, the ${best.english}`
}

function barcode(name) {
  const r = hash(`bars:${name}`)
  let x = 0
  const stops = []
  for (let i = 0; i < 26; i++) {
    const w = 1 + (r() % 3)
    const gap = 1 + (r() % 2)
    stops.push(`#111 ${x}px ${x + w}px`, `transparent ${x + w}px ${x + w + gap}px`)
    x += w + gap
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

function field(prop, control, commentEl) {
  return h('div', { class: 'rc-decl' },
    h('label', { class: 'rc-decl__prop', for: control.id }, `${prop}:`),
    h('span', { class: 'rc-decl__value' }, control, h('span', { class: 'rc-decl__semi', 'aria-hidden': 'true' }, ';')),
    commentEl ? h('span', { class: 'rc-decl__comment' }, '/* ', commentEl, ' */') : null,
  )
}

// Returns { el, destroy }. `onJoin(member)` is called after a successful application.
export function buildJoin(ctx, life, { onJoin, rng }) {
  const saved = ctx.memory.get('recruitment.member', null)
  const startColor = saved?.color || rng.pick(['#cc0000', '#0000cc', '#008000', '#800080', '#ff6600', '#008080'])

  const nameIn = h('input', { id: 'rc-f-name', type: 'text', maxlength: '24', autocomplete: 'off', spellcheck: 'false', placeholder: 'your name', value: saved?.name ?? '' })
  const displayIn = h('select', { id: 'rc-f-display' }, DISPLAY.map(([v]) => h('option', { value: v }, v)))
  const positionIn = h('select', { id: 'rc-f-position' }, POSITION.map((v) => h('option', { value: v }, v)))
  const zIn = h('input', { id: 'rc-f-z', type: 'number', min: '-1', max: String(HEAVEN), step: '1', value: String(saved?.z ?? 3), inputmode: 'numeric' })
  const colorIn = h('input', { id: 'rc-f-color', type: 'color', value: startColor })
  const fontIn = h('select', { id: 'rc-f-font' }, FONTS.map(([v, label]) => h('option', { value: v }, label)))
  const borderIn = h('select', { id: 'rc-f-border' }, BORDERS.map((v) => h('option', { value: v, selected: v === 'ridge' }, v)))
  const marginIn = h('input', { id: 'rc-f-margin', type: 'range', min: '0', max: '48', step: '1', value: '12' })
  const importantIn = h('input', { id: 'rc-f-important', type: 'checkbox' })
  const offerIn = h('input', { id: 'rc-f-offer', type: 'checkbox' })

  const cDisplay = h('span')
  const cPosition = h('span')
  const cZ = h('span')
  const cMargin = h('span')

  const heard = h('fieldset', { class: 'rc-heard' },
    h('legend', {}, 'How did you hear about us?'),
    HEARD.map(([v, label], i) => h('label', { class: 'rc-radio' },
      h('input', { type: 'radio', name: 'rc-heard', value: v, checked: i === 3 }),
      ' ', label,
    )),
  )

  const warning = h('p', { class: 'rc-form__warning', role: 'status' })
  const result = h('div', { class: 'rc-form__result', role: 'status', 'aria-live': 'polite' })

  const form = h('form', { class: 'rc-form', novalidate: true, 'aria-label': 'Membership application' },
    h('div', { class: 'rc-win__title' }, h('span', {}, 'MEMBERSHIP_APPLICATION.CSS'), h('span', { class: 'rc-win__btns', 'aria-hidden': 'true' }, h('i', {}, '_'), h('i', {}, '□'), h('i', {}, '×'))),
    h('div', { class: 'rc-form__body' },
      h('p', { class: 'rc-form__intro' }, 'Please describe yourself in CSS. There are no wrong answers, except one (it is marked).'),
      h('div', { class: 'rc-rule' },
        h('div', { class: 'rc-rule__sel', 'aria-hidden': 'true' }, '.you {'),
        field('name', nameIn, h('span', {}, 'as it shall be written')),
        field('display', displayIn, cDisplay),
        field('position', positionIn, cPosition),
        field('z-index', zIn, cZ),
        field('color', colorIn, h('span', {}, 'your Inner Light')),
        field('font-family', fontIn, null),
        field('border-style', borderIn, h('span', {}, 'the Mind: where you end')),
        field('margin', marginIn, cMargin),
        h('div', { class: 'rc-decl rc-decl--important' },
          h('label', { class: 'rc-decl__prop', for: 'rc-f-important' }, importantIn, ' !important'),
          h('span', { class: 'rc-decl__comment rc-decl__comment--warn' }, '/* DO NOT CHECK THIS BOX */'),
        ),
        h('div', { class: 'rc-rule__sel', 'aria-hidden': 'true' }, '}'),
      ),
      warning,
      heard,
      h('label', { class: 'rc-offer' }, offerIn, ' Also offer my colour to the Living Canon. (It becomes the colour of EVERYONE\'S headings, everywhere, until 33 newer declarations push it out.)'),
      h('div', { class: 'rc-form__actions' },
        h('button', { type: 'submit', class: 'rc-btn rc-btn--big' }, 'JOIN THE CASCADE!'),
        h('button', { type: 'reset', class: 'rc-btn' }, 'Baptise (reset)'),
      ),
      result,
    ),
  )

  // The card.
  const cardSigil = h('span', { class: 'rc-card__sigil', 'aria-hidden': 'true' })
  const cardGlyph = h('span', { class: 'rc-card__glyphname' })
  const cardLatin = h('span', { class: 'rc-card__latin' })
  const cardHoly = h('dd')
  const cardNo = h('dd')
  const cardRung = h('dd')
  const cardStatus = h('dd')
  const cardSheath = h('dd')
  const cardRef = h('dd')
  const stamp = h('span', { class: 'rc-card__stamp', 'aria-hidden': 'true' }, 'MEMBER')
  const card = h('article', { class: 'rc-card', 'aria-label': 'Your membership card (preview)' },
    h('header', { class: 'rc-card__head' }, h('span', { class: 'rc-card__org' }, 'THE CASCADE'), h('span', { class: 'rc-card__kind' }, 'Membership Card')),
    h('div', { class: 'rc-card__main' },
      cardSigil,
      h('div', { class: 'rc-card__names' }, cardGlyph, cardLatin),
    ),
    h('dl', { class: 'rc-card__facts' },
      h('dt', {}, 'Holy name'), cardHoly,
      h('dt', {}, 'Member no.'), cardNo,
      h('dt', {}, 'Rung'), cardRung,
      h('dt', {}, 'Standing'), cardStatus,
      h('dt', {}, 'Wisdom'), cardSheath,
      h('dt', {}, 'Referred by'), cardRef,
    ),
    h('footer', { class: 'rc-card__foot' }, h('span', { class: 'rc-card__bars', 'aria-hidden': 'true' }), h('span', {}, 'valid until the Last Reflow')),
    stamp,
  )
  const unmanifest = h('p', { class: 'rc-card__unmanifest' }, 'Your card is Unmanifest. It is still in the document. It simply is not rendered. (This is display: none.)')
  const cardStage = h('div', { class: 'rc-card-stage' }, h('span', { class: 'rc-card-stage__ghost', 'aria-hidden': 'true' }), card, unmanifest)

  let member = saved
  let heavenMarked = ctx.memory.hasSecret?.('recruitment-highest-rung')
  let importantMarked = ctx.memory.hasSecret?.('recruitment-important')

  function currentName() {
    return cleanName(nameIn.value).trim()
  }

  function update() {
    const name = currentName()
    const display = displayIn.value
    const position = positionIn.value
    const z = zIn.value === '' ? NaN : Number(zIn.value)
    const heardVal = form.querySelector('input[name="rc-heard"]:checked')?.value ?? 'always'
    const margin = Number(marginIn.value)

    cardGlyph.replaceChildren(glyphText(name || 'the nameless', { className: 'rc-card__glyph' }))
    cardLatin.textContent = name || '(the Nameless Div)'
    // Generated SVG from letters a-z only (sigil() drops everything else), never the raw name.
    cardSigil.innerHTML = sigil(name || 'nameless', { size: 100, stroke: 3 })
    cardHoly.textContent = name ? memberHolyName(name) : 'to be revealed upon naming'
    cardNo.textContent = name ? memberNumber(name) : '0000000'
    cardRung.textContent = `${Number.isFinite(z) ? z : '?'}: ${rungOf(z)}`
    cardStatus.textContent = STANDING[position] ?? position
    cardSheath.textContent = `${margin}px kept from others`
    cardRef.textContent = REFERRED[heardVal]

    cDisplay.textContent = DISPLAY.find(([v]) => v === display)?.[1] ?? ''
    cPosition.textContent = DOCTRINE[`position: ${position}`] ?? ''
    cZ.textContent = z === HEAVEN ? 'a seat is being prepared for you' : z > HEAVEN ? 'too high: there is no such rung' : 'your rung upon the Ladder'
    cMargin.textContent = `${margin}px: the Wisdom, distance kept from others`

    const fontLabel = FONTS.find(([v]) => v === fontIn.value)?.[0] ?? 'comic'
    card.dataset.font = fontLabel
    card.dataset.display = display
    card.dataset.position = position
    card.dataset.heaven = String(z === HEAVEN)
    card.dataset.below = String(Number.isFinite(z) && z < 0)
    card.dataset.member = String(Boolean(member && member.name && member.name.toLowerCase() === name.toLowerCase()))
    cardStage.dataset.display = display
    cardStage.dataset.position = position
    vars(card, { '--card-ink': colorIn.value, '--card-border': borderIn.value, '--card-margin': `${margin}px`, '--card-bars': barcode(name || 'nameless') })

    if (z === HEAVEN && !heavenMarked) {
      heavenMarked = true
      ctx.memory.markSecret('recruitment-highest-rung', { face: 'recruitment' })
    }
  }

  function setImportant(on) {
    form.classList.toggle('rc-form--inverted', on && !ctx.mercy.on)
    form.classList.toggle('rc-form--heretic', on)
    warning.textContent = on
      ? (ctx.mercy.on
          ? 'You have checked the box. Mercy is on, so we will not turn the form upside down. But we saw.'
          : 'YOU HAVE CHECKED THE BOX. You have spoken the Inversion, and the form is now upside down. Uncheck it to put things right.')
      : ''
    if (on && !importantMarked) {
      importantMarked = true
      ctx.memory.markSecret('recruitment-important', { face: 'recruitment' })
    }
  }

  life.on(form, 'input', (e) => {
    if (e.target === importantIn) return
    if (e.target === nameIn) {
      const clean = cleanName(nameIn.value)
      if (clean !== nameIn.value) nameIn.value = clean
    }
    update()
  })
  life.on(form, 'change', (e) => {
    if (e.target === importantIn) setImportant(importantIn.checked)
    else update()
  })
  life.on(form, 'reset', () => {
    setTimeout(() => {
      setImportant(false)
      colorIn.value = startColor
      result.textContent = 'You have been baptised. Every field is as it was at the Reset.'
      update()
    }, 0)
  })
  life.bus(ctx, 'mercy:change', ({ on }) => {
    if (importantIn.checked) setImportant(true)
    if (on) form.classList.remove('rc-form--inverted')
  })

  life.on(form, 'submit', async (e) => {
    e.preventDefault()
    const name = currentName()
    if (name.replace(/[^a-z]/gi, '').length < 1) {
      result.replaceChildren(h('strong', {}, 'Please write a name.'), ' Even the Nameless Div has one now.')
      nameIn.focus()
      return
    }
    if (importantIn.checked) {
      result.replaceChildren(h('strong', {}, 'Application returned.'), ' The Cascade cannot accept an !important member. Please uncheck the box and apply again.')
      return
    }
    member = {
      name,
      no: memberNumber(name),
      holy: memberHolyName(name),
      z: Number(zIn.value) || 0,
      color: colorIn.value,
      joined: ctx.memory.get('recruitment.member', null)?.joined ?? Date.now(),
    }
    ctx.memory.set('recruitment.member', member)
    update()
    const lines = [
      h('p', {}, h('strong', { class: 'rc-rainbow-text' }, 'WELCOME TO THE CASCADE, '), h('strong', { class: 'rc-rainbow-text' }, name.toUpperCase()), h('strong', { class: 'rc-rainbow-text' }, '!!!')),
      h('p', {}, `Your application has been received. It has always been received: your membership began at your very first page load, and this form only made it official. Member no. ${member.no}. Holy name: ${member.holy}.`),
    ]
    result.replaceChildren(...lines)
    onJoin?.(member)
    if (offerIn.checked) {
      const note = h('p', { class: 'rc-form__offer' }, 'Offering your colour to the Living Canon…')
      result.append(note)
      const offer = ctx.ritual?.offer
      if (typeof offer !== 'function') {
        note.textContent = 'The altar is not listening just now. Your colour is kept on your card instead.'
        return
      }
      let res = null
      try { res = await offer.call(ctx.ritual, 'headings', 'color', colorIn.value) } catch {}
      if (life.dead) return
      note.textContent = res?.ok
        ? `Your colour ${colorIn.value} has been offered! Every heading in the temple now wears it, for everyone, until newer declarations push it out.`
        : 'The Living Canon did not take your colour just now (the altar accepts one declaration from each of us every ten minutes). It is kept on your card.'
    }
  })

  update()
  if (saved?.name) card.dataset.member = 'true'

  const el = h('div', { class: 'rc-join' }, form, h('div', { class: 'rc-join__card' }, h('p', { class: 'rc-join__cardlabel' }, 'Your card (live preview):'), cardStage))
  return { el, update }
}
