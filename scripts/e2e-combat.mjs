// E2E for Phase 5: combat tracker with live sync to the player.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const BASE = 'http://localhost:5173'
const SESSION = '00000000-0000-0000-0000-000000000001'
let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
// clean slate
await sb.from('combat').delete().eq('session_id', SESSION)
await sb.from('characters').update({ current_hp: 28 }).eq('name', 'Thrain')

const browser = await chromium.launch({ headless: true })

// ---- Player ----
const pCtx = await browser.newContext()
const player = await pCtx.newPage()
await player.goto(BASE); await player.waitForLoadState('networkidle')
await player.fill('#name', 'Thrain'); await player.fill('#pin', '1234')
await player.click('button[type=submit]')
await player.waitForSelector('text=Hit Points', { timeout: 8000 })
ok(!(await player.locator('text=Initiative').first().isVisible().catch(() => false)),
   'No initiative panel before combat starts')

// ---- DM ----
const dCtx = await browser.newContext()
const dm = await dCtx.newPage()
dm.on('dialog', (d) => d.accept())
await dm.goto(BASE); await dm.waitForLoadState('networkidle')
await dm.fill('#pin', '9999'); await dm.click('button[type=submit]')
await dm.waitForURL('**/dm', { timeout: 8000 }).catch(() => {})
await dm.locator('nav button', { hasText: 'Combat' }).click()

// Start encounter, add party + monster, roll initiative, begin
await dm.waitForSelector('text=Start an encounter', { timeout: 8000 })
await dm.click('text=Start an encounter')
await dm.waitForSelector('text=＋ Add party', { timeout: 8000 })
await dm.click('text=＋ Add party')
await dm.waitForSelector('text=Thrain', { timeout: 8000 })
await dm.fill('input[placeholder="Goblin"]', 'Goblin') // HP defaults to 10
await dm.getByRole('button', { name: 'Add', exact: true }).click() // add monster
await dm.waitForSelector('text=Goblin', { timeout: 8000 })
ok(true, 'DM added party + monster')
await dm.getByRole('button', { name: /Roll initiative/ }).click()
await dm.getByRole('button', { name: /Begin combat/ }).click()

// ---- Player should now see the live initiative panel ----
await player.waitForSelector('text=Initiative', { timeout: 8000 }).catch(() => {})
ok(await player.locator('text=Initiative').first().isVisible(), 'Initiative panel appears on player LIVE')
ok(await player.locator('text=Thrain (you)').first().isVisible(), 'Player highlighted as "you" in order')
ok(await player.locator('text=Goblin').first().isVisible(), 'Monster shows in player initiative order')

// ---- DM advances the turn; combat row should update ----
await dm.getByRole('button', { name: /Next/ }).click()
await dm.waitForTimeout(1000)
const { data: combat1 } = await sb.from('combat').select('current_turn,combatants,is_active').eq('session_id', SESSION).single()
ok(combat1.current_turn === 1, 'Advance turn updates current_turn to 1')

// ---- DM damages Thrain combatant; player HP updates live + writes through ----
const thrainCard = dm.locator('.bg-panel', { hasText: 'Thrain' }).first()
await thrainCard.locator('button.bg-blood\\/70').click() // -5 damage
await player.waitForSelector('text=23 / 28 HP', { timeout: 8000 }).catch(() => {})
ok(await player.locator('text=23 / 28 HP').first().isVisible(), 'DM combat damage shows on player sheet LIVE (28→23)')
const { data: thr } = await sb.from('characters').select('current_hp').eq('name', 'Thrain').single()
ok(thr.current_hp === 23, 'Combat damage wrote through to character HP in DB')

// cleanup
await sb.from('combat').delete().eq('session_id', SESSION)
await sb.from('characters').update({ current_hp: 28 }).eq('name', 'Thrain')

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
