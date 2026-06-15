# Beginner Education Layer (5e 2014) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing character-creation wizard understandable to people who have never played D&D, by adding plain-language explanations (ⓘ popovers + per-step primers) and gentle "smart hint" build guidance — all on the current 5e (2014) data.

**Architecture:** Additive only. New static content lives in `src/data/srd/*` (glossary, per-item blurbs, synergy data, spell notes). Pure guidance logic lives in `src/lib/synergy.js` (unit-tested like `lib/rules.js`). Three small reusable React primitives (`InfoTip`, `Primer`, `MatchBadge`) are dropped into the existing wizard steps. No schema, Supabase, or persistence changes. Ruleset switching and 2024 content are intentionally deferred to the companion plan `2026-06-15-education-layer-5.5e-2024.md`.

**Tech Stack:** React 18, Tailwind v4 (theme tokens: `gold`, `ink`, `parchment`, `muted`, `panel`, `panel-2`, `gold-soft`), Open5e API (already wired in `lib/open5e.js`), Node test scripts (no jest/RTL in repo).

**Spec:** `docs/specs/2026-06-15-beginner-onboarding-education-design.md`

**Testing note:** This repo has no DOM test runner. Pure modules (Tasks 1–4) get real failing-test-first TDD via a node script (`scripts/test-education.mjs`, same ✅/❌ style as `scripts/test-rules.mjs`). React components (Tasks 5–11) are verified by `npm run build` passing plus the listed manual smoke check. Run all commands from the repo root (path must contain no `&`).

**Content contract (Tasks 2–4):** For content-heavy data files the executor authors every entry. Each task gives the exact schema, 2–3 fully-written reference entries, and the exhaustive list of required keys. A coverage test (added in the same task) FAILS until every required key is present and non-empty — that test is the definition of done, not a placeholder.

---

### Task 1: Synergy data + pure logic (`lib/synergy.js`)

**Files:**
- Create: `src/data/srd/synergy.js`
- Create: `src/lib/synergy.js`
- Create: `scripts/test-education.mjs`

- [ ] **Step 1: Write the synergy data module**

Create `src/data/srd/synergy.js`:

```js
// Pure data: which abilities matter for each class, recommended races, and the
// suggested order to place high ability scores. Class/race/ability keys match
// src/data/srd/classes.js, races.js, and src/lib/dnd.js. (5e 2014.)
export const KEY_ABILITIES = {
  barbarian: ['strength', 'constitution'],
  bard: ['charisma', 'dexterity'],
  cleric: ['wisdom', 'constitution'],
  druid: ['wisdom', 'constitution'],
  fighter: ['strength', 'constitution'], // or dexterity for a finesse build
  monk: ['dexterity', 'wisdom'],
  paladin: ['strength', 'charisma'],
  ranger: ['dexterity', 'wisdom'],
  rogue: ['dexterity', 'intelligence'],
  sorcerer: ['charisma', 'constitution'],
  warlock: ['charisma', 'constitution'],
  wizard: ['intelligence', 'constitution'],
}

// Full suggested placement order (highest score first) per class.
export const ABILITY_PRIORITY = {
  barbarian: ['strength', 'constitution', 'dexterity', 'wisdom', 'charisma', 'intelligence'],
  bard: ['charisma', 'dexterity', 'constitution', 'wisdom', 'intelligence', 'strength'],
  cleric: ['wisdom', 'constitution', 'strength', 'dexterity', 'charisma', 'intelligence'],
  druid: ['wisdom', 'constitution', 'dexterity', 'intelligence', 'charisma', 'strength'],
  fighter: ['strength', 'constitution', 'dexterity', 'wisdom', 'charisma', 'intelligence'],
  monk: ['dexterity', 'wisdom', 'constitution', 'strength', 'intelligence', 'charisma'],
  paladin: ['strength', 'charisma', 'constitution', 'wisdom', 'dexterity', 'intelligence'],
  ranger: ['dexterity', 'wisdom', 'constitution', 'strength', 'intelligence', 'charisma'],
  rogue: ['dexterity', 'intelligence', 'constitution', 'wisdom', 'charisma', 'strength'],
  sorcerer: ['charisma', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'strength'],
  warlock: ['charisma', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'strength'],
  wizard: ['intelligence', 'constitution', 'dexterity', 'wisdom', 'charisma', 'strength'],
}
```

- [ ] **Step 2: Write the failing test**

Create `scripts/test-education.mjs`:

```js
// Pure unit checks for the education layer (no browser, no Supabase).
// Run: node scripts/test-education.mjs
import { raceMatch, keyAbilitiesFor, suggestAbilityOrder } from '../src/lib/synergy.js'
import { ABILITIES, SKILLS } from '../src/lib/dnd.js'
import { RACES, CLASSES } from '../src/data/srd/index.js'

let pass = 0, fail = 0
const ok = (c, m) => { c ? (pass++, console.log('✅ ' + m)) : (fail++, console.log('❌ ' + m)) }
const eq = (a, b, m) => ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`)

// ---- synergy ----------------------------------------------------------
eq(keyAbilitiesFor('wizard')[0], 'intelligence', 'wizard key ability is INT')
eq(raceMatch('wizard', 'elf'), 'good', 'Elf (+DEX) is a good, not great, match for Wizard')
eq(raceMatch('rogue', 'elf'), 'great', 'Elf (+DEX) is a great match for Rogue (DEX primary)')
eq(raceMatch('barbarian', 'elf'), null, 'Elf is not flagged for Barbarian')
eq(suggestAbilityOrder('fighter')[0], 'strength', 'fighter places STR first')
eq(suggestAbilityOrder('fighter').length, 6, 'suggestAbilityOrder returns all six abilities')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node scripts/test-education.mjs`
Expected: FAIL — `Cannot find module '../src/lib/synergy.js'` (file not created yet).

- [ ] **Step 4: Write the pure logic**

Create `src/lib/synergy.js`:

```js
// Pure "smart hint" helpers for the creation wizard. No React, no network.
// Derives build guidance from the synergy data + each race's ability bonuses.
import { KEY_ABILITIES, ABILITY_PRIORITY } from '../data/srd/synergy.js'
import { getRace } from '../data/srd/index.js'

export function keyAbilitiesFor(classKey) {
  return KEY_ABILITIES[classKey] || []
}

export function suggestAbilityOrder(classKey) {
  return ABILITY_PRIORITY[classKey] || []
}

// Returns 'great' (race boosts the class's #1 ability), 'good' (boosts a
// secondary key ability), or null (no relevant boost). Includes subrace and
// any fixed choice the race grants, ignoring player-chosen flexible bonuses.
export function raceMatch(classKey, raceKey, subraceKey = null) {
  const keys = keyAbilitiesFor(classKey)
  if (!keys.length || !raceKey) return null
  const race = getRace(raceKey)
  if (!race) return null
  const bonuses = { ...(race.abilityBonuses || {}) }
  const sub = race.subraces?.find((s) => s.key === subraceKey)
  if (sub?.abilityBonuses) for (const [k, v] of Object.entries(sub.abilityBonuses)) bonuses[k] = (bonuses[k] || 0) + v
  if (bonuses[keys[0]]) return 'great'
  if (keys.slice(1).some((k) => bonuses[k])) return 'good'
  return null
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node scripts/test-education.mjs`
Expected: PASS — `6 passed, 0 failed`.

- [ ] **Step 6: Commit**

```bash
git add src/data/srd/synergy.js src/lib/synergy.js scripts/test-education.mjs
git commit -m "feat(education): add synergy data + pure build-hint logic"
```

---

### Task 2: Glossary — concepts, abilities, skills (`data/srd/glossary.js`)

**Files:**
- Create: `src/data/srd/glossary.js`
- Modify: `scripts/test-education.mjs` (add coverage checks)

- [ ] **Step 1: Write the failing coverage test**

Append to `scripts/test-education.mjs` (above the final `console.log`):

```js
// ---- glossary coverage ------------------------------------------------
import { CONCEPTS, ABILITY_INFO, SKILL_INFO, getConcept } from '../src/data/srd/glossary.js'
const REQUIRED_CONCEPTS = [
  'race', 'subrace', 'class', 'subclass', 'alignment', 'ability_score',
  'ability_modifier', 'proficiency', 'proficiency_bonus', 'skill',
  'saving_throw', 'armor_class', 'hit_points', 'spell_slot', 'cantrip', 'prepared_vs_known',
]
for (const k of REQUIRED_CONCEPTS) {
  const c = CONCEPTS[k]
  ok(c && c.term && c.short && c.detail, `concept "${k}" has term/short/detail`)
}
for (const a of ABILITIES) {
  const info = ABILITY_INFO[a.key]
  ok(info && info.short && info.detail, `ability "${a.key}" has short/detail`)
}
for (const s of SKILLS) {
  const info = SKILL_INFO[s.key]
  ok(info && info.short && info.ability === s.ability, `skill "${s.key}" has short + correct ability`)
}
eq(getConcept('armor_class').term, 'Armor Class', 'getConcept returns the entry')
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/test-education.mjs`
Expected: FAIL — `Cannot find module '../src/data/srd/glossary.js'`.

- [ ] **Step 3: Write the glossary (author every entry)**

Create `src/data/srd/glossary.js`. Use this exact schema and these exact keys. Two reference entries per map are fully written; **author the rest in the same plain-language, beginner-first voice** (`short` = one sentence; `detail` = 1–3 sentences; `example` optional but encouraged):

```js
// Plain-language explanations for total newcomers. Surfaced via <InfoTip> and
// <Primer> across the creation wizard. Edition-agnostic where possible (5e 2014).
//
// CONCEPTS[key]   = { term, short, detail, example? }
// ABILITY_INFO[k] = { short, detail, example? }   // k = ability key from dnd.js
// SKILL_INFO[k]   = { short, ability, example? }  // ability MUST match dnd.js SKILLS

export const CONCEPTS = {
  ability_score: {
    term: 'Ability Score',
    short: 'A number (usually 8–20) measuring one of your six core talents.',
    detail: 'The six scores — Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma — underpin almost every roll. Higher is better; 10 is average for an adult.',
    example: 'A barbarian wants a high Strength so their axe swings hit harder.',
  },
  armor_class: {
    term: 'Armor Class',
    short: "How hard you are to hit — an attacker must roll this number or higher.",
    detail: 'Armor Class (AC) comes from your armor, shield, and Dexterity. When something attacks you, the attacker rolls a d20 + bonuses; if the total is below your AC, they miss.',
    example: 'In leather armor with 14 Dexterity your AC is 13, so attack rolls of 12 or less miss you.',
  },
  // AUTHOR THE REMAINING KEYS (same shape):
  // race, subrace, class, subclass, alignment, ability_modifier, proficiency,
  // proficiency_bonus, skill, saving_throw, hit_points, spell_slot, cantrip,
  // prepared_vs_known
}

export const ABILITY_INFO = {
  strength: {
    short: 'Raw physical power — lifting, melee swings, and grappling.',
    detail: 'Strength drives melee attack and damage for most weapons, the Athletics skill, and how much you can carry.',
    example: 'Fighters and barbarians usually want high Strength.',
  },
  dexterity: {
    short: 'Agility and reflexes — aim, dodging, and stealth.',
    detail: 'Dexterity affects finesse/ranged attacks, your Armor Class in light armor, initiative, and Stealth.',
    example: 'Rogues and rangers lean on Dexterity.',
  },
  // AUTHOR: constitution, intelligence, wisdom, charisma
}

export const SKILL_INFO = {
  athletics: { short: 'Climbing, jumping, swimming, and grappling.', ability: 'strength', example: 'Used to break free of a grapple or scale a wall.' },
  stealth: { short: 'Moving quietly and staying hidden.', ability: 'dexterity', example: 'Used to sneak past guards unseen.' },
  // AUTHOR the other 16 skills from dnd.js SKILLS — ability MUST match that file:
  // acrobatics(DEX), animal_handling(WIS), arcana(INT), deception(CHA),
  // history(INT), insight(WIS), intimidation(CHA), investigation(INT),
  // medicine(WIS), nature(INT), perception(WIS), performance(CHA),
  // persuasion(CHA), religion(INT), sleight_of_hand(DEX), survival(WIS)
}

export const getConcept = (key) => CONCEPTS[key] || null
export const getAbilityInfo = (key) => ABILITY_INFO[key] || null
export const getSkillInfo = (key) => SKILL_INFO[key] || null
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/test-education.mjs`
Expected: PASS — every concept/ability/skill coverage line shows ✅.

- [ ] **Step 5: Commit**

```bash
git add src/data/srd/glossary.js scripts/test-education.mjs
git commit -m "feat(education): add beginner glossary (concepts, abilities, skills)"
```

---

### Task 3: Race & class blurbs (`races.js`, `classes.js`)

**Files:**
- Modify: `src/data/srd/races.js` (add `blurb` + `whenToPick` to every entry in `RACES`)
- Modify: `src/data/srd/classes.js` (add `blurb` + `whenToPick` to every entry in `CLASSES`)
- Modify: `scripts/test-education.mjs` (coverage)

- [ ] **Step 1: Write the failing coverage test**

Append to `scripts/test-education.mjs` (above the final `console.log`):

```js
// ---- race/class blurb coverage ----------------------------------------
for (const r of RACES) ok(r.blurb && r.whenToPick, `race "${r.key}" has blurb + whenToPick`)
for (const c of CLASSES) ok(c.blurb && c.whenToPick, `class "${c.key}" has blurb + whenToPick`)
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/test-education.mjs`
Expected: FAIL — race/class blurb lines show ❌ (fields absent).

- [ ] **Step 3: Add blurbs to every race**

In `src/data/srd/races.js`, add two string fields to each race object (`blurb` = one-sentence identity; `whenToPick` = "Good if you want…"). Reference entry (Dwarf):

```js
    blurb: 'Tough, traditional folk at home in mountains and mines.',
    whenToPick: 'Good if you want to be sturdy and hard to take down.',
```

Author the same two fields for the remaining races (elf, halfling, human, dragonborn, gnome, half-elf, half-orc, tiefling — confirm the full set from the file). Keep one line each, beginner voice.

- [ ] **Step 4: Add blurbs to every class**

In `src/data/srd/classes.js`, add `blurb` + `whenToPick` to each class. Reference entry (Barbarian):

```js
    blurb: 'A raging frontline warrior who shrugs off blows.',
    whenToPick: "Good if you want to charge in and hit hard without much bookkeeping.",
```

Author both fields for all 12 classes (barbarian, bard, cleric, druid, fighter, monk, paladin, ranger, rogue, sorcerer, warlock, wizard).

- [ ] **Step 5: Run the test to verify it passes**

Run: `node scripts/test-education.mjs`
Expected: PASS — all race/class blurb lines ✅.

- [ ] **Step 6: Commit**

```bash
git add src/data/srd/races.js src/data/srd/classes.js scripts/test-education.mjs
git commit -m "feat(education): add beginner blurbs + when-to-pick to races and classes"
```

---

### Task 4: Spell notes (`data/srd/spellNotes.js`)

**Files:**
- Create: `src/data/srd/spellNotes.js`
- Modify: `scripts/test-education.mjs` (coverage)

- [ ] **Step 1: Write the failing test**

Append to `scripts/test-education.mjs` (above the final `console.log`):

```js
// ---- spell notes ------------------------------------------------------
import { getSpellNote, SPELL_NOTES } from '../src/data/srd/spellNotes.js'
ok(typeof getSpellNote === 'function', 'getSpellNote is exported')
eq(getSpellNote('nonexistent-spell'), null, 'unknown spell returns null (falls back to API desc)')
ok(getSpellNote('fire-bolt'), 'fire-bolt has a beginner note')
ok(Object.keys(SPELL_NOTES).length >= 20, 'at least 20 common spells annotated')
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/test-education.mjs`
Expected: FAIL — `Cannot find module '../src/data/srd/spellNotes.js'`.

- [ ] **Step 3: Write the spell notes**

Create `src/data/srd/spellNotes.js`. Keys are Open5e slugs (lowercase-hyphenated, e.g. `fire-bolt`, `mage-hand`, `cure-wounds`). Author "when it's good" notes for the common SRD cantrips and 1st-level spells across classes (≥20). Reference entries:

```js
// Beginner "when it's good" notes for common cantrips & 1st-level spells,
// keyed by Open5e slug. The spell's mechanical text comes from the API `desc`;
// this adds plain-language guidance on WHEN to pick/use it. Unlisted spells
// fall back to the API description (getSpellNote returns null).
export const SPELL_NOTES = {
  'fire-bolt': 'Your reliable ranged attack cantrip — good damage at range, never runs out.',
  'mage-hand': 'A floating hand for fiddly tasks: pull levers, grab items, trigger traps from afar.',
  'cure-wounds': 'Touch an ally to heal them in a pinch — the bread-and-butter healing spell.',
  // AUTHOR ≥17 more from the level-0/1 SRD lists (e.g. guidance, sacred-flame,
  // healing-word, shield, magic-missile, sleep, thunderwave, faerie-fire,
  // hunters-mark, hex, charm-person, detect-magic, bless, etc.)
}

export const getSpellNote = (slug) => SPELL_NOTES[slug] || null
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/test-education.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/srd/spellNotes.js scripts/test-education.mjs
git commit -m "feat(education): add beginner spell-usage notes"
```

---

### Task 5: `InfoTip` primitive

**Files:**
- Create: `src/components/ui/InfoTip.jsx`

- [ ] **Step 1: Write the component**

Create `src/components/ui/InfoTip.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react'

// Reusable info popover. Hover (desktop) or tap (mobile) the ⓘ for a plain-language
// explanation. Safe to render inside clickable cards: it stops click propagation.
export default function InfoTip({ title, children, ability, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!children && !title) return null

  return (
    <span ref={ref} className={`relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        aria-label={title ? `What is ${title}?` : 'More information'}
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o) }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gold/60 text-[10px] font-bold leading-none text-gold transition hover:bg-gold hover:text-ink"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-6 z-50 w-60 -translate-x-1/2 rounded-lg border border-panel-2 bg-ink p-3 text-left text-xs leading-snug shadow-xl"
        >
          {title && <span className="mb-1 block font-display text-sm text-gold">{title}</span>}
          <span className="block text-parchment">{children}</span>
          {ability && <span className="mt-1 block text-[10px] uppercase tracking-wide text-gold/70">Uses {ability}</span>}
        </span>
      )}
    </span>
  )
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: build succeeds with no import/type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/InfoTip.jsx
git commit -m "feat(education): add reusable InfoTip popover primitive"
```

---

### Task 6: `Primer` + `MatchBadge` primitives

**Files:**
- Create: `src/components/create/Primer.jsx`
- Create: `src/components/create/MatchBadge.jsx`

- [ ] **Step 1: Write `Primer`**

Create `src/components/create/Primer.jsx`:

```jsx
import { useState } from 'react'
import { getConcept } from '../../data/srd/glossary.js'

// Collapsible "New to D&D?" banner at the top of a wizard step. Pass one or
// more glossary concept keys; renders their term + detail. Collapsible so
// veterans can dismiss it (per-mount; cheap and stateless across sessions).
export default function Primer({ concepts = [], heading = 'New to D&D?' }) {
  const [open, setOpen] = useState(true)
  const entries = concepts.map(getConcept).filter(Boolean)
  if (!entries.length) return null

  return (
    <div className="mb-4 rounded-xl border border-gold/30 bg-gold-soft/40 p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-display text-sm text-gold">📖 {heading}</span>
        <span className="text-xs text-muted">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {entries.map((c) => (
            <p key={c.term} className="text-xs leading-snug text-parchment">
              <span className="font-semibold text-gold">{c.term}:</span> {c.detail}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `MatchBadge`**

Create `src/components/create/MatchBadge.jsx`:

```jsx
// Small, non-blocking guidance tag. `level` is 'great' | 'good' | null from
// lib/synergy.js raceMatch(); `label` overrides the text (e.g. "Key stat").
const STYLES = {
  great: 'border-gold bg-gold text-ink',
  good: 'border-gold/50 bg-gold-soft text-gold',
}
const TEXT = { great: '✦ Great match', good: 'Good match' }

export default function MatchBadge({ level, label }) {
  if (!level && !label) return null
  const style = STYLES[level] || 'border-gold/50 bg-gold-soft text-gold'
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style}`}>
      {label || TEXT[level]}
    </span>
  )
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/create/Primer.jsx src/components/create/MatchBadge.jsx
git commit -m "feat(education): add Primer banner + MatchBadge guidance tags"
```

---

### Task 7: `OptionCard` info + badge slots

**Files:**
- Modify: `src/components/create/OptionCard.jsx`

- [ ] **Step 1: Update `OptionCard`**

Replace the contents of `src/components/create/OptionCard.jsx` with (adds `info` and `badge` slots positioned OUTSIDE the clickable `<button>` so we never nest buttons):

```jsx
// Selectable card used across the creation wizard (race, class, background…).
// `info` (an <InfoTip>) and `badge` (a <MatchBadge>) render as overlays so they
// stay clickable/accessible without nesting inside the card's <button>.
export default function OptionCard({ selected, title, subtitle, onClick, disabled, children, testId, info, badge }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        data-testid={testId}
        aria-pressed={selected}
        className={`text-left rounded-xl border p-4 w-full transition focus:outline-none ${
          selected
            ? 'border-gold bg-gold-soft ring-1 ring-gold shadow-lg'
            : 'border-panel-2 bg-panel hover:border-gold/50'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center justify-between gap-2 pr-6">
          <h3 className="font-display text-lg text-parchment leading-tight">{title}</h3>
          {selected && <span className="text-gold text-sm shrink-0">✓</span>}
        </div>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        {children && <div className="mt-2 text-sm text-muted leading-snug">{children}</div>}
        {badge && <div className="mt-2">{badge}</div>}
      </button>
      {info && <div className="absolute right-2 top-2 z-10">{info}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: build succeeds; existing steps still render (no prop is required, so old call sites are unaffected).

- [ ] **Step 3: Commit**

```bash
git add src/components/create/OptionCard.jsx
git commit -m "feat(education): add info + badge slots to OptionCard"
```

---

### Task 8: Wire Race & Class steps

**Files:**
- Modify: `src/components/create/RaceStep.jsx`
- Modify: `src/components/create/ClassStep.jsx`

- [ ] **Step 1: Update `RaceStep`**

In `src/components/create/RaceStep.jsx`:
1. Add imports at top:
```jsx
import InfoTip from '../ui/InfoTip.jsx'
import Primer from './Primer.jsx'
import MatchBadge from './MatchBadge.jsx'
import { raceMatch } from '../../lib/synergy.js'
```
2. Render a primer right after the opening `<div>` of the return, before `<StepHeading…>`:
```jsx
<Primer concepts={['race', 'subrace', 'ability_score']} />
```
3. On the race `OptionCard`, pass `info` and `badge` props (add inside the `<OptionCard …>` opening tag, keeping existing props):
```jsx
info={
  <InfoTip title={r.name}>
    {r.blurb} {r.whenToPick}
    {r.traits?.length ? ` Traits: ${r.traits.map((t) => t.name).join(', ')}.` : ''}
  </InfoTip>
}
badge={choices.classKey ? <MatchBadge level={raceMatch(choices.classKey, r.key, null)} /> : null}
```

- [ ] **Step 2: Update `ClassStep`**

Read `src/components/create/ClassStep.jsx` first to match its existing structure, then:
1. Add imports:
```jsx
import InfoTip from '../ui/InfoTip.jsx'
import Primer from './Primer.jsx'
import MatchBadge from './MatchBadge.jsx'
import { keyAbilitiesFor } from '../../lib/synergy.js'
import { ABILITIES } from '../../lib/dnd.js'
```
2. Add a primer near the top of the returned markup:
```jsx
<Primer concepts={['class', 'subclass', 'hit_points', 'saving_throw']} />
```
3. On each class `OptionCard`, add an `info` slot and a key-ability `badge`:
```jsx
info={<InfoTip title={c.name}>{c.blurb} {c.whenToPick}</InfoTip>}
badge={(() => {
  const k = keyAbilitiesFor(c.key)[0]
  const label = ABILITIES.find((a) => a.key === k)?.label
  return label ? <MatchBadge label={`Key stat: ${label}`} /> : null
})()}
```

- [ ] **Step 3: Verify the build + smoke check**

Run: `npm run build`
Expected: build succeeds.
Manual smoke (optional but recommended): `npm run dev`, log in with a new name + code `mithral`, reach Race and Class steps; confirm ⓘ opens on hover/tap, the primer shows/hides, and picking a class then revisiting Race shows "Good/Great match" badges.

- [ ] **Step 4: Commit**

```bash
git add src/components/create/RaceStep.jsx src/components/create/ClassStep.jsx
git commit -m "feat(education): explain races & classes inline with hints"
```

---

### Task 9: Wire Abilities step (per-stat info + placement hint)

**Files:**
- Modify: `src/components/create/AbilitiesStep.jsx`

- [ ] **Step 1: Add imports and a hint banner**

In `src/components/create/AbilitiesStep.jsx`:
1. Imports:
```jsx
import InfoTip from '../ui/InfoTip.jsx'
import Primer from './Primer.jsx'
import { getAbilityInfo } from '../../data/srd/glossary.js'
import { suggestAbilityOrder, keyAbilitiesFor } from '../../lib/synergy.js'
```
2. Inside the top-level returned `<div>`, after `<StepHeading…>`, add:
```jsx
<Primer concepts={['ability_score', 'ability_modifier']} />
{choices.classKey && (
  <p className="mb-3 rounded-lg bg-panel-2 px-3 py-2 text-xs text-parchment">
    Tip for a <span className="text-gold">{choices.classKey}</span>: put your highest scores in{' '}
    <span className="text-gold">
      {suggestAbilityOrder(choices.classKey).slice(0, 2)
        .map((k) => ABILITIES.find((a) => a.key === k)?.label).join(' & ')}
    </span>.
  </p>
)}
```
(`ABILITIES` is already imported in this file.)

- [ ] **Step 2: Add a per-stat ⓘ to each ability row**

Both `PoolAssign` and `PointBuy` render a row label `<span className="w-12 …">{a.label}</span>`. For each, wrap the label so it carries an InfoTip + a "key stat" marker. Pass `keyAbilities` down from the parent, or compute inline. Replace each label span with:
```jsx
<span className="w-12 text-sm font-semibold text-parchment flex items-center gap-1">
  {a.label}
  <InfoTip title={a.label} ability={a.key}>{getAbilityInfo(a.key)?.detail}</InfoTip>
</span>
```
Do this in BOTH `PoolAssign` and `PointBuy` (they each have their own ability `.map`).

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/create/AbilitiesStep.jsx
git commit -m "feat(education): explain each ability + suggest score placement"
```

---

### Task 10: Wire Skills & Background steps

**Files:**
- Modify: `src/components/create/SkillsStep.jsx`
- Modify: `src/components/create/BackgroundStep.jsx`

- [ ] **Step 1: Update `BackgroundStep`**

In `src/components/create/BackgroundStep.jsx`:
1. Imports:
```jsx
import InfoTip from '../ui/InfoTip.jsx'
import Primer from './Primer.jsx'
import { getSkillInfo } from '../../data/srd/glossary.js'
```
2. Add a primer after `<StepHeading…>`:
```jsx
<Primer concepts={['skill', 'proficiency', 'alignment']} />
```
3. On each background `OptionCard`, add an `info` slot listing what its granted skills mean:
```jsx
info={
  <InfoTip title={b.name}>
    {b.feature?.name ? `${b.feature.name}. ` : ''}
    Grants: {b.skills.map((s) => `${SKILL_LABEL[s]} — ${getSkillInfo(s)?.short || ''}`).join(' ')}
  </InfoTip>
}
```

- [ ] **Step 2: Update `SkillsStep`**

Read `src/components/create/SkillsStep.jsx` first. For each selectable skill control, add an `InfoTip` beside its label:
```jsx
import InfoTip from '../ui/InfoTip.jsx'
import Primer from './Primer.jsx'
import { getSkillInfo } from '../../data/srd/glossary.js'
import { SKILLS } from '../../lib/dnd.js'
```
Add `<Primer concepts={['skill', 'proficiency_bonus']} />` near the top, and next to each skill's label render:
```jsx
<InfoTip title={SKILLS.find((s) => s.key === skillKey)?.label} ability={getSkillInfo(skillKey)?.ability}>
  {getSkillInfo(skillKey)?.short}
</InfoTip>
```
(Use whatever the step's local variable for the skill key is — match the existing `.map`.)

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/create/SkillsStep.jsx src/components/create/BackgroundStep.jsx
git commit -m "feat(education): explain skills, proficiencies & background grants"
```

---

### Task 11: Wire Subclass & Spells steps

**Files:**
- Modify: `src/components/create/SubclassStep.jsx`
- Modify: `src/components/create/SpellsStep.jsx`

- [ ] **Step 1: Update `SubclassStep`**

Read `src/components/create/SubclassStep.jsx` first. Add `import InfoTip from '../ui/InfoTip.jsx'` and, on each subclass option, an `info` InfoTip whose body lists the subclass's feature names + descs (the data already carries `traits`/`features` with `desc`). Add a `<Primer concepts={['subclass']} />` near the top.

- [ ] **Step 2: Update `SpellsStep`**

In `src/components/create/SpellsStep.jsx`:
1. Imports:
```jsx
import InfoTip from '../ui/InfoTip.jsx'
import Primer from './Primer.jsx'
import { getSpellNote } from '../../data/srd/spellNotes.js'
```
2. Add a primer after `<StepHeading…>`:
```jsx
<Primer concepts={['spell_slot', 'cantrip', 'prepared_vs_known']} />
```
3. In `SpellGroup`'s `.map`, the spell is currently a `<button>`. To avoid nested buttons, wrap each spell in a relative container and overlay the InfoTip (mirroring OptionCard). Replace the mapped `<button>…</button>` with:
```jsx
<div key={s.slug || s.name} className="relative">
  <button
    type="button"
    data-testid={`spell-${(s.slug || s.name)}`}
    onClick={() => onToggle(s.name)}
    className={`w-full text-left rounded-lg px-3 py-2 pr-7 text-sm transition ${
      on ? 'bg-gold text-ink font-semibold' : 'bg-panel-2 text-parchment hover:brightness-125'
    }`}
  >
    {s.name}
  </button>
  <div className="absolute right-2 top-1.5 z-10">
    <InfoTip title={s.name}>
      {getSpellNote(s.slug) || s.desc || 'Description unavailable.'}
      {s.school ? ` (${s.school})` : ''}
    </InfoTip>
  </div>
</div>
```
(Keep the existing `const on = chosen.includes(s.name)` line just above.)

- [ ] **Step 3: Verify the build + smoke check**

Run: `npm run build`
Expected: build succeeds.
Manual smoke: build a caster (e.g. Wizard) through the wizard; on the Spells step confirm each spell's ⓘ shows the beginner note (or the API description for unlisted spells).

- [ ] **Step 4: Commit**

```bash
git add src/components/create/SubclassStep.jsx src/components/create/SpellsStep.jsx
git commit -m "feat(education): explain subclass features & spell usage"
```

---

### Task 12: Full verification + final commit

**Files:** none (verification only)

- [ ] **Step 1: Run all pure checks**

Run: `node scripts/test-education.mjs` and `node scripts/test-rules.mjs`
Expected: both report `0 failed`.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: clean build, no warnings about missing imports.

- [ ] **Step 3: End-to-end smoke (manual)**

Run: `npm run dev`, log in with a fresh character name + campaign code `mithral`, and walk the whole wizard. Confirm on every step: a primer appears, ⓘ popovers open on hover (desktop) and tap (mobile/devtools touch), match badges show after a class is chosen, and selection still works (clicking ⓘ never toggles a card).

- [ ] **Step 4: Final commit (if any cleanup remains)**

```bash
git add -A
git commit -m "chore(education): final verification pass for 5e 2014 education layer"
```

---

## Notes for the executor
- Several steps say "read the file first" — do it; the exact local variable names in `ClassStep`, `SkillsStep`, and `SubclassStep` weren't pinned here to avoid guessing. Match the existing `.map` variable.
- Never nest a `<button>` inside another `<button>` — that's why `InfoTip` is overlaid via a relative wrapper in `OptionCard` and `SpellsStep`.
- Keep code lean (karpathy-coder): no new abstractions beyond the three primitives; no new dependencies.
- Friendly-UI polish (spacing, popover legibility on mobile) can use the `ui-ux-pro-max` / `ui-designer-dark-cinematic` skills during the smoke-check pass.
