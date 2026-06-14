// Verifies the login query logic (mirrors src/lib/auth.js) against live data.
// Run: node scripts/verify-login.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function login(name, pin) {
  name = (name || '').trim(); pin = (pin || '').trim()
  if (name) {
    const { data: chars } = await supabase.from('characters').select('*').ilike('name', name).eq('pin', pin).limit(1)
    if (chars?.length) {
      const { data: session } = await supabase.from('sessions').select('*').eq('id', chars[0].session_id).single()
      return { ok: true, role: 'player', character: chars[0], session }
    }
  }
  const { data: sessions } = await supabase.from('sessions').select('*').eq('dm_pin', pin)
  if (sessions?.length) return { ok: true, role: 'dm', session: sessions[0] }
  return { ok: false, error: 'no match' }
}

const cases = [
  ['Player ok',        ['Thrain', '1234'], 'player'],
  ['Player wrong pin', ['Thrain', '0000'], 'fail'],
  ['DM ok',            ['', '9999'],       'dm'],
  ['Case-insensitive', ['thrain', '1234'], 'player'],
  ['Bad everything',   ['Nobody', '5'],    'fail'],
]

let pass = 0
for (const [label, [n, p], expect] of cases) {
  const r = await login(n, p)
  const got = r.ok ? r.role : 'fail'
  const ok = got === expect
  if (ok) pass++
  console.log(`${ok ? '✅' : '❌'} ${label.padEnd(18)} expected ${expect}, got ${got}`)
}
console.log(`\n${pass}/${cases.length} login cases passed`)
process.exit(pass === cases.length ? 0 : 1)
