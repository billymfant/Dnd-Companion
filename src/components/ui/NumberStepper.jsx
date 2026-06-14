// A labelled number input with − / + buttons. Used for ability scores,
// HP, level, etc. Keeps everything as a controlled number.
export default function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  className = '',
}) {
  const set = (n) => onChange(Math.min(max, Math.max(min, n)))

  return (
    <div className={className}>
      {label && <label className="block text-xs text-muted mb-1">{label}</label>}
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => set(Number(value) - step)}
          className="px-3 rounded-l-lg bg-panel-2 text-parchment hover:brightness-125"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          className="w-full text-center bg-ink border-y border-panel-2 py-1.5 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => set(Number(value) + step)}
          className="px-3 rounded-r-lg bg-panel-2 text-parchment hover:brightness-125"
        >
          +
        </button>
      </div>
    </div>
  )
}
