import { useState } from 'react'
import { useRealtimeList } from '../hooks/useRealtimeList.js'
import { createLore, updateLore, toggleReveal, deleteLore } from '../lib/lore.js'
import Card from './ui/Card.jsx'
import Button from './ui/Button.jsx'
import Modal from './ui/Modal.jsx'

// Fixed display order + labels for the four lore categories.
const CATEGORIES = [
  { key: 'story', label: 'Story', icon: '📖' },
  { key: 'npc', label: 'NPCs', icon: '🧑' },
  { key: 'location', label: 'Locations', icon: '🗺️' },
  { key: 'faction', label: 'Factions', icon: '⚔️' },
]

const blankDraft = { id: null, category: 'story', title: '', body: '' }

// DM-only authoring surface for campaign lore. Entries are private until the
// DM reveals them (👁), at which point they appear in the player Journal live.
export default function CampaignCodex({ sessionId }) {
  const { rows, refetch } = useRealtimeList('lore_entries', sessionId, {
    orderBy: 'sort_order',
  })
  const [draft, setDraft] = useState(null) // null = modal closed

  const openNew = () => setDraft({ ...blankDraft })
  const openEdit = (e) =>
    setDraft({ id: e.id, category: e.category, title: e.title, body: e.body })

  async function save() {
    if (!draft?.title.trim()) return
    if (draft.id) {
      await updateLore(draft.id, {
        category: draft.category,
        title: draft.title.trim(),
        body: draft.body,
      })
    } else {
      await createLore(sessionId, {
        category: draft.category,
        title: draft.title.trim(),
        body: draft.body,
      })
      await refetch() // don't rely on the realtime echo of our own insert
    }
    setDraft(null)
  }

  async function remove(e) {
    if (!window.confirm(`Delete “${e.title}”?`)) return
    await deleteLore(e.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-parchment">Campaign Codex</h2>
          <p className="text-xs text-muted">
            Private lore. Reveal an entry (👁) to share it to the players’ Journal.
          </p>
        </div>
        <Button data-testid="codex-add" onClick={openNew}>
          + New Entry
        </Button>
      </div>

      {CATEGORIES.map((cat) => {
        const entries = rows.filter((r) => r.category === cat.key)
        return (
          <div key={cat.key}>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-2">
              {cat.icon} {cat.label}
            </h3>
            {entries.length === 0 ? (
              <p className="text-xs text-muted/70 mb-2">No entries yet.</p>
            ) : (
              <div className="space-y-2">
                {entries.map((e) => (
                  <Card key={e.id} data-testid="codex-entry" className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-parchment truncate">
                            {e.title}
                          </span>
                          {e.revealed && (
                            <span className="shrink-0 text-[10px] font-semibold text-ink bg-gold rounded px-1.5 py-0.5">
                              Revealed
                            </span>
                          )}
                        </div>
                        {e.body && (
                          <p className="text-xs text-muted mt-1 line-clamp-2 whitespace-pre-wrap">
                            {e.body}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <IconBtn
                          data-testid="codex-reveal"
                          title={e.revealed ? 'Hide from players' : 'Reveal to players'}
                          onClick={() => toggleReveal(e.id, !e.revealed)}
                          active={e.revealed}
                        >
                          👁
                        </IconBtn>
                        <IconBtn title="Edit" onClick={() => openEdit(e)}>
                          ✏️
                        </IconBtn>
                        <IconBtn title="Delete" onClick={() => remove(e)}>
                          🗑
                        </IconBtn>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit Entry' : 'New Entry'}
      >
        {draft && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">Category</span>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="mt-1 w-full bg-ink border border-panel-2 rounded-lg px-3 py-2 text-parchment"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-muted">Title</span>
              <input
                data-testid="codex-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. The Sundered Crown"
                className="mt-1 w-full bg-ink border border-panel-2 rounded-lg px-3 py-2 text-parchment"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Body</span>
              <textarea
                data-testid="codex-body"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={6}
                placeholder="Lore, secrets, descriptions…"
                className="mt-1 w-full bg-ink border border-panel-2 rounded-lg px-3 py-2 text-parchment resize-y"
              />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button
                data-testid="codex-save"
                onClick={save}
                disabled={!draft.title.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function IconBtn({ children, active = false, className = '', ...props }) {
  return (
    <button
      className={`rounded-lg px-2 py-1 text-sm border transition ${
        active
          ? 'border-gold bg-gold/10'
          : 'border-panel-2 hover:border-gold opacity-70 hover:opacity-100'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
