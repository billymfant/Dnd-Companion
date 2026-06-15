# Beginner Onboarding & Education Layer — Design

**Date:** 2026-06-15 · **Status:** Approved (design) → next: implementation plan
**Author:** Billy + Claude

## Goal

Make the character-creation wizard usable by people who have **never played D&D** and
aren't necessarily gamers. Every choice (race, class, subclass, ability scores, skills,
background, alignment, spells/abilities, proficiencies) must be explained in plain
language, in-context, and the wizard should *gently guide* the build with smart hints so a
newcomer ends up with a coherent character. UI/UX must be **friendly** and consistent with
the existing dark-fantasy theme.

This is **additive** to the existing wizard (`src/components/create/*`) — no rewrites.

## Decisions (locked)

- **Synergy = inline smart hints**, not a visual graph. Contextual guidance as you build
  (e.g. pick Wizard → "Intelligence is your key stat" + races that boost it get a match tag;
  the abilities step suggests where to place high scores).
- **Explanations = info-icon (ⓘ) popovers everywhere** + a short collapsible "New to D&D?"
  primer banner at the top of each step. Hover on desktop, tap on mobile.
- **Content depth = rich detail for everything**: what it is + when it shines (+ a short
  in-play example where useful), for every race, class, ability, skill, and the spells
  choosable at creation.
- **Content lives co-located:** abstract concepts in one glossary; per-item copy next to the
  item it describes; synergy as its own pure-data module.
- **Friendly UI** is a hard requirement; apply `ui-ux-pro-max` / `ui-designer-dark-cinematic`
  at build time. Keep code lean per `karpathy-coder` principles (no premature abstraction).
- **Two rulesets, ruleset-aware data:** support both **5e 2014** and **5.5e 2024** ("One D&D")
  as a selectable option, implemented as a `ruleset` dimension in the data — never forked code.
  2014 ships first (existing data); 2024 is authored from the in-repo source in a later phase.

## Ruleset support (5e 2014 + 5.5e 2024)

The app must let players/DM choose a ruleset. The two are not cosmetic variants — 2024 moves
things structurally:
- **Ability score increases come from the *background*, not the race/species** (2014: from race).
- Races are termed **species**; backgrounds grant an **Origin feat**; weapon mastery exists.
- Some skills/spells/feature wordings differ.

**Approach:** introduce a `ruleset` value (`'2014' | '2024'`) threaded through the SRD data and
`lib/rules.js`. The existing SRD files become the **2014** dataset essentially unchanged. A
parallel **2024** dataset (`src/data/srd/2024/*` or per-entry `ruleset` tags — decided in the
plan) holds the 2024 species/backgrounds/classes. A creation-time selector picks the ruleset;
a ruleset only appears as selectable once its content exists, and the default is whichever is
fully populated (2014 first, flip to 2024 when authored). The DM companion (future) reads the
same selector so rulings match the table's chosen edition.

**Source:** `DnD 5.5e v1.0 _ GM Binder.pdf` (repo root, 3.8 MB). Extract sections **on demand**
during the 2024 authoring phase (reuse `scripts/extract-pdf.mjs`) — do not bulk-ingest it.

The **education layer is built ruleset-aware once**: glossary/blurbs/synergy are shared where
the editions agree and branched only where they differ (notably the ability-bonus source, which
changes the synergy hint from "race boosts your key stat" to "background/species boosts it").

## Architecture

### Data layer (the bulk of the "rich detail" work)
- **`src/data/srd/glossary.js`** — concept definitions and per-stat / per-skill explanations.
  - Concepts: race, subrace, class, subclass, alignment, ability score, ability modifier,
    proficiency, proficiency bonus, skill, saving throw, armor class (AC), hit points (HP),
    spell slot, cantrip, prepared vs. known spells.
  - Per ability (6): plain meaning + "what uses it" + short example.
  - Per skill (18): one-line meaning + governing ability + example.
  - Each entry shape: `{ term, short, detail, example?, ability? }`.
- **Extend `src/data/srd/races.js` & `classes.js`** with `blurb` (one-sentence identity) and
  `whenToPick` ("good if you want to…"). Existing trait/feature `desc` is reused as-is.
- **`src/data/srd/synergy.js`** — pure data:
  `keyAbilities[classKey]`, `recommendedRaces[classKey]`, `abilityPriority[classKey]`.
- **`src/data/srd/spellNotes.js`** — curated "when it's good" beginner notes keyed by spell
  slug, for the common SRD cantrips + 1st-level spells. Falls back to the Open5e `desc`
  (already fetched) when a spell isn't listed. No notes authored above level 1.

### Pure logic — `src/lib/synergy.js` (unit-testable, mirrors `lib/rules.js`)
- `raceMatch(classKey, raceKey) → 'great' | 'good' | null` — derived from whether the race
  (incl. subrace bonuses) boosts the class's key ability.
- `keyAbilitiesFor(classKey) → [abilityKey]`.
- `suggestAbilityOrder(classKey) → [abilityKey]` (highest-priority first) for placement hints.

### Reusable UI primitives
- **`src/components/ui/InfoTip.jsx`** — the single ⓘ control used everywhere.
  - Accessible: real `<button>`, `aria-expanded`/`aria-label`, opens a popover; closes on
    Esc, outside-click, and blur; keyboard-focusable. Hover-open on desktop, tap-open on
    touch. Props: `title`, `children` (string or node), optional `ability` tag.
- **`src/components/create/Primer.jsx`** — collapsible "New to D&D?" banner; takes a glossary
  key (or array) and renders the concept(s). Remembers collapsed state per step in the store
  so veterans can dismiss it.
- **`src/components/create/MatchBadge.jsx`** — small "✦ Great match" / "Good match" /
  "Key stat" tag, fed by `synergy.js`. Friendly, non-blocking (guidance, never a gate).

### Applied across existing steps (additive only)
| Step | Additions |
|------|-----------|
| `RaceStep` | Card ⓘ (blurb + traits), per-trait ⓘ, `MatchBadge` vs. chosen class. Primer: "What's a race?" |
| `ClassStep` | Card ⓘ (blurb + whenToPick), ⓘ on saving throws & each proficiency, key-ability badge. Primer: "What's a class?" |
| `AbilitiesStep` | Per-stat ⓘ (what each ability does), inline hint highlighting the class's key stats + suggested placement order from `suggestAbilityOrder`. Primer: "Ability scores & modifiers." |
| `SkillsStep` | Each selectable skill gets an ⓘ (meaning + governing ability). Primer: "Skills & proficiencies." |
| `BackgroundStep` | ⓘ on each granted skill + the background feature. Alignment explained here (ⓘ if an alignment field exists; otherwise covered in the primer). Primer: "Background & alignment." |
| `SubclassStep` | Per-feature ⓘ. |
| `SpellsStep` | Per-spell ⓘ → Open5e `desc` + curated `spellNotes` "when it's good." Primer: "Spells, cantrips & spell slots." |

`OptionCard` gets an optional `info` slot and `badge` slot so steps can drop in an ⓘ / badge
without bespoke markup per step.

## Data flow
Glossary/synergy/spellNotes are static imports (no network). `synergy.js` reads only the
current `choices` (class/race/abilities) already held by the wizard. `InfoTip` is presentation
only. No schema or Supabase changes; no impact on persistence or realtime.

## Error handling
- Spells: if Open5e is slow/unavailable the existing loading/error states stay; ⓘ simply shows
  the curated note (or "description unavailable") without breaking selection.
- Any missing glossary/blurb entry: ⓘ degrades to hidden (no empty popover). A test guards
  coverage so this shouldn't happen for shipped content.

## Testing (kept lean for cost)
- Extend `scripts/test-rules.mjs`:
  - `synergy.js` unit checks (`raceMatch`, `keyAbilitiesFor`, `suggestAbilityOrder`).
  - Coverage check: every ability, skill, race, and class has the required copy fields.
- `npm run build` clean (type/import sanity).
- No new heavy Playwright e2e for this feature.

## Build phases (cost-staged)

1. **Ruleset-aware foundation** — add the `ruleset` dimension to the SRD data + `lib/rules.js`
   and a creation-time ruleset selector; the existing data becomes the **2014** dataset. Small,
   structural, no new content.
2. **Education layer (2014)** — glossary, blurbs/whenToPick, `synergy.js`, `InfoTip`, `Primer`,
   `MatchBadge`, applied across the wizard steps. This is the bulk of the work.
3. **2024 dataset & rules** *(follow-on)* — author the 2024 species/backgrounds/classes and the
   ability-bonus-from-background rule from the GM Binder PDF; light up the 2024 option; the
   education content branches only where 2024 diverges.

Phases 1–2 are this effort. Phase 3 can be its own plan if we want to ship 2014 first.

## Out of scope (YAGNI)
- Full visual synergy graph.
- Spell notes above level 1.
- Video/tutorial content.

## Future work (separate cycles, not designed here)
- **DM companion:** at-the-table rules-and-decisions assistant for the DM — rules adjudication,
  condition effects surfaced on the initiative tracker, DC/advantage helpers, monster/encounter
  lookup. Builds on the existing `RulesLookup` + `DMView` combat tracker and reads the same
  ruleset selector. This is the app's key differentiator vs. plain character builders; brainstorm
  it as its own cycle after the education layer.
- **Admin / story / roadmap subsystem:** DM authors campaign story, quest roadmap, and hands
  out items / XP / rewards to players; its own brainstorm → spec → plan. Captured as a pointer.
