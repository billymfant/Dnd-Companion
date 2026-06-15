import { useRealtimeList } from '../hooks/useRealtimeList.js'
import Card from './ui/Card.jsx'

// Same category order/labels as the DM Codex.
const CATEGORIES = [
  { key: 'story', label: 'Story', icon: '📖' },
  { key: 'npc', label: 'NPCs', icon: '🧑' },
  { key: 'location', label: 'Locations', icon: '🗺️' },
  { key: 'faction', label: 'Factions', icon: '⚔️' },
]

// Read-only player view of campaign lore. Shows ONLY entries the DM has
// revealed; updates live as the DM reveals/edits/hides them.
export default function PlayerJournal({ sessionId }) {
  const { rows } = useRealtimeList('lore_entries', sessionId, {
    orderBy: 'sort_order',
  })
  const revealed = rows.filter((r) => r.revealed)

  return (
    <div data-testid="journal">
      <h2 className="font-bold text-parchment mb-2">📕 Journal</h2>
      {revealed.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-muted">Your DM hasn’t shared any lore yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const entries = revealed.filter((r) => r.category === cat.key)
            if (entries.length === 0) return null
            return (
              <div key={cat.key}>
                <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-2">
                  {cat.icon} {cat.label}
                </h3>
                <div className="space-y-2">
                  {entries.map((e) => (
                    <Card key={e.id} data-testid="journal-entry" className="p-3">
                      <h4 className="font-semibold text-parchment">{e.title}</h4>
                      {e.body && (
                        <p className="text-sm text-muted mt-1 whitespace-pre-wrap">
                          {e.body}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
