import { getSheet } from '../lib/characters.js'
import Card from './ui/Card.jsx'

// Read-only spell summary for sheet-backed casters (sheet.spellcasting).
// Shows the casting ability, save DC / attack, slots, cantrips, and the
// known/prepared list. Returns null for non-casters.
export default function SpellbookPanel({ character }) {
  const sc = getSheet(character).spellcasting
  if (!sc) return null

  const slotEntries = Object.entries(sc.slots || {})
  const leveled = sc.prepType === 'prepared' ? sc.prepared : sc.known
  const listLabel = sc.prepType === 'prepared' ? 'Prepared' : 'Known'

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-parchment">✨ Spells</h3>
        <span className="text-xs text-muted uppercase">{sc.ability?.slice(0, 3)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Mini label="Save DC" value={sc.dc} />
        <Mini label="Spell Atk" value={(sc.attack >= 0 ? '+' : '') + sc.attack} />
      </div>

      {slotEntries.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-muted mb-1">{sc.pact ? 'Pact Slots' : 'Spell Slots'}</div>
          <div className="flex flex-wrap gap-2">
            {slotEntries.map(([lvl, s]) => (
              <span key={lvl} className="text-sm rounded-lg bg-ink/40 px-2.5 py-1 text-parchment">
                Lv {lvl}: {s.total}
              </span>
            ))}
          </div>
        </div>
      )}

      <SpellList label="Cantrips" spells={sc.cantrips} />
      <SpellList label={listLabel} spells={leveled} />
    </Card>
  )
}

function Mini({ label, value }) {
  return (
    <div className="text-center rounded-lg bg-ink/40 py-2">
      <div className="text-lg font-bold text-gold leading-none">{value}</div>
      <div className="text-[10px] text-muted uppercase mt-1">{label}</div>
    </div>
  )
}

function SpellList({ label, spells }) {
  if (!spells || spells.length === 0) return null
  return (
    <div className="mt-2">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {spells.map((name) => (
          <span key={name} className="text-sm rounded-lg bg-panel-2 px-2.5 py-1 text-parchment">
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}
