// The Refusal: words the temple will not show to strangers, on the Wall or in the Book of the Ascended.
// The list is kept out of the repo, one word per line (lines starting with # are notes), in
// refused-words.txt beside the database (data/ by default), or wherever CASCADE_REFUSED points. Missing or
// empty: nothing is refused. The file is read again whenever it changes, so no restart is needed.
// Whole words only, ignoring case, so a refused word never condemns an innocent longer one.
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { dataDir } from './db.js'

const FILE = process.env.CASCADE_REFUSED || resolve(dataDir, 'refused-words.txt')
let words = new Set()
let stamp = null

function load() {
  let mtime = 0
  try { mtime = statSync(FILE).mtimeMs } catch {}
  if (mtime === stamp) return words
  stamp = mtime
  let text = ''
  try { text = mtime ? readFileSync(FILE, 'utf8') : '' } catch {}
  words = new Set(text.split(/\r?\n/).map((l) => l.trim().toLowerCase()).filter((l) => l && !l.startsWith('#')))
  return words
}

export function refused(text) {
  const list = load()
  if (!list.size) return false
  const spoken = String(text ?? '').toLowerCase().split(/[^a-z']+/).map((w) => w.replace(/^'+|'+$/g, '')).filter(Boolean)
  if (spoken.some((w) => list.has(w))) return true
  // A refused phrase (a line with spaces) is matched as whole words in a row.
  const line = ` ${spoken.join(' ')} `
  for (const entry of list) if (entry.includes(' ') && line.includes(` ${entry.split(/\s+/).join(' ')} `)) return true
  return false
}
