// ---------------------------------------------------------------
// SRD backgrounds. Skill keys match src/lib/dnd.js SKILLS.
//
// Each background:
//   key, name, skills[] (two granted), tools[], languages (count of free picks),
//   feature {name, desc}, equipment[], startingGold (gp)
// ---------------------------------------------------------------

export const BACKGROUNDS = [
  {
    key: 'acolyte',
    name: 'Acolyte',
    skills: ['insight', 'religion'],
    tools: [],
    languages: 2,
    feature: { name: 'Shelter of the Faithful', desc: 'You and companions can receive free healing and care at temples of your faith.' },
    equipment: ['Holy symbol', 'Prayer book', '5 sticks of incense', 'Vestments', 'Common clothes'],
    startingGold: 15,
  },
  {
    key: 'charlatan',
    name: 'Charlatan',
    skills: ['deception', 'sleight_of_hand'],
    tools: ['Disguise kit', 'Forgery kit'],
    languages: 0,
    feature: { name: 'False Identity', desc: 'You have a second identity and can forge documents.' },
    equipment: ['Fine clothes', 'Disguise kit', 'Tools of the con of your choice'],
    startingGold: 15,
  },
  {
    key: 'criminal',
    name: 'Criminal',
    skills: ['deception', 'stealth'],
    tools: ['One gaming set', "Thieves' tools"],
    languages: 0,
    feature: { name: 'Criminal Contact', desc: 'You have a reliable contact in the criminal underworld.' },
    equipment: ['Crowbar', 'Dark common clothes with hood'],
    startingGold: 15,
  },
  {
    key: 'entertainer',
    name: 'Entertainer',
    skills: ['acrobatics', 'performance'],
    tools: ['Disguise kit', 'One musical instrument'],
    languages: 0,
    feature: { name: 'By Popular Demand', desc: 'You can perform for food and lodging; locals know you.' },
    equipment: ['Musical instrument', 'Favor of an admirer', 'Costume'],
    startingGold: 15,
  },
  {
    key: 'folk-hero',
    name: 'Folk Hero',
    skills: ['animal_handling', 'survival'],
    tools: ["One type of artisan's tools", 'Vehicles (land)'],
    languages: 0,
    feature: { name: 'Rustic Hospitality', desc: 'Common folk shelter and hide you from the law.' },
    equipment: ["Artisan's tools", 'Shovel', 'Iron pot', 'Common clothes'],
    startingGold: 10,
  },
  {
    key: 'guild-artisan',
    name: 'Guild Artisan',
    skills: ['insight', 'persuasion'],
    tools: ["One type of artisan's tools"],
    languages: 1,
    feature: { name: 'Guild Membership', desc: 'Your guild offers lodging, aid, and political clout.' },
    equipment: ["Artisan's tools", 'Letter of introduction from your guild', "Traveler's clothes"],
    startingGold: 15,
  },
  {
    key: 'hermit',
    name: 'Hermit',
    skills: ['medicine', 'religion'],
    tools: ['Herbalism kit'],
    languages: 1,
    feature: { name: 'Discovery', desc: 'Your isolation gave you a unique and powerful discovery.' },
    equipment: ['Herbalism kit', 'Scroll case of notes', 'Winter blanket', 'Common clothes'],
    startingGold: 5,
  },
  {
    key: 'noble',
    name: 'Noble',
    skills: ['history', 'persuasion'],
    tools: ['One gaming set'],
    languages: 1,
    feature: { name: 'Position of Privilege', desc: 'People assume you have the right to be wherever you are.' },
    equipment: ['Fine clothes', 'Signet ring', 'Scroll of pedigree'],
    startingGold: 25,
  },
  {
    key: 'outlander',
    name: 'Outlander',
    skills: ['athletics', 'survival'],
    tools: ['One musical instrument'],
    languages: 1,
    feature: { name: 'Wanderer', desc: 'Excellent memory for geography; you can find food and water in the wild.' },
    equipment: ['Staff', 'Hunting trap', 'Trophy from a slain animal', "Traveler's clothes"],
    startingGold: 10,
  },
  {
    key: 'sage',
    name: 'Sage',
    skills: ['arcana', 'history'],
    tools: [],
    languages: 2,
    feature: { name: 'Researcher', desc: 'You know where and from whom to learn lore you lack.' },
    equipment: ['Bottle of ink', 'Quill', 'Small knife', 'Letter from a dead colleague', 'Common clothes'],
    startingGold: 10,
  },
  {
    key: 'sailor',
    name: 'Sailor',
    skills: ['athletics', 'perception'],
    tools: ["Navigator's tools", 'Vehicles (water)'],
    languages: 0,
    feature: { name: "Ship's Passage", desc: 'You can secure free passage on a sailing ship for you and companions.' },
    equipment: ['Belaying pin (club)', '50 ft of silk rope', 'Lucky charm', 'Common clothes'],
    startingGold: 10,
  },
  {
    key: 'soldier',
    name: 'Soldier',
    skills: ['athletics', 'intimidation'],
    tools: ['One gaming set', 'Vehicles (land)'],
    languages: 0,
    feature: { name: 'Military Rank', desc: 'Soldiers loyal to your former organization recognize your authority.' },
    equipment: ['Insignia of rank', 'Trophy from a fallen enemy', 'Deck of cards', 'Common clothes'],
    startingGold: 10,
  },
]

export const BACKGROUNDS_BY_KEY = Object.fromEntries(BACKGROUNDS.map((b) => [b.key, b]))

export function getBackground(key) {
  return BACKGROUNDS_BY_KEY[key] || null
}
