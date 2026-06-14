import { ABILITIES, abilityModifier, formatModifier } from '../../lib/dnd.js'
import { SKILLS } from '../../lib/dnd.js'
import { StepHeading } from './RaceStep.jsx'
import Card from '../ui/Card.jsx'

const SKILL_LABEL = Object.fromEntries(SKILLS.map((s) => [s.key, s.label]))

// Step 7 — final review of the derived sheet before committing.
// `sheet` is the output of deriveSheet (computed by the orchestrator).
export default function ReviewStep({ sheet }) {
  if (!sheet) {
    return <p className="text-blood">Something's incomplete — go back and finish each step.</p>
  }
  const id = sheet.identity

  return (
    <div>
      <StepHeading title="Review your Hero" subtitle="One last look before they step into the realm." />

      <Card className="p-4 mb-3">
        <h3 className="font-display text-xl text-gold">{id.name || 'Unnamed'}</h3>
        <p className="text-sm text-muted">
          {[id.subrace || id.race, id.class].filter(Boolean).join(' ')} · {id.background}
          {id.alignment ? ` · ${id.alignment}` : ''}
        </p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Stat label="HP" value={sheet.hp.max} />
          <Stat label="AC" value={sheet.ac} />
          <Stat label="Speed" value={`${sheet.speed} ft`} />
        </div>
      </Card>

      <Card className="p-4 mb-3">
        <h4 className="text-sm font-bold text-parchment mb-2">Ability Scores</h4>
        <div className="grid grid-cols-6 gap-1">
          {ABILITIES.map((a) => (
            <div key={a.key} className="text-center rounded-lg bg-ink/40 py-2">
              <div className="text-[10px] text-muted">{a.label}</div>
              <div className="text-base font-bold text-parchment">{sheet.abilities.scores[a.key]}</div>
              <div className="text-[10px] text-gold">{formatModifier(abilityModifier(sheet.abilities.scores[a.key]))}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card className="p-4">
          <h4 className="text-sm font-bold text-parchment mb-2">Skill Proficiencies</h4>
          <p className="text-sm text-muted">
            {Object.keys(sheet.proficiencies.skills).map((k) => SKILL_LABEL[k] || k).join(', ') || '—'}
          </p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-bold text-parchment mb-2">Features</h4>
          <p className="text-sm text-muted">
            {sheet.features.map((f) => f.name).join(', ') || '—'}
          </p>
        </Card>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="text-center rounded-lg bg-ink/40 py-2">
      <div className="text-lg font-bold text-gold leading-none">{value}</div>
      <div className="text-[10px] text-muted uppercase mt-1">{label}</div>
    </div>
  )
}
