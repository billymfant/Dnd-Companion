import { useState } from 'react'
import Card from './ui/Card.jsx'
import Button from './ui/Button.jsx'

// Manages the list of NPCs stored on the notes row (npcs jsonb array).
// Each NPC: { id, name, role, notes }. onChange(nextNpcs) saves them.
export default function NpcTracker({ npcs, onChange }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [notes, setNotes] = useState('')

  const add = () => {
    if (!name.trim()) return
    const npc = { id: crypto.randomUUID(), name: name.trim(), role: role.trim(), notes: notes.trim() }
    onChange([...(npcs || []), npc])
    setName(''); setRole(''); setNotes('')
  }

  const remove = (id) => onChange((npcs || []).filter((n) => n.id !== id))

  const editField = (id, field, value) =>
    onChange((npcs || []).map((n) => (n.id === id ? { ...n, [field]: value } : n)))

  const inputCls = 'bg-ink border border-panel-2 rounded px-2 py-1.5 focus:outline-none focus:border-gold'

  return (
    <Card className="p-4">
      <h3 className="font-bold text-parchment mb-3">🧙 NPCs</h3>

      {/* Add form */}
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mb-4">
        <input className={inputCls} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputCls} placeholder="Role (innkeeper…)" value={role} onChange={(e) => setRole(e.target.value)} />
        <Button onClick={add}>＋ Add NPC</Button>
      </div>

      {/* List */}
      {(npcs || []).length === 0 ? (
        <p className="text-sm text-muted">No NPCs yet.</p>
      ) : (
        <div className="space-y-2">
          {npcs.map((n) => (
            <div key={n.id} className="bg-ink rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  className={`${inputCls} flex-1 font-semibold text-gold`}
                  value={n.name}
                  onChange={(e) => editField(n.id, 'name', e.target.value)}
                />
                <input
                  className={`${inputCls} flex-1`}
                  value={n.role}
                  placeholder="role"
                  onChange={(e) => editField(n.id, 'role', e.target.value)}
                />
                <button onClick={() => remove(n.id)}
                  className="w-8 h-8 rounded bg-panel-2 text-muted hover:text-parchment" title="Remove">✕</button>
              </div>
              <textarea
                className={`${inputCls} w-full h-16 resize-none`}
                placeholder="Notes about this NPC…"
                value={n.notes}
                onChange={(e) => editField(n.id, 'notes', e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
