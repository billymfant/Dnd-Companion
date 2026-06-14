// End-to-end test of S5 — inventory & combat state.
// Seeds a Fighter, equips a chain shirt (AC recomputes), spends gold, adds a
// condition, and toggles death saves; asserts each lands in the DB. Cleans up.
// Requires dev server + migration. Run: node scripts/e2e-inventory.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { deriveSheet } from '../src/lib/rules.js'
import { abilityModifier } from '../src/lib/dnd.js'

const BASE = 'http://localhost:5173'
const SESSION = '00000000-0000-0000-0000-000000000001'
let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }
const eq = (a, b, m) => ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`)

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const NAME = 'Invfighter' + Date.now()
const sheet = deriveSheet({
  identity: { name: NAME }, raceKey: 'human', classKey: 'fighter', backgroundKey: 'soldier', level: 1,
  abilities: { method: 'standard', base: { strength: 15, dexterity: 13, constitution: 12, intelligence: 10, wisdom: 12, charisma: 8 } },
  classSkills: ['athletics', 'perception'],
})
const dexMod = abilityModifier(sheet.abilities.scores.dexterity)
const expectedArmoredAC = 13 + Math.min(dexMod, 2) // chain shirt

async function seed() {
  const sc = sheet.abilities.scores
  const { error } = await sb.from('characters').insert({
    session_id: SESSION, name: NAME, pin: 'mithral', sheet,
    level: 1, class: 'Fighter', race: 'Human', max_hp: sheet.hp.max, current_hp: sheet.hp.current,
    strength: sc.strength, dexterity: sc.dexterity, constitution: sc.constitution,
    intelligence: sc.intelligence, wisdom: sc.wisdom, charisma: sc.charisma,
  })
  if (error) throw new Error('seed failed: ' + error.message)
}

async function fetchSheet() {
  const { data } = await sb.from('characters').select('*').ilike('name', NAME).single()
  return data
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext()
const page = await ctx.newPage()

try {
  await seed()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', NAME)
  await page.fill('#pin', 'mithral')
  await page.click('button[type=submit]')
  await page.waitForURL('**/player', { timeout: 8000 })
  await page.waitForSelector('text=🎒 Inventory', { timeout: 8000 })

  // Add + equip a chain shirt
  await page.selectOption('[data-testid=add-armor-select]', 'chain-shirt')
  await page.click('[data-testid=add-armor-btn]')
  await page.waitForSelector('[data-testid^=equip-]', { timeout: 8000 })
  await page.locator('[data-testid^=equip-]').first().click()
  await page.waitForTimeout(1200)
  let row = await fetchSheet()
  eq(row.sheet.ac, expectedArmoredAC, `AC recomputed with chain shirt = ${expectedArmoredAC}`)
  ok(row.sheet.inventory.some((i) => i.name === 'Chain Shirt' && i.equipped), 'Chain shirt is equipped in DB')

  // Spend gold
  await page.fill('[data-testid=currency-gp]', '3')
  await page.waitForTimeout(1000)
  row = await fetchSheet()
  eq(row.sheet.currency.gp, 3, 'Gold updated to 3')

  // Add a condition
  await page.click('[data-testid=condition-Poisoned]')
  await page.waitForTimeout(1000)
  row = await fetchSheet()
  ok(row.sheet.combatState.conditions.includes('Poisoned'), 'Poisoned condition saved')

  // Death saves
  await page.click('[data-testid=death-success-2]')
  await page.waitForTimeout(1000)
  row = await fetchSheet()
  eq(row.sheet.combatState.deathSaves.successes, 2, 'Death-save successes = 2')
} catch (err) {
  fail++
  console.log('❌ threw: ' + err.message)
} finally {
  await sb.from('characters').delete().ilike('name', NAME)
  await ctx.close()
  await browser.close()
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
