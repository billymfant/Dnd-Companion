import { clamp } from '../../lib/dnd.js'

// Visual hit-point bar. Color shifts green -> gold -> red as HP drops.
export default function HPBar({ current, max, showNumbers = true, className = '' }) {
  const safeMax = Math.max(1, Number(max) || 1)
  const cur = clamp(Number(current) || 0, 0, safeMax)
  const pct = Math.round((cur / safeMax) * 100)

  // Pick a fill color based on the percentage remaining.
  const color =
    pct > 50 ? 'bg-emerald-600' : pct > 25 ? 'bg-gold' : 'bg-blood'

  return (
    <div className={className}>
      <div className="h-3 w-full rounded-full bg-ink border border-panel-2 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showNumbers && (
        <div className="mt-1 text-xs text-muted">
          <span className="text-parchment font-semibold">{cur}</span> / {safeMax} HP
        </div>
      )}
    </div>
  )
}
