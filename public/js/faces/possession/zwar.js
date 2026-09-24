// POSSESSION / THE Z-WAR. Two invisible hands climb the Ladder (z-index) over the pricing cards,
// each typing a higher rung than the other. At the Highest Heaven they tie, and source order judges.
// Then Pride overflows: 2147483648 is clamped, and the loser Falls. It always climbs again.
// The war is fought inside a Sphere (.plans { isolation: isolate }), so it can never rise above the
// mercy button or the altar, however high it climbs.
// When the demon is settling (a visitor arrived holding Mercy) the war is found already fought: both
// rules written at once, Pride fallen, and the next climb waits until mercy lets go.

const HEAVEN = 2147483647
const RUNGS = [3, 5, 7, 12, 16, 33, 96, 108, 404, 1996, 9999, 99999, 1000000, 2147483646]

export async function zwar({ demon, life, rng, refs, dt, effects }) {
  const pro = refs.planPro
  const ent = refs.planEnt
  const badge = (card) => card.querySelector('.zval')
  const settled = demon.settling
  const handA = demon.makeHand('the one on the left')
  const handB = demon.makeHand('the one on the right')
  if (settled) handA.instant = handB.instant = true

  refs.plans.classList.add('at-war')
  dt.log('info', 'Two stacking orders are fighting inside .plans. It is a Sphere; they cannot climb out of it.')

  const first = settled ? [String(-HEAVEN - 1), String(HEAVEN)] : ['1', '2']
  const ruleA = await demon.writeRule({ sel: '.plan--pro', target: 'planPro', decls: [{ prop: 'z-index', value: first[0] }] }, handA)
  badge(pro).textContent = first[0]
  const ruleB = await demon.writeRule({ sel: '.plan--ent', target: 'planEnt', decls: [{ prop: 'z-index', value: first[1] }] }, handB)
  badge(ent).textContent = first[1]
  const A = { card: pro, decl: ruleA.decls[0], hand: handA, name: 'Professional' }
  const B = { card: ent, decl: ruleB.decls[0], hand: handB, name: 'Enterprise' }
  if (!A.decl || !B.decl) return
  // From here on every rung is typed by hand, whatever the start was.
  handA.instant = handB.instant = false

  const set = async (side, value) => {
    await demon.editValue(side.decl, String(value), side.hand)
    badge(side.card).textContent = String(value)
    refs.plans.dataset.top = side === A ? 'pro' : 'ent'
  }

  // The Fall, and the long wait before Pride climbs again.
  const fallen = async (proud) => {
    proud.card.classList.add('fallen')
    await life.wait(rng.int(30000, 55000))
    if (life.dead) return false
    dt.log('demon', 'it is climbing again. they always climb again.')
    proud.card.classList.remove('fallen')
    await set(proud, 0)
    await set(B, 1)
    await life.wait(rng.int(4000, 9000))
    return !life.dead
  }

  if (settled) {
    refs.plans.dataset.top = 'ent'
    dt.log('error', `The Fall: ${A.name} overflowed and wrapped around to ${-HEAVEN - 1}. It fell exactly as far as it had climbed.`)
    if (!(await fallen(A))) return
  }

  let round = 0
  while (!life.dead) {
    round++
    // Each round climbs a different, seeded stretch of the Ladder.
    const rungs = RUNGS.filter((r) => rng.chance(round === 1 ? 0.55 : 0.4))
    let turn = rng.chance(0.5) ? A : B
    for (const r of rungs) {
      if (life.dead) return
      const other = turn === A ? B : A
      if (Number(other.decl.value) >= r) continue
      await set(turn, r)
      await life.wait(rng.int(2000, 3600))
      turn = other
    }
    // The Highest Heaven: both arrive; the later sibling wins the tie.
    await set(A, HEAVEN)
    await life.wait(2200)
    await set(B, HEAVEN)
    dt.log('info', `Both at ${HEAVEN}, the Highest Heaven. A tie is judged by source order: the later sibling paints on top.`)
    await life.wait(3200)
    // Pride.
    const proud = A
    await set(proud, HEAVEN + 1)
    dt.log('warn', `z-index: ${HEAVEN + 1} is beyond the Highest Heaven. It was clamped. Pride always is.`, 'possessed.css:2147483648')
    await life.wait(2600)
    await set(proud, -HEAVEN - 1)
    dt.log('error', `The Fall: ${proud.name} overflowed and wrapped around to ${-HEAVEN - 1}. It fell exactly as far as it had climbed.`)
    effects('fall')
    if (!(await fallen(proud))) return
  }
}
