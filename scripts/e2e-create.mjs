// End-to-end test of S2 — character creation wizard.
// Builds a Mountain-Dwarf Fighter with the Standard Array and asserts the
// derived stats land in the DB and render on the player sheet, then cleans up.
// Requires the dev server on http://localhost:5173 and the migration applied
// (sessions.join_code, characters.sheet). Run: node scripts/e2e-create.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const BASE = 'http://localhost:5173'
let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }
const eq = (a, b, m) => ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`)

// Supabase (for DB assertions + cleanup)
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const NAME = 'Testdwarf' + Date.now()

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext()
const page = await ctx.newPage()

try {
  // ---- Login as a new player -> creation wizard ----
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', NAME)
  await page.fill('#pin', 'mithral')
  await page.click('button[type=submit]')
  await page.waitForURL('**/create', { timeout: 8000 })
  ok(true, 'New player reaches the creation wizard')

  const next = () => page.click('button:has-text("Next")')

  // ---- Race: Mountain Dwarf ----
  await page.click('[data-testid=race-dwarf]')
  await page.click('[data-testid=subrace-mountain-dwarf]')
  await next()

  // ---- Class: Fighter ----
  await page.click('[data-testid=class-fighter]')
  await next()

  // ---- Abilities: Standard Array ----
  await page.selectOption('[data-testid=ability-strength]', '15')
  await page.selectOption('[data-testid=ability-constitution]', '14')
  await page.selectOption('[data-testid=ability-dexterity]', '13')
  await page.selectOption('[data-testid=ability-wisdom]', '12')
  await page.selectOption('[data-testid=ability-intelligence]', '10')
  await page.selectOption('[data-testid=ability-charisma]', '8')
  await next()

  // ---- Background: Soldier ----
  await page.click('[data-testid=background-soldier]')
  await next()

  // ---- Skills: Fighter picks 2 (perception, survival) ----
  await page.click('[data-testid=skill-perception]')
  await page.click('[data-testid=skill-survival]')
  await next()

  // ---- Describe (name prefilled) -> Portrait (optional) -> Review ----
  await next() // describe
  await next() // portrait (skip — optional)

  // ---- Finish ----
  await page.click('button:has-text("Enter the Realm")')
  await page.waitForURL('**/player', { timeout: 12000 })
  ok(true, 'Finishing creation routes to /player')
  await page.waitForSelector(`text=${NAME}`, { timeout: 8000 }).catch(() => {})
  ok(await page.locator(`text=${NAME}`).first().isVisible(), 'Player sheet shows the new character')

  // ---- DB assertions ----
  const { data: rows } = await supabase.from('characters').select('*').ilike('name', NAME).limit(1)
  const row = rows?.[0]
  ok(Boolean(row), 'Character row exists in DB')
  if (row) {
    const sheet = row.sheet || {}
    eq(sheet.abilities?.scores?.strength, 17, 'STR 15 + Mountain Dwarf +2 = 17')
    eq(sheet.abilities?.scores?.constitution, 16, 'CON 14 + Dwarf +2 = 16')
    eq(sheet.hp?.max, 13, 'HP = 10 (d10) + CON mod (+3) = 13')
    eq(row.max_hp, 13, 'flat max_hp mirrored = 13')
    eq(sheet.ac, 11, 'AC = 10 + DEX mod (+1) = 11')
    eq(Object.keys(sheet.proficiencies?.skills || {}).length, 4, '2 class + 2 background skills = 4')
    eq(row.class, 'Fighter', 'flat class mirrored = Fighter')
    eq(row.race, 'Dwarf', 'flat race mirrored = Dwarf')
    eq(row.level, 1, 'level = 1')
  }
} catch (err) {
  fail++
  console.log('❌ threw: ' + err.message)
} finally {
  // ---- Cleanup ----
  await supabase.from('characters').delete().ilike('name', NAME)
  await ctx.close()
  await browser.close()
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
