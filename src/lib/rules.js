// ---------------------------------------------------------------
// Rules engine — the single, pure derivation layer used by BOTH
// character creation and level-up so the two never drift.
// No React, no Supabase. Reads SRD data from src/data/srd/*.
//
// Main exports:
//   effectiveAbilities(base, raceKey, subraceKey, improvements, raceChoiceBonuses)
//   deriveSheet(choices)  -> the canonical `sheet` jsonb document
// ---------------------------------------------------------------
import { abilityModifier, proficiencyBonus, ABILITIES } from './dnd.js'
import {
  getRace, getSubrace, getClass, getBackground,
  getSubclassInfo, getSubclassOption,
  castsByLevel, buildSpellcasting, classFeaturesUpTo,
} from '../data/srd/index.js'

const ABILITY_KEYS = ABILITIES.map((a) => a.key)
const SCHEMA_VERSION = 1
const ABILITY_HARD_CAP = 20

// Merge a {ability:+n} bonus map onto a running totals object (mutates+returns).
function addBonuses(into, bonuses) {
  if (!bonuses) return into
  for (const [k, v] of Object.entries(bonuses)) {
    into[k] = (into[k] || 0) + v
  }
  return into
}

// Sum all ability improvements (ASIs/feats) logged on the character.
// `improvements` is an array of { changes: {ability:+n} }.
function sumImprovements(improvements) {
  const total = {}
  for (const imp of improvements || []) addBonuses(total, imp?.changes)
  return total
}

// Effective ability scores = base + race + subrace + chosen race bonuses + improvements.
// Returns a {strength,dexterity,...} map, each capped at 20.
export function effectiveAbilities(base, raceKey, subraceKey, improvements = [], raceChoiceBonuses = null) {
  const race = getRace(raceKey)
  const subrace = getSubrace(raceKey, subraceKey)

  const out = {}
  for (const k of ABILITY_KEYS) out[k] = Number(base?.[k] ?? 10)

  addBonuses(out, race?.abilityBonuses)
  addBonuses(out, subrace?.abilityBonuses)
  addBonuses(out, raceChoiceBonuses) // e.g. Half-Elf's +1/+1
  addBonuses(out, sumImprovements(improvements))

  for (const k of ABILITY_KEYS) out[k] = Math.min(ABILITY_HARD_CAP, out[k])
  return out
}

// Unarmored AC, accounting for class features (Barbarian/Monk).
export function unarmoredAC(classKey, abilities) {
  const dex = abilityModifier(abilities.dexterity)
  if (classKey === 'barbarian') return 10 + dex + abilityModifier(abilities.constitution)
  if (classKey === 'monk') return 10 + dex + abilityModifier(abilities.wisdom)
  return 10 + dex
}

// Full AC from a sheet: equipped armor (+ DEX within its cap) + shield, or the
// class's unarmored AC when no body armor is worn. Used by the inventory panel
// to recompute AC live when armor is equipped/removed.
export function computeAC(sheet) {
  const scores = sheet?.abilities?.scores || {}
  const dexMod = abilityModifier(scores.dexterity ?? 10)
  const inv = sheet?.inventory || []
  const bodyArmor = inv.find((i) => i.equipped && i.armor && i.armor.category !== 'shield')
  const hasShield = inv.some((i) => i.equipped && i.armor?.category === 'shield')

  let base
  if (bodyArmor) {
    const a = bodyArmor.armor
    const dexPart = a.addDex ? (a.dexMax != null ? Math.min(dexMod, a.dexMax) : dexMod) : 0
    base = a.baseAC + dexPart
  } else {
    base = unarmoredAC(sheet?.identity?.classKey, scores)
  }
  return base + (hasShield ? 2 : 0)
}

// Max HP. At level 1: hit die max + CON mod. Levels 2+ use logged progression
// hpGain values (computed in the level-up wizard, S4). Hill Dwarf adds +1/level.
function deriveMaxHp(klass, level, abilities, raceKey, subraceKey, progression) {
  const conMod = abilityModifier(abilities.constitution)
  let hp = klass.hitDie + conMod // level 1
  for (const entry of progression || []) {
    if (entry?.hpGain != null) hp += entry.hpGain
  }
  const subrace = getSubrace(raceKey, subraceKey)
  if (subrace?.hpPerLevel) hp += subrace.hpPerLevel * level
  return Math.max(1, hp)
}

// Union helper that preserves order and de-dupes (case-sensitive on strings).
function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))]
}

// ---------------------------------------------------------------
// deriveSheet — turn a wizard's `choices` into the canonical sheet.
//
// choices = {
//   identity: { name, alignment, description, personality, backstory },
//   raceKey, subraceKey, classKey, subclassKey, backgroundKey,
//   level (default 1),
//   abilities: { method, base: {strength,...} },
//   raceChoiceBonuses: {ability:+1,...} | null,   // Half-Elf, variant human
//   classSkills: [skillKey],                       // chosen from class list
//   raceSkills:  [skillKey],                       // Half-Elf Skill Versatility
//   avatarUrl?,
//   improvements?: [{level,source,changes}],       // carried from progression
//   progression?: [...],                           // carried on level-up
// }
// ---------------------------------------------------------------
export function deriveSheet(choices) {
  const level = Number(choices.level || 1)
  const klass = getClass(choices.classKey)
  const race = getRace(choices.raceKey)
  const subrace = getSubrace(choices.raceKey, choices.subraceKey)
  const background = getBackground(choices.backgroundKey)
  if (!klass) throw new Error(`Unknown class: ${choices.classKey}`)
  if (!race) throw new Error(`Unknown race: ${choices.raceKey}`)

  const base = choices.abilities?.base || {}
  const improvements = choices.improvements || []
  const abilities = effectiveAbilities(
    base,
    choices.raceKey,
    choices.subraceKey,
    improvements,
    choices.raceChoiceBonuses
  )

  // ---- Proficiencies -------------------------------------------------
  const skillMap = {}
  const grantSkills = (keys) => (keys || []).forEach((k) => { skillMap[k] = skillMap[k] || 'prof' })
  grantSkills(race?.proficiencies?.skills)              // fixed racial (Elf perception, Half-Orc intimidation)
  grantSkills(subrace?.proficiencies?.skills)
  grantSkills(choices.raceSkills)                       // Half-Elf chosen two
  grantSkills(klass.skillChoices ? choices.classSkills : [])
  grantSkills(background?.skills)                       // background's two

  const armor = uniq([
    ...(race?.proficiencies?.armor || []),
    ...(subrace?.proficiencies?.armor || []),
    ...(klass.proficiencies?.armor || []),
  ])
  const weapons = uniq([
    ...(race?.proficiencies?.weapons || []),
    ...(subrace?.proficiencies?.weapons || []),
    ...(klass.proficiencies?.weapons || []),
  ])
  const tools = uniq([
    ...(race?.proficiencies?.tools || []),
    ...(subrace?.proficiencies?.tools || []),
    ...(klass.proficiencies?.tools || []),
    ...(background?.tools || []),
  ])
  const languages = uniq([
    ...(race?.languages || []),
    ...(subrace?.languages || []),
  ])

  // ---- Features ------------------------------------------------------
  const features = []
  for (const t of race?.traits || []) features.push({ name: t.name, source: race.name, level: 1, desc: t.desc })
  for (const t of subrace?.traits || []) features.push({ name: t.name, source: subrace.name, level: 1, desc: t.desc })
  for (const f of classFeaturesUpTo(klass.key, level)) {
    features.push({ name: f.name, source: klass.name, level: f.level, desc: f.desc })
  }
  if (background?.feature) {
    features.push({ name: background.feature.name, source: background.name, level: 1, desc: background.feature.desc })
  }
  // Subclass (if chosen) — recorded as a feature; detailed subclass features layer in later.
  const subclassInfo = getSubclassInfo(klass.key)
  const subclassOpt = getSubclassOption(klass.key, choices.subclassKey)
  if (subclassOpt && level >= (subclassInfo?.level || 99)) {
    features.push({ name: subclassOpt.name, source: `${klass.name} (${subclassInfo.label})`, level: subclassInfo.level, desc: subclassOpt.desc })
  }
  // Feats and other choices logged during level-up.
  for (const f of choices.extraFeatures || []) {
    features.push({ name: f.name, source: f.source || 'Feat', level: f.level || level, desc: f.desc || '' })
  }

  // ---- HP / AC / speed ----------------------------------------------
  const maxHp = deriveMaxHp(klass, level, abilities, choices.raceKey, choices.subraceKey, choices.progression)
  const ac = unarmoredAC(klass.key, abilities)
  const speed = subrace?.speed ?? race?.speed ?? 30

  // ---- Equipment & currency -----------------------------------------
  const inventory = [
    ...(klass.startingEquipment || []),
    ...(background?.equipment || []),
  ].map((name, i) => ({
    id: `start-${i}`,
    name,
    qty: 1,
    weight: 0,
    type: 'gear',
    equipped: false,
    attuned: false,
    desc: '',
  }))
  const currency = { cp: 0, sp: 0, ep: 0, gp: background?.startingGold || 0, pp: 0 }

  // ---- Spellcasting (level-aware; half casters start at level 2) ----
  const spellcasting = castsByLevel(klass.key, level)
    ? buildSpellcasting(klass.key, level, abilities[klass.spellcastingAbility], choices.spellSelections)
    : null

  return {
    identity: {
      name: choices.identity?.name || '',
      alignment: choices.identity?.alignment || '',
      background: background?.name || '',
      race: race.name,
      subrace: subrace?.name || '',
      class: klass.name,
      classKey: klass.key,
      subclass: choices.subclassKey || '',
      avatarUrl: choices.avatarUrl || '',
      description: choices.identity?.description || '',
      personality: choices.identity?.personality || { traits: '', ideals: '', bonds: '', flaws: '' },
      backstory: choices.identity?.backstory || '',
    },
    abilities: {
      base: { ...base },
      scores: abilities, // effective, for convenient rendering
      improvements,
      method: choices.abilities?.method || 'standard',
    },
    hp: { max: maxHp, current: maxHp, temp: 0, hitDice: { total: level, spent: 0, die: klass.hitDie } },
    proficiencies: {
      skills: skillMap,
      saves: [...(klass.savingThrows || [])],
      armor,
      weapons,
      tools,
      languages,
    },
    features,
    spellcasting,
    inventory,
    currency,
    ac,
    speed,
    combatState: { conditions: [], exhaustion: 0, deathSaves: { successes: 0, failures: 0 } },
    progression: choices.progression || [],
    meta: { createdAt: new Date().toISOString(), schemaVersion: SCHEMA_VERSION },
    // The choices used to build this sheet — the source of truth for re-derivation
    // on level-up (so the engine never drifts from creation).
    build: choices,
    // top-level mirrors read by lib/characters.js flatColumnsFromSheet:
    level,
    class: klass.name,
  }
}

// Average HP gained per level for a hit die (PHB: round up of half + 1).
export function averageHpForDie(hitDie) {
  return Math.floor(hitDie / 2) + 1
}

// ---------------------------------------------------------------
// applyLevelUp — derive the next level's sheet from the current one and the
// player's level-up choices. Re-derives via deriveSheet from the stored build
// so features/slots/profs stay consistent, while preserving live state
// (inventory, currency, combat state, edited identity).
//
// opts = {
//   hpMode: 'avg' | 'roll',  hpRoll?: number (the die result if rolling),
//   asi?: { changes: {ability:+n} },        // ASI choice
//   feat?: { name, desc },                    // OR a feat
//   subclassKey?: string,                     // if this level grants the subclass
//   addedCantrips?: string[], addedSpells?: string[],
// }
// ---------------------------------------------------------------
export function applyLevelUp(sheet, opts = {}) {
  const build = JSON.parse(JSON.stringify(sheet.build || {}))
  const klass = getClass(build.classKey)
  if (!klass) throw new Error('Cannot level up: missing build/class data.')

  const newLevel = (build.level || 1) + 1

  // Effective CON at the current build (for HP gain).
  const abilities = effectiveAbilities(build.abilities?.base || {}, build.raceKey, build.subraceKey, build.improvements, build.raceChoiceBonuses)
  const conMod = abilityModifier(abilities.constitution)
  const rolled = opts.hpMode === 'roll' && opts.hpRoll != null ? opts.hpRoll : averageHpForDie(klass.hitDie)
  const hpGain = Math.max(1, rolled + conMod)

  build.level = newLevel
  if (opts.asi?.changes) {
    build.improvements = [...(build.improvements || []), { level: newLevel, source: 'ASI', changes: opts.asi.changes }]
  }
  if (opts.feat) {
    build.extraFeatures = [...(build.extraFeatures || []), { name: opts.feat.name, source: 'Feat', level: newLevel, desc: opts.feat.desc || '' }]
  }
  if (opts.subclassKey) build.subclassKey = opts.subclassKey
  if (opts.addedCantrips?.length || opts.addedSpells?.length) {
    const sel = build.spellSelections || { cantrips: [], spells: [] }
    build.spellSelections = {
      cantrips: [...new Set([...(sel.cantrips || []), ...(opts.addedCantrips || [])])],
      spells: [...new Set([...(sel.spells || []), ...(opts.addedSpells || [])])],
    }
  }
  build.progression = [
    ...(build.progression || []),
    { level: newLevel, hpGain, choices: { hpMode: opts.hpMode || 'avg', asi: opts.asi || null, feat: opts.feat || null, subclassKey: opts.subclassKey || null } },
  ]

  const next = deriveSheet(build)

  // Preserve live state that deriveSheet would otherwise reset to defaults.
  next.inventory = sheet.inventory || next.inventory
  next.currency = sheet.currency || next.currency
  next.combatState = sheet.combatState || next.combatState
  next.hp.temp = sheet.hp?.temp || 0
  next.hp.current = Math.min(next.hp.max, (sheet.hp?.current ?? next.hp.max) + hpGain)
  return next
}

// Convenience: proficiency bonus for a sheet's level (re-export wrapper).
export function sheetProficiencyBonus(sheet) {
  return proficiencyBonus(sheet?.level || 1)
}
