import { getSheet, patchSheet } from '../lib/characters.js'
import { CONDITIONS } from '../data/srd/index.js'
import Card from './ui/Card.jsx'

const EMPTY = { conditions: [], exhaustion: 0, deathSaves: { successes: 0, failures: 0 } }

// Temp HP, conditions, exhaustion, and death saves — the in-combat lifecycle.
export default function CombatStatePanel({ character }) {
  const sheet = getSheet(character)
  const cs = { ...EMPTY, ...(sheet.combatState || {}) }
  const deathSaves = { successes: 0, failures: 0, ...(cs.deathSaves || {}) }
  const tempHp = sheet.hp?.temp ?? 0

  const saveCombat = (patch) => patchSheet(character, { combatState: { ...cs, ...patch } })

  function setTempHp(v) {
    patchSheet(character, { hp: { ...(sheet.hp || {}), temp: Math.max(0, Number(v) || 0) } })
  }
  function toggleCondition(name) {
    const has = cs.conditions.includes(name)
    saveCombat({ conditions: has ? cs.conditions.filter((c) => c !== name) : [...cs.conditions, name] })
  }
  function setExhaustion(v) {
    saveCombat({ exhaustion: Math.min(6, Math.max(0, v)) })
  }
  function setDeath(kind, n) {
    const cur = deathSaves[kind]
    const next = cur === n ? n - 1 : n
    saveCombat({ deathSaves: { ...deathSaves, [kind]: next } })
  }

  return (
    <Card className="p-4">
      <h3 className="font-bold text-parchment mb-3">🩸 Combat State</h3>

      {/* Temp HP + Exhaustion */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="block">
          <span className="block text-[11px] text-muted uppercase mb-1">Temp HP</span>
          <input
            type="number" min="0" value={tempHp}
            data-testid="temp-hp"
            onChange={(e) => setTempHp(e.target.value)}
            className="w-full rounded-lg bg-ink border border-panel-2 px-2 py-1.5 text-center text-parchment focus:outline-none focus:border-gold"
          />
        </label>
        <div>
          <span className="block text-[11px] text-muted uppercase mb-1">Exhaustion</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setExhaustion(cs.exhaustion - 1)} className="w-8 h-8 rounded-lg bg-panel-2 text-parchment disabled:opacity-30" disabled={cs.exhaustion <= 0}>−</button>
            <span className="w-6 text-center font-bold text-parchment" data-testid="exhaustion">{cs.exhaustion}</span>
            <button onClick={() => setExhaustion(cs.exhaustion + 1)} className="w-8 h-8 rounded-lg bg-panel-2 text-parchment disabled:opacity-30" disabled={cs.exhaustion >= 6}>+</button>
          </div>
        </div>
      </div>

      {/* Death saves */}
      <div className="mb-4">
        <span className="block text-[11px] text-muted uppercase mb-1">Death Saves</span>
        <div className="flex items-center gap-4">
          <Pips label="Successes" kind="success" color="bg-gold" count={deathSaves.successes} onPip={(n) => setDeath('successes', n)} />
          <Pips label="Failures" kind="fail" color="bg-blood" count={deathSaves.failures} onPip={(n) => setDeath('failures', n)} />
        </div>
      </div>

      {/* Conditions */}
      <div>
        <span className="block text-[11px] text-muted uppercase mb-1">Conditions</span>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((name) => {
            const on = cs.conditions.includes(name)
            return (
              <button
                key={name}
                onClick={() => toggleCondition(name)}
                data-testid={`condition-${name}`}
                className={`text-xs rounded-full px-2.5 py-1 transition ${on ? 'bg-blood text-parchment' : 'bg-panel-2 text-muted hover:text-parchment'}`}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function Pips({ label, kind, color, count, onPip }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted">{label}</span>
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          onClick={() => onPip(n)}
          data-testid={`death-${kind}-${n}`}
          className={`w-4 h-4 rounded-full border ${n <= count ? `${color} border-transparent` : 'border-muted'}`}
        />
      ))}
    </div>
  )
}
