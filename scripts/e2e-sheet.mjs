// E2E test for Phase 4: player sheet + LIVE HP SYNC between two devices.
// Context A = player (Thrain/1234), Context B = DM (blank/9999).
// We change HP from the DM and assert the player's screen updates with NO reload.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const BASE = 'http://localhost:5173'
let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }

// reset Thrain to full HP before the test
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
// Reset HP and clear skill proficiencies so the toggle test is deterministic.
await sb.from('characters').update({ current_hp: 28, max_hp: 28, abilities: {} }).eq('name', 'Thrain')

const browser = await chromium.launch({ headless: true })

// ---- Player context ----
const playerCtx = await browser.newContext()
const player = await playerCtx.newPage()
await player.goto(BASE)
await player.waitForLoadState('networkidle')
await player.fill('#name', 'Thrain')
await player.fill('#pin', '1234')
await player.click('button[type=submit]')
await player.waitForURL('**/player', { timeout: 15000 }).catch(() => {})
await player.waitForSelector('text=Hit Points', { timeout: 8000 })
// HP bar text renders a tick after the heading — wait for it before asserting.
await player.waitForSelector('text=28 / 28 HP', { timeout: 15000 }).catch(() => {})
ok(await player.locator('text=28 / 28 HP').first().isVisible(), 'Player sheet shows full HP 28/28')
ok(await player.locator('text=Acrobatics').first().isVisible(), 'Skills list renders')
ok(await player.locator('text=Spell Slots').first().isVisible(), 'Spell slots render')

// ---- DM context ----
const dmCtx = await browser.newContext()
const dm = await dmCtx.newPage()
dm.on('dialog', (d) => d.accept())
await dm.goto(BASE)
await dm.waitForLoadState('networkidle')
await dm.fill('#pin', '9999')
await dm.click('button[type=submit]')
await dm.waitForURL('**/dm', { timeout: 15000 }).catch(() => {})
await dm.waitForSelector('text=Thrain', { timeout: 8000 })

// DM opens Thrain, reduces current HP to 10, saves
await dm.locator('.bg-panel', { hasText: 'Thrain' }).first().getByText('Edit').click()
await dm.waitForSelector('text=Edit Thrain', { timeout: 5000 })
// "Current HP" stepper input is the 2nd HP number input; set it directly via label proximity
const curHp = dm.locator('input[type=number]').nth(3) // level, maxhp, curhp order -> find robustly below
// More robust: find the Current HP stepper by its label
const curHpInput = dm.locator('div:has(> label:text-is("Current HP")) input[type=number]')
await curHpInput.fill('10')
await dm.click('text=Save changes')

// ---- Assert the PLAYER screen updated live (no reload) ----
await player.waitForSelector('text=10 / 28 HP', { timeout: 15000 }).catch(() => {})
ok(await player.locator('text=10 / 28 HP').first().isVisible(), 'DM HP change appears on player screen LIVE (no reload)')

// ---- Player heals themselves; assert it persists to DB ----
await player.locator('text=+ Heal').click() // heals by 1 -> 11
await player.waitForSelector('text=11 / 28 HP', { timeout: 15000 }).catch(() => {})
ok(await player.locator('text=11 / 28 HP').first().isVisible(), 'Player self-heal updates own sheet')

// ---- Player toggles a skill proficiency; assert persists ----
const before = await player.locator('button:has-text("Stealth")').first().innerText()
await player.locator('button:has-text("Stealth")').first().click()
await player.waitForTimeout(1200)
const { data: c } = await sb.from('characters').select('abilities,current_hp').eq('name', 'Thrain').single()
ok(c?.abilities?.skills?.stealth === true, 'Skill proficiency toggle saved to DB')
ok(c?.current_hp === 11, 'Self-heal saved to DB (current_hp=11)')

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
