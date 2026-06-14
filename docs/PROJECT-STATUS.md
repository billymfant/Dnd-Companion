# Project Status & Resume Guide

**Last updated:** 2026-06-14 · **Repo:** https://github.com/billymfant/Dnd-Companion

## Where we are
All planned work is **built and verified**:
- **Phases 1–9** (login, DM dashboard, player sheet, realtime combat, dice, rules lookup, notes, polish).
- **Self-service character lifecycle, stages S1–S7** (see
  `docs/plans/2026-06-14-character-lifecycle-implementation-plan.md`):
  - S1 accounts (join code = password) · S2 creation wizard + rules engine ·
    S3 caster subclass/spells · S4 level-up 2→20 · S5 inventory & combat state ·
    S6 avatars (gallery + upload) · S7 integration & polish.

**Verification:** `node scripts/test-rules.mjs` = 48 unit checks; the `scripts/e2e-*.mjs`
suite (~88 checks) is green; `npm run build` clean.

## Resuming on another computer
1. `git clone https://github.com/billymfant/Dnd-Companion.git`
   - **Important:** clone/keep it in a folder path **without an `&`** (it breaks npm's Windows
     script runner). On Windows, `cd` into the repo before running npm/node.
2. `npm install`
3. **Create `.env`** (it's gitignored, so it won't be in the clone). Copy `.env.example` → `.env`
   and fill in:
   ```
   VITE_SUPABASE_URL=https://zpdqpwouzebsazfzubge.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_3M72qDzExid-FZI0AQ3YVA_n8O9jH06
   ```
   (The anon/`publishable` key is a public client key — fine to copy around. Never use the secret key.)
4. `npm run dev` → open the printed `http://localhost:5173` (the Network URL is for phones on Wi-Fi).
5. (Optional, for e2e tests) `npm install playwright --no-save && npx playwright install chromium`.

**No database setup needed** on the new machine — both computers talk to the *same* hosted Supabase
project, and its schema/migration is already applied (join_code, `sheet` columns, `avatars` bucket).

## Demo logins
- Player: **Thrain** / `1234` (legacy demo char — basic sheet only).
- DM: blank name / `9999`.
- New full character: any new name + campaign code **`mithral`** → runs the creation wizard.
  (The lifecycle panels — Level Up, Inventory, Combat State, Portrait, Spellbook — only show for
  characters built with the wizard.)

## Daily git workflow
- **Start of session:** `git pull`
- **End of session:** `git add -A && git commit -m "…" && git push`
- CI (`.github/workflows/ci.yml`) runs build + rules unit checks on every push (see the Actions tab).

## Testing
```
node scripts/test-rules.mjs        # pure unit checks (no server/DB needed)
# e2e (need the dev server running + Supabase reachable):
node scripts/e2e-create.mjs        # creation wizard, etc. — see README for the full list
```

## Possible next steps (not yet done)
- Repo **description + topics** (needs `gh auth login`, then I can set them).
- Optional richer seeded demo character (a pre-built caster) so login shows all features without building one.
- Learning **new spells on level-up** for known casters (S4 currently scales slots; spell-picking on
  level-up was deferred — add a spells section to `LevelUpWizard`).
- Gate the player **Level Up** button behind a DM "grant level" action (currently always available).
- Wire player conditions/temp-HP into the DM combat tracker's initiative view.
