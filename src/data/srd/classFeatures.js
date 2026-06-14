// ---------------------------------------------------------------
// Principal class features by level (PHB). Concise — the iconic features
// players gain each level. "Ability Score Improvement" levels are handled
// by the engine (progression.asiLevels), not listed here. Subclass features
// are added separately by deriveSheet at the subclass level.
//
// Shape: { classKey: { level: [{ name, desc }] } }
// ---------------------------------------------------------------

export const CLASS_FEATURES = {
  barbarian: {
    1: [{ name: 'Rage', desc: 'Bonus damage, advantage on STR, and damage resistance while raging.' },
        { name: 'Unarmored Defense', desc: 'AC = 10 + DEX + CON when unarmored.' }],
    2: [{ name: 'Reckless Attack', desc: 'Trade defense for advantage on melee STR attacks.' },
        { name: 'Danger Sense', desc: 'Advantage on DEX saves against effects you can see.' }],
    3: [{ name: 'Primal Path', desc: 'Choose your barbarian path.' }],
    5: [{ name: 'Extra Attack', desc: 'Attack twice when you take the Attack action.' },
        { name: 'Fast Movement', desc: '+10 ft speed when unarmored.' }],
    7: [{ name: 'Feral Instinct', desc: 'Advantage on initiative; act while surprised if you rage.' }],
    9: [{ name: 'Brutal Critical', desc: 'Roll one extra weapon die on a melee crit.' }],
    11: [{ name: 'Relentless Rage', desc: 'Drop to 1 HP instead of 0 with a CON save.' }],
    15: [{ name: 'Persistent Rage', desc: 'Your rage ends early only if you choose.' }],
    18: [{ name: 'Indomitable Might', desc: 'Minimum STR check result equals your STR score.' }],
    20: [{ name: 'Primal Champion', desc: 'STR and CON increase by 4 (max 24).' }],
  },
  bard: {
    1: [{ name: 'Spellcasting', desc: 'Cast bard spells using Charisma.' },
        { name: 'Bardic Inspiration (d6)', desc: 'Give an ally an inspiration die.' }],
    2: [{ name: 'Jack of All Trades', desc: 'Add half proficiency to non-proficient checks.' },
        { name: 'Song of Rest', desc: 'Allies regain extra HP on a short rest.' }],
    3: [{ name: 'Bard College', desc: 'Choose your college.' },
        { name: 'Expertise', desc: 'Double proficiency on two skills.' }],
    5: [{ name: 'Font of Inspiration', desc: 'Regain Bardic Inspiration on a short rest.' }],
    6: [{ name: 'Countercharm', desc: 'Allies gain advantage vs. frightened/charmed.' }],
    10: [{ name: 'Magical Secrets', desc: 'Learn spells from any class.' },
         { name: 'Expertise', desc: 'Double proficiency on two more skills.' }],
    20: [{ name: 'Superior Inspiration', desc: 'Regain inspiration if you have none at initiative.' }],
  },
  cleric: {
    1: [{ name: 'Spellcasting', desc: 'Prepare and cast cleric spells using Wisdom.' },
        { name: 'Divine Domain', desc: 'Choose your domain.' }],
    2: [{ name: 'Channel Divinity (1/rest)', desc: 'Turn Undead plus a domain effect.' }],
    5: [{ name: 'Destroy Undead (CR 1/2)', desc: 'Turned weak undead are destroyed.' }],
    8: [{ name: 'Divine Strike / Potent Spellcasting', desc: 'Domain damage boost.' }],
    10: [{ name: 'Divine Intervention', desc: 'Call on your deity for aid.' }],
    18: [{ name: 'Channel Divinity (3/rest)', desc: 'Use Channel Divinity three times per rest.' }],
    20: [{ name: 'Divine Intervention Improvement', desc: 'Your deity always answers.' }],
  },
  druid: {
    1: [{ name: 'Druidic', desc: 'You know the secret druid language.' },
        { name: 'Spellcasting', desc: 'Prepare and cast druid spells using Wisdom.' }],
    2: [{ name: 'Wild Shape', desc: 'Transform into beasts you have seen.' },
        { name: 'Druid Circle', desc: 'Choose your circle.' }],
    18: [{ name: 'Timeless Body', desc: 'You age more slowly.' },
         { name: 'Beast Spells', desc: 'Cast spells while in Wild Shape.' }],
    20: [{ name: 'Archdruid', desc: 'Unlimited Wild Shape.' }],
  },
  fighter: {
    1: [{ name: 'Fighting Style', desc: 'Adopt a combat style.' },
        { name: 'Second Wind', desc: 'Bonus action: regain 1d10 + level HP.' }],
    2: [{ name: 'Action Surge', desc: 'Take an extra action on your turn.' }],
    3: [{ name: 'Martial Archetype', desc: 'Choose your archetype.' }],
    5: [{ name: 'Extra Attack', desc: 'Attack twice when you take the Attack action.' }],
    9: [{ name: 'Indomitable', desc: 'Reroll a failed save.' }],
    11: [{ name: 'Extra Attack (2)', desc: 'Attack three times.' }],
    17: [{ name: 'Action Surge (2)', desc: 'Use Action Surge twice per rest.' }],
    20: [{ name: 'Extra Attack (3)', desc: 'Attack four times.' }],
  },
  monk: {
    1: [{ name: 'Unarmored Defense', desc: 'AC = 10 + DEX + WIS when unarmored.' },
        { name: 'Martial Arts', desc: 'Use DEX for unarmed strikes; bonus unarmed strike.' }],
    2: [{ name: 'Ki', desc: 'Spend ki for Flurry of Blows, Patient Defense, Step of the Wind.' },
        { name: 'Unarmored Movement', desc: '+10 ft speed when unarmored.' }],
    3: [{ name: 'Monastic Tradition', desc: 'Choose your tradition.' },
        { name: 'Deflect Missiles', desc: 'Reduce ranged weapon damage.' }],
    4: [{ name: 'Slow Fall', desc: 'Reduce falling damage.' }],
    5: [{ name: 'Extra Attack', desc: 'Attack twice.' },
        { name: 'Stunning Strike', desc: 'Spend ki to stun a creature.' }],
    7: [{ name: 'Evasion', desc: 'Take no damage on successful DEX saves.' },
        { name: 'Stillness of Mind', desc: 'End charmed/frightened on yourself.' }],
    14: [{ name: 'Diamond Soul', desc: 'Proficiency in all saves.' }],
    20: [{ name: 'Perfect Self', desc: 'Regain 4 ki when you have none at initiative.' }],
  },
  paladin: {
    1: [{ name: 'Divine Sense', desc: 'Detect celestials, fiends, undead.' },
        { name: 'Lay on Hands', desc: 'Healing pool of 5 × level.' }],
    2: [{ name: 'Fighting Style', desc: 'Adopt a combat style.' },
        { name: 'Spellcasting', desc: 'Prepare and cast paladin spells using Charisma.' },
        { name: 'Divine Smite', desc: 'Expend a spell slot for extra radiant damage.' }],
    3: [{ name: 'Divine Health', desc: 'Immune to disease.' },
        { name: 'Sacred Oath', desc: 'Choose your oath.' }],
    5: [{ name: 'Extra Attack', desc: 'Attack twice.' }],
    6: [{ name: 'Aura of Protection', desc: 'You and nearby allies add CHA to saves.' }],
    10: [{ name: 'Aura of Courage', desc: 'You and nearby allies can’t be frightened.' }],
    11: [{ name: 'Improved Divine Smite', desc: 'Melee hits deal +1d8 radiant.' }],
    20: [{ name: 'Sacred Oath Capstone', desc: 'Your oath’s ultimate power.' }],
  },
  ranger: {
    1: [{ name: 'Favored Enemy', desc: 'Advantage to track and recall lore.' },
        { name: 'Natural Explorer', desc: 'Mastery of a favored terrain.' }],
    2: [{ name: 'Fighting Style', desc: 'Adopt a combat style.' },
        { name: 'Spellcasting', desc: 'Cast ranger spells using Wisdom.' }],
    3: [{ name: 'Ranger Archetype', desc: 'Choose your archetype.' },
        { name: 'Primeval Awareness', desc: 'Sense creature types nearby.' }],
    5: [{ name: 'Extra Attack', desc: 'Attack twice.' }],
    8: [{ name: "Land's Stride", desc: 'Move through nonmagical difficult terrain freely.' }],
    10: [{ name: 'Hide in Plain Sight', desc: 'Camouflage yourself when motionless.' }],
    14: [{ name: 'Vanish', desc: 'Hide as a bonus action; can’t be tracked.' }],
    20: [{ name: 'Foe Slayer', desc: 'Add WIS to an attack or damage roll once per turn.' }],
  },
  rogue: {
    1: [{ name: 'Expertise', desc: 'Double proficiency on two skills (or thieves’ tools).' },
        { name: 'Sneak Attack', desc: 'Extra damage with advantage or a flanking ally.' },
        { name: "Thieves' Cant", desc: 'Secret rogue cant.' }],
    2: [{ name: 'Cunning Action', desc: 'Dash, Disengage, or Hide as a bonus action.' }],
    3: [{ name: 'Roguish Archetype', desc: 'Choose your archetype.' }],
    5: [{ name: 'Uncanny Dodge', desc: 'Halve damage from one attack as a reaction.' }],
    6: [{ name: 'Expertise', desc: 'Double proficiency on two more skills.' }],
    7: [{ name: 'Evasion', desc: 'Take no damage on successful DEX saves.' }],
    11: [{ name: 'Reliable Talent', desc: 'Treat a d20 of 9 or lower as 10 on proficient checks.' }],
    14: [{ name: 'Blindsense', desc: 'Sense hidden creatures within 10 ft.' }],
    15: [{ name: 'Slippery Mind', desc: 'Proficiency in WIS saves.' }],
    18: [{ name: 'Elusive', desc: 'No attack roll has advantage against you.' }],
    20: [{ name: 'Stroke of Luck', desc: 'Turn a miss into a hit once per rest.' }],
  },
  sorcerer: {
    1: [{ name: 'Spellcasting', desc: 'Cast sorcerer spells using Charisma.' },
        { name: 'Sorcerous Origin', desc: 'Choose your origin.' }],
    2: [{ name: 'Font of Magic', desc: 'Gain sorcery points; convert to slots.' }],
    3: [{ name: 'Metamagic', desc: 'Bend spells with metamagic options.' }],
    20: [{ name: 'Sorcerous Restoration', desc: 'Regain 4 sorcery points on a short rest.' }],
  },
  warlock: {
    1: [{ name: 'Otherworldly Patron', desc: 'Choose your patron.' },
        { name: 'Pact Magic', desc: 'Cast warlock spells; slots recharge on a short rest.' }],
    2: [{ name: 'Eldritch Invocations', desc: 'Learn potent magical secrets.' }],
    3: [{ name: 'Pact Boon', desc: 'Pact of the Chain, Blade, or Tome.' }],
    11: [{ name: 'Mystic Arcanum (6th)', desc: 'Cast a 6th-level spell once per long rest.' }],
    20: [{ name: 'Eldritch Master', desc: 'Regain all Pact Magic slots on a short rest (1/day).' }],
  },
  wizard: {
    1: [{ name: 'Spellcasting', desc: 'Cast wizard spells from your spellbook using Intelligence.' },
        { name: 'Arcane Recovery', desc: 'Recover some spell slots on a short rest.' }],
    2: [{ name: 'Arcane Tradition', desc: 'Choose your school of magic.' }],
    18: [{ name: 'Spell Mastery', desc: 'Cast a 1st- and 2nd-level spell at will.' }],
    20: [{ name: 'Signature Spells', desc: 'Always have two 3rd-level spells prepared, free 1/rest each.' }],
  },
}

// Class features gained AT a specific level.
export function classFeaturesAtLevel(classKey, level) {
  return CLASS_FEATURES[classKey]?.[level] || []
}

// All class features up to and including a level.
export function classFeaturesUpTo(classKey, level) {
  const out = []
  for (let l = 1; l <= level; l++) {
    for (const f of classFeaturesAtLevel(classKey, l)) out.push({ ...f, level: l })
  }
  return out
}
