import { useState } from 'react'
import { DICE_TYPES } from '../lib/dnd.js'
import { rollAndLog } from '../lib/dice.js'
import Card from './ui/Card.jsx'
import RollLog from './RollLog.jsx'

// Dice roller with the shared log beneath it. `rollerName` is the name
// recorded in the log ("Thrain", or "DM"). Present on both views.
export default function DiceRoller({ sessionId, rollerName }) {
  const [count, setCount] = useState(1)
  const [modifier, setModifier] = useState(0)
  const [label, setLabel] = useState('')
  const [last, setLast] = useState(null) // { type, rolls, result }

  const roll = async (type) => {
    const res = await rollAndLog({ sessionId, name: rollerName, type, count, modifier, label })
    setLast({ type, ...res })
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        {/* Options */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-[11px] text-muted mb-1">How many</label>
            <input type="number" min={1} max={20} value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              className="w-16 bg-ink border border-panel-2 rounded px-2 py-1.5 text-center" />
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1">Modifier</label>
            <input type="number" value={modifier}
              onChange={(e) => setModifier(Number(e.target.value))}
              className="w-16 bg-ink border border-panel-2 rounded px-2 py-1.5 text-center" />
          </div>
          <div className="flex-1 min-w-[8rem]">
            <label className="block text-[11px] text-muted mb-1">Label (optional)</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="Attack roll" className="w-full bg-ink border border-panel-2 rounded px-2 py-1.5" />
          </div>
        </div>

        {/* Dice buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {DICE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => roll(type)}
              className="py-3 rounded-lg bg-panel-2 hover:bg-gold hover:text-ink font-bold text-parchment transition"
            >
              {type}
            </button>
          ))}
        </div>

        {/* Last result */}
        {last && (
          <div className="mt-4 text-center">
            <div className="text-4xl font-bold text-gold">{last.result}</div>
            <div className="text-xs text-muted">
              {count}{last.type}
              {modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''} → rolled [{last.rolls.join(', ')}]
            </div>
          </div>
        )}
      </Card>

      {/* Shared log */}
      <RollLog sessionId={sessionId} />
    </div>
  )
}
