import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { deriveSheet, effectiveAbilities } from '../lib/rules.js'
import { createCharacterFromSheet } from '../lib/characters.js'
import {
  getRace, getClass, getSubclassInfo,
  isValidPointBuy, castsAtLevel1, SPELLCASTING, levelOneSpellPicks, cantripCount,
} from '../data/srd/index.js'
import { ABILITIES } from '../lib/dnd.js'
import Button from '../components/ui/Button.jsx'
import RaceStep from '../components/create/RaceStep.jsx'
import ClassStep from '../components/create/ClassStep.jsx'
import SubclassStep from '../components/create/SubclassStep.jsx'
import AbilitiesStep from '../components/create/AbilitiesStep.jsx'
import BackgroundStep from '../components/create/BackgroundStep.jsx'
import SkillsStep from '../components/create/SkillsStep.jsx'
import SpellsStep from '../components/create/SpellsStep.jsx'
import DescribeStep from '../components/create/DescribeStep.jsx'
import PortraitStep from '../components/create/PortraitStep.jsx'
import ReviewStep from '../components/create/ReviewStep.jsx'
import CharacterSummary from '../components/create/CharacterSummary.jsx'

// ---------------------------------------------------------------
// Character creation wizard (S2). Reached after a new name + valid
// campaign code on the login screen. Walks race → class → abilities →
// background → skills → describe → review, then derives the canonical
// sheet, inserts the character, logs in, and routes to /player.
// ---------------------------------------------------------------
const ABILITY_KEYS = ABILITIES.map((a) => a.key)

function abilitiesComplete(choices) {
  const a = choices.abilities || {}
  const base = a.base || {}
  if (a.method === 'pointbuy') return isValidPointBuy(base)
  // standard / roll: every ability assigned from the pool
  if (a.method === 'roll' && !a.rollPool) return false
  return ABILITY_KEYS.every((k) => base[k] != null)
}

function raceComplete(choices) {
  const race = getRace(choices.raceKey)
  if (!race) return false
  if (race.subraces?.length && !choices.subraceKey) return false
  if (race.choiceBonuses) {
    const n = Object.keys(choices.raceChoiceBonuses || {}).length
    if (n !== race.choiceBonuses.count) return false
  }
  return true
}

function skillsComplete(choices) {
  const klass = getClass(choices.classKey)
  if (!klass) return false
  const need = klass.skillChoices?.count || 0
  if ((choices.classSkills || []).length !== need) return false
  const race = getRace(choices.raceKey)
  if (race?.skillChoices) {
    if ((choices.raceSkills || []).length !== race.skillChoices.count) return false
  }
  return true
}

function spellsComplete(choices) {
  const cfg = SPELLCASTING[choices.classKey]
  if (!cfg) return true
  const scores = effectiveAbilities(choices.abilities?.base || {}, choices.raceKey, choices.subraceKey, [], choices.raceChoiceBonuses)
  const need = levelOneSpellPicks(choices.classKey, scores[cfg.ability] ?? 10, choices.level || 1)
  const cantrips = cantripCount(choices.classKey, choices.level || 1)
  const sel = choices.spellSelections || { cantrips: [], spells: [] }
  return sel.cantrips.length === cantrips && sel.spells.length === need
}

// Build the (possibly conditional) step list for the chosen class.
function buildSteps(choices) {
  const steps = [
    { key: 'race', label: 'Race', Component: RaceStep, valid: raceComplete },
    { key: 'class', label: 'Class', Component: ClassStep, valid: (c) => Boolean(c.classKey) },
  ]
  if (getSubclassInfo(choices.classKey)?.level === 1) {
    steps.push({ key: 'subclass', label: 'Subclass', Component: SubclassStep, valid: (c) => Boolean(c.subclassKey) })
  }
  steps.push(
    { key: 'abilities', label: 'Abilities', Component: AbilitiesStep, valid: abilitiesComplete },
    { key: 'background', label: 'Background', Component: BackgroundStep, valid: (c) => Boolean(c.backgroundKey) },
    { key: 'skills', label: 'Skills', Component: SkillsStep, valid: skillsComplete },
  )
  if (castsAtLevel1(choices.classKey)) {
    steps.push({ key: 'spells', label: 'Spells', Component: SpellsStep, valid: spellsComplete })
  }
  steps.push(
    { key: 'describe', label: 'Describe', Component: DescribeStep, valid: (c) => Boolean(c.identity?.name?.trim()) },
    { key: 'portrait', label: 'Portrait', Component: PortraitStep, valid: () => true },
    { key: 'review', label: 'Review', Component: ReviewStep, valid: () => true },
  )
  return steps
}

export default function CreateCharacter() {
  const pendingSignup = useStore((s) => s.pendingSignup)
  const setPendingSignup = useStore((s) => s.setPendingSignup)
  const login = useStore((s) => s.login)
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [choices, setChoices] = useState(() => ({
    raceKey: null,
    subraceKey: null,
    classKey: null,
    subclassKey: null,
    backgroundKey: null,
    level: 1,
    abilities: { method: 'standard', base: {} },
    raceChoiceBonuses: null,
    classSkills: [],
    raceSkills: [],
    identity: {
      name: pendingSignup?.name || '',
      alignment: '',
      personality: { traits: '', ideals: '', bonds: '', flaws: '' },
      backstory: '',
      description: '',
    },
  }))

  // Guarded by the route, but be defensive.
  if (!pendingSignup) {
    navigate('/', { replace: true })
    return null
  }

  const update = (patch) => setChoices((c) => ({ ...c, ...patch }))

  // Step list adapts to the chosen class (subclass / spells steps).
  const steps = useMemo(() => buildSteps(choices), [choices])

  // Derive the sheet for the review step / summary (best-effort).
  const derivedSheet = useMemo(() => {
    if (!getRace(choices.raceKey) || !getClass(choices.classKey)) return null
    if (!abilitiesComplete(choices)) return null
    try {
      return deriveSheet(choices)
    } catch {
      return null
    }
  }, [choices])

  const safeStep = Math.min(step, steps.length - 1)
  const current = steps[safeStep]
  const canAdvance = current.valid(choices)
  const isLast = safeStep === steps.length - 1

  async function finish() {
    setError('')
    if (!derivedSheet) {
      setError('Some choices are incomplete. Step back and finish each one.')
      return
    }
    setSaving(true)
    const { session } = pendingSignup
    const { data, error: insErr } = await createCharacterFromSheet(session.id, derivedSheet, {
      pin: session.join_code || '',
    })
    setSaving(false)
    if (insErr || !data) {
      setError(insErr?.message || 'Could not save your character. Try again.')
      return
    }
    login({ session, role: 'player', character: data })
    setPendingSignup(null)
    navigate('/player', { replace: true })
  }

  const StepComponent = current.Component

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header + progress */}
      <header className="px-4 py-3 border-b border-panel-2 bg-panel/60 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gold">Forge Your Hero</h1>
            <button
              onClick={() => { setPendingSignup(null); navigate('/', { replace: true }) }}
              className="text-sm text-muted hover:text-parchment"
            >
              Cancel
            </button>
          </div>
          {/* Step pips */}
          <div className="flex gap-1.5 mt-3">
            {steps.map((s, i) => (
              <div
                key={s.key}
                className={`h-1.5 flex-1 rounded-full transition ${
                  i < safeStep ? 'bg-gold' : i === safeStep ? 'bg-gold/70' : 'bg-panel-2'
                }`}
                title={s.label}
              />
            ))}
          </div>
          <p className="text-xs text-muted mt-1.5">
            Step {safeStep + 1} of {steps.length} · {current.label}
          </p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* Active step */}
          <div>
            <StepComponent choices={choices} update={update} sheet={derivedSheet} />

            {error && <p className="text-blood text-sm mt-4" role="alert">{error}</p>}

            {/* Nav */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="ghost"
                onClick={() => setStep(Math.max(0, safeStep - 1))}
                disabled={safeStep === 0}
              >
                ← Back
              </Button>
              {isLast ? (
                <Button onClick={finish} disabled={saving || !derivedSheet}>
                  {saving ? 'Forging…' : '⚔️ Enter the Realm'}
                </Button>
              ) : (
                <Button onClick={() => setStep(safeStep + 1)} disabled={!canAdvance}>
                  Next →
                </Button>
              )}
            </div>
          </div>

          {/* Live summary */}
          <CharacterSummary choices={choices} />
        </div>
      </main>
    </div>
  )
}
