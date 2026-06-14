// Themed button with a few visual variants.
//   variant: 'gold' (primary) | 'blood' (danger) | 'ghost' (subtle) | 'panel'
const VARIANTS = {
  gold: 'bg-gold text-ink hover:brightness-110 active:brightness-95',
  blood: 'bg-blood text-parchment hover:brightness-110 active:brightness-95',
  ghost:
    'bg-transparent text-muted hover:text-parchment border border-panel-2 hover:border-gold',
  panel: 'bg-panel-2 text-parchment hover:brightness-125',
}

export default function Button({
  variant = 'gold',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`rounded-lg font-semibold px-3 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
