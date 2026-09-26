#!/usr/bin/env node
// THE SEXTON. Reads and tidies what strangers left in the temple: the Wall, the Book of the Ascended and
// the Living Canon. Works on the same SQLite file as the server (CASCADE_DB, or data/cascade.db), and is
// safe to run while the server is up. Open temples keep showing a removed entry until they next load the
// state (reloading the page, or opening the altar a minute later).
//
//   node tools/moderate.mjs list [wall|book|canon] [--limit N]    newest first (default: all three, 20 each)
//   node tools/moderate.mjs delete wall|book|canon <id> [<id> ...]
//
// To refuse words before they are ever written, list them in data/refused-words.txt (server/refuse.js).
import { db } from '../server/db.js'

const TABLES = {
  wall: { table: 'ritual_wall', show: (r) => r.text },
  book: { table: 'ascended', show: (r) => r.name },
  canon: { table: 'ritual_offerings', show: (r) => `${r.selector} { ${r.property}: ${r.value}; }` },
}
db.exec(`
  CREATE TABLE IF NOT EXISTS ascended (id INTEGER PRIMARY KEY, name TEXT NOT NULL, at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS ascended_gilded (id INTEGER PRIMARY KEY);
  CREATE TABLE IF NOT EXISTS ritual_offerings (
    id INTEGER PRIMARY KEY, selector TEXT NOT NULL, property TEXT NOT NULL, value TEXT NOT NULL, at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ritual_wall (id INTEGER PRIMARY KEY, text TEXT NOT NULL, at INTEGER NOT NULL);
`)

const [cmd, which, ...rest] = process.argv.slice(2)
const usage = () => {
  console.log('usage: node tools/moderate.mjs list [wall|book|canon] [--limit N]')
  console.log('       node tools/moderate.mjs delete wall|book|canon <id> [<id> ...]')
  process.exit(1)
}

if (cmd === 'list') {
  const args = [which, ...rest].filter((a) => a !== undefined)
  const li = args.indexOf('--limit')
  const limit = li >= 0 ? Math.max(1, Number(args[li + 1]) || 20) : 20
  const kinds = args[0] && !args[0].startsWith('--') ? [args[0]] : Object.keys(TABLES)
  for (const kind of kinds) {
    const t = TABLES[kind]
    if (!t) usage()
    const rows = db.prepare(`SELECT * FROM ${t.table} ORDER BY id DESC LIMIT ?`).all(limit)
    console.log(`\n${kind} (${rows.length} shown, newest first)`)
    for (const r of rows) console.log(`  #${String(r.id).padEnd(6)} ${new Date(Number(r.at)).toISOString().slice(0, 16).replace('T', ' ')}  ${t.show(r)}`)
  }
} else if (cmd === 'delete') {
  const t = TABLES[which]
  const ids = rest.map(Number).filter((n) => Number.isSafeInteger(n) && n > 0)
  if (!t || !ids.length) usage()
  const del = db.prepare(`DELETE FROM ${t.table} WHERE id = ?`)
  let n = 0
  for (const id of ids) {
    n += Number(del.run(id).changes)
    if (which === 'book') db.prepare('DELETE FROM ascended_gilded WHERE id = ?').run(id)
  }
  console.log(`removed ${n} of ${ids.length} from ${which}`)
} else {
  usage()
}
