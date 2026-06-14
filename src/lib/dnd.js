// ---------------------------------------------------------------
// Pure D&D 5e rules helpers. No React, no Supabase — just math and
// reference data so the rest of the app can stay simple.
// ---------------------------------------------------------------

// The six core ability scores, in the canonical order.
export const ABILITIES = [
  { key: 'strength', label: 'STR' },
  { key: 'dexterity', label: 'DEX' },
  { key: 'constitution', label: 'CON' },
  { key: 'intelligence', label: 'INT' },
  { key: 'wisdom', label: 'WIS' },
  { key: 'charisma', label: 'CHA' },
]

// Ability modifier = floor((score - 10) / 2).  e.g. 16 -> +3, 8 -> -1
export function abilityModifier(score) {
  return Math.floor((Number(score) - 10) / 2)
}

// Format a modifier with an explicit sign, e.g. 3 -> "+3", -1 -> "-1".
export function formatModifier(mod) {
  return (mod >= 0 ? '+' : '') + mod
}

// Proficiency bonus scales with level (PHB table).
export function proficiencyBonus(level) {
  return Math.floor((Number(level) - 1) / 4) + 2
}

// The 18 skills and the ability each one uses.
export const SKILLS = [
  { key: 'acrobatics', label: 'Acrobatics', ability: 'dexterity' },
  { key: 'animal_handling', label: 'Animal Handling', ability: 'wisdom' },
  { key: 'arcana', label: 'Arcana', ability: 'intelligence' },
  { key: 'athletics', label: 'Athletics', ability: 'strength' },
  { key: 'deception', label: 'Deception', ability: 'charisma' },
  { key: 'history', label: 'History', ability: 'intelligence' },
  { key: 'insight', label: 'Insight', ability: 'wisdom' },
  { key: 'intimidation', label: 'Intimidation', ability: 'charisma' },
  { key: 'investigation', label: 'Investigation', ability: 'intelligence' },
  { key: 'medicine', label: 'Medicine', ability: 'wisdom' },
  { key: 'nature', label: 'Nature', ability: 'intelligence' },
  { key: 'perception', label: 'Perception', ability: 'wisdom' },
  { key: 'performance', label: 'Performance', ability: 'charisma' },
  { key: 'persuasion', label: 'Persuasion', ability: 'charisma' },
  { key: 'religion', label: 'Religion', ability: 'intelligence' },
  { key: 'sleight_of_hand', label: 'Sleight of Hand', ability: 'dexterity' },
  { key: 'stealth', label: 'Stealth', ability: 'dexterity' },
  { key: 'survival', label: 'Survival', ability: 'wisdom' },
]

// All the dice types we offer in the roller.
export const DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']

// Roll one die with the given number of sides (e.g. sidesFromType('d20') = 20).
export function sidesFromType(type) {
  return parseInt(String(type).replace('d', ''), 10) || 20
}

// Roll `count` dice of `type`, returning { rolls: [...], total }.
export function rollDice(type, count = 1) {
  const sides = sidesFromType(type)
  const rolls = []
  for (let i = 0; i < Math.max(1, count); i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1)
  }
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) }
}

// Clamp a number into a range — handy for HP edits.
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}
