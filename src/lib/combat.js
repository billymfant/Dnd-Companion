import { supabase } from './supabase.js'
import { patchCharacter } from './characters.js'
import { rollDice } from './dnd.js'

// ---------------------------------------------------------------
// Combat helpers. The combat state is a single `combat` row per
// session: { combatants: [...], current_turn, is_active }.
//
// A combatant looks like:
//   { key, name, initiative, current_hp, max_hp, is_player, character_id }
// ---------------------------------------------------------------

// Make sure a combat row exists for this session; return it.
export async function ensureCombat(sessionId) {
  const { data: existing } = await supabase
    .from('combat')
    .select('*')
    .eq('session_id', sessionId)
    .limit(1)
  if (existing && existing.length) return existing[0]

  const { data, error } = await supabase
    .from('combat')
    .insert({ session_id: sessionId, combatants: [], current_turn: 0, is_active: false })
    .select()
    .single()
  if (error) console.error('[ensureCombat]', error.message)
  return data
}

// Patch the combat row.
export async function updateCombat(id, patch) {
  const { error } = await supabase.from('combat').update(patch).eq('id', id)
  if (error) console.error('[updateCombat]', error.message)
  return error
}

// Sort combatants by initiative (highest first); undefined treated as 0.
export function sortByInitiative(combatants) {
  return [...combatants].sort((a, b) => (Number(b.initiative) || 0) - (Number(a.initiative) || 0))
}

// Build a combatant object from a character row.
export function combatantFromCharacter(c) {
  return {
    key: c.id, // reuse character id so we don't add the same player twice
    name: c.name,
    initiative: null,
    current_hp: c.current_hp,
    max_hp: c.max_hp,
    is_player: true,
    character_id: c.id,
  }
}

// Build a monster combatant.
export function makeMonster(name, maxHp, initiative) {
  return {
    key: crypto.randomUUID(),
    name,
    initiative: initiative === '' || initiative == null ? null : Number(initiative),
    current_hp: Number(maxHp) || 1,
    max_hp: Number(maxHp) || 1,
    is_player: false,
    character_id: null,
  }
}

// Roll a d20 for every combatant that doesn't have an initiative yet,
// then sort. Returns the new combatants array.
export function rollInitiativeFor(combatants) {
  const rolled = combatants.map((c) =>
    c.initiative == null ? { ...c, initiative: rollDice('d20').total } : c
  )
  return sortByInitiative(rolled)
}

// Apply an HP delta to one combatant (by key). For players, also write
// the new HP back to their character so their sheet/party card update.
export async function applyCombatantHp(combat, key, newHp) {
  const combatants = combat.combatants.map((c) =>
    c.key === key ? { ...c, current_hp: newHp } : c
  )
  await updateCombat(combat.id, { combatants })

  const target = combat.combatants.find((c) => c.key === key)
  if (target?.is_player && target.character_id) {
    await patchCharacter(target.character_id, { current_hp: newHp })
  }
}
