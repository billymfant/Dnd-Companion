import { CLASSES } from '../../data/srd/index.js'
import OptionCard from './OptionCard.jsx'
import { StepHeading } from './RaceStep.jsx'
import InfoTip from '../ui/InfoTip.jsx'
import Primer from './Primer.jsx'
import MatchBadge from './MatchBadge.jsx'
import { keyAbilitiesFor } from '../../lib/synergy.js'
import { ABILITIES } from '../../lib/dnd.js'

// Step 2 — choose a class. Selecting a new class clears class-dependent
// choices (skills) so they can't carry over invalidly.
export default function ClassStep({ choices, update }) {
  function pickClass(key) {
    if (key === choices.classKey) return
    update({ classKey: key, classSkills: [], subclassKey: null })
  }

  return (
    <div>
      <Primer concepts={['class', 'subclass', 'hit_points', 'saving_throw']} />
      <StepHeading title="Choose your Class" subtitle="Your calling — how you fight, cast, and survive." />
      <div className="grid sm:grid-cols-2 gap-3">
        {CLASSES.map((c) => (
          <OptionCard
            key={c.key}
            testId={`class-${c.key}`}
            selected={choices.classKey === c.key}
            title={c.name}
            subtitle={`Hit die d${c.hitDie} · ${c.primaryAbility.map((a) => a.slice(0, 3).toUpperCase()).join('/')}`}
            onClick={() => pickClass(c.key)}
            info={<InfoTip title={c.name}>{c.blurb} {c.whenToPick}</InfoTip>}
            badge={(() => {
              const k = keyAbilitiesFor(c.key)[0]
              const label = ABILITIES.find((a) => a.key === k)?.label
              return label ? <MatchBadge label={`Key stat: ${label}`} /> : null
            })()}
          >
            {c.casts ? 'Spellcaster · ' : ''}
            {`Saves: ${c.savingThrows.map((s) => s.slice(0, 3).toUpperCase()).join(', ')}`}
          </OptionCard>
        ))}
      </div>
    </div>
  )
}
