# D&D Companion — Project Guide (read this first)

A real-time web companion for a D&D group (5–6 players + 1 DM). Players see their own character
sheet; the DM gets a dashboard with combat control. Everything syncs live via Supabase Realtime.

**Phases 1–9 AND the self-service character lifecycle (S1–S7) are built and verified.** See
`docs/PROJECT-STATUS.md` for current state + how to resume (esp. on a new machine). Design/plan refs:
`docs/specs/2026-06-14-character-lifecycle-design.md`,
`docs/plans/2026-06-14-character-lifecycle-implementation-plan.md`.
Repo: https://github.com/billymfant/Dnd-Companion (push/pull to sync across machines).

## ⚠️ Environment rules (important)
- **Project path:** `F:\APPS\DnD Companion`. The harness may report the cwd as the old
  `F:\APPS\D&D Companion` (an almost-empty leftover). **Always `Set-Location "F:\APPS\DnD Companion"`
  before running npm/node.** The folder must NOT contain `&` — it breaks npm's Windows script runner.
- **Shell:** PowerShell (primary) + a Bash tool. The harness resets shell cwd between commands.
- **Keep all artifacts in-app:** every plan/spec/doc goes in `F:\APPS\DnD Companion\docs\`, never in
  `C:\Users\...\.claude`. The user works from Windows Explorer and can't see out-of-tree files.
- **Skills:** 56 skills are installed in `.claude/skills/` (hidden dot-folder; visible index at
  `docs/INSTALLED-SKILLS.txt`). Use `impeccable`/`high-end-visual-design`/`ui-ux-pro-max` for UI,
  `test-driven-development`/`systematic-debugging`/`verification-before-completion` for quality.

## Tech stack
React 18 + Vite 5 · Tailwind v4 (`@tailwindcss/vite`) · React Router 6 · Zustand 4 (persisted) ·
`@supabase/supabase-js` v2 · Open5e API for rules data. Dark-fantasy theme (Cinzel headings).

## Run & test
```
Set-Location "F:\APPS\DnD Companion"
npm install
npm run dev      # http://localhost:5173  (Network URL = phones on same Wi-Fi)
npm run build    # type/import sanity check — run after every change
```
- E2E tests: `scripts/e2e-*.mjs` (Node + Playwright). Playwright is installed `--no-save`
  (`npm install playwright --no-save && npx playwright install chromium`). Tests open TWO browser
  contexts (DM + player) to prove live sync, and clean up demo data after.
- Helpers: `scripts/seed-demo.mjs` (seeds demo data), `scripts/extract-pdf.mjs` (dumps the PHB to
  `scripts/phb.txt` for rules lookups — `pdf-parse` is `--no-save`).

## Supabase
- Config in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Uses the **publishable** key.
  Never use/commit the secret key. `.env` is gitignored.
- Schema in `supabase/schema.sql` (already applied). Tables: `sessions, characters, combat,
  dice_rolls, notes`. RLS is open to `anon` (private friends' game; PIN/code matching, no JWT auth).
- Realtime is enabled on `characters, combat, dice_rolls`.
- **Verify table existence with a real `.select()`, not a `head:true` request** (head requests don't
  surface a missing-table error — that once caused a false "connected" positive).

## Demo logins (seeded)
- **Player:** name `Thrain`, PIN `1234`  ·  **DM:** blank name, PIN `9999`  ·  Campaign "Demo Campaign".
- Future join-code login: name + campaign `join_code` (planned `mithral` for the demo).

## Architecture map (`src/`)
- `lib/supabase.js` — client (+ `isSupabaseConfigured`). `lib/auth.js` — PIN/code login.
- `lib/dnd.js` — pure 5e helpers (modifiers, skills, dice). `lib/open5e.js` — rules API (v1 endpoints).
- `lib/characters.js`, `lib/combat.js`, `lib/dice.js`, `lib/notes.js` — data ops per feature.
- `hooks/useRealtimeList.js`, `hooks/useRealtimeRow.js`, `hooks/useCombat.js` — live data.
- `store/useStore.js` — session/role/character (persisted to localStorage).
- `pages/` — `Login`, `PlayerView`, `DMView` (tabbed: Party/Combat/Dice/Rules/Notes).
- `components/` — feature components + `components/ui/` primitives (`Card,Button,Modal,HPBar,NumberStepper`).

## Realtime gotchas (already fixed — keep the patterns)
1. **Subscribe race:** don't rely on the realtime echo of your OWN insert (the channel may not be
   connected yet). Hooks `refetch()` on `status === 'SUBSCRIBED'`; for create-then-use flows also
   `await refetch()` right after the insert (see `CombatTracker` "Start").
2. **StrictMode double-create:** mount-effect inserts run twice in dev → duplicate rows. Guard with a
   `useRef(false)` "didInit" flag (see `SessionNotes.jsx`).

## Data model direction (lifecycle work)
Keep fast flat columns (`name,level,current_hp,max_hp,class,race,subclass,avatar_url`) for
combat/realtime/party, and store the full evolving character in a new `sheet jsonb` (abilities,
proficiencies, features, spells, inventory, currency, conditions, progression log). Mirror flat
columns from `sheet` on save. A shared `lib/rules.js` + `data/srd/*` derives stats for both creation
and level-up. Full details in the spec + implementation plan under `docs/`.
