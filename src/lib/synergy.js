// Pure "smart hint" helpers for the creation wizard. No React, no network.
// Derives build guidance from the synergy data + each race's ability bonuses.
import { KEY_ABILITIES, ABILITY_PRIORITY } from '../data/srd/synergy.js'
import { getRace } from '../data/srd/index.js'

export function keyAbilitiesFor(classKey) {
  return KEY_ABILITIES[classKey] || []
}

export function suggestAbilityOrder(classKey) {
  return ABILITY_PRIORITY[classKey] || []
}

// Returns 'great' (race boosts the class's #1 ability), 'good' (boosts a
// secondary key ability), or null (no relevant boost). Includes subrace and
// any fixed choice the race grants, ignoring player-chosen flexible bonuses.
export function raceMatch(classKey, raceKey, subraceKey = null) {
  const keys = keyAbilitiesFor(classKey)
  if (!keys.length || !raceKey) return null
  const race = getRace(raceKey)
  if (!race) return null
  const bonuses = { ...(race.abilityBonuses || {}) }
  const sub = race.subraces?.find((s) => s.key === subraceKey)
  if (sub?.abilityBonuses) for (const [k, v] of Object.entries(sub.abilityBonuses)) bonuses[k] = (bonuses[k] || 0) + v
  if (bonuses[keys[0]]) return 'great'
  if (keys.slice(1).some((k) => bonuses[k])) return 'good'
  return null
}
