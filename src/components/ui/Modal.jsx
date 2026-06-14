import { useEffect } from 'react'

// Centered modal dialog with a dark backdrop.
// Closes on Escape or backdrop click. `title` is optional.
export default function Modal({ open, onClose, title, children }) {
  // Close on Escape key while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-panel border border-panel-2 rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()} // don't close when clicking inside
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-panel-2 sticky top-0 bg-panel">
            <h2 className="text-lg font-bold text-gold">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-parchment text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
