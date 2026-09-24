#!/usr/bin/env node
// Closes the shared headless Chrome of tools/shoot.mjs after 5 minutes without a test run.
// Started detached by shoot.mjs with the Chrome pid; exits on its own when Chrome is gone.
import { statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const pid = Number(process.argv[2])
const HEARTBEAT = join(tmpdir(), 'cascade-witness', 'heartbeat')
const IDLE_MS = 5 * 60000

function alive() {
  try { process.kill(pid, 0); return true } catch (e) { return e.code === 'EPERM' }
}

setInterval(() => {
  if (!pid || !alive()) process.exit(0)
  let idle = Infinity
  try { idle = Date.now() - statSync(HEARTBEAT).mtimeMs } catch {}
  if (idle > IDLE_MS) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' })
    else try { process.kill(pid) } catch {}
    process.exit(0)
  }
}, 30000)
