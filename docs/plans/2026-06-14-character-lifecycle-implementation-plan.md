# Implementation Plan — Self-Service Accounts & Character Lifecycle

**Date:** 2026-06-14
**Spec:** `docs/specs/2026-06-14-character-lifecycle-design.md` (read it first)
**Approach:** build in stages S1→S7; each stage ends with `npm run build` clean + a Playwright
e2e in `scripts/` + the existing e2e suite still green, before starting the next.

> Read `CLAUDE.md` (project root) before starting — it has the path/npm rules, Supabase setup,
> realtime gotchas, and how to run/test.

---

## Data model (target)

`sessions` += `join_code text`.
`characters` keeps flat columns `id, session_id, name, level, current_hp, max_hp, class, race`
and adds `subrace text, subclass text, background text, alignment text, avatar_url text,
sheet jsonb default '{}'`. Legacy columns stay nullable. **`sheet` is canonical**; on every save
mirror `level/max_hp/current_hp/class/race/subclass/avatar_url` back to flat columns so the
existing combat tracker, party cards, and realtime keep working untouched.

`sheet` shape — see the spec. Key branches: `identity, abilities{base,improvements,method},
hp{max,current,temp,hitDice}, proficiencies{skills,saves,armor,weapons,tools,languages},
features[], spellcasting|null, inventory[], currency, ac, speed, combatState, progression[], meta`.

---

## S1 — Self-service accounts (join code = password)

**Schema (run in Supabase SQL editor):**
```sql
alter table public.sessions add column if not exists join_code text;
update public.sessions set join_code = 'mithral' where name = 'Demo Campaign'; -- demo
```

**Code:**
- `src/lib/auth.js` → rewrite `loginWithPin` as `loginWithCode(name, code)`:
  1. `code === session.dm_pin` (any session) → `{role:'dm', session}`.
  2. `code === session.join_code` + character with that name exists → `{role:'player', character, session}`.
  3. `code === join_code` + name free → `{action:'signup', session, name}`.
  4. else error. (Keep legacy per-character `pin` match as a fallback so demo Thrain/1234 still works.)
- `src/store/useStore.js` → add `pendingSignup {session, name}` + setter.
- `src/pages/Login.jsx` → relabel to name + "campaign code"; on `signup` action store pendingSignup and `navigate('/create')`.
- `src/App.jsx` → add `/create` route → `CreateCharacter`, guarded by `pendingSignup`.

**Verify:** `scripts/e2e-accounts.mjs` — new name + code `mithral` → lands on creation; existing
Thrain/1234 still loads sheet; DM blank/9999 still loads dashboard. Existing `e2e-login` green.

---

## S2 — Creation core (no spells/subclass yet)

**Schema:**
```sql
alter table public.characters
  add column if not exists subrace text,
  add column if not exists subclass text,
  add column if not exists background text,
  add column if not exists alignment text,
  add column if not exists avatar_url text,
  add column if not exists sheet jsonb not null default '{}'::jsonb;
```

**Data — `src/data/srd/`:**
- `races.js` — 9 races (+ common subraces): ability bonuses, speed, languages, racial traits,
  proficiencies. Source the ability-increase table from the PHB summary (in `scripts/phb.txt`).
- `classes.js` — 12 classes: hit die, saving-throw profs, armor/weapon profs, skill list + count,
  starting equipment options, primary ability, whether it casts.
- `backgrounds.js` — standard backgrounds: 2 skill profs, tools/languages, feature, starting gear/gold.
- `pointbuy.js` — cost table {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9}; standard array [15,14,13,12,10,8].
- `index.js` — re-exports.

**Engine — `src/lib/rules.js`** (pure, unit-tested):
- `effectiveAbilities(base, race, subrace, improvements)`
- `deriveSheet(choices)` → `{abilities, hp, ac, speed, proficiencies, saves, features, equipment, currency}`
  using `abilityModifier`/`proficiencyBonus` already in `src/lib/dnd.js`.

**Wizard — `src/pages/CreateCharacter.jsx` + `src/components/create/`:**
`RaceStep, ClassStep, AbilitiesStep (Standard/PointBuy/Roll tabs), BackgroundStep, SkillsStep,
DescribeStep (name, alignment, personality), ReviewStep` + a live `CharacterSummary` panel.
Finish → `deriveSheet` → insert character (flat cols + `sheet`) → `login()` → `/player`.
Use design skills (`impeccable`, `high-end-visual-design`) for the RPG feel.

**Refactor:** `PlayerView.jsx` / `AbilityScores.jsx` read from `sheet` when present, else fall back
to legacy flat columns (so demo Thrain still renders). Keep HP write-through on `current_hp`.

**Verify:** `scripts/e2e-create.mjs` — sign up → build a Mountain-Dwarf Fighter, Standard Array →
assert in DB: STR/CON bonuses applied, HP = 10 + CON mod, AC = 10 + DEX mod, 2 class + 2 background
skills, and the sheet renders. `npm run build` + full suite green.

---

## S3 — Casters: subclass + spell selection

- `src/data/srd/subclasses.js` — subclass options + the level each class chooses (Cleric/Sorcerer/
  Warlock at 1; others note "chosen at level N"). `SubclassStep` only shows when level-1 relevant.
- Spells via Open5e (`src/lib/open5e.js`): **verify class filtering first** — v1 spells expose a
  `dnd_class` string; fetch `/v1/spells/?search=` then filter by class + level client-side, or use
  the documented class param. Add `spellsByClass(className, level)` helper.
- `SpellsStep` — pick cantrips + known/prepared per class rules; store in `sheet.spellcasting`
  ({ability, cantrips, known, prepared, slots}).

**Verify:** `scripts/e2e-create-caster.mjs` — build a Wizard, pick cantrips + 1st-level spells →
assert `sheet.spellcasting` populated and slots correct.

---

## S4 — Level-up wizard (2→20)

- `src/components/levelup/LevelUpWizard.jsx` driven by `rules.js`:
  HP (roll or class average), new class features for the level, **subclass at its level**,
  **ASI(+2/+1+1) or Feat at 4/8/12/16/19**, new spells/slots, proficiency-bonus bump.
- Append `{level, choices, hpGain}` to `sheet.progression`; re-`deriveSheet`; mirror flat columns.
- Entry point on `PlayerView` (button enabled when DM grants a level — add a DM "grant level"
  action on party cards, or a simple level stepper for now).

**Verify:** `scripts/e2e-levelup.mjs` — take a Fighter 1→2: HP increases by roll/avg + CON, features
added, proficiency bonus still +2 (it bumps at 5). Level a caster to gain a slot.

---

## S5 — Inventory & combat state

- `src/components/InventoryPanel.jsx` (player + DM): add/remove/equip/attune items, currency
  cp/sp/ep/gp/pp, encumbrance vs STR×15, **AC auto-recomputed** from equipped armor + DEX (rules.js).
- Combat state on `sheet.combatState`: temp HP, conditions (use Open5e conditions list), exhaustion,
  death saves. Surface on `PlayerView`; wire conditions/temp-HP into the existing combat tracker.

**Verify:** `scripts/e2e-inventory.mjs` — add + equip chain shirt → AC updates; spend gold; add a
condition → shows on sheet. Death-save tracker toggles.

---

## S6 — Avatars (gallery + upload)

- Supabase Storage: create public bucket `avatars` (SQL in CLAUDE.md / Supabase dashboard).
- `src/data/portraits.js` — curated preset gallery (class/race vibes).
- `PortraitStep` (in creation) + edit-on-sheet: pick preset OR upload file → Supabase Storage →
  public URL → `avatar_url` (+ `sheet.identity.avatarUrl`).
- Show portrait on `PlayerView` header, DM party cards, and combat (optional).

**Verify:** `scripts/e2e-avatar.mjs` — pick a preset (avatar_url set); upload a small image (URL set,
image renders). Storage RLS allows anon upload to `avatars`.

---

## S7 — Integration & polish

- Fully migrate sheet/party reads to `sheet`; drop reliance on legacy ability columns (keep columns).
- Mobile pass on the wizard (one step per screen, big tap targets) + RPG visual polish with
  `impeccable` / `ui-ux-pro-max`.
- Update existing `scripts/e2e-*.mjs` for any selector changes; full suite green; update `README.md`.

---

## Cross-cutting reminders (don't repeat past bugs — see CLAUDE.md)

- **Realtime race:** after creating a row you'll interact with immediately, `await refetch()` —
  don't rely on the realtime echo of your own insert. Hooks already `refetch()` on `SUBSCRIBED`.
- **StrictMode double-create:** guard mount-effect inserts with a `useRef(false)` flag (see
  `SessionNotes.jsx`).
- **Path:** always `Set-Location "F:\APPS\DnD Companion"` before npm/node.
- **Artifacts:** every plan/spec/doc stays inside `F:\APPS\DnD Companion\docs\`.
- **Testing:** Playwright installed `--no-save`; two-context tests prove live sync; reset demo data
  (Thrain, Demo Campaign join `mithral`/DM `9999`) after each test.
