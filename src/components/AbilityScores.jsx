import { ABILITIES, abilityModifier, formatModifier } from '../lib/dnd.js'
import { getSheet } from '../lib/characters.js'
import Card from './ui/Card.jsx'

// Read-only grid of the six ability scores with their modifiers.
// Prefers the canonical sheet's effective scores (sheet.abilities.scores);
// falls back to the legacy flat columns for demo characters.
export default function AbilityScores({ character }) {
  const sheet = getSheet(character)
  const scores = sheet.abilities?.scores
  const scoreFor = (key) => Number(scores?.[key] ?? character[key] ?? 10)

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {ABILITIES.map((a) => (
        <Card key={a.key} className="p-2 text-center">
          <div className="text-xs text-muted">{a.label}</div>
          <div className="text-2xl font-bold text-gold leading-tight">
            {formatModifier(abilityModifier(scoreFor(a.key)))}
          </div>
          <div className="text-xs text-muted">{scoreFor(a.key)}</div>
        </Card>
      ))}
    </div>
  )
}
