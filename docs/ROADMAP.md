# D&D Companion — Roadmap & Resume Point

**Last updated:** 2026-06-15 · For resuming in a fresh session. See also `docs/PROJECT-STATUS.md`.

## ✅ Done & on `main`
- **Phases 1–9 + character lifecycle S1–S7** (pre-existing).
- **Campaign Codex (Admin/Story slice 1)** — built & verified 2026-06-15.
  - DM **Codex** tab authors private lore (story/NPC/location/faction); 👁 reveal toggles an entry
    into the read-only player **Journal**, live via Realtime.
  - New: `lore_entries` table (`supabase/schema.sql`), `src/lib/lore.js`,
    `src/components/CampaignCodex.jsx`, `src/components/PlayerJournal.jsx`; wired into `DMView`/`PlayerView`.
  - Migration applied to the shared Supabase project. Tests: `node scripts/e2e-lore.mjs` (9 checks)
    green; rules (48) + education (72) still green; `npm run build` clean.
- **Beginner Education Layer (5e 2014)** — MERGED to `main` (fast-forward, 11 commits).
  - ⓘ info popovers, per-step "New to D&D?" primers, synergy match badges, ability-placement
    hints, and beginner spell notes across the whole creation wizard.
  - New files: `src/data/srd/glossary.js`, `synergy.js`, `spellNotes.js`, `src/lib/synergy.js`,
    `src/components/ui/InfoTip.jsx`, `src/components/create/Primer.jsx`, `MatchBadge.jsx`;
    `OptionCard.jsx` gained `info`/`badge` slots; all 7 wizard steps wired.
  - Tests: `node scripts/test-education.mjs` (72 checks) + `node scripts/test-rules.mjs` (48) green;
    `npm run build` clean.
- **PDF extractor** generalized to take input/output args; 2024 source extracted to
  `scripts/5.5e.txt` (gitignored). Source: `DnD 5.5e v1.0 _ GM Binder.pdf` (repo root, gitignored).

## 📋 Ready to build (plans already written)
- **5.5e (2024) ruleset** — `docs/plans/2026-06-15-education-layer-5.5e-2024.md`. Adds a ruleset
  toggle + 2024 species/backgrounds/classes (ability bonuses from background, not species). Mostly
  transcription from `scripts/5.5e.txt` + plumbing. Source-traceable; do not invent 2024 numbers.

## 🎯 NEXT FEATURE candidates (Admin/Story continues)
Campaign Codex slice 1 (lore reveal) is **done**. Natural next slices on the same direction:
- **Quest roadmap** — DM-authored quests/objectives with reveal + status (active/done), player-visible.
- **Rewards handout** — push items/XP/gold from the DM straight onto character sheets.
- **Session recaps** — short revealable per-session summaries (could auto-draft from notes).
- Names confirmed this cycle: **Codex** (DM) / **Journal** (player). Spec + plan for slice 1 live at
  `docs/specs/2026-06-15-campaign-codex-design.md` and `docs/plans/2026-06-15-campaign-codex-implementation-plan.md`.

## Also noted (smaller, from PROJECT-STATUS)
- DM combat tracker is a bit basic — candidate for the **DM Companion** direction (condition effects
  on initiative, advantage/DC helpers, rules-at-the-table). Strong differentiator; not yet chosen.
- Learn new spells on level-up for known casters; gate player Level-Up behind DM grant; richer
  seeded demo caster.

## How to resume next session
1. `git pull`.
2. Read this file + `docs/PROJECT-STATUS.md`.
3. Pick a NEXT FEATURE candidate (quest roadmap / rewards handout / recaps, or the 2024 ruleset):
   brainstorm → spec (`docs/specs/`) → plan (`docs/plans/`) → build.
4. Reminder: a new DB table needs its migration run in the Supabase SQL editor (anon key can't DDL).
