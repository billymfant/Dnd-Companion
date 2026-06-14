import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useRealtimeList } from '../hooks/useRealtimeList.js'
import { abilityModifier, formatModifier, ABILITIES } from '../lib/dnd.js'
import Card from './ui/Card.jsx'
import Button from './ui/Button.jsx'
import Modal from './ui/Modal.jsx'
import HPBar from './ui/HPBar.jsx'
import CharacterForm from './CharacterForm.jsx'

// DM "Party" tab: list, create, edit, and delete characters.
// The list is realtime, so HP changes during play update these cards live.
export default function CharacterManager({ sessionId }) {
  const { rows: characters, loading } = useRealtimeList('characters', sessionId, {
    orderBy: 'name',
    ascending: true,
  })

  const [editing, setEditing] = useState(null) // character object or null
  const [creating, setCreating] = useState(false)

  async function handleDelete(character) {
    if (!window.confirm(`Delete ${character.name}? This cannot be undone.`)) return
    const { error } = await supabase.from('characters').delete().eq('id', character.id)
    if (error) alert('Could not delete: ' + error.message)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-parchment">Party ({characters.length})</h2>
        <Button onClick={() => setCreating(true)}>＋ New character</Button>
      </div>

      {loading ? (
        <p className="text-muted">Loading characters…</p>
      ) : characters.length === 0 ? (
        <Card className="p-6 text-center text-muted">
          No characters yet. Create one and give each player their PIN.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {characters.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {c.avatar_url && (
                    <img src={c.avatar_url} alt="" className="w-11 h-11 rounded-lg object-cover border border-panel-2 bg-ink shrink-0" />
                  )}
                  <div>
                    <div className="text-lg font-bold text-gold">{c.name}</div>
                    <div className="text-xs text-muted">
                      {[c.race, c.class].filter(Boolean).join(' ') || 'Adventurer'} · Lvl {c.level}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted">
                  PIN <span className="text-parchment font-mono">{c.pin}</span>
                </div>
              </div>

              <HPBar current={c.current_hp} max={c.max_hp} className="mt-3" />

              {/* Quick ability modifier strip */}
              <div className="mt-3 grid grid-cols-6 gap-1 text-center">
                {ABILITIES.map((a) => (
                  <div key={a.key} className="bg-ink rounded py-1">
                    <div className="text-[10px] text-muted">{a.label}</div>
                    <div className="text-sm text-parchment">
                      {formatModifier(abilityModifier(c[a.key]))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2 justify-end">
                <Button variant="ghost" className="text-sm py-1" onClick={() => setEditing(c)}>
                  Edit
                </Button>
                <Button variant="blood" className="text-sm py-1" onClick={() => handleDelete(c)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="New character">
        <CharacterForm
          character={null}
          sessionId={sessionId}
          onSaved={() => setCreating(false)}
          onCancel={() => setCreating(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Edit ${editing?.name || ''}`}>
        {editing && (
          <CharacterForm
            character={editing}
            sessionId={sessionId}
            onSaved={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}
