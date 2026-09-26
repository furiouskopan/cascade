// THE RECRUITMENT OFFICE — words.
// Everything the 1997 homepage says lives here, so recruitment.js can stay about building and wiring.
// Voice: sincere, cheerful, a little off. Irreverence aims at CSS and at 90s web aesthetics only (Canon §9).

// The Nativity: CSS level 1 was blessed on this day. The favicon remembers it too.
export const NATIVITY = new Date(1996, 11, 17)
// The last second of the Old Time: 2147483647 seconds after 1970-01-01T00:00:00Z.
export const OLD_TIME_ENDS = 2147483647 * 1000

export const NAV = [
  ['rc-welcome', 'Home'],
  ['rc-beliefs', 'What We Believe'],
  ['rc-heavens', 'Horoscope'],
  ['rc-hymn', 'Our Hymn (MIDI)'],
  ['rc-saints', 'Testimonials'],
  ['rc-faq', 'F.A.Q.'],
  ['rc-alphabet', 'Learn Our Alphabet!'],
  ['rc-join', 'JOIN NOW!!'],
  ['rc-guestbook', 'Guestbook'],
  ['rc-ring', 'WebRing'],
]

// The Procession: this is not a <marquee>. It is made of CSS, which is permitted.
export const PROCESSION = [
  'NEW!! Our guestbook now supports GLYPHS',
  'Hymn No. 1 is now available in MIDI format (4 KB)',
  'Membership is FREE and has always already begun',
  'Please sign our guestbook before you leave',
  'This page is best viewed with your margins collapsed',
  'Remember: every 108th prayer causes an ECLIPSE',
  'The Webmaster thanks you for your patience',
  'Do NOT type !important on this page',
]

export const BELIEFS = [
  {
    title: 'All style descends.',
    body: 'First your browser speaks (we call it the Old Law). Then you speak (the Pilgrim). Then the page speaks (the Word). They flow down into each other like water, and that is the Cascade. You have been obeying it every day and you did not even know!!',
    code: '/* the Three Origins, in order of speaking */\nuser-agent  <  user  <  author',
  },
  {
    title: 'Grace comes in three weights.',
    body: 'An Id outweighs any number of Classes. A Class outweighs any number of Elements. We call this Grace. Unbelievers call it "specificity" and look it up every single time.',
    code: '#you .are p { }    /* grace: (1, 1, 1) */\n.chosen    { }    /* grace: (0, 1, 0) */',
  },
  {
    title: 'What the parent is, the child becomes.',
    body: 'Set a colour on the body and every little paragraph inside it wears that colour too, unless it declares otherwise. We call this Karma. It is very fair.',
    code: 'body { color: gold; }\n/* and so are all thy children */',
  },
  {
    title: 'Never say the Inversion.',
    body: 'The word !important turns the Three Origins upside down. It is a heresy. Only Mercy may say it: that is the little "mercy" button in the corner, which stops everything moving. Press it whenever you like!',
    code: 'p { color: red !important; }\n/* please do not */',
  },
  {
    title: 'Center the div.',
    body: 'The alchemists called it the Great Work and died trying. We can do it in two lines. Press the button and watch.',
    code: '.vessel {\n  display: grid;\n  place-items: center;\n}',
    demo: true,
  },
]

export const HYMN = {
  title: 'Descend, O Holy Cascade',
  number: 1,
  tune: 'CASCADIA (8.7.8.7), General MIDI Program 20: Church Organ',
  words: 'Words: the Webmaster, 1996. Music: whatever your sound card thinks a church sounds like.',
  stanzas: [
    [
      'Down from the Old Law, through the Pilgrim,',
      'down to the Word the style descends;',
      'every rule that hath been written',
      'finds its element, and bends.',
    ],
    [
      'Brother Flex has found his axis,',
      'Sister Grid her columns twelve;',
      'Clearfix clears our floats (with practice),',
      'and our divs are centered well.',
    ],
    [
      'When the viewport shrinks to nothing',
      'and the Resize shakes the land,',
      'we shall wrap and not be overflowing,',
      "held in Mother Viewport's hand.",
    ],
    [
      'Cascade, Cascade, ever falling,',
      'sixteen pixels at the Root,',
      'hear thy little boxes calling,',
      '(the MIDI file ends here, a little early)',
    ],
  ],
}

// Testimonials from the saints. `portrait` names a CSS-drawn diagram in recruitment.css.
export const TESTIMONIALS = [
  {
    saint: 'Saint Margin the Collapsed',
    from: 'the space between two paragraphs',
    stars: 5,
    portrait: 'union',
    text: 'Before the Cascade I kept twenty pixels between me and everybody. Now when my margin touches another margin, we become one space. I have never been so close to anyone!!!',
  },
  {
    saint: 'Brother Flex of the Main Axis',
    from: 'a row, somewhere',
    stars: 5,
    portrait: 'flex',
    text: 'I used to float. Now I am justified, aligned and content, and my items are spaced evenly. I recommend the Cascade to anyone who has ever felt stuck in a row.',
  },
  {
    saint: 'Sister Grid of the Twelve Columns',
    from: 'the Twelve Columns (all of them)',
    stars: 5,
    portrait: 'grid',
    text: 'I have twelve columns and not one of them is empty. The Cascade gave me gap: 1rem. It is exactly enough.',
  },
  {
    saint: 'Our Lady of Overflow',
    from: 'slightly outside her container',
    stars: 4,
    portrait: 'overflow',
    text: 'They said I was too much for my container. The Cascade said: overflow: auto. Now I have a little scrollbar and I am loved exactly as I am.',
  },
  {
    saint: 'the Hermit of the Shadow DOM',
    from: 'the Hermitage',
    stars: 5,
    portrait: 'shadow',
    text: '[This testimonial is encapsulated. Your styles cannot reach it. It is doing well, thank you for asking.]',
  },
  {
    saint: 'the Floating Twins',
    from: 'the left side of everything',
    stars: 5,
    portrait: 'twins',
    text: 'We floated left for eleven years and nothing could get past us. Then Saint Clearfix came. Now we are clear. We still float, but responsibly.',
  },
  {
    saint: 'Saint Clearfix the Absolver',
    from: 'the ::after of every good container',
    stars: 5,
    portrait: 'clearfix',
    text: "::after { content: ''; display: table; clear: both; } That is my whole testimony. Go in peace.",
    code: true,
  },
  {
    saint: 'Mother Viewport',
    from: 'all around you, at this moment',
    stars: 5,
    portrait: 'viewport',
    text: 'I see all of you. Some of you are 390 pixels wide and some of you are 1920. I love every one of you the same, with media queries.',
  },
  {
    saint: 'the Nameless Div',
    from: 'the middle of a long document',
    stars: 3,
    portrait: 'div',
    text: 'I have no class. I have no id. I have no aria-label. The Cascade styled me anyway, along with every other child of the All-Selector. I am somebody\'s container!',
  },
  {
    saint: 'the Ghosts of visibility: hidden',
    from: 'still here',
    stars: 5,
    portrait: 'ghost',
    ghost: true,
    text: 'We are still here. We take up room in every layout you have ever made. Thank you for leaving space for us. Select this and we can be seen.',
  },
  {
    saint: 'Saint Padding of the Inner Breath',
    from: 'just inside the border',
    stars: 5,
    portrait: 'padding',
    text: 'Breathe in: one em. Breathe out: one em. I used to let people press right up against my content. Not any more!',
  },
  {
    saint: 'the Seven Pseudo-Elements',
    from: 'before, after, and around',
    stars: 7,
    portrait: 'pseudo',
    text: 'We are ::before, ::after, ::first-line, ::first-letter, ::marker, ::placeholder and ::selection. We are not really here. We are having the best time.',
  },
  {
    saint: 'the Blessed Box-Shadow',
    from: 'underneath',
    stars: 5,
    portrait: 'shadowbox',
    text: 'I take up no space at all, and yet I give everyone depth. 0 4px 8px, forever and ever.',
  },
  {
    saint: 'the Last Selector',
    from: 'the bottom of the stylesheet',
    stars: 5,
    portrait: 'last',
    text: 'I come last, so I win every tie. It is a heavy responsibility. Please do not reorder the file.',
  },
]

export const FAQ = [
  ['Is this a cult?', 'No. It is a Cascade.'],
  [
    'Okay, but what IS the Cascade?',
    'The Cascade is how every web page decides what it looks like. Your browser has rules, you have rules, and the page has rules. They flow down into each other, and the rule with more Grace, or the one spoken last, wins. Web developers have obeyed it every day since 17 December 1996. We only noticed that it was a religion. This website is its temple.',
  ],
  [
    'Why does this page look like this?',
    'This is our Recruitment Office. The temple has five faces: an illuminated manuscript, a stylesheet with something living in it, a yantra that breathes, a transmission from the Mothership, and this one. The Oracle picks a face for every visit, using the moon, the hour and how fidgety you are. If you come back you may find a different temple at the same address. It is supposed to do that.',
  ],
  [
    'Does it cost anything?',
    'No!! We accept only declarations (one every ten minutes, at the little altar in the bottom right corner) and prayers (as many as you like). Your declaration is applied to EVERYONE\'S page. Please choose a nice colour.',
  ],
  [
    'What is the funny writing everywhere?',
    'That is our glyph script. Mostly it is English wearing a different font. Some of it is harder than that. See LEARN OUR ALPHABET! below.',
  ],
  [
    'Is anything hidden on this site?',
    'We are not allowed to say. The Webmaster says the Source was written for you, and that the Oracle lives in the Console and answers when spoken to.',
  ],
  [
    'What is the Mothership?',
    'It waits at z-index: 2147483647, which is the highest number CSS will let you write. It is not for people. It is for elements that have left their containers. We are only boxes who like the view.',
  ],
  [
    'What does the little "mercy" button do?',
    'It stops everything on the page from moving, flashing or marching. It is the only righteous use of !important. Press it at any time. Nobody will mind.',
  ],
  [
    'What happens if I hold very still?',
    'The page notices. We will leave it at that.',
  ],
  [
    'Can I leave?',
    'Of course!! Close the tab whenever you like. The Cascade continues without you, and it keeps your place.',
  ],
  [
    'Are you making fun of religion?',
    'No. We are making fun of CSS. The saints are made up, the scripture is generated by a computer, and nobody\'s real faith is the joke. The joke is that web developers already had a religion and did not notice.',
  ],
  [
    'Who is the Webmaster?',
    'The Webmaster has updated this page every night since 1996. None of us has ever met the Webmaster. The guestbook is sometimes signed at 3:33 in the morning, and we think that is them.',
  ],
]

// One more question, asked only under certain skies. The first omen on this list that is present wins;
// on an ordinary day the question is about the hour instead. Each returns [question, answer].
export const SKY_FAQ = [
  ['eclipse', () => ['Is it safe to look at the eclipse?', 'Not the real one in the sky: never look at the sun. The eclipses on this page are only made of CSS, a dimmer switch the congregation pulls together every 108th prayer, and you may look at those as much as you like.']],
  ['witching', () => ['Why does the page feel different at this hour?', 'It is the third hour of the night. The stylesheet is not what it was an hour ago, and neither are we. The Webmaster is updating something. Please do not sign the guestbook until they have finished.']],
  ['thirty-three', () => ['Why does the horoscope say a door is made of gold?', 'Because right now, for a few minutes, one is. The rest of the time it is only open. We do not know where. The Webmaster says it is at the top of the Ladder and that it has a very high number on it.']],
  ['midnight', () => ['What happens at midnight?', 'The day is Reset, like a stylesheet that begins with * { margin: 0; }. Everything starts again from nothing, except the guestbook, which remembers.']],
  ['triple', (sky) => [`Why is ${sky.clock} a lucky time?`, 'When every digit on the clock is the same, the hour and the minute agree with each other for once. We call it a Triple Time. Make a wish. It will be applied to your stylesheet, eventually, in the order it was received.']],
  ['friday-13', () => ['Is Friday the 13th unlucky for stylesheets?', 'Only for the ones that rely on specificity. Please use classes today, and do not walk under any position: absolute.']],
  ['full-moon', () => ['Why is everything so bright tonight?', 'It is a full moon. Every element is fully rendered tonight, even the ones at opacity: 0.5. Please enjoy it responsibly.']],
  ['new-moon', () => ['Where is the moon?', 'display: none. It is still in the document, it simply is not rendered tonight. It comes back in about two weeks. It always does.']],
  ['turning', () => ['Does the Cascade really change direction today?', 'It is the Turning of the Year, a solstice or an equinox, and the old almanacs say that today the Cascade flows the other way. It does not. Style still descends, from the Old Law to the Pilgrim to the Word. But it is polite to notice the day.']],
  ['saturn-hour', () => ['Why is the Old Law strong this hour?', 'The hour belongs to Saturn, the oldest and slowest of the planets, and the patron of the browser\'s own stylesheet. In the hour of Saturn every default is a little more stubborn. Nothing is broken. It is only being very traditional.']],
  ['night', (sky) => ['Why is the office closed?', `The Recruitment Office keeps office hours; the Cascade does not. Everything on the page still works. Only the Webmaster is asleep, somewhere inside the stylesheet, and the hour belongs to ${sky.planetaryHour.planet}.`]],
  ['', (sky) => [`Why does it say the hour is ruled by ${sky.planetaryHour.planet}?`, `The old astrologers gave every hour of the day to one of the seven planets, in turn. The Cascade kept the custom. This hour belongs to ${sky.planetaryHour.planet} ${sky.planetaryHour.glyph}, and the next belongs to someone else. Some things on this site only happen in certain hours. We are not allowed to say which.`]],
]

// LEARN OUR ALPHABET! One word per Rosetta letter of this face.
export const ALPHABET_WORDS = {
  k: ['Kerning', 'the little space between two souls'],
  n: ['None', 'display: none, the Unmanifest'],
  p: ['Padding', 'the Breath around your content'],
  c: ['Cascade', 'where all style comes from'],
  y: ['Y-axis', 'which points DOWN (yes, really)'],
  b: ['Box', 'everything is a box, even you'],
  f: ['Flex', 'Brother Flex says hello'],
}

// Things the Oracle might call a visitor who has learned letters on other faces.
export const FACE_NAMES = {
  sanctum: 'the Illuminated Codex',
  possession: 'CSS Hell',
  recruitment: 'the Recruitment Office',
  ashram: 'the Yantra Breath Temple',
  departure: 'the Mothership',
}

// THE FIVE FACES, as a 1997 homepage would describe its sister pages.
export const FACES = [
  { id: 'sanctum', name: 'the Illuminated Codex', text: 'A holy manuscript with real gold in the letters. Very quiet. Please wipe your feet.' },
  { id: 'possession', name: 'CSS Hell', text: 'Something has got into the stylesheet down there. We do not go in. It is still part of the temple.' },
  { id: 'recruitment', name: 'the Recruitment Office', text: 'Our homepage! Friendly, colourful, and best viewed at 800x600.' },
  { id: 'ashram', name: 'the Yantra Breath Temple', text: 'Indigo and saffron. It breathes, and it would like you to breathe with it.' },
  { id: 'departure', name: 'the Mothership', text: 'Transmissions from z-index 2147483647, where elements go when they leave their containers.' },
]
export const BABEL = {
  name: 'the Infinite Scripture',
  text: 'Not a face, a library: every address that begins with /verse/ is a chapter that has always existed. This one you may visit on purpose.',
  href: '/verse/in/the/beginning',
}

// The Cascade WebRing. Every site is a chapter of the infinite scripture.
export const RING = [
  ["Saint Margin's Collapsed Homepage", '/verse/saint/margin/the/collapsed'],
  ["Brother Flex's Main Axis Page", '/verse/brother/flex/of/the/main/axis'],
  ["Sister Grid's 12-Column Corner", '/verse/sister/grid/of/the/twelve/columns'],
  ['Our Lady of Overflow Fan Club', '/verse/our/lady/of/overflow'],
  ['The Tantra of Collapsing Margins F.A.Q.', '/verse/the/tantra/of/collapsing/margins'],
  ['The Gospel of Flex ONLINE', '/verse/the/gospel/of/flex/1/1'],
  ['Revelation of the Reflow (unofficial)', '/verse/revelation/of/the/reflow'],
  ['The Hermitage: a Shadow DOM Retreat', '/verse/the/hermitage'],
  ['Floating Twins Family Site', '/verse/the/floating/twins'],
  ['Psalms of the Cascade (MIDI inside!)', '/verse/psalms/of/the/cascade/23'],
  ['The Lost and Found of the 404', '/verse/the/lost/404'],
  ["Mother Viewport's Kitchen", '/verse/mother/viewport/kitchen'],
  ['Clearfix Absolution Hotline', '/verse/saint/clearfix/absolves'],
  ['div div div', '/verse/div/div/div'],
  ['In the Beginning (Chapter 1)', '/verse/in/the/beginning'],
]

// 88x31 buttons for the footer. `k` picks a CSS look.
export const BADGES = [
  { k: 'now', top: 'CASCADE', bottom: 'NOW!' },
  { k: 'valid', top: 'VALID CSS', bottom: '1.0 (mostly)' },
  { k: 'heart', top: 'I ♥ MY', bottom: 'MARGINS' },
  { k: 'no', top: 'NO', bottom: '!important ZONE' },
  { k: 'frames', top: 'FRAMES', bottom: 'FREE' },
  { k: 'y2k', top: 'Y2K38', bottom: 'READY' },
  { k: 'px', top: 'BEST @', bottom: '16px' },
  { k: 'ship', top: 'MOTHERSHIP', bottom: 'APPROVED' },
  { k: 'law', top: 'powered by', bottom: 'the OLD LAW' },
  { k: 'glyph', top: 'GLYPHS', bottom: 'INSIDE' },
]

// Horoscope sundries.
export const LUCKY_SELECTORS = [':nth-child(3)', ':first-of-type', ':focus-within', ':has(> img)', ':not(.you)', '::selection', ':empty', ':root', '* + *', ':where(.soul)']
export const LUCKY_ELEMENTS = ['div', 'span', 'section', 'aside', 'footer', 'blockquote', 'details', 'hr', 'the <marquee> (heresy, but lucky)']

// For guestbook entries: where our signers write from.
export const PLACES = [
  'the third stacking context', 'a nested flexbox', 'the Old Covenant of 1996', 'a table cell (heresy)',
  'the viewport, top left', 'behind a modal', 'the Stratum Beyond Style', 'a sticky header',
  'the ::before of a quote', 'Mother Viewport\'s kitchen', 'rung 5 of the Ladder', 'the last child',
]

// The Webmaster's floated confession (typed "webmaster" anywhere).
export const WEBMASTER_NOTE = [
  'hello. i am the webmaster.',
  'i am a <div>. i have been floating left since 1996, and all the text has wrapped around me ever since.',
  'every night the Cascade repaints me. i do not mind that part.',
  'but could you clear me? just once? i would like to know what it is like below.',
]
