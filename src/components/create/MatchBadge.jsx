// Small, non-blocking guidance tag. `level` is 'great' | 'good' | null from
// lib/synergy.js raceMatch(); `label` overrides the text (e.g. "Key stat").
const STYLES = {
  great: 'border-gold bg-gold text-ink',
  good: 'border-gold/50 bg-gold-soft text-gold',
}
const TEXT = { great: '✦ Great match', good: 'Good match' }

export default function MatchBadge({ level, label }) {
  if (!level && !label) return null
  const style = STYLES[level] || 'border-gold/50 bg-gold-soft text-gold'
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style}`}>
      {label || TEXT[level]}
    </span>
  )
}
