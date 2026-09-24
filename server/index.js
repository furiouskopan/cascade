// THE CASCADE — temple server.
// Static temple in /public, shared ritual API under /api, every other path is a verse.
import express from 'express'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { streamHandler, online } from './sse.js'
import ritual from './routes/ritual.js'
import secrets from './routes/secrets.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')
const PORT = Number(process.env.PORT) || 3333

const app = express()
app.set('trust proxy', 'loopback')
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

app.use(express.static(pub, { extensions: ['html'], index: 'index.html' }))

// Every unknown path is a verse of the infinite scripture (the Babel face reads location.pathname).
app.get(/.*/, (req, res) => res.sendFile(resolve(pub, 'index.html')))

app.listen(PORT, () => {
  console.log(`THE CASCADE flows at http://localhost:${PORT}`)
})
