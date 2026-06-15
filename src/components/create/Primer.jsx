import { useState } from 'react'
import { getConcept } from '../../data/srd/glossary.js'

// Collapsible "New to D&D?" banner at the top of a wizard step. Pass one or
// more glossary concept keys; renders their term + detail. Collapsible so
// veterans can dismiss it (per-mount; cheap and stateless across sessions).
export default function Primer({ concepts = [], heading = 'New to D&D?' }) {
  const [open, setOpen] = useState(true)
  const entries = concepts.map(getConcept).filter(Boolean)
  if (!entries.length) return null

  return (
    <div className="mb-4 rounded-xl border border-gold/30 bg-gold-soft/40 p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-display text-sm text-gold">📖 {heading}</span>
        <span className="text-xs text-muted">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {entries.map((c) => (
            <p key={c.term} className="text-xs leading-snug text-parchment">
              <span className="font-semibold text-gold">{c.term}:</span> {c.detail}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
