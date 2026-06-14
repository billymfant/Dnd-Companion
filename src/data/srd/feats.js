// A curated set of popular feats (PHB). Recorded as character features on
// level-up; most mechanical effects are applied at the table. Feats that grant
// a flat ability bump could be modeled later via improvements.
export const FEATS = [
  { key: 'alert', name: 'Alert', desc: '+5 initiative; can’t be surprised while conscious; no advantage to hidden attackers.' },
  { key: 'lucky', name: 'Lucky', desc: '3 luck points/day to reroll an attack, check, save, or an attacker’s roll.' },
  { key: 'tough', name: 'Tough', desc: 'Your HP maximum increases by 2 per level.' },
  { key: 'mobile', name: 'Mobile', desc: '+10 ft speed; Dash through difficult terrain; avoid opportunity attacks.' },
  { key: 'war-caster', name: 'War Caster', desc: 'Advantage on concentration saves; cast with hands full; spell opportunity attacks.' },
  { key: 'great-weapon-master', name: 'Great Weapon Master', desc: 'Bonus attack on crit/kill; −5 to hit for +10 damage with heavy weapons.' },
  { key: 'sharpshooter', name: 'Sharpshooter', desc: 'Ignore cover & long range; −5 to hit for +10 ranged damage.' },
  { key: 'magic-initiate', name: 'Magic Initiate', desc: 'Learn two cantrips and one 1st-level spell from a class.' },
  { key: 'observant', name: 'Observant', desc: '+1 INT or WIS; +5 passive Perception & Investigation; read lips.' },
  { key: 'resilient', name: 'Resilient', desc: '+1 to one ability and proficiency in its saving throws.' },
]

export const FEATS_BY_KEY = Object.fromEntries(FEATS.map((f) => [f.key, f]))
export function getFeat(key) {
  return FEATS_BY_KEY[key] || null
}
