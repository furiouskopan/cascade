# The Journey of THE CASCADE

How this website came to exist: the request, the questions, the idea that tied everything together, how
it was built by a swarm of agents, and everything that went wrong on the way. It's written as the work
happens and is updated at each milestone.

> **Spoiler warning.** Section 6 describes the hidden puzzle. The answers are folded away, but if you'd rather
> solve the temple yourself, skip that section.

---

## Timeline

All times are local (CEST), 24 September 2026.

| time | what happened |
|---|---|
| 14:53 | The request: *"Let's create the weirdest and most unpredictable website. Find examples, and ask questions."* |
| 14:54 | A research workflow launches: 7 parallel researchers, each sweeping the web through a different lens. |
| ~14:55 | Two more directions arrive mid-run: *"hidden encoded messages, religious symbolism, weird art"* and *"CSS hell"*. The run is stopped and relaunched with 12 lenses. |
| ~14:57 | First round of questions (tone, symbol systems, secrets, how hellish). |
| ~14:59 | **Avast WebShield blocks the connection to the AI API** in the middle of the research. Every researcher dies, and so does the session. |
| 15:00 | Second round of questions (shared or solo, chaos source, sound, languages). |
| 15:02 | *"proceed"*: the concept is fixed (THE CASCADE) and the kernel scaffolding begins. |
| 15:07 | The session restarts. Research is written off as lost; building continues without it. |
| 15:20 | The Canon (the build spec) is finished and 11 parallel builders launch. |
| 15:24 | The whole Claude Code process exits two minutes into the build. Nothing is written. |
| 15:27 | *"is it working"*: the build is relaunched, throttled to 4 builders at a time. |
| 15:30 | *"add more agents"*: relaunched at full concurrency, with a reviewer-fixer behind every builder (22 agents). |
| 16:11 | *"status"*: 1 of 11 parts finished; screenshots show five faces already alive. |
| 16:38 | *"can you boot up?"*: the temple is served at http://localhost:3333 for the first time. |
| 17:01 | *"ok pause. create a git repo from this"*: build paused; repo created; first commit `b21c55b`. |
| 21:06 | *"Proceed… committ"*: `CLAUDE.md` committed (`bc8e24c`); build resumed with a new stage that commits each part as it passes review; the repo opened in its own VS Code window. |
| 21:13 | *"make sure no sounds are playing"*: the agents' headless test browsers were playing the temple's bells and drones through the speakers. Muted, and this document started. |
| 22:42 | *"use less chrome, too much ram cpu and gpu"*: every agent was launching its own Chrome for every test. Now all agents share one muted, GPU-less headless Chrome, with at most 2 pages rendering at once. |
| 22:42–23:57 | Each part is committed as soon as its review passes: glyphs, sanctum and secrets first, ashram last. |
| 23:55 | *"Commit if done, and let's outline next steps… more pages like the 5, deeper holes"*: a design panel starts (6 designers, 2 judges, 1 synthesizer). |
| 00:04 (25 Sep) | The kernel loose ends the reviewers reported are fixed and committed (`8c65e5f`), including a stack-trace leak and generated verses that told the visitor to "leave thy container". |
| 00:46 | `docs/ROADMAP.md`: 39 proposals judged down to 8 new faces, 4 chains and a meta-puzzle, in three phases. |
| 14:49 (26 Sep) | The owner reviews the roadmap: *"it should mostly be playful, weird and cool… it shouldn't require weeks"*. The Descent stands alone, weekly and long-term plays are cut, the calendar becomes invented, hints go public, and the temple goes online. The roadmap is rewritten: 7 faces, 2 one-sitting chains, no meta-puzzle. The first draft is kept whole on the `extreme` branch, for a future Extreme mode: the temple will have two modes or more. |
| 15:05 (26 Sep) | *"Ok proceed with the changes"*: Phase 0, "Open the doors". Public hints (`cascade.hint()`, the altar, `docs/HINTS.md`), asking the altar for another face, the whole glyph key on one babel page (`/verse/of/the/alphabet`), the door at the top of the Ladder always open and lit in gold at :33, a face registry, and the online preparation (`TRUST_PROXY`, refused words, a moderation tool). Two builders (babel, the registry) and the orchestrator. |

---

## 1. The brief

The whole request fitted in a few lines:

1. *"Let's create the weirdest and most unpredictable website. Find examples, and ask questions."*
2. *"think hidden encoded messages, religious symbolism, weird art etc"*
3. *"CSS hell"*

## 2. Looking for examples, and losing them

The first move was research. A workflow of parallel researchers each took one lens on the weird web and
verified every link it found:

- classic net art and the old weird web (JODI, Zombo, Olia Lialina, Rafaël Rozendaal, Windows 93)
- playful modern experiments (neal.fun, Pointer Pointer, Patatap, Lynn Fisher's yearly redesigns)
- hostile and anti-UX design (User Inyerface, the r/badUIbattles volume sliders)
- sites that break out of the browser (tab and favicon games, URL-bar snake, pop-up choreography)
- shared live chaos (One Million Checkboxes, r/place, The Button)
- generative and infinite sites (the Library of Babel, This Person Does Not Exist, Infinite Craft)
- ARGs, hidden pages and curation lists

When the new directions arrived, five more lenses were added: **encoded secrets** (Cicada 3301, Year Zero,
Aphex Twin's spectrogram faces, numbers stations), **encoding techniques** (steganography, zero-width text,
font tricks, HTTP headers), **sacred and esoteric** web (TempleOS, the preserved Heaven's Gate site, Time
Cube, the Church of the SubGenius, online oracles), **weird art** (glitch, outsider and dream-logic net
art) and **CSS hell** (Diana Smith's pure-CSS paintings, CSS Zen Garden, #CSSCrimes, CSS-only games).

About five minutes in, every researcher failed with the same error: *Access to "api.anthropic.com" was
blocked by Avast WebShield because the content was detected as malicious.* The antivirus on this PC
inspects encrypted traffic. The most likely cause is that one of the old or expired sites being fetched is
on Avast's blocklist; its address then passed through the API traffic, and WebShield cut the connection
for the whole machine. The session died with it.

The decision: don't re-run a broad crawl of obscure old domains on this machine. The concept didn't depend
on the research, and the inspirations above come from what was already known. (The fix, if deeper research
is ever wanted, is an Avast exception for `api.anthropic.com`. It's the owner's choice and was never
bypassed.)

## 3. The questions

Two rounds of multiple-choice questions, answered in about three minutes:

| question | answer |
|---|---|
| Tone of the religious symbolism | **Shifts per visit**: holy one visit, cursed the next, comic after that |
| Symbol systems | **Everything**: invented religion, occult and hermetic, cross-tradition mashup, *UFO death cults, yoga, tantra* |
| How deep should the hidden messages go | **A layered rabbit hole**: easy surface secrets, then 3–5 layers of real puzzles |
| How hellish should the CSS get | **Contained hell**: chaos stays inside the tab, with a mercy toggle |
| Should visitors affect each other | **A shared ritual**: a small server, and visitors' acts accumulate |
| What drives the unpredictability | **Time and sky, visitor behavior, and pure randomness per visit** |
| Sound | **Summoned**: silent until the visitor performs an act |
| Languages | **English, an invented glyph script, and sacred-language babel** |

Then: *"proceed"*.

## 4. The idea that tied it together

The answers pointed in a dozen directions: occult, UFO cults, yoga, CSS hell, hidden messages. One idea
held all of them: **a religion whose theology is CSS.**

"Cascading Style Sheets" already sounds like scripture. The rest followed almost by itself:

- **The Cascade** is the divine flow from which all style descends.
- The three stylesheet origins (user-agent, user, author) are a **trinity**: the Old Law, the Pilgrim, the Word.
- **`!important` is the Inversion**, a heresy, because in real CSS it literally reverses the order of the
  origins. The one righteous use is **mercy**: the stop-all-motion switch is built with `!important` in
  the first cascade layer, the only place where it beats everything.
- **The box model is the yogic body**: content, padding, border and margin are four of the five sheaths
  (koshas). The fifth, bliss, is `outline`, which is drawn but takes no space.
- **The chakras climb z-index.** The crown sits at `2147483647`, the highest value there is, where
  **the Mothership** waits. That's the UFO cult: devotees "leave their containers". Only ever DOM elements,
  never people.
- **The alchemists' Great Work is centering a div.** Margin collapse is tantric union. Floats are the
  Wandering; clearing them is Absolution. Tables-for-layout is the Old Covenant of 1996.

That made CSS hell the religion's own hell, and the hidden messages could live inside the stylesheet itself.

### The five faces

Because the tone should shift per visit, the temple has five completely different faces. An Oracle picks
one per visit from the moon, the planetary hour, omens (3 AM, 3:33, full moon, Friday the 13th, eclipses),
how restless the visitor was last time, and which faces they've already seen. Mid-visit, the temple can
**schism** into another face.

| face | tone | built from |
|---|---|---|
| **sanctum**: the Illuminated Codex | mystical, solemn | medieval manuscripts, the Codex Seraphinianus, TempleOS sincerity |
| **possession**: CSS Hell | horror | a bland corporate site that curdles; a demon typing CSS against you; Dante's circles of CSS sins |
| **recruitment**: the 1997 cult homepage | comic | Geocities, the SubGenius, the Space Jam site, "best viewed in Netscape" |
| **ashram**: the Yantra Breath Temple | meditative, uncanny | Sri Yantra, chakras, a prayer wheel, a yantra that breathes with you |
| **departure**: the Mothership | cosmic | 1950s contactee transmissions, star charts of CSS selectors |
| **babel**: the Infinite Scripture | vast, calm | the Library of Babel; every URL under `/verse/` is a chapter that has always existed |

## 5. Architecture, and why

- **No build step, no framework.** Vanilla ES modules, served as-is, because *view-source is a puzzle layer*.
  A bundler would destroy the clues.
- **Express 5 + `node:sqlite`**, like the owner's other projects, with Server-Sent Events so every open
  temple hears the others' prayers live.
- **Fate is seeded.** Each visit gets a random seed; every module forks its own stream from it
  (`ctx.rng.fork('hell')`). The same seed replays the same visit, which is invaluable for testing weirdness.
- **The kernel / faces / layers split.** The kernel reads fate, sky and memory and lets the Oracle choose. A
  face renders the page and can be torn down and replaced mid-visit. Five layers (glyphs, hell, audio,
  ritual, secrets) live across all faces.
- **CSS cascade layers as cosmology**: `reset, base, face, glyphs, hell, ritual, audio, offerings, secrets`.
  Visitor-offered CSS lives in its own layer, below the secrets, and never applies under mercy.
- **The glyph script is a real font** (*Katabasic, the Hand of Descent*: 26 letters built from six
  strokes of one nib held at 33°). The same glyphs appear twice: at the Latin letters, so glyph text copies
  and pastes as English, and in the Unicode Private Use Area, so the puzzle inscription copies as nothing
  readable.
- **Safety rules are part of the spec**, not an afterthought: nothing flashes more than 3 times a second;
  mercy stops all motion and is always reachable; no sound without a gesture; the UFO material never
  touches real deaths; living faiths are treated with reverent strangeness while CSS takes the jokes; visitor
  text is never parsed as HTML; and the site makes no external requests.

## 6. The rabbit hole

Five words, each hidden with a different technique, lead to a door that only opens at minute 33 of any hour.

1. **View-source**: the page's opening comment sends you to the stylesheet, where a chapter of scripture hides
   an acrostic.
2. **The console**: an oracle lives in the developer console and answers to the first word. It points to
   an invisible ladder in the DOM whose rungs' `z-index` values spell the second word.
3. **The glyph cipher**: every face carries the same inscription in the glyph script, and the key is
   scattered across the faces, a few letters each, so you need several visits (or a clever look at the
   Unicode code points).
4. **Sound**: once sound is summoned, the Mothership transmits. The transmission's *spectrogram* spells the
   fourth word, the way Aphex Twin hid a face in a track. Typing `ajna` opens a Third Eye that shows it.
5. **Time and sky**: the fifth word is whichever planet rules the hour in which you knock.

The oracle's hints are encrypted with the word that unlocks them, and the answers exist only as hashes on the
server, so reading the JavaScript doesn't shortcut the chain. Solving it writes your name, in glyphs, into a
shared Book of the Ascended.

<details>
<summary>The answers (spoilers)</summary>

`descend` (acrostic in `/css/canon.css`), `mercy` (ladder rungs 13 5 18 3 25), `outline` (the inscription
reads *"the third word is the sheath that takes no space"*), `root` (the spectrogram), and the planet of the
current planetary hour. The door is `/z/2147483647`, open at minutes 33–35.

</details>

There are also surface secrets for everyone: tab titles that whisper when you leave, rubrics revealed by
selecting text, the Konami code (or typing `!important`) turning the temple upside down, something that
happens after 33 seconds of stillness, a favicon hiding a date in its least significant bits, a verse with a
message in zero-width characters, and a print stylesheet that prints a prayer.

## 7. How it was built

**The Canon.** Before any building, one document, `docs/CANON.md`, fixed everything that parallel builders
must agree on: the theology, the six faces and the twelve things every face must include, the kernel API
and event names, which agent owns which file, the exact puzzle chain, the ritual API and its security
rules, the hell catalogue, the sound palette and the safety rules. Every agent read it first. It's why 22
agents could work at once without stepping on each other.

**The kernel first.** The orchestrator wrote the parts everything else stands on: the server, the seeded
rng, the sky (moon phase, planetary hours, omens), visitor memory, the behavior witness (restlessness,
stillness at 7/33/108 seconds, leaving the tab, typing), the Oracle, mercy, the boot sequence, the theology
lexicon, the scripture generator, and procedural sacred geometry (sigils, yantras, seals, star polygons,
saucers).

**The Witness tool.** `tools/shoot.mjs` boots a private server and headless Chrome, loads any page with any
seed or time, runs scripted interactions, and returns screenshots, console errors and failed requests.
Every agent tests its own work with it on its own port.

**The swarm.** Eleven builders, one per face or layer, each owning only its own files:

| part | what it does |
|---|---|
| glyphs | draws the Katabasic font with code, plus glyph behaviors (typing releases rising glyphs; `amen` and `om` bloom) |
| ritual | the altar: shared prayers (every 108th prayer eclipses every open temple for 33 seconds), the **Living Canon** (each visitor may offer one CSS declaration, strictly validated, and the last 33 offerings style everyone's temple), a glyph message wall, presence |
| secrets | the whole rabbit hole, the door page, robots.txt, humans.txt and headers as breadcrumbs, the steganographic favicon |
| audio | all sound synthesized in the browser: a drone palette per face, bells, formant-voice chants, the spectrogram transmission, the Third Eye |
| hell | tab whispers, a phantom cursor, specificity wars with visible scores, melting text, elements drifting out of their boxes, glyph rot, the Inversion |
| six faces | sanctum, possession, recruitment, ashram, departure, babel |

Each builder is followed by a **reviewer-fixer** that re-reads the Canon, checks every requirement one
by one, tests desktop and mobile with several seeds and the 3:33 AM omen, and fixes what it finds. A third
stage then **commits** each part to git on its own, touching only that part's files.

### Runs

| run | shape | outcome |
|---|---|---|
| research | 7 lenses, then 12 | killed by the Avast block at ~14:59 |
| build 1 | 11 builders, 10 at a time | the host process exited at 15:24, two minutes in, before anything was written |
| build 2 | 11 builders, 4 at a time | stopped after a few minutes on request, to add more agents |
| build 3 | 11 builders + 11 reviewers | six builders finished; paused at 17:01 for the git repo |
| build 3, resumed | + a commit stage | finished at 23:57: 33 agents, 3,524 tool calls, no agent errors; 11 per-part commits |
| roadmap | 6 designers, 2 judges, 1 synthesizer | 39 proposals, ranked and merged into `docs/ROADMAP.md` (00:46); no Chrome needed |

After the build, the reviewers' requests for code they didn't own were applied by the orchestrator
(`8c65e5f`): a JSON error handler (a malformed request used to return a stack trace with local paths),
scripture that no longer tells a *person* to leave their container, depart or ascend, typed secrets that no
longer fire from inside form fields, memory that survives several open tabs, the ashram keeping its
108-second rite, and a real hit counter. The ritual's security suite passed all 580 hostile-input checks.

## 8. Things that went wrong

- **The antivirus killed the research** and the session (section 2). Lesson: on this machine, keep web
  research narrow.
- **The whole process exited** during the first build, with no error in any agent's log. After that, every
  run was built to resume: finished agents are cached and skipped on relaunch.
- **Git Bash rewrote URLs.** An argument like `/verse/in/the/beginning` became
  `C:/Program Files/Git/verse/...`. The Witness tool now undoes that, and the docs say to set
  `MSYS_NO_PATHCONV=1`.
- **The test browsers were audible.** Headless Chrome was launched with autoplay allowed and was never muted,
  so every time an agent tested a bell, a drone or the Mothership's transmission, it played through the real
  speakers. Fixed at 21:14 by launching with `--mute-audio` (Web Audio still runs, so the spectrogram can
  still be verified; nothing reaches the speakers), and the headless browsers already running were stopped.
- **Too many browsers.** With ten agents testing at once, each launching a full Chrome for every screenshot,
  the machine's RAM, CPU and GPU filled up. Now all agents share a single headless Chrome (muted, GPU off,
  at most 3 renderer processes, a 512 MB script heap), and a lock-file queue lets only 2 pages render at a
  time across all agents. Each run gets its own throwaway browser context, so tests stay isolated. A small
  warden process closes the shared Chrome after 5 idle minutes.
- **The chat lives in the wrong folder.** Claude Code files each conversation under the folder it was
  started in, and this one started in the user's home folder. The build runs inside the conversation, so it
  can't be moved while agents are working. It will be copied into the repo's history when the build finishes.

## 9. Where it stands

*As of 15:50, 26 September 2026.*

- **Built, reviewed and committed:** all six faces (sanctum, possession, recruitment, ashram, departure,
  babel) and all five layers (glyphs, hell, audio, ritual, secrets), one commit each, then the kernel
  loose ends (`8c65e5f`). Every face loads with zero console errors.
- **Running:** the temple at http://localhost:3333 (`npm start`).
- **Phase 0 of the simplified roadmap, done:** public hints, asking for another face, the whole glyph key on one
  page, the door at the top always open (gold at :33), the face registry, and the online preparation. Every face
  loads with zero console errors; the altar's 580 hostile-input checks pass.
- **Next:** `docs/ROADMAP.md` Phase 1, three faces (the Launderette, the Omen Tablets, the Interstice), then a
  short second chain down to the unstyled Undercroft with the Archons and the Source, then optional extras. At
  most 3 builders at once. The first, deeper roadmap waits on the `extreme` branch.
- **Not yet done:** the full integration pass (a fresh-eyes solver for the whole chain, cross-face checks,
  performance), and moving this conversation into the repo's chat history.

---

*This document is updated as the build continues.*
