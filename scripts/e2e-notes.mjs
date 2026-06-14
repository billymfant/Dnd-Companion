// E2E for Phase 8: session notes autosave + NPC tracker persistence.
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
await sb.from('notes').delete().eq('session_id', SESSION)

const NOTE = 'The cult meets beneath the old mill. ' + Date.now()
const browser = await chromium.launch({ headless: true })

async function openNotes(ctx) {
  const page = await ctx.newPage()
  await page.goto(BASE); await page.waitForLoadState('networkidle')
  await page.fill('#pin', '9999'); await page.click('button[type=submit]')
  await page.waitForURL('**/dm', { timeout: 8000 }).catch(() => {})
  await page.locator('nav button', { hasText: 'Notes' }).click()
  await page.waitForSelector('text=Session Notes', { timeout: 8000 })
  return page
}

// Write notes + add NPC
const dm = await openNotes(await browser.newContext())
await dm.fill('textarea[placeholder^="Plot threads"]', NOTE)
await dm.waitForSelector('text=Saved ✓', { timeout: 5000 }).catch(() => {})
ok(await dm.locator('text=Saved ✓').first().isVisible(), 'Notepad shows "Saved ✓" after autosave')

await dm.fill('input[placeholder="Name"]', 'Old Miller Tom')
await dm.fill('input[placeholder="Role (innkeeper…)"]', 'Cult informant')
await dm.getByRole('button', { name: /Add NPC/ }).click()
await dm.waitForTimeout(1200)

// Reload in a brand-new context — data must come from the DB
const dm2 = await openNotes(await browser.newContext())
await dm2.waitForTimeout(800)
const contentVal = await dm2.locator('textarea[placeholder^="Plot threads"]').inputValue()
ok(contentVal === NOTE, 'Notes content persisted across reload')
ok(await dm2.locator('input[value="Old Miller Tom"]').first().isVisible().catch(() => false),
   'NPC persisted across reload')

// DB sanity
const { data: row } = await sb.from('notes').select('content,npcs').eq('session_id', SESSION).single()
ok(row.content === NOTE, 'Notes content saved in DB')
ok(Array.isArray(row.npcs) && row.npcs.some((n) => n.name === 'Old Miller Tom'), 'NPC saved in DB')

await sb.from('notes').delete().eq('session_id', SESSION) // cleanup
await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
