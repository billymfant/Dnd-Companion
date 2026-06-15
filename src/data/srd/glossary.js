// Plain-language explanations for total newcomers. Surfaced via <InfoTip> and
// <Primer> across the creation wizard. Edition-agnostic where possible (5e 2014).
//
// CONCEPTS[key]   = { term, short, detail, example? }
// ABILITY_INFO[k] = { short, detail, example? }   // k = ability key from dnd.js
// SKILL_INFO[k]   = { short, ability, example? }  // ability MUST match dnd.js SKILLS

export const CONCEPTS = {
  ability_score: {
    term: 'Ability Score',
    short: 'A number (usually 8–20) measuring one of your six core talents.',
    detail: 'The six scores — Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma — underpin almost every roll. Higher is better; 10 is average for an adult.',
    example: 'A barbarian wants a high Strength so their axe swings hit harder.',
  },
  armor_class: {
    term: 'Armor Class',
    short: 'How hard you are to hit — an attacker must roll this number or higher.',
    detail: 'Armor Class (AC) comes from your armor, shield, and Dexterity. When something attacks you, the attacker rolls a d20 + bonuses; if the total is below your AC, they miss.',
    example: 'In leather armor with 14 Dexterity your AC is 13, so attack rolls of 12 or less miss you.',
  },
  race: {
    term: 'Race',
    short: 'The fantasy species your character belongs to, which grants innate traits and bonuses.',
    detail: 'Your race gives you starting ability score bonuses, a movement speed, special traits (like Darkvision), and the languages you speak from birth. It is one of the first choices you make and shapes who your character is before any training.',
    example: 'A Dwarf starts with +2 Constitution and has Darkvision, so they can see in the dark.',
  },
  subrace: {
    term: 'Subrace',
    short: 'A more specific variety within a race that adds extra traits and a bonus.',
    detail: 'Many races split into two or three subraces — for example, Dwarves can be Hill Dwarves or Mountain Dwarves. Each subrace adds its own ability bonus and one or two extra traits on top of the base race.',
    example: 'A Hill Dwarf gains +1 Wisdom and extra hit points; a Mountain Dwarf gains +2 Strength and armor proficiency.',
  },
  class: {
    term: 'Class',
    short: 'Your character\'s profession and main source of combat abilities.',
    detail: 'Class determines what your character can do in combat and beyond — whether that\'s casting spells, sneaking in shadows, or charging into battle with a greataxe. It sets your hit die (health per level), proficiencies, and the special features you gain as you level up.',
    example: 'A Fighter learns weapon styles and can surge for an extra action; a Wizard learns spells from a book.',
  },
  subclass: {
    term: 'Subclass',
    short: 'A specialisation within your class that you choose around level 1–3.',
    detail: 'Every class eventually offers a subclass that focuses your powers in a particular direction. A Fighter might become a Champion (critical hits) or a Battlemaster (tactical manoeuvres). You choose your subclass after seeing how your base class plays.',
    example: 'A Wizard chooses an Arcane Tradition at level 2, such as Evocation (more explosive spells) or Abjuration (protective magic).',
  },
  alignment: {
    term: 'Alignment',
    short: 'A rough description of your character\'s moral compass and approach to rules.',
    detail: 'Alignment combines two axes: Law vs. Chaos (how much your character respects order and authority) and Good vs. Evil (how much they care about others\' wellbeing). Most player characters are Good or Neutral. Alignment is a guide for roleplaying, not a strict rulebook.',
    example: 'A paladin devoted to protecting the innocent might be Lawful Good; a self-serving rogue who avoids hurting people might be Chaotic Neutral.',
  },
  ability_modifier: {
    term: 'Ability Modifier',
    short: 'The bonus (or penalty) you add to dice rolls, derived from your ability score.',
    detail: 'Every ability score has a modifier: score 10–11 gives +0, 12–13 gives +1, 14–15 gives +2, and so on. The modifier is what actually gets added to your dice rolls — a score of 16 Strength means you add +3 to melee attacks and damage.',
    example: 'Strength 16 → modifier +3. Roll a d20 for an attack and add +3 to the result.',
  },
  proficiency: {
    term: 'Proficiency',
    short: 'Training in a weapon, skill, tool, or type of armor that lets you add your proficiency bonus.',
    detail: 'When you are proficient with something, you add your proficiency bonus to rolls involving it. Without proficiency you can still try, but you don\'t get that bonus. Your class, race, and background each grant proficiencies.',
    example: 'A Rogue is proficient with Stealth, so they add their proficiency bonus (+2 at level 1) to Stealth checks.',
  },
  proficiency_bonus: {
    term: 'Proficiency Bonus',
    short: 'A flat bonus added to anything you\'re proficient in; it grows as you level up.',
    detail: 'At level 1–4 your proficiency bonus is +2. It rises to +3 at level 5, +4 at level 9, and so on up to +6 at level 17. It applies to attack rolls with weapons you\'re trained in, skill checks you have proficiency in, and saving throws your class grants.',
    example: 'A level-1 character with +3 Strength modifier and Fighter (weapon proficiency) rolls an attack: d20 + 3 (STR) + 2 (proficiency) = d20 + 5.',
  },
  skill: {
    term: 'Skill',
    short: 'A specific trained activity — like Stealth or Persuasion — that you roll a d20 for.',
    detail: 'There are 18 skills, each tied to one ability score. When you attempt something tricky, the DM calls for a skill check: roll a d20, add the ability modifier, and add your proficiency bonus if you\'re proficient. Beat the difficulty (DC) and you succeed.',
    example: 'Sneaking past a guard is a Dexterity (Stealth) check. Roll d20 + DEX mod (+ proficiency if trained).',
  },
  saving_throw: {
    term: 'Saving Throw',
    short: 'A defensive roll to resist a harmful effect — a dragon\'s breath, a spell, or a trap.',
    detail: 'When danger forces a reaction from your body or mind, you make a saving throw: roll a d20 + the relevant ability modifier. Your class grants proficiency in two saving throws, which adds your proficiency bonus. Hit the required DC and you avoid or reduce the harm.',
    example: 'A fireball requires a Dexterity saving throw. On a success you take half damage; on a failure, full damage.',
  },
  hit_points: {
    term: 'Hit Points',
    short: 'Your character\'s health — when they reach 0, they fall unconscious.',
    detail: 'Hit Points (HP) represent how much punishment your character can take before going down. You gain HP at each level based on your class\'s hit die plus your Constitution modifier. Healing (spells, potions, rest) restores HP.',
    example: 'A level-1 Barbarian with Constitution 16 starts with 12 (max d12) + 3 (CON mod) = 15 HP.',
  },
  spell_slot: {
    term: 'Spell Slot',
    short: 'The limited daily fuel spellcasters spend to cast spells above cantrip level.',
    detail: 'Think of spell slots as battery charges. Casting a spell "spends" one slot of the appropriate level or higher. You recover all spell slots after a long rest (a full night\'s sleep). Warlocks are unusual — they regain slots on a short rest instead.',
    example: 'A level-1 Wizard has two 1st-level spell slots. They cast Magic Missile twice, then have no slots left until they rest.',
  },
  cantrip: {
    term: 'Cantrip',
    short: 'A simple spell you can cast as many times as you like — it never uses spell slots.',
    detail: 'Cantrips are the basic spells all casters know from memory. They do modest things — fire a bolt of energy, light a candle, clean your clothes — and they never run out. Think of them as your always-available magical toolkit.',
    example: 'Fire Bolt is a cantrip: you fling flame at an enemy for free, every turn, no slots needed.',
  },
  prepared_vs_known: {
    term: 'Prepared vs. Known Spells',
    short: 'Whether your spellcaster memorises spells fresh each day or learns a fixed list permanently.',
    detail: 'Some casters (Wizard, Cleric, Druid) can "prepare" a different set of spells each long rest from a larger list — flexible but requires planning. Others (Sorcerer, Bard, Warlock) "know" a fixed set of spells that never changes until they level up — simpler, but less flexible.',
    example: 'A Wizard knows 10 spells but can only prepare 5 each day. A Sorcerer permanently knows 4 spells at level 1 and picks new ones only when levelling up.',
  },
}

export const ABILITY_INFO = {
  strength: {
    short: 'Raw physical power — lifting, melee swings, and grappling.',
    detail: 'Strength drives melee attack and damage for most weapons, the Athletics skill, and how much you can carry.',
    example: 'Fighters and barbarians usually want high Strength.',
  },
  dexterity: {
    short: 'Agility and reflexes — aim, dodging, and stealth.',
    detail: 'Dexterity affects finesse and ranged attacks, your Armor Class in light armor, initiative (who acts first in combat), and the Stealth skill.',
    example: 'Rogues and rangers lean on Dexterity.',
  },
  constitution: {
    short: 'Toughness and stamina — more hit points and better concentration.',
    detail: 'Constitution determines your HP bonus at each level and your ability to maintain concentration spells when you take damage. Every character benefits from a decent Constitution.',
    example: 'A Constitution of 16 gives +3 HP per level — over 10 levels that\'s 30 extra hit points.',
  },
  intelligence: {
    short: 'Book-learning and reasoning — spells, knowledge skills, and investigation.',
    detail: 'Intelligence fuels Wizard spellcasting and governs skills like Arcana, History, Investigation, Nature, and Religion. High Intelligence lets you recall lore and solve puzzles.',
    example: 'Wizards need high Intelligence so their spells are harder to resist.',
  },
  wisdom: {
    short: 'Awareness and intuition — noticing danger, healing, and nature magic.',
    detail: 'Wisdom powers Cleric and Druid spellcasting and governs Perception (spotting threats), Insight (reading people), Survival, and Medicine. It also feeds into Passive Perception, your always-on alertness score.',
    example: 'A Cleric with Wisdom 16 has a spell save DC of 14, making their spells much harder to shrug off.',
  },
  charisma: {
    short: 'Force of personality — leading, persuading, deceiving, and social magic.',
    detail: 'Charisma drives Bard, Sorcerer, Warlock, and Paladin spellcasting, and governs Persuasion, Deception, Intimidation, and Performance. A high Charisma character is naturally compelling.',
    example: 'Bards and warlocks rely on Charisma to fuel their magic and talk their way out of trouble.',
  },
}

export const SKILL_INFO = {
  acrobatics: {
    short: 'Keeping your balance, tumbling, and pulling off agile manoeuvres.',
    ability: 'dexterity',
    example: 'Used to run across a slippery bridge or flip over an opponent.',
  },
  animal_handling: {
    short: 'Calming, controlling, and understanding animals.',
    ability: 'wisdom',
    example: 'Used to calm a spooked horse or command a trained war dog.',
  },
  arcana: {
    short: 'Knowing facts about magic, spells, and the arcane world.',
    ability: 'intelligence',
    example: 'Used to identify a magic circle or recall what creature a summoning spell might call.',
  },
  athletics: {
    short: 'Climbing, jumping, swimming, and grappling.',
    ability: 'strength',
    example: 'Used to break free of a grapple or scale a cliff wall.',
  },
  deception: {
    short: 'Convincingly lying, disguising yourself, or misdirecting others.',
    ability: 'charisma',
    example: 'Used to bluff your way past a checkpoint or maintain a disguise.',
  },
  history: {
    short: 'Recalling facts about past events, civilisations, and famous people.',
    ability: 'intelligence',
    example: 'Used to remember who built an ancient ruin or what started a war.',
  },
  insight: {
    short: 'Reading people — sensing motives, lies, and hidden emotions.',
    ability: 'wisdom',
    example: 'Used to tell whether a merchant is lying about the price of an item.',
  },
  intimidation: {
    short: 'Influencing others through threats, aggression, or a commanding presence.',
    ability: 'charisma',
    example: 'Used to frighten a bandit into surrendering without a fight.',
  },
  investigation: {
    short: 'Searching a scene for clues, hidden objects, or logical connections.',
    ability: 'intelligence',
    example: 'Used to find a hidden door or piece together what happened at a crime scene.',
  },
  medicine: {
    short: 'Diagnosing illness, stabilising the dying, and providing first aid.',
    ability: 'wisdom',
    example: 'Used to stabilise a dying ally or identify a rare disease.',
  },
  nature: {
    short: 'Knowing facts about plants, animals, weather, and the natural world.',
    ability: 'intelligence',
    example: 'Used to identify a poisonous plant or predict a coming storm.',
  },
  perception: {
    short: 'Noticing things with your senses — spotting danger, hearing whispers.',
    ability: 'wisdom',
    example: 'Used to spot an ambush or hear footsteps around a corner.',
  },
  performance: {
    short: 'Entertaining an audience through music, acting, dance, or storytelling.',
    ability: 'charisma',
    example: 'Used to earn coin at a tavern or impress a noble with a dramatic speech.',
  },
  persuasion: {
    short: 'Convincing others through honest argument, charm, or diplomacy.',
    ability: 'charisma',
    example: 'Used to negotiate a peace deal or talk your way into a restricted area.',
  },
  religion: {
    short: 'Knowing facts about gods, religious rites, cults, and the planes.',
    ability: 'intelligence',
    example: 'Used to identify a holy symbol or recall a deity\'s weaknesses.',
  },
  sleight_of_hand: {
    short: 'Picking pockets, planting items, and other nimble-fingered tricks.',
    ability: 'dexterity',
    example: 'Used to lift a key from a guard\'s belt or palm a coin mid-handshake.',
  },
  stealth: {
    short: 'Moving quietly and staying hidden from view.',
    ability: 'dexterity',
    example: 'Used to sneak past guards or shadow a target without being noticed.',
  },
  survival: {
    short: 'Tracking prey, foraging, navigating wilderness, and avoiding natural hazards.',
    ability: 'wisdom',
    example: 'Used to follow a trail through the forest or find food and water in the wild.',
  },
}

export const getConcept = (key) => CONCEPTS[key] || null
export const getAbilityInfo = (key) => ABILITY_INFO[key] || null
export const getSkillInfo = (key) => SKILL_INFO[key] || null
