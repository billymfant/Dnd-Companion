import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { ABILITIES, abilityModifier, formatModifier } from '../lib/dnd.js'
import Button from './ui/Button.jsx'
import NumberStepper from './ui/NumberStepper.jsx'

// Sensible defaults for a brand-new level-1 character.
function blankCharacter(sessionId) {
  return {
    session_id: sessionId,
    name: '',
    pin: '',
    class: '',
    race: '',
    level: 1,
    max_hp: 10,
    current_hp: 10,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    backstory: '',
  }
}

// Form used by the DM to create or edit a character.
// Pass an existing `character` to edit, or null to create a new one.
export default function CharacterForm({ character, sessionId, onSaved, onCancel }) {
  const isEdit = Boolean(character?.id)
  const [form, setForm] = useState(character ? { ...character } : blankCharacter(sessionId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Character needs a name.')
    if (!String(form.pin).trim()) return setError('Give the player a PIN to log in with.')

    setSaving(true)

    // Only send the columns that exist on the table.
    const payload = {
      session_id: sessionId,
      name: form.name.trim(),
      pin: String(form.pin).trim(),
      class: form.class?.trim() || null,
      race: form.race?.trim() || null,
      level: Number(form.level) || 1,
      max_hp: Number(form.max_hp) || 1,
      current_hp: Number(form.current_hp) || 0,
      strength: Number(form.strength),
      dexterity: Number(form.dexterity),
      constitution: Number(form.constitution),
      intelligence: Number(form.intelligence),
      wisdom: Number(form.wisdom),
      charisma: Number(form.charisma),
      backstory: form.backstory?.trim() || null,
    }

    const query = isEdit
      ? supabase.from('characters').update(payload).eq('id', character.id)
      : supabase.from('characters').insert(payload)

    const { error: err } = await query
    setSaving(false)
    if (err) return setError(err.message)
    onSaved?.()
  }

  const inputCls =
    'w-full rounded-lg bg-ink border border-panel-2 px-3 py-2 focus:outline-none focus:border-gold'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name + PIN */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Character name</label>
          <input className={inputCls} value={form.name}
            onChange={(e) => update('name', e.target.value)} placeholder="Thrain" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Player PIN</label>
          <input className={inputCls} value={form.pin}
            onChange={(e) => update('pin', e.target.value)} placeholder="1234" inputMode="numeric" />
        </div>
      </div>

      {/* Class / Race / Level */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Class</label>
          <input className={inputCls} value={form.class || ''}
            onChange={(e) => update('class', e.target.value)} placeholder="Fighter" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Race</label>
          <input className={inputCls} value={form.race || ''}
            onChange={(e) => update('race', e.target.value)} placeholder="Dwarf" />
        </div>
        <NumberStepper label="Level" value={form.level} min={1} max={20}
          onChange={(n) => update('level', n)} />
      </div>

      {/* HP */}
      <div className="grid grid-cols-2 gap-3">
        <NumberStepper label="Max HP" value={form.max_hp} min={1} max={999}
          onChange={(n) => update('max_hp', n)} />
        <NumberStepper label="Current HP" value={form.current_hp} min={0} max={999}
          onChange={(n) => update('current_hp', n)} />
      </div>

      {/* Ability scores with live modifiers */}
      <div>
        <label className="block text-xs text-muted mb-2">Ability scores</label>
        <div className="grid grid-cols-3 gap-3">
          {ABILITIES.map((a) => (
            <div key={a.key}>
              <NumberStepper
                label={`${a.label} (${formatModifier(abilityModifier(form[a.key]))})`}
                value={form[a.key]}
                min={1}
                max={30}
                onChange={(n) => update(a.key, n)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Backstory */}
      <div>
        <label className="block text-xs text-muted mb-1">Backstory (optional)</label>
        <textarea className={`${inputCls} h-20 resize-none`} value={form.backstory || ''}
          onChange={(e) => update('backstory', e.target.value)} />
      </div>

      {error && <p className="text-blood text-sm" role="alert">{error}</p>}

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create character'}
        </Button>
      </div>
    </form>
  )
}
