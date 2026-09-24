# THE CASCADE

A website that is also a religion whose theology is CSS. **`docs/CANON.md` is the spec**: faces, kernel API,
bus events, the rabbit-hole puzzle chain, the ritual API, and the safety rules (§9). Read it before changing
behaviour, and keep it in sync when you change something it describes.

## Run

```
npm start                     # http://localhost:3333 (PORT to override; CASCADE_DB for another SQLite file)
node tools/build-font.mjs     # regenerate public/fonts/cascade-glyphs.otf
node tools/build-media.mjs    # regenerate the favicon (it hides an LSB message) and relics
node tools/test-ritual.mjs    # hostile-input tests for /api/offer and /api/wall
```

No build step and no framework: vanilla ES modules served as-is. That's deliberate, because view-source is part
of the puzzle. Don't add a bundler or minifier.

## Layout

- `server/`: Express 5 + `node:sqlite` (`data/cascade.db`), SSE broadcast (`sse.js`), rate limits.
  `routes/ritual.js` holds prayers, the Living Canon, the wall and the eclipse; `routes/secrets.js` holds
  robots/humans, the door at `/z/2147483647` and `/api/ascend`.
- `public/js/main.js`: the boot order: fate (seeded rng), sky, memory, the Oracle picks a face, then the layers.
- `public/js/kernel/`: rng, sky/omens, memory (localStorage), behavior, oracle, mercy, api, bus.
- `public/js/lib/`: lexicon (the theology), scripture generator, sigil/yantra/seal SVG, glyph script, dom helpers.
- `public/js/faces/<face>.js` + `public/css/faces/<face>.css`: sanctum, possession, recruitment, ashram,
  departure, and babel (the `/verse/*` route). A face exports `render(ctx)` and returns `destroy()`.
- `public/js/layers/`: glyphs, hell, audio, ritual, secrets. Each exports `init(ctx)` and sets `ctx.<layer>`.
- CSS layer order is declared in `public/css/base.css`. Mercy uses `!important` in the first layer on purpose.

## Test

`tools/shoot.mjs` starts its own server and headless Chrome, prints console errors and failed requests, and
saves screenshots to `shots/`:

```
MSYS_NO_PATHCONV=1 node tools/shoot.mjs --port 3401 "/?face=sanctum&seed=a" "/verse/in/the/beginning"
MSYS_NO_PATHCONV=1 node tools/shoot.mjs --port 3401 --mobile --eval "return document.title" "/?face=ashram"
```

Debug params: `?face=` `?seed=` `?at=2026-10-31T03:33` (pins the clock for omens) `?mercy=1` `?reset`.
Without `MSYS_NO_PATHCONV=1`, Git Bash rewrites `/verse/...` into a Windows path.

## Gotchas

- A server started from the Bash tool dies when the tool call times out; for a long-lived one use
  `Start-Process cmd -ArgumentList '/k','npm start' -WorkingDirectory <repo>`.
- Never use `Math.random` for anything that should be reproducible: fork the visit rng
  (`ctx.rng.fork('name')`). Use `ctx.clock()`, not `new Date()`, so `?at=` works.
- Visitor text (wall, names, offerings) goes into the DOM with `textContent` only; offerings become CSS only
  from validated triples, never raw strings.
- Hints in `layers/secrets.js` are encrypted with their unlocking word, and the answers exist only as server-side
  hashes. Don't write chain answers in plain text anywhere under `public/`.
