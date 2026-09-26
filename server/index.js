// THE CASCADE — temple server.
// Static temple in /public, shared ritual API under /api, every other path is a verse.
import express from 'express'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { streamHandler, online } from './sse.js'
import { kvGet, kvSet } from './db.js'
import ritual from './routes/ritual.js'
import secrets from './routes/secrets.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')
const PORT = Number(process.env.PORT) || 3333

const app = express()
// Whose word to take for a visitor's address (rate limits are per address). A tunnel on this machine (ngrok,
// cloudflared) connects from loopback, the default. Behind a host's proxy set TRUST_PROXY (a hop count such as
// 1, or the proxy's address), or every visitor looks like the proxy and all share one set of limits.
const TRUST_PROXY = process.env.TRUST_PROXY?.trim()
app.set('trust proxy', !TRUST_PROXY ? 'loopback'
  : /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY)
  : TRUST_PROXY === 'true' ? true : TRUST_PROXY === 'false' ? false : TRUST_PROXY)
app.disable('x-powered-by')
app.use((req, res, next) => {
  // Headers are scripture too. Some of them are placeholders the Secrets layer may rewrite.
  res.set('X-Cascade', 'all style descends')
  res.set('X-Origin-Order', 'user-agent < user < author')
  next()
})
app.use(express.json({ limit: '4kb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, online: online() }))
app.get('/api/stream', streamHandler)
app.use('/api', ritual)
app.use('/', secrets)
app.use('/api', (req, res) => res.status(404).json({ error: 'no such rite' }))

// Each page load of the temple (any extensionless GET that reaches this far) is counted, for the recruitment
// face's hit counter. Assets have extensions; /api and the secrets' own pages were answered above.
app.use((req, res, next) => {
  if (req.method === 'GET' && !/\.[a-z0-9]+$/i.test(req.path)) kvSet('hits', (Number(kvGet('hits', 0)) || 0) + 1)
  next()
})

app.use(express.static(pub, { extensions: ['html'], index: 'index.html' }))

// Every unknown path is a verse of the infinite scripture (the Babel face reads location.pathname).
app.get(/.*/, (req, res) => res.sendFile(resolve(pub, 'index.html')))

// Last rites: never show a stack trace or a file path. A malformed JSON body is a 400, the rest a 500.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  const status = err.type === 'entity.parse.failed' || err.type === 'entity.too.large' ? (err.status || 400) : 500
  if (status >= 500) console.error('[temple]', err)
  res.status(status).json({ error: status >= 500 ? 'the temple stumbled' : 'the offering was malformed' })
})

app.listen(PORT, () => {
  console.log(`THE CASCADE flows at http://localhost:${PORT}`)
})
