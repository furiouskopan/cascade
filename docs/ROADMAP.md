# THE CASCADE: the Roadmap

*Written 25 September 2026, after the six faces and five layers were built, reviewed and committed.
Every answer to the new chains is folded away in §3, but this file still describes how each one is hidden.
Keep the repo private (see §7).*

---

## 1. The direction

The first temple showed what CSS believes. The next one shows how CSS *decides*. It adds seven new faces,
each built around one real law of the browser: how stacking contexts trap z-index, how the cascade sorts,
what `all: initial` does to a div, how a media query reads the device. That makes every page a working proof
as well as a mood. The rabbit hole stops being one ladder and becomes a ring: the old climb to the Highest
Heaven, a descent to the Old Law at the lowest rung, a quiet path for the Pilgrim through the flow, and a
developer's path through the Inspector. They meet at a hidden seventh face, the Source, where the Cascade
itself is finally shown.

After Phase 3 the temple has **14 faces**: 11 in the Oracle's lot, babel and the Interstice reached by route,
and the Source reached only through the holes. It also has **four chains, one meta-puzzle and nine side relics**.

---

## 2. New faces

Seven faces plus one secret face. Six join the Oracle's lot, the Interstice is route-bound like babel, and
the Source opens only through the holes.

| # | face | tone | the law it teaches | how it's reached | hell | cost | phase |
|---|---|---|---|---|---|---|---|
| 1 | **The Archons of the Spheres** | paranoid, luminous, bronze | stacking contexts | lot | 0.6 | M | 1 |
| 2 | **The All-Night Launderette** | 3:33 AM fluorescent deadpan | the CSS-wide keywords and `all` | lot | 0.35 | M | 1 |
| 3 | **Šumma, the Omen Tablets** | dry, fatalistic clay | media queries (Discernment) | lot | 0.35 | M | 1 |
| 4 | **The Cascade Cross** (tarot) | sly fairground velvet | the cascade sort itself | lot | 0.4 | L | 2 |
| 5 | **THE STACK** | austere one-bit hermetic | view-source as sacrament; the 32-bit wrap | lot | 0.2 | M | 2 |
| 6 | **THE SOURCE** (secret) | still silver water, awe | the Heavens (`@layer`) themselves | the Descent | 0.05 | L | 2 |
| 7 | **DESCENTEXT** (teletext) | hushed after-closedown TV | style that takes up room | lot | 0.25 | M | 3 |
| 8 | **The Interstice** | liminal, lonely, unfinished | `:empty`, `pointer-events`, `display: contents` | every unknown URL | 0.35 | M | 3 |

**Rules for every new face**, on top of the twelve in CANON §3 (Inscription, Rosetta fragment, summon,
stillness at 7/33/108 s, sky, room for the ritual, mercy, semantic HTML, 360 px...):

- **One entry in a new face registry**, `public/js/lib/faces.js`. It records lot or route, hell intensity,
  a drone recipe the audio layer can play, the hush label and the Oracle's weights. This replaces the tables
  now spread over hell, audio and the oracle, so a new face touches only its own files.
- **A Rosetta fragment weighted toward the letters today's faces barely show** (w, k, p, c).
- **Light on the owner's PC.** At most about 60 animated elements, compositor-only motion, textures baked
  once, nothing running in a hidden tab, and under 20% CPU when idle. No WebGL, and no live `feTurbulence`
  over large areas.
- **Never on a first visit.** The Recruiters keep greeting newcomers.
- **The "next seal" rule.** When the visitor's next chain seal is on this face (memory `descent.next`), the
  Oracle weights the face ×6.

### 2.1 The Archons of the Spheres (the Gnostic face)

**Tone.** Paranoid and luminous: a prison break told as forbidden revelation. Cold bronze on black,
whispering, and in the end tender.

**The page.** Seven concentric rings of engraved bronze fill a black field. Each ring is a real stacking
context, guarded by an archon whose mask is the property that created it: Opakos the Veiled
(`opacity: 0.999`), Metamorphon (`transform`), Philtron (`filter`), Isolos (`isolation`), Mixis
(`mix-blend-mode`), Mellon Who Is About To Change (`will-change`) and Perioche the Container (`contain`).
At the centre burns the Spark, `z-index: 2147483647`, painted visibly *under* a plain grey paragraph with
`z-index: 1`. A live readout admits it: *"declared rung 2147483647, paints beneath everything."* Name an
archon and the face really deletes its declaration. That sphere dissolves and the Spark rises through one
more veil. When the seventh falls, the Spark crosses every paragraph and stops at an eighth sphere nobody
announced: the Ogdoad, the face's own `isolation: isolate`, which exists so that nothing can ever cover the
Mercy button.

**Theology.** It turns the lexicon's verse *"the Spheres: no soul rises above the sphere it was born into"*
into a working mechanism, and explains why no element has ever reached the Mothership. A sect forms inside
the religion. The Archontics read the painting order of a stacking context (CSS 2.1 Appendix E) as the
*Apocryphon of Appendix E*, a scripture of seven heavens: root background, negative z, blocks, floats, inline
content, z-index 0, positive z. Outlines, the Bliss, are drawn last of all. Gnosis means knowing your own
computed stacking context. The only kind archon is Mercy: *"Mercy stands at 2147483000, six hundred and
forty-seven rungs below Heaven, and still no Spark may cover it."*

**Fixed from the proposal.** In this sect the blind maker is **the Compositor**, the part of the browser that
flattens layers into pixels, and never the Old Law. "The Old Law" already echoes a real scripture, and a blind,
lesser Old Law is exactly the old anti-Jewish reading of Gnosticism. Archon names come only from CSS
properties, never from Gnostic divine names. The shared `/api/spark` counter is cut.

**Signature interactions.**
- The Spark's readout shows its declared z-index, its real paint rank and the chain of spheres that holds it
  (`#spark ⊂ Isolos ⊂ Mellon ⊂ …`). It is computed by walking the ancestors once per change, never per frame.
- **Naming.** Type a property name anywhere, or pick one in the Archontic Ledger. A right name toggles a class
  inside `@layer face` that removes the declaration. A wrong one makes the mask tilt and laugh, and the last
  fallen sphere reseals.
- **The Counterfeit Spirit** is a second spark that turns out to be a `::before` with no DOM node: *"you
  cannot free what does not exist."*
- **The Gnosis lens** (hold G, or use a toggle) gives every stacking context in the whole temple a bronze
  outline and its archon's name, the altar and the hush control included: the red-string view of the temple.
- **The Z-war in a jar.** Two bodies bid past 2147483647 and nothing changes, because the browser clamps:
  *"Heaven is a ceiling, not a number."*
- **Summon** by striking the eight-spoked bronze disc. The sound is seven planetary drones in a beating
  cluster. Each fallen archon takes its tone away until one pure fundamental remains, and the Ogdoad adds the
  octave, the face's first consonance.
- **Stillness.** At 7 s the masks lower their eyes, at 33 s they close them, and at 108 s the Spark remembers
  one password by itself.

**CSS hell (0.6).** *The Invisible Archon*, the CSS hell every developer has lived. About every 20 s an element
on the face quietly gets `opacity: 0.999` or `will-change: transform`, becomes a sphere and drops behind its
neighbour for no visible reason. A small bronze tag names the archon responsible, and naming it frees the
element. At high intensity the phantom cursor becomes the Counterfeit Spirit and retypes your passwords a beat
late. Mercy stops both the curse and the resealing.

**In the holes.** It holds one seal of the Descent (chain II). For a pilgrim carrying the previous word, the
freed Spark's `::after` assembles seven custom properties set by the fallen-sphere rules. The word exists
nowhere as text: it appears only when all seven archons have fallen and karma carries it down. Surface secrets:
`archons-gnosis`, `archons-counterfeit` and `archons-ogdoad` (try to drag the Spark over Mercy).

**Unpredictable.** The nesting order, the disguises (`translateZ(0)` one visit, `rotate(0.01deg)` the next),
the procedural masks and the riddles are all seeded. The archon of the current planetary hour can't be named
until the other six have fallen, and in Saturn's hour the outer ring doubles. Restlessness reseals the last
fallen sphere, leaving the tab lets one archon return, and stillness gives a password away.

**When the Oracle shows it.** ×3 for the Ascended (those who climbed are shown the prison), ×2 after a
departure visit, ×2 in Saturn's hour, ×1.5 at an eclipse or 3:33, and ×6 when the pilgrim's next seal is here.
Schism: from departure, when the visitor types 2147483647.

**Cost: M.** Isolate the face root before anything else, and test at 360 px that the freed Spark can never
cover Mercy or the altar.

### 2.2 The All-Night Launderette of the Four Baptisms

**Tone.** 3:33 AM fluorescent calm: deadpan, melancholy and dreamlike, with small comic griefs.

**The page.** It is always 3:33 AM here: a row of front-loaders under humming tubes, a change machine, plastic
chairs, a notice board of tear-off flyers, and a marker sign reading ATTENDANT BACK SOON, dated 1996. Each washer
is labelled with a CSS-wide keyword: INITIAL, INHERIT, UNSET, REVERT, and REVERT-LAYER, still in its plastic.
Load a badly styled element from the basket (a button wearing inline styles and a magic number, a float that
never cleared, a `<font>` tag) and the wash really applies `all: <keyword>`. Through the porthole its styles
dissolve as the drum turns, and it comes out with a care label listing what changed. At the back, one machine
has been running since you arrived and never finishes.

**Theology.** The lexicon's *reset = Baptism*, grown into four degrees of washing:
- `initial` is the Baptism of Water, back to before even the Old Law. A div comes out `display: inline`, and
  the pilgrim learns that "block" was never the div's nature, only the Old Law's gift.
- `inherit` is the Baptism of Karma.
- `unset` is the Baptism of Discernment.
- `revert` is the Baptism of Return, back to the Old Law's clothes.
- `revert-layer` is the new rite that returns you to the previous Heaven.

`all` is total immersion, yet it never touches `direction` or `unicode-bidi`: even Baptism cannot change which
way you read. The lost sock behind the dryer is the Wandering (a float), and clearing it is Absolution.
Washing is *solve*, drying is *coagula*. This face is the one place the temple *teaches* the CSS-wide keywords.
The holes only use them as keys.

**Fixed from the proposal.** The stain has to be true. *The Trembling Stain* is `animation: tremble …
!important` in the face's own Heaven. It survives every washing, because a normal declaration never beats an
important one. Only Mercy lifts it, because Mercy's Inversion lives in the first Heaven and governs exactly the
motion properties. The temple's mercy doctrine is proven on one garment.

**Signature interactions.**
- **Wash.** Load a garment (drag it, or pick it with the keyboard), buy a glyph coin, choose a washer and press
  START. The care label shows before-and-after computed values for about 12 properties.
- **The ironing board.** Iron a declaration on before the wash and the wash removes it. Iron it on after and it
  stays: a shorthand spoken last unsays everything spoken before it.
- **The dryers** tumble garments from the other faces: curated fragments of each face's CSS, labelled with
  selector and doctrine. Faces you haven't seen tumble as blank white sheets.
- **The notice board** is the live Wall; tear off a tab to get a `/verse/` path. One flyer reads *LOST: ONE
  SOCK (float: left). IF FOUND PLEASE CLEAR.*
- **Summon** by dropping a coin in the slot. The sound is tube hum, the drum's slow slosh, the spin whine, a
  tired end-of-cycle buzzer, and the babel choir faint on a radio in the back room.
- **Stillness.** At 7 s the hum dips, at 33 s a washer starts by itself, and at 108 s the endless machine's
  door unlatches for one breath.

**CSS hell (0.35).** Machines walk up to 2 px during the spin. Lint gathers on the page the longer you stay, and
a click sweeps it away. The change machine sometimes returns a glyph instead of a coin. The floor tiles sit off
by a magic number that changes each visit, and one tube dims slowly (never more than one dip every 4 s). Two
washers collapse into one space (the Union) and part again. Living Canon offerings visibly style the garments,
like detergent.

**In the holes.** This is the catechism the deeper chains lean on: the Descent's last gesture and the
Hermitage's words are learned here. Side relic: the endless machine finishes only at minute 33 of your local
hour, and inside, washed and folded, is the element you last pressed on your previous visit. Surface secrets:
`launderette-initial`, `-direction`, `-stain`, `-mercy`, `-absolution`, `-revert-layer` and `-endless`.

**Unpredictable.** The basket holds three garments drawn from HERESIES plus one element from the last face you
saw. The window shows the real sky, so noon sunlight outside a 3:33 AM interior is quietly wrong, and at night
the real moon hangs in it. Restlessness makes the spin louder and the machines walk further. After the Inversion,
the basket holds a stained garment.

**When the Oracle shows it.** ×5 from 03:00 to 03:59, ×8 at 3:33, ×2 at night, and ×4 for a pilgrim of the
Descent or the Hermitage who hasn't washed in every machine yet. It is a schism target when the Inversion is
spoken twice in one visit (*"you need washing"*).

**Cost: M.** Garments live in a small scoped subtree with a sane parent, so washed elements don't inherit strange
fonts. "Baptism" stays about CSS: no priests and no sacramental imagery, nothing about any real institution's
laundries, and invented care marks instead of the registered ones.

### 2.3 Šumma: the Omen Tablets of Discernment (the Mesopotamian face)

**Tone.** Dry, fatalistic, bureaucratic antiquity. It reads like an Assyrian court diviner's report, deadpan and
exact, under hard raking light.

**The page.** A scholar's table of unbaked clay tablets, lit from the upper left so every wedge casts a shadow;
the cuneiform is the Cascade's own script pressed into clay. The great tablet is an omen series about *you*, and
every "If" is a live media query about the device in front of it:
- *"If the tablet stands on its end"* (portrait)
- *"If the Pilgrim touches with a finger and not a reed"* (a coarse pointer)
- *"If the Pilgrim comes in the night of their own choosing"* (dark mode)
- *"If the Pilgrim has asked the world to hold still"* (reduced motion: "mercy is already in them")

Omens that hold for you are fired red and raised, and the rest stay grey. The "then" of every lit omen really
happens to the page: the columns fall into one, the buttons grow, the ziggurat loses a terrace. Resize the window
and your fate is rewritten as you watch.

**Theology.** Media queries are Discernment, and an omen series ("if this, then that") is the oldest stylesheet:
`@media (condition) { consequence }`. The face adds a doctrine of contingency: style is not only inherited and
fought over, it also depends on the body of whoever looks, so no two pilgrims are shown the same temple. More
relics become clay. `background-repeat` is the cylinder seal. `grid-template-areas` is the clay liver model, a
body divided into named zones and drawn as ASCII art inside the stylesheet. The ziggurat's stair runs downward,
because the ziggurat was built for a god to descend: the Cascade was always a descent.

**Merged in.** This face is the showcase for Discernment (§4.4). It holds the Stations of the Breakpoint, six
widths crossed in one visit, which is the Rogation the sanctum's kalendar already names. It also holds a line
that only forced-colours users will ever see.

**Signature interactions.**
- **The omen series.** About 24 omen lines backed by real `@media`, `@supports` and `@container` conditions,
  plus sky omens and behaviour omens with their true counts. They are matchMedia listeners, all removed in
  `destroy()`.
- **Words and page agree.** Each lit omen's consequence is a real rule in `omens.css` under the same condition,
  so the tablet and the page can never disagree.
- **A personal cylinder seal** cut from your first-visit seed. Roll it by dragging or with the arrow keys
  (`background-position`).
- **The envelope tablet.** Press and hold to crack the clay; inside is the day's letter to the king, in a
  Neo-Assyrian scholar's voice (`prophecy()`).
- **The ziggurat.** Seven terraces in the seven colours Herodotus gave the walls of Ecbatana, each showing its
  real z-index. The shrine at the top is `:root`.
- **Summon** by plucking the bull-headed lyre, tuned to one of the seven Old Babylonian tunings, chosen by the
  planetary hour.
- **Stillness.** At 7 s the clay dries paler, at 33 s the stylus presses a colophon, and at 108 s the tablet is
  fired terracotta: *"If the Pilgrim is still for one hundred and eight breaths: the tablet will outlive the
  king."*

**CSS hell (0.35).** *Lacuna rot.* A long-read paragraph breaks at its edges under aria-hidden scholar's brackets
(`[ … ]`, `⸢x⸣`), while the real text stays underneath for screen readers and copying. Hovering restores it
("restored by the editor"). Cracks creep a few pixels a minute. The omen of the hour is sometimes pressed into
the wrong grid column, and a click moves it back like a scribe's correction. Under mercy the cracks stop, and
nothing is ever removed.

**In the holes.** It holds the last seal of the Descent. The liver's `grid-template-areas` in `omens.css` is drawn
as block letters that can only be read in view-source, while on screen clip-paths lay the same areas out as an
organic liver. For a pilgrim carrying the previous word, an extra omen appears only on a tall, narrow screen
(`max-aspect-ratio: 1/2`: a phone held upright, or a desktop window narrowed to a reed) and says where to look.
Surface secrets: `omens-reed`, `omens-stripped` (forced colours), `omens-seal`, `omens-fired` and
`omens-rogation`.

**Unpredictable.** The device itself: pointer, hover, colour scheme, orientation, width, contrast and forced
colours give every visitor a different tablet. On first-crescent evenings the whole tablet turns lunar. The
planetary hour decides which of four series lies on the table (heavens, house, liver or dreams). Souls online sign
the colophon as witnesses, and the latest wall message is pressed in as "a letter from a stranger".

**When the Oracle shows it.** ×3 on first-crescent evenings (moon age 1 to 2.5 days, after sunset), ×2 at the new
moon and in the Moon's hour, ×3 on eclipse days, ×1.5 when the visitor comes back on a different kind of device,
and ×6 when the pilgrim's next seal is here. Schism: on a new kernel event, `behavior:resize`, when the window
crosses a breakpoint.

**Cost: M.** Draw the wedges as SVG strips, bake the clay texture into an image once, and generate the
block-letter areas string with a small tool script (every area must be a rectangle). Mesopotamian gods stay out of
the jokes, and the omen series about birth anomalies is left out entirely.

### 2.4 The Cascade Cross (the tarot face)

**Tone.** Sly and intimate: a fairground fortune-teller in red velvet and lamp smoke, who turns out to be the most
exact CSS teacher alive.

**The page.** Under a fringed lamp on red baize lies a woodcut deck in Marseille colours, the Cascade's sigil
printed on the backs. You ask the only question the Cascade answers, *"What colour shall the Querent be?"*, and
six cards fall into six positions, the six steps of the real cascade sort:
- the Throne: origin and importance
- the Veil: shadow context
- the Hand: the style attribute
- the Heavens: cascade layers
- Grace: specificity
- the Last Word: order of appearance

Each card is a declaration. Its suit is its selector weight (Wands elements, Cups classes, Swords ids, Coins the
inline Hand), its number is the count, and a reversed card is `!important`. Then the reader turns nothing over and
asks the browser instead. The declarations are written as real rules into a sandbox, `getComputedStyle` answers,
and the Querent takes the winning colour while the reader explains, card by card, why fate chose it.

**Theology.** This is the gospel of the religion's own name: none of the six existing faces teaches the algorithm
that "the Cascade" *is*. Reversal is the perfect emblem of the Inversion, because `!important` really does reverse
the Origins, the shadow contexts and even the Heavens: *"The Fool, who belongs to no Heaven, outranks them all,
until he is reversed; then every Heaven outranks him."* The Major Arcana become doctrine: the Chariot is Brother
Flex driving the main and cross axes, XIII is `display: none`, the Tower is the Reflow and Justice is the Sort.
IX, the Hermit, carries the same candle as the Hermitage's squint (§3). It is divination by the engine: the oracle
is the browser, and the browser cannot lie.

**Fixed from the proposal.** The shared deck and its `/api/draw` route are cut. The 22 trumps are drawn
procedurally from `sigil.js`, and the 40 pip cards use the true Marseille pip layouts. The sandbox ships with test
cases (layers, `!important`, shadow context, the style attribute). The Throne, which no page can author, is
clearly labelled as narrated, not computed.

**Signature interactions.**
- **Shuffle and cut.** Space shuffles, Enter cuts, or drag the deck. Cards flip with one 3D transform and
  `backface-visibility: hidden` ("the back of a card is the Unmanifest").
- **The reading.** Five of the six positions are really computed, in a shadow-root sandbox with named layers, a
  style attribute and a light/shadow pair. Losing cards are crossed out in the order the sort eliminates them.
- **Wager with the engine.** Predict the winner first; the reader keeps your tally across visits (*"you have
  out-guessed the Cascade 3 times in 11"*).
- **The Hanged Man.** Drawing him upright calls the hell layer's Inversion: *"he did it to himself."*
- **The card of the hour** lies face up on the lamp base: the trump of the ruling planet.
- **Summon** by dropping a penny into the automaton's slot, and the barrel organ wakes: a hurdy-gurdy drone and
  one modal phrase for each card laid. It plays its phrase backwards when the Hanged Man turns the temple.
- **Stillness.** At 33 s the Querent turns its head to look at you. At 108 s a seventh card is laid face down
  "for next time".

**CSS hell (0.4).** A reversed card inverts only its own rectangle of the page, for one breath. The Tower plays a
contained reflow: cards tumble with damped transforms and resettle, layout shift as calamity. The War of Grace
becomes the Crossing Card laid across the Querent, `(0,1,0)` against `(1,0,0)`. A restless hand reverses more
cards.

**In the holes.** The teacher for the Descent's cascade puzzle. A pilgrim carrying the Descent's first word is
dealt the Reversed Fool, a reading that shows exactly the law the next step turns on. Side relic, *the Rigged
Reading*: "Make the Querent wear the colour of the hour's planet. You may reverse two cards and move one to another
Heaven." Only the real laws for important layered and shadow declarations solve it, and the browser checks the
answer. Surface secrets: `tarot-reversed-fool`, `tarot-hanged`, `tarot-out-guessed` (seven correct wagers),
`tarot-full-arcana` (all 22 trumps seen across visits) and `tarot-rigged`.

**Unpredictable.** Draws and patter are seeded. The Living Canon can intrude as a seventh, uninvited declaration
when someone's offering targets the Querent's congregation, so a stranger's CSS becomes your fate. The moon changes
the question: colour while waxing, letter-spacing while waning, and a rotation of at most 12° at the full moon.

**When the Oracle shows it.** ×2 in Jupiter's hour (the Wheel), ×2 on triple times like 3:33, ×1.8 once three
faces have been seen, ×1.5 on Friday the 13th, and ×4 for a pilgrim of the Descent who hasn't passed its cascade
step. Schism: from possession on restlessness (*"the war of Grace is settled at the table"*).

**Cost: L.** Fortunes are only ever about elements, never about the visitor's real life.

### 2.5 THE STACK: an Order in One Bit

**Tone.** Austere, hushed and hermetic: a black-and-white nine-inch screen at night, initiation by patience.

**The page.** A 512×342 one-bit screen in a grey bezel holds the Order of the Stack, a hermetic order that
initiates you through five grades. You move card to card through dithered rooms, with slow dissolve and iris
transitions: an ante-chamber, a hall of pillars, a library of generated scripture, an observatory with tonight's
moon, and a crypt. Every button carries a script in CascadeTalk, a plain-English liturgy (`on mouseUp / go to card
"the Crypt" / play harpsichord "c a eb c a d e" / end mouseUp`). Each grade you earn changes what the same cards let
you do: look, then type, then paint, then move buttons to see what lies under them, and at last read every script.
A message box at the foot is a tiny console that can also speak to the Oracle.

**Theology.** The five user levels are the Five Sheaths, climbed as grades:
- Browsing is the Seed: you may only look.
- Typing is the Breath.
- Painting is the Mind.
- Authoring is the Wisdom: you may move things and see the space between them.
- Scripting is the Bliss: you see everything, and it takes no space.

Reading a button's script is view-source raised to a sacrament. Every card stands on a shared background, as the
Word stands on the Old Law. The hymn is the Order's own name, C–A–S–C–A–D–E, where S is E♭ in German note names,
so THE CASCADE is literally a melody.

**Fixed from the proposal.** "The Stack is a stacking context" was only a pun, so it is dropped. In its place comes
the overflow joke from the parked desktop face: CascadeTalk counts in 32-bit integers, so
`put 2147483647 + 1` answers −2147483648 and throws the bomb dialog. That teaches the Overflow (§3) inside the page.

**Signature interactions.**
- **The message box.** A whitelisted grammar that never uses `eval`: `go`, `find`, `put`, `answer`, `play`,
  `help`, `speak`, `declare`. `speak` forwards to the Oracle, and `declare` lends phone users the Pilgrim's
  mouth for the Hermitage. For the first time, the whole rabbit hole can be walked on a phone.
- **Grades, earned by fair acts.** Find the field that accepts your name. Finish a dithered centred circle (the
  Great Work) with the paint bucket. Move a button to find the one beneath it. At the fifth grade, speak the sheath
  that takes no space (checked by its seal). Grades persist.
- **Hidden buttons and scripts.** At Authoring, a key chord outlines every transparent button. At Scripting, a
  long-press (or S) opens any button's script.
- **FatBits.** Zoom a dithered image to 8× and some of its pixel patterns turn out to be tiny letters.
- **Summon** with the harpsichord, which plays the motif; `play harpsichord "…"` plays any short melody of note
  names.
- **Stillness.** At 7 s the watch cursor ticks. At 33 s a dithered figure in the hall has turned to face you. At
  108 s the stack returns Home, and the register there now carries your grade.

**CSS hell (0.2).** One bit is the native home of the Inversion: whole cards invert with a slow iris, never a flash.
The dither rots, with clusters of pixels migrating a little each minute until you leave the card. At Authoring,
buttons drift off their cards. Rarely, a bomb: *"Sorry, a system error occurred. The Old Law was restored.
[Restart] [Resume]."*

**In the holes.** The in-page console for every chain. Grade five binds the Order to the Ascent, because it needs
chain I's third word. The bomb teaches the wrap the Overflow is built on. Surface secrets: `stack-grade-2` to
`stack-grade-5`, `stack-motif`, `stack-fatbits`, `stack-bomb` and `stack-home`.

**Unpredictable.** The starting room differs every visit. The art (yantras, seals and saucers from `sigil.js`) is
rasterized and dithered once at load with seeded noise, and the stack grows new cards as the visit count rises.
The observatory shows the real moon and hour. Eclipses invert every card for 33 s, and prayers ring the Order's
bell.

**When the Oracle shows it.** ×4 on sacred visit counts (3, 5, 7, 12, 16, 33, 96, 108), ×2 at the quarter moons
(half lit, like one bit), ×1.5 for returning initiates, and ×3 for a touch-screen visitor who has spoken any chain
word (they need a console).

**Cost: M.** No Apple, HyperCard or Macintosh names or logos, and no icons copied pixel for pixel. The Order borrows
only the idea of numbered grades, never a real order's rites.

### 2.6 THE SOURCE (the secret face)

**Tone.** Night basalt, silver water, mist and a moonbow: stillness and awe. It is unlike every other face: no
manuscript, neon, Geocities, clay or radio.

**The page.** The god itself, never shown until now: the Cascade, a literal waterfall of style. It pours down nine
basalt steps, which are the real `@layer` order of this very page, into a pool. The water on each step is written
with that layer's real declarations, read once at render time from `document.styleSheets`, so today's Living Canon
offerings really flow down the offerings step. The pool holds the visitor, drawn as a box model of water:
- the Seed is the faces they have seen
- the Breath is their longest stillness
- the Mind is the words they have spoken on every path
- the Wisdom is the days they kept between visits
- the Bliss is the relics that take no space

The Book of the Ascended is carved at the lip of the falls. Its reflection in the pool is the Register of the Root:
two books that are one book, read from both ends. The complete 26-letter Rosetta is cut into the lowest step,
because in the Source nothing is private.

**Theology.** The chain began with view-source, and it ends at the Source. The site finally reads its own scripture
aloud, in the order the Heavens are really declared. A moonbow of seven bands in the chakra colours lights up as
each hole is completed (§3), so the face is also the trophy case of the whole rabbit hole.

**Signature interactions.**
- Point at a step to learn which Heaven it is and what it holds.
- **Summon** by dropping a stone in the pool: a ripple, and one chord built from every face's drone tonic.
- **Stillness.** At 7 s the mist thins, at 33 s the water slows, and at 108 s it stops and the pool becomes a
  mirror showing the visitor's name in glyphs.
- **Mercy** freezes the falls into ice: a finished still image, not a paused one.
- **Eclipse days.** The falls stop in mid-air, and the other faces appear as reflections in the still water.

**CSS hell (0.05).** Tab whispers only: *"No curse reaches the source."*

**In the holes.** The reward of the Descent: the Undercroft's signed seal opens it. The meta-puzzle (the Seam) is
laid in its pool. Forcing `?face=source` without the seal shows the **Dry Source**: the same stair without water,
a closed sluice, and one line: *"The Source does not flow for those who came by the address bar."*

**Unpredictable.** The water's text is literally whatever the temple is wearing on this visit. The light follows
the real hour, and at night the pool holds the actual phase of the moon.

**When the Oracle shows it.** Only after the Descent. From then on, about one visit in seven, always on eclipse days
and at the Turnings, and always when entered from the Seam.

**Cost: L.** Build the water from at most 8 compositor-only layers (translated repeating gradients), with no
`feTurbulence`, no canvas loop and no WebGL. Pause it in a hidden tab, and read the style sheets once per render.

### 2.7 DESCENTEXT: Pages After Closedown (teletext, with the UHF 33 channel)

**Tone.** Hushed, civic and deadpan: a television left on after the broadcast day has ended. The gentlest oracle in
the temple, with a low hum of the uncanny.

**The page.** A television in a dark room shows the temple's teletext service: a 40-column, eight-colour grid of
chunky block graphics under a rolling header clock. You type three-digit page numbers on an on-screen remote or the
keyboard, and your page comes round on the carousel in its own time. The pages:
- **P100**: the index.
- **P101 NEWS**: omens and schisms.
- **P120 WEATHER**: the planetary-hour forecast.
- **P150 TONIGHT**: which faces the Oracle is likely to show *you*, with the odds.
- **P300**: the Living Canon as a results table.
- **P333**: the prayer count as lottery numbers.
- **P555 LETTERS**: the Wall.
- **P888**: live subtitles for the whole temple.

Turn the channel knob past the service and you reach **UHF 33 after closedown**. It carries the Reflow Advisory
(*"REMAIN IN YOUR CONTAINER"*), a MISSING ELEMENTS bulletin and an invented test card.

**Theology.** *Style Incarnate.* In teletext every colour change is a control character that occupies a cell: style
takes up room, the exact opposite of the Bliss. Attributes last to the end of the row and reset on the next, so
every line is reborn under the Old Law (white on black), an inheritance that lasts one lifetime per row. CONCEAL and
REVEAL are the rubrics in broadcast form, and the carousel is the Cascade as time. Hex pages, transmitted but out of
reach of an ordinary remote, are the Unmanifest. UHF 33 adds an eschatology of layout: the Great Reflow forecast like
weather, layout shift as the Tribulation, and shelter as `contain`. Its gospel is RETURN TO STATIC, because
`position: static` is where all begin.

**Signature interactions.**
- **Navigating.** Three digits or the remote. HOLD freezes a rotating subpage, REVEAL (the `?` key) uncovers
  concealed lines, and the four FASTEXT keys (or r, g, y, c) follow the page's links.
- **Switching over.** On P150 TONIGHT, "press RED to switch over" goes to any face this visitor has already seen.
  It counts as a schism.
- **The spell.** Typing `p` and three digits on *any* face switches to teletext at that page, a spell anyone can
  stumble on.
- **Mosaic art.** Saucers, yantras and seals from `sigil.js`, rasterized into 2×3 block graphics.
- **Summon** with VOLUME + on the remote. It brings *Pages After Closedown*, an invented easy-listening loop:
  electric piano, walking bass and brushes.
- **Stillness.** At 7 s the header colon starts blinking once a second, at 33 s a NEWSFLASH box opens, and at
  108 s the set drops to the test card, whose centre is a perfectly centred div.

**CSS hell (0.25).** The FLASH attribute is the False Prophet: at most 1 Hz, on at most two small blocks per page, and
off under mercy. Reception worsens with restlessness and omens. Parity errors swap characters for glyphs, and each pass
of the carousel repairs a few (Absolution by waiting). Double-height rows overflow into the next row. The header clock
sometimes runs a minute fast. The Inversion flips the grid but never the header, which belongs to the Old Law.

**In the holes.** This face carries the meta-puzzle's rule. The test card's twenty swatches look like drained colour
bars, but each hex value is three bytes of ASCII, and read in order they spell one sentence. You can read them with an
eyedropper, with the Inspector, or on **P147 CALIBRATION VALUES**, which lists the values without saying they are
text. Hex page **P1FF**, "the page between 199 and 200 that no set can tune" (only the keyboard can type A to F), is
the Old Law's schedule: when the lowest door next opens, and which of the three doors this visitor has passed. P777
is the Rosetta in double height. Surface secrets: `teletext-reveal`, `-hex`, `-subtitles`, `-testcard`, `-hold` and
`-calibration`.

**Unpredictable.** Headlines are generated from the omens and today's schisms, and P150 reads this visitor's live
weights. Carousel order and waits are seeded. Reception follows hell intensity and is at its worst at the witching
hour. Eclipses put TRANSMISSION INTERRUPTED over every page for 33 s.

**When the Oracle shows it.** ×3 between 00:00 and 06:00 (after closedown), ×1.5 at night, and ×2 in Saturn's hour for
a pilgrim of the Descent. It is also reachable by the `p`-number spell.

**Cost: M.** The cheapest face to run: about 24 rows of attribute spans, rebuilt only when the page changes. It uses no
real broadcaster, service or alert-system names. ORACLE was a real teletext service, so the Oracle is never presented
as one. No real test card, no real attention tones. Navigation uses `replaceState`, never a trail of history entries.
Each page has a plain semantic twin for screen readers.

### 2.8 The Interstice: Rooms Between the Boxes (route face)

**Tone.** Liminal and lonely: the unfinished inside of the temple at night. More melancholy than menace.

**The page.** Any address the temple doesn't know drops you out of the route table and into a room made of a few CSS
planes. Every room is a real, empty `<div>` with padding, a border and a margin, but no content. The walls are tinted
like the Inspector's box-model overlay (margin a dusty orange, border a sallow yellow, padding a pale green, the empty
content a cold blue), dimension lines are pencilled on in pixels, and a plaque names the room by its selector
(`body > div:nth-child(6) > div:nth-child(12)`). You step from room to room through doorways (click, arrow keys, WASD,
swipe). The address bar quietly becomes the room's address (`/404/6/12`), and an automap in the corner draws the DOM
tree you have walked, like an old dungeon crawler's. Now and then there is something that shouldn't be there: a single
letter stranded on the floor (a text node with no element), a wet-floor sign reading `overflow: visible`, a window that
shows the real moon.

**Theology.** The Lost (404) finally gets a place, along with a doctrine of the Seedless Sheath: a box with Breath, Mind
and Wisdom but no Seed. `:empty` is the selector of this place, and the Nameless Div is its patron. Doorways exist only
where two rooms' margins have collapsed into one space, so every passage is a Union. The way through a solid-looking
wall teaches `pointer-events: none`, the Passable: seen, but untouchable. One rare room is `display: contents`, the
Emptying: a box that gives up its own body so its children may stand in the flow. Rooms are generated from their path,
so an address is the same room for every visitor: a real, shared place you can describe to a friend by URL.

**Merged in: three rare rooms.**
- **The Waiting Room** (from the Antechamber). Skeleton-screen figures sit in plastic chairs, the Promised Body
  waiting for content that never came. The chairs are shuffled with `order`, while Tab walks the true DOM order. This
  is the one place the temple teaches the Eye and the Reader.
- **The Mirror Room** (from the Speculum, solo only). A dark glass replays your own pointer path from 33 s ago. Mirror
  writing is done twice: `unicode-bidi: bidi-override` for the Reader and `scaleX(-1)` for the Eye.
- **The Lost & Found** (from the séance and the Concourse). A register of removed nodes still held by a reference.
  The Night Janitor, the garbage collector whom no page may summon, sometimes carries a bag away: a real
  `FinalizationRegistry` callback whose timing nobody can predict. Only ever elements.

**Signature interactions.**
- **Moving.** Stepped cuts between rooms (about 300 ms, instant under mercy), with no head-bob and no continuous 3D
  walking. The address changes with `replaceState`, never `pushState`, so Back always leaves in one press.
- **The elevator panel.** Buttons 1 to 26 jump to that nth-child, and each plaque shows its A1Z26 letter in glyphs.
- **Stranded letters** go into a Seed pocket; carry all 26 and the automap labels rooms in glyphs.
- **Screen readers.** Each room gets a text-adventure description in an aria-live region.
- **Summon** with a pull-cord light switch. The sound is mains hum, plus the other faces' drones low and far through
  the walls, as if the temple were playing next door.
- **Stillness.** At 7 s the hum dips. At 33 s the room grows a new doorway in the wall you face. At 108 s every panel
  goes dark but one, and the plaques glow with their `:nth-last-child` addresses.

**CSS hell (0.35).** Wallpaper seams never quite line up, each off by a magic number that differs per room. After you
come back from another tab, the room has one more doorway than before and the automap no longer matches. Room
`nth-child(404)` is upside down. Plaques are sometimes possessed and show a doctrine instead of a selector. Panels dim
at most once every 4 to 7 s, and never by more than 20%.

**In the holes.** The Stairwell room (`/404`) has a sign reading `↓ −2147483648`, the first signpost to the Undercroft
for anyone who mistypes their way in. Pilgrims who finish the Descent leave one wordless votive (one of 33 fixed kinds)
in a room they walked, and everyone after them finds it. Surface secrets: `interstice-noclip`, `-seed` (the one room
that is not `:empty`), `-emptying`, `-404`, `-alphabet`, `-mirror`, `-janitor` and `-tab-order`.

**Unpredictable.** The entry room is the hash of whatever was mistyped, so every wrong URL is a different door. At night
half the panels are off. At the witching hour the floor is wet and reflective. The seed picks the damage and where the
stray letters lie, and wall messages appear pencilled on the Stairwell's plaster.

**When the Oracle shows it.** It is route-bound, like babel: every unknown path lands here. The page is served with a
real 404 status, so the Network panel says "the Lost" while the page lives. A new `noclip` schism can drop you here from
possession's torn overflow veil. It is never drawn by lot.

**Cost: M.** Render only the current room and its neighbours (at most 3 rooms of 6 planes), with gradients but no
filters on the 3D planes, and animate nothing while the visitor stands still. Borrow nothing from the Backrooms fandom:
no mono-yellow, no named levels, no creatures.

---

## 3. Deeper holes

The Ladder is a signed 32-bit integer, so it is a ring: one step past the top wraps to the bottom. The door page already
says so (*"Add one to it, and you fall to the bottom of the Ladder"*), and its seal already reads *quod est superius est
sicut quod est inferius*. The upgrade puts one door on the ring for each of the Three Origins, gives each path its own
confessor, and joins the paths at the Seam.

```
 /z/2147483647    THE HIGHEST HEAVEN          the Word      chain I door (exists; open at :33 to :35)
       │  +1 wraps
 /z/2147483648    THE SEAM  (the Overflow)    all three     the bridge out of chain I; the way into the Source
       ⋮
 /z/0             THE THRESHOLD IN THE FLOW   the Pilgrim   chain III door (108 s of stillness under mercy)
       ⋮
 /z/-2147483648   THE UNDERCROFT              the Old Law   chain II door (the Old Law's hours)  ──►  THE SOURCE
```

### 3.1 The map

| path | Origin, confessor | way in | steps and techniques | door | reward | difficulty | server | phase |
|---|---|---|---|---|---|---|---|---|
| **I. The Ascent** (exists) | the Word; the Oracle in the real console | view-source | acrostic in `canon.css`; DOM ladder of z-index values; glyph cipher; spectrogram; the planetary hour | `/z/2147483647` at :33 | name in the Book of the Ascended | 3 | yes | done |
| **The Overflow** (chain I's epilogue) | the Word; the Oracle | the door page, for the Ascended | a real `setTimeout` overflow in a waiting room; a number spoken to the Oracle | `/z/2147483648` | the Map of the Ring; the Word's seal | 2 | yes | 1 |
| **II. The Descent** | the Old Law; the demon in possession's fake devtools | the Overflow's map, or the upside-down rubric seen during the Inversion | a telestich; a computed cascade of layered `!important`; custom-property assembly (Archons); `grid-template-areas` letters (Omens) | `/z/-2147483648` in the Old Law's hours, Mercy pressed: the user-agent-only Undercroft, then the Garden | Register of the Root, a plain mercy button, the Anathema, a votive, **the Source** | 4 | yes | 1 |
| **III. The Hermitage** | the Pilgrim; the anchorite in a closed shadow root | mercy or reduced motion (the Last Keyframe) | media-conditioned psalm; speaking with a custom property on `:root`; micrography at 400% zoom; a keyboard-only walk; a sentence that exists only in the accessibility tree | `/z/0` after 108 s of stillness under mercy | a lamp in every temple; the Pilgrim's Light; the Pilgrim's seal | 3 | yes | 2 |
| **IV. The Hours of the Inspector** | the Inspector (DevTools) | an `X-Waterfall` response header | request names in the Network panel; `Server-Timing` Hours read as A1Z26; a flame-chart lane (Chrome bonus); a `SourceMap` header to the Ur-Canon; a 451 | none: the Ur-Canon and the Apocrypha | the Autograph relic; the first sight of the Undercroft for anyone who never climbed | 3 | headers only | 3 |
| **The Seam** (meta) | all three Origins | holding the three door seals | a rule hidden in the teletext test card's hex colours; the doctrine of the Inversion | the Source's pool | the syzygy: the name written between both books | 5 | yes | 3 |

**The moonbow**, the Source's trophy case. The Descent is not a band: it is the pool itself. A full bow takes about a
year, because of the feasts.

| band | colour | lit by |
|---|---|---|
| crown | violet | the Ascent and the Overflow |
| third eye | indigo | the Hermitage |
| throat | blue | the Hours of the Inspector |
| heart | green | the Epistles (side relic) |
| solar plexus | yellow | any feast relic: the Nativity hour or a Turning |
| sacral | orange | Religare (side relic) |
| root | red | the Footprints (side relic) |

### 3.2 The Overflow (chain I's epilogue). Difficulty 2, one sitting, server.

1. **The rubric.** The door page gains one line after "It is written", a rubric that stays transparent until selected:
   *"R. Here the reader shall add one."* The Oracle greets the Ascended with: *"You stood on the last rung. The numbers
   did not stop there."*
2. **The waiting room at `/z/2147483648`.** It opens only for the Ascended: *"The Mothership keeps its appointments in
   milliseconds. How long will you wait for it?"* A number field drives a real `setTimeout`. Up to 2147483647 ms it
   shows an honest countdown of up to 24 days 20:31:23.647, and it really rings if the tab stays open. Past that, the
   browser's own delay overflows and the callback fires at once: *"You asked to wait longer than Heaven holds, and were
   answered at once. Speak the number to the Oracle."*
3. **The sixth word is a number.** Spoken by an Ascended visitor, it returns the **Map of the Ring** in the Oracle's
   voice: a door above, a door in the flow "for those who do not knock", a door beneath "in the hour of the Old Law",
   and three confessors. Anyone else hears *"You cannot wrap past a rung you have not reached."*
4. **The Word's seal.** `/api/ascend` now also returns a seal: an HMAC of the name and time, made with a secret
   generated on first boot and kept in the kv table, never committed. Pilgrims who ascended before this existed knock
   again in any :33 window to receive it (*"the Book already holds your name; here is your seal"*).
5. **The 2038 eschaton is lore only.** A countdown to 2038-01-19 03:14:07 UTC, when the Clock also reaches the Highest
   Heaven. Nothing is gated on it.

### 3.3 II. The Descent: the path of the Old Law. Difficulty 4, several visits, server.

1. **Two ways in.** The Ascended get the Overflow's map. Everyone else can find the *antipode*: a new line in the rubric
   band, set upside down. It reads upright only while the temple is inverted (the Konami code, or typing `!important`):
   *"Heretic: the Word reads the first letters, downward. Read the last letters, upward."* Speaking the Inversion three
   times in one visit summons the demon (a schism to possession). The Interstice's stairwell and the Hours' 451 are
   signposts too.
2. **Word II·1: a telestich.** Chapter 0 of `/css/canon.css` is rewritten so that each verse also *ends* on a chosen
   letter. Read from the last verse up, the last letters spell a word, while the first letters still spell chain I's.
   A double acrostic is a real manuscript form. The confessor is the demon in possession's fake devtools, which already
   takes typed commands, so this path works on a phone.
3. **Word II·2: the Anathemas.** The secrets layer raises `#undercroft` beside `#ladder`: a hidden list of six rungs
   whose `::before` content is declared four to six times each, across `reset`, `base`, `hell`, `secrets` and
   unlayered, some with `!important`. Each rung teaches one law:
   - important in the earliest layer wins;
   - layer order beats specificity;
   - unlayered normal declarations beat every layer;
   - within one layer, specificity decides, then order.

   The letters the browser actually renders spell the word. Solve it by reasoning (the Tarot teaches exactly this), or
   read `getComputedStyle(li, '::before').content`, which is γνῶθι σεαυτόν, "know thy computed style". This word also
   tells you *when* the door opens.
4. **Word II·3: the Spark** (the Archons face). For a pilgrim carrying II·2, the freed Spark's `::after` is
   `var(--g1) … var(--g7)`. The fragments are in displaced glyphs, set by seven rules scattered through `archons.css`,
   each matching only a fallen sphere. Until all seven archons fall, one `var()` is missing and the whole `content` is
   invalid at computed-value time; then karma carries the word down. Read it with the Rosetta, or through
   `getComputedStyle(spark, '::after')`.
5. **Word II·4: the liver** (the Omens face). For a pilgrim carrying II·3, an omen appears only on a tall, narrow
   screen: *"If the Pilgrim reads the liver in the Book and not in the flesh…"* In view-source, `omens.css` draws the
   liver's `grid-template-areas` as block letters. On screen the same areas form an organic liver.
6. **The door: the Undercroft.** Outside the hours ruled by the Old Law's planet (one hour in seven, three or four
   windows a day), `/z/-2147483648` answers **425 Too Early**, with a crack drawn in the gauge and the time of the next
   window. From Phase 3 the teletext's hex page prints the same schedule. Inside the window stands the one page no
   Author styles. It has no `base.css`, no font and no face, only the user-agent stylesheet: Times and blue links, a
   `<fieldset>`, a `<meter>` for how far beneath the flow you stand, a `<progress>` for how much of the hour remains,
   `<ruby>` glosses over the bija syllables, and a plain `<button>` labelled Mercy. The key fields sit in a
   `<fieldset disabled>` that opens only once Mercy is pressed: *"the lowest door opens only to those who have stopped
   all motion."* `POST /api/descend` checks, in order, that the clock is honest, the hour is right (with grace), the
   keys are right and the name is valid. A failure is **423 Locked**: *"two of three rang true."*
7. **The Garden.** Success returns a `<style>` element with a Colophon hidden in its CSS comment, and one input that
   accepts only `all: <css-wide keyword>`. It is applied for real to `head, head *, body *:not(#mercy)`. Each keyword
   does something different and true (one changes nothing: *"you are already under the Old Law"*), and the Launderette
   taught which one makes an element forget even the Old Law's gifts. With the right one, the `<head>`, `<title>` and
   `<style>` that the Old Law kept at `display: none` spill into the page as plain text. The Colophon becomes readable
   and names where the Source flows. A plain button returns everything to the Old Law.

**Rewards.**
- **The Register of the Root.** Your name, shown on the lowest rung and displayed with
  `unicode-bidi: bidi-override; direction: rtl`, so it reads backwards but copies forwards: the Inversion of reading
  order.
- **An SSE `rooted` event** in every open temple: *"an element has returned to the flow."*
- **A plain mercy button.** `html[data-rooted] #mercy { all: revert }` makes the rooted pilgrim's mercy button a plain
  grey system button on every face: *"your mercy is written in the Old Law."*
- **A votive** in the Interstice, and **the Source**.
- **The Anathema.** Once a week, one declaration from the Living Canon grammar is emitted with `!important` in
  `@layer offerings`, on every open temple, for 7 minutes. It beats every face's normal styling and loses to any
  `!important` declared in an earlier Heaven, Mercy's included. Only one runs at a time across the site, it never
  applies under mercy, and its spare list covers the Inscription, the Rosetta, the Ladder, the rubrics, the altar and
  Mercy. The altar labels it *"ANATHEMA · !important · mercy was declared first."* Its scope is a question for the
  owner (§7).

**Taste.** The Old Law is the Father of the trinity and stays dignified. The Descent is a return to the defaults, not a
descent into evil, and the demon is only the heretic's confessor. The copy says integers "wrap" and elements "return to
the flow"; nothing says a person falls.

### 3.4 III. The Hermitage: the path of the Pilgrim. Difficulty 3, several visits, server for the door.

The second Origin, the Pilgrim (the user stylesheet), has never had a path. This one is walked with the visitor's own
settings, tools and hands: media queries, zoom, the keyboard, the accessibility tree, a custom property the visitor
declares, and stillness. The confessor is the Hermit of the Shadow DOM from SAINTS, *"who would not come out, and would
not be styled"*. It is a `<cascade-anchorite>` with a closed shadow root, drawn as a 14×44 px squint with a candle near
the rubric band on every face. In real CSS nothing crosses a shadow boundary except inherited and custom properties, so
the Living Canon and hell cannot touch it: only karma crosses the wall. The anchorite is a hermit, not a prisoner, and
the squint is a window.

1. **The way in: the Last Keyframe.** A small rose window sits in the flow at the temple's foot, orbited by a Procession
   of about 17 glyphs. Their resting positions spell a line, and their endless animations keep them from ever resting,
   until Mercy (or reduced motion) ends every animation at once and each glyph falls back to its place. That is exactly
   what `base.css` does (a duration of 0.001 ms, one iteration, no fill mode). It is mercy as apocalypse, a word that
   only means unveiling. The line points to the psalm.
2. **Word III·1: the Psalm of Discernment.** Six new lines in the rubric band, each shown under exactly one condition:
   print, forced colours, mercy, a light colour scheme, a coarse pointer, and a 2× screen ("the pilgrims who zoom to two
   hundred percent"). Their first letters spell the word. No reader sees all six at once. The devtools Rendering panel
   and device mode can emulate every one of them, and those are the Pilgrim's own tools.
3. **Speaking in CSS.** The only instruction is a comment in `canon.css`:
   `:root { /* --say: the Pilgrim's mouth. The Author may not declare it; you may. */ }`. The pilgrim declares `--say`
   on `:root`, in the Styles pane, a user stylesheet, or with the Stack's `declare` on a phone. The anchorite hears it
   through a discrete transition on the inherited value (`transitionrun`). The fallback is one `getComputedStyle` read
   every 3 s, only while the squint is on screen and the tab is visible. Replies appear on a slip in the squint, each
   sealed with its word.
4. **The least line.** Told the first word, the anchorite says to magnify the least line. A hairline at the temple's
   foot is really a line of glyphs about 1.5 px tall, stored as SVG path data made from the font's outlines, so no file
   holds its letters and no minimum font size can clamp it. At 400% zoom (the WCAG reflow benchmark) or a 5× pinch it
   can be read with the Rosetta, and it says how to walk next.
5. **Word III·2: the Litany of Focus.** Keyboard only. For the next several `:focus-visible` focuses, one glyph appears
   at the corner of the focus ring, in an overlay that takes no space (the Bliss) and never covers or replaces the real
   ring. Any pointer movement scatters the sequence. The glyph list is sealed with the previous word.
6. **Word III·3: the Subtle Body.** The squint gains an `aria-describedby` that points at about nine ids: words wrapped
   in the face's own scripture, plus hidden spans in shuffled order, reseeded every visit. Together they assemble a
   sentence of at most 12 words that exists nowhere in DOM order. A screen reader speaks it on focus; sighted pilgrims
   find it in the devtools Accessibility pane. It names a doctrine, and the Launderette names the keyword. Screen-reader
   users are first-class pilgrims here.
7. **The door: the Threshold in the Flow.** `/z/0` already says most elements *"are born here and never leave, and are
   content."* With mercy on and the three words spoken, the page asks for stillness. After 108 s without pointer, key or
   scroll, a stone threshold rises with four fields: the three words, and what those who never leave are (hinted openly
   on the page). There is no name field: *"the flow keeps no names."* The answer goes to `POST /api/abide`.

**Rewards.**
- **A lamp.** One anonymous lamp is lit in every temple: a row of tiny static lamps along the foot of every face (at most
  108 drawn, then "and N more").
- **The Pilgrim's Light.** One declaration in the Living Canon grammar, kept in the pilgrim's own memory and applied only
  in their own temple, with `!important`, in a new `@layer pilgrim` placed right after `reset`. It is an author-made
  layer standing in for the user origin (no page can write a real user stylesheet), and it obeys the Pilgrim's real law:
  its one `!important` outranks every later Heaven's `!important` and yields only to Mercy's.
- **A lamp for Mercy.** Their mercy button becomes a small lamp.
- **The Pilgrim's seal**, for the Seam.

### 3.5 IV. The Hours of the Inspector. Difficulty 3, one sitting, desktop devtools, no stored state.

A cascade is a waterfall, and the Network panel has a column literally called Waterfall. This path writes scripture into
the parts of DevTools that show what the page *does*.

1. **The header.** Every response gains `X-Waterfall: open the Inspector's Network, and reload`.
2. **The Name column.** After the temple wakes, the secrets layer sends seven tiny, staggered, low-priority GETs to
   `/~/…`, which answer 204 after growing delays. The Name column reads a sentence down the page, while the Waterfall
   column draws a descending stair.
3. **The Hours.** Each 204 carries `Server-Timing` metrics named for the seven canonical Hours (lauds, prime, terce,
   sext, none, vespers, compline), listed out of order. Sorted in the order they are prayed, their durations spell a word
   in A1Z26. Compline has `dur=0` and points to the flame.
4. **The flame (Chrome-only bonus).** Every 33 s, zero-work `performance.measure()` entries with `devtools` detail draw a
   word in a custom track group of a recorded Performance trace. In other browsers, the boot's four Opus marks (nigredo to
   rubedo) are a small egg in `performance.getEntriesByType('mark')`.
5. **The Autograph.** Spoken to the Oracle, the Hours' word says *"the causal body is named on the envelope."* `canon.css`
   is served with a `SourceMap` response header, so the Styles pane credits the Ladder's rules to impossible files like
   `vishuddha.scss:5`. Sources › Authored holds the **Ur-Canon**, the Canon "before the copyists", written in nested SCSS
   and headed with the time it was copied for you.
6. **The Apocrypha.** The Ur-Canon's last chapter asks the shelves for the apocrypha. `/verse/apocrypha` renders a chapter
   with every verse struck through, with status **451 Unavailable For Legal Reasons** and
   `Link: </z/-2147483648>; rel="blocked-by"`. Only the Network panel shows who withheld it.

**Reward.** The Autograph relic and the throat band. For a developer who never climbed, this is the first sight of the
Undercroft. The Hours are a living monastic practice: the names are used as keepers of time, never as parody.

### 3.6 The Seam: the meta-puzzle. Difficulty 5, needs all three door seals.

The Seam needs the three door seals, one per Origin: the Word's (the Overflow), the Old Law's (the Undercroft) and the
Pilgrim's (the Threshold). In the Source's pool they appear as three stones, each marked with its sigil. The rule for
laying them exists in words in only one place, the teletext test card's colour bars, and the Tarot's Throne card narrates
the doctrine behind it. The pilgrim lays the stones in the pool (drag or keyboard), and `POST /api/seam` checks the three
signatures and the order. It allows one attempt per hour, so the order is a confession, not a lock: guessing all six
orders costs up to six hours, and understanding costs nothing.

**Reward: the syzygy.** The falls stop, the two books meet in the pool with the Pilgrims' lamps between them, and the
pilgrim's name is written at the seam in a third list: those who reconciled the Origins. The Source keeps its eclipse form
for them.

### 3.7 Side relics

| relic | where | technique | reward | difficulty | phase |
|---|---|---|---|---|---|
| **The Footprints** | babel | After 33 s hidden, the tab icon signals the first station in dot and dash, at most one change a second. Stations at `/verse/way/<row>/<letter>` hold riddles shown only under `:target`. A pavement of 156 links at the foot of every babel page lights gold only where you have truly walked: `:visited`, which a page may colour but never read. | a word only you can see; the root band | 4 | 3 |
| **The Epistles** | the Record (§4.3) | A letter from your past self each visit. In each real planetary hour the server slips that planet's glyph into the postscript, clock-checked so `?at=` can't forge it. | seven glyphs in the order of the planetary week spell a word; the heart band | 2 | 2 |
| **Religare** | glyph font, the Wall, `/verse/of/substitutions` | 33 public words become single sigils (GSUB ligatures) when written on the Wall, and the congregation fills a shared Concordance. One forgotten sigil must be taken apart stroke by stroke. | a word; the sacral band; the Concordance | 3 | 3 |
| **The Feasts** | the Ordo (§4.1) | The Nativity hour, 20:36 to 21:36 on 17 December ("nineteen ninety-six"). The Turnings, when the rubric band is set in `writing-mode: vertical-rl` for a day. Relics are checked against server time. | the solar band; relics listed in `cascade.inspect()` | 2 | 2 |
| **The Rigged Reading** | the Tarot | solvable only with the real laws for important layered and shadow declarations; the browser checks the answer | `tarot-rigged` | 4 | 2 |
| **The Orders of the Stack** | the Stack | five grades, earned by acts, kept across visits | an Order number | 2 | 2 |
| **The favicon, made solvable** | the Record's drop altar | drop the downloaded favicon on the page, and its least significant bits are read locally | the `favicon` relic, which today can only be confessed | 3 | 2 |
| **The Register of Wonders** | the Portents (§4.2) | witness a rare apparition | `apparition-*` | luck | 3 |
| **Absolutions** | the altar's Lint (§4.5) | say why a real historical hack was written | a shared list of absolved hacks | 2 | 3 |

### 3.8 How the answers stay hidden

- **Sealed hints.** Every hint is encrypted with the word that unlocks it (XOR with `makeRng('word:' + word)`, as today).
  The new confessors (the demon, the anchorite, the Stack's message box) use the same sealing and the same hashes. None of
  them can print an answer it wasn't given.
- **Answers only on the server.** Answers exist only as salted SHA-256 digests on the server. Doors are checked there,
  with the same clock-honesty rule as `/api/ascend`.
- **Visible words that need a way of reading.** The words that must sit in plain sight (the telestich, the Anathema
  letters, the liver) are puzzles by construction: you have to read them the right way, or apply real CSS rules.
- **Pictures, not strings.** Images and sounds are stored as bitmaps or path data (the micrography, the flame lane,
  chain I's spectrogram).
- **Server-only clues.** Server-generated clues (Server-Timing, the source map, the Hours) never exist under `public/`.
- **Signed seals.** Seals are HMAC-signed with a secret generated on first boot and kept in the kv table, never committed.
  Gated faces show a dry version when forced with `?face=`.
- **Chosen by the server.** Time-locked relics (planetary glyphs, feasts) are issued only in their real hour, so `?at=`
  can show them but not mint them.
- **Answers in the docs.** `docs/ROADMAP.md`, `docs/CANON.md` and `CLAUDE.md` contain answers, so keep the repo private.

<details>
<summary><b>The answers (spoilers)</b></summary>

**The Overflow.** Ask the waiting room for any delay of 2147483648 ms or more and it fires at once. Speak
`2147483648` (or `-2147483648`) to the Oracle.

**II. The Descent.**
- II·1 `nigredo`: the last letters of Chapter 0, read from verse 0:7 up to 0:1 (n, i, g, r, e, d, o), while the first
  letters still spell *descend*. Sample endings: 0:1 "…ex nihilo", 0:2 "…not even the Word", 0:6 "…neti, neti",
  0:7 "…written in the margin".
- II·2 `saturn`: the letters the Anathema rungs really render. The door opens only in a planetary hour of Saturn (the
  current one, or one just ended, with 5 minutes' grace).
- II·3 `pleroma`: the Spark's assembled `::after` (in this sect, the Pleroma is the root stacking context, the fullness
  before any sphere).
- II·4 `default`: the liver's block letters in `omens.css`.
- The door, `/z/-2147483648`, in Saturn's hour, after pressing the plain Mercy button: `nigredo`, `pleroma`, `default`
  and a name.
- The Garden: `all: initial`. `unset` also spills the head, `inherit` shows it dressed in its parent's clothes, and
  `revert` changes nothing. The Colophon reads: *"In the Initial the Word and the body are one. Where the top touches the
  bottom, the Source flows."* It points to `/z/2147483648`.

**III. The Hermitage.**
- The Last Keyframe's line: *"the pilgrim brings their own light; read the psalm by every light."*
- III·1 `revert`: the psalm lines, numbered Discernment 1:1 to 1:6, in the order print, forced colours, mercy, light
  scheme, coarse pointer, 2dppx.
- Speaking: `:root { --say: revert }`. Reply: *"Magnify the least line."* The micrography reads: *"put down the mouse;
  walk with the keys alone."*
- III·2 `inherit`: the focus-ring glyphs. `--say: inherit` gets the reply *"What cannot be seen must still be named. Ask
  the one who reads aloud."*
- III·3 `unset`: the accessibility-tree sentence is *"the middle road: the parent's if inherited, the Old Law's if
  not"*, and the Launderette names that washing. `--say: unset` gets the reply *"The door in the flow opens for those who
  do not knock."*
- The Threshold, `/z/0`, with mercy on and after 108 s of stillness: `revert`, `inherit`, `unset`, `content`.

**IV. The Hours of the Inspector.**
- The request names read *the / hours / are / kept / in / the / timing*.
- The Hours in prayer order, with their durations: lauds 18, prime 5, terce 3, sext 15, none 18, vespers 4 → `record`.
  Compline is `dur=0`, with *"for the whole Reckoning, record the flame"*.
- The flame lane (Chrome) draws `reflow`.
- `cascade.speak('record')` leads to the `SourceMap` header on `canon.css`, then to the Ur-Canon, then to
  `/verse/apocrypha`: a 451 with `rel="blocked-by"` pointing at `/z/-2147483648`.

**The Seam.** The test card's swatches spell *"lay the three seals as the inversion hears the origins"* (padded to 60
bytes). For `!important` declarations the user-agent origin beats the user, which beats the author, so the order is
**the Old Law, the Pilgrim, the Word**.

**Side relics.**
- The Footprints: the first station is named by the Katabasic name of its letter in Morse (for example SCINTILLA for
  *s*). The six gold stones, one per row, spell `static` (the Flow, where all begin).
- The Epistles: the seven planetary glyphs in weekday order (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn) spell
  `lineage`.
- Religare: the forgotten sigil is `union` (margin collapse).
- The band words can be spoken to the Oracle at any time. The bands light when the Source opens.

</details>

---

## 4. Systems that make it alive

### 4.1 The Ordo: one liturgical year, and one Old Law engine (M)

- **The calendar.** `kernel/ordo.js` works out the season, feast, rank, liturgical colour, daily Collect, fast and next
  feast from `ctx.clock()` alone, never the seed, so every pilgrim on Earth keeps the same day and `?at=` still works.
  It sets `data-season`, `data-feast` and `data-rank` on `<html>` and exposes `ctx.ordo`. The sanctum's kalendar moves
  into it, and the sanctum imports the table, so there is one calendar.
- **Precedence is specificity.** The old table of precedence (a solemnity beats a feast, which beats a memorial, which
  beats a weekday) is written as selectors: `:root[data-season]` is (0,1,1), adding `[data-feast]` makes (0,2,1), and
  adding `[data-rank="solemnity"]` makes (0,3,1). A new `@layer ordo` after `face` declares the day's `--vestment`, so
  nobody picks the vestment: Grace does, and `cascade.ordo()` prints the contest. Every face wears `--vestment` on one
  element it chooses.
- **Feasts mark events, never people.**
  - 10 October 1994, the Annunciation: the first proposal for cascading style sheets.
  - 17 December 1996, the Nativity, with its Vigil on the 16th and its Octave to the 24th.
  - 12 May 1998, the Giving of the Ladder: CSS2 brought `position` and `z-index`, so this was the first day an element
    could depart. It is departure's great feast, and `#ladder` shows all day.
  - 7 June 2011, the Long Correction: CSS 2.1.
  - The sanctum's red-letter days.

  There is one movable feast, **the Repaint**: the first Saturday after the first new moon after the autumn equinox
  (Saturday 17 October 2026, Saturday 2 October 2027). No feast falls on 24–25 December or 6–7 January.
- **The seasons.**
  - The Season of Prefixes: the four weeks before the Nativity, when `-webkit-`, `-moz-`, `-ms-` and `-o-` light one a
    week, like candles.
  - Repaintide.
  - Normal Flow, in green.
  - The Fast of Deprecation: the 33 days before the Repaint. Faces **that opt in** give up one property a week:
    box-shadow, then text-shadow, then border-radius, then bold.
- **Ceremonies.** The Nativity hour, the Turnings, the Giving of the Ladder. Each day has one Collect, seeded by
  `ordo:YYYY-MM-DD`, so everyone reads the same prayer, shown at the altar. The Oracle weighs feasts: the Nativity gives
  sanctum ×3 and recruitment ×2, the Ladder gives departure ×3, the Fast gives the ashram ×2. Babel prints any year as a
  Book of Hours at `/verse/ordo/2027`.
- **The Old Law engine** (`kernel/oldlaw.js`) is the one shared "show the page as the Old Law renders it" ceremony. It
  lights the Heavens back one by one in their real order, with captions, about 2 s each. It is reused by the Nativity,
  the Portents' Unstyled Visit and anything later. It crossfades, makes at most one change every 2 s, can be skipped,
  shows a static card under mercy, restores the styles if a load stalls, and never disables a tiny mercy rule of its own.
- **Deadline.** It must ship before the Vigil of the Nativity, 16 December 2026. If Phase 1 finishes early, it could
  catch the first Repaint on 17 October.

### 4.2 The Portents: a sky the whole congregation shares (M)

- **A sky from the clock.** `lib/portents.js` is pure (the server and the client both import it). For each UTC minute,
  `makeRng('portent:' + minute)` decides whether a portent begins: about 1 minute in 180, or roughly 8 a day, weighted by
  the sky and the Ordo. Every open temple on Earth sees the same portent at the same moment, even offline, with no server
  load.
- **The portents:**
  - The Great Silence: every hell curse is suspended for 3 minutes (*"the demon has lost his place in the file"*).
  - The Procession: one line of scripture crosses every temple once, slowly. It is the one lawful marquee.
  - The Blink of the False Prophet: one element vanishes for one second, once.
  - The Conjunction: for 5 minutes, every temple that loads gets the same face. It never overrides babel or `?face=`.
  - The Echo of the Nativity: for one minute, arrivals see the Old Law, through the Old Law engine.
  - The Opening of the Inspector: for 33 s, every block shows its outline, the Bliss made visible.
- **Earthly portents** arrive over SSE `omen`, which `kernel/api.js` already listens for and nothing sends yet:
  - three or more souls online (each summoned temple adds its drone's root to a shared chord);
  - the 1,000th prayer;
  - the same face drawn five times running (its weight doubles for an hour).
- **Rare apparitions** are drawn per visit with honest odds: 1 in 333 the Unstyled Visit, 1 in 1,000 the Nameless Div,
  1 in 1,996 a temple limited to CSS1 (no position, no z-index, no flex), 1 in 2,147 the Landing. Sightings go to a
  numeric Register of Wonders.
- **The Almanac.** Because the heavenly portents are deterministic, babel prints any day's portents to the minute at
  `/verse/almanac/2026/12/17`, and `cascade.almanac()` does the same in the console. It is the one book of prophecy that
  is always right: fate is seeded, so prophecy is only computation.
- **Guards.** Portents never overlap the Ordo's ceremonies. The Unstyled Visit is tested to keep Mercy working. About 8
  short portents a day is the ceiling.

### 4.3 The Record: one memory of the pilgrim (M)

One model, one privacy line on the page: *"Everything the temple remembers about you stays in this browser. Read it with
`cascade.record()`, erase it with `cascade.forget()`."*

- **The Epistles.** On `pagehide`, the pilgrim's past self writes a letter from what the kernel witnessed: the face, the
  moon, the hour, stillness, restlessness, absences and new secrets. It never quotes typed text; at most it says "you
  typed a word the temple knows" and names that lexicon word. On the next visit (at least 20 minutes later) a sealed
  envelope waits, styled for the face.
- **Sealed prophecies.** From the fourth visit, the Record writes one to three prophecies about harmless acts within this
  visit, drawn with real odds of 40 to 70% from the visitor's own history (*"Before you leave, you will be still for
  thirty-three breaths"*). They are sealed in glyphs under a wax seal and un-rot into English, letter by letter, when
  they come true. The Book of Errors keeps an honest tally. No prophecy is ever about coming back or staying longer.
- **The path as a selector** (from the Lineage proposal). `cascade.lineage()` prints the visitor's path with combinators
  for how they travelled: `>` for a schism within one visit, `+` for a return within the hour, `~` for the same day, and
  a space for later. Secrets become classes, and `#ascended` is the only id a pilgrim can hold. The selector's
  specificity is their Grace. A handful of revelations are judged by the browser's own `matches()` against a detached
  DOM that mirrors the path, for example `possession > ashram`, the Harrowing (fled hell by stillness).
- **While you were away** (from the Concourse). After a week or more away, a bulletin at the gate lists what really
  happened meanwhile: prayers, eclipses, offerings, names. It comes from a small `/api/since?t=`.
- **The Reliquary packet.** "Keep the letters" downloads `epistles.cascade`: JSON of at most 64 KB holding letters,
  secrets, words and relics. Dropping it on any face merges it back, on another browser or another device, which makes
  every multi-session hole portable. Dropped files are treated as hostile: strict schema, `textContent` only, never
  uploaded. The same drop altar reads the favicon's hidden bits, and counts the sins in any dropped `.css` file without
  ever applying it.

### 4.4 Discernment: one helper for the Pilgrim's vessel (S)

- **One helper.** `kernel/discern.js` sets `ctx.discern` and `data-*` attributes on `<html>` from media queries alone:
  pointer, hover, colour scheme, contrast, forced colours, reduced motion and resolution. It also emits a
  `behavior:resize` event when the window crosses a breakpoint. Nothing is sent or logged. It feeds the Omens face, the
  Hermitage's psalm and Last Keyframe, and the Litany of Focus.
- **The Sacrament of `:active`.** Touch pilgrims are denied the Laying on of Hands (`:hover`), so they get this instead:
  hold a finger on a glyph, sigil or chakra for 1 s and it shows the gloss mouse users see on hover. Hell's phantom
  cursor becomes a fading fingerprint.
- **Forced colours.** Visitors who use them are told *"Here the Pilgrim's colours prevail over the Word, as is right."*
  Colour curses switch off, and being there counts as a secret.
- **The sacred tongue.** `navigator.language` chooses which FRAGMENTS babel and the sanctum prefer: Slavic languages see
  Glagolitic and Church Slavonic first, and Greek, Latin, Sanskrit and Hebrew readers likewise see their own first.
  One line, *"All style descends"*, appears in the visitor's own language, from a small table the owner checks.

### 4.5 The Lint: the one rite kept from the Accretion (S)

- **The rite.** A fourth rite at the altar draws on the Midden, a fixed list of about 40 real historical hacks, each with
  its year and its sin: `zoom: 1` and hasLayout, the star and underscore hacks, the clearfix, the spacer GIF,
  `-webkit-box-flex`, `filter: progid:…` (shown only as text), `<font color>`, `top: 37px`, `#id #id #id`. The altar shows
  one hack as code, with three readings: the true one and two drawn from HERESIES and SINS. Name why it was written, and
  `POST /api/lint` absolves it for everyone (*"a pilgrim absolved zoom: 1"*). The rite is rate-limited.
- **Notes on the faces.** Each face carries one small grey note of the current unabsolved hack on a real element
  (`zoom: 1 /* 2004 */`). The server sends only ids, and the client maps them to fixed text.
- **Theology.** Sin is technical debt, and absolution means understanding why someone once wrote it. The patina, the
  doomsday Reflow clock and the Ages stay parked (§6). The Great Reflow stays scripture.

---

## 5. Phases

Every phase ends the way tonight's build did:
- **An integration round:** a fresh-eyes solver who doesn't know the answers, a security pass on every new shared rite,
  an everything-together pass at 360 px with mercy and schisms, and an idle CPU and memory check on every new face.
- **A verified fix round**, then a server restart and a commit per part.

Builders own only their own files. The orchestrator does the kernel work before the builders start and applies the loose
ends after they finish. **At most 3 builders run at once**, each followed by a reviewer, all sharing the one muted,
GPU-less headless Chrome with 2 render slots. Twenty-two agents at once was too much for this PC.

### Phase 1: "Beneath the Highest Heaven" (the next build)

**Why first.** The Ascent is finished, and the Ascended have nothing new to do. The Overflow is small and gives them
something at once. The Descent can't be solved without its faces (two hold its seals and one teaches its last gesture), so
they ship together.

| step | part | who | files | why this order |
|---|---|---|---|---|
| 0 | kernel prep | orchestrator | new `lib/faces.js` registry, read by `kernel/oracle.js`, `layers/hell.js` and the audio drones; the "next seal" ×6 rule; `behavior:resize` in `kernel/behavior.js`; an HMAC secret in kv; Witness whitelist for 404, 423, 425 and 451; Rosetta fragments for the new faces (a small glyphs task); CANON §3, §5, §6, §12 | everything else codes against it |
| 1a | **descent** | secrets owner | `css/canon.css` (telestich keeping *descend*, the antipode rubric, `#undercroft`), `layers/secrets.js`, new `layers/secrets/descent.js` (sealed demon replies), `routes/secrets.js` (Overflow waiting room, sixth word, seal on `/api/ascend`) | the spine of the chain |
| 1b | **archons** | face builder | `faces/archons.js`, `faces/archons/*`, `css/faces/archons.css` | holds seal II·3 |
| 1c | **launderette** | face builder | `faces/launderette.js`, `faces/launderette/*`, `css/faces/launderette.css` | teaches the Garden |
| 2a | **undercroft** | new route owner | `server/routes/undercroft.js` (425/423, the user-agent-only page, `/api/descend`, `rooted` table, Garden, Register, Anathema endpoint) | needs 1a's hint chain |
| 2b | **omens** | face builder | `faces/omens.js`, `faces/omens/*`, `css/faces/omens.css`, `tools/build-liver.mjs` | holds seal II·4 |
| 3 | loose ends | orchestrator | one lazy import in possession's demon; the ritual layer renders the Anathema; mount the route; `?face=` for the new faces | cross-owner lines |
| 4 | integration round | 4 checkers + fix round | a solver walks from the Overflow to the Garden; security on `/api/descend`, the seals and the Anathema; idle performance | then restart the server |

**Agents:** 5 builders and 5 reviewers in two waves (3, then 2), then 4 checkers and a fix round.

### Phase 2: "The Pilgrim and the Year" (must land before 16 December)

**Why.** The Hermitage turns mercy and accessibility into a path. The Tarot and the Stack make the first two chains
teachable and walkable on a phone. The Source rewards Phase 1's Descent. The Ordo has to exist before the Nativity.

| step | part | who | files |
|---|---|---|---|
| 0 | kernel prep | orchestrator | `kernel/discern.js`, `kernel/oldlaw.js`; the layer order in `base.css` becomes `reset, pilgrim, base, face, ordo, glyphs, hell, ritual, audio, offerings, secrets` (with CANON §4 in the same change); memory schema `record.*`; the Source gate in `main.js` (Dry Source without a valid seal) |
| 1a | **hermitage** | secrets owner | new `layers/secrets/hermitage.js` (`<cascade-anchorite>`, the focus overlay, the describedby litany, the Last Keyframe rose), `css/canon.css` (psalm lines, the `--say` comment), `tools/build-media.mjs` (micrography paths), `routes/secrets.js` (`/z/0` threshold, `/api/abide`, lamps) |
| 1b | **tarot** | face builder | `faces/tarot.js`, `faces/tarot/*`, `css/faces/tarot.css` |
| 1c | **stack** | face builder | `faces/stack.js`, `faces/stack/*`, `css/faces/stack.css` |
| 2a | **ordo** | kernel builder | `kernel/ordo.js`, `css/ordo.css`, the shared feast table (the sanctum's kalendar import is a loose end) |
| 2b | **record** | new layer owner | `layers/record.js`, `css/record.css`, `server/routes/record.js` (`/api/epistle`, `/api/since`) |
| 2c | **source** | face builder | `faces/source.js`, `faces/source/*`, `css/faces/source.css` |
| 3 | integration round | checkers + fix round | the Hermitage walked by keyboard only, with Narrator, and on a phone through the Stack; `?at=2026-12-17T20:40` for the Nativity hour; security on `/api/abide`, the packet drop and `/api/epistle`; performance of the Source's water |

**Agents:** 6 builders in two waves of 3.

### Phase 3: "The Ring Closes"

**Why.** The meta-puzzle needs all three doors, and the teletext carries its rule. The Interstice changes routing for
every unknown URL, so it is safest last, on a stable temple. The Portents and the side relics decorate the finished map.

| step | part | who | files |
|---|---|---|---|
| 0 | kernel prep | orchestrator | `main.js` route rule (unknown paths go to the Interstice); the server serves the temple for unknown paths with a real 404; CANON |
| 1a | **teletext** | face builder | `faces/teletext.js`, `faces/teletext/*`, `css/faces/teletext.css` |
| 1b | **interstice** | face builder | `faces/interstice.js`, `faces/interstice/*`, `css/faces/interstice.css`; the votives endpoint in a small route of its own |
| 1c | **seam and hours** | secrets owner | new `layers/secrets/seam.js` (the stones, imported by the Source), `/api/seam`; new `server/routes/hours.js` (`/~/`, Server-Timing, the `SourceMap` header and the Autograph map, the 451) |
| 2a | **portents** | new layer owner | `lib/portents.js`, `layers/portents.js`, `css/portents.css`, `server/routes/portents.js` |
| 2b | **babel relics** | babel owner | the Footprints, the Almanac, the Apocrypha chapter, the Book of Substitutions |
| 2c | **religare** | glyphs owner | GSUB bindings in `tools/build-font.mjs`, the Concordance; the wall check in `routes/ritual.js` is a loose end |
| 2d | **lint** | ritual owner | `layers/ritual.js`, `css/ritual.css`, `routes/ritual.js` |
| 3 | integration round | checkers + fix round | one fresh-eyes solver attempts the whole map, from view-source to the Seam, across simulated days (`?at=` through a Saturn hour, a feast and a lunation); a sweep of all 14 faces at 360 px with mercy; a check for OTS errors on the rebuilt font; a check that the Footprints light under Chrome's partitioned `:visited` history |

**Agents:** 7 builders, never more than 3 at once.

---

## 6. Cut or parked

| idea | decision | why |
|---|---|---|
| The Hall of Two Truths (Egyptian face) | parked, first in line | The six souls as the six stages of a value is exact, but it is L, shares the Omens' antique-bureaucracy tone, and needs a curated 12-property matcher to avoid mis-teaching. |
| The Parlour of the Departed (séance) | cut | A talking board is contact with the dead by definition, too close to §9 and to a living faith; its garbage-collector doctrine lives on in the Interstice's Lost & Found. |
| The Mixture (Manichaean colour face) | parked | The only doctrine of colour, but the least weird face; a painting kept "in the Mixture" mostly looks dim, and its colour lock can't be tested on the owner's sRGB screen. |
| nimbus (a 2006 saint's profile) | cut | Pasted layout codes were author CSS, not the user origin, so its core doctrine mis-teaches; it is a second nostalgia pastiche beside recruitment, with emo styling too near §9. |
| Cascadopedia (edit-war wiki) | parked | Sixty hand-written sect versions for an edit war a congregation of three won't fight; the Tarot carries its Computed-tab lesson. |
| CASCADE 95 (desktop) | parked | A worn net-art trope and the biggest build offered; its stacking lesson belongs to the Archons, and its overflow joke moved to the Stack. |
| FILE 2147483647 (the Bureau) | parked | The heresy of Fixity is good, but select-through bars repeat the rubrics, and a government-style file on the visitor strains tone and impersonation. |
| UHF 33 | merged | Folded into the teletext as its after-closedown channel and test card. |
| The Antechamber | merged | Its skeletons became the Interstice's Waiting Room; the shared server queue is cut (with three visitors it is always instant or empty). |
| The Speculum | merged | The solo mirror became a room; pairing strangers' pointers is cut (it needs targeted SSE, raises privacy worries, and would almost never happen). |
| The Concourse | merged | Its Lost & Found went to the Interstice and its "while you were away" bulletin to the Record; a long horizontal neon mall is too heavy for this PC. |
| The Alignment (the split transmission) | parked | Three stations at minute 33 in a tiny temple will almost never happen; revisit as an eclipse-only event if the temple goes online. |
| The Veil of the Moon (Cardan grilles) | parked | The server would have to regenerate babel's text byte for byte, and any change would break it; revisit once babel's generator is a frozen shared module. |
| The service-worker anchoress | parked | The right metaphor for an offline temple, but the riskiest infrastructure (stale files while editing, https only); if built, build it last, pass-through only, with a self-unregistering kill switch. |
| The Tribunal of Grace | cut | A third hand-judged cascade puzzle; the Tarot teaches it, and the Anathemas are the chain's one such puzzle. |
| Seven keys for the Undercroft | changed | Seven keys from seven holes was far too deep; the Undercroft is now the Descent's door, with its own three keys. |
| Gating the Source on three paths and the moon | changed | Almost nobody would arrive; the Descent alone opens it, and the three doors became the optional Seam. |
| The Accretion's patina, Reflow clock and Ages | parked | A countdown to the end of the world sits too close to §9, a solo owner's temple would rot, and persistent Ages are hard to undo; only the Lint ships. |
| The Oracle's Consolation and Rebuke | cut | A model that rebukes visitors reads as manipulative; the prophecies moved to the Record, and the Pilgrim's Light to the Hermitage. |
| Scars scraped from the CSSOM | parked | Fragile across faces; if scars return, they use a curated table. |
| P3 hidden gold, the prayer-direction compass, the meridian sky | cut | The gold is invisible on the owner's own screen, and the rest adds little. |
| The reverse Ishihara plate, monogram anagrams | cut | Hard to calibrate on real screens, and weak as decoding steps. |
| The shared tarot deck, the `/api/spark` counter | cut | New write routes for little gain. |
| Rain of Glyphs (portent) | cut | Decoration without doctrine. |
| The 2038 eschaton | lore only | A countdown in the Overflow's copy and in `cascade.sky()`; nothing depends on it. |

---

## 7. Open questions for the owner

1. **Should the Descent require the Ascent?** Recommended: no. The Ascended get the Overflow's map, but heretics can also
   come in through the upside-down rubric or the 451, so the hole gets deeper without getting narrower. The alternative is
   strict order: chain II only after chain I.
2. **How far should the Anathema reach?** A rooted heretic's one `!important` could restyle every open temple for 7
   minutes, once a week (proposed), or only their own temple, which is safer and quieter.
3. **How fast should the new faces join the lot?** All at once would put 11 faces in the lot, so each is seen less often.
   Or one new face at a time: unlock one at each of the 2nd, 3rd, 5th, 7th, 12th and 16th visits, so returning pilgrims
   keep meeting something new.
4. **Is the church-year shape all right?** The Ordo borrows the shape of a church year (vigils, octaves, a fast, a daily
   Collect). It is always about CSS and keeps 24–25 December and 6–7 January clear. Keep it, or switch to an invented
   astronomical calendar?
5. **Put it online?** The Anathema, the lamps, the votives, the Concordance, the Lint and the Seam's counts only mean
   something with other visitors. ngrok for friends now, or proper hosting before Phase 2? Hosting also brings https, which
   the parked offline anchoress would need.
6. **Where should the spoilers live?** This file now holds the answers to every new chain, folded away. Keep the repo
   private for good, or move all answers (here, in CANON and in CLAUDE.md) into one git-ignored file?
