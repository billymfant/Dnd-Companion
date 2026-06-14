// ---------------------------------------------------------------
// Spellcasting profiles + builders. Slot counts, cantrips, and spells-known
// scale by level via progression.js, so this supports both creation (level 1)
// and the level-up wizard (2–20).
//   prepType: 'known' | 'prepared' | 'spellbook'
//   casterType: 'full' | 'half' | 'pact'
// ---------------------------------------------------------------
import { abilityModifier, proficiencyBonus } from '../../lib/dnd.js'
import { spellSlotMap, cantripsKnown, spellsKnown } from './progression.js'

export const SPELLCASTING = {
  bard:     { ability: 'charisma',     prepType: 'known',    casterType: 'full' },
  cleric:   { ability: 'wisdom',       prepType: 'prepared', casterType: 'full' },
  druid:    { ability: 'wisdom',       prepType: 'prepared', casterType: 'full' },
  sorcerer: { ability: 'charisma',     prepType: 'known',    casterType: 'full' },
  warlock:  { ability: 'charisma',     prepType: 'known',    casterType: 'pact', pact: true },
  wizard:   { ability: 'intelligence', prepType: 'spellbook', casterType: 'full' },
  paladin:  { ability: 'charisma',     prepType: 'prepared', casterType: 'half' },
  ranger:   { ability: 'wisdom',       prepType: 'known',    casterType: 'half' },
}

// Does this class cast at the given level? Half casters start at level 2.
export function castsByLevel(classKey, level) {
  const cfg = SPELLCASTING[classKey]
  if (!cfg) return false
  return cfg.casterType === 'half' ? level >= 2 : level >= 1
}

// Convenience: casts at level 1 (used to gate the creation Spells step).
export function castsAtLevel1(classKey) {
  return castsByLevel(classKey, 1)
}

// How many cantrips this class knows at a level.
export function cantripCount(classKey, level) {
  return cantripsKnown(classKey, level)
}

// How many leveled spells to select at a level.
//   known     -> spellsKnown table
//   spellbook -> 6 + 2 per level after 1 (wizard adds 2 to spellbook each level)
//   prepared  -> ability mod + caster level (half casters use level/2), min 1
export function spellsToChoose(classKey, level, abilityScore) {
  const cfg = SPELLCASTING[classKey]
  if (!cfg || !castsByLevel(classKey, level)) return 0
  if (cfg.prepType === 'known') return spellsKnown(classKey, level)
  if (cfg.prepType === 'spellbook') return 6 + Math.max(0, level - 1) * 2
  const effLevel = cfg.casterType === 'half' ? Math.floor(level / 2) : level
  return Math.max(1, abilityModifier(abilityScore) + effLevel)
}

// Back-compat alias used by the creation wizard (always level 1).
export function levelOneSpellPicks(classKey, abilityScore, level = 1) {
  return spellsToChoose(classKey, level, abilityScore)
}

// Build the canonical sheet.spellcasting object from the player's picks.
export function buildSpellcasting(classKey, level, abilityScore, picks) {
  const cfg = SPELLCASTING[classKey]
  if (!cfg || !castsByLevel(classKey, level)) return null
  const mod = abilityModifier(abilityScore)
  const spells = picks?.spells || []
  const slotMap = spellSlotMap(cfg.casterType, level)
  const slots = {}
  for (const [lvl, total] of Object.entries(slotMap)) slots[lvl] = { total, used: 0 }
  return {
    ability: cfg.ability,
    prepType: cfg.prepType,
    pact: Boolean(cfg.pact),
    dc: 8 + proficiencyBonus(level) + mod,
    attack: proficiencyBonus(level) + mod,
    cantrips: picks?.cantrips || [],
    known: cfg.prepType === 'prepared' ? [] : spells,
    prepared: spells,
    slots,
  }
}
