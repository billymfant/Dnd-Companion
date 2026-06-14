# D&D Companion — Self-Service Accounts & Character Lifecycle (Design Spec)

**Date:** 2026-06-14
**Status:** Approved design → ready for implementation planning

## Context

The app (Phases 1–9, built & verified) currently has the DM create every character and
assign a PIN. The owner wants players to **self-create accounts and build their own
characters**, and — critically — the system must support each character's **entire life in a
campaign**: leveling up, gaining features, learning spells, managing inventory, and combat
state. The character builder and data model must be designed for that full lifecycle now,
even though implementation is staged.

Reference understood from the D&D 5e Player's Handbook (read in full for the creation chapter)
and the D&D Beyond builder structure. We are **not** copying any UI.

## Goals

1. Players self-serve: sign up and build a character without the DM.
2. Faithful 5e character creation (full: races/subraces, all classes + subclasses, backgrounds,
   feats, spells, equipment).
3. A character that **evolves**: guided level-ups (2→20), inventory & currency, growing
   proficiencies/features, and combat state (temp HP, conditions, exhaustion, death saves).
4. Character avatars: pick from a preset gallery **and** upload a custom image.
5. Keep everything already built (realtime sync, combat tracker, dice, notes) working.

## Decisions (locked)

- **Auth model:** the campaign **join code is the password**. Login = name + code (every time).
  `code == dm_pin` → DM; `code == session.join_code` + existing character with that name → that
  player; `code == join_code` + new name → character creation (signup). No per-player passwords.
- **Ability scores:** offer **Standard Array** (default), **Point Buy** (27 pts), **Roll 4d6
  drop lowest**. Racial bonuses auto-applied.
- **Avatars:** preset gallery **+** upload to Supabase Storage.
- **Content:** **Full 5e** incl. subclasses, feats, spells.
- **v1 is single-class** (no multiclassing), but `classes` is modeled as a list so multiclass
  can be added later without a rewrite.

## Architecture

### Data model — "thin columns + one rich document"

Keep fast, queryable flat columns for the systems that already depend on them (combat, realtime,
party cards), and store the full evolving character as a JSON document.

**`sessions`** — add:
- `join_code text` — the shared campaign password players use.

**`characters`** — keep existing flat columns used by combat/realtime/party:
`id, session_id, name, level, current_hp, max_hp, class, race, avatar_url`.
Add:
- `subclass text`, `subrace text`, `background text`, `alignment text`, `avatar_url text`
- `sheet jsonb default '{}'` — **canonical** rich character document (see below).

The legacy columns (`strength…charisma`, `spell_slots`, `abilities`, `equipment`, `pin`) remain
nullable for backward-compat during migration; the player sheet is refactored to read from
`sheet`. Flat `level/max_hp/current_hp/class/race/subclass/avatar_url` are **mirrored** from
`sheet` on every save so combat/party keep working unchanged.

**`sheet` jsonb document shape:**
```
{
  identity:   { name, alignment, background, race, subrace, class, subclass, avatarUrl, description,
                personality: { traits, ideals, bonds, flaws }, backstory },
  abilities:  { base: {str,dex,con,int,wis,cha}, improvements:[{level,source,changes}],
                method: "standard|pointbuy|roll" },         // effective = base + improvements + race
  hp:         { max, current, temp, hitDice: { total, spent, die } },
  proficiencies: { skills:{key:'prof|expertise'}, saves:[...], armor:[...], weapons:[...],
                   tools:[...], languages:[...] },
  features:   [ { name, source, level, desc, choice? } ],    // class/race/feat features + chosen options
  spellcasting: { ability, cantrips:[...], known:[...], prepared:[...],
                  slots: { 1:{total,used}, ... } } | null,
  inventory:  [ { id, name, qty, weight, type, equipped, attuned, desc } ],
  currency:   { cp, sp, ep, gp, pp },
  ac:         number, speed: number,
  combatState:{ conditions:[...], exhaustion:0, deathSaves:{ successes, failures } },
  progression:[ { level, choices:{...}, hpGain } ],          // append-only log of each level-up
  meta:       { createdAt, schemaVersion }
}
```

**Supabase Storage:** a public-read `avatars` bucket for uploaded portraits.

### Rules engine (the heart) — `src/data/srd/*` + `src/lib/rules.js`

Static SRD data modules (`races.js`, `classes.js`, `subclasses.js`, `backgrounds.js`, `feats.js`,
`pointbuy.js`) hold the mechanical rules: ability bonuses, hit die, proficiencies granted,
skill-choice options, starting equipment, subclass level & options, feature lists per level.

`rules.js` is a pure derivation layer used by **both creation and level-up**:
- `abilityModifier`, `proficiencyBonus(level)` (already in `lib/dnd.js`, reused)
- `deriveSheet(choices)` → computes effective abilities, HP, AC, save DCs, speed, languages,
  spell slots, proficiency lists from the character's choices + SRD data.
Keeping derivation in one tested place means creation and leveling never drift.

**Spells** are fetched from **Open5e** (already wired in `src/lib/open5e.js`), filtered by class
and level, rather than bundled — confirmed approach; spell-by-class filtering verified during
planning.

### Creation wizard — `src/pages/CreateCharacter.jsx` + `src/components/create/*`

RPG-style multi-step flow with a persistent "character so far" summary panel:

`Race → Class → Subclass(if lvl-1) → Abilities → Background → Skills/Proficiencies →
Spells(casters) → Feats(optional) → Equipment → Describe → Portrait → Review & Finish`

Each step is a card-based screen using the installed design skills (`impeccable`,
`high-end-visual-design`) for a premium, game-like feel. "Finish" runs `deriveSheet`, writes the
character + mirrored flat columns, logs the player in.

### Level-up wizard — `src/components/levelup/*`

Triggered from the player sheet ("Level Up" when the DM grants it / XP milestone). Guided:
HP (roll or average), new class features, **subclass at its level**, **ASI or Feat at
4/8/12/16/19**, new spells/slots, proficiency-bonus updates. Same `deriveSheet` engine; appends
to `sheet.progression`.

### Inventory & combat-state systems

- **Inventory panel** (player + DM editable): add/remove/equip/attune items, currency cp–pp,
  encumbrance vs. STR×15, AC auto-recomputed from equipped armor + DEX.
- **Combat lifecycle**: temp HP, conditions, exhaustion, death saves — surfaced on the sheet and
  integrated with the existing combat tracker.

## Player sheet & DM integration

The existing player sheet (Phase 4) is refactored to read from `sheet` and gains: portrait,
race/class/subclass header, inventory, spell management, conditions, and the Level-Up entry.
DM party cards show portrait + class/level. All realtime/combat behavior is preserved (flat
columns still mirror the live values).

## Staged implementation (each stage built & verified before the next)

- **S1 — Accounts:** `join_code` schema, signup/login toggle, routing to creation.
- **S2 — Creation core:** SRD data + `rules.js`; wizard for race/class/abilities/background/
  skills/describe with derived HP/AC/profs/speed/languages/equipment; write `sheet`.
- **S3 — Casters:** subclass selection + spell selection via Open5e.
- **S4 — Level-up:** progression wizard (features, ASI/feat, HP, spells).
- **S5 — Inventory & combat-state:** items, currency, conditions, death saves.
- **S6 — Avatars:** preset gallery + Supabase Storage upload.
- **S7 — Integration & polish:** refactor sheet/party to `sheet`, mobile, RPG visual pass.

## Verification

- Pure `rules.js` derivation has unit-style checks (e.g., Fighter d10 + CON → correct HP;
  point-buy cost totals; racial bonuses).
- Playwright e2e per stage in `scripts/`: signup → build a character → assert derived stats land
  in DB and render on the sheet; level-up changes; inventory edits; avatar upload; two-context
  realtime still green.
- `npm run build` after each stage; existing e2e suite must stay passing.

## Out of scope (v1)

Multiclassing, homebrew content, encounter/XP automation, marketplace. Data model leaves room
for these later.
