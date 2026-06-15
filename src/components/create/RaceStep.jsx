import { RACES, getRace } from '../../data/srd/index.js'
import { ABILITIES } from '../../lib/dnd.js'
import OptionCard from './OptionCard.jsx'
import InfoTip from '../ui/InfoTip.jsx'
import Primer from './Primer.jsx'
import MatchBadge from './MatchBadge.jsx'
import { raceMatch } from '../../lib/synergy.js'

// Step 1 — choose a race, then a subrace (if any), and any racial ability
// choices (e.g. Half-Elf's two +1s).
export default function RaceStep({ choices, update }) {
  const race = getRace(choices.raceKey)

  function pickRace(key) {
    update({ raceKey: key, subraceKey: null, raceChoiceBonuses: null, raceSkills: [] })
  }

  function pickSubrace(key) {
    update({ subraceKey: key })
  }

  function bonusFor() {
    return choices.raceChoiceBonuses || {}
  }

  function toggleBonus(abilityKey) {
    const current = { ...bonusFor() }
    const cfg = race?.choiceBonuses
    if (current[abilityKey]) {
      delete current[abilityKey]
    } else if (Object.keys(current).length < (cfg?.count || 0)) {
      current[abilityKey] = cfg?.amount || 1
    }
    update({ raceChoiceBonuses: current })
  }

  const formatBonuses = (b) =>
    Object.entries(b || {})
      .map(([k, v]) => `+${v} ${k.slice(0, 3).toUpperCase()}`)
      .join(', ')

  return (
    <div>
      <Primer concepts={['race', 'subrace', 'ability_score']} />
      <StepHeading title="Choose your Race" subtitle="Your lineage shapes your gifts and bearing." />

      <div className="grid sm:grid-cols-2 gap-3">
        {RACES.map((r) => (
          <OptionCard
            key={r.key}
            testId={`race-${r.key}`}
            selected={choices.raceKey === r.key}
            title={r.name}
            subtitle={`Speed ${r.speed} ft · ${r.size}`}
            onClick={() => pickRace(r.key)}
            info={
              <InfoTip title={r.name}>
                {r.blurb} {r.whenToPick}
                {r.traits?.length ? ` Traits: ${r.traits.map((t) => t.name).join(', ')}.` : ''}
              </InfoTip>
            }
            badge={choices.classKey ? <MatchBadge level={raceMatch(choices.classKey, r.key, null)} /> : null}
          >
            {formatBonuses(r.abilityBonuses)}
            {r.choiceBonuses ? ` · +${r.choiceBonuses.amount}×${r.choiceBonuses.count} of choice` : ''}
          </OptionCard>
        ))}
      </div>

      {/* Subraces */}
      {race?.subraces?.length > 0 && (
        <div className="mt-6">
          <h3 className="font-display text-lg text-gold mb-2">Subrace</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {race.subraces.map((s) => (
              <OptionCard
                key={s.key}
                testId={`subrace-${s.key}`}
                selected={choices.subraceKey === s.key}
                title={s.name}
                onClick={() => pickSubrace(s.key)}
              >
                {[formatBonuses(s.abilityBonuses), ...(s.traits || []).map((t) => t.name)]
                  .filter(Boolean)
                  .join(' · ')}
              </OptionCard>
            ))}
          </div>
        </div>
      )}

      {/* Racial ability choices (Half-Elf) */}
      {race?.choiceBonuses && (
        <div className="mt-6">
          <h3 className="font-display text-lg text-gold mb-1">
            Ability Increase ({Object.keys(bonusFor()).length}/{race.choiceBonuses.count})
          </h3>
          <p className="text-xs text-muted mb-2">
            Choose {race.choiceBonuses.count} abilities to increase by +{race.choiceBonuses.amount}.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ABILITIES.filter((a) => !race.choiceBonuses.exclude?.includes(a.key)).map((a) => {
              const on = Boolean(bonusFor()[a.key])
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => toggleBonus(a.key)}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${
                    on ? 'bg-gold text-ink' : 'bg-panel-2 text-parchment hover:brightness-125'
                  }`}
                >
                  {a.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function StepHeading({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-2xl text-gold">{title}</h2>
      {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
    </div>
  )
}
