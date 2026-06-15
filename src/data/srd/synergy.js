// Pure data: which abilities matter for each class, recommended races, and the
// suggested order to place high ability scores. Class/race/ability keys match
// src/data/srd/classes.js, races.js, and src/lib/dnd.js. (5e 2014.)
export const KEY_ABILITIES = {
  barbarian: ['strength', 'constitution'],
  bard: ['charisma', 'dexterity'],
  cleric: ['wisdom', 'constitution'],
  druid: ['wisdom', 'constitution'],
  fighter: ['strength', 'constitution'], // or dexterity for a finesse build
  monk: ['dexterity', 'wisdom'],
  paladin: ['strength', 'charisma'],
  ranger: ['dexterity', 'wisdom'],
  rogue: ['dexterity', 'intelligence'],
  sorcerer: ['charisma', 'constitution'],
  warlock: ['charisma', 'constitution'],
  wizard: ['intelligence', 'constitution'],
}

// Full suggested placement order (highest score first) per class.
export const ABILITY_PRIORITY = {
  barbarian: ['strength', 'constitution', 'dexterity', 'wisdom', 'charisma', 'intelligence'],
  bard: ['charisma', 'dexterity', 'constitution', 'wisdom', 'intelligence', 'strength'],
  cleric: ['wisdom', 'constitution', 'strength', 'dexterity', 'charisma', 'intelligence'],
  druid: ['wisdom', 'constitution', 'dexterity', 'intelligence', 'charisma', 'strength'],
  fighter: ['strength', 'constitution', 'dexterity', 'wisdom', 'charisma', 'intelligence'],
  monk: ['dexterity', 'wisdom', 'constitution', 'strength', 'intelligence', 'charisma'],
  paladin: ['strength', 'charisma', 'constitution', 'wisdom', 'dexterity', 'intelligence'],
  ranger: ['dexterity', 'wisdom', 'constitution', 'strength', 'intelligence', 'charisma'],
  rogue: ['dexterity', 'intelligence', 'constitution', 'wisdom', 'charisma', 'strength'],
  sorcerer: ['charisma', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'strength'],
  warlock: ['charisma', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'strength'],
  wizard: ['intelligence', 'constitution', 'dexterity', 'wisdom', 'charisma', 'strength'],
}
