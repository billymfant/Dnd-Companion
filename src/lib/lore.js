import { supabase } from './supabase.js'

// Campaign Codex: revealable lore entries (story | npc | location | faction),
// many per session. The DM authors them privately and toggles `revealed` to
// share an entry into the player Journal. Realtime is owned by useRealtimeList.

// All entries for a session, ordered by category then sort_order.
export async function listLore(sessionId) {
  const { data, error } = await supabase
    .from('lore_entries')
    .select('*')
    .eq('session_id', sessionId)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
  if (error) console.error('[listLore]', error.message)
  return data || []
}

// Create a new (hidden) lore entry; returns the inserted row.
export async function createLore(sessionId, { category = 'story', title, body = '' }) {
  const { data, error } = await supabase
    .from('lore_entries')
    .insert({ session_id: sessionId, category, title, body })
    .select()
    .single()
  if (error) console.error('[createLore]', error.message)
  return data
}

// Patch fields on an entry (always bumps updated_at).
export async function updateLore(id, patch) {
  const { error } = await supabase
    .from('lore_entries')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error('[updateLore]', error.message)
  return error
}

// Show/hide an entry in the player Journal.
export async function toggleReveal(id, revealed) {
  return updateLore(id, { revealed })
}

// Remove an entry entirely.
export async function deleteLore(id) {
  const { error } = await supabase.from('lore_entries').delete().eq('id', id)
  if (error) console.error('[deleteLore]', error.message)
  return error
}
