// Selectable card used across the creation wizard (race, class, background…).
// `info` (an <InfoTip>) and `badge` (a <MatchBadge>) render as overlays so they
// stay clickable/accessible without nesting inside the card's <button>.
export default function OptionCard({ selected, title, subtitle, onClick, disabled, children, testId, info, badge }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        data-testid={testId}
        aria-pressed={selected}
        className={`text-left rounded-xl border p-4 w-full transition focus:outline-none ${
          selected
            ? 'border-gold bg-gold-soft ring-1 ring-gold shadow-lg'
            : 'border-panel-2 bg-panel hover:border-gold/50'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center justify-between gap-2 pr-6">
          <h3 className="font-display text-lg text-parchment leading-tight">{title}</h3>
          {selected && <span className="text-gold text-sm shrink-0">✓</span>}
        </div>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        {children && <div className="mt-2 text-sm text-muted leading-snug">{children}</div>}
        {badge && <div className="mt-2">{badge}</div>}
      </button>
      {info && <div className="absolute right-2 top-2 z-10">{info}</div>}
    </div>
  )
}
