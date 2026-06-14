// E2E for Phase 7: Open5e rules lookup (spells / monsters / conditions).
import { chromium } from 'playwright'
const BASE = 'http://localhost:5173'
let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }

const browser = await chromium.launch({ headless: true })
const dm = await browser.newPage()
await dm.goto(BASE); await dm.waitForLoadState('networkidle')
await dm.fill('#pin', '9999'); await dm.click('button[type=submit]')
await dm.waitForURL('**/dm', { timeout: 8000 }).catch(() => {})
await dm.locator('nav button', { hasText: 'Rules' }).click()

// Spells
await dm.fill('input[placeholder^="Search spells"]', 'Fireball')
await dm.getByRole('button', { name: 'Search', exact: true }).click()
await dm.waitForSelector('text=Fireball', { timeout: 12000 }).catch(() => {})
ok(await dm.locator('text=Fireball').first().isVisible(), 'Spell search returns Fireball card')

// Monsters
await dm.getByRole('button', { name: 'Monsters' }).click()
await dm.fill('input[placeholder^="Search monsters"]', 'Goblin')
await dm.getByRole('button', { name: 'Search', exact: true }).click()
await dm.waitForSelector('text=Goblin', { timeout: 12000 }).catch(() => {})
ok(await dm.locator('text=Goblin').first().isVisible(), 'Monster search returns Goblin')
ok(await dm.locator('text=Actions').first().isVisible().catch(() => false), 'Monster stat block shows Actions')

// Conditions
await dm.getByRole('button', { name: 'Conditions' }).click()
await dm.waitForSelector('text=Blinded', { timeout: 12000 }).catch(() => {})
ok(await dm.locator('text=Blinded').first().isVisible(), 'Conditions list loads (Blinded)')
await dm.locator('button:has-text("Frightened")').first().click()
await dm.waitForTimeout(500)
ok(await dm.locator('text=/frightened creature/i').first().isVisible().catch(() => false),
   'Tapping a condition expands its description')

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
