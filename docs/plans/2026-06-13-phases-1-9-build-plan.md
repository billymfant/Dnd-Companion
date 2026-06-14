# D&D Companion — Build Plan for Phases 3–9

## Context
Phases 1–2 are done and verified: Vite + React + Tailwind v4 + Router + Zustand + Supabase
scaffold (`F:\APPS\dnd-companion`), a live database with all 5 tables, and a working PIN-based
login that routes players to `/player` and the DM to `/dm`. Both views are currently placeholders.

This plan fills in the actual functionality (Phases 3–9): the DM's character manager and combat
tools, the player's live character sheet, a shared dice roller, rules lookup, session notes, and a
final polish pass. The defining requirement is **real-time sync** — when the DM changes HP or
advances a turn, every player's phone updates instantly via Supabase Realtime (not polling).

## Shared building blocks (built first, reused everywhere)
- **`src/lib/dnd.js`** — pure helpers: `abilityModifier(score)` (`floor((score-10)/2)`, formatted `+2`/`-1`),
  the 18 D&D skills with their governing ability, proficiency-bonus by level, and a `rollDice(type, count)` helper.
- **`src/lib/open5e.js`** — fetch wrappers for `https://api.open5e.com` (spells, monsters, conditions),
  with error handling and basic in-memory caching. Used in Phase 7.
- **`src/hooks/useRealtimeList.js`** — subscribes to a table filtered by `session_id`, returns live rows +
  helpers; does an initial fetch then listens to postgres_changes. Reused by combat, dice log, characters.
- **`src/hooks/useRealtimeRow.js`** — subscribes to a single row by id (player's own character for live HP).
- **`src/components/ui/`** — small themed primitives: `Card`, `Button`, `Modal`, `NumberStepper`, `HPBar`.
  Keeps the dark-fantasy theme consistent and the page files short.

## Phase 3 — DM character manager (`src/pages/DMView.jsx` + `src/components/CharacterForm.jsx`)
- DM dashboard lists all characters in the session as cards (name, class/race/level, live HP bar).
- "＋ New character" and "Edit" open a `Modal` with `CharacterForm`: name, PIN, class, race, level,
  max/current HP, the six ability scores (showing auto-calculated modifiers), backstory.
- Create/update/delete against the `characters` table; list is driven by `useRealtimeList` so it
  reflects changes live. PIN is shown to the DM so they can hand it to each player.
- Replace the demo "Thrain" seed only when the DM chooses (delete button per card).

## Phase 4 — Player character sheet (`src/pages/PlayerView.jsx` + components)
- Reads the logged-in character via `useRealtimeRow` so **HP changes from the DM appear instantly**.
- Sections: header (name/class/race/level + HP bar), `AbilityScores` (score + modifier grid),
  `SkillsList` (18 skills with proficiency toggles persisted to the character's `abilities` jsonb),
  `SpellSlots` (per-level used/total trackers persisted to `spell_slots` jsonb), equipment/backstory.
- Player can adjust their own current HP (heal/damage buttons) which syncs to the DM.

## Phase 5 — Real-time combat tracker (`src/components/CombatTracker.jsx` + `InitiativeOrder.jsx`)
- One `combat` row per session (`combatants` jsonb, `current_turn`, `is_active`).
- DM: add combatants (pull players from the session, or add monsters manually), enter/auto-roll
  initiative, sort, advance/previous turn, damage/heal any combatant, end combat. Damaging a
  **player** combatant also writes through to that character's `current_hp`.
- Player view shows a read-only `InitiativeOrder` panel highlighting whose turn it is — driven by
  `useRealtimeList`/row so it updates live.

## Phase 6 — Shared dice roller (`src/components/DiceRoller.jsx` + `RollLog.jsx`)
- Buttons for d4/d6/d8/d10/d12/d20/d100, optional count + modifier + label. Each roll inserts into
  `dice_rolls`. A shared `RollLog` (newest first, capped) subscribes via `useRealtimeList` so **all
  players and the DM see every roll instantly**. Present on both player and DM views.

## Phase 7 — Spell & rules lookup (`src/components/RulesLookup.jsx`, DM view)
- Tabbed lookup using `src/lib/open5e.js`: search spells (card with level/school/casting/desc),
  search monsters (stat block: AC/HP/speed/abilities/actions), and a conditions reference list.
- Read-only reference; no DB writes.

## Phase 8 — DM session notes (`src/components/SessionNotes.jsx` + `NpcTracker.jsx`)
- One `notes` row per session. Auto-saving notepad (debounced) writing `content`; `NpcTracker`
  manages an `npcs` jsonb array (name, role, notes, add/edit/remove). Saved per session.

## Phase 9 — Polish
- Consistent dark-fantasy theme pass, mobile-responsive layouts (tab/section navigation on small
  screens for the DM dashboard), loading & empty states, error boundaries around data fetches,
  and a friendly message when Supabase is unreachable. Update `README.md` feature checklist.

## Files
- New libs/hooks: `src/lib/dnd.js`, `src/lib/open5e.js`, `src/hooks/useRealtimeList.js`, `src/hooks/useRealtimeRow.js`
- New UI primitives: `src/components/ui/{Card,Button,Modal,NumberStepper,HPBar}.jsx`
- New feature components: `CharacterForm`, `AbilityScores`, `SkillsList`, `SpellSlots`, `CombatTracker`,
  `InitiativeOrder`, `DiceRoller`, `RollLog`, `RulesLookup`, `SessionNotes`, `NpcTracker` (under `src/components/`)
- Rewritten pages: `src/pages/DMView.jsx`, `src/pages/PlayerView.jsx`
- Realtime requires the publication added in `supabase/schema.sql` (already applied) — no schema changes needed.

## Verification
- Build check: `npm run build` after each phase (catches import/syntax errors).
- Data layer: extend `scripts/` helpers to seed and assert reads/writes per table.
- **Realtime, the critical bit**: a Playwright script opens two browser contexts (DM + player), has
  the DM change HP / advance a turn / roll dice, and asserts the player context updates without reload.
- Manual: dev server already running at `http://192.168.1.202:5173/` for phone testing with the
  seeded demo (player `Thrain`/`1234`, DM blank/`9999`).
- Cleanup: temporary test/seed scripts and the `--no-save` Playwright install stay out of `package.json`.
