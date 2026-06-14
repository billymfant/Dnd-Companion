// End-to-end test of S4 — the level-up wizard.
// Seeds a level-1 Fighter and Wizard (via the pure rules engine), logs in as
// each, runs the level-up wizard, and asserts the DB advanced correctly.
// Requires dev server + migration. Run: node scripts/e2e-levelup.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { deriveSheet } from '../src/lib/rules.js'

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

// Insert a character from a derived sheet (mirrors lib/characters.createCharacterFromSheet).
async function seed(name, sheet) {
  // Name the sheet so the flat-column mirror on level-up keeps the right name.
  sheet.identity.name = name
  if (sheet.build?.identity) sheet.build.identity.name = name
  const sc = sheet.abilities.scores
  const { error } = await sb.from('characters').insert({
    session_id: SESSION, name, pin: 'mithral', sheet,
    level: sheet.level, class: sheet.class, race: sheet.identity.race,
    max_hp: sheet.hp.max, current_hp: sheet.hp.current,
    strength: sc.strength, dexterity: sc.dexterity, constitution: sc.constitution,
    intelligence: sc.intelligence, wisdom: sc.wisdom, charisma: sc.charisma,
  })
  if (error) throw new Error('seed failed: ' + error.message)
}

const fighterSheet = deriveSheet({
  identity: { name: '' }, raceKey: 'human', classKey: 'fighter', backgroundKey: 'soldier', level: 1,
  abilities: { method: 'standard', base: { strength: 15, dexterity: 13, constitution: 14, intelligence: 10, wisdom: 12, charisma: 8 } },
  classSkills: ['athletics', 'perception'],
})
const wizardSheet = deriveSheet({
  identity: { name: '' }, raceKey: 'human', classKey: 'wizard', backgroundKey: 'sage', level: 1,
  abilities: { method: 'standard', base: { strength: 8, dexterity: 14, constitution: 13, intelligence: 14, wisdom: 12, charisma: 10 } },
  classSkills: ['investigation', 'medicine'],
  spellSelections: { cantrips: ['Fire Bolt', 'Light', 'Mage Hand'], spells: ['Magic Missile', 'Shield', 'Sleep', 'Mage Armor', 'Detect Magic', 'Burning Hands'] },
})

const FIGHTER = 'Lvlfighter' + Date.now()
const WIZARD = 'Lvlwizard' + Date.now()
const browser = await chromium.launch({ headless: true })

async function levelUp(name, { pickSubclass = false } = {}) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', name)
  await page.fill('#pin', 'mithral')
  await page.click('button[type=submit]')
  await page.waitForURL('**/player', { timeout: 8000 })
  await page.click('[data-testid=level-up-btn]')
  await page.waitForSelector('[data-testid=confirm-levelup]', { timeout: 8000 })
  if (pickSubclass) {
    // pick the first real subclass option (the level grants it)
    const opts = await page.locator('[data-testid=levelup-subclass] option').all()
    if (opts.length > 1) await page.selectOption('[data-testid=levelup-subclass]', await opts[1].getAttribute('value'))
  }
  await page.click('[data-testid=confirm-levelup]')
  await page.waitForTimeout(1500) // let the save + realtime settle
  await ctx.close()
}

try {
  await seed(FIGHTER, fighterSheet)
  await seed(WIZARD, wizardSheet)

  const fighterBeforeHp = fighterSheet.hp.max // 10 + CON mod(+2) = 12
  await levelUp(FIGHTER)
  const { data: f } = await sb.from('characters').select('*').ilike('name', FIGHTER).single()
  eq(f.sheet.level, 2, 'Fighter advanced to level 2')
  eq(f.level, 2, 'flat level mirrored to 2')
  eq(f.sheet.hp.max, fighterBeforeHp + 8, 'Fighter HP grew by avg(6) + CON(+2) = 8')
  eq(f.max_hp, fighterBeforeHp + 8, 'flat max_hp mirrored')
  ok(f.sheet.features.some((x) => x.name === 'Action Surge'), 'Fighter gained Action Surge')

  await levelUp(WIZARD, { pickSubclass: true }) // Wizard chooses Arcane Tradition at level 2
  const { data: w } = await sb.from('characters').select('*').ilike('name', WIZARD).single()
  eq(w.sheet.level, 2, 'Wizard advanced to level 2')
  eq(w.sheet.spellcasting.slots['1'].total, 3, 'Wizard gained a slot (2 → 3 first-level)')
  ok(w.sheet.identity.subclass, 'Wizard recorded an Arcane Tradition')
} catch (err) {
  fail++
  console.log('❌ threw: ' + err.message)
} finally {
  await sb.from('characters').delete().ilike('name', FIGHTER)
  await sb.from('characters').delete().ilike('name', WIZARD)
  await browser.close()
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
