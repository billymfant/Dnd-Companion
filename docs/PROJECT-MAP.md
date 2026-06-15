# Project Map & Resume Guide (this machine)

**Last updated:** 2026-06-15 · **Repo:** https://github.com/billymfant/Dnd-Companion
**Companion docs:** `docs/PROJECT-STATUS.md` (feature status), `CLAUDE.md` (project guide).

> ⚠️ **Path note for this machine:** the project lives at **`D:\apps\DnD Companion`**.
> `CLAUDE.md` and `PROJECT-STATUS.md` still reference the old `F:\APPS\DnD Companion` path — that was
> a different computer. On *this* machine always work from `D:\apps\DnD Companion`. The folder must
> NOT contain an `&` (it breaks npm's Windows script runner) — `DnD` is fine, the old `D&D` was not.

---

## ✅ Current state on this machine (set up 2026-06-15)
This is a fresh checkout on the D: drive. Everything below is **done and verified**:

1. **Repo cloned** into `D:\apps\DnD Companion`.
   - The dir already held a `.claude/` folder, so a plain `git clone` refused. Set up instead via
     `git init` → `git remote add origin …` → `git fetch` → `git checkout -b main --track origin/main`.
   - On branch `main`, at commit `8a33c5b` ("Add resume guide and mark lifecycle complete").
2. **Dependencies installed** — `npm install` (90 packages). `npm audit` shows 2 advisories
   (1 moderate, 1 high); left as-is (no `--force` fix run).
3. **Database** — user ran `supabase/schema.sql` in the Supabase SQL Editor. Schema + demo data live.
4. **`.env` created** (gitignored, so not in the repo) with the hosted project's URL + publishable key:
   ```
   VITE_SUPABASE_URL=https://zpdqpwouzebsazfzubge.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_3M72qDzExid-FZI0AQ3YVA_n8O9jH06
   ```
   - The dashboard link given was `…/dashboard/project/zpdqpwouzebsazfzubge`; the **API URL** the app
     needs is derived from that project ref → `https://zpdqpwouzebsazfzubge.supabase.co`.
   - Supabase renamed keys: the old **anon** key is now the **publishable** key (`sb_publishable_…`).
     Safe to ship in a browser. **Never** use the secret key (`sb_secret_…`).
5. **Connection verified** — a REST `select` on `sessions` returned the seeded **Demo Campaign** row.
6. **Dev server running** — `npm run dev` → http://localhost:5173 (HTTP 200). Network URL for phones
   on the same Wi-Fi: http://192.168.10.221:5173.

---

## 🧰 Skill set (installed 2026-06-15, now synced via git)
Imported the full skill library from `D:\apps\AE_PLUGINS\.claude\skills` into `.claude/skills/`:
- **281 discoverable top-level skills** (each a `<name>/SKILL.md` folder). Index: `docs/INSTALLED-SKILLS.txt`.
- 25 of those were bare `.md` files in a non-standard format; converted into proper `SKILL.md`
  folders via `scripts/fix-loose-skills.mjs` so Claude Code discovers them.
- **`.claude/skills/composio-skills/` = 833 nested API connectors**, left nested *by choice* — they're
  irrelevant to this app and would bloat every session's context. Inert but present; flatten one on demand.
- **Now tracked in git.** `.gitignore` was changed from a blanket `.claude/` ignore to
  `.claude/*` + `!.claude/skills/`, so the skill set rides the repo to every machine while
  `.claude/settings.local.json` stays local. A `!.claude/skills/**/*.pdf` exception keeps skill demo
  PDFs while the copyrighted PHB stays excluded.
- ⚠️ Skills register at **session start** — newly added/converted ones go live on the *next* session.

---

## ▶ Run it
```powershell
Set-Location "D:\apps\DnD Companion"
npm install        # first time / after pulling dep changes
npm run dev        # http://localhost:5173  (Network URL = phones on same Wi-Fi)
npm run build      # type/import sanity check — run after every change
```
**Demo logins:** Player `Thrain` / PIN `1234` · DM (blank name) / PIN `9999` ·
New hero: any new name + campaign code **`mithral`** → character-creation wizard.

---

## 🗺️ Codebase map (`src/`)
- **Entry/routing** — `pages/Login.jsx`, `pages/PlayerView.jsx`, `pages/DMView.jsx`
  (DM is tabbed: Party / Combat / Dice / Rules / Notes).
- **Supabase + auth** — `lib/supabase.js` (client + `isSupabaseConfigured`), `lib/auth.js` (PIN/code).
- **Rules engine** — `lib/rules.js` (derives HP/AC/saves/slots; shared by creation + level-up),
  `lib/dnd.js` (pure 5e helpers), `data/srd/*` (SRD data). `lib/open5e.js` (rules API lookups).
- **Feature data ops** — `lib/characters.js`, `lib/combat.js`, `lib/dice.js`, `lib/notes.js`.
- **Live data hooks** — `hooks/useRealtimeList.js`, `hooks/useRealtimeRow.js`, `hooks/useCombat.js`.
- **State** — `store/useStore.js` (session/role/character, persisted to localStorage).
- **UI** — `components/` (feature components) + `components/ui/` primitives
  (`Card, Button, Modal, HPBar, NumberStepper`).
- **DB schema** — `supabase/schema.sql`. Tables: `sessions, characters, combat, dice_rolls, notes`.
  Character stored as canonical `sheet jsonb`; flat columns mirrored from it on save.

---

## 🔁 Daily git workflow
- **Start:** `git pull`
- **End:** `git add -A && git commit -m "…" && git push`
- CI (`.github/workflows/ci.yml`) runs build + rules unit checks on every push.

## 🧪 Testing
```powershell
node scripts/test-rules.mjs        # pure unit checks (no server/DB needed)
# e2e (need dev server running + Supabase reachable) — installs Playwright --no-save:
npm install playwright --no-save && npx playwright install chromium
node scripts/e2e-create.mjs        # creation wizard → derived stats (see README for full list)
```

## 👉 Possible next steps (from PROJECT-STATUS, not yet done)
- Richer seeded demo character (pre-built caster) so a demo login shows all lifecycle features.
- Learn **new spells on level-up** for known casters (currently scales slots only).
- Gate the player **Level Up** button behind a DM "grant level" action.
- Wire player conditions/temp-HP into the DM combat tracker's initiative view.
- Repo description + topics (needs `gh auth login`).
