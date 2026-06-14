import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import CharacterManager from '../components/CharacterManager.jsx'
import CombatTracker from '../components/CombatTracker.jsx'
import DiceRoller from '../components/DiceRoller.jsx'
import RulesLookup from '../components/RulesLookup.jsx'
import SessionNotes from '../components/SessionNotes.jsx'

// Tabs for the DM dashboard. Each phase fills one in.
const TABS = [
  { key: 'party', label: '🛡 Party' },
  { key: 'combat', label: '⚔️ Combat' },
  { key: 'dice', label: '🎲 Dice' },
  { key: 'rules', label: '📖 Rules' },
  { key: 'notes', label: '📜 Notes' },
]

export default function DMView() {
  const session = useStore((s) => s.session)
  const logout = useStore((s) => s.logout)
  const [tab, setTab] = useState('party')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-panel-2 bg-panel/60 sticky top-0 z-10 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold text-blood leading-tight">DM Dashboard</h1>
          <p className="text-xs text-muted">{session?.name ?? '—'}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-muted hover:text-parchment border border-panel-2 rounded-lg px-3 py-1"
        >
          Log out
        </button>
      </header>

      {/* Tab bar (scrolls horizontally on small screens) */}
      <nav className="flex gap-1 px-2 py-2 overflow-x-auto border-b border-panel-2 bg-ink">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
              tab === t.key
                ? 'bg-gold text-ink font-semibold'
                : 'text-muted hover:text-parchment'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <main className="flex-1 p-4 max-w-4xl w-full mx-auto">
        {tab === 'party' && <CharacterManager sessionId={session?.id} />}

        {tab === 'combat' && <CombatTracker sessionId={session?.id} />}
        {tab === 'dice' && <DiceRoller sessionId={session?.id} rollerName="DM" />}
        {tab === 'rules' && <RulesLookup />}
        {tab === 'notes' && <SessionNotes sessionId={session?.id} />}
      </main>
    </div>
  )
}
