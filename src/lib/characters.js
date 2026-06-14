import { supabase } from './supabase.js'
import { computeAC } from './rules.js'

// Small helpers for updating a character row. Used by the player sheet
// (HP, skills, spell slots) and the combat tracker (HP write-through).

// Patch arbitrary columns on a character.
export async function patchCharacter(id, patch) {
  const { error } = await supabase.from('characters').update(patch).eq('id', id)
  if (error) console.error('[patchCharacter]', error.message)
  return error
}

// Flat columns kept in sync FROM `sheet` so combat/realtime/party stay fast.
// `sheet` is canonical; these are a denormalized mirror.
const MIRRORED_COLUMNS = ['name', 'level', 'max_hp', 'current_hp', 'class', 'race', 'subclass', 'avatar_url']

// Derive the flat-column patch from a sheet object. Pulls from sheet.identity
// (name/race/subclass/avatar) and sheet top-level (level/hp/class), only
// including keys that are actually present so we never null out good data.
export function flatColumnsFromSheet(sheet) {
  if (!sheet || typeof sheet !== 'object') return {}
  const id = sheet.identity || {}
  const candidates = {
    name: id.name,
    level: sheet.level,
    max_hp: sheet.hp?.max ?? sheet.max_hp,
    current_hp: sheet.hp?.current ?? sheet.current_hp,
    class: sheet.class ?? id.class,
    race: id.race ?? sheet.race,
    subclass: id.subclass ?? sheet.subclass,
    avatar_url: id.avatarUrl ?? sheet.avatar_url,
  }
  const patch = {}
  for (const col of MIRRORED_COLUMNS) {
    if (candidates[col] !== undefined && candidates[col] !== null) patch[col] = candidates[col]
  }
  return patch
}

// Save the canonical sheet AND mirror its flat columns in one update.
export async function saveSheet(id, sheet) {
  return patchCharacter(id, { sheet, ...flatColumnsFromSheet(sheet) })
}

// Insert a brand-new character from a derived `sheet` (creation wizard).
// Writes the canonical sheet, the mirrored flat columns, the legacy ability
// columns (so combat/legacy components keep working), and a pin (the
// characters.pin column is NOT NULL — we reuse the campaign join code).
// Returns { data, error } where data is the inserted row.
export async function createCharacterFromSheet(sessionId, sheet, { pin = '' } = {}) {
  const scores = sheet?.abilities?.scores || {}
  const row = {
    session_id: sessionId,
    pin: pin || '',
    sheet,
    ...flatColumnsFromSheet(sheet),
    strength: scores.strength ?? 10,
    dexterity: scores.dexterity ?? 10,
    constitution: scores.constitution ?? 10,
    intelligence: scores.intelligence ?? 10,
    wisdom: scores.wisdom ?? 10,
    charisma: scores.charisma ?? 10,
  }
  const { data, error } = await supabase
    .from('characters')
    .insert(row)
    .select()
    .single()
  if (error) console.error('[createCharacterFromSheet]', error.message)
  return { data, error }
}

// Merge a partial sheet into the character's canonical sheet, recompute AC
// from equipped armor, and save (with flat-column mirroring). Used by the
// inventory and combat-state panels.
export async function patchSheet(character, partial) {
  const sheet = getSheet(character)
  const next = { ...sheet, ...partial }
  next.ac = computeAC(next)
  return saveSheet(character.id, next)
}

// Read the canonical sheet, falling back to {} for legacy rows.
export function getSheet(character) {
  const s = character?.sheet
  return s && typeof s === 'object' && !Array.isArray(s) ? s : {}
}

// Read skill proficiencies. Prefer the canonical sheet
// (sheet.proficiencies.skills: { key: 'prof'|'expertise' }); fall back to the
// legacy `abilities` jsonb ({ skills: { key: true } }) for demo characters.
export function getSkillProficiencies(character) {
  const sheet = getSheet(character)
  if (sheet.proficiencies?.skills) return sheet.proficiencies.skills
  const ab = character?.abilities
  if (ab && !Array.isArray(ab) && ab.skills) return ab.skills
  return {}
}

// Toggle one skill's proficiency and save — sheet-aware. For sheet-backed
// characters we edit sheet.proficiencies.skills; for legacy ones we edit the
// `abilities` jsonb.
export async function toggleSkill(character, skillKey) {
  const sheet = getSheet(character)
  if (sheet.proficiencies?.skills) {
    const skills = { ...sheet.proficiencies.skills }
    if (skills[skillKey]) delete skills[skillKey]
    else skills[skillKey] = 'prof'
    const next = { ...sheet, proficiencies: { ...sheet.proficiencies, skills } }
    return saveSheet(character.id, next)
  }
  const current = getSkillProficiencies(character)
  const nextSkills = { ...current, [skillKey]: !current[skillKey] }
  const ab = character?.abilities && !Array.isArray(character.abilities) ? character.abilities : {}
  return patchCharacter(character.id, { abilities: { ...ab, skills: nextSkills } })
}

// Read spell slots (shape: { "1": { total, used }, ... }).
export function getSpellSlots(character) {
  const s = character?.spell_slots
  return s && typeof s === 'object' && !Array.isArray(s) ? s : {}
}

// Save a single spell level's { total, used }.
export async function setSpellLevel(character, level, value) {
  const slots = getSpellSlots(character)
  return patchCharacter(character.id, {
    spell_slots: { ...slots, [level]: value },
  })
}
