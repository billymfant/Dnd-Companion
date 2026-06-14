import { ABILITIES, abilityModifier, formatModifier } from '../../lib/dnd.js'
import { effectiveAbilities, deriveSheet } from '../../lib/rules.js'
import { getRace, getSubrace, getClass, getBackground } from '../../data/srd/index.js'
import Card from '../ui/Card.jsx'

// Persistent "character so far" panel shown alongside the wizard steps.
// Everything is best-effort: it renders whatever has been chosen and quietly
// skips derived stats until enough is picked to compute them.
export default function CharacterSummary({ choices }) {
  const race = getRace(choices.raceKey)
  const subrace = getSubrace(choices.raceKey, choices.subraceKey)
  const klass = getClass(choices.classKey)
  const background = getBackground(choices.backgroundKey)

  const hasBase =
    choices.abilities?.base &&
    ABILITIES.every((a) => choices.abilities.base[a.key] != null)

  const scores = hasBase
    ? effectiveAbilities(choices.abilities.base, choices.raceKey, choices.subraceKey, [], choices.raceChoiceBonuses)
    : null

  // Try a full derivation for HP/AC once race + class are known.
  let derived = null
  if (race && klass) {
    try {
      derived = deriveSheet({ ...choices, abilities: { ...choices.abilities, base: choices.abilities?.base || {} } })
    } catch {
      derived = null
    }
  }

  return (
    <Card className="p-5 lg:sticky lg:top-4">
      <div className="text-center mb-4">
        <div className="text-3xl mb-1">📜</div>
        <h2 className="font-display text-xl text-gold leading-tight">
          {choices.identity?.name || 'Your Hero'}
        </h2>
        <p className="text-xs text-muted mt-1">
          {[subrace?.name || race?.name, klass?.name].filter(Boolean).join(' ') || 'Unforged'}
          {background ? ` · ${background.name}` : ''}
        </p>
      </div>

      {derived && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Stat label="HP" value={derived.hp.max} />
          <Stat label="AC" value={derived.ac} />
          <Stat label="Speed" value={`${derived.speed}`} />
        </div>
      )}

      {scores && (
        <div className="grid grid-cols-6 gap-1 mb-4">
          {ABILITIES.map((a) => (
            <div key={a.key} className="text-center rounded-lg bg-ink/40 py-1.5">
              <div className="text-[10px] text-muted">{a.label}</div>
              <div className="text-sm font-bold text-parchment">{scores[a.key]}</div>
              <div className="text-[10px] text-gold">{formatModifier(abilityModifier(scores[a.key]))}</div>
            </div>
          ))}
        </div>
      )}

      <dl className="text-sm space-y-1">
        <Row label="Race" value={subrace?.name || race?.name} />
        <Row label="Class" value={klass?.name} />
        <Row label="Background" value={background?.name} />
        <Row
          label="Skills"
          value={
            derived && Object.keys(derived.proficiencies.skills).length
              ? `${Object.keys(derived.proficiencies.skills).length} proficiencies`
              : null
          }
        />
      </dl>
    </Card>
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

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-2 border-b border-panel-2/60 pb-1">
      <dt className="text-muted">{label}</dt>
      <dd className="text-parchment text-right">{value}</dd>
    </div>
  )
}
