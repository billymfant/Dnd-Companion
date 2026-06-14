import { useState, useEffect, useRef } from 'react'
import { ensureNotes, saveNotes } from '../lib/notes.js'
import Card from './ui/Card.jsx'
import NpcTracker from './NpcTracker.jsx'

// DM notepad + NPC tracker. Loads (or creates) the session's notes row,
// then autosaves edits with a short debounce. Shows a save indicator.
export default function SessionNotes({ sessionId }) {
  const [row, setRow] = useState(null)
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('') // '', 'saving', 'saved'
  const timer = useRef(null)
  const didInit = useRef(false)

  // Load (or create) the notes row exactly once. The ref guard keeps
  // React StrictMode's double-mount from creating two rows.
  useEffect(() => {
    if (!sessionId || didInit.current) return
    didInit.current = true
    ensureNotes(sessionId).then((r) => {
      setRow(r)
      setContent(r?.content || '')
    })
  }, [sessionId])

  // Debounced save whenever `content` changes (but not on first load).
  const scheduleSave = (patch) => {
    if (!row) return
    setStatus('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await saveNotes(row.id, patch)
      setStatus('saved')
    }, 700)
  }

  const onContentChange = (value) => {
    setContent(value)
    scheduleSave({ content: value })
  }

  // NPC changes save immediately (they're discrete actions).
  const onNpcsChange = async (npcs) => {
    setRow((r) => ({ ...r, npcs }))
    setStatus('saving')
    await saveNotes(row.id, { npcs })
    setStatus('saved')
  }

  if (!row) return <p className="text-muted">Loading notes…</p>

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-parchment">📜 Session Notes</h3>
          <span className="text-xs text-muted h-4">
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : ''}
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Plot threads, secrets, loot, reminders…"
          className="w-full h-64 resize-y bg-ink border border-panel-2 rounded-lg px-3 py-2 focus:outline-none focus:border-gold leading-relaxed"
        />
      </Card>

      <NpcTracker npcs={row.npcs || []} onChange={onNpcsChange} />
    </div>
  )
}
