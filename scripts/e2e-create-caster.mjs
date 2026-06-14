// End-to-end test of S3 — caster creation (subclass + spell selection).
// Builds a Human Wizard, picks cantrips + 1st-level spells, and asserts the
// sheet.spellcasting document and slots land in the DB, then cleans up.
// Requires the dev server + migration. Run: node scripts/e2e-create-caster.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const BASE = 'http://localhost:5173'
let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }
const eq = (a, b, m) => ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`)

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const NAME = 'Testwizard' + Date.now()
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext()
const page = await ctx.newPage()

// pick the first N spell buttons within a group
async function pickFirst(testId, n) {
  const btns = page.locator(`[data-testid=${testId}] button`)
  for (let i = 0; i < n; i++) await btns.nth(i).click()
}

try {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', NAME)
  await page.fill('#pin', 'mithral')
  await page.click('button[type=submit]')
  await page.waitForURL('**/create', { timeout: 8000 })
  const next = () => page.click('button:has-text("Next")')

  // Race: Human (no subrace)
  await page.click('[data-testid=race-human]')
  await next()

  // Class: Wizard (subclass chosen at level 2, so no subclass step)
  await page.click('[data-testid=class-wizard]')
  await next()

  // Abilities: Standard Array, INT highest
  await page.selectOption('[data-testid=ability-intelligence]', '15')
  await page.selectOption('[data-testid=ability-dexterity]', '14')
  await page.selectOption('[data-testid=ability-constitution]', '13')
  await page.selectOption('[data-testid=ability-wisdom]', '12')
  await page.selectOption('[data-testid=ability-charisma]', '10')
  await page.selectOption('[data-testid=ability-strength]', '8')
  await next()

  // Background: Sage
  await page.click('[data-testid=background-sage]')
  await next()

  // Skills: wizard picks 2 (investigation, medicine)
  await page.click('[data-testid=skill-investigation]')
  await page.click('[data-testid=skill-medicine]')
  await next()

  // Spells: wizard = 3 cantrips + 6 spellbook spells
  await page.waitForSelector('[data-testid=spellgroup-cantrips] button', { timeout: 15000 })
  await pickFirst('spellgroup-cantrips', 3)
  await page.waitForSelector('[data-testid=spellgroup-spells] button', { timeout: 15000 })
  await pickFirst('spellgroup-spells', 6)
  await next()

  // Describe -> Portrait (optional) -> Review -> Finish
  await next() // describe
  await next() // portrait (skip — optional)
  await page.click('button:has-text("Enter the Realm")')
  await page.waitForURL('**/player', { timeout: 12000 })
  ok(true, 'Caster creation routes to /player')
  await page.waitForSelector('text=✨ Spells', { timeout: 8000 }).catch(() => {})
  ok(await page.locator('text=✨ Spells').first().isVisible(), 'Spellbook panel renders on the sheet')

  // DB assertions
  const { data: rows } = await supabase.from('characters').select('*').ilike('name', NAME).limit(1)
  const sheet = rows?.[0]?.sheet || {}
  const sc = sheet.spellcasting
  ok(Boolean(sc), 'sheet.spellcasting populated')
  if (sc) {
    eq(sc.ability, 'intelligence', 'casts with Intelligence')
    eq(sc.dc, 13, 'spell save DC = 8 + 2 + INT mod (+3) = 13')
    eq(sc.slots?.['1']?.total, 2, '2 first-level slots')
    eq(sc.cantrips.length, 3, '3 cantrips chosen')
    eq(sc.prepared.length, 6, '6 spellbook spells chosen')
  }
} catch (err) {
  fail++
  console.log('❌ threw: ' + err.message)
} finally {
  await supabase.from('characters').delete().ilike('name', NAME)
  await ctx.close()
  await browser.close()
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
