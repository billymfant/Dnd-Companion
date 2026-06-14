// Pure unit checks for the rules engine (no browser, no Supabase).
// Run: node scripts/test-rules.mjs
import { deriveSheet, effectiveAbilities, applyLevelUp, averageHpForDie, computeAC } from '../src/lib/rules.js'
import { getArmor } from '../src/data/srd/armor.js'
import { pointBuyCost, isValidPointBuy, STANDARD_ARRAY } from '../src/data/srd/pointbuy.js'
import { proficiencyBonus } from '../src/lib/dnd.js'

let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }
const eq = (a, b, m) => ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`)

// ---- Point buy --------------------------------------------------------
eq(pointBuyCost({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }), 27, 'point-buy 27-pt spread costs 27')
ok(isValidPointBuy({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }), 'that spread is a valid point buy')
ok(!isValidPointBuy({ str: 16, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }), '16 (out of 8–15 range) is invalid point buy')
eq(STANDARD_ARRAY.reduce((a, b) => a + b, 0), 72, 'standard array sums to 72')

// ---- Racial bonuses (effectiveAbilities) ------------------------------
{
  const base = { strength: 15, dexterity: 13, constitution: 14, intelligence: 10, wisdom: 12, charisma: 8 }
  const md = effectiveAbilities(base, 'dwarf', 'mountain-dwarf')
  eq(md.strength, 17, 'Mountain Dwarf: STR 15 +2 = 17')
  eq(md.constitution, 16, 'Dwarf: CON 14 +2 = 16')
  eq(md.dexterity, 13, 'unaffected ability unchanged')
}
{
  // improvements (ASI) stack on top of racial, capped at 20
  const base = { strength: 10, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 10, charisma: 10 }
  const imp = [{ level: 4, source: 'ASI', changes: { constitution: 2 } }]
  const ab = effectiveAbilities(base, 'dwarf', 'mountain-dwarf', imp)
  eq(ab.constitution, 18, 'CON 14 +2 race +2 ASI = 18')
  const capped = effectiveAbilities({ ...base, strength: 19 }, 'dwarf', 'mountain-dwarf')
  eq(capped.strength, 20, 'racial bonus is capped at 20')
}

// ---- deriveSheet: Mountain Dwarf Fighter, Standard Array --------------
{
  const sheet = deriveSheet({
    identity: { name: 'Thrain' },
    raceKey: 'dwarf',
    subraceKey: 'mountain-dwarf',
    classKey: 'fighter',
    backgroundKey: 'soldier',
    level: 1,
    abilities: { method: 'standard', base: { strength: 15, dexterity: 13, constitution: 14, intelligence: 10, wisdom: 12, charisma: 8 } },
    classSkills: ['perception', 'survival'],
  })
  eq(sheet.abilities.scores.strength, 17, 'sheet STR = 17 (racial applied)')
  eq(sheet.abilities.scores.constitution, 16, 'sheet CON = 16 (racial applied)')
  eq(sheet.hp.max, 13, 'HP = 10 (d10) + CON mod (+3) = 13')
  eq(sheet.ac, 11, 'AC = 10 + DEX mod (+1) = 11')
  eq(Object.keys(sheet.proficiencies.skills).length, 4, '2 class + 2 background skills = 4')
  ok(sheet.proficiencies.saves.includes('strength') && sheet.proficiencies.saves.includes('constitution'), 'Fighter save proficiencies STR & CON')
  eq(sheet.speed, 25, 'Dwarf speed 25')
  eq(sheet.spellcasting, null, 'Fighter has no spellcasting in S2')
  eq(sheet.level, 1, 'top-level level mirror present')
  eq(sheet.class, 'Fighter', 'top-level class mirror present')
  ok(sheet.proficiencies.armor.includes('Medium armor'), 'Mountain Dwarf grants medium armor')
  ok(sheet.features.some((f) => f.name === 'Second Wind'), 'Fighter level-1 feature Second Wind present')
}

// ---- deriveSheet: Hill Dwarf hpPerLevel ------------------------------
{
  const sheet = deriveSheet({
    identity: { name: 'Borin' },
    raceKey: 'dwarf',
    subraceKey: 'hill-dwarf',
    classKey: 'fighter',
    backgroundKey: 'soldier',
    level: 1,
    abilities: { method: 'standard', base: { strength: 13, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 15, charisma: 8 } },
    classSkills: ['athletics', 'perception'],
  })
  eq(sheet.hp.max, 14, 'Hill Dwarf HP = 10 + CON mod (+3) + 1 (Dwarven Toughness) = 14')
}

// ---- deriveSheet: caster has spellcasting ability on class data ------
{
  const sheet = deriveSheet({
    identity: { name: 'Mira' },
    raceKey: 'half-elf',
    classKey: 'wizard',
    backgroundKey: 'sage',
    level: 1,
    raceChoiceBonuses: { dexterity: 1, constitution: 1 },
    abilities: { method: 'pointbuy', base: { strength: 8, dexterity: 14, constitution: 14, intelligence: 15, wisdom: 10, charisma: 13 } },
    classSkills: ['investigation', 'medicine'],
    raceSkills: ['perception', 'stealth'],
  })
  eq(sheet.abilities.scores.charisma, 15, 'Half-Elf CHA 13 +2 = 15')
  eq(sheet.abilities.scores.dexterity, 15, 'Half-Elf chosen +1 DEX: 14 +1 = 15')
  // Sage(arcana,history) + wizard(investigation,medicine) + half-elf(perception,stealth) = 6 distinct
  eq(Object.keys(sheet.proficiencies.skills).length, 6, 'Half-Elf wizard has 6 skill proficiencies')
}

// ---- deriveSheet: caster spellcasting (Wizard) -----------------------
{
  const sheet = deriveSheet({
    identity: { name: 'Elwin' },
    raceKey: 'human',
    classKey: 'wizard',
    backgroundKey: 'sage',
    level: 1,
    abilities: { method: 'standard', base: { strength: 8, dexterity: 14, constitution: 13, intelligence: 14, wisdom: 12, charisma: 10 } },
    classSkills: ['investigation', 'medicine'],
    spellSelections: { cantrips: ['Fire Bolt', 'Light', 'Mage Hand'], spells: ['Magic Missile', 'Shield', 'Sleep', 'Mage Armor', 'Detect Magic', 'Burning Hands'] },
  })
  ok(sheet.spellcasting != null, 'Wizard sheet has spellcasting')
  eq(sheet.spellcasting.ability, 'intelligence', 'Wizard casts with Intelligence')
  // human +1 INT -> 15, mod +2, prof +2 -> DC 12
  eq(sheet.spellcasting.dc, 12, 'Wizard spell save DC = 8 + 2 + 2 = 12')
  eq(sheet.spellcasting.slots['1'].total, 2, 'Wizard has 2 level-1 slots')
  eq(sheet.spellcasting.cantrips.length, 3, 'Wizard knows 3 cantrips')
  eq(sheet.spellcasting.prepared.length, 6, 'Wizard spellbook has 6 spells')
}

// ---- deriveSheet: level-1 subclass becomes a feature (Sorcerer) ------
{
  const sheet = deriveSheet({
    identity: { name: 'Vael' },
    raceKey: 'tiefling',
    classKey: 'sorcerer',
    subclassKey: 'draconic',
    backgroundKey: 'noble',
    level: 1,
    abilities: { method: 'standard', base: { strength: 8, dexterity: 14, constitution: 13, intelligence: 10, wisdom: 12, charisma: 15 } },
    classSkills: ['arcana', 'persuasion'],
    spellSelections: { cantrips: ['Fire Bolt', 'Light', 'Prestidigitation', 'Mage Hand'], spells: ['Magic Missile', 'Shield'] },
  })
  ok(sheet.features.some((f) => f.name === 'Draconic Bloodline'), 'Sorcerer level-1 subclass recorded as a feature')
  eq(sheet.spellcasting.cantrips.length, 4, 'Sorcerer knows 4 cantrips')
  eq(sheet.spellcasting.known.length, 2, 'Sorcerer knows 2 spells')
}

// ---- applyLevelUp: Fighter 1 -> 2 ------------------------------------
{
  const l1 = deriveSheet({
    identity: { name: 'Gareth' },
    raceKey: 'human', classKey: 'fighter', backgroundKey: 'soldier', level: 1,
    abilities: { method: 'standard', base: { strength: 15, dexterity: 13, constitution: 14, intelligence: 10, wisdom: 12, charisma: 8 } },
    classSkills: ['athletics', 'perception'],
  })
  // Human +1 CON -> 15 -> mod +2. d10 average = 6. hpGain = 6 + 2 = 8.
  const before = l1.hp.max
  const l2 = applyLevelUp(l1, { hpMode: 'avg' })
  eq(l2.level, 2, 'level becomes 2')
  eq(averageHpForDie(10), 6, 'Fighter average HP per level is 6')
  eq(l2.hp.max, before + 8, 'HP max grows by average (6) + CON mod (+2) = 8')
  ok(l2.features.some((f) => f.name === 'Action Surge'), 'Fighter gains Action Surge at level 2')
  eq(proficiencyBonus(l2.level), 2, 'proficiency bonus still +2 at level 2')
}

// ---- applyLevelUp: proficiency bonus bumps at level 5 ----------------
{
  let s = deriveSheet({
    identity: { name: 'Mara' },
    raceKey: 'human', classKey: 'fighter', backgroundKey: 'soldier', level: 1,
    abilities: { method: 'standard', base: { strength: 15, dexterity: 13, constitution: 14, intelligence: 10, wisdom: 12, charisma: 8 } },
    classSkills: ['athletics', 'perception'],
  })
  for (let i = 0; i < 4; i++) s = applyLevelUp(s, { hpMode: 'avg' })
  eq(s.level, 5, 'reached level 5')
  eq(proficiencyBonus(s.level), 3, 'proficiency bonus is +3 at level 5')
  ok(s.features.some((f) => f.name === 'Extra Attack'), 'Fighter gains Extra Attack at level 5')
}

// ---- applyLevelUp: full caster gains a spell slot --------------------
{
  const wiz1 = deriveSheet({
    identity: { name: 'Sora' },
    raceKey: 'human', classKey: 'wizard', backgroundKey: 'sage', level: 1,
    abilities: { method: 'standard', base: { strength: 8, dexterity: 14, constitution: 13, intelligence: 14, wisdom: 12, charisma: 10 } },
    classSkills: ['investigation', 'medicine'],
    spellSelections: { cantrips: ['Fire Bolt', 'Light', 'Mage Hand'], spells: ['Magic Missile', 'Shield', 'Sleep', 'Mage Armor', 'Detect Magic', 'Burning Hands'] },
  })
  eq(wiz1.spellcasting.slots['1'].total, 2, 'Wizard L1 has 2 first-level slots')
  const wiz2 = applyLevelUp(wiz1, { hpMode: 'avg' })
  eq(wiz2.spellcasting.slots['1'].total, 3, 'Wizard L2 gains a slot (now 3 first-level slots)')
}

// ---- computeAC: equipped armor + shield ------------------------------
{
  const base = deriveSheet({
    identity: { name: 'Kara' }, raceKey: 'human', classKey: 'fighter', backgroundKey: 'soldier', level: 1,
    abilities: { method: 'standard', base: { strength: 14, dexterity: 13, constitution: 12, intelligence: 10, wisdom: 12, charisma: 8 } },
    classSkills: ['athletics', 'perception'],
  })
  // human +1 DEX -> 14 -> mod +2. Unarmored = 12.
  eq(computeAC(base), 12, 'unarmored fighter AC = 10 + DEX (+2) = 12')
  const withArmor = { ...base, inventory: [{ id: 'a', name: 'Chain Shirt', equipped: true, armor: getArmor('chain-shirt') }] }
  eq(computeAC(withArmor), 15, 'chain shirt AC = 13 + min(DEX, 2) = 15')
  const withShield = { ...withArmor, inventory: [...withArmor.inventory, { id: 's', name: 'Shield', equipped: true, armor: getArmor('shield') }] }
  eq(computeAC(withShield), 17, 'chain shirt + shield = 17')
  const plate = { ...base, inventory: [{ id: 'p', name: 'Plate', equipped: true, armor: getArmor('plate') }] }
  eq(computeAC(plate), 18, 'plate AC = 18 (no DEX)')
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
