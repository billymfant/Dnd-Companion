// ---------------------------------------------------------------
// Level-based progression tables (PHB): spell slots, cantrips known,
// and Ability Score Improvement levels. Single-class only (v1).
// ---------------------------------------------------------------

// Full caster spell slots by character level. Index = level (1-20),
// value = [l1, l2, ... l9] counts.
const FULL = {
  1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2],
  6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2], 11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1], 14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1], 20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
}

// Half caster (Paladin, Ranger) — spellcasting begins at level 2.
const HALF = {
  1: [], 2: [2], 3: [3], 4: [3], 5: [4, 2], 6: [4, 2], 7: [4, 3], 8: [4, 3],
  9: [4, 3, 2], 10: [4, 3, 2], 11: [4, 3, 3], 12: [4, 3, 3],
  13: [4, 3, 3, 1], 14: [4, 3, 3, 1], 15: [4, 3, 3, 2], 16: [4, 3, 3, 2],
  17: [4, 3, 3, 3, 1], 18: [4, 3, 3, 3, 1], 19: [4, 3, 3, 3, 2], 20: [4, 3, 3, 3, 2],
}

// Warlock Pact Magic: { count, slotLevel } by level.
const PACT = {
  1: { count: 1, slotLevel: 1 }, 2: { count: 2, slotLevel: 1 },
  3: { count: 2, slotLevel: 2 }, 4: { count: 2, slotLevel: 2 },
  5: { count: 2, slotLevel: 3 }, 6: { count: 2, slotLevel: 3 },
  7: { count: 2, slotLevel: 4 }, 8: { count: 2, slotLevel: 4 },
  9: { count: 2, slotLevel: 5 }, 10: { count: 2, slotLevel: 5 },
  11: { count: 3, slotLevel: 5 }, 12: { count: 3, slotLevel: 5 },
  13: { count: 3, slotLevel: 5 }, 14: { count: 3, slotLevel: 5 },
  15: { count: 3, slotLevel: 5 }, 16: { count: 3, slotLevel: 5 },
  17: { count: 4, slotLevel: 5 }, 18: { count: 4, slotLevel: 5 },
  19: { count: 4, slotLevel: 5 }, 20: { count: 4, slotLevel: 5 },
}

// Turn a [l1,l2,...] array into a { '1': n, '2': n } map (skipping zeros).
function arrToSlotMap(arr) {
  const m = {}
  ;(arr || []).forEach((n, i) => { if (n > 0) m[i + 1] = n })
  return m
}

// Spell slot map for a caster type at a level.
export function spellSlotMap(casterType, level) {
  if (casterType === 'full') return arrToSlotMap(FULL[level])
  if (casterType === 'half') return arrToSlotMap(HALF[level])
  if (casterType === 'pact') {
    const p = PACT[level]
    return p ? { [p.slotLevel]: p.count } : {}
  }
  return {}
}

// Cantrips known by class & level (the six cantrip-using classes).
const CANTRIPS = {
  bard:     (l) => (l >= 10 ? 4 : l >= 4 ? 3 : 2),
  cleric:   (l) => (l >= 10 ? 5 : l >= 4 ? 4 : 3),
  druid:    (l) => (l >= 10 ? 4 : l >= 4 ? 3 : 2),
  sorcerer: (l) => (l >= 10 ? 6 : l >= 4 ? 5 : 4),
  warlock:  (l) => (l >= 10 ? 4 : l >= 4 ? 3 : 2),
  wizard:   (l) => (l >= 10 ? 5 : l >= 4 ? 4 : 3),
}

export function cantripsKnown(classKey, level) {
  return CANTRIPS[classKey] ? CANTRIPS[classKey](level) : 0
}

// Spells known for "known" casters (Bard, Sorcerer, Ranger, Warlock).
const SPELLS_KNOWN = {
  bard:     [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  sorcerer: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  warlock:  [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  ranger:   [0, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
}

export function spellsKnown(classKey, level) {
  const t = SPELLS_KNOWN[classKey]
  return t ? t[level] || 0 : 0
}

// Ability Score Improvement levels. Fighter & Rogue get extra ones.
export function asiLevels(classKey) {
  if (classKey === 'fighter') return [4, 6, 8, 12, 14, 16, 19]
  if (classKey === 'rogue') return [4, 8, 10, 12, 16, 19]
  return [4, 8, 12, 16, 19]
}

export function isAsiLevel(classKey, level) {
  return asiLevels(classKey).includes(level)
}
