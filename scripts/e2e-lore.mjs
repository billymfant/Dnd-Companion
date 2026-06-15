// E2E for the Campaign Codex: DM authors lore privately, reveals it, and the
// player's read-only Journal updates LIVE. Two browser contexts (DM + player).
// Requires the dev server on http://localhost:5173 and the lore_entries
// migration applied to the shared Supabase project. Run: node scripts/e2e-lore.mjs
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
// clean slate
await sb.from('lore_entries').delete().eq('session_id', SESSION)

const TITLE = 'The Sundered Crown ' + Date.now()
const BODY = 'A relic split into three shards, scattered across the realm.'
const browser = await chromium.launch({ headless: true })

try {
  // ---- Player: login -> Journal starts empty ----
  const pCtx = await browser.newContext()
  const player = await pCtx.newPage()
  await player.goto(BASE); await player.waitForLoadState('networkidle')
  await player.fill('#name', 'Thrain'); await player.fill('#pin', '1234')
  await player.click('button[type=submit]')
  await player.waitForSelector('text=Hit Points', { timeout: 8000 })
  await player.waitForSelector('[data-testid=journal]', { timeout: 8000 })
  ok(await player.locator('text=hasn’t shared any lore yet').first().isVisible(),
     'Player Journal shows empty state before any reveal')

  // ---- DM: login -> Codex tab -> create a (hidden) entry ----
  const dCtx = await browser.newContext()
  const dm = await dCtx.newPage()
  dm.on('dialog', (d) => d.accept()) // accept the delete confirm later
  await dm.goto(BASE); await dm.waitForLoadState('networkidle')
  await dm.fill('#pin', '9999'); await dm.click('button[type=submit]')
  await dm.waitForURL('**/dm', { timeout: 8000 }).catch(() => {})
  await dm.locator('nav button', { hasText: 'Codex' }).click()
  await dm.waitForSelector('text=Campaign Codex', { timeout: 8000 })

  await dm.click('[data-testid=codex-add]')
  await dm.fill('[data-testid=codex-title]', TITLE)
  await dm.fill('[data-testid=codex-body]', BODY)
  await dm.click('[data-testid=codex-save]')
  await dm.waitForSelector(`text=${TITLE}`, { timeout: 8000 })
  ok(true, 'DM created a lore entry in the Codex')

  // ---- Player must NOT see the hidden entry ----
  await player.waitForTimeout(1500)
  ok(!(await player.locator(`[data-testid=journal-entry]:has-text("${TITLE}")`).first().isVisible().catch(() => false)),
     'Hidden entry does NOT appear in the player Journal')

  // ---- DM reveals it -> player sees it LIVE ----
  await dm.locator('[data-testid=codex-reveal]').first().click()
  await player.waitForSelector(`[data-testid=journal-entry]:has-text("${TITLE}")`, { timeout: 8000 }).catch(() => {})
  ok(await player.locator(`[data-testid=journal-entry]:has-text("${TITLE}")`).first().isVisible(),
     'Revealed entry appears in the player Journal LIVE')
  ok(await player.locator(`text=${BODY}`).first().isVisible(),
     'Revealed entry body shows in the player Journal')

  // ---- DB sanity: row exists and is revealed ----
  const { data: rows } = await sb.from('lore_entries').select('*').eq('session_id', SESSION).ilike('title', TITLE)
  const row = rows?.[0]
  ok(Boolean(row), 'Lore entry row exists in DB')
  ok(row?.revealed === true, 'Entry marked revealed in DB')

  // ---- DM hides it again -> player Journal removes it LIVE ----
  await dm.locator('[data-testid=codex-reveal]').first().click()
  await player.waitForTimeout(1500)
  ok(!(await player.locator(`[data-testid=journal-entry]:has-text("${TITLE}")`).first().isVisible().catch(() => false)),
     'Un-revealed entry disappears from the player Journal LIVE')

  // ---- DM deletes the entry ----
  const card = dm.locator('[data-testid=codex-entry]', { hasText: TITLE }).first()
  await card.getByRole('button', { name: '🗑' }).click()
  await dm.waitForTimeout(1000)
  const { data: after } = await sb.from('lore_entries').select('id').eq('session_id', SESSION).ilike('title', TITLE)
  ok((after?.length ?? 0) === 0, 'Deleted entry removed from DB')
} catch (err) {
  fail++
  console.log('❌ threw: ' + err.message)
} finally {
  await sb.from('lore_entries').delete().eq('session_id', SESSION) // cleanup
  await browser.close()
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
