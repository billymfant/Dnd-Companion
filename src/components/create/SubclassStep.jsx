import { getSubclassInfo } from '../../data/srd/index.js'
import OptionCard from './OptionCard.jsx'
import { StepHeading } from './RaceStep.jsx'

// Subclass selection — only shown in creation for classes that choose at
// level 1 (Cleric, Sorcerer, Warlock). Others choose during level-up.
export default function SubclassStep({ choices, update }) {
  const info = getSubclassInfo(choices.classKey)
  if (!info) return null

  return (
    <div>
      <StepHeading title={`Choose your ${info.label}`} subtitle="This defining choice shapes your powers from the start." />
      <div className="grid sm:grid-cols-2 gap-3">
        {info.options.map((o) => (
          <OptionCard
            key={o.key}
            testId={`subclass-${o.key}`}
            selected={choices.subclassKey === o.key}
            title={o.name}
            onClick={() => update({ subclassKey: o.key })}
          >
            {o.desc}
          </OptionCard>
        ))}
      </div>
    </div>
  )
}
