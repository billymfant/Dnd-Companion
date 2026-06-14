import { useCombat } from '../hooks/useCombat.js'
import { sortByInitiative } from '../lib/combat.js'
import Card from './ui/Card.jsx'

// Read-only initiative panel for players. Highlights whose turn it is.
// Hidden when there's no active combat. Updates live via realtime.
export default function InitiativeOrder({ sessionId, myCharacterId }) {
  const { combat } = useCombat(sessionId)

  if (!combat || !combat.is_active) return null
  const ordered = sortByInitiative(combat.combatants || [])
  if (!ordered.length) return null

  return (
    <Card className="p-3">
      <h3 className="font-bold text-parchment mb-2">⚔️ Initiative</h3>
      <ol className="space-y-1">
        {ordered.map((c, i) => {
          const isTurn = i === combat.current_turn
          const isMe = c.character_id && c.character_id === myCharacterId
          return (
            <li
              key={c.key}
              className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                isTurn ? 'bg-gold/20 ring-1 ring-gold' : ''
              }`}
            >
              <span className="w-7 text-center font-mono text-muted">
                {c.initiative ?? '—'}
              </span>
              <span className={`flex-1 ${isMe ? 'text-gold font-bold' : 'text-parchment'}`}>
                {c.name}{isMe ? ' (you)' : ''}
              </span>
              {!c.is_player && <span className="text-[10px] uppercase text-muted">NPC</span>}
              {isTurn && <span className="text-xs text-gold">● turn</span>}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
