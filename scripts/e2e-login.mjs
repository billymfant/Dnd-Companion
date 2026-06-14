// End-to-end browser test of the Phase 2 login flow.
// Assumes the dev server is running on http://localhost:5173.
// Run: node scripts/e2e-login.mjs
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }

const browser = await chromium.launch({ headless: true })

async function freshPage() {
  const ctx = await browser.newContext()       // fresh localStorage each time
  const page = await ctx.newPage()
  return { ctx, page }
}

// ---- 1. Player login ----
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', 'Thrain')
  await page.fill('#pin', '1234')
  await page.click('button[type=submit]')
  await page.waitForURL('**/player', { timeout: 8000 }).catch(() => {})
  ok(page.url().endsWith('/player'), 'Player login routes to /player')
  // PlayerView loads the character async, so wait for the name to render.
  await page.waitForSelector('text=Thrain', { timeout: 8000 }).catch(() => {})
  ok(await page.locator('text=Thrain').first().isVisible(), 'Player view shows character name "Thrain"')
  await ctx.close()
}

// ---- 2. DM login ----
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#pin', '9999')               // name left blank
  await page.click('button[type=submit]')
  await page.waitForURL('**/dm', { timeout: 8000 }).catch(() => {})
  ok(page.url().endsWith('/dm'), 'DM login routes to /dm')
  ok((await page.content()).includes('DM Dashboard'), 'DM dashboard renders')
  ok((await page.content()).includes('Demo Campaign'), 'DM dashboard shows campaign name')
  await ctx.close()
}

// ---- 3. Bad login shows error, stays on login ----
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', 'Nobody')
  await page.fill('#pin', '0000')
  await page.click('button[type=submit]')
  await page.waitForSelector('[role=alert]', { timeout: 8000 }).catch(() => {})
  const alert = await page.locator('[role=alert]').textContent().catch(() => '')
  ok(/no campaign or character/i.test(alert || ''), 'Bad login shows error message')
  ok(page.url().endsWith('/') || page.url() === BASE + '/', 'Bad login stays on login screen')
  await ctx.close()
}

// ---- 4. Persistence: reload keeps player logged in ----
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', 'Thrain')
  await page.fill('#pin', '1234')
  await page.click('button[type=submit]')
  await page.waitForURL('**/player', { timeout: 8000 }).catch(() => {})
  await page.goto(BASE)                          // revisit root after "refresh"
  await page.waitForLoadState('networkidle')
  ok(page.url().endsWith('/player'), 'Persisted session redirects root -> /player')
  await ctx.close()
}

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
