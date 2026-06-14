// ---------------------------------------------------------------
// Subclasses per class, with the level at which the class chooses one.
// Cleric / Sorcerer / Warlock choose at level 1 (shown during creation);
// the rest choose at level 2–3 (handled by the level-up wizard, S4).
// Options are name + blurb; detailed subclass features are layered in later.
// ---------------------------------------------------------------

export const SUBCLASSES = {
  barbarian: {
    level: 3,
    label: 'Primal Path',
    options: [
      { key: 'berserker', name: 'Path of the Berserker', desc: 'Frenzied, relentless melee fury.' },
      { key: 'totem-warrior', name: 'Path of the Totem Warrior', desc: 'Spirit animal blessings.' },
    ],
  },
  bard: {
    level: 3,
    label: 'Bard College',
    options: [
      { key: 'lore', name: 'College of Lore', desc: 'Cutting words and broad knowledge.' },
      { key: 'valor', name: 'College of Valor', desc: 'Inspiring warrior-skald.' },
    ],
  },
  cleric: {
    level: 1,
    label: 'Divine Domain',
    options: [
      { key: 'life', name: 'Life Domain', desc: 'Master of healing; heavy armor.' },
      { key: 'light', name: 'Light Domain', desc: 'Radiant fire and warding flare.' },
      { key: 'war', name: 'War Domain', desc: 'Martial might and divine strikes.' },
      { key: 'trickery', name: 'Trickery Domain', desc: 'Illusions, charm, and stealth.' },
      { key: 'knowledge', name: 'Knowledge Domain', desc: 'Lore, languages, and insight.' },
      { key: 'nature', name: 'Nature Domain', desc: 'Druidic blessings and armor.' },
      { key: 'tempest', name: 'Tempest Domain', desc: 'Thunder, lightning, and storms.' },
    ],
  },
  druid: {
    level: 2,
    label: 'Druid Circle',
    options: [
      { key: 'land', name: 'Circle of the Land', desc: 'Bonus spells from your terrain.' },
      { key: 'moon', name: 'Circle of the Moon', desc: 'Powerful Wild Shape combat.' },
    ],
  },
  fighter: {
    level: 3,
    label: 'Martial Archetype',
    options: [
      { key: 'champion', name: 'Champion', desc: 'Improved crits and athletics.' },
      { key: 'battle-master', name: 'Battle Master', desc: 'Combat maneuvers and tactics.' },
      { key: 'eldritch-knight', name: 'Eldritch Knight', desc: 'Martial prowess with wizardry.' },
    ],
  },
  monk: {
    level: 3,
    label: 'Monastic Tradition',
    options: [
      { key: 'open-hand', name: 'Way of the Open Hand', desc: 'Master of unarmed technique.' },
      { key: 'shadow', name: 'Way of Shadow', desc: 'Ninja-like stealth and ki magic.' },
    ],
  },
  paladin: {
    level: 3,
    label: 'Sacred Oath',
    options: [
      { key: 'devotion', name: 'Oath of Devotion', desc: 'The paragon of holy virtue.' },
      { key: 'ancients', name: 'Oath of the Ancients', desc: 'Guardian of light and life.' },
      { key: 'vengeance', name: 'Oath of Vengeance', desc: 'Relentless hunter of evil.' },
    ],
  },
  ranger: {
    level: 3,
    label: 'Ranger Archetype',
    options: [
      { key: 'hunter', name: 'Hunter', desc: 'Specialized monster-slayer.' },
      { key: 'beast-master', name: 'Beast Master', desc: 'Bonded animal companion.' },
    ],
  },
  rogue: {
    level: 3,
    label: 'Roguish Archetype',
    options: [
      { key: 'thief', name: 'Thief', desc: 'Fast hands and second-story work.' },
      { key: 'assassin', name: 'Assassin', desc: 'Deadly ambusher and infiltrator.' },
      { key: 'arcane-trickster', name: 'Arcane Trickster', desc: 'Roguish spellcaster.' },
    ],
  },
  sorcerer: {
    level: 1,
    label: 'Sorcerous Origin',
    options: [
      { key: 'draconic', name: 'Draconic Bloodline', desc: 'Draconic resilience and power.' },
      { key: 'wild-magic', name: 'Wild Magic', desc: 'Chaotic, unpredictable surges.' },
    ],
  },
  warlock: {
    level: 1,
    label: 'Otherworldly Patron',
    options: [
      { key: 'fiend', name: 'The Fiend', desc: 'A power from the Lower Planes.' },
      { key: 'archfey', name: 'The Archfey', desc: 'A lord or lady of the Feywild.' },
      { key: 'great-old-one', name: 'The Great Old One', desc: 'An alien, unknowable mind.' },
    ],
  },
  wizard: {
    level: 2,
    label: 'Arcane Tradition',
    options: [
      { key: 'evocation', name: 'School of Evocation', desc: 'Sculpt powerful elemental magic.' },
      { key: 'abjuration', name: 'School of Abjuration', desc: 'Wards and protective magic.' },
      { key: 'divination', name: 'School of Divination', desc: 'See and shape fate itself.' },
    ],
  },
}

export function getSubclassInfo(classKey) {
  return SUBCLASSES[classKey] || null
}

export function getSubclassOption(classKey, subclassKey) {
  return getSubclassInfo(classKey)?.options.find((o) => o.key === subclassKey) || null
}
