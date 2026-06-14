// ---------------------------------------------------------------
// SRD races (+ common subraces). Ability keys match src/lib/dnd.js
// (strength, dexterity, constitution, intelligence, wisdom, charisma).
//
// Each race:
//   key, name, abilityBonuses {ability:+n}, speed, size, languages[],
//   traits [{name, desc}], proficiencies { skills[], weapons[], armor[], tools[] },
//   choiceBonuses? { count, amount, exclude[] }   // e.g. Half-Elf's +1/+1
//   subraces [ same shape, merged onto the base race ]
// The rules engine (src/lib/rules.js) merges base + subrace.
// ---------------------------------------------------------------

export const RACES = [
  {
    key: 'dwarf',
    name: 'Dwarf',
    abilityBonuses: { constitution: 2 },
    speed: 25,
    size: 'Medium',
    languages: ['Common', 'Dwarvish'],
    proficiencies: {
      weapons: ['Battleaxe', 'Handaxe', 'Light hammer', 'Warhammer'],
      tools: ["Smith's tools (choose one artisan tool)"],
    },
    traits: [
      { name: 'Darkvision', desc: 'See in dim light within 60 ft as if bright, and darkness as dim.' },
      { name: 'Dwarven Resilience', desc: 'Advantage on saves vs. poison; resistance to poison damage.' },
      { name: 'Stonecunning', desc: 'Add double proficiency to History checks about stonework.' },
    ],
    subraces: [
      {
        key: 'hill-dwarf',
        name: 'Hill Dwarf',
        abilityBonuses: { wisdom: 1 },
        traits: [{ name: 'Dwarven Toughness', desc: 'Your hit point maximum increases by 1 per level.' }],
        hpPerLevel: 1,
      },
      {
        key: 'mountain-dwarf',
        name: 'Mountain Dwarf',
        abilityBonuses: { strength: 2 },
        proficiencies: { armor: ['Light armor', 'Medium armor'] },
        traits: [{ name: 'Dwarven Armor Training', desc: 'Proficiency with light and medium armor.' }],
      },
    ],
  },
  {
    key: 'elf',
    name: 'Elf',
    abilityBonuses: { dexterity: 2 },
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Elvish'],
    proficiencies: { skills: ['perception'] },
    traits: [
      { name: 'Darkvision', desc: 'See in dim light within 60 ft.' },
      { name: 'Keen Senses', desc: 'Proficiency in the Perception skill.' },
      { name: 'Fey Ancestry', desc: 'Advantage vs. charmed; magic can’t put you to sleep.' },
      { name: 'Trance', desc: 'Meditate 4 hours instead of sleeping 8.' },
    ],
    subraces: [
      {
        key: 'high-elf',
        name: 'High Elf',
        abilityBonuses: { intelligence: 1 },
        languages: ['(one extra of your choice)'],
        proficiencies: { weapons: ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'] },
        traits: [{ name: 'Cantrip', desc: 'Know one wizard cantrip (Intelligence).' }],
      },
      {
        key: 'wood-elf',
        name: 'Wood Elf',
        abilityBonuses: { wisdom: 1 },
        speed: 35,
        proficiencies: { weapons: ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'] },
        traits: [
          { name: 'Fleet of Foot', desc: 'Base walking speed 35 ft.' },
          { name: 'Mask of the Wild', desc: 'Hide when lightly obscured by nature.' },
        ],
      },
    ],
  },
  {
    key: 'halfling',
    name: 'Halfling',
    abilityBonuses: { dexterity: 2 },
    speed: 25,
    size: 'Small',
    languages: ['Common', 'Halfling'],
    traits: [
      { name: 'Lucky', desc: 'Reroll a 1 on attack, ability check, or save (use the new roll).' },
      { name: 'Brave', desc: 'Advantage on saves vs. being frightened.' },
      { name: 'Halfling Nimbleness', desc: 'Move through the space of larger creatures.' },
    ],
    subraces: [
      {
        key: 'lightfoot',
        name: 'Lightfoot',
        abilityBonuses: { charisma: 1 },
        traits: [{ name: 'Naturally Stealthy', desc: 'Hide behind a creature one size larger.' }],
      },
      {
        key: 'stout',
        name: 'Stout',
        abilityBonuses: { constitution: 1 },
        traits: [{ name: 'Stout Resilience', desc: 'Advantage vs. poison; resistance to poison damage.' }],
      },
    ],
  },
  {
    key: 'human',
    name: 'Human',
    abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    speed: 30,
    size: 'Medium',
    languages: ['Common', '(one extra of your choice)'],
    traits: [{ name: 'Versatile', desc: '+1 to every ability score.' }],
    subraces: [],
  },
  {
    key: 'dragonborn',
    name: 'Dragonborn',
    abilityBonuses: { strength: 2, charisma: 1 },
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Draconic'],
    traits: [
      { name: 'Draconic Ancestry', desc: 'Choose a dragon type; sets your breath weapon & resistance.' },
      { name: 'Breath Weapon', desc: 'Exhale destructive energy (DEX or CON save).' },
      { name: 'Damage Resistance', desc: 'Resistance to your ancestry’s damage type.' },
    ],
    subraces: [],
  },
  {
    key: 'gnome',
    name: 'Gnome',
    abilityBonuses: { intelligence: 2 },
    speed: 25,
    size: 'Small',
    languages: ['Common', 'Gnomish'],
    traits: [
      { name: 'Darkvision', desc: 'See in dim light within 60 ft.' },
      { name: 'Gnome Cunning', desc: 'Advantage on INT, WIS, CHA saves vs. magic.' },
    ],
    subraces: [
      {
        key: 'forest-gnome',
        name: 'Forest Gnome',
        abilityBonuses: { dexterity: 1 },
        traits: [
          { name: 'Natural Illusionist', desc: 'Know the Minor Illusion cantrip (Intelligence).' },
          { name: 'Speak with Small Beasts', desc: 'Communicate simple ideas to Small or smaller beasts.' },
        ],
      },
      {
        key: 'rock-gnome',
        name: 'Rock Gnome',
        abilityBonuses: { constitution: 1 },
        proficiencies: { tools: ["Tinker's tools"] },
        traits: [
          { name: "Artificer's Lore", desc: 'Add double proficiency to History about magic/tech items.' },
          { name: 'Tinker', desc: 'Construct tiny clockwork devices.' },
        ],
      },
    ],
  },
  {
    key: 'half-elf',
    name: 'Half-Elf',
    abilityBonuses: { charisma: 2 },
    choiceBonuses: { count: 2, amount: 1, exclude: ['charisma'] },
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Elvish', '(one extra of your choice)'],
    skillChoices: { count: 2 }, // Skill Versatility: any two skills
    traits: [
      { name: 'Darkvision', desc: 'See in dim light within 60 ft.' },
      { name: 'Fey Ancestry', desc: 'Advantage vs. charmed; magic can’t put you to sleep.' },
      { name: 'Skill Versatility', desc: 'Proficiency in two skills of your choice.' },
    ],
    subraces: [],
  },
  {
    key: 'half-orc',
    name: 'Half-Orc',
    abilityBonuses: { strength: 2, constitution: 1 },
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Orc'],
    proficiencies: { skills: ['intimidation'] },
    traits: [
      { name: 'Darkvision', desc: 'See in dim light within 60 ft.' },
      { name: 'Menacing', desc: 'Proficiency in the Intimidation skill.' },
      { name: 'Relentless Endurance', desc: 'Drop to 1 HP instead of 0 once per long rest.' },
      { name: 'Savage Attacks', desc: 'Roll one extra weapon damage die on a melee crit.' },
    ],
    subraces: [],
  },
  {
    key: 'tiefling',
    name: 'Tiefling',
    abilityBonuses: { intelligence: 1, charisma: 2 },
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Infernal'],
    traits: [
      { name: 'Darkvision', desc: 'See in dim light within 60 ft.' },
      { name: 'Hellish Resistance', desc: 'Resistance to fire damage.' },
      { name: 'Infernal Legacy', desc: 'Know Thaumaturgy; gain spells at higher levels (Charisma).' },
    ],
    subraces: [],
  },
]

export const RACES_BY_KEY = Object.fromEntries(RACES.map((r) => [r.key, r]))

export function getRace(key) {
  return RACES_BY_KEY[key] || null
}

export function getSubrace(raceKey, subraceKey) {
  const race = getRace(raceKey)
  if (!race) return null
  return race.subraces?.find((s) => s.key === subraceKey) || null
}
