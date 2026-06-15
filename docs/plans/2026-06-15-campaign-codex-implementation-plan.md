# Campaign Codex — Implementation Plan

**Date:** 2026-06-15 · **Spec:** `docs/specs/2026-06-15-campaign-codex-design.md`
**Approach:** small sequential tasks; build after each; e2e at the end. Subagent-driven optional.

## Task 1 — Schema migration (`supabase/schema.sql`)
1. Add the `lore_entries` table (`create table if not exists …`) per spec §4, after the `notes` table.
2. Add `'lore_entries'` to the RLS `foreach` array (creates `anon_all_lore_entries`).
3. Add `'lore_entries'` to the realtime-publication `foreach` array.
4. Add `alter table public.lore_entries replica identity full;` with the other replica-identity lines.
**Verify:** file edits only here; the SQL is applied manually (Task 7).
**Done when:** schema.sql contains the table + all three wirings, idempotent.

## Task 2 — Data layer (`src/lib/lore.js`)
Create the file mirroring `lib/notes.js`: `listLore`, `createLore`, `updateLore`, `toggleReveal`,
`deleteLore` (spec §5). `updateLore` bumps `updated_at`. `console.error` on error; return data/error.
**Verify:** `npm run build` clean.

## Task 3 — DM Codex tab (`src/components/CampaignCodex.jsx` + `DMView.jsx`)
1. Build `CampaignCodex.jsx` per spec §6: `useRealtimeList('lore_entries', sessionId,
   { orderBy: 'sort_order' })`; group by category (Story/NPCs/Locations/Factions); create/edit Modal
   (category select, title input, body textarea); per-entry 👁 reveal / ✏️ edit / 🗑 delete; revealed
   chip. Reuse `Card`/`Button`/`Modal`. Use `data-testid` hooks for e2e (e.g. `codex-add`,
   `codex-title`, `codex-body`, `codex-save`, `codex-reveal`, `codex-entry`).
2. Wire into `DMView.jsx`: add `{ key: 'codex', label: '📕 Codex' }` to `TABS` and the
   `{tab === 'codex' && <CampaignCodex sessionId={session?.id} />}` branch.
**Verify:** `npm run build`; manual: DM can add/edit/reveal/delete.

## Task 4 — Player Journal (`src/components/PlayerJournal.jsx` + `PlayerView.jsx`)
1. Build `PlayerJournal.jsx` per spec §7: `useRealtimeList('lore_entries', sessionId,
   { orderBy: 'sort_order' })`, filter `revealed === true`, group by category, read-only, full body
   `whitespace-pre-wrap`, always-render with empty state. `data-testid="journal"` + `journal-entry`.
2. Render in `PlayerView.jsx` after the Backstory card, before the Dice section, passing
   `sessionId={character.session_id}`.
**Verify:** `npm run build`.

## Task 5 — E2E test (`scripts/e2e-lore.mjs`)
Model on an existing two-context script (e.g. `scripts/e2e-create.mjs`). Flow per spec §10:
DM login → create entry → assert absent from player Journal → reveal → assert present live →
unreveal/edit → assert updates → cleanup (delete entry). Use the demo DM (`9999`) + a player in the
same demo session. Keep counts/asserts explicit; clean up created rows.
**Verify:** dev server running + Supabase reachable → `node scripts/e2e-lore.mjs` green.

## Task 6 — Full verification
- `npm run build` clean.
- `node scripts/test-rules.mjs` (48) + `node scripts/test-education.mjs` (72) still green.
- `node scripts/e2e-lore.mjs` green (server up).

## Task 7 — Deploy migration + docs + commit
1. **Apply `supabase/schema.sql`** in the Supabase SQL editor (shared hosted project) — manual,
   user-run or pasted. Confirm `lore_entries` exists via a real `.select()` (not head:true).
2. Update `docs/ROADMAP.md` (move Codex to Done) and `docs/PROJECT-STATUS.md`.
3. Commit per feature-commit convention; push.

## Risks / notes
- **Realtime needs the table in the publication** — without Task 1.3 the player Journal won't live-update.
- **Manual SQL step** is the only non-code deploy action; flag it clearly so it isn't forgotten.
- Keep `NpcTracker` untouched (coexistence, spec §9).
