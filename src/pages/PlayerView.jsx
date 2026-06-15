import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useRealtimeRow } from '../hooks/useRealtimeRow.js'
import LevelUpWizard from '../components/levelup/LevelUpWizard.jsx'
import PortraitPicker from '../components/PortraitPicker.jsx'
import Modal from '../components/ui/Modal.jsx'
import { patchCharacter, getSheet, patchSheet } from '../lib/characters.js'
import { abilityModifier, formatModifier, proficiencyBonus } from '../lib/dnd.js'
import Card from '../components/ui/Card.jsx'
import HPBar from '../components/ui/HPBar.jsx'
import HPControls from '../components/HPControls.jsx'
import AbilityScores from '../components/AbilityScores.jsx'
import SkillsList from '../components/SkillsList.jsx'
import SpellSlots from '../components/SpellSlots.jsx'
import SpellbookPanel from '../components/SpellbookPanel.jsx'
import InventoryPanel from '../components/InventoryPanel.jsx'
import CombatStatePanel from '../components/CombatStatePanel.jsx'
import InitiativeOrder from '../components/InitiativeOrder.jsx'
import PlayerJournal from '../components/PlayerJournal.jsx'
import DiceRoller from '../components/DiceRoller.jsx'

// The player's own character sheet. Reads the character with a realtime
// subscription so any HP change (from the DM or combat) appears instantly.
export default function PlayerView() {
  const stored = useStore((s) => s.character)
  const logout = useStore((s) => s.logout)
  const [levelUpOpen, setLevelUpOpen] = useState(false)
  const [portraitOpen, setPortraitOpen] = useState(false)

  // Live character row, keyed by the id we logged in with.
  const { row: character, loading } = useRealtimeRow('characters', stored?.id)

  if (loading) {
    return <Centered>Loading your character…</Centered>
  }
  if (!character) {
    return (
      <Centered>
        <p className="mb-3">This character no longer exists. Ask your DM, then log in again.</p>
        <button onClick={logout} className="text-gold underline">Back to login</button>
      </Centered>
    )
  }

  const applyHp = (newCurrent) => patchCharacter(character.id, { current_hp: newCurrent })

  // Derived combat stats from the canonical sheet (falls back gracefully).
  const sheet = getSheet(character)
  const dexScore = sheet.abilities?.scores?.dexterity ?? character.dexterity ?? 10
  const initiative = abilityModifier(dexScore)
  const ac = sheet.ac ?? 10 + initiative
  const speed = sheet.speed ?? 30
  const profBonus = proficiencyBonus(character.level)
  const stats = [
    { label: 'Armor Class', value: ac },
    { label: 'Init.', value: formatModifier(initiative) },
    { label: 'Speed', value: `${speed} ft` },
    { label: 'Prof. Bonus', value: formatModifier(profBonus) },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-panel-2 bg-panel/60 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-3">
          {sheet.build && (
            <button
              onClick={() => setPortraitOpen(true)}
              data-testid="portrait-edit"
              title="Change portrait"
              className="shrink-0 rounded-xl overflow-hidden border-2 border-panel-2 hover:border-gold w-12 h-12 bg-ink flex items-center justify-center"
            >
              {character.avatar_url
                ? <img src={character.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-xl">🧙</span>}
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gold leading-tight">{character.name}</h1>
            <p className="text-xs text-muted">
              {[character.race, character.class].filter(Boolean).join(' ') || 'Adventurer'} · Level {character.level}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sheet.build && (
            <button
              onClick={() => setLevelUpOpen(true)}
              data-testid="level-up-btn"
              className="text-sm font-semibold text-ink bg-gold rounded-lg px-3 py-1 hover:brightness-110"
            >
              ⬆ Level Up
            </button>
          )}
          <button
            onClick={logout}
            className="text-sm text-muted hover:text-parchment border border-panel-2 rounded-lg px-3 py-1"
          >
            Log out
          </button>
        </div>
      </header>

      <LevelUpWizard
        character={character}
        open={levelUpOpen}
        onClose={() => setLevelUpOpen(false)}
      />

      <Modal open={portraitOpen} onClose={() => setPortraitOpen(false)} title="Choose your Portrait">
        <PortraitPicker
          value={character.avatar_url || ''}
          onChange={(url) =>
            patchSheet(character, { identity: { ...sheet.identity, avatarUrl: url } })
          }
        />
      </Modal>

      <main className="flex-1 p-4 max-w-3xl w-full mx-auto space-y-4">
        {/* HP */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-parchment">Hit Points</h2>
          </div>
          <HPBar current={character.current_hp} max={character.max_hp} />
          <div className="mt-3">
            <HPControls
              current={character.current_hp}
              max={character.max_hp}
              onApply={applyHp}
            />
          </div>
        </Card>

        {/* Derived combat stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stats.map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <div className="text-2xl font-bold text-gold leading-tight">{s.value}</div>
              <div className="text-[11px] text-muted uppercase tracking-wide">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Initiative order (only visible during active combat) */}
        <InitiativeOrder sessionId={character.session_id} myCharacterId={character.id} />

        {/* Ability scores */}
        <AbilityScores character={character} />

        {/* Skills + spells side by side on desktop */}
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          <SkillsList character={character} />
          {sheet.spellcasting ? (
            <SpellbookPanel character={character} />
          ) : (
            <SpellSlots character={character} />
          )}
        </div>

        {/* Inventory + combat state (sheet-backed characters) */}
        {sheet.build && (
          <div className="grid lg:grid-cols-2 gap-4 items-start">
            <InventoryPanel character={character} />
            <CombatStatePanel character={character} />
          </div>
        )}

        {/* Backstory */}
        {character.backstory && (
          <Card className="p-4">
            <h3 className="font-bold text-parchment mb-1">Backstory</h3>
            <p className="text-sm text-muted whitespace-pre-wrap">{character.backstory}</p>
          </Card>
        )}

        {/* Campaign Journal (DM-revealed lore) */}
        <PlayerJournal sessionId={character.session_id} />

        {/* Dice roller + shared log */}
        <div>
          <h2 className="font-bold text-parchment mb-2">Dice</h2>
          <DiceRoller sessionId={character.session_id} rollerName={character.name} />
        </div>
      </main>
    </div>
  )
}

// Small helper for full-screen centered messages.
function Centered({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-center text-muted p-6">
      <div>{children}</div>
    </div>
  )
}
