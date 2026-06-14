import { supabase, isSupabaseConfigured } from './supabase.js'

// ---------------------------------------------------------------
// Code-based login (current model). The campaign **join code is the
// password**. Login = character name + campaign code, every time:
//
//   1. code === a session's dm_pin                 -> DM login
//   2. code === a session's join_code + name exists -> that player
//   3. legacy: name + code === a character's pin    -> player (demo)
//   4. code === a session's join_code + name free   -> signup
//   5. otherwise                                    -> error
//
// Returns one of:
//   { ok: true,  role: 'dm',     character: null, session }
//   { ok: true,  role: 'player', character, session }
//   { ok: true,  action: 'signup', session, name }   // -> creation wizard
//   { ok: false, error: 'human readable message' }
// ---------------------------------------------------------------
export async function loginWithCode(nameInput, codeInput) {
  const name = (nameInput || '').trim()
  const code = (codeInput || '').trim()

  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured yet (check your .env).' }
  }
  if (!code) {
    return { ok: false, error: 'Please enter the campaign code.' }
  }

  try {
    // ---- 1. DM login: code matches a session's dm_pin -----------
    const { data: dmSessions, error: dmErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('dm_pin', code)
    if (dmErr) throw dmErr
    if (dmSessions && dmSessions.length > 0) {
      // If a campaign name was typed, prefer that one.
      const match =
        dmSessions.find((s) => s.name?.toLowerCase() === name.toLowerCase()) ||
        dmSessions[0]
      return { ok: true, role: 'dm', character: null, session: match }
    }

    // ---- 2 & 4. code matches a campaign join_code ---------------
    // (Guarded: if the join_code column doesn't exist yet — pre-migration —
    //  this query errors; we swallow it and fall through to the legacy path
    //  so the demo character still works.)
    let codeSessions = []
    {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('join_code', code)
      if (!error && data) codeSessions = data
    }
    if (codeSessions.length > 0) {
      if (!name) {
        return { ok: false, error: 'Please enter your character name.' }
      }
      // Existing player? Prefer a campaign where this name already exists.
      for (const session of codeSessions) {
        const { data: chars, error: cErr } = await supabase
          .from('characters')
          .select('*')
          .eq('session_id', session.id)
          .ilike('name', name)
          .limit(1)
        if (cErr) throw cErr
        if (chars && chars.length > 0) {
          return { ok: true, role: 'player', character: chars[0], session }
        }
      }
      // Name is free in this campaign -> send them to character creation.
      return { ok: true, action: 'signup', session: codeSessions[0], name }
    }

    // ---- 3. Legacy fallback: name + code === a character's pin ---
    if (name) {
      const { data: chars, error: charErr } = await supabase
        .from('characters')
        .select('*')
        .ilike('name', name)
        .eq('pin', code)
        .limit(1)
      if (charErr) throw charErr
      if (chars && chars.length > 0) {
        const character = chars[0]
        const { data: session, error: sessErr } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', character.session_id)
          .single()
        if (sessErr) throw sessErr
        return { ok: true, role: 'player', character, session }
      }
    }

    // ---- Nothing matched ----------------------------------------
    return {
      ok: false,
      error: 'No campaign or character found for that name and code.',
    }
  } catch (err) {
    console.error('[login] error', err)
    return { ok: false, error: err.message || 'Login failed. Try again.' }
  }
}

// ---------------------------------------------------------------
// Legacy PIN-based login. No email, no JWT — we just match what the
// user typed against the Supabase tables.
//
//   1. Try the characters table:  name + pin  -> player login
//   2. Otherwise try the sessions table: dm_pin -> DM login
//
// Returns one of:
//   { ok: true,  role: 'player', character, session }
//   { ok: true,  role: 'dm',     character: null, session }
//   { ok: false, error: 'human readable message' }
// ---------------------------------------------------------------
export async function loginWithPin(nameInput, pinInput) {
  const name = (nameInput || '').trim()
  const pin = (pinInput || '').trim()

  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured yet (check your .env).' }
  }
  if (!pin) {
    return { ok: false, error: 'Please enter your PIN.' }
  }

  try {
    // ---- 1. Player login: match a character by name + pin --------
    if (name) {
      const { data: chars, error: charErr } = await supabase
        .from('characters')
        .select('*')
        .ilike('name', name) // case-insensitive exact-ish match
        .eq('pin', pin)
        .limit(1)

      if (charErr) throw charErr

      if (chars && chars.length > 0) {
        const character = chars[0]
        // Load the campaign this character belongs to.
        const { data: session, error: sessErr } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', character.session_id)
          .single()

        if (sessErr) throw sessErr
        return { ok: true, role: 'player', character, session }
      }
    }

    // ---- 2. DM login: match a session by dm_pin ------------------
    const { data: sessions, error: dmErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('dm_pin', pin)

    if (dmErr) throw dmErr

    if (sessions && sessions.length > 0) {
      // If a name was typed, prefer the campaign with that name.
      const match =
        sessions.find((s) => s.name?.toLowerCase() === name.toLowerCase()) ||
        sessions[0]
      return { ok: true, role: 'dm', character: null, session: match }
    }

    // ---- Nothing matched ----------------------------------------
    return {
      ok: false,
      error: 'No character or DM found for that name and PIN.',
    }
  } catch (err) {
    console.error('[login] error', err)
    return { ok: false, error: err.message || 'Login failed. Try again.' }
  }
}
