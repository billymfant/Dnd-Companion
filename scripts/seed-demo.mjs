// Seeds a demo campaign + one character so login can be tested.
// Safe to re-run: it upserts by a fixed demo id.
// Run: node scripts/seed-demo.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const SESSION_ID = '00000000-0000-0000-0000-000000000001'
const CHAR_ID = '00000000-0000-0000-0000-0000000000a1'

// Demo campaign with DM PIN 9999
const { error: sErr } = await supabase.from('sessions').upsert({
  id: SESSION_ID,
  name: 'Demo Campaign',
  dm_pin: '9999',
  join_code: 'mithral',
})
if (sErr) { console.error('session:', sErr.message); process.exit(1) }

// Demo character "Thrain" with PIN 1234
const { error: cErr } = await supabase.from('characters').upsert({
  id: CHAR_ID,
  session_id: SESSION_ID,
  name: 'Thrain',
  pin: '1234',
  class: 'Fighter',
  race: 'Dwarf',
  level: 3,
  max_hp: 28,
  current_hp: 28,
  strength: 16, dexterity: 12, constitution: 15,
  intelligence: 9, wisdom: 11, charisma: 8,
})
if (cErr) { console.error('character:', cErr.message); process.exit(1) }

console.log('✅ Seeded: campaign "Demo Campaign" (DM PIN 9999), character "Thrain" (PIN 1234)')
