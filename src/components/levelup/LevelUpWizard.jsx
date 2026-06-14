import { useState } from 'react'
import { getSheet, saveSheet } from '../../lib/characters.js'
import { applyLevelUp, averageHpForDie } from '../../lib/rules.js'
import {
  getClass, getSubclassInfo, isAsiLevel, FEATS, getFeat, classFeaturesAtLevel,
} from '../../data/srd/index.js'
import { ABILITIES, abilityModifier } from '../../lib/dnd.js'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'

// Guided level-up. Re-derives the sheet via rules.applyLevelUp so HP, features,
// proficiency bonus, subclass, and spell slots all advance consistently.
export default function LevelUpWizard({ character, open, onClose }) {
  const sheet = getSheet(character)
  const build = sheet.build
  const klass = getClass(build?.classKey)
  const newLevel = (sheet.level || 1) + 1

  const subclassInfo = getSubclassInfo(build?.classKey)
  const needsSubclass = subclassInfo && newLevel === subclassInfo.level && !build?.subclassKey
  const asiLevel = build ? isAsiLevel(build.classKey, newLevel) : false

  const conMod = abilityModifier(sheet.abilities?.scores?.constitution ?? 10)
  const avg = klass ? averageHpForDie(klass.hitDie) : 0

  const [hpMode, setHpMode] = useState('avg')
  const [hpRoll, setHpRoll] = useState(null)
  const [asiKind, setAsiKind] = useState('one') // 'one' (+2) | 'two' (+1/+1) | 'feat'
  const [asiOne, setAsiOne] = useState('')
  const [asiTwoA, setAsiTwoA] = useState('')
  const [asiTwoB, setAsiTwoB] = useState('')
  const [featKey, setFeatKey] = useState('')
  const [subclassKey, setSubclassKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  if (!build || !klass) {
    return (
      <Modal open={open} onClose={onClose} title="Level Up">
        <p className="text-muted">
          Guided level-up is available for characters created with the new builder.
        </p>
      </Modal>
    )
  }

  const rolledValue = hpRoll ?? avg
  const projectedGain = Math.max(1, (hpMode === 'roll' ? rolledValue : avg) + conMod)

  // Validity
  let asiValid = true
  if (asiLevel) {
    if (asiKind === 'one') asiValid = Boolean(asiOne)
    else if (asiKind === 'two') asiValid = asiTwoA && asiTwoB && asiTwoA !== asiTwoB
    else asiValid = Boolean(featKey)
  }
  const subclassValid = !needsSubclass || Boolean(subclassKey)
  const hpValid = hpMode === 'avg' || hpRoll != null
  const canConfirm = asiValid && subclassValid && hpValid

  async function confirm() {
    setError('')
    const opts = { hpMode, hpRoll }
    if (asiLevel) {
      if (asiKind === 'one') opts.asi = { changes: { [asiOne]: 2 } }
      else if (asiKind === 'two') opts.asi = { changes: { [asiTwoA]: 1, [asiTwoB]: 1 } }
      else opts.feat = getFeat(featKey)
    }
    if (needsSubclass) opts.subclassKey = subclassKey

    let next
    try {
      next = applyLevelUp(sheet, opts)
    } catch (e) {
      setError(e.message)
      return
    }
    setSaving(true)
    const err = await saveSheet(character.id, next)
    setSaving(false)
    if (err) { setError(err.message || 'Could not save.'); return }
    onClose?.()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Level Up → ${newLevel}`}>
      <div className="space-y-5">
        {/* HP */}
        <section>
          <h3 className="font-display text-lg text-gold mb-2">Hit Points</h3>
          <div className="flex gap-2 mb-2">
            <ModeBtn on={hpMode === 'avg'} onClick={() => setHpMode('avg')}>Average ({avg})</ModeBtn>
            <ModeBtn on={hpMode === 'roll'} onClick={() => setHpMode('roll')}>Roll d{klass.hitDie}</ModeBtn>
          </div>
          {hpMode === 'roll' && (
            <button
              onClick={() => setHpRoll(Math.floor(Math.random() * klass.hitDie) + 1)}
              className="text-sm text-gold hover:underline mb-2"
            >
              🎲 {hpRoll != null ? `Rolled ${hpRoll} — reroll` : 'Roll the die'}
            </button>
          )}
          <p className="text-sm text-muted" data-testid="hp-gain">
            You gain <span className="text-parchment font-semibold">+{projectedGain} HP</span>{' '}
            ({hpMode === 'roll' ? rolledValue : avg} + {conMod} CON).
          </p>
        </section>

        {/* Subclass */}
        {needsSubclass && (
          <section>
            <h3 className="font-display text-lg text-gold mb-2">{subclassInfo.label}</h3>
            <select
              value={subclassKey}
              onChange={(e) => setSubclassKey(e.target.value)}
              data-testid="levelup-subclass"
              className="w-full rounded-lg bg-ink border border-panel-2 px-3 py-2 text-parchment focus:outline-none focus:border-gold"
            >
              <option value="">— Choose —</option>
              {subclassInfo.options.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
            </select>
          </section>
        )}

        {/* ASI / Feat */}
        {asiLevel && (
          <section>
            <h3 className="font-display text-lg text-gold mb-2">Ability Score Improvement</h3>
            <div className="flex gap-2 mb-2 flex-wrap">
              <ModeBtn on={asiKind === 'one'} onClick={() => setAsiKind('one')}>+2 to one</ModeBtn>
              <ModeBtn on={asiKind === 'two'} onClick={() => setAsiKind('two')}>+1 to two</ModeBtn>
              <ModeBtn on={asiKind === 'feat'} onClick={() => setAsiKind('feat')}>Take a Feat</ModeBtn>
            </div>
            {asiKind === 'one' && <AbilitySelect value={asiOne} onChange={setAsiOne} />}
            {asiKind === 'two' && (
              <div className="grid grid-cols-2 gap-2">
                <AbilitySelect value={asiTwoA} onChange={setAsiTwoA} />
                <AbilitySelect value={asiTwoB} onChange={setAsiTwoB} />
              </div>
            )}
            {asiKind === 'feat' && (
              <select
                value={featKey}
                onChange={(e) => setFeatKey(e.target.value)}
                className="w-full rounded-lg bg-ink border border-panel-2 px-3 py-2 text-parchment focus:outline-none focus:border-gold"
              >
                <option value="">— Choose a feat —</option>
                {FEATS.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
              </select>
            )}
          </section>
        )}

        {/* New features preview */}
        <section>
          <h3 className="font-display text-lg text-gold mb-1">New at Level {newLevel}</h3>
          <NewFeatures classKey={build.classKey} level={newLevel} />
        </section>

        {error && <p className="text-blood text-sm" role="alert">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={!canConfirm || saving} data-testid="confirm-levelup">
            {saving ? 'Leveling…' : `Confirm Level ${newLevel}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ModeBtn({ on, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        on ? 'bg-gold text-ink' : 'bg-panel-2 text-parchment hover:brightness-125'
      }`}
    >
      {children}
    </button>
  )
}

function AbilitySelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg bg-ink border border-panel-2 px-3 py-2 text-parchment focus:outline-none focus:border-gold"
    >
      <option value="">— Ability —</option>
      {ABILITIES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
    </select>
  )
}

function NewFeatures({ classKey, level }) {
  const feats = classFeaturesAtLevel(classKey, level)
  if (!feats.length) return <p className="text-sm text-muted">A stronger version of your abilities.</p>
  return (
    <ul className="text-sm text-muted list-disc pl-5 space-y-0.5">
      {feats.map((f) => <li key={f.name}><span className="text-parchment">{f.name}</span> — {f.desc}</li>)}
    </ul>
  )
}
