import {
  SKILLS,
  abilityModifier,
  formatModifier,
  proficiencyBonus,
} from '../lib/dnd.js'
import { getSkillProficiencies, toggleSkill } from '../lib/characters.js'
import Card from './ui/Card.jsx'

// Lists all 18 skills with a proficiency toggle. The skill bonus =
// ability modifier (+ proficiency bonus when proficient). Tapping a
// skill toggles proficiency and saves it to the character.
export default function SkillsList({ character }) {
  const profs = getSkillProficiencies(character)
  const profBonus = proficiencyBonus(character.level)

  return (
    <Card className="p-3">
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
        {SKILLS.map((s) => {
          const proficient = Boolean(profs[s.key])
          const bonus = abilityModifier(character[s.ability]) + (proficient ? profBonus : 0)
          return (
            <button
              key={s.key}
              onClick={() => toggleSkill(character, s.key)}
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-panel-2 text-left transition"
              title="Tap to toggle proficiency"
            >
              {/* proficiency dot */}
              <span
                className={`w-3 h-3 rounded-full border shrink-0 ${
                  proficient ? 'bg-gold border-gold' : 'border-muted'
                }`}
              />
              <span className="w-10 text-right font-mono text-parchment">
                {formatModifier(bonus)}
              </span>
              <span className="flex-1 text-sm text-parchment">{s.label}</span>
              <span className="text-[10px] text-muted uppercase">
                {s.ability.slice(0, 3)}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-muted mt-2 px-2">
        Tap a skill to toggle proficiency · proficiency bonus +{profBonus}
      </p>
    </Card>
  )
}
