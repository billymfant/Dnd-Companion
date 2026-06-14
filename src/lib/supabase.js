import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------
// Supabase client.
// The URL and anon key are read from environment variables that
// Vite exposes on `import.meta.env` (any var prefixed with VITE_).
// These live in the .env file and are NEVER hardcoded here.
// ---------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helpful flag the UI can use to show a "not configured yet" message
// instead of crashing when the .env values are still missing.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // Warn in the console so we know why nothing is syncing during setup.
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Add them to your .env file and restart the dev server.'
  )
}

// We still create a client even with empty strings so imports don't throw;
// calls simply won't work until the env vars are filled in.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
