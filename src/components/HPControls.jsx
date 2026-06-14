import { useState } from 'react'
import { clamp } from '../lib/dnd.js'
import Button from './ui/Button.jsx'

// Damage / heal control. Calls onApply(newCurrentHp) with the clamped result.
// Reused on the player sheet and (later) the combat tracker.
export default function HPControls({ current, max, onApply }) {
  const [amount, setAmount] = useState(1)

  const apply = (delta) => {
    const next = clamp((Number(current) || 0) + delta, 0, Number(max) || 0)
    onApply(next)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="blood" className="px-3" onClick={() => apply(-amount)}>
        − Damage
      </Button>
      <input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
        className="w-16 text-center bg-ink border border-panel-2 rounded-lg py-1.5 focus:outline-none focus:border-gold"
      />
      <Button variant="gold" className="px-3 bg-emerald-600 text-parchment" onClick={() => apply(amount)}>
        + Heal
      </Button>
    </div>
  )
}
