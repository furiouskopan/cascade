#!/usr/bin/env node
// Witness tool: boots the temple server, opens pages in headless Chrome, and reports what happened.
//
//   node tools/shoot.mjs [options] <path> [<path> ...]
//
//   <path>            e.g. "/?face=sanctum&seed=abc"  or  "/verse/in/the/beginning"
//   --port N          server port (default 3401). Use a unique port per concurrent user.
//   --no-server       don't start a server; use one already listening on --port
//   --db FILE         SQLite file for the server (default data/test-<port>.db)
//   --out DIR         screenshot directory (default shots/)
//   --size WxH        viewport (default 1280x800); --mobile = 390x844
//   --wait MS         wait after load before evaluating/screenshotting (default 3500)
//   --eval CODE       JS evaluated in the page after the wait (awaited; repeatable). Result is printed.
//   --after MS        extra wait after the evals, before the screenshot (default 600)
//   --full            capture the full scrollable page instead of the viewport
//
// Prints one JSON object per page: { path, screenshot, console[], errors[], failedRequests[], evals[] }.
// Screenshots can be viewed with the Read tool.
import { spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const opts = { port: 3401, out: 'shots', size: '1280x800', wait: 3500, after: 600, evals: [], paths: [] }
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--port') opts.port = Number(argv[++i])
  else if (a === '--no-server') opts.noServer = true
  else if (a === '--db') opts.db = argv[++i]
  else if (a === '--out') opts.out = argv[++i]
  else if (a === '--size') opts.size = argv[++i]
  else if (a === '--mobile') opts.size = '390x844'
  else if (a === '--wait') opts.wait = Number(argv[++i])
  else if (a === '--after') opts.after = Number(argv[++i])
  else if (a === '--eval') opts.evals.push(argv[++i])
  else if (a === '--full') opts.full = true
  // Git Bash rewrites "/verse/x" into "C:/Program Files/Git/verse/x"; undo that.
  else opts.paths.push(a.replace(/^[A-Za-z]:[\\/].*?[\\/]Git(?=[\\/])/, '').replace(/\\/g, '/'))
}
if (!opts.paths.length) opts.paths.push('/')
const [W, H] = opts.size.split('x').map(Number)
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function poll(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return r.json()
    } catch {}
    await sleep(250)
  }
  throw new Error(`timed out waiting for ${url}`)
}

let server, chrome, profile
async function cleanup() {
  try { chrome?.kill() } catch {}
  try { server?.kill() } catch {}
  await sleep(300)
  try { if (profile) rmSync(profile, { recursive: true, force: true }) } catch {}
}
process.on('SIGINT', async () => { await cleanup(); process.exit(130) })

try {
  if (!opts.noServer) {
    server = spawn(process.execPath, ['server/index.js'], {
      cwd: root,
      env: { ...process.env, PORT: String(opts.port), CASCADE_DB: resolve(root, opts.db || `data/test-${opts.port}.db`) },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let serverErr = ''
    server.stderr.on('data', (d) => { serverErr += d })
    server.on('exit', (code) => { if (code) console.error(`[server exited ${code}]\n${serverErr}`) })
    await poll(`http://localhost:${opts.port}/api/health`)
  }

  const dbg = 9200 + (opts.port % 700)
  profile = mkdtempSync(join(tmpdir(), 'cascade-chrome-'))
  chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${dbg}`, `--user-data-dir=${profile}`,
    // --mute-audio: Web Audio still runs (analysers, offline rendering), but nothing reaches the speakers.
    '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
    '--hide-scrollbars', `--window-size=${W},${H}`, 'about:blank',
  ], { stdio: 'ignore' })
  const version = await poll(`http://127.0.0.1:${dbg}/json/version`)

  const ws = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  let id = 0
  const pending = new Map()
  const listeners = new Set()
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve: res, reject: rej } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result)
    } else for (const l of listeners) l(msg)
  }
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const mid = ++id
    pending.set(mid, { resolve: res, reject: rej })
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }))
  })

  mkdirSync(resolve(root, opts.out), { recursive: true })

  for (const path of opts.paths) {
    const report = { path, screenshot: null, console: [], errors: [], failedRequests: [], evals: [] }
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    const onEvent = (msg) => {
      if (msg.sessionId !== sessionId) return
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ')
        report.console.push({ type: msg.params.type, text: text.slice(0, 500) })
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails
        report.errors.push(`${d.exception?.description ?? d.text} @ ${d.url ?? ''}:${d.lineNumber}`.slice(0, 800))
      } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
        report.errors.push(`[log] ${msg.params.entry.text} ${msg.params.entry.url ?? ''}`.slice(0, 500))
      } else if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) {
        report.failedRequests.push(`${msg.params.response.status} ${msg.params.response.url}`)
      }
    }
    listeners.add(onEvent)
    await send('Runtime.enable', {}, sessionId)
    await send('Log.enable', {}, sessionId)
    await send('Network.enable', {}, sessionId)
    await send('Page.enable', {}, sessionId)
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 600 }, sessionId)
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId)
    const url = path.startsWith('http') ? path : `http://localhost:${opts.port}${path}`
    await send('Page.navigate', { url }, sessionId)
    await sleep(opts.wait)
    for (const code of opts.evals) {
      try {
        const r = await send('Runtime.evaluate', { expression: `(async () => { ${code} })()`, awaitPromise: true, returnByValue: true, userGesture: true }, sessionId)
        report.evals.push(r.exceptionDetails ? { error: r.exceptionDetails.exception?.description ?? r.exceptionDetails.text } : { value: r.result.value })
      } catch (e) {
        report.evals.push({ error: String(e) })
      }
    }
    await sleep(opts.after)
    const shotParams = { format: 'png' }
    if (opts.full) {
      const m = await send('Page.getLayoutMetrics', {}, sessionId)
      const cs = m.cssContentSize || m.contentSize
      shotParams.captureBeyondViewport = true
      shotParams.clip = { x: 0, y: 0, width: Math.min(cs.width, W), height: Math.min(cs.height, 8000), scale: 1 }
    }
    const shot = await send('Page.captureScreenshot', shotParams, sessionId)
    const slug = path.replace(/^https?:\/\/[^/]+/, '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root'
    const file = resolve(root, opts.out, `${slug}-${W}x${H}.png`)
    writeFileSync(file, Buffer.from(shot.data, 'base64'))
    report.screenshot = file
    listeners.delete(onEvent)
    await send('Target.closeTarget', { targetId })
    console.log(JSON.stringify(report, null, 1))
  }
  ws.close()
} catch (e) {
  console.error('[shoot]', e)
  process.exitCode = 1
} finally {
  await cleanup()
}
