# Ruleset Switch + 5.5e (2024) Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a selectable second ruleset — D&D 5.5e / 2024 ("One D&D") — alongside the existing 5e 2014 data, and make the creation wizard + education layer ruleset-aware, reusing the 2014 education content where the editions agree.

**Architecture:** Introduce a `ruleset` dimension (`'2014' | '2024'`) threaded through the SRD data and `lib/rules.js`. The existing `src/data/srd/*` files become the **2014** dataset; a parallel `src/data/srd/2024/*` holds 2024 species/backgrounds/classes. A creation-time selector picks the ruleset and stores it on the character. The key 2024 rule change — **ability score increases come from the background, not the species** — is implemented in the rules engine behind the ruleset flag. The education primitives (`InfoTip`, `Primer`, `MatchBadge`) from the 2014 plan are reused unchanged; only synergy and a few glossary concepts branch.

**Tech Stack:** Same as Plan A. Plus `scripts/extract-pdf.mjs` (already in repo; `pdf-parse` installed `--no-save`) to pull text from the source.

**Prerequisite:** `docs/plans/2026-06-15-education-layer-5e-2014.md` is implemented and merged.

**Spec:** `docs/specs/2026-06-15-beginner-onboarding-education-design.md`

**SOURCE & CONTENT CONTRACT:** All 2024 game values (species traits, background ability boosts + Origin feats, class changes) come from `DnD 5.5e v1.0 _ GM Binder.pdf` (repo root). Task 1 extracts the text **once** to a working file; later tasks transcribe the relevant numbers from that file. Do **not** invent 2024 values — every 2024 data entry must trace to the extracted source. Coverage/parity tests (added per task) are the definition of done.

---

### Task 1: Extract the 2024 source text

**Files:**
- Modify (if needed): `scripts/extract-pdf.mjs` to accept an input path arg
- Create (generated, gitignore): `scripts/5.5e.txt`

- [ ] **Step 1:** Confirm `pdf-parse` is available: `npm install pdf-parse --no-save`.
- [ ] **Step 2:** Run the extractor against the source, e.g. `node scripts/extract-pdf.mjs "DnD 5.5e v1.0 _ GM Binder.pdf" scripts/5.5e.txt` (adjust the script to take argv paths if it currently hardcodes the PHB).
- [ ] **Step 3:** Add `scripts/5.5e.txt` to `.gitignore` (generated artifact, like `scripts/phb.txt`).
- [ ] **Step 4:** Skim the extracted text to locate the Species, Backgrounds, and Classes sections; note their headings for later tasks.
- [ ] **Step 5:** Commit the extractor change only: `git add scripts/extract-pdf.mjs .gitignore && git commit -m "chore(2024): make pdf extractor take input/output paths"`.

---

### Task 2: Ruleset constant + character field

**Files:**
- Create: `src/data/srd/rulesets.js`
- Modify: `src/store/useStore.js` (default `ruleset` on new characters)
- Modify: `scripts/test-education.mjs`

- [ ] **Step 1 (failing test):** add to `scripts/test-education.mjs`:
```js
import { RULESETS, DEFAULT_RULESET } from '../src/data/srd/rulesets.js'
ok(RULESETS.some((r) => r.key === '2014'), 'ruleset registry includes 2014')
ok(RULESETS.some((r) => r.key === '2024'), 'ruleset registry includes 2024')
ok(['2014', '2024'].includes(DEFAULT_RULESET), 'default ruleset is valid')
```
- [ ] **Step 2:** run `node scripts/test-education.mjs` → FAIL (module missing).
- [ ] **Step 3:** create `src/data/srd/rulesets.js`:
```js
// Selectable rule editions. Content is resolved per-ruleset in lib/rules.js.
export const RULESETS = [
  { key: '2014', name: 'D&D 5e (2014)', short: 'The classic fifth edition.' },
  { key: '2024', name: 'D&D 5.5e (2024)', short: 'The 2024 "One D&D" revision.' },
]
export const DEFAULT_RULESET = '2024'
export const getRuleset = (key) => RULESETS.find((r) => r.key === key) || null
```
- [ ] **Step 4:** in `src/store/useStore.js`, ensure new characters default `ruleset: DEFAULT_RULESET` (import it). Persisted characters without the field fall back to `'2014'` when read.
- [ ] **Step 5:** run the test → PASS. Commit.

---

### Task 3: Ruleset selector in the wizard

**Files:**
- Modify: `src/pages/CreateCharacter.jsx` (or the wizard's first step) to add a ruleset picker
- Modify: `src/components/create/RaceStep.jsx` label ("Race" vs "Species")

- [ ] **Step 1:** Add a ruleset selector as the wizard's first choice (before Race/Species), using the existing `OptionCard` + a `Primer` explaining the difference (add a `ruleset` concept to `glossary.js`). Store the choice in `choices.ruleset`.
- [ ] **Step 2:** When `choices.ruleset === '2024'`, label the race step "Species" (2024 terminology); otherwise "Race".
- [ ] **Step 3:** `npm run build` → succeeds. Manual: selector appears first and persists. Commit.

---

### Task 4: 2024 datasets (species, backgrounds, classes)

**Files:**
- Create: `src/data/srd/2024/species.js`, `src/data/srd/2024/backgrounds.js`, `src/data/srd/2024/classes.js`
- Create: `src/data/srd/2024/index.js` (re-exports keyed by ruleset)
- Modify: `src/data/srd/index.js` to resolve race/class/background by ruleset
- Modify: `scripts/test-education.mjs` (parity coverage)

- [ ] **Step 1 (failing test):** add parity checks — every 2024 species/class/background has the same required fields as its 2014 counterpart (`blurb`, `whenToPick`, traits/desc, etc.) so the education layer renders identically.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** transcribe the 2024 species, backgrounds (with their ability-score boosts + Origin feat), and class changes from `scripts/5.5e.txt`. Match the existing 2014 object shapes so downstream code is unchanged. Add `blurb`/`whenToPick` in the same beginner voice.
- [ ] **Step 4:** make `src/data/srd/index.js` getters (`getRace`/`getClass`/`getBackground`) accept a `ruleset` and return the matching dataset (default `'2014'`).
- [ ] **Step 5:** run → PASS. Commit per dataset (species, then backgrounds, then classes) to keep diffs reviewable.

---

### Task 5: Rules engine — ability bonuses by ruleset

**Files:**
- Modify: `src/lib/rules.js` (`effectiveAbilities` + `deriveSheet`)
- Modify: `scripts/test-rules.mjs` (2024 cases)

- [ ] **Step 1 (failing test):** in `scripts/test-rules.mjs`, add cases asserting that under `ruleset: '2024'` the ability bonuses come from the chosen **background**, not the species; and under `'2014'` behavior is unchanged (regression guard).
- [ ] **Step 2:** run `node scripts/test-rules.mjs` → the new 2024 cases FAIL.
- [ ] **Step 3:** thread `ruleset` into `effectiveAbilities`/`deriveSheet`: for `'2024'`, apply the background's ability boosts (and skip species ability bonuses); for `'2014'`, keep current logic.
- [ ] **Step 4:** run → all PASS (2014 regression + 2024 new). Commit.

---

### Task 6: Branch the education content where editions differ

**Files:**
- Modify: `src/lib/synergy.js` (accept `ruleset`)
- Modify: `src/data/srd/synergy.js` (2024 recommended species, if different)
- Modify: `src/data/srd/glossary.js` (ruleset-specific notes where wording changed)

- [ ] **Step 1 (failing test):** in `scripts/test-education.mjs`, assert `raceMatch(class, race, sub, '2024')` reflects 2024 species bonuses, and that shared concepts still resolve. 
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** add an optional `ruleset` param to the synergy functions; for 2024, read species bonuses from the 2024 dataset. Keep all edition-agnostic glossary copy shared; add only the deltas (e.g. note that in 2024 ability boosts come from background).
- [ ] **Step 4:** update the wizard steps to pass `choices.ruleset` into `raceMatch`/synergy calls and into the getters.
- [ ] **Step 5:** run education + rules tests → PASS; `npm run build` → clean. Commit.

---

### Task 7: Full verification

- [ ] **Step 1:** `node scripts/test-education.mjs` and `node scripts/test-rules.mjs` → both `0 failed`.
- [ ] **Step 2:** `npm run build` → clean.
- [ ] **Step 3:** Manual: build a character under each ruleset end-to-end. Confirm 2024 uses "Species", applies background ability boosts, grants an Origin feat, and that all ⓘ/primer/badge guidance renders for both editions.
- [ ] **Step 4:** Commit any cleanup.

---

## Notes for the executor
- Never invent 2024 numbers — trace every value to `scripts/5.5e.txt`. If the source is ambiguous, stop and ask rather than guess.
- The three UI primitives from the 2014 plan are reused as-is; this plan only adds data + ruleset threading.
- Keep 2014 behavior a strict regression guard — its tests must stay green throughout.
- Apply `ui-ux-pro-max` / `ui-designer-dark-cinematic` for the ruleset-selector polish during the smoke pass.
