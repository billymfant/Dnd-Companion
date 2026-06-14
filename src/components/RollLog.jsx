import { useRealtimeList } from '../hooks/useRealtimeList.js'
import Card from './ui/Card.jsx'

// Format a timestamp as a short local time (e.g. "7:04 PM").
function shortTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

// The shared roll log. Subscribes to dice_rolls for the session so every
// player and the DM sees each roll appear live, newest first.
export default function RollLog({ sessionId }) {
  const { rows } = useRealtimeList('dice_rolls', sessionId, {
    orderBy: 'rolled_at',
    ascending: false,
    limit: 50,
  })

  return (
    <Card className="p-3">
      <h3 className="font-bold text-parchment mb-2">🎲 Roll Log</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No rolls yet. Roll some dice!</p>
      ) : (
        <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-2 text-sm py-1 border-b border-panel-2/50 last:border-0"
            >
              <span className="text-2xl font-bold text-gold w-10 text-center">{r.result}</span>
              <div className="flex-1 min-w-0">
                <div className="text-parchment truncate">
                  <span className="font-semibold">{r.character_name}</span>{' '}
                  <span className="text-muted">{r.label}</span>
                </div>
              </div>
              <span className="text-[11px] text-muted shrink-0">{shortTime(r.rolled_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
