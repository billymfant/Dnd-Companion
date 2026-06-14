import { getSpellSlots, setSpellLevel, patchCharacter } from '../lib/characters.js'
import Card from './ui/Card.jsx'
import Button from './ui/Button.jsx'

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Spell slot tracker. For each spell level the player sets a total and
// taps to spend / regain slots. A "Long rest" button refills everything.
export default function SpellSlots({ character }) {
  const slots = getSpellSlots(character)

  const levelData = (lvl) => slots[lvl] || { total: 0, used: 0 }

  const changeTotal = (lvl, delta) => {
    const d = levelData(lvl)
    const total = Math.max(0, d.total + delta)
    setSpellLevel(character, lvl, { total, used: Math.min(d.used, total) })
  }

  const spend = (lvl) => {
    const d = levelData(lvl)
    if (d.used < d.total) setSpellLevel(character, lvl, { ...d, used: d.used + 1 })
  }
  const regain = (lvl) => {
    const d = levelData(lvl)
    if (d.used > 0) setSpellLevel(character, lvl, { ...d, used: d.used - 1 })
  }

  const longRest = () => {
    const reset = {}
    LEVELS.forEach((lvl) => {
      const d = levelData(lvl)
      if (d.total > 0) reset[lvl] = { total: d.total, used: 0 }
    })
    patchCharacter(character.id, { spell_slots: reset })
  }

  // Only show levels that have any slots, plus always show level 1 to start.
  const visible = LEVELS.filter((lvl) => levelData(lvl).total > 0)
  const showLevels = visible.length ? visible : [1]

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-parchment">Spell Slots</h3>
        <Button variant="ghost" className="text-xs py-1" onClick={longRest}>
          🌙 Long rest
        </Button>
      </div>

      <div className="space-y-2">
        {showLevels.map((lvl) => {
          const d = levelData(lvl)
          return (
            <div key={lvl} className="flex items-center gap-2">
              <span className="w-12 text-sm text-muted">Lvl {lvl}</span>

              {/* slot pips */}
              <div className="flex-1 flex flex-wrap gap-1">
                {Array.from({ length: d.total }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => (i < d.total - d.used ? spend(lvl) : regain(lvl))}
                    className={`w-5 h-5 rounded-full border transition ${
                      i < d.total - d.used
                        ? 'bg-gold border-gold'
                        : 'bg-ink border-muted'
                    }`}
                    title={i < d.total - d.used ? 'Spend slot' : 'Regain slot'}
                  />
                ))}
                {d.total === 0 && <span className="text-xs text-muted">no slots</span>}
              </div>

              {/* adjust total */}
              <div className="flex items-center gap-1">
                <button onClick={() => changeTotal(lvl, -1)}
                  className="w-6 h-6 rounded bg-panel-2 text-parchment">−</button>
                <span className="w-8 text-center text-xs text-muted">{d.used}/{d.total}</span>
                <button onClick={() => changeTotal(lvl, 1)}
                  className="w-6 h-6 rounded bg-panel-2 text-parchment">+</button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-muted mt-2">
        Filled pips = available · tap a pip to spend or regain · use ＋ to set how many slots you have.
      </p>
    </Card>
  )
}
