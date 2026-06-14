// ---------------------------------------------------------------
// SRD armor & shields. Used by the inventory panel (add armor) and the
// rules engine (AC = base + DEX within the armor's cap, + shield).
//   category: 'light' | 'medium' | 'heavy' | 'shield'
//   addDex: whether to add the DEX modifier; dexMax caps it (null = no cap)
// ---------------------------------------------------------------
export const ARMORS = [
  // Light — add full DEX
  { key: 'padded', name: 'Padded', category: 'light', baseAC: 11, addDex: true, dexMax: null, weight: 8, stealthDisadv: true },
  { key: 'leather', name: 'Leather', category: 'light', baseAC: 11, addDex: true, dexMax: null, weight: 10 },
  { key: 'studded-leather', name: 'Studded Leather', category: 'light', baseAC: 12, addDex: true, dexMax: null, weight: 13 },
  // Medium — add DEX up to +2
  { key: 'hide', name: 'Hide', category: 'medium', baseAC: 12, addDex: true, dexMax: 2, weight: 12 },
  { key: 'chain-shirt', name: 'Chain Shirt', category: 'medium', baseAC: 13, addDex: true, dexMax: 2, weight: 20 },
  { key: 'scale-mail', name: 'Scale Mail', category: 'medium', baseAC: 14, addDex: true, dexMax: 2, weight: 45, stealthDisadv: true },
  { key: 'breastplate', name: 'Breastplate', category: 'medium', baseAC: 14, addDex: true, dexMax: 2, weight: 20 },
  { key: 'half-plate', name: 'Half Plate', category: 'medium', baseAC: 15, addDex: true, dexMax: 2, weight: 40, stealthDisadv: true },
  // Heavy — no DEX
  { key: 'ring-mail', name: 'Ring Mail', category: 'heavy', baseAC: 14, addDex: false, dexMax: 0, weight: 40, stealthDisadv: true },
  { key: 'chain-mail', name: 'Chain Mail', category: 'heavy', baseAC: 16, addDex: false, dexMax: 0, weight: 55, strReq: 13, stealthDisadv: true },
  { key: 'splint', name: 'Splint', category: 'heavy', baseAC: 17, addDex: false, dexMax: 0, weight: 60, strReq: 15, stealthDisadv: true },
  { key: 'plate', name: 'Plate', category: 'heavy', baseAC: 18, addDex: false, dexMax: 0, weight: 65, strReq: 15, stealthDisadv: true },
  // Shield
  { key: 'shield', name: 'Shield', category: 'shield', baseAC: 2, addDex: false, dexMax: 0, weight: 6 },
]

export const ARMORS_BY_KEY = Object.fromEntries(ARMORS.map((a) => [a.key, a]))
export function getArmor(key) {
  return ARMORS_BY_KEY[key] || null
}
