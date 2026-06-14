# ⚔️ D&D Companion

A real-time web companion for a Dungeons & Dragons group (5–6 players + 1 DM).
Players see their own character sheet; the DM gets a full dashboard with combat
control. Everything syncs live across phones and laptops via Supabase Realtime.

## Tech stack
- React + Vite
- Tailwind CSS v4 (dark fantasy theme)
- React Router (navigation)
- Zustand (local state, persisted to localStorage)
- Supabase (database + realtime sync)
- Open5e API (spells / monsters / conditions — free, no key)

## First-time setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create your Supabase project** (free tier) at https://supabase.com

3. **Create the database tables**
   - Open your project → **SQL Editor** → **New query**
   - Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and **Run**

4. **Add your keys**
   - Copy `.env.example` to `.env`
   - Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
     (Supabase → Project Settings → API)

5. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open the printed `http://localhost:5173`. The **Network** URL it prints
   (e.g. `http://192.168.x.x:5173`) is what phones on the same Wi-Fi use.

## Features (all phases complete ✅)
1. ✅ Supabase + scaffold
2. ✅ Login — **name + campaign code** (the join code is the password; no separate accounts)
3. ✅ DM character manager (create/edit characters)
4. ✅ Player character sheet — live HP, ability modifiers, skill proficiencies, spells
5. ✅ Real-time combat tracker — initiative, turns, damage/heal with write-through to player sheets
6. ✅ Shared dice roller — all dice types, live shared roll log
7. ✅ Spell & rules lookup (Open5e — spells, monster stat blocks, conditions)
8. ✅ DM session notes — autosaving notepad + NPC tracker
9. ✅ Polish — dark-fantasy theme, Cinzel headings, mobile layouts, error boundary

## Character lifecycle (self-service) ✅
Players sign up themselves with the campaign code and build a full 5e character that
evolves over the campaign:
- **Self-service accounts** — a new name + the campaign code starts character creation;
  an existing name + code logs you back in. `code == DM code` → DM dashboard.
- **Creation wizard** — race (+subrace), class, abilities (Standard Array / Point Buy /
  Roll 4d6), background, skills, subclass & spells for casters, describe, portrait, review.
  All stats (HP, AC, saves, proficiencies, slots) are derived by a tested rules engine
  (`src/lib/rules.js`) shared with level-up so the two never drift.
- **Level-up (2→20)** — guided HP, new class features, subclass at its level, ASI/Feat at
  4/8/12/16/19, and spell-slot scaling.
- **Inventory & combat state** — items, currency, encumbrance, AC auto-recompute from
  equipped armor, plus temp HP, conditions, exhaustion, and death saves.
- **Avatars** — preset gallery + custom upload to Supabase Storage.

The character is stored as a canonical `sheet jsonb` document; fast flat columns
(`level, current_hp, class, …`) are mirrored from it on every save so combat/realtime/party
keep working unchanged. SRD rules data lives in `src/data/srd/`.

> **Storage:** custom avatar uploads need a public `avatars` bucket. The SQL for it (and
> the `join_code` / `sheet` columns) is included in [`supabase/schema.sql`](supabase/schema.sql).

## Try it
Seeded demo (after running the schema): player **Thrain** / PIN **1234**, DM (blank name) /
PIN **9999**, or sign up a brand-new hero with any name + campaign code **mithral**.

## Testing
End-to-end Playwright tests live in `scripts/` (`e2e-*.mjs`). They drive two browser
contexts to verify live sync, assert derived stats in the DB, and clean up after themselves.
Playwright is a dev-only tool installed with `--no-save`:
```bash
npm install playwright --no-save && npx playwright install chromium

node scripts/test-rules.mjs        # pure rules-engine unit checks (no browser)
node scripts/e2e-accounts.mjs      # self-service login / signup routing
node scripts/e2e-create.mjs        # creation wizard → derived stats in DB
node scripts/e2e-create-caster.mjs # caster: subclass + spell selection
node scripts/e2e-levelup.mjs       # level-up: HP, features, spell slots
node scripts/e2e-inventory.mjs     # inventory, AC recompute, combat state
node scripts/e2e-avatar.mjs        # preset + uploaded portraits
node scripts/e2e-sheet.mjs         # player sheet + live HP sync
# plus e2e-login / e2e-party / e2e-combat / e2e-dice / e2e-notes / e2e-rules
```
