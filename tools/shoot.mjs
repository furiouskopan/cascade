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
//
// RESOURCES: every caller shares ONE headless Chrome (muted, no GPU) on port 9333, and at most
// WITNESS_SLOTS (default 2) runs render at the same time across all processes; the others wait for a slot
// (up to 60 s, then exit with code 75 so the caller can retry). Each run gets a fresh, isolated browser
// context (its own localStorage), so runs never see each other's memory. The shared Chrome closes itself
// after 5 idle minutes (tools/witness-warden.mjs).
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, rmSync, openSync, closeSync, statSync } from 'node:fs'
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
const SHARED_PORT = 9333
const SLOTS = Math.max(1, Number(process.env.WITNESS_SLOTS) || 2)
const SLOT_WAIT_MS = 60000
const TMP = join(tmpdir(), 'cascade-witness')
const HEARTBEAT = join(TMP, 'heartbeat')
mkdirSync(TMP, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const beat = () => { try { writeFileSync(HEARTBEAT, String(Date.now())) } catch {} }

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

async function sharedVersion() {
  try {
    const r = await fetch(`http://127.0.0.1:${SHARED_PORT}/json/version`)
    if (r.ok) return await r.json()
  } catch {}
  return null
}

function alive(pid) {
  try { process.kill(pid, 0); return true } catch (e) { return e.code === 'EPERM' }
}

// Exclusive lock via O_EXCL create; stale when its owner is dead or it is older than maxAge.
function tryLock(file, maxAge) {
  try {
    const fd = openSync(file, 'wx')
    writeFileSync(fd, String(process.pid))
    closeSync(fd)
    return true
  } catch {
    try {
      const pid = Number(readFileSync(file, 'utf8'))
      const age = Date.now() - statSync(file).mtimeMs
      if (!pid || !alive(pid) || age > maxAge) rmSync(file, { force: true })
    } catch {}
    return false
  }
}

async function ensureBrowser() {
  let v = await sharedVersion()
  if (v) return v
  const lock = join(TMP, 'launch.lock')
  for (let i = 0; i < 80 && !tryLock(lock, 30000); i++) {
    await sleep(500)
    if ((v = await sharedVersion())) return v
  }
  try {
    if ((v = await sharedVersion())) return v
    const chrome = spawn(CHROME, [
      '--headless=new', `--remote-debugging-port=${SHARED_PORT}`, `--user-data-dir=${join(TMP, 'profile')}`,
      '--no-first-run', '--no-default-browser-check', '--mute-audio', '--disable-gpu',
      '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars',
      '--disable-extensions', '--disable-background-networking', '--disable-component-update',
      '--disable-default-apps', '--disable-sync', '--no-pings',
      '--disable-features=IsolateOrigins,site-per-process,Translate,MediaRouter',
      '--renderer-process-limit=3', '--js-flags=--max-old-space-size=512',
      '--window-size=1280,800', 'about:blank',
    ], { detached: true, stdio: 'ignore' })
    chrome.unref()
    const warden = spawn(process.execPath, [resolve(root, 'tools', 'witness-warden.mjs'), String(chrome.pid)], { detached: true, stdio: 'ignore' })
    warden.unref()
    return await poll(`http://127.0.0.1:${SHARED_PORT}/json/version`, 80)
  } finally {
    rmSync(lock, { force: true })
  }
}

async function acquireSlot() {
  const start = Date.now()
  let told = false
  while (Date.now() - start < SLOT_WAIT_MS) {
    for (let i = 0; i < SLOTS; i++) {
      const f = join(TMP, `slot-${i}.lock`)
      if (tryLock(f, 5 * 60000)) return f
    }
    if (!told) {
      console.error(`[witness] waiting for a Chrome slot (${SLOTS} shared by everyone testing)...`)
      told = true
    }
    await sleep(700)
  }
  return null
}

let server, slot
async function cleanup() {
  try { server?.kill() } catch {}
  if (slot) rmSync(slot, { force: true })
  beat()
}
process.on('SIGINT', async () => { await cleanup(); process.exit(130) })
process.on('SIGTERM', async () => { await cleanup(); process.exit(143) })

try {
  slot = await acquireSlot()
  if (!slot) {
    console.error(`[witness] all ${SLOTS} Chrome slots stayed busy for ${SLOT_WAIT_MS / 1000}s (other agents are testing). Retry in a minute.`)
    process.exit(75)
  }
  beat()

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

  const version = await ensureBrowser()
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
  // A private context per run: fresh localStorage, like a new profile, disposed at the end.
  const { browserContextId } = await send('Target.createBrowserContext', { disposeOnDetach: true })

  try {
    for (const path of opts.paths) {
      beat()
      const report = { path, screenshot: null, console: [], errors: [], failedRequests: [], evals: [] }
      const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
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
      try {
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
      } finally {
        listeners.delete(onEvent)
        await send('Target.closeTarget', { targetId }).catch(() => {})
      }
      console.log(JSON.stringify(report, null, 1))
    }
  } finally {
    await send('Target.disposeBrowserContext', { browserContextId }).catch(() => {})
    ws.close()
  }
} catch (e) {
  console.error('[shoot]', e)
  process.exitCode = 1
} finally {
  await cleanup()
}
