import { StepHeading } from './RaceStep.jsx'

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
]

// Step 6 — name, alignment, and roleplay details.
export default function DescribeStep({ choices, update }) {
  const id = choices.identity || {}
  const setId = (patch) => update({ identity: { ...id, ...patch } })
  const personality = id.personality || { traits: '', ideals: '', bonds: '', flaws: '' }
  const setP = (patch) => setId({ personality: { ...personality, ...patch } })

  return (
    <div>
      <StepHeading title="Describe your Hero" subtitle="Give them a name and a soul." />

      <label className="block text-sm text-muted mb-1" htmlFor="char-name">Character name</label>
      <input
        id="char-name"
        value={id.name || ''}
        onChange={(e) => setId({ name: e.target.value })}
        className="w-full rounded-lg bg-ink border border-panel-2 px-3 py-2 mb-4 text-parchment focus:outline-none focus:border-gold"
        placeholder="e.g. Thrain Stonefist"
      />

      <label className="block text-sm text-muted mb-1" htmlFor="char-alignment">Alignment</label>
      <select
        id="char-alignment"
        value={id.alignment || ''}
        onChange={(e) => setId({ alignment: e.target.value })}
        className="w-full rounded-lg bg-ink border border-panel-2 px-3 py-2 mb-4 text-parchment focus:outline-none focus:border-gold"
      >
        <option value="">— Select —</option>
        {ALIGNMENTS.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Personality Traits" value={personality.traits} onChange={(v) => setP({ traits: v })} />
        <Field label="Ideals" value={personality.ideals} onChange={(v) => setP({ ideals: v })} />
        <Field label="Bonds" value={personality.bonds} onChange={(v) => setP({ bonds: v })} />
        <Field label="Flaws" value={personality.flaws} onChange={(v) => setP({ flaws: v })} />
      </div>

      <label className="block text-sm text-muted mb-1 mt-4" htmlFor="char-backstory">Backstory</label>
      <textarea
        id="char-backstory"
        rows={4}
        value={id.backstory || ''}
        onChange={(e) => setId({ backstory: e.target.value })}
        className="w-full rounded-lg bg-ink border border-panel-2 px-3 py-2 text-parchment focus:outline-none focus:border-gold resize-y"
        placeholder="Where do they come from? What drives them?"
      />
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-muted mb-1">{label}</label>
      <textarea
        rows={2}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-ink border border-panel-2 px-3 py-2 text-parchment text-sm focus:outline-none focus:border-gold resize-y"
      />
    </div>
  )
}
