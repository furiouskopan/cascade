#!/usr/bin/env node
// Writes docs/HINTS.md from public/js/lib/hints.js, so the hints in the temple and the hints in the repo are
// one text. Hints are public by design (docs/ROADMAP.md §2); they never say a Word.
//
//   node tools/build-hints.mjs            rewrite docs/HINTS.md
//   node tools/build-hints.mjs --check    exit 1 if docs/HINTS.md is out of date
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHAINS, RIDDLES } from '../public/js/lib/hints.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'docs', 'HINTS.md')
const LEVEL = ['A nudge', 'A clue', 'Nearly the answer']

let md = `# THE CASCADE: hints

Stuck? Every step has three hints, each stronger than the last. Read one, go back to the temple, and only read the
next if you need it. The same hints live in the temple itself: type \`cascade.hint()\` in the browser's developer
console (F12), or open the altar (the round button in the bottom-right corner) and choose *ask for a hint*. On a face with a riddle of its own, the hints are about that riddle first.

The hints never say a Word; you still find each one yourself.

*This file is written from \`public/js/lib/hints.js\` by \`node tools/build-hints.mjs\`. Edit the source, not this file.*
`
for (const chain of CHAINS) {
  md += `\n## ${chain.title}\n\n${chain.blurb}\n`
  for (const step of chain.steps) {
    md += `\n### ${step.title}\n\n`
    step.hints.forEach((text, i) => {
      md += `<details>\n<summary>${LEVEL[i] ?? `Hint ${i + 1}`}</summary>\n\n${text}\n\n</details>\n\n`
    })
  }
}
const riddles = Object.values(RIDDLES)
if (riddles.length) {
  md += `\n## The faces' riddles\n\nSome faces keep a riddle of their own, solved on that face in one visit. While you are on such a face and its riddle is unsolved, the temple's hints are about that riddle first.\n`
  for (const r of riddles) {
    md += `\n### ${r.title}\n\n${r.where ? `${r.where}\n\n` : ''}`
    r.hints.forEach((text, i) => {
      md += `<details>\n<summary>${LEVEL[i] ?? `Hint ${i + 1}`}</summary>\n\n${text}\n\n</details>\n\n`
    })
  }
}
md = md.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'

if (process.argv.includes('--check')) {
  let have = ''
  try { have = readFileSync(out, 'utf8') } catch {}
  if (have.replace(/\r\n/g, '\n') !== md) {
    console.error('docs/HINTS.md is out of date: run node tools/build-hints.mjs')
    process.exit(1)
  }
  console.log('docs/HINTS.md is up to date')
} else {
  writeFileSync(out, md)
  console.log(`wrote ${out}`)
}
