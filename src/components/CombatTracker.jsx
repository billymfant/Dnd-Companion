import { useState } from 'react'
import { useCombat } from '../hooks/useCombat.js'
import { useRealtimeList } from '../hooks/useRealtimeList.js'
import {
  ensureCombat,
  updateCombat,
  sortByInitiative,
  combatantFromCharacter,
  makeMonster,
  rollInitiativeFor,
  applyCombatantHp,
} from '../lib/combat.js'
import { clamp } from '../lib/dnd.js'
import Card from './ui/Card.jsx'
import Button from './ui/Button.jsx'
import HPBar from './ui/HPBar.jsx'

// DM combat tracker: add players + monsters, roll initiative, advance
// turns, and damage/heal anyone. Everything writes to the `combat` row,
// which is realtime, so players see the initiative order update live.
export default function CombatTracker({ sessionId }) {
  const { combat, loading, refetch } = useCombat(sessionId)
  const { rows: characters } = useRealtimeList('characters', sessionId, { orderBy: 'name' })

  const [monsterName, setMonsterName] = useState('')
  const [monsterHp, setMonsterHp] = useState(10)
  const [monsterInit, setMonsterInit] = useState('')
  const [starting, setStarting] = useState(false) // guards double "Start"

  if (loading) return <p className="text-muted">Loading combat…</p>

  // No combat row yet — offer to start one.
  if (!combat) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted mb-4">No encounter running.</p>
        <Button
          disabled={starting}
          onClick={async () => {
            setStarting(true)
            await ensureCombat(sessionId)
            await refetch() // deterministic: don't wait on the realtime echo
          }}
        >
          ⚔️ Start an encounter
        </Button>
      </Card>
    )
  }

  const combatants = combat.combatants || []
  const ordered = sortByInitiative(combatants)

  // ---- mutations ----
  const save = (next) => updateCombat(combat.id, next)

  const addParty = () => {
    const existing = new Set(combatants.map((c) => c.key))
    const toAdd = characters
      .filter((c) => !existing.has(c.id))
      .map(combatantFromCharacter)
    if (toAdd.length) save({ combatants: [...combatants, ...toAdd] })
  }

  const addMonster = () => {
    if (!monsterName.trim()) return
    const m = makeMonster(monsterName.trim(), monsterHp, monsterInit)
    save({ combatants: [...combatants, m] })
    setMonsterName(''); setMonsterHp(10); setMonsterInit('')
  }

  const removeCombatant = (key) =>
    save({ combatants: combatants.filter((c) => c.key !== key) })

  const setInitiative = (key, value) =>
    save({
      combatants: combatants.map((c) =>
        c.key === key ? { ...c, initiative: value === '' ? null : Number(value) } : c
      ),
    })

  const rollInitiative = () =>
    save({ combatants: rollInitiativeFor(combatants), current_turn: 0 })

  const beginEnd = () =>
    save({ is_active: !combat.is_active, current_turn: 0 })

  const step = (dir) => {
    if (!ordered.length) return
    const n = ordered.length
    save({ current_turn: (((combat.current_turn + dir) % n) + n) % n })
  }

  const damageHeal = (key, delta) => {
    const c = combatants.find((x) => x.key === key)
    if (!c) return
    applyCombatantHp(combat, key, clamp((c.current_hp || 0) + delta, 0, c.max_hp || 0))
  }

  return (
    <div className="space-y-4">
      {/* Turn controls */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={combat.is_active ? 'blood' : 'gold'} onClick={beginEnd}>
            {combat.is_active ? '■ End combat' : '▶ Begin combat'}
          </Button>
          <Button variant="panel" onClick={rollInitiative}>🎲 Roll initiative</Button>
          {combat.is_active && (
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" className="py-1" onClick={() => step(-1)}>‹ Prev</Button>
              <span className="text-sm text-muted">
                Turn <span className="text-gold font-bold">
                  {ordered.length ? combat.current_turn + 1 : 0}
                </span>/{ordered.length}
              </span>
              <Button variant="ghost" className="py-1" onClick={() => step(1)}>Next ›</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Add combatants */}
      <Card className="p-3">
        <div className="flex flex-wrap items-end gap-2">
          <Button variant="panel" onClick={addParty}>＋ Add party</Button>
          <div className="h-6 w-px bg-panel-2 mx-1 hidden sm:block" />
          <div>
            <label className="block text-[11px] text-muted">Monster</label>
            <input value={monsterName} onChange={(e) => setMonsterName(e.target.value)}
              placeholder="Goblin" className="w-28 bg-ink border border-panel-2 rounded px-2 py-1.5" />
          </div>
          <div>
            <label className="block text-[11px] text-muted">HP</label>
            <input type="number" value={monsterHp} onChange={(e) => setMonsterHp(e.target.value)}
              className="w-16 bg-ink border border-panel-2 rounded px-2 py-1.5" />
          </div>
          <div>
            <label className="block text-[11px] text-muted">Init</label>
            <input type="number" value={monsterInit} onChange={(e) => setMonsterInit(e.target.value)}
              placeholder="—" className="w-14 bg-ink border border-panel-2 rounded px-2 py-1.5" />
          </div>
          <Button onClick={addMonster}>Add</Button>
        </div>
      </Card>

      {/* Combatant list */}
      {ordered.length === 0 ? (
        <Card className="p-6 text-center text-muted">
          Add the party and some monsters, then roll initiative.
        </Card>
      ) : (
        <div className="space-y-2">
          {ordered.map((c, i) => {
            const isTurn = combat.is_active && i === combat.current_turn
            return (
              <Card key={c.key}
                className={`p-3 ${isTurn ? 'ring-2 ring-gold' : ''}`}>
                <div className="flex items-center gap-3">
                  {/* initiative */}
                  <input
                    type="number"
                    value={c.initiative ?? ''}
                    onChange={(e) => setInitiative(c.key, e.target.value)}
                    className="w-12 text-center bg-ink border border-panel-2 rounded py-1"
                    title="Initiative"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold truncate ${c.is_player ? 'text-gold' : 'text-parchment'}`}>
                        {c.name}
                      </span>
                      <span className="text-[10px] uppercase text-muted">
                        {c.is_player ? 'PC' : 'NPC'}
                      </span>
                      {isTurn && <span className="text-[10px] text-gold">● turn</span>}
                    </div>
                    <HPBar current={c.current_hp} max={c.max_hp} showNumbers className="mt-1" />
                  </div>
                  {/* HP buttons */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => damageHeal(c.key, -1)}
                      className="w-7 h-7 rounded bg-blood text-parchment">−</button>
                    <button onClick={() => damageHeal(c.key, -5)}
                      className="px-1 h-7 rounded bg-blood/70 text-parchment text-xs">5</button>
                    <button onClick={() => damageHeal(c.key, 5)}
                      className="px-1 h-7 rounded bg-emerald-700 text-parchment text-xs">5</button>
                    <button onClick={() => damageHeal(c.key, 1)}
                      className="w-7 h-7 rounded bg-emerald-600 text-parchment">+</button>
                    <button onClick={() => removeCombatant(c.key)}
                      className="w-7 h-7 rounded bg-panel-2 text-muted hover:text-parchment ml-1"
                      title="Remove">✕</button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
