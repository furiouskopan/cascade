// The Firmament. Moon, planetary hour and omens, computed locally from the clock.
// No location is requested: latitude is assumed temperate (45°N), which is close enough for liturgy.

const SYNODIC = 29.530588853
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)
const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']
const DAY_RULER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] // by getDay()
export const PLANET_GLYPH = { Saturn: '♄', Jupiter: '♃', Mars: '♂', Sun: '☉', Venus: '♀', Mercury: '☿', Moon: '☽' }
const MOON_NAMES = ['new', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full', 'waning gibbous', 'last quarter', 'waning crescent']

// Solar eclipses (UTC dates) through 2030, for the Eclipse omen.
const ECLIPSES = ['2026-02-17', '2026-08-12', '2027-02-06', '2027-08-02', '2028-01-26', '2028-07-22', '2029-01-14', '2029-06-12', '2029-07-11', '2029-12-05', '2030-06-01', '2030-11-25']

function dayOfYear(d) {
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
}

// Approximate local sunrise/sunset in fractional hours for latitude `lat`.
function sunTimes(d, lat = 45) {
  const decl = 23.44 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear(d) - 81))
  const r = Math.PI / 180
  const cosH = -Math.tan(lat * r) * Math.tan(decl * r)
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) / r / 15 // half day length, hours
  return { sunrise: 12 - H, sunset: 12 + H }
}

export function moonPhase(now) {
  const days = (now.getTime() - KNOWN_NEW_MOON) / 86400000
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC
  const phase = age / SYNODIC // 0 new, 0.5 full
  const name = MOON_NAMES[Math.round(phase * 8) % 8]
  return { phase, age, name, illumination: (1 - Math.cos(phase * 2 * Math.PI)) / 2 }
}

export function planetaryHour(now) {
  const { sunrise, sunset } = sunTimes(now)
  const h = now.getHours() + now.getMinutes() / 60
  let dayStart = new Date(now)
  let index
  if (h >= sunrise && h < sunset) {
    index = Math.floor((h - sunrise) / ((sunset - sunrise) / 12))
  } else {
    const nightLen = 24 - (sunset - sunrise)
    const sinceSunset = h >= sunset ? h - sunset : h + 24 - sunset
    index = 12 + Math.floor(sinceSunset / (nightLen / 12))
    if (h < sunrise) dayStart = new Date(now.getTime() - 86400000) // before dawn belongs to yesterday's ruler
  }
  const ruler = DAY_RULER[dayStart.getDay()]
  const start = CHALDEAN.indexOf(ruler)
  const planet = CHALDEAN[(start + index) % 7]
  return { planet, glyph: PLANET_GLYPH[planet], dayRuler: ruler, index, isNight: index >= 12 }
}

export function readSky(now = new Date()) {
  const moon = moonPhase(now)
  const ph = planetaryHour(now)
  const hh = now.getHours()
  const mm = now.getMinutes()
  const clock = `${hh}:${String(mm).padStart(2, '0')}`
  const doy = dayOfYear(now)
  const iso = now.toISOString().slice(0, 10)
  const omens = []
  if (hh === 3) omens.push('witching')
  if (hh === 0 && mm < 7) omens.push('midnight')
  // repdigit times: 1:11, 2:22, 3:33, 4:44, 5:55, 11:11, 22:22
  const digits = `${hh}${String(mm).padStart(2, '0')}`
  if (/^(\d)\1+$/.test(digits) && hh !== 0) omens.push('triple')
  if (mm === 33) omens.push('thirty-three')
  if (Math.abs(moon.phase - 0.5) < 0.034) omens.push('full-moon')
  if (moon.phase < 0.034 || moon.phase > 0.966) omens.push('new-moon')
  if ([79, 80, 171, 172, 265, 266, 355, 356].includes(doy)) omens.push('turning') // equinox/solstice, ±1 day
  if (now.getDay() === 5 && now.getDate() === 13) omens.push('friday-13')
  if (ECLIPSES.includes(iso)) omens.push('eclipse')
  if (ph.planet === 'Saturn') omens.push('saturn-hour')
  if (hh >= 22 || hh < 5) omens.push('night')
  return {
    now,
    hour: hh,
    minute: mm,
    clock,
    weekday: now.getDay(),
    moon,
    planetaryHour: ph,
    omens,
    has: (o) => omens.includes(o),
  }
}
