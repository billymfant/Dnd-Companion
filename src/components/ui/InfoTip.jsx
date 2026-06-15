import { useEffect, useRef, useState } from 'react'

// Reusable info popover. Hover (desktop) or tap (mobile) the ⓘ for a plain-language
// explanation. Safe to render inside clickable cards: it stops click propagation.
export default function InfoTip({ title, children, ability, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!children && !title) return null

  return (
    <span ref={ref} className={`relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        aria-label={title ? `What is ${title}?` : 'More information'}
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o) }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gold/60 text-[10px] font-bold leading-none text-gold transition hover:bg-gold hover:text-ink"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-6 z-50 w-60 -translate-x-1/2 rounded-lg border border-panel-2 bg-ink p-3 text-left text-xs leading-snug shadow-xl"
        >
          {title && <span className="mb-1 block font-display text-sm text-gold">{title}</span>}
          <span className="block text-parchment">{children}</span>
          {ability && <span className="mt-1 block text-[10px] uppercase tracking-wide text-gold/70">Uses {ability}</span>}
        </span>
      )}
    </span>
  )
}
