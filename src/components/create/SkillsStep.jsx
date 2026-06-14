import { SKILLS } from '../../lib/dnd.js'
import { getClass, getRace, getSubrace, getBackground } from '../../data/srd/index.js'
import { StepHeading } from './RaceStep.jsx'

const SKILL_LABEL = Object.fromEntries(SKILLS.map((s) => [s.key, s.label]))

// Step 5 — choose class skill proficiencies (and Half-Elf's two free skills).
// Skills granted by background/race are shown locked.
export default function SkillsStep({ choices, update }) {
  const klass = getClass(choices.classKey)
  const race = getRace(choices.raceKey)
  const subrace = getSubrace(choices.raceKey, choices.subraceKey)
  const background = getBackground(choices.backgroundKey)

  const locked = new Set([
    ...(background?.skills || []),
    ...(race?.proficiencies?.skills || []),
    ...(subrace?.proficiencies?.skills || []),
  ])

  const classFrom = klass?.skillChoices?.from || []
  const classCount = klass?.skillChoices?.count || 0
  const classChosen = choices.classSkills || []

  function toggleClass(key) {
    if (locked.has(key)) return
    const has = classChosen.includes(key)
    let next
    if (has) next = classChosen.filter((k) => k !== key)
    else if (classChosen.length < classCount) next = [...classChosen, key]
    else return
    update({ classSkills: next })
  }

  // Half-Elf Skill Versatility (any two skills)
  const raceChoiceCfg = race?.skillChoices
  const raceChosen = choices.raceSkills || []
  function toggleRace(key) {
    if (locked.has(key) || classChosen.includes(key)) return
    const has = raceChosen.includes(key)
    let next
    if (has) next = raceChosen.filter((k) => k !== key)
    else if (raceChosen.length < (raceChoiceCfg?.count || 0)) next = [...raceChosen, key]
    else return
    update({ raceSkills: next })
  }

  return (
    <div>
      <StepHeading title="Skills & Proficiencies" subtitle="Hone the talents your class lets you choose." />

      <SkillGroup
        title={`Class Skills (${classChosen.length}/${classCount})`}
        hint={`Choose ${classCount} from your class list.`}
        options={classFrom}
        isChosen={(k) => classChosen.includes(k)}
        isLocked={(k) => locked.has(k)}
        onToggle={toggleClass}
      />

      {raceChoiceCfg && (
        <div className="mt-6">
          <SkillGroup
            title={`${race.name} Skills (${raceChosen.length}/${raceChoiceCfg.count})`}
            hint={`Choose ${raceChoiceCfg.count} skills of any kind.`}
            options={SKILLS.map((s) => s.key)}
            isChosen={(k) => raceChosen.includes(k)}
            isLocked={(k) => locked.has(k) || classChosen.includes(k)}
            onToggle={toggleRace}
          />
        </div>
      )}

      {locked.size > 0 && (
        <p className="text-xs text-muted mt-5">
          Granted automatically: {[...locked].map((k) => SKILL_LABEL[k]).join(', ')}
        </p>
      )}
    </div>
  )
}

function SkillGroup({ title, hint, options, isChosen, isLocked, onToggle }) {
  return (
    <div>
      <h3 className="font-display text-lg text-gold">{title}</h3>
      <p className="text-xs text-muted mb-2">{hint}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((k) => {
          const chosen = isChosen(k)
          const lock = isLocked(k)
          return (
            <button
              key={k}
              type="button"
              data-testid={`skill-${k}`}
              onClick={() => onToggle(k)}
              disabled={lock}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition ${
                lock
                  ? 'bg-ink/40 text-muted cursor-not-allowed'
                  : chosen
                  ? 'bg-gold text-ink font-semibold'
                  : 'bg-panel-2 text-parchment hover:brightness-125'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full border shrink-0 ${
                  chosen || lock ? 'bg-current border-current' : 'border-muted'
                }`}
              />
              {SKILL_LABEL[k]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
