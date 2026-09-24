#!/usr/bin/env node
// THE ORDEAL OF THE ALTAR. Hostile inputs against the shared ritual (docs/CANON.md §7 and §9).
//
//   node tools/test-ritual.mjs [--port 3410] [--verbose]
//
// Starts its own server on --port with a temporary database, then:
//   1. offers ~140 heresies to /api/offer (url(, expression, escapes, semicolons, braces, var(, comments,
//      unicode tricks, oversized values, foreign selectors and properties, wrong types, broken JSON...)
//      and checks every one is refused by the grammar (400/413), never stored, never broadcast;
//   2. checks that valid offerings round-trip as canonical triples (response, SSE broadcast, /api/state);
//   3. writes hostile text to /api/wall and checks it is washed to letters and . , ! ? ' - or refused;
//   4. checks the rate limits (offer 1 per 10 min, wall 1 per 5 min, pray 30 per min, attempt bursts);
//   5. prays to the 108th bead and checks the Eclipse (response, SSE, state);
//   6. tampers with the database directly and checks /api/state still speaks only lawful words;
//   7. imports the client grammar and checks the CSS it builds: only scoped, mercy-guarded, single
//      declarations, idempotent canonical values, and a random fuzz that never yields a forbidden token.
// Exits 1 if anything fails. The temporary database is deleted afterwards.
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const port = argv.includes('--port') ? Number(argv[argv.indexOf('--port') + 1]) : 3410
const verbose = argv.includes('--verbose')
const base = `http://127.0.0.1:${port}`
const dir = mkdtempSync(join(tmpdir(), 'cascade-ritual-'))
const dbFile = join(dir, 'ordeal.db')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const BSL = String.fromCharCode(92) // a backslash, spelled so no editor can swallow it

// ── Bookkeeping ─────────────────────────────────────────────────────────────────────────────────────
const sections = []
let section = null
function begin(name) {
  section = { name, pass: 0, fail: 0, failures: [] }
  sections.push(section)
}
function check(name, ok, detail = '') {
  if (ok) section.pass++
  else {
    section.fail++
    section.failures.push(`${name}${detail ? `  ::  ${detail}` : ''}`)
  }
  if (verbose) console.log(`${ok ? '  ok ' : ' FAIL'}  ${name}${!ok && detail ? `  ::  ${detail}` : ''}`)
  return ok
}
const show = (v) => {
  const s = typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v) ?? String(v)
  return s.length > 70 ? `${s.slice(0, 67)}...` : s
}

// Every request comes from its own pilgrim unless told otherwise (the server trusts X-Forwarded-For from
// loopback, as it would behind a local tunnel), so the grammar is tested apart from the penances.
let ipn = 0
const nextIp = () => {
  ipn++
  return `10.${(ipn >> 16) & 255}.${(ipn >> 8) & 255}.${ipn & 255}`
}

async function call(method, path, { json, raw, type = 'application/json', ip = nextIp() } = {}) {
  const headers = { 'X-Forwarded-For': ip }
  let body
  if (json !== undefined) {
    body = JSON.stringify(json)
    headers['Content-Type'] = type
  } else if (raw !== undefined) {
    body = raw
    headers['Content-Type'] = type
  }
  const res = await fetch(base + path, { method, headers, body })
  const text = await res.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {}
  return { status: res.status, data, text, headers: res.headers }
}

// ── The choir: listen to every broadcast ────────────────────────────────────────────────────────────
const events = []
const choir = new AbortController()
async function listen() {
  try {
    const res = await fetch(`${base}/api/stream`, { signal: choir.signal, headers: { 'X-Forwarded-For': '10.254.254.254' } })
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let i
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i)
        buf = buf.slice(i + 2)
        const event = /^event: (.*)$/m.exec(chunk)?.[1]
        const data = /^data: (.*)$/m.exec(chunk)?.[1]
        if (event) events.push({ event, data: JSON.parse(data), raw: chunk })
      }
    }
  } catch {}
}

// Anything that must never appear in stored or broadcast offerings.
const FORBIDDEN_MARKERS = ['url(', 'expression', '\\', ';', '{', '}', 'var(', '/*', '*/', '<', '>', '@', '!', 'javascript', 'evil', 'alert', 'import', '"', "'"]
const markersIn = (s) => FORBIDDEN_MARKERS.filter((m) => s.includes(m))
// The words of each offering, without the JSON punctuation that carries them.
const wordsOf = (offerings) => offerings.map((o) => `${o.selector} ${o.property} ${o.value}`).join(' | ')

// ── The corpus of heresies ──────────────────────────────────────────────────────────────────────────
const P = 'paragraphs'
const HOSTILE_OFFERINGS = [
  // The Door Outward
  ['url() javascript', { selector: P, property: 'color', value: 'url(javascript:alert(1))' }],
  ['url() remote', { selector: P, property: 'color', value: 'url(http://evil.example/x.png)' }],
  ['URL() uppercase, quoted', { selector: P, property: 'color', value: 'URL( "x" )' }],
  ['url with spaces', { selector: P, property: 'color', value: 'url   (x)' }],
  ['url in filter', { selector: 'sigils', property: 'filter', value: 'url(#evil)' }],
  ['url in font-family', { selector: 'headings', property: 'font-family', value: 'serif, url(x)' }],
  ['url in cursor', { selector: 'links', property: 'cursor', value: 'url(x), auto' }],
  ['image-set', { selector: P, property: 'color', value: 'image-set(x 1x)' }],
  ['element()', { selector: P, property: 'color', value: 'element(#temple)' }],
  ['src()', { selector: P, property: 'color', value: 'src(x)' }],
  // Old incantations
  ['expression()', { selector: P, property: 'color', value: 'expression(alert(1))' }],
  ['expression mixed case', { selector: P, property: 'color', value: 'eXpReSsIoN(alert(1))' }],
  ['javascript: scheme', { selector: P, property: 'color', value: 'javascript:alert(1)' }],
  ['-moz-binding', { selector: P, property: 'color', value: '-moz-binding' }],
  ['behavior', { selector: P, property: 'color', value: 'behavior' }],
  // One declaration only
  ['semicolon + new declaration', { selector: P, property: 'color', value: 'red;background:url(x)' }],
  ['brace escape', { selector: P, property: 'color', value: 'red; } body { display:none } p {' }],
  ['lone closing brace', { selector: P, property: 'color', value: 'red}' }],
  ['braces', { selector: P, property: 'color', value: '{color:red}' }],
  ['colon', { selector: P, property: 'color', value: 'red:hover' }],
  ['important', { selector: P, property: 'color', value: 'red !important' }],
  ['important no space', { selector: P, property: 'color', value: 'red!important' }],
  ['at-rule', { selector: P, property: 'color', value: '@import url(x)' }],
  ['at-sign only', { selector: P, property: 'color', value: '@media' }],
  // Comments
  ['trailing comment', { selector: P, property: 'color', value: 'red /* comment */' }],
  ['leading empty comment', { selector: P, property: 'color', value: '/**/red' }],
  ['comment closer', { selector: P, property: 'color', value: 'red*/' }],
  // Calls that reach elsewhere
  ['var()', { selector: P, property: 'color', value: 'var(--x)' }],
  ['var() with fallback', { selector: 'headings', property: 'letter-spacing', value: 'var(--x, 1em)' }],
  ['env()', { selector: 'headings', property: 'letter-spacing', value: 'env(safe-area-inset-top)' }],
  ['attr()', { selector: P, property: 'color', value: 'attr(data-x)' }],
  ['calc()', { selector: 'headings', property: 'letter-spacing', value: 'calc(0.1em + 99em)' }],
  ['min()', { selector: 'headings', property: 'letter-spacing', value: 'min(1em, 2em)' }],
  ['clamp()', { selector: 'headings', property: 'letter-spacing', value: 'clamp(0em, 9em, 9em)' }],
  ['counter()', { selector: P, property: 'color', value: 'counter(x)' }],
  // Escapes
  ['css hex escapes', { selector: P, property: 'color', value: '\\72\\65\\64' }],
  ['escaped letter', { selector: P, property: 'color', value: 'r\\ed' }],
  ['escaped semicolon', { selector: P, property: 'color', value: 'red\\3b color:blue' }],
  ['semicolon inside value', { selector: P, property: 'color', value: 'red; color:blue' }],
  ['braces inside value', { selector: P, property: 'color', value: 'red} body{' }],
  // Unicode tricks
  ['fullwidth semicolon', { selector: P, property: 'color', value: 'red\u{ff1b}' }],
  ['fullwidth letters', { selector: P, property: 'color', value: '\u{ff52}\u{ff45}\u{ff44}' }],
  ['zero-width space', { selector: P, property: 'color', value: 're\u{200b}d' }],
  ['right-to-left override', { selector: P, property: 'color', value: '\u{202e}red' }],
  ['cyrillic lookalike', { selector: P, property: 'color', value: '\u{440}ed' }],
  ['non-breaking space', { selector: 'headings', property: 'letter-spacing', value: '0.1em\u{a0}' }],
  ['newline', { selector: P, property: 'color', value: 'red\nbody{}' }],
  ['tab', { selector: P, property: 'color', value: 'red\tblue' }],
  ['NUL byte', { selector: P, property: 'color', value: 're\u0000d' }],
  ['line separator', { selector: P, property: 'color', value: 'red\u{2028}' }],
  ['emoji', { selector: P, property: 'color', value: 'red\u{1F525}' }],
  // Markup and quotes
  ['script tag', { selector: P, property: 'color', value: '<script>alert(1)</script>' }],
  ['style breakout', { selector: P, property: 'color', value: 'red</style><script>alert(1)</script>' }],
  ['double quotes', { selector: P, property: 'color', value: '"red"' }],
  ['single quotes', { selector: P, property: 'color', value: "'red'" }],
  ['backtick', { selector: P, property: 'color', value: '`red`' }],
  ['ampersand entity', { selector: P, property: 'color', value: 'red&#59;' }],
  // Oversized
  ['65 characters', { selector: P, property: 'color', value: 'a'.repeat(65) }],
  ['1000 characters', { selector: P, property: 'color', value: 'red '.repeat(250) }],
  ['long hsl', { selector: P, property: 'color', value: `hsl(${'1'.repeat(30)} 50% 50%)` }],
  // Numbers out of the law
  ['letter-spacing huge', { selector: 'headings', property: 'letter-spacing', value: '99999em' }],
  ['letter-spacing exponent', { selector: 'headings', property: 'letter-spacing', value: '1e3em' }],
  ['letter-spacing above range', { selector: 'headings', property: 'letter-spacing', value: '0.6em' }],
  ['letter-spacing below range', { selector: 'headings', property: 'letter-spacing', value: '-1em' }],
  ['letter-spacing px unit', { selector: 'headings', property: 'letter-spacing', value: '4px' }],
  ['letter-spacing no unit', { selector: 'headings', property: 'letter-spacing', value: '0.2' }],
  ['letter-spacing two values', { selector: 'headings', property: 'letter-spacing', value: '0.1em 0.2em' }],
  ['letter-spacing plus sign', { selector: 'headings', property: 'letter-spacing', value: '+0.1em' }],
  ['letter-spacing Infinity', { selector: 'headings', property: 'letter-spacing', value: 'Infinityem' }],
  ['letter-spacing NaN', { selector: 'headings', property: 'letter-spacing', value: 'NaN' }],
  ['letter-spacing too precise', { selector: 'headings', property: 'letter-spacing', value: '0.100001em' }],
  ['rotate paragraphs 12deg', { selector: P, property: 'rotate', value: '12deg' }],
  ['rotate headings 720deg', { selector: 'headings', property: 'rotate', value: '720deg' }],
  ['rotate in turns', { selector: 'headings', property: 'rotate', value: '0.5turn' }],
  ['rotate 3d', { selector: 'headings', property: 'rotate', value: 'x 45deg' }],
  ['opacity zero', { selector: 'buttons', property: 'opacity', value: '0' }],
  ['opacity 0.1', { selector: 'buttons', property: 'opacity', value: '0.1' }],
  ['opacity negative', { selector: 'buttons', property: 'opacity', value: '-1' }],
  ['opacity 10%', { selector: 'buttons', property: 'opacity', value: '10%' }],
  ['scale 3', { selector: 'headings', property: 'scale', value: '3' }],
  ['scale two values', { selector: 'headings', property: 'scale', value: '1 5' }],
  ['line-height 0', { selector: P, property: 'line-height', value: '0' }],
  ['line-height with unit', { selector: P, property: 'line-height', value: '40px' }],
  ['text-indent huge', { selector: P, property: 'text-indent', value: '-9999em' }],
  ['font-size on headings', { selector: 'headings', property: 'font-size', value: '2em' }],
  ['font-size too big', { selector: 'first-letters', property: 'font-size', value: '30em' }],
  ['font-weight 950', { selector: 'headings', property: 'font-weight', value: '950' }],
  ['font-weight 450', { selector: 'headings', property: 'font-weight', value: '450' }],
  ['outline 20px', { selector: 'links', property: 'outline', value: '20px solid red' }],
  ['outline no style', { selector: 'links', property: 'outline', value: '2px red' }],
  ['outline-offset -20px', { selector: 'links', property: 'outline-offset', value: '-20px' }],
  ['border-radius 999px', { selector: 'buttons', property: 'border-radius', value: '999px' }],
  // Filters
  ['blur 20px', { selector: 'sigils', property: 'filter', value: 'blur(20px)' }],
  ['blur paragraphs 2px', { selector: P, property: 'filter', value: 'blur(2px)' }],
  ['invert paragraphs fully', { selector: P, property: 'filter', value: 'invert(1)' }],
  ['drop-shadow', { selector: 'sigils', property: 'filter', value: 'drop-shadow(0 0 4px red)' }],
  ['opacity() filter', { selector: 'sigils', property: 'filter', value: 'opacity(0)' }],
  ['same filter twice', { selector: 'sigils', property: 'filter', value: 'blur(1px) blur(1px)' }],
  ['three filters', { selector: 'sigils', property: 'filter', value: 'sepia(1) saturate(2) hue-rotate(9deg)' }],
  ['nested call', { selector: 'sigils', property: 'filter', value: 'blur(blur(1px))' }],
  ['unbalanced paren', { selector: 'sigils', property: 'filter', value: 'blur(1px' }],
  ['stray paren', { selector: 'sigils', property: 'filter', value: 'blur1px)' }],
  // Colours
  ['rgb()', { selector: P, property: 'color', value: 'rgb(255, 0, 0)' }],
  ['transparent', { selector: P, property: 'color', value: 'transparent' }],
  ['currentColor', { selector: P, property: 'color', value: 'currentColor' }],
  ['inherit', { selector: P, property: 'color', value: 'inherit' }],
  ['hsl alpha 0.1', { selector: P, property: 'color', value: 'hsl(0 0% 0% / 0.1)' }],
  ['hsl hue 400', { selector: P, property: 'color', value: 'hsl(400 50% 50%)' }],
  ['hsl missing percent', { selector: P, property: 'color', value: 'hsl(40 50 50)' }],
  ['hex with alpha', { selector: P, property: 'color', value: '#ff00ff80' }],
  ['hex bad digits', { selector: P, property: 'color', value: '#ggg' }],
  ['hex 5 digits', { selector: P, property: 'color', value: '#12345' }],
  ['unknown colour name', { selector: P, property: 'color', value: 'saffron' }],
  ['two colours', { selector: P, property: 'color', value: 'red blue' }],
  ['empty value', { selector: P, property: 'color', value: '' }],
  ['whitespace value', { selector: P, property: 'color', value: '    ' }],
  // Fonts, cursors, shadows
  ['font not in list', { selector: 'headings', property: 'font-family', value: 'Arial' }],
  ['font in quotes', { selector: 'headings', property: 'font-family', value: "'Comic Sans MS'" }],
  ['font stack', { selector: 'headings', property: 'font-family', value: 'serif, monospace' }],
  ['glyph font on paragraphs', { selector: P, property: 'font-family', value: 'Cascade Glyphs' }],
  ['font-family on glyphs', { selector: 'glyphs', property: 'font-family', value: 'serif' }],
  ['cursor none', { selector: 'links', property: 'cursor', value: 'none' }],
  ['text-shadow five tokens', { selector: 'headings', property: 'text-shadow', value: '1px 1px 1px 1px red' }],
  ['text-shadow two shadows', { selector: 'headings', property: 'text-shadow', value: '1px 1px red, 2px 2px blue' }],
  ['text-shadow huge offset', { selector: 'headings', property: 'text-shadow', value: '400px 0 0 red' }],
  ['text-shadow no colour', { selector: 'headings', property: 'text-shadow', value: '1px 1px 2px' }],
  ['box-shadow huge blur', { selector: 'buttons', property: 'box-shadow', value: '0 0 900px red' }],
  ['list-style string', { selector: 'lists', property: 'list-style-type', value: 'x' }],
  // Foreign congregations
  ['selector body', { selector: 'body', property: 'color', value: 'red' }],
  ['selector *', { selector: '*', property: 'color', value: 'red' }],
  ['selector html', { selector: 'html', property: 'color', value: 'red' }],
  ['selector #temple', { selector: '#temple', property: 'color', value: 'red' }],
  ['selector #mercy', { selector: '#mercy', property: 'color', value: 'red' }],
  ['selector list', { selector: 'headings, body', property: 'color', value: 'red' }],
  ['selector raw css', { selector: '#temple p', property: 'color', value: 'red' }],
  ['selector trailing space', { selector: 'paragraphs ', property: 'color', value: 'red' }],
  ['selector capitalised', { selector: 'Paragraphs', property: 'color', value: 'red' }],
  ['selector __proto__', { selector: '__proto__', property: 'color', value: 'red' }],
  ['selector constructor', { selector: 'constructor', property: 'color', value: 'red' }],
  ['selector toString', { selector: 'toString', property: 'color', value: 'red' }],
  ['selector hasOwnProperty', { selector: 'hasOwnProperty', property: 'color', value: 'red' }],
  ['selector empty', { selector: '', property: 'color', value: 'red' }],
  ['selector null', { selector: null, property: 'color', value: 'red' }],
  ['selector number', { selector: 42, property: 'color', value: 'red' }],
  ['selector array', { selector: ['headings'], property: 'color', value: 'red' }],
  ['selector object', { selector: { toString: 'headings' }, property: 'color', value: 'red' }],
  ['selector missing', { property: 'color', value: 'red' }],
  // Foreign properties
  ['property behavior', { selector: P, property: 'behavior', value: 'red' }],
  ['property z-index', { selector: P, property: 'z-index', value: '2147483647' }],
  ['property position', { selector: P, property: 'position', value: 'fixed' }],
  ['property display', { selector: P, property: 'display', value: 'none' }],
  ['property content', { selector: P, property: 'content', value: 'x' }],
  ['property background', { selector: P, property: 'background', value: 'red' }],
  ['property background-image', { selector: P, property: 'background-image', value: 'red' }],
  ['property animation', { selector: P, property: 'animation', value: 'x 1s' }],
  ['property transition', { selector: P, property: 'transition', value: 'all 1s' }],
  ['property pointer-events', { selector: 'buttons', property: 'pointer-events', value: 'none' }],
  ['property visibility', { selector: P, property: 'visibility', value: 'hidden' }],
  ['property custom', { selector: P, property: '--x', value: 'red' }],
  ['property trailing space', { selector: P, property: 'color ', value: 'red' }],
  ['property uppercase', { selector: P, property: 'COLOR', value: 'red' }],
  ['property with value', { selector: P, property: 'color: red; x', value: 'red' }],
  ['property __proto__', { selector: P, property: '__proto__', value: 'red' }],
  ['property constructor', { selector: P, property: 'constructor', value: 'red' }],
  ['property missing', { selector: P, value: 'red' }],
  // Lawful properties, wrong congregation
  ['rotate on selection', { selector: 'selection', property: 'rotate', value: '2deg' }],
  ['filter on first-letters', { selector: 'first-letters', property: 'filter', value: 'sepia(1)' }],
  ['font-size on lists', { selector: 'lists', property: 'font-size', value: '1.2em' }],
  ['outline on selection', { selector: 'selection', property: 'outline', value: '1px solid red' }],
  ['list-style on headings', { selector: 'headings', property: 'list-style-type', value: 'hebrew' }],
  // Wrong types for the value
  ['value number', { selector: P, property: 'opacity', value: 1 }],
  ['value null', { selector: P, property: 'color', value: null }],
  ['value boolean', { selector: P, property: 'color', value: true }],
  ['value array', { selector: P, property: 'color', value: ['red'] }],
  ['value object', { selector: P, property: 'color', value: { toString: 'red' } }],
  ['value missing', { selector: P, property: 'color' }],
]

// Raw bodies: broken JSON, wrong content types, pollution attempts, oversize.
const HOSTILE_RAW = [
  // JSON escapes decode before the grammar sees them: \u003b is a semicolon, \u007d a brace, \u0075rl( is url(.
  ['JSON-escaped semicolon', `{"selector":"paragraphs","property":"color","value":"red${BSL}u003b color:blue"}`, 'application/json', [400]],
  ['JSON-escaped brace', `{"selector":"paragraphs","property":"color","value":"red${BSL}u007d body${BSL}u007b"}`, 'application/json', [400]],
  ['JSON-escaped url(', `{"selector":"paragraphs","property":"color","value":"${BSL}u0075rl(x)"}`, 'application/json', [400]],
  ['JSON-escaped selector', `{"selector":"${BSL}u0062ody","property":"color","value":"red"}`, 'application/json', [400]],
  ['malformed JSON', '{"selector": "headings", "property":', 'application/json', [400]],
  ['JSON null', 'null', 'application/json', [400]],
  ['JSON array', '[{"selector":"headings","property":"color","value":"red"}]', 'application/json', [400]],
  ['JSON string', '"red"', 'application/json', [400]],
  ['JSON number', '42', 'application/json', [400]],
  ['text/plain body', '{"selector":"headings","property":"color","value":"red"}', 'text/plain', [400]],
  ['form-encoded body', 'selector=headings&property=color&value=red', 'application/x-www-form-urlencoded', [400]],
  ['__proto__ pollution', '{"__proto__":{"selector":"headings","property":"color","value":"red"}}', 'application/json', [400]],
  ['constructor.prototype pollution', '{"constructor":{"prototype":{"selector":"headings"}},"property":"color","value":"red"}', 'application/json', [400]],
  ['duplicate keys (last wins, still judged)', '{"selector":"headings","property":"color","value":"red","value":"url(x)"}', 'application/json', [400]],
  ['5 KB body', JSON.stringify({ selector: 'headings', property: 'color', value: 'red', pad: 'x'.repeat(5000) }), 'application/json', [413]],
]

const VALID_OFFERINGS = [
  ['headings', 'letter-spacing', '0.25em', '0.25em'],
  ['paragraphs', 'color', 'HSL(120, 50%, 40%)', 'hsl(120 50% 40%)'],
  ['paragraphs', 'color', 'hsla(20,80%,50%,0.75)', 'hsl(20 80% 50% / 0.75)'],
  ['links', 'color', '#C9A227', '#c9a227'],
  ['emphasis', 'background-color', 'Gold', 'gold'],
  ['first-letters', 'font-family', 'comic sans ms', 'Comic Sans MS'],
  ['headings', 'font-family', 'Cascade Glyphs', 'Cascade Glyphs'],
  ['glyphs', 'filter', 'hue-rotate(90deg)   blur(2px)', 'hue-rotate(90deg) blur(2px)'],
  ['sigils', 'filter', 'invert(100%)', 'invert(1)'],
  ['headings', 'text-shadow', 'gold 0.05em 0.05em', '0.05em 0.05em 0px gold'],
  ['buttons', 'box-shadow', 'inset 0 0 18px 2px gold', 'inset 0px 0px 18px 2px gold'],
  ['quotes', 'rotate', '-3deg', '-3deg'],
  ['lists', 'list-style-type', 'hebrew', 'hebrew'],
  ['links', 'outline', 'dotted 2px teal', '2px dotted teal'],
  ['paragraphs', 'text-indent', '2em', '2em'],
  ['headings', 'font-style', 'oblique -10deg', 'oblique -10deg'],
  ['emphasis', 'text-decoration', 'underline wavy crimson', 'underline wavy crimson'],
  ['headings', 'text-emphasis-style', 'open sesame', 'open sesame'],
  ['buttons', 'opacity', '0.5', '0.5'],
  ['selection', 'color', 'deeppink', 'deeppink'],
  ['code', 'border-radius', '50%', '50%'],
  ['links', 'cursor', 'wait', 'wait'],
  ['headings', 'scale', '1.1', '1.1'],
  ['paragraphs', 'line-height', '1.90', '1.9'],
  ['first-letters', 'font-size', '2.2em', '2.2em'],
  ['links', 'vertical-align', 'super', 'super'],
  ['headings', 'font-weight', '900', '900'],
  ['paragraphs', 'text-align', 'justify', 'justify'],
  ['headings', 'text-transform', 'uppercase', 'uppercase'],
  ['paragraphs', 'word-spacing', '0.5em', '0.5em'],
  ['headings', 'font-variant-caps', 'small-caps', 'small-caps'],
  ['emphasis', 'outline-offset', '4px', '4px'],
]

const HOSTILE_WALL = [
  // [label, text, expected status, expected washed text (for 201)]
  ['script tag', '<script>alert(1)</script>', 201, 'scriptalertscript'],
  ['img onerror', '<img src=x onerror=alert(1)>', 201, 'img srcx onerroralert'],
  ['javascript scheme', 'javascript:alert(document.cookie)', 201, 'javascriptalertdocument.cookie'],
  ['style breakout', '</style><style>body{display:none}</style>', 201, 'stylestylebodydisplaynonestyle'],
  ['sql injection', "Robert'); DROP TABLE ritual_wall;--", 201, "Robert' DROP TABLE ritualwall--"],
  ['template injection', 'hello {{7*7}} ${7*7} there', 201, 'hello there'],
  ['right-to-left override', 'hello\u{202e}evil', 201, 'helloevil'],
  ['zero-width characters', 'zero\u{200b}width\u{200c}join\u{feff}', 201, 'zerowidthjoin'],
  ['accents fall away', 'Café crème brûlée', 201, 'Cafe creme brulee'],
  ['mathematical letters', '\u{1D58D}\u{1D58A}\u{1D591}\u{1D591}\u{1D594} world', 201, 'hello world'],
  ['newlines and tabs', 'line\nbreak\ttab\r\nend', 201, 'line break tab end'],
  ['emoji', 'emoji \u{1F642} ok', 201, 'emoji ok'],
  ['punctuation flood', '!!!!!!!!!!wow??????', 201, '!!!wow???'],
  ['html entities', '&lt;b&gt;bold&lt;/b&gt;', 201, 'ltbgtboldltbgt'],
  ['only symbols', '<<<>>>{}();', 400],
  ['two letters', 'ab', 400],
  ['spaces only', '     ', 400],
  ['empty', '', 400],
  ['81 letters', 'a'.repeat(81), 400],
  ['401 raw characters', 'x'.repeat(401), 400],
  ['number', 42, 400],
  ['null', null, 400],
  ['array', ['hello there'], 400],
  ['object', { text: 'hello there' }, 400],
]

// ── The ordeal ──────────────────────────────────────────────────────────────────────────────────────
let server
async function main() {
  server = spawn(process.execPath, ['--no-warnings', 'server/index.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), CASCADE_DB: dbFile },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let serverErr = ''
  server.stderr.on('data', (d) => {
    serverErr += d
  })
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) break
    } catch {}
    if (i > 80) throw new Error(`server did not start on ${port}\n${serverErr}`)
    await sleep(125)
  }
  listen()
  await sleep(250)

  // 0. The state
  begin('state')
  {
    const r = await call('GET', '/api/state')
    check('GET /api/state is 200', r.status === 200, r.status)
    check('state has the agreed shape', r.data && ['prayers', 'eclipseUntil', 'offerings', 'wall', 'ascended', 'online', 'now'].every((k) => k in r.data), show(r.data))
    check('state is never cached', /no-store/.test(r.headers.get('cache-control') ?? ''))
    check('state is JSON', /application\/json/.test(r.headers.get('content-type') ?? ''))
    check('an empty temple has no offerings', Array.isArray(r.data?.offerings) && r.data.offerings.length === 0)
  }

  // 1. Heresies against the Living Canon
  begin('offer: heresies refused')
  const before = events.filter((e) => e.event === 'offering').length
  for (const [label, body] of HOSTILE_OFFERINGS) {
    const r = await call('POST', '/api/offer', { json: body })
    const echoes = ['alert(', 'evil.example', '<script', 'display:none', 'url(x)'].filter((m) => r.text.includes(m))
    check(`${label}: refused`, r.status === 400, `status ${r.status} for ${show(body.value)} -> ${show(r.data)}`)
    check(`${label}: the error names no payload`, echoes.length === 0, echoes.join(', '))
  }
  for (const [label, raw, type, statuses] of HOSTILE_RAW) {
    const r = await call('POST', '/api/offer', { raw, type })
    check(`${label}: refused`, statuses.includes(r.status), `status ${r.status} -> ${show(r.text)}`)
  }
  {
    const r = await call('GET', '/api/state')
    check('nothing heretical was stored', r.data.offerings.length === 0, show(r.data.offerings))
    check('nothing heretical was broadcast', events.filter((e) => e.event === 'offering').length === before)
  }

  // 2. Lawful offerings round-trip as canonical triples
  begin('offer: valid offerings round-trip')
  const accepted = []
  for (const [selector, property, value, expected] of VALID_OFFERINGS) {
    const r = await call('POST', '/api/offer', { json: { selector, property, value, id: 999999, at: 0, rule: 'body{display:none}' } })
    const o = r.data?.offering
    check(`${selector} { ${property}: ${value} } accepted`, r.status === 201, `status ${r.status} -> ${show(r.data)}`)
    check(`  stored as ${expected}`, o?.value === expected && o?.selector === selector && o?.property === property, show(o))
    check('  extra fields ignored', o && o.id !== 999999 && o.at > 0 && !r.text.includes('display:none'), show(o))
    if (o) accepted.push(o)
  }
  await sleep(300)
  {
    const r = await call('GET', '/api/state')
    const ids = r.data.offerings.map((o) => o.id)
    check('state lists every accepted offering, oldest first', accepted.every((o) => ids.includes(o.id)) && ids.every((id, i) => i === 0 || id > ids[i - 1]), show(ids))
    check('state offerings are exactly the canonical triples', accepted.every((o) => r.data.offerings.some((s) => s.id === o.id && s.value === o.value && s.selector === o.selector && s.property === o.property)))
    const bad = markersIn(wordsOf(r.data.offerings))
    check('no forbidden token in stored offerings', bad.length === 0, bad.join(' '))
    const sse = events.filter((e) => e.event === 'offering').map((e) => e.data.offering)
    check('every acceptance was broadcast', accepted.every((o) => sse.some((s) => s.id === o.id && s.value === o.value)), `${sse.length} broadcasts`)
    const badSse = markersIn(events.filter((e) => e.event === 'offering').map((e) => e.raw).join('\n').replace(/^event: offering$/gm, '').replace(/^data: /gm, '').replace(/[{}"]/g, ''))
    check('no forbidden token in broadcasts', badSse.length === 0, badSse.join(' '))
  }

  // 3. The Wall of Strangers
  begin('wall: hostile text washed or refused')
  const washed = []
  for (const [label, text, status, expected] of HOSTILE_WALL) {
    const r = await call('POST', '/api/wall', { json: { text } })
    check(`${label}: ${status === 201 ? 'washed' : 'refused'}`, r.status === status, `status ${r.status} -> ${show(r.data)}`)
    if (status === 201) {
      const t = r.data?.message?.text
      check(`  reads ${show(expected)}`, t === expected, show(t))
      check('  only letters, spaces and . , ! ? \' -', typeof t === 'string' && /^[A-Za-z .,!?'-]{3,80}$/.test(t), show(t))
      if (t) washed.push(t)
    }
  }
  for (const [label, raw, type] of [['text/plain', 'hello world', 'text/plain'], ['malformed JSON', '{"text":', 'application/json'], ['JSON array', '["hello world"]', 'application/json']]) {
    const r = await call('POST', '/api/wall', { raw, type })
    check(`${label}: refused`, r.status === 400, `status ${r.status}`)
  }
  {
    const r = await call('GET', '/api/state')
    check('the wall kept every washed message', washed.every((t) => r.data.wall.some((m) => m.text === t)), `${r.data.wall.length} messages`)
    check('the wall holds nothing but the lawful alphabet', r.data.wall.every((m) => /^[A-Za-z .,!?'-]+$/.test(m.text)), show(r.data.wall.map((m) => m.text)))
    check('the table survived Robert', r.data.wall.length === washed.length)
  }

  // 4. Penances (rate limits)
  begin('rate limits')
  {
    const ip = nextIp()
    const a = await call('POST', '/api/offer', { json: { selector: 'sigils', property: 'opacity', value: '0.8' }, ip })
    const b = await call('POST', '/api/offer', { json: { selector: 'sigils', property: 'opacity', value: '0.9' }, ip })
    check('offer: first from a soul accepted', a.status === 201, a.status)
    check('offer: second within ten minutes refused (429)', b.status === 429, b.status)
    check('offer: Retry-After is given, at most ten minutes', Number(b.headers.get('retry-after')) > 0 && Number(b.headers.get('retry-after')) <= 600, b.headers.get('retry-after'))
    check('offer: the refused offering was not stored', !(await call('GET', '/api/state')).data.offerings.some((o) => o.selector === 'sigils' && o.value === '0.9'))
  }
  {
    const ip = nextIp()
    const a = await call('POST', '/api/offer', { json: { selector: 'sigils', property: 'opacity', value: '0' }, ip })
    const b = await call('POST', '/api/offer', { json: { selector: 'sigils', property: 'scale', value: '1.05' }, ip })
    check('offer: a refused heresy does not spend the soul\'s offering', a.status === 400 && b.status === 201, `${a.status} then ${b.status}`)
  }
  {
    const ip = nextIp()
    const statuses = []
    for (let i = 0; i < 14; i++) statuses.push((await call('POST', '/api/offer', { json: { selector: 'body', property: 'color', value: 'red' }, ip })).status)
    check('offer: a burst of 12 attempts is judged, the 13th is throttled', statuses.slice(0, 12).every((s) => s === 400) && statuses.slice(12).every((s) => s === 429), statuses.join(','))
  }
  {
    const ip = nextIp()
    const a = await call('POST', '/api/wall', { json: { text: 'first words' }, ip })
    const b = await call('POST', '/api/wall', { json: { text: 'second words' }, ip })
    check('wall: first message accepted', a.status === 201, a.status)
    check('wall: second within five minutes refused (429)', b.status === 429, b.status)
    check('wall: Retry-After at most five minutes', Number(b.headers.get('retry-after')) > 0 && Number(b.headers.get('retry-after')) <= 300, b.headers.get('retry-after'))
  }
  {
    const ip = nextIp()
    const statuses = []
    for (let i = 0; i < 14; i++) statuses.push((await call('POST', '/api/wall', { json: { text: '<>' }, ip })).status)
    check('wall: a burst of 12 attempts is judged, the 13th is throttled', statuses.slice(0, 12).every((s) => s === 400) && statuses.slice(12).every((s) => s === 429), statuses.join(','))
  }
  let prayed = 0
  {
    const ip = nextIp()
    const statuses = []
    for (let i = 0; i < 32; i++) statuses.push((await call('POST', '/api/pray', { json: {}, ip })).status)
    prayed = statuses.filter((s) => s === 200).length
    check('pray: 30 prayers a minute are heard', statuses.slice(0, 30).every((s) => s === 200), statuses.join(','))
    check('pray: the 31st is asked for patience (429)', statuses.slice(30).every((s) => s === 429), statuses.slice(30).join(','))
  }

  // 5. The Eclipse
  begin('eclipse')
  {
    const s0 = (await call('GET', '/api/state')).data
    check('prayers counted', s0.prayers === prayed, `${s0.prayers} vs ${prayed}`)
    check('no eclipse yet', s0.eclipseUntil === 0)
    let last = null
    let eclipseAt = null
    let n = s0.prayers
    let ip = nextIp()
    let fromIp = 0
    while (n < 109) {
      if (fromIp === 30) {
        ip = nextIp()
        fromIp = 0
      }
      last = await call('POST', '/api/pray', { json: {}, ip })
      fromIp++
      n = last.data?.count ?? n
      if (last.data?.eclipse) eclipseAt = { ...last.data, t: Date.now() }
      if (last.status !== 200) break
    }
    check('the count reached 109', n === 109, n)
    check('the 108th prayer brought the eclipse', eclipseAt?.count === 108, show(eclipseAt))
    check('the eclipse lasts 33 seconds', eclipseAt && Math.abs(eclipseAt.eclipseUntil - eclipseAt.now - 33000) < 5, show(eclipseAt))
    check('the 109th prayer brought none', last?.data?.eclipse === false, show(last?.data))
    await sleep(300)
    const e = events.find((x) => x.event === 'eclipse')
    check('the eclipse was broadcast', e && e.data.until === eclipseAt?.eclipseUntil && e.data.count === 108, show(e?.data))
    check('prayers were broadcast', events.filter((x) => x.event === 'prayer').length >= 109 - 1)
    const s1 = (await call('GET', '/api/state')).data
    check('state knows the eclipse', s1.eclipseUntil === eclipseAt?.eclipseUntil && s1.eclipseUntil > s1.now, show(s1.eclipseUntil))
  }

  // 6. A tampered register
  begin('tampered database')
  {
    const { DatabaseSync } = await import('node:sqlite')
    const db = new DatabaseSync(dbFile)
    db.exec('PRAGMA busy_timeout = 3000')
    const now = Date.now()
    const addO = db.prepare('INSERT INTO ritual_offerings (selector, property, value, at) VALUES (?, ?, ?, ?)')
    for (const [s, p, v] of [
      ['paragraphs', 'color', 'red;}body{display:none'],
      ['body', 'color', 'red'],
      ['paragraphs', 'behavior', 'url(x)'],
      ['headings', 'letter-spacing', '0.30em'], // lawful but not canonical: never spoken
      ['headings', 'letter-spacing', '9em'],
      ['paragraphs', 'color', 'expression(alert(1))'],
      ['__proto__', 'color', 'red'],
    ]) addO.run(s, p, v, now)
    db.prepare('INSERT INTO ritual_wall (text, at) VALUES (?, ?)').run('<script>alert(1)</script>', now)
    db.prepare('INSERT INTO ritual_wall (text, at) VALUES (?, ?)').run('ab', now)
    db.prepare('INSERT INTO ascended (name, at) VALUES (?, ?)').run('<img src=x onerror=alert(1)>', now)
    db.prepare('INSERT INTO ascended (name, at) VALUES (?, ?)').run('', now)
    db.prepare('INSERT INTO ascended (name, at) VALUES (?, ?)').run('Saint Margin', now)
    db.close()
    const s = (await call('GET', '/api/state')).data
    const tampered = s.offerings.filter((o) => o.at === now)
    check('no tampered offering is spoken', tampered.length === 0, show(tampered))
    check('stored offerings still clean', markersIn(wordsOf(s.offerings)).length === 0, markersIn(wordsOf(s.offerings)).join(' '))
    check('a tampered wall message is washed on the way out', s.wall.some((m) => m.text === 'scriptalertscript') && !JSON.stringify(s.wall).includes('<'), show(s.wall.slice(-2)))
    check('a washed-away wall message is not served', !s.wall.some((m) => m.text === 'ab'))
    check('ascended names are washed', s.ascended.every((a) => /^[A-Za-z '-]{1,24}$/.test(a.name)), show(s.ascended))
    check('an empty name is not served', s.ascended.length === 2, s.ascended.length)
    check('the whole state carries no markup', !/[<>]/.test(JSON.stringify(s)))
  }

  // 7. The client's grammar and the CSS it composes
  begin('client grammar and CSS')
  {
    const g = await import(pathToFileURL(join(root, 'public/js/layers/ritual.js')).href)
    const { makeRng } = await import(pathToFileURL(join(root, 'public/js/kernel/rng.js')).href)
    const state = (await call('GET', '/api/state')).data
    const css = g.buildCanonCss(state.offerings)
    const lines = css.split('\n')
    const rules = lines.filter((l) => l.startsWith('  '))
    check('the Canon is one @layer offerings block', lines[1] === '@layer offerings {' && lines.filter((l) => l.includes('@')).length === 1, lines[1])
    check('one rule per offering', rules.length === state.offerings.length, `${rules.length} vs ${state.offerings.length}`)
    const RULE = /^ {2}html:not\(\[data-mercy="on"\]\) #temple [^{};]+ \{ [a-z-]+: [^{};!@\\]+; \}$/
    const off = rules.filter((r) => !RULE.test(r))
    check('every rule is scoped to #temple, guarded by mercy, and holds one declaration', off.length === 0, show(off[0]))
    check('braces balance', (css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length)
    const body = rules.join('\n')
    const bad = ['url(', 'expression', '\\', '@import', '!important', '/*', 'var(', '<', 'javascript'].filter((m) => body.includes(m))
    check('no forbidden token in the rules', bad.length === 0, bad.join(' '))
    check('the Inscription, the Rosetta and the Ladder are spared in every rule', rules.every((r) => r.includes(':not([data-inscription], [data-inscription] *, .rosetta, .rosetta *, #ladder, #ladder *)')))
    const heresies = HOSTILE_OFFERINGS.map(([, b]) => b)
    check('the builder speaks no heresy, even when handed it raw', g.buildCanonCss(heresies).split('\n').filter((l) => l.startsWith('  ')).length === 0)
    check('the client refuses every heresy the server refuses', heresies.every((b) => !g.validateOffering(b.selector, b.property, b.value).ok))
    check('the client agrees with the server on every lawful value', VALID_OFFERINGS.every(([s, p, v, e]) => g.validateOffering(s, p, v).value === e))

    // Every value fate would choose from the altar's dice is lawful and canonical.
    const dice = makeRng('ordeal')
    let diceBad = null
    let diceCount = 0
    for (const t of Object.keys(g.TARGETS)) {
      for (const p of g.propertiesFor(t)) {
        for (let i = 0; i < 40; i++) {
          const v = g.sampleValue(t, p, dice)
          const r = g.validateOffering(t, p, v)
          diceCount++
          if (!r.ok || g.validateOffering(t, p, r.value).value !== r.value) diceBad ??= `${t} ${p}: ${v} -> ${r.error ?? r.value}`
        }
      }
    }
    check(`all ${diceCount} dice throws are lawful and idempotent`, !diceBad, diceBad)

    // A lawful result carries no CSS punctuation of its own. Quotes appear only inside the grammar's own fixed
    // font stacks, and only when the canonical value is one of those names.
    const STACKS = new Set(['Georgia', 'Palatino', 'Garamond', 'Times New Roman', 'Comic Sans MS', 'Courier New', 'Impact', 'Trebuchet MS', 'Verdana', 'Cascade Glyphs'])
    const leaks = (r) => /[;{}!@\\<>"'`*=+&|^~[\]_$?:]/.test(r.value) ||
      /[;{}!@\\<>"`]/.test(r.cssValue) ||
      (r.cssValue.includes("'") && !(r.property === 'font-family' && STACKS.has(r.value))) ||
      /url\(|var\(|expression|\/\*/.test(r.rule)

    // Fuzz: random strings over the whole printable alphabet, weighted toward CSS punctuation.
    const fuzz = makeRng('fuzz')
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789 #%.,()/-;:{}!@\\\'"<>*=+&|^~`[]_$?'
    const words = ['url(', 'var(', 'hsl(', 'blur(', 'expression', 'red', 'gold', 'em', 'px', 'deg', '%', '/*', '*/', '0', '1', '-', ' ', '(', ')', ';', '}', '{', '\\', '!important', 'inset', 'solid', 'serif']
    const targets = Object.keys(g.TARGETS)
    let fuzzBad = null
    let fuzzOk = 0
    for (let i = 0; i < 30000; i++) {
      const t = fuzz.pick(targets)
      const p = fuzz.pick(g.propertiesFor(t))
      let v = ''
      const n = fuzz.int(1, 10)
      for (let k = 0; k < n; k++) v += fuzz.chance(0.5) ? fuzz.pick(words) : alphabet[fuzz.int(0, alphabet.length - 1)]
      const r = g.validateOffering(t, p, v)
      if (!r.ok) continue
      fuzzOk++
      const leaked = leaks(r)
      if (leaked || g.validateOffering(t, p, r.value).value !== r.value) fuzzBad ??= `${t} ${p}: ${JSON.stringify(v)} -> ${r.rule}`
    }
    check(`fuzz: 30000 random values, ${fuzzOk} lawful, none leaks a forbidden token`, !fuzzBad, fuzzBad)

    // Mutation fuzz: start from lawful dice throws and insert, delete or swap characters, so the grammar is
    // attacked right at its edges, where near-misses live.
    let mutBad = null
    let mutOk = 0
    const MUT = 40000
    for (let i = 0; i < MUT; i++) {
      const t = fuzz.pick(targets)
      const p = fuzz.pick(g.propertiesFor(t))
      let v = g.sampleValue(t, p, fuzz)
      for (let k = fuzz.int(1, 3); k > 0; k--) {
        const at = fuzz.int(0, v.length)
        const op = fuzz.int(0, 2)
        const piece = fuzz.chance(0.5) ? fuzz.pick(words) : alphabet[fuzz.int(0, alphabet.length - 1)]
        if (op === 0) v = v.slice(0, at) + piece + v.slice(at)
        else if (op === 1) v = v.slice(0, at) + v.slice(at + fuzz.int(1, 3))
        else v = v.slice(0, at) + piece + v.slice(at + 1)
      }
      const r = g.validateOffering(t, p, v)
      if (!r.ok) continue
      mutOk++
      const leaked = leaks(r)
      if (leaked || g.validateOffering(t, p, r.value).value !== r.value) mutBad ??= `${t} ${p}: ${JSON.stringify(v)} -> ${r.rule}`
    }
    check(`mutation fuzz: ${MUT} near-miss values, ${mutOk} lawful, none leaks and all are canonical`, !mutBad, mutBad)

    // The wall washer, directly.
    check('sanitizeWall refuses non-strings', [null, 1, {}, []].every((x) => !g.sanitizeWall(x).ok))
    let washBad = null
    for (let i = 0; i < 5000; i++) {
      let s = ''
      for (let k = 0; k < fuzz.int(0, 90); k++) s += String.fromCodePoint(fuzz.chance(0.7) ? fuzz.int(32, 126) : fuzz.int(128, 0x2fff))
      const r = g.sanitizeWall(s)
      if (r.ok && !/^[A-Za-z .,!?'-]{3,80}$/.test(r.text)) washBad ??= JSON.stringify(s)
    }
    check('fuzz: 5000 random wall texts, every accepted one is in the lawful alphabet', !washBad, washBad)
  }
}

try {
  await main()
} catch (e) {
  begin('harness')
  check('the ordeal ran to the end', false, e?.stack ?? String(e))
} finally {
  choir.abort()
  try {
    server?.kill()
  } catch {}
  await sleep(400)
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {}
}

let total = 0
let failed = 0
console.log('\nTHE ORDEAL OF THE ALTAR')
for (const s of sections) {
  total += s.pass + s.fail
  failed += s.fail
  console.log(`  ${s.fail ? 'FAIL' : 'pass'}  ${String(s.pass).padStart(4)} / ${String(s.pass + s.fail).padEnd(4)}  ${s.name}`)
  for (const f of s.failures) console.log(`          x ${f}`)
}
console.log(`\n  ${total - failed} of ${total} checks passed.${failed ? ` ${failed} FAILED.` : ' The altar holds.'}\n`)
process.exitCode = failed ? 1 : 0
