# D&D Companion — Roadmap & Resume Point

**Last updated:** 2026-06-15 · For resuming in a fresh session. See also `docs/PROJECT-STATUS.md`.

## ✅ Done & on `main`
- **Phases 1–9 + character lifecycle S1–S7** (pre-existing).
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

## ⚠️ Action needed
- **`main` is ~15 commits ahead of `origin/main` — not yet pushed.** Run `git push` to sync
  across machines (specs, plans, extractor, education layer).

## 📋 Ready to build (plans already written)
- **5.5e (2024) ruleset** — `docs/plans/2026-06-15-education-layer-5.5e-2024.md`. Adds a ruleset
  toggle + 2024 species/backgrounds/classes (ability bonuses from background, not species). Mostly
  transcription from `scripts/5.5e.txt` + plumbing. Source-traceable; do not invent 2024 numbers.

## 🎯 NEXT FEATURE (chosen): Admin / Story authoring → first slice = **Campaign Codex**
Spec NOT yet written — design was agreed in brainstorming on 2026-06-15. Resume by writing the spec
(`docs/specs/`) then the plan, then build.

**Decisions locked:**
- **Audience model = Hybrid reveal:** DM authors lore privately, toggles individual entries as
  "revealed" → they appear in a read-only player journal. Live via realtime.
- **First slice = Campaign story & lore** (a "campaign bible": story beats, NPCs, locations, factions).
  Later slices: quest roadmap, rewards handout (items/XP/gold to sheets), session recaps.

**Agreed design (v1):**
1. **New table `lore_entries`:** `id`, `session_id` (FK cascade), `category` (text:
   story|npc|location|faction), `title`, `body` (text), `revealed` (bool default false),
   `sort_order` (int), `created_at`, `updated_at`. Add to the RLS array + realtime publication +
   `replica identity full` (same pattern as other tables in `supabase/schema.sql`).
2. **`src/lib/lore.js`:** `listLore`, `createLore`, `updateLore`, `toggleReveal`, `deleteLore`
   (mirrors `lib/notes.js`).
3. **DM "Codex" tab in `DMView`:** entries grouped by category; create/edit (title + body textarea),
   per-entry reveal toggle (👁), delete. Reuse `Card`/`Button`/`Modal`.
4. **Player "Journal" section in `PlayerView`:** read-only, shows ONLY `revealed` entries grouped by
   category; empty state "Your DM hasn't shared any lore yet."
5. **Realtime:** both views use `useRealtimeList` on `lore_entries` filtered by `session_id`
   (player filters `revealed === true`). StrictMode-guard create flows (existing pattern).
6. **Testing:** `scripts/e2e-lore.mjs` proving DM-create → reveal → player-sees; `npm run build`.
- **Coexistence note:** keep the existing `NpcTracker` (NPCs in `notes.npcs`) as the DM's quick
  combat scratchpad; the Codex is the separate revealable lore system. Possible future merge.
- **Open question for next session:** confirm names "Codex" (DM) / "Journal" (player), or pick others.
- **Out of scope v1:** quest roadmap, rewards handout, recaps, rich-text editor, drag-reorder UI.

## Also noted (smaller, from PROJECT-STATUS)
- DM combat tracker is a bit basic — candidate for the **DM Companion** direction (condition effects
  on initiative, advantage/DC helpers, rules-at-the-table). Strong differentiator; not yet chosen.
- Learn new spells on level-up for known casters; gate player Level-Up behind DM grant; richer
  seeded demo caster.

## How to resume next session
1. `git pull` (and push the pending 15 commits if not already done).
2. Read this file + `docs/PROJECT-STATUS.md`.
3. Pick up at "NEXT FEATURE": write the Campaign Codex spec → plan → build (subagent-driven).
