// Pure unit checks for the education layer (no browser, no Supabase).
// Run: node scripts/test-education.mjs
import { raceMatch, keyAbilitiesFor, suggestAbilityOrder } from '../src/lib/synergy.js'
import { ABILITIES, SKILLS } from '../src/lib/dnd.js'
import { RACES, CLASSES } from '../src/data/srd/index.js'

let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }
const eq = (a, b, m) => ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`)

// ---- synergy ----------------------------------------------------------
eq(keyAbilitiesFor('wizard')[0], 'intelligence', 'wizard key ability is INT')
eq(raceMatch('wizard', 'elf'), 'good', 'Elf (+DEX) is a good, not great, match for Wizard')
eq(raceMatch('rogue', 'elf'), 'great', 'Elf (+DEX) is a great match for Rogue (DEX primary)')
eq(raceMatch('barbarian', 'elf'), null, 'Elf is not flagged for Barbarian')
eq(suggestAbilityOrder('fighter')[0], 'strength', 'fighter places STR first')
eq(suggestAbilityOrder('fighter').length, 6, 'suggestAbilityOrder returns all six abilities')

// ---- glossary coverage ------------------------------------------------
import { CONCEPTS, ABILITY_INFO, SKILL_INFO, getConcept } from '../src/data/srd/glossary.js'
const REQUIRED_CONCEPTS = [
  'race', 'subrace', 'class', 'subclass', 'alignment', 'ability_score',
  'ability_modifier', 'proficiency', 'proficiency_bonus', 'skill',
  'saving_throw', 'armor_class', 'hit_points', 'spell_slot', 'cantrip', 'prepared_vs_known',
]
for (const k of REQUIRED_CONCEPTS) {
  const c = CONCEPTS[k]
  ok(c && c.term && c.short && c.detail, `concept "${k}" has term/short/detail`)
}
for (const a of ABILITIES) {
  const info = ABILITY_INFO[a.key]
  ok(info && info.short && info.detail, `ability "${a.key}" has short/detail`)
}
for (const s of SKILLS) {
  const info = SKILL_INFO[s.key]
  ok(info && info.short && info.ability === s.ability, `skill "${s.key}" has short + correct ability`)
}
eq(getConcept('armor_class').term, 'Armor Class', 'getConcept returns the entry')

// ---- race/class blurb coverage ----------------------------------------
for (const r of RACES) ok(r.blurb && r.whenToPick, `race "${r.key}" has blurb + whenToPick`)
for (const c of CLASSES) ok(c.blurb && c.whenToPick, `class "${c.key}" has blurb + whenToPick`)

// ---- spell notes ------------------------------------------------------
import { getSpellNote, SPELL_NOTES } from '../src/data/srd/spellNotes.js'
ok(typeof getSpellNote === 'function', 'getSpellNote is exported')
eq(getSpellNote('nonexistent-spell'), null, 'unknown spell returns null (falls back to API desc)')
ok(getSpellNote('fire-bolt'), 'fire-bolt has a beginner note')
ok(Object.keys(SPELL_NOTES).length >= 20, 'at least 20 common spells annotated')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
