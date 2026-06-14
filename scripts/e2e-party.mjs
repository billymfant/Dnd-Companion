// E2E test for Phase 3: DM character manager (create / edit / delete).
// Requires dev server on :5173 and seeded demo (DM PIN 9999).
import { chromium } from 'playwright'
const BASE = 'http://localhost:5173'
let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext()
const page = await ctx.newPage()
page.on('dialog', (d) => d.accept()) // auto-accept delete confirms

// Log in as DM
await page.goto(BASE)
await page.waitForLoadState('networkidle')
await page.fill('#pin', '9999')
await page.click('button[type=submit]')
await page.waitForURL('**/dm', { timeout: 8000 }).catch(() => {})
ok(page.url().endsWith('/dm'), 'DM reaches dashboard')

// Party tab is default; demo character should load (wait for async fetch)
await page.waitForSelector('text=Thrain', { timeout: 10000 })
ok(true, 'Demo character Thrain listed')

// Create a new character
const TESTNAME = 'E2E_Tester_' + Date.now().toString().slice(-5)
await page.click('text=＋ New character')
await page.waitForSelector('text=New character', { timeout: 5000 })
await page.fill('input[placeholder="Thrain"]', TESTNAME)
await page.fill('input[placeholder="1234"]', '7777')
await page.fill('input[placeholder="Fighter"]', 'Wizard')
await page.fill('input[placeholder="Dwarf"]', 'Elf')
await page.click('text=Create character')
await page.waitForSelector(`text=${TESTNAME}`, { timeout: 8000 })
ok(await page.locator(`text=${TESTNAME}`).isVisible(), 'New character appears in party list (realtime)')

// Edit it: change class via the edit modal
const card = page.locator('.bg-panel', { hasText: TESTNAME }).first()
await card.getByText('Edit').click()
await page.waitForSelector('text=Edit ' + TESTNAME, { timeout: 5000 })
const classInput = page.locator('input[placeholder="Fighter"]')
await classInput.fill('Sorcerer')
await page.click('text=Save changes')
await page.waitForSelector('text=Sorcerer', { timeout: 8000 })
ok(true, 'Edit saved (class changed to Sorcerer)')

// Delete it (cleanup)
const card2 = page.locator('.bg-panel', { hasText: TESTNAME }).first()
await card2.getByText('Delete').click()
await page.waitForTimeout(1500)
ok(!(await page.locator(`text=${TESTNAME}`).isVisible().catch(() => false)),
   'Character deleted (removed from list)')

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
