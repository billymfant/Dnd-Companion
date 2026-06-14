import { supabase } from './supabase.js'
import { rollDice } from './dnd.js'

// Roll dice locally and record the result in the shared `dice_rolls`
// log so everyone in the session sees it (via realtime).
//
// Returns { rolls, total, result } where result includes the modifier.
export async function rollAndLog({ sessionId, name, type, count = 1, modifier = 0, label }) {
  const { rolls, total } = rollDice(type, count)
  const mod = Number(modifier) || 0
  const result = total + mod

  // Build a readable description, e.g. "2d6+3 [4,5]".
  const modStr = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : ''
  const auto = `${count}${type}${modStr} [${rolls.join(',')}]`
  const desc = label?.trim() ? `${label.trim()} · ${auto}` : auto

  const { error } = await supabase.from('dice_rolls').insert({
    session_id: sessionId,
    character_name: name || 'Someone',
    dice_type: type,
    result,
    label: desc,
  })
  if (error) console.error('[rollAndLog]', error.message)

  return { rolls, total, result }
}
