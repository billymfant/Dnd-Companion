// Curated preset portrait gallery. Uses DiceBear (deterministic SVG avatars by
// seed) so we ship a varied gallery without hosting image files. Players can
// also upload their own (see lib/avatars.js).
const dice = (style, seed) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`

export const PORTRAITS = [
  { key: 'warrior', label: 'Warrior', url: dice('adventurer', 'Thrain') },
  { key: 'knight', label: 'Knight', url: dice('adventurer', 'Gareth') },
  { key: 'ranger', label: 'Ranger', url: dice('adventurer', 'Sylvar') },
  { key: 'rogue', label: 'Rogue', url: dice('adventurer', 'Nyx') },
  { key: 'mage', label: 'Mage', url: dice('lorelei', 'Elwin') },
  { key: 'sorceress', label: 'Sorceress', url: dice('lorelei', 'Mira') },
  { key: 'cleric', label: 'Cleric', url: dice('lorelei', 'Aldara') },
  { key: 'druid', label: 'Druid', url: dice('adventurer', 'Faun') },
  { key: 'bard', label: 'Bard', url: dice('lorelei', 'Lyric') },
  { key: 'warlock', label: 'Warlock', url: dice('adventurer', 'Vael') },
  { key: 'monk', label: 'Monk', url: dice('adventurer', 'Kaito') },
  { key: 'barbarian', label: 'Barbarian', url: dice('adventurer', 'Grok') },
]
