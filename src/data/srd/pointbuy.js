// ---------------------------------------------------------------
// Ability-score generation reference data (PHB).
//   - Point Buy: 27 points, scores 8–15 before racial bonuses.
//   - Standard Array: a fixed set the player assigns to abilities.
//   - Roll: 4d6 drop lowest, six times.
// Pure data + tiny helpers; no React, no Supabase.
// ---------------------------------------------------------------

// Point-buy cost of each purchasable score (PHB p.13).
export const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }

export const POINT_BUY_BUDGET = 27
export const POINT_BUY_MIN = 8
export const POINT_BUY_MAX = 15

// The standard array, highest first.
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

// Total point-buy cost of a {str,dex,...} score map. Unknown scores cost 0.
export function pointBuyCost(scores) {
  return Object.values(scores || {}).reduce(
    (sum, v) => sum + (POINT_BUY_COST[v] ?? 0),
    0
  )
}

// Points still available given a score map.
export function pointBuyRemaining(scores) {
  return POINT_BUY_BUDGET - pointBuyCost(scores)
}

// Is a score map a legal point-buy spread (within range and budget)?
export function isValidPointBuy(scores) {
  const vals = Object.values(scores || {})
  if (vals.length !== 6) return false
  if (vals.some((v) => v < POINT_BUY_MIN || v > POINT_BUY_MAX)) return false
  return pointBuyCost(scores) <= POINT_BUY_BUDGET
}

// Roll 4d6, drop the lowest die. Returns { total, dice }.
export function roll4d6DropLowest() {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
  const total = dice
    .slice()
    .sort((a, b) => a - b)
    .slice(1)
    .reduce((a, b) => a + b, 0)
  return { total, dice }
}

// Roll a full set of six ability scores (4d6 drop lowest each), high to low.
export function rollAbilitySet() {
  return Array.from({ length: 6 }, () => roll4d6DropLowest().total).sort(
    (a, b) => b - a
  )
}
