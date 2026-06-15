# Campaign Codex — Design Spec

**Date:** 2026-06-15 · **Status:** Approved for build · **Feature slice:** Admin/Story authoring → slice 1
**Refs:** `docs/ROADMAP.md` (decisions locked 2026-06-15), `supabase/schema.sql`, `src/lib/notes.js`,
`src/hooks/useRealtimeList.js`.

## 1. Goal
Give the DM a private place to author campaign lore (story beats, NPCs, locations, factions) and
selectively **reveal** individual entries to players. Revealed entries appear live in a read-only
player **Journal**. This is the first slice of the larger Admin/Story direction; later slices (quest
roadmap, rewards handout, session recaps) are explicitly out of scope here.

## 2. Names (locked)
- DM-side authoring tab: **Codex**.
- Player-side read-only section: **Journal**.

## 3. Audience model — Hybrid reveal
- The DM authors entries privately; nothing is visible to players until the DM toggles an entry's
  `revealed` flag on.
- Players see a read-only Journal containing **only** `revealed === true` entries.
- Reveal/unreveal propagates live via Supabase Realtime (same pattern as combat/dice).

## 4. Data model
New table `lore_entries` (one row per lore item, many per session). Mirrors the conventions already
in `supabase/schema.sql`:

```sql
create table if not exists public.lore_entries (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  category    text not null default 'story',  -- story | npc | location | faction
  title       text not null,
  body        text not null default '',
  revealed    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

Schema wiring (match the existing `do $$ … foreach` blocks, do not hand-roll new patterns):
- Add `'lore_entries'` to the **RLS** array → enable RLS + open `anon_all_lore_entries` policy.
- Add `'lore_entries'` to the **realtime publication** array.
- `alter table public.lore_entries replica identity full;` (so UPDATE/DELETE payloads carry full row).

The migration is **append-only and idempotent** (`create table if not exists`, guarded publication
add). Applied via the Supabase SQL editor on the shared hosted project — note this in the plan as a
manual deploy step (no local DB).

## 5. Data layer — `src/lib/lore.js`
Mirrors `lib/notes.js` style (thin wrappers, `console.error` on failure, return data/error). No
realtime here — the hook owns that.

- `listLore(sessionId)` → all entries for a session, ordered by `category` then `sort_order`.
- `createLore(sessionId, { category, title, body })` → insert; returns the new row.
- `updateLore(id, patch)` → update fields; always bump `updated_at`.
- `toggleReveal(id, revealed)` → convenience wrapper over `updateLore` setting `revealed`.
- `deleteLore(id)` → delete by id.

## 6. DM "Codex" tab (`src/components/CampaignCodex.jsx`)
- Add a tab to `DMView.jsx` `TABS`: `{ key: 'codex', label: '📕 Codex' }`, rendered as
  `<CampaignCodex sessionId={session?.id} />`.
- Live data via `useRealtimeList('lore_entries', sessionId, { orderBy: 'sort_order' })`.
- Entries **grouped by category** in a fixed order: Story, NPCs, Locations, Factions. Each group
  shows a header and its entries; empty groups show a faint "No entries yet."
- **Create/edit** in a `Modal`: category `<select>`, title `<input>`, body `<textarea>`. Reuse
  `Card`, `Button`, `Modal` from `components/ui/`.
- Each entry card shows title, a truncated body preview, and controls:
  - 👁 reveal toggle (filled when revealed, outline when hidden) → `toggleReveal`.
  - ✏️ edit → opens the modal prefilled.
  - 🗑 delete → confirm, then `deleteLore`.
- A revealed entry is visually marked (e.g. gold "Revealed" chip) so the DM knows what players see.
- **StrictMode guard:** any mount-effect insert must use a `useRef(false)` didInit flag. (Here
  creation is user-triggered, so a guard is only needed if we add an auto-seed; default = none.)

## 7. Player "Journal" section (`src/components/PlayerJournal.jsx`)
- Rendered in `PlayerView.jsx` as a new `<section>` (e.g. after Backstory, before Dice), passing
  `sessionId={character.session_id}`.
- Live data via `useRealtimeList('lore_entries', character.session_id, { orderBy: 'sort_order' })`,
  then **filter to `revealed === true`** client-side.
- Read-only. Entries grouped by the same category order; each shows title + full body
  (`whitespace-pre-wrap`, like Backstory).
- **Empty state** (no revealed entries): "Your DM hasn't shared any lore yet."
- Only render the section heading when there is at least one revealed entry, OR always render with
  the empty state — pick the always-render variant so players learn the feature exists. (Decision:
  always render.)

## 8. Realtime behavior
- Both views subscribe through the existing `useRealtimeList` hook (handles INSERT/UPDATE/DELETE,
  the SUBSCRIBED-refetch race fix, and dedupe). No new realtime plumbing.
- DM reveals an entry → UPDATE fires → player's filtered list re-renders and the entry appears
  (or disappears on unreveal) without a refresh.

## 9. Coexistence
- The existing `NpcTracker` (NPCs stored in `notes.npcs`) stays as the DM's quick combat scratchpad.
  The Codex is the separate, revealable lore system. A future merge is possible but out of scope.

## 10. Testing & verification
- `scripts/e2e-lore.mjs` (Node + Playwright, two browser contexts like the other e2e scripts):
  DM logs in → creates a lore entry → it is NOT in the player Journal → DM reveals it → it appears
  in the player Journal live → DM edits/unreveals → player view updates → cleanup deletes the entry.
- `npm run build` clean (type/import sanity).
- Existing `node scripts/test-rules.mjs` and `node scripts/test-education.mjs` remain green
  (no regressions; this feature is additive).

## 11. Out of scope (v1)
Quest roadmap, rewards handout (items/XP/gold to sheets), session recaps, rich-text editor,
drag-to-reorder UI, per-player (vs per-party) reveal targeting.
