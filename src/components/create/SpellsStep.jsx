import { useEffect, useState } from 'react'
import { getClass, SPELLCASTING, levelOneSpellPicks, cantripCount } from '../../data/srd/index.js'
import { effectiveAbilities } from '../../lib/rules.js'
import { spellsByClass } from '../../lib/open5e.js'
import { StepHeading } from './RaceStep.jsx'
import InfoTip from '../ui/InfoTip.jsx'
import Primer from './Primer.jsx'
import { getSpellNote } from '../../data/srd/spellNotes.js'

// Spell selection for level-1 casters. Pick the right number of cantrips and
// 1st-level spells; stored in choices.spellSelections = { cantrips:[], spells:[] }.
export default function SpellsStep({ choices, update }) {
  const klass = getClass(choices.classKey)
  const cfg = SPELLCASTING[choices.classKey]

  const scores = effectiveAbilities(
    choices.abilities?.base || {},
    choices.raceKey,
    choices.subraceKey,
    [],
    choices.raceChoiceBonuses
  )
  const abilityScore = scores[cfg?.ability] ?? 10
  const cantripsNeeded = cantripCount(choices.classKey, choices.level || 1)
  const spellCount = levelOneSpellPicks(choices.classKey, abilityScore, choices.level || 1)

  const [cantrips, setCantrips] = useState([])
  const [spells, setSpells] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    Promise.all([spellsByClass(klass.name, 0), spellsByClass(klass.name, 1)])
      .then(([c, s]) => {
        if (!live) return
        setCantrips(c)
        setSpells(s)
        setLoading(false)
      })
      .catch((e) => {
        if (!live) return
        setError(e.message || 'Could not load spells.')
        setLoading(false)
      })
    return () => { live = false }
  }, [klass.name])

  const sel = choices.spellSelections || { cantrips: [], spells: [] }
  const setSel = (patch) => update({ spellSelections: { ...sel, ...patch } })

  function toggle(list, name, max) {
    const has = sel[list].includes(name)
    let next
    if (has) next = sel[list].filter((n) => n !== name)
    else if (sel[list].length < max) next = [...sel[list], name]
    else return
    setSel({ [list]: next })
  }

  const prepWord = cfg?.prepType === 'prepared' ? 'prepare' : 'learn'

  return (
    <div>
      <StepHeading
        title="Choose your Spells"
        subtitle={`As a ${klass.name}, ${prepWord} your starting magic (${cfg?.ability?.slice(0, 3).toUpperCase()}-based).`}
      />

      <Primer concepts={['spell_slot', 'cantrip', 'prepared_vs_known']} />

      {loading && <p className="text-muted py-6 text-center">Consulting the grimoire…</p>}
      {error && <p className="text-blood py-4">{error}</p>}

      {!loading && !error && (
        <div className="space-y-6">
          <SpellGroup
            testId="spellgroup-cantrips"
            title={`Cantrips (${sel.cantrips.length}/${cantripsNeeded})`}
            spells={cantrips}
            chosen={sel.cantrips}
            onToggle={(name) => toggle('cantrips', name, cantripsNeeded)}
          />
          <SpellGroup
            testId="spellgroup-spells"
            title={`1st-Level Spells (${sel.spells.length}/${spellCount})`}
            spells={spells}
            chosen={sel.spells}
            onToggle={(name) => toggle('spells', name, spellCount)}
          />
        </div>
      )}
    </div>
  )
}

function SpellGroup({ title, spells, chosen, onToggle, testId }) {
  return (
    <div data-testid={testId}>
      <h3 className="font-display text-lg text-gold mb-2">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {spells.map((s) => {
          const on = chosen.includes(s.name)
          return (
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
          )
        })}
      </div>
    </div>
  )
}
