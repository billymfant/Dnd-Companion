import { BACKGROUNDS } from '../../data/srd/index.js'
import { SKILLS } from '../../lib/dnd.js'
import OptionCard from './OptionCard.jsx'
import { StepHeading } from './RaceStep.jsx'

const SKILL_LABEL = Object.fromEntries(SKILLS.map((s) => [s.key, s.label]))

// Step 4 — choose a background (grants two skills, tools/languages, a feature,
// and starting gold).
export default function BackgroundStep({ choices, update }) {
  return (
    <div>
      <StepHeading title="Choose a Background" subtitle="Where you came from — and what it taught you." />
      <div className="grid sm:grid-cols-2 gap-3">
        {BACKGROUNDS.map((b) => (
          <OptionCard
            key={b.key}
            testId={`background-${b.key}`}
            selected={choices.backgroundKey === b.key}
            title={b.name}
            subtitle={b.feature.name}
            onClick={() => update({ backgroundKey: b.key })}
          >
            Skills: {b.skills.map((s) => SKILL_LABEL[s]).join(', ')}
            {b.startingGold ? ` · ${b.startingGold} gp` : ''}
          </OptionCard>
        ))}
      </div>
    </div>
  )
}
