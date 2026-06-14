import { isSupabaseConfigured } from '../lib/supabase.js'

// Small warning bar shown when Supabase env vars are missing.
// Helps during first-time setup so nothing silently fails.
export default function ConfigBanner() {
  if (isSupabaseConfigured) return null

  return (
    <div className="bg-blood/20 border-b border-blood text-parchment text-sm px-4 py-2 text-center">
      ⚠ Supabase is not configured. Add{' '}
      <code className="text-gold">VITE_SUPABASE_URL</code> and{' '}
      <code className="text-gold">VITE_SUPABASE_ANON_KEY</code> to your{' '}
      <code className="text-gold">.env</code> file, then restart the dev server.
    </div>
  )
}
