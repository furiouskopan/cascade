// The Register of the Faithful: one SQLite file shared by every route module.
// Each route module creates its own tables with CREATE TABLE IF NOT EXISTS.
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const file = process.env.CASCADE_DB || resolve(root, 'data', 'cascade.db')
mkdirSync(dirname(file), { recursive: true })

export const db = new DatabaseSync(file)
db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;')

// Tiny key/value store for global counters and flags.
db.exec(`CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)`)
const getKv = db.prepare('SELECT v FROM kv WHERE k = ?')
const setKv = db.prepare('INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v')

export function kvGet(k, fallback = null) {
  const row = getKv.get(k)
  if (!row) return fallback
  try { return JSON.parse(row.v) } catch { return fallback }
}

export function kvSet(k, value) {
  setKv.run(k, JSON.stringify(value))
  return value
}
