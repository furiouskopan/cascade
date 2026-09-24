// The Witness. Watches how the visitor moves, rests, types and leaves, and reports it on the bus.
// Events: behavior:still {seconds}, behavior:stir, behavior:restless {level}, behavior:calm,
//         behavior:away, behavior:return {awayMs}, behavior:typed {buffer, key}, behavior:click {x, y}
import { bus } from './bus.js'

const STILL_MARKS = [7, 33, 108] // seconds; 108 is the count of a mala
const BUFFER_LEN = 48

export function startBehavior() {
  const state = {
    restlessness: 0, // 0..1, exponential moving average of pointer speed
    stillFor: 0, // seconds since last input
    awayCount: 0,
    clicks: 0,
    typed: '', // last BUFFER_LEN printable characters, lowercase
    pointer: { x: innerWidth / 2, y: innerHeight / 2 },
    lastInput: performance.now(),
  }

  let lastMove = null
  let marksHit = new Set()
  let restless = false
  let awayAt = 0

  function input() {
    const wasStill = state.stillFor >= STILL_MARKS[0]
    state.lastInput = performance.now()
    state.stillFor = 0
    marksHit = new Set()
    if (wasStill) bus.emit('behavior:stir')
  }

  addEventListener('pointermove', (e) => {
    const now = performance.now()
    if (lastMove) {
      const dt = Math.max(1, now - lastMove.t)
      const speed = Math.hypot(e.clientX - lastMove.x, e.clientY - lastMove.y) / dt // px per ms
      const level = Math.min(1, speed / 3)
      state.restlessness = state.restlessness * 0.96 + level * 0.04
    }
    lastMove = { x: e.clientX, y: e.clientY, t: now }
    state.pointer = { x: e.clientX, y: e.clientY }
    input()
  }, { passive: true })

  addEventListener('pointerdown', (e) => {
    state.clicks++
    input()
    bus.emit('behavior:click', { x: e.clientX, y: e.clientY })
  }, { passive: true })

  addEventListener('keydown', (e) => {
    input()
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      state.typed = (state.typed + e.key.toLowerCase()).slice(-BUFFER_LEN)
      bus.emit('behavior:typed', { buffer: state.typed, key: e.key })
    }
  })

  addEventListener('wheel', input, { passive: true })
  addEventListener('scroll', input, { passive: true })
  addEventListener('touchstart', input, { passive: true })

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      awayAt = Date.now()
      state.awayCount++
      bus.emit('behavior:away')
    } else if (awayAt) {
      bus.emit('behavior:return', { awayMs: Date.now() - awayAt })
      awayAt = 0
    }
  })

  setInterval(() => {
    if (document.hidden) return
    state.stillFor = (performance.now() - state.lastInput) / 1000
    for (const mark of STILL_MARKS) {
      if (state.stillFor >= mark && !marksHit.has(mark)) {
        marksHit.add(mark)
        bus.emit('behavior:still', { seconds: mark })
      }
    }
    // Restlessness decays while the pointer rests.
    if (state.stillFor > 1) state.restlessness *= 0.9
    if (!restless && state.restlessness > 0.35) {
      restless = true
      bus.emit('behavior:restless', { level: state.restlessness })
    } else if (restless && state.restlessness < 0.12) {
      restless = false
      bus.emit('behavior:calm')
    }
  }, 250)

  return state
}
