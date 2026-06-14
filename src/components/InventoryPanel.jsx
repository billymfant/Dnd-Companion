import { useState } from 'react'
import { getSheet, patchSheet } from '../lib/characters.js'
import { ARMORS, getArmor } from '../data/srd/index.js'
import { abilityModifier } from '../lib/dnd.js'
import Card from './ui/Card.jsx'

const CURRENCIES = ['cp', 'sp', 'ep', 'gp', 'pp']
const newId = () => 'itm-' + Math.random().toString(36).slice(2, 9)

// Inventory, currency, and encumbrance. Equipping armor recomputes AC.
export default function InventoryPanel({ character }) {
  const sheet = getSheet(character)
  const inventory = sheet.inventory || []
  const currency = sheet.currency || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }

  const [armorKey, setArmorKey] = useState('')
  const [gearName, setGearName] = useState('')

  const strScore = sheet.abilities?.scores?.strength ?? character.strength ?? 10
  const capacity = strScore * 15
  const carried = inventory.reduce((sum, i) => sum + (Number(i.weight) || 0) * (Number(i.qty) || 1), 0)

  function setInventory(next) {
    patchSheet(character, { inventory: next })
  }

  function addArmor() {
    const a = getArmor(armorKey)
    if (!a) return
    setInventory([
      ...inventory,
      { id: newId(), name: a.name, qty: 1, weight: a.weight, type: 'armor', equipped: false, attuned: false, armor: a },
    ])
    setArmorKey('')
  }

  function addGear() {
    const name = gearName.trim()
    if (!name) return
    setInventory([...inventory, { id: newId(), name, qty: 1, weight: 0, type: 'gear', equipped: false, attuned: false }])
    setGearName('')
  }

  function toggleEquip(id) {
    const target = inventory.find((i) => i.id === id)
    if (!target) return
    const isShield = target.armor?.category === 'shield'
    const next = inventory.map((i) => {
      if (i.id === id) return { ...i, equipped: !i.equipped }
      // Only one body armor equipped at a time.
      if (!isShield && i.armor && i.armor.category !== 'shield' && !target.equipped) {
        return { ...i, equipped: false }
      }
      return i
    })
    setInventory(next)
  }

  function toggleAttune(id) {
    setInventory(inventory.map((i) => (i.id === id ? { ...i, attuned: !i.attuned } : i)))
  }

  function remove(id) {
    setInventory(inventory.filter((i) => i.id !== id))
  }

  function setCoin(k, v) {
    patchSheet(character, { currency: { ...currency, [k]: Math.max(0, Number(v) || 0) } })
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-parchment">🎒 Inventory</h3>
        <span className={`text-xs ${carried > capacity ? 'text-blood' : 'text-muted'}`}>
          {carried} / {capacity} lb
        </span>
      </div>

      {/* Currency */}
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {CURRENCIES.map((c) => (
          <label key={c} className="text-center">
            <span className="block text-[10px] text-muted uppercase">{c}</span>
            <input
              type="number"
              min="0"
              value={currency[c] ?? 0}
              data-testid={`currency-${c}`}
              onChange={(e) => setCoin(c, e.target.value)}
              className="w-full rounded-lg bg-ink border border-panel-2 px-1 py-1 text-center text-parchment text-sm focus:outline-none focus:border-gold"
            />
          </label>
        ))}
      </div>

      {/* Items */}
      <ul className="space-y-1.5 mb-3">
        {inventory.length === 0 && <li className="text-sm text-muted">No items yet.</li>}
        {inventory.map((i) => (
          <li key={i.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1 text-parchment">
              {i.name}
              {i.qty > 1 ? ` ×${i.qty}` : ''}
              {i.armor ? <span className="text-muted"> (AC {i.armor.baseAC}{i.armor.category === 'shield' ? '' : i.armor.addDex ? '+DEX' : ''})</span> : ''}
            </span>
            {i.armor && (
              <button
                onClick={() => toggleEquip(i.id)}
                data-testid={`equip-${i.id}`}
                className={`text-xs rounded px-2 py-0.5 ${i.equipped ? 'bg-gold text-ink' : 'bg-panel-2 text-muted'}`}
              >
                {i.equipped ? 'Equipped' : 'Equip'}
              </button>
            )}
            <button
              onClick={() => toggleAttune(i.id)}
              className={`text-xs rounded px-2 py-0.5 ${i.attuned ? 'bg-blood text-parchment' : 'bg-panel-2 text-muted'}`}
              title="Attunement"
            >
              {i.attuned ? 'Attuned' : 'Attune'}
            </button>
            <button onClick={() => remove(i.id)} className="text-muted hover:text-blood" aria-label="Remove">×</button>
          </li>
        ))}
      </ul>

      {/* Add controls */}
      <div className="space-y-2 border-t border-panel-2 pt-3">
        <div className="flex gap-2">
          <select
            value={armorKey}
            onChange={(e) => setArmorKey(e.target.value)}
            data-testid="add-armor-select"
            className="flex-1 rounded-lg bg-ink border border-panel-2 px-2 py-1.5 text-sm text-parchment focus:outline-none focus:border-gold"
          >
            <option value="">Add armor…</option>
            {ARMORS.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
          </select>
          <button onClick={addArmor} data-testid="add-armor-btn" disabled={!armorKey} className="text-sm rounded-lg bg-panel-2 px-3 py-1.5 text-parchment disabled:opacity-40">Add</button>
        </div>
        <div className="flex gap-2">
          <input
            value={gearName}
            onChange={(e) => setGearName(e.target.value)}
            placeholder="Add gear by name…"
            className="flex-1 rounded-lg bg-ink border border-panel-2 px-2 py-1.5 text-sm text-parchment focus:outline-none focus:border-gold"
          />
          <button onClick={addGear} disabled={!gearName.trim()} className="text-sm rounded-lg bg-panel-2 px-3 py-1.5 text-parchment disabled:opacity-40">Add</button>
        </div>
      </div>
    </Card>
  )
}
