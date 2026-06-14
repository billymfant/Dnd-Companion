// End-to-end browser test of S1 — self-service accounts (join code = password).
// Assumes the dev server is running on http://localhost:5173 and the demo data
// is seeded (Demo Campaign join_code 'mithral', DM 9999, Thrain/1234).
// Run: node scripts/e2e-accounts.mjs
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }

const browser = await chromium.launch({ headless: true })

async function freshPage() {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  return { ctx, page }
}

// ---- 1. New name + campaign code -> character creation ----
{
  const { ctx, page } = await freshPage()
  const newName = 'Newbie' + Date.now()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', newName)
  await page.fill('#pin', 'mithral')
  await page.click('button[type=submit]')
  await page.waitForURL('**/create', { timeout: 8000 }).catch(() => {})
  ok(page.url().endsWith('/create'), 'New name + join code routes to /create')
  // The creation wizard prefills the new name into its live summary panel.
  await page.waitForSelector('text=Forge Your Hero', { timeout: 8000 }).catch(() => {})
  ok(
    (await page.textContent('body').catch(() => '') || '').includes(newName),
    'Creation wizard carries the new character name'
  )
  await ctx.close()
}

// ---- 2. Existing player via legacy PIN still works ----
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', 'Thrain')
  await page.fill('#pin', '1234')
  await page.click('button[type=submit]')
  await page.waitForURL('**/player', { timeout: 8000 }).catch(() => {})
  ok(page.url().endsWith('/player'), 'Legacy Thrain/1234 still routes to /player')
  await page.waitForSelector('text=Thrain', { timeout: 8000 }).catch(() => {})
  ok(await page.locator('text=Thrain').first().isVisible(), 'Player view shows "Thrain"')
  await ctx.close()
}

// ---- 3. Existing player via NEW join-code path ----
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', 'Thrain')
  await page.fill('#pin', 'mithral')
  await page.click('button[type=submit]')
  await page.waitForURL('**/player', { timeout: 8000 }).catch(() => {})
  ok(page.url().endsWith('/player'), 'Existing player via join code routes to /player')
  await ctx.close()
}

// ---- 4. DM login still works ----
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#pin', '9999')               // name left blank
  await page.click('button[type=submit]')
  await page.waitForURL('**/dm', { timeout: 8000 }).catch(() => {})
  ok(page.url().endsWith('/dm'), 'DM blank/9999 routes to /dm')
  ok((await page.content()).includes('DM Dashboard'), 'DM dashboard renders')
  await ctx.close()
}

// ---- 5. Bad code shows an error, stays on login ----
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', 'Nobody')
  await page.fill('#pin', 'wrongcode')
  await page.click('button[type=submit]')
  await page.waitForSelector('[role=alert]', { timeout: 8000 }).catch(() => {})
  const alert = await page.locator('[role=alert]').textContent().catch(() => '')
  ok(/no campaign or character/i.test(alert || ''), 'Bad code shows error message')
  ok(page.url().endsWith('/') || page.url() === BASE + '/', 'Bad code stays on login screen')
  await ctx.close()
}

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
