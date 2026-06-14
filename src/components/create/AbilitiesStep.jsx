import { ABILITIES, abilityModifier, formatModifier } from '../../lib/dnd.js'
import {
  STANDARD_ARRAY,
  POINT_BUY_MIN,
  POINT_BUY_MAX,
  POINT_BUY_COST,
  pointBuyCost,
  pointBuyRemaining,
  rollAbilitySet,
} from '../../data/srd/index.js'
import { StepHeading } from './RaceStep.jsx'
import Card from '../ui/Card.jsx'

const METHODS = [
  { key: 'standard', label: 'Standard Array' },
  { key: 'pointbuy', label: 'Point Buy' },
  { key: 'roll', label: 'Roll 4d6' },
]

// Step 3 — set the six ability scores by one of three methods.
// Racial bonuses are applied automatically downstream (shown in the summary).
export default function AbilitiesStep({ choices, update }) {
  const method = choices.abilities?.method || 'standard'
  const base = choices.abilities?.base || {}
  const rollPool = choices.abilities?.rollPool || null

  function setMethod(next) {
    if (next === method) return
    if (next === 'pointbuy') {
      const eight = Object.fromEntries(ABILITIES.map((a) => [a.key, POINT_BUY_MIN]))
      update({ abilities: { method: next, base: eight } })
    } else {
      update({ abilities: { method: next, base: {}, rollPool: null } })
    }
  }

  return (
    <div>
      <StepHeading title="Ability Scores" subtitle="The raw talent behind every roll. Racial bonuses are added for you." />

      {/* Method tabs */}
      <div className="flex gap-2 mb-4">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMethod(m.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              method === m.key ? 'bg-gold text-ink' : 'bg-panel-2 text-parchment hover:brightness-125'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {method === 'pointbuy' ? (
        <PointBuy base={base} update={update} method={method} />
      ) : (
        <PoolAssign
          base={base}
          update={update}
          method={method}
          pool={method === 'standard' ? STANDARD_ARRAY : rollPool}
          onRoll={() => update({ abilities: { method: 'roll', base: {}, rollPool: rollAbilitySet() } })}
        />
      )}
    </div>
  )
}

// ---- Standard Array & Roll: assign a fixed pool of values --------------
function PoolAssign({ base, update, method, pool, onRoll }) {
  if (method === 'roll' && !pool) {
    return (
      <div className="text-center py-8">
        <p className="text-muted mb-4">Roll six scores with 4d6, dropping the lowest die each time.</p>
        <button onClick={onRoll} className="rounded-lg bg-gold text-ink font-semibold px-5 py-2.5 hover:brightness-110">
          🎲 Roll Scores
        </button>
      </div>
    )
  }

  // Count multiplicities so duplicate rolled values are handled correctly.
  const poolCounts = countBy(pool)
  function usedByOthers(exceptKey) {
    const used = {}
    for (const a of ABILITIES) {
      if (a.key === exceptKey) continue
      const v = base[a.key]
      if (v != null) used[v] = (used[v] || 0) + 1
    }
    return used
  }

  function assign(abilityKey, value) {
    const next = { ...base }
    if (value === '') delete next[abilityKey]
    else next[abilityKey] = Number(value)
    update({ abilities: { method, base: next, rollPool: method === 'roll' ? pool : undefined } })
  }

  const distinctValues = [...new Set(pool)].sort((a, b) => b - a)

  return (
    <div className="space-y-2">
      {method === 'roll' && (
        <div className="flex justify-end mb-2">
          <button onClick={onRoll} className="text-sm text-gold hover:underline">↻ Reroll</button>
        </div>
      )}
      {ABILITIES.map((a) => {
        const used = usedByOthers(a.key)
        const current = base[a.key]
        return (
          <div key={a.key} className="flex items-center gap-3">
            <span className="w-12 text-sm font-semibold text-parchment">{a.label}</span>
            <select
              value={current ?? ''}
              onChange={(e) => assign(a.key, e.target.value)}
              data-testid={`ability-${a.key}`}
              className="flex-1 rounded-lg bg-ink border border-panel-2 px-3 py-2 text-parchment focus:outline-none focus:border-gold"
            >
              <option value="">—</option>
              {distinctValues.map((v) => {
                const available = poolCounts[v] - (used[v] || 0) > 0
                if (!available && current !== v) return null
                return (
                  <option key={v} value={v}>
                    {v}
                  </option>
                )
              })}
            </select>
            <span className="w-10 text-right text-gold font-mono text-sm">
              {current != null ? formatModifier(abilityModifier(current)) : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---- Point Buy: 8–15 each, 27 points ----------------------------------
function PointBuy({ base, update, method }) {
  const remaining = pointBuyRemaining(base)

  function step(abilityKey, dir) {
    const cur = base[abilityKey] ?? POINT_BUY_MIN
    const next = cur + dir
    if (next < POINT_BUY_MIN || next > POINT_BUY_MAX) return
    const candidate = { ...base, [abilityKey]: next }
    if (dir > 0 && pointBuyCost(candidate) > 27) return // can't afford
    update({ abilities: { method, base: candidate } })
  }

  return (
    <div>
      <Card className="p-3 mb-3 flex items-center justify-between">
        <span className="text-sm text-muted">Points remaining</span>
        <span className={`text-xl font-bold ${remaining < 0 ? 'text-blood' : 'text-gold'}`}>{remaining}</span>
      </Card>
      <div className="space-y-2">
        {ABILITIES.map((a) => {
          const v = base[a.key] ?? POINT_BUY_MIN
          return (
            <div key={a.key} className="flex items-center gap-3">
              <span className="w-12 text-sm font-semibold text-parchment">{a.label}</span>
              <button
                type="button"
                onClick={() => step(a.key, -1)}
                disabled={v <= POINT_BUY_MIN}
                className="w-9 h-9 rounded-lg bg-panel-2 text-parchment text-lg disabled:opacity-30"
              >
                −
              </button>
              <span className="w-8 text-center text-lg font-bold text-parchment" data-testid={`ability-${a.key}`}>
                {v}
              </span>
              <button
                type="button"
                onClick={() => step(a.key, +1)}
                disabled={v >= POINT_BUY_MAX || remaining - (POINT_BUY_COST[v + 1] - POINT_BUY_COST[v]) < 0}
                className="w-9 h-9 rounded-lg bg-panel-2 text-parchment text-lg disabled:opacity-30"
              >
                +
              </button>
              <span className="w-10 text-right text-gold font-mono text-sm">
                {formatModifier(abilityModifier(v))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function countBy(arr) {
  const m = {}
  for (const v of arr || []) m[v] = (m[v] || 0) + 1
  return m
}
