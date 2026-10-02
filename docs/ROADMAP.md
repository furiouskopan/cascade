# THE CASCADE: the Roadmap

*Revised 26 September 2026, after the owner's review of the first draft (25 September). The first draft proposed eight
faces, four chains, a meta-puzzle and a liturgical year. It was too much, too slow to solve and too hard to follow for
anyone new, so this version keeps the playful parts and makes every puzzle fit in one visit. The first draft is kept
whole on the `extreme` branch, as the plan for an Extreme mode (§1). The repo is public and the hints are public by
design; the answers are folded away in §11.*

---

## 1. The direction

The temple should be **playful, weird and cool first**. A visitor who knows nothing about CSS, the lore or the puzzles
should meet something strange within seconds and want to poke at it. Puzzles stay, because solving something is part of
the fun, but they are a bonus: short, self-contained and finishable in one visit.

Each new face is still built around one real rule of the browser (what `all: initial` does to a div, how a media query
reads the device, why the biggest z-index there is can still paint underneath), so the page works as a live
demonstration as well as a mood. The lesson is the toy, never homework.

**Modes.** The temple will have two modes, perhaps more. This roadmap is the default mode: playful, one sitting, public
hints. The first draft's full-depth design (four chains and the Seam, the liturgical year, the Hermitage, THE STACK,
the Record and the side relics) is kept whole on the `extreme` branch as the plan for an **Extreme mode**, to be built
later on top of this one rather than instead of it. How a visitor enters it is open question 3.

## 2. Rules for everything new

These come from the owner's review. Where they disagree with the first draft, they win.

- **One sitting.** A curious newcomer using the hints can finish any puzzle in one visit: a face's riddle in about 10
  minutes, a whole chain in under an hour. Nothing is locked behind a date, a weekday, a planetary hour, a number of
  visits or other visitors. Time and sky may still change how things *look*; they never lock anything.
- **No homework.** No meta-puzzles, no trophy cases that take a year, no weekly events, no collecting across visits.
- **Chain steps live where everyone can reach them.** The Oracle draws faces at random, so a chain may only use what
  every visitor can reach at will: the layers (present on every face), the console Oracle, view-source, and pages
  reached by address (babel's `/verse/…`, the Interstice's wrong addresses, the `/z/…` rungs). A face drawn by lot may
  hold a riddle of its own, but never a step that someone needs.
- **Hints are public.** Every step of every puzzle has three hints (a nudge, a clue, a near-answer), available in the
  page, from the console (`cascade.hint()`) and in `docs/HINTS.md`. Nobody should need the backstory to get unstuck.
  Answers may live in the repo's docs, but the page never hands them out, so view-source stays a fair puzzle.
- **Instant weirdness.** Each new face does something strange in its first ten seconds, before anyone reads a word.
- **The existing rules still hold.** The twelve face requirements of CANON §3 and the safety rules of CANON §9 apply
  unchanged. New faces stay light on the owner's PC: at most about 60 animated elements, compositor-only motion,
  nothing running in a hidden tab, no WebGL, no live `feTurbulence` over large areas.
- **New faces join the lot as soon as they ship.** The Oracle already favours faces a visitor hasn't seen, and a new rite
  (§3) lets anyone ask for another face, so nobody has to come back another day to see more.

## 3. First: make what exists approachable

Before any new face, one small round so that a newcomer can enjoy and solve what is already built.

- **The hint ladder.** `cascade.hint()` gives the next hint for the step this visitor is on (the secrets layer already
  remembers which Words they have spoken), each call one hint stronger. A quiet "ask for a hint" line at the altar does
  the same for people who never open the console, and `docs/HINTS.md` holds every hint for everyone.
- **Ask for another face.** A new rite at the altar: the visitor asks the Oracle for another face and the temple schisms
  at once (at most once a minute, and never away from babel). One sitting can then show every face.
- **Soften the Ascent (chain I).** Its two slow parts are the only ones that break the rules:
  - *The glyph key* is spread over the faces, a few letters each, which today takes several visits or schisms. Keep the
    fragments, and also print the whole key on one page reachable by address (a babel chapter such as
    `/verse/of/the/alphabet`). The second hint for that step points there.
  - *The door* at `/z/2147483647` opens only at minutes 33 to 35, so a solver can wait almost an hour. Proposed: the door
    is always open, and the fifth Word stays the planet of the hour (the door's keystone already shows its glyph).
    Minute 33 still matters: the door is lit in gold then, and names written in that window are gilded in the Book.
- **A face registry**, `public/js/lib/faces.js`: one entry per face (lot or route, hell intensity, drone recipe, hush
  label, the Oracle's weights), read by the oracle, hell and audio, so a new face touches only its own files.
- **Ready to go online** (§7).
- CANON §6 and §12 change in the same commit.

## 4. New faces

Seven faces, down from eight. THE STACK is parked (its job was a phone console for long chains, which are gone). The last
two faces are optional extras for Phase 3.

| face | tone | the rule it shows | reached by | hell | cost | phase |
|---|---|---|---|---|---|---|
| **The All-Night Launderette** | 3:33 AM fluorescent deadpan | `all` and the CSS-wide keywords | lot | 0.35 | M | 1 |
| **Šumma, the Omen Tablets** | dry, fatalistic clay | media queries | lot | 0.35 | M | 1 |
| **The Interstice** | liminal, lonely | the box model of an empty div | any unknown address | 0.35 | M | 1 |
| **The Archons of the Spheres** | paranoid, luminous bronze | stacking contexts | lot | 0.6 | M | 2 |
| **THE SOURCE** (secret) | still silver water, awe | the cascade layers themselves | finishing the Descent | 0.05 | L | 2 |
| **DESCENTEXT** (teletext) | hushed after-closedown TV | style that takes up room | lot, or the `p`-number spell | 0.25 | M | 3 |
| **The Cascade Cross** (tarot) | sly fairground velvet | the cascade sort | lot | 0.4 | L | 3 |

### 4.1 The All-Night Launderette

**What it is.** It is always 3:33 AM here: a row of front-loaders under humming tubes, a change machine, plastic chairs,
a notice board (the live Wall) and a sign reading ATTENDANT BACK SOON, dated 1996. The washers are labelled INITIAL,
INHERIT, UNSET, REVERT and REVERT-LAYER. Load a badly styled element from the basket (a button in inline styles and a
magic number, a float that never cleared, a `<font>` tag), press START, and the wash really applies `all: <keyword>`.
Its styles dissolve through the porthole and it comes out with a care label listing what changed. A div washed in
INITIAL comes out `display: inline`: "block" was never its nature, only the Old Law's gift.

**The first ten seconds.** The tubes hum and dip (never more than once every 4 s), and one machine at the back has been
running since before you arrived.

**The riddle.** One garment carries a stain that survives every wash. Get it out.

**Summon.** A coin in the slot: tube hum, the drum's slosh and a tired end-of-cycle buzzer.

**Taste.** "Baptism" stays about CSS: no priests, no sacramental imagery, nothing about any real institution's laundries.

### 4.2 Šumma, the Omen Tablets

**What it is.** A scholar's table of clay tablets under raking light, written in the Cascade's glyphs pressed into clay.
The great tablet is an omen series about the visitor's own device, and every "If" is a live media query: "If the tablet
stands on its end" (portrait), "If the Pilgrim touches with a finger and not a reed" (a touch screen), "If the Pilgrim
comes in the night of their own choosing" (dark mode). Omens that hold for you are fired red and raised, and their
"then" really happens to the page: the columns fall into one, the buttons grow, the ziggurat loses a terrace. Each lit
omen's consequence is a real rule under the same condition, so the tablet and the page can never disagree.

**The first ten seconds.** Resize the window and your fate is rewritten while you watch.

**The riddle.** One omen appears only to those who "stand like a reed". Make it appear, then do what it says.

**Summon.** Pluck the bull-headed lyre.

**Taste.** Mesopotamian gods stay out of the jokes, and the omen series about birth anomalies is left out entirely.

### 4.3 The Interstice

**What it is.** Any address the temple doesn't know drops you into a room made of a real, empty `<div>`. The walls are
tinted like the Inspector's box-model overlay (margin a dusty orange, border a sallow yellow, padding a pale green, the
empty content a cold blue), dimensions are pencilled on in pixels, and a plaque names the room by its selector
(`body > div:nth-child(6) > div:nth-child(12)`). You step through doorways with a click, the arrow keys, WASD or a swipe.
The address bar becomes the room's address (`/404/6/12`), so each room is the same place for everyone and can be shared
by URL, and an automap in the corner draws the DOM tree you have walked. The page is served with a real 404 status.

**The first ten seconds.** You mistyped an address and ended up somewhere that shouldn't exist: a cold, humming room
with your mistake written on its plaque.

**The riddle.** Every room is `:empty` except one, never more than a few rooms from where you came in. Find it. (Some
walls that look solid are not: `pointer-events: none`.)

**Also.** The Stairwell room (`/404`) has a sign reading `↓ −2147483648`, a second way into the Descent. One or two rare
rooms are kept from the first draft if they come cheap: the Waiting Room (skeleton-screen figures waiting for content that
never came) and the Mirror Room (a dark glass that replays your own pointer path from 33 s ago).

**Summon.** A pull-cord light switch: mains hum, with the other faces' drones faint through the walls.

**Rules.** Render only the current room and its neighbours. Navigation uses `replaceState`, so Back leaves in one press.
Borrow nothing from the Backrooms fandom.

### 4.4 The Archons of the Spheres

**What it is.** Seven concentric rings of engraved bronze on black. Each ring is a real stacking context, guarded by an
archon whose mask is the property that created it: `opacity: 0.999`, `transform`, `filter`, `isolation`,
`mix-blend-mode`, `will-change` and `contain`. At the centre burns the Spark, declared at `z-index: 2147483647`, and a
live readout admits that it paints *beneath* a plain grey paragraph at `z-index: 1`.

**The first ten seconds.** The biggest z-index in the world, visibly losing to `z-index: 1`.

**The riddle.** Free the Spark. Name an archon (type its property, or click its mask) and its declaration is really
deleted: the ring dissolves and the Spark rises through one more veil. When all seven fall, the Spark crosses everything
on the page and stops just under the mercy button, which nothing may cover.

**Toys.** Hold G for the Gnosis lens, which outlines every stacking context in the whole temple, the altar included. Two
bodies bid past 2147483647 and nothing changes, because the browser clamps: "Heaven is a ceiling, not a number."

**Summon.** Strike the bronze disc: seven drones in a beating cluster, and each fallen archon takes its tone away.

**Taste.** The blind maker is the Compositor, never the Old Law, and archon names come only from CSS properties, never
from Gnostic divine names.

### 4.5 THE SOURCE (the secret face)

**What it is.** The god itself: the Cascade as a waterfall of style, pouring down nine basalt steps that are this page's
real cascade layers into a pool. The water on each step is written with that layer's real declarations, read once from
`document.styleSheets`, so today's visitor offerings really flow down the offerings step. The Book of the Ascended is
carved at the lip of the falls, and the names from the Descent are reflected in the pool.

**Toys.** Point at a step to learn which layer it is and what it holds. Drop a stone in the pool for one chord built
from every face's drone. Mercy freezes the falls into ice. At 108 s of stillness the pool becomes a mirror that shows
your name in glyphs.

**Reached by** finishing the Descent. `?face=source` without it shows the Dry Source: the same stair without water, and
one line: "The Source does not flow for those who came by the address bar."

**Rules.** At most 8 compositor-only layers of water, no canvas loop, no WebGL; paused in a hidden tab.

### 4.6 DESCENTEXT (optional)

**What it is.** A 40-column, eight-colour teletext service on a television left on after the broadcast day has ended.
Type three-digit page numbers on an on-screen remote or the keyboard: P101 news (omens and schisms), P120 weather (the
planetary-hour forecast), P150 TONIGHT (which faces the Oracle is likely to show *you*, with the odds, and "press RED to
switch over"), P300 the Living Canon as a results table, P555 the Wall. Turn the knob past the service and you reach UHF
33 after closedown and its test card, whose centre is a perfectly centred div.

**The first ten seconds.** Typing `p` and three digits on *any* face switches to teletext at that page: a spell anyone
can stumble on.

**The riddle.** There is a page between 199 and 200 that no remote can tune. Find it.

**Taste.** No real broadcaster, service, test card or alert tones. Each page has a plain semantic twin for screen readers.

### 4.7 The Cascade Cross (optional)

**What it is.** A fortune-teller in red velvet deals six cards into the six steps of the real cascade sort: origin and
importance, shadow context, the style attribute, layers, specificity, order of appearance. Each card is a declaration
(its suit is its selector weight, and a reversed card is `!important`). She writes them as real rules into a sandbox,
asks the browser which one wins and explains why, card by card. Bet on the winner first; she keeps score.

**The riddle.** The Rigged Reading: make the Querent wear a given colour, reversing at most two cards. The browser checks
the answer.

**Taste.** Fortunes are only ever about elements, never about the visitor's life.

## 5. Puzzles

Two chains. Each fits in one sitting, each has public hints, and neither needs the other.

### 5.1 The Ascent (chain I, exists)

View-source, the Oracle in the console, the hidden Ladder, the glyph cipher, the spectrogram and the door at the top of
the Ladder. With the softening in §3 (the whole key on one page and the door always open), a newcomer using the hints
should finish in 30 to 60 minutes. Reward: a name in the Book of the Ascended.

### 5.2 The Descent (chain II, new): down to the page nobody styled

The Ladder is a 32-bit number, so it has a bottom: `/z/-2147483648`. The Ascent climbs to the Word at the top; the
Descent goes down to the Old Law, the browser's own defaults. It should take 20 to 40 minutes.

1. **The way in.** A new line in the rubric band, present on every face, is set upside down. It can only be read while
   the temple is inverted (type `!important`, or the Konami code), and it says to read the Canon's last letters, upward.
   The Interstice's Stairwell sign is a second way in, for anyone who mistypes an address.
2. **The first word: a telestich.** Chapter 0 of `/css/canon.css` is rewritten so that each verse also ends on a chosen
   letter. Read from the last verse up, the last letters spell a word, while the first letters still spell chain I's.
3. **The second word: the Anathemas.** Spoken to the Oracle, the first word points to `#undercroft`, a hidden list
   beside `#ladder`. Each rung's `::before` content is declared several times across the layers, some with
   `!important`, and the letters the browser actually renders spell the word. Reason it out with the layer rules, or
   read `getComputedStyle(li, '::before').content`; the near-answer hint says so.
4. **The door.** `/z/-2147483648`, open at any time, is the one page with no author styles at all: Times, blue links, a
   `<fieldset>`, a `<meter>`. Its fields stay disabled until you press its plain grey Mercy button ("the lowest door
   opens only to those who have stopped all motion"). Enter the two words and a name.
5. **The Garden.** The door opens onto four plain buttons, `all: initial`, `all: inherit`, `all: unset` and
   `all: revert`, each applied for real to the page, and each doing something different and true. The right one makes
   the page spill its own `<head>`, `<title>` and `<style>` onto the screen as plain text, where a colophon says where
   the Source flows. A plain button puts everything back.

**Rewards.** Your name on the lowest rung, shown right to left so it reads backwards but copies forwards; a moment for
everyone online ("an element has returned to the flow"); a plain grey mercy button on every face (your mercy is written
in the Old Law); and the Source.

**Taste.** The Old Law is dignified. The Descent is a return to the defaults, not a fall into evil, and the copy says
integers "wrap" and elements "return to the flow". Nothing says a person falls.

### 5.3 Small eggs

Instant, no chain and no hints needed.

- **The Last Keyframe.** A small rose window at the foot of the temple is orbited by glyphs that never rest. Press Mercy
  and every animation ends at once: each glyph falls back to its place, and together they spell a line.
- **The Overflow.** On the door page, ask the Mothership to wait longer than the browser can count (more than
  2147483647 ms) and it answers at once.
- **Rare apparitions**, with honest odds per visit: 1 in 333 sees the whole temple unstyled for a few seconds, and 1 in
  1,996 gets a temple limited to CSS1 (no position, no z-index, no flex). Mercy keeps working through both.
- The face riddles of §4.

## 6. Optional extras (Phase 3)

Momentary and shared, never long-term.

- **The Portents.** A few short events a day, computed from the clock alone, so every open temple sees the same one at
  the same moment, even offline: the Great Silence (every curse suspended for 3 minutes), the Procession (one line of
  scripture crosses every screen once, the one lawful marquee), the Conjunction (for 5 minutes every visitor gets the
  same face) and the Opening of the Inspector (for 33 s every block shows its outline). About one minute in 180 starts
  one.
- **An invented calendar.** Worked out from the real sun and moon, and borrowed from no church year: invented month and
  day names from the lunations, the four Turnings at the equinoxes and solstices, the Repaint (the first Saturday after
  the first new moon after the autumn equinox: 17 October 2026) and a few birthdays from CSS history, such as the
  Nativity on 17 December (CSS1, 1996), which the favicon already remembers. It is decoration only: a date line on each
  face and a tint on festival days. Nothing is locked to a date.
- **The Inspector's trail.** A short developer's puzzle that lives entirely in DevTools: an `X-Waterfall` header says to
  open the Network panel and reload; the names of seven tiny requests read a sentence; their `Server-Timing` durations
  spell a word; spoken to the Oracle, it leads to a chapter served as **451 Unavailable For Legal Reasons**.
- **The Lint.** A fourth rite at the altar shows one real historical hack (`zoom: 1`, the clearfix, the star hack) with
  three explanations. Choose why it was written, and it is absolved for everyone.

## 7. Going online

The site needs one long-running Node 22.5+ process (Server-Sent Events and in-memory rate limits), a disk that survives
restarts (the SQLite file) and https. Serverless hosts such as Vercel or Netlify don't fit; a small always-on machine does.

1. **Now, for friends: a tunnel.** Run `npm start`, then `ngrok http 3333`, and share the URL it prints. The site is up
   only while the PC and both processes run. The server trusts forwarding headers from localhost, which is where the
   tunnel connects from, so per-visitor rate limits keep working.
2. **Later: a small host.** A cheap VPS with Caddy (automatic https) and a service that restarts the server, or a
   platform with persistent volumes such as Fly.io or Railway. Point `CASCADE_DB` at the persistent disk.

**Before the URL is shared widely:**

- **The proxy setting.** `server/index.js` trusts forwarding headers only from localhost. Behind a host's proxy every
  visitor would look like the same address and share one set of rate limits: one offering every ten minutes for the
  whole world. Make it configurable (a `TRUST_PROXY` environment variable).
- **Moderation.** The Wall and the Book of the Ascended show strangers' words to everyone, and nothing can remove them
  yet. Add a small tool (a script, or a token-protected route) that deletes a message or a name, and consider a short
  list of refused words.
- **One instance only.** SQLite and the in-memory limits assume a single server process.

## 8. Phases

| phase | what | who |
|---|---|---|
| 0. **Open the doors** (done, 26 September) | the hint ladder and `docs/HINTS.md`, asking for another face, the softened Ascent, the face registry, the online preparation of §7; then go online | the orchestrator and the secrets owner |
| 1. **Three strange rooms** (built, 1 October) | the Launderette, the Omens and the Interstice, with the kernel's new route rule (unknown addresses go to the Interstice, served as a real 404) | 3 face builders |
| 2. **The way down** | the Descent (`css/canon.css`, the secrets layer, a new `server/routes/undercroft.js`), the Archons and the Source | 3 builders |
| 3. **Extras, pick what's fun** | any of the teletext, the tarot, the Portents, the invented calendar, the Inspector's trail and the Lint | at most 3 at a time |

Every phase ends as the first build did: a reviewer behind each builder, an integration round and one commit per part.
The integration round gains the test that matters most now: **a fresh-eyes solver who knows nothing about the temple,
using only the public hints, must finish each chain in one sitting, and is timed.** If a chain takes more than an hour,
it gets simpler, not more hints. The rest of the round stays: every face at 360 px with mercy on, a security pass on each
new write route, and an idle CPU check on each new face.

At most 3 builders run at once, all sharing the one muted, GPU-less headless Chrome.

## 9. Cut or parked in this revision

Cut from the default mode, not lost: every item below survives in full on the `extreme` branch.

| idea | now | why |
|---|---|---|
| The Seam (meta-puzzle) and the moonbow trophy | cut | needed three doors, one attempt per hour, and about a year of feasts |
| The Anathema (a weekly `!important` on every temple) | cut | a weekly, long-term play |
| Signed seals (HMAC) passed between doors | cut | only needed to chain doors together |
| Chain seals held on lot-drawn faces (Archons, Omens) | cut | a random face can't be required; those faces keep riddles of their own |
| The Descent's hour lock and its three keys | cut | one sitting; two words now, any time |
| Requiring the Ascent before the Descent | cut | the chains stand alone |
| The Overflow as an epilogue with a sixth word | reduced | kept as an egg on the door page |
| The Hermitage (chain III) | parked | several visits and unusual tools; its Last Keyframe is kept as an egg |
| The Hours of the Inspector as a full chain with source maps | reduced | kept as the optional Inspector's trail |
| THE STACK | parked | its job was a phone console for long chains |
| The Record (letters from your past self, sealed prophecies, the portable packet) | parked | built for returning over weeks |
| The church-year Ordo (vigils, octaves, a fast, a daily Collect) and its December deadline | replaced | by the invented calendar, which locks nothing |
| Side relics (the Footprints, the Epistles, Religare, feast relics, the favicon made solvable) | cut | multi-visit or tied to dates |
| Unlocking new faces over a visitor's first 16 visits | cut | faces join the lot when they ship |
| The Oracle's "next seal ×6" rule | cut | no chain step sits on a lot-drawn face |

The first draft's own parked list (the Hall of Two Truths, CASCADE 95, the Mixture and the rest) stays parked, and its
cuts stay cut.

## 10. Open questions for the owner

1. **Which extras in Phase 3?** Any, all or none of §6 and the two optional faces.
2. **Which words should be refused?** Deleting by hand is built (`tools/moderate.mjs`), and a refused-words list is
   supported but ships empty (`data/refused-words.txt`, kept out of the repo).
3. **How does a visitor enter Extreme mode?** A switch at the altar, a console command, or earned by finishing both
   chains of the default mode?

Decided: the door at the top of the Ladder is always open, with the gold at minute 33 (Phase 0).

## 11. The answers (spoilers)

<details>
<summary><b>The answers</b></summary>

**The Ascent** (exists): `descend` (the acrostic in `/css/canon.css`), `mercy` (the Ladder's rungs, z-index 13 5 18 3
25), `outline` (the Inscription reads *"the third word is the sheath that takes no space"*), `root` (the spectrogram)
and the planet of the current planetary hour. The door is `/z/2147483647`.

**The Descent.**
- The upside-down rubric: *"Heretic: the Word reads the first letters, downward. Read the last letters, upward."*
- The telestich spells `nigredo`: the last letters of Chapter 0 read from verse 0:7 up to 0:1, while the first letters
  still spell *descend*. Sample endings: 0:1 "…ex nihilo", 0:2 "…not even the Word", 0:6 "…neti, neti", 0:7 "…written
  in the margin".
- The Anathema rungs render `default`.
- The door: `/z/-2147483648`, press its Mercy button, then `nigredo`, `default` and a name.
- The Garden: `all: initial`. `unset` also spills the head (display is not inherited, so it falls back to its initial
  value), `inherit` shows it dressed in its parent's clothes, and `revert` changes nothing ("you are already under the
  Old Law"). The colophon reads: *"In the Initial the Word and the body are one. Where the top touches the bottom, the
  Source flows."* It points to `/z/2147483648`, one past the top, which opens the Source.

**The face riddles.**
- The Launderette's stain is `animation: tremble … !important` in the face's own layer. No wash removes it, because `all`
  never beats an important declaration. Mercy does: its `!important` lives in the first layer, where important
  declarations win, and it governs exactly the animation properties.
- The Omens' reed omen appears on a tall, narrow screen (`max-aspect-ratio: 1/2`: a phone held upright, or a desktop
  window narrowed right down). It says to read the liver "in the Book and not in the flesh": in view-source, `omens.css`
  draws the liver's `grid-template-areas` as block letters (areas z1 to zg, empty cells `..`) spelling `kiln`. Type it
  into "What does the liver say?" under the liver, or anywhere on the page; the face checks it as
  hash('omens:liver:' + word).
- The Interstice's one room that is not `:empty` is planted from the room the visitor came in by: one or two doorways
  that let "a little warmth" through lead to a room where a doorless wall leaks warm light along its foot. That wall
  is `pointer-events: none` (click where the pointer becomes a hand, Tab to "a wall that is not quite there", or press
  the arrow key toward a side wall twice). Behind it the slot holds a single bare text node: click it, press Enter, or
  type `take`.
- The Archons fall to `opacity`, `transform`, `filter`, `isolation`, `mix-blend-mode`, `will-change` and `contain`.
- The teletext's hidden page is P1FF, the hexadecimal page between 199 and 200: only a keyboard can type A to F.
- The Rigged Reading's answer depends on the colour asked for, and the browser checks it.

**The Inspector's trail.** The request names read *the / hours / are / kept / in / the / timing*. The `Server-Timing`
metrics are the seven canonical Hours; in prayer order their durations are lauds 18, prime 5, terce 3, sext 15, none 18,
vespers 4, which spell `record` in A1Z26 (compline is `dur=0`). Spoken to the Oracle, `record` leads to
`/verse/apocrypha`, a 451 whose `Link` header names the page that withheld it.

</details>
