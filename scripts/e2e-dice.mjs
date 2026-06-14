// E2E for Phase 6: shared dice roller — rolls sync live to all devices.
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
await sb.from('dice_rolls').delete().eq('session_id', SESSION)

const browser = await chromium.launch({ headless: true })

// Player
const pCtx = await browser.newContext()
const player = await pCtx.newPage()
await player.goto(BASE); await player.waitForLoadState('networkidle')
await player.fill('#name', 'Thrain'); await player.fill('#pin', '1234')
await player.click('button[type=submit]')
await player.waitForSelector('text=Roll Log', { timeout: 8000 })

// DM
const dCtx = await browser.newContext()
const dm = await dCtx.newPage()
await dm.goto(BASE); await dm.waitForLoadState('networkidle')
await dm.fill('#pin', '9999'); await dm.click('button[type=submit]')
await dm.waitForURL('**/dm', { timeout: 8000 }).catch(() => {})
await dm.locator('nav button', { hasText: 'Dice' }).click()
await dm.waitForSelector('text=Roll Log', { timeout: 8000 })

// Player rolls a d20 with a label
await player.fill('input[placeholder="Attack roll"]', 'Sword swing')
await player.getByRole('button', { name: 'd20', exact: true }).click()

// DM's log should show Thrain's roll live
await dm.waitForSelector('text=Sword swing', { timeout: 8000 }).catch(() => {})
ok(await dm.locator('text=Sword swing').first().isVisible(), "Player's roll appears in DM log LIVE")
ok(await dm.locator('.bg-panel:has-text("Roll Log") >> text=Thrain').first().isVisible(),
   'Roll attributed to Thrain in the shared log')

// DM rolls a d6
await dm.getByRole('button', { name: 'd6', exact: true }).click()
await player.waitForTimeout(1500)
ok(await player.locator('.bg-panel:has-text("Roll Log") >> text=DM').first().isVisible(),
   "DM's roll appears in player log LIVE")

// DB sanity: two rolls recorded
const { data: rolls } = await sb.from('dice_rolls').select('*').eq('session_id', SESSION)
ok(rolls.length === 2, `Two rolls recorded in DB (got ${rolls.length})`)

await sb.from('dice_rolls').delete().eq('session_id', SESSION) // cleanup
await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
