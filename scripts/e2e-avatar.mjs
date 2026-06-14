// End-to-end test of S6 — avatars (preset gallery + upload).
// Builds a character choosing a preset portrait, then uploads a custom image on
// the sheet; asserts avatar_url in the DB for both. Cleans up char + storage.
// Requires dev server + migration + avatars bucket. Run: node scripts/e2e-avatar.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { PORTRAITS } from '../src/data/portraits.js'

const BASE = 'http://localhost:5173'
let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }
const eq = (a, b, m) => ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`)

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

// Write a tiny PNG to a temp file for the upload test.
const pngBytes = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63f8cfc0f01f0005000100ff5f9a9c0000000049454e44ae426082', 'hex')
const tmp = join(tmpdir(), 'dnd-e2e'); mkdirSync(tmp, { recursive: true })
const pngPath = join(tmp, 'portrait.png'); writeFileSync(pngPath, pngBytes)

const NAME = 'Avatarhero' + Date.now()
const presetUrl = PORTRAITS.find((p) => p.key === 'warrior').url

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext()
const page = await ctx.newPage()

try {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.fill('#name', NAME)
  await page.fill('#pin', 'mithral')
  await page.click('button[type=submit]')
  await page.waitForURL('**/create', { timeout: 8000 })
  const next = () => page.click('button:has-text("Next")')

  await page.click('[data-testid=race-human]'); await next()
  await page.click('[data-testid=class-fighter]'); await next()
  await page.selectOption('[data-testid=ability-strength]', '15')
  await page.selectOption('[data-testid=ability-constitution]', '14')
  await page.selectOption('[data-testid=ability-dexterity]', '13')
  await page.selectOption('[data-testid=ability-wisdom]', '12')
  await page.selectOption('[data-testid=ability-intelligence]', '10')
  await page.selectOption('[data-testid=ability-charisma]', '8')
  await next()
  await page.click('[data-testid=background-soldier]'); await next()
  await page.click('[data-testid=skill-perception]')
  await page.click('[data-testid=skill-survival]')
  await next()
  await next() // describe (name prefilled)

  // Portrait step: choose the Warrior preset
  await page.waitForSelector('[data-testid=portrait-warrior]', { timeout: 8000 })
  await page.click('[data-testid=portrait-warrior]')
  await next() // review
  await page.click('button:has-text("Enter the Realm")')
  await page.waitForURL('**/player', { timeout: 12000 })

  let { data: row } = await sb.from('characters').select('*').ilike('name', NAME).single()
  eq(row.avatar_url, presetUrl, 'Preset portrait saved to avatar_url')
  eq(row.sheet.identity.avatarUrl, presetUrl, 'Preset portrait saved in sheet.identity')

  // Upload a custom portrait from the sheet
  await page.click('[data-testid=portrait-edit]')
  await page.waitForSelector('[data-testid=portrait-upload]', { state: 'attached', timeout: 8000 })
  await page.setInputFiles('[data-testid=portrait-upload]', pngPath)
  await page.waitForTimeout(2500) // upload + save
  ;({ data: row } = await sb.from('characters').select('*').ilike('name', NAME).single())
  ok(/\/storage\/v1\/object\/public\/avatars\//.test(row.avatar_url || ''), 'Uploaded portrait URL points to the avatars bucket')
} catch (err) {
  fail++
  console.log('❌ threw: ' + err.message)
} finally {
  // cleanup: remove uploaded storage object + character
  let url = ''
  try {
    const { data: row } = await sb.from('characters').select('avatar_url').ilike('name', NAME).single()
    url = row?.avatar_url || ''
  } catch { /* ignore */ }
  const marker = '/avatars/'
  if (url.includes(marker)) {
    const path = url.slice(url.indexOf(marker) + marker.length)
    await sb.storage.from('avatars').remove([path]).catch(() => {})
  }
  await sb.from('characters').delete().ilike('name', NAME)
  await ctx.close()
  await browser.close()
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
