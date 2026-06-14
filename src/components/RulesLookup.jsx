import { useState, useEffect } from 'react'
import { searchSpells, searchMonsters, getConditions } from '../lib/open5e.js'
import Card from './ui/Card.jsx'
import Button from './ui/Button.jsx'

const SUB_TABS = [
  { key: 'spells', label: 'Spells' },
  { key: 'monsters', label: 'Monsters' },
  { key: 'conditions', label: 'Conditions' },
]

// DM reference lookup powered by Open5e. Three sub-tabs: spell cards,
// monster stat blocks, and the standard conditions list. Read-only.
export default function RulesLookup() {
  const [sub, setSub] = useState('spells')

  return (
    <div>
      {/* sub-tab switcher */}
      <div className="flex gap-1 mb-4">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              sub === t.key ? 'bg-gold text-ink font-semibold' : 'text-muted hover:text-parchment'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'spells' && <SpellSearch />}
      {sub === 'monsters' && <MonsterSearch />}
      {sub === 'conditions' && <ConditionsList />}
    </div>
  )
}

// Generic search hook-ish helper for spells & monsters.
function useSearch(fn) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError('')
    try {
      setResults(await fn(query.trim()))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  return { query, setQuery, results, loading, error, run }
}

function SearchBar({ value, onChange, onSubmit, placeholder }) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 mb-4">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-ink border border-panel-2 rounded-lg px-3 py-2 focus:outline-none focus:border-gold"
      />
      <Button type="submit">Search</Button>
    </form>
  )
}

function SpellSearch() {
  const { query, setQuery, results, loading, error, run } = useSearch(searchSpells)
  return (
    <div>
      <SearchBar value={query} onChange={setQuery} onSubmit={run} placeholder="Search spells (e.g. Fireball)" />
      {loading && <p className="text-muted">Searching…</p>}
      {error && <p className="text-blood">{error}</p>}
      <div className="space-y-3">
        {results.map((s) => (
          <Card key={s.slug} className="p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-bold text-gold">{s.name}</h3>
              <span className="text-xs text-muted">{s.level} · {s.school}</span>
            </div>
            <div className="text-xs text-muted mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              <span>⏱ {s.casting_time}</span>
              <span>🎯 {s.range}</span>
              <span>⏳ {s.duration}</span>
              <span>🧪 {s.components}</span>
            </div>
            <p className="text-sm text-parchment mt-2 whitespace-pre-wrap">{s.desc}</p>
            {s.higher_level && (
              <p className="text-sm text-muted mt-2 whitespace-pre-wrap">
                <span className="text-gold">At higher levels: </span>{s.higher_level}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function MonsterSearch() {
  const { query, setQuery, results, loading, error, run } = useSearch(searchMonsters)
  const mod = (n) => { const m = Math.floor((n - 10) / 2); return (m >= 0 ? '+' : '') + m }
  return (
    <div>
      <SearchBar value={query} onChange={setQuery} onSubmit={run} placeholder="Search monsters (e.g. Goblin)" />
      {loading && <p className="text-muted">Searching…</p>}
      {error && <p className="text-blood">{error}</p>}
      <div className="space-y-3">
        {results.map((m) => (
          <Card key={m.slug} className="p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-bold text-gold">{m.name}</h3>
              <span className="text-xs text-muted">CR {m.challenge_rating}</span>
            </div>
            <p className="text-xs text-muted italic">{m.size} {m.type}, {m.alignment}</p>
            <div className="text-sm text-parchment mt-2 space-y-0.5">
              <div><span className="text-muted">AC</span> {m.armor_class} · <span className="text-muted">HP</span> {m.hit_points} ({m.hit_dice})</div>
              <div><span className="text-muted">Speed</span> {Object.entries(m.speed || {}).map(([k, v]) => `${k} ${v}`).join(', ')}</div>
            </div>
            {/* ability scores */}
            <div className="grid grid-cols-6 gap-1 text-center my-3">
              {[['STR', m.strength], ['DEX', m.dexterity], ['CON', m.constitution],
                ['INT', m.intelligence], ['WIS', m.wisdom], ['CHA', m.charisma]].map(([lbl, val]) => (
                <div key={lbl} className="bg-ink rounded py-1">
                  <div className="text-[10px] text-muted">{lbl}</div>
                  <div className="text-sm text-parchment">{val} ({mod(val)})</div>
                </div>
              ))}
            </div>
            {Array.isArray(m.actions) && m.actions.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-bold text-parchment">Actions</h4>
                {m.actions.map((a, i) => (
                  <p key={i} className="text-sm text-muted mt-1">
                    <span className="text-parchment font-semibold">{a.name}.</span> {a.desc}
                  </p>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function ConditionsList() {
  const [conditions, setConditions] = useState([])
  const [error, setError] = useState('')
  const [openKey, setOpenKey] = useState(null)

  useEffect(() => {
    getConditions().then(setConditions).catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="text-blood">{error}</p>
  return (
    <div className="space-y-2">
      {conditions.map((c) => (
        <Card key={c.slug} className="p-0 overflow-hidden">
          <button
            onClick={() => setOpenKey(openKey === c.slug ? null : c.slug)}
            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-panel-2"
          >
            <span className="font-bold text-gold">{c.name}</span>
            <span className="text-muted">{openKey === c.slug ? '−' : '+'}</span>
          </button>
          {openKey === c.slug && (
            <p className="px-4 pb-4 text-sm text-parchment whitespace-pre-wrap">{c.desc}</p>
          )}
        </Card>
      ))}
    </div>
  )
}
