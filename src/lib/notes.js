import { supabase } from './supabase.js'

// Notes are one row per session (DM-only, no realtime needed).

// Make sure a notes row exists for this session; return it.
export async function ensureNotes(sessionId) {
  const { data: existing } = await supabase
    .from('notes')
    .select('*')
    .eq('session_id', sessionId)
    .limit(1)
  if (existing && existing.length) return existing[0]

  const { data, error } = await supabase
    .from('notes')
    .insert({ session_id: sessionId, content: '', npcs: [] })
    .select()
    .single()
  if (error) console.error('[ensureNotes]', error.message)
  return data
}

// Save fields on the notes row (also bumps updated_at).
export async function saveNotes(id, patch) {
  const { error } = await supabase
    .from('notes')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error('[saveNotes]', error.message)
  return error
}
