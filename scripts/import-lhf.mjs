// Imports the "Lost in the High Forest" module (by Fred Love) into the Campaign
// Codex (`lore_entries`) of a target session. Source text: scripts/lost-in-high-forest.txt
// (transcribed from the rendered page images lhf-page-1..6.png).
//
// Every entry is inserted HIDDEN (revealed=false) so the DM reveals each beat to
// the player Journal as the party progresses. Idempotent: it skips any entry whose
// exact title already exists in the session, so re-runs won't duplicate.
//
// Run:
//   node scripts/import-lhf.mjs                 # -> session with join_code "mithral"
//   node scripts/import-lhf.mjs --code=mithral  # by join code
//   node scripts/import-lhf.mjs --session=<uuid># by session id
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

// --- resolve the target session ----------------------------------------------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)

let sessionId = args.session
if (!sessionId) {
  const code = typeof args.code === 'string' ? args.code : 'mithral'
  const { data, error } = await supabase
    .from('sessions')
    .select('id, name, join_code')
    .eq('join_code', code)
    .limit(1)
  if (error) { console.error('session lookup:', error.message); process.exit(1) }
  if (!data?.length) {
    console.error(`No session found with join_code "${code}". Pass --session=<uuid> instead.`)
    process.exit(1)
  }
  sessionId = data[0].id
  console.log(`Target campaign: "${data[0].name}" (join_code ${code}) — ${sessionId}`)
}

// --- the module, as Codex entries (all hidden until the DM reveals them) ------
// category: story | location | npc | faction. sort_order sequences within a category.
const ENTRIES = [
  // ---- STORY (run-of-play beats, in sequence) --------------------------------
  {
    category: 'story', sort_order: 10,
    title: 'Lost in the High Forest — Overview',
    body:
`A module by Fred Love for 6th-level characters, expanding chapter 3 of Storm King's Thunder.

The party must cross the High Forest to reach Shadowtop Cathedral — a wondrous formation of ancient
trees deep in the wood — to meet Turlang, a treant aligned with the Emerald Enclave. Pick a hook for
why they seek Turlang (deliver a message; ask the Enclave's help against an approaching danger). Choose
something with personal relevance to one or more PCs if you can.

The journey is a maze of bewildering foliage. The party may become lost and trigger random encounters —
some deadly, some mysteries or role-play. The wood around the cathedral is thicker still, where awakened
plants disguise the trail. On arrival the PCs learn Turlang hasn't been seen for days: he has been
attacked by Aerglas, a rogue druid acting under the influence of an evil kraken. Save Turlang and he
rewards them handsomely.

Quote: "The sheer age and the power of the trees, the depth of their roots, and the wind whispering
through their leaves — all these things call to us." — Aestyn Graymantle, Far from the Misty Hills`,
  },
  {
    category: 'story', sort_order: 20,
    title: 'High Forest Random Encounters Table (2d6)',
    body:
`Roll when the party fails a navigation check / becomes lost.

2  Adult green dragon (drawn by the Star Mounts' lights) crashes through the canopy and attacks.
3  A mutilated corpse clutches a magic item; DC 12 Int (Nature) reveals an owlbear killed them.
4  An Elven lullaby on the breeze: any who hear it sleep 1d8 min, then wake branded with a wood-elf
   glyph for "anointed" — painless, healed only by magic.
5  A marsh with a shambling mound and 1d4 carrion crawlers feeding on its mulch.
6  1d6 friendly woodsman commoners give directions: advantage on the next Wis (Survival) check.
7  A dead elm hung with stick-figures on twine; a banshee and 1d10 nooses-wearing zombies attack.
8  Tharra Shyndle (NG half-elf druid) appears, offers 3 yes/no questions about the forest, warns that
   Aerglas has returned and is acting strangely, then vanishes.
9  A bandit captain + 1d12 bandits demand a 100 gp toll; they attack if refused.
10 A shimmering pool; drinking grants a vision of the Grandfather Tree and a treasure horde beneath it.
11 A vine-covered ruin holds a random magic item.
12 An Emerald Enclave standing stone (a powerful stag in profile); touching it teleports the party to
   a twin stone inside Shadowtop Cathedral.

Magic items (rolls 3 & 11): use Treasures of the High Forest (also by Fred Love) or substitute rare/
very rare items from the DMG.`,
  },
  {
    category: 'story', sort_order: 30,
    title: 'Event — Unicorn in Mourning',
    body:
`(Outer Forest, if the party keeps to the trail.) They glimpse Altheda, a unicorn who wanders from the
Feywild, who springs back into the wood. Following her leads to a clearing ringed by five toppled,
vine-choked standing stones — a fey crossing. The stones rise tall, arcane orbs glow, stars twinkle in
a "trellis sky," and Altheda paces an altar at the center.

The pixie Lolantha asks the party to leave Altheda in peace: she mourns her mate Florian, slain three
centuries ago by a cruel blue dragon. Florian's horn rests on the altar. Approaching agitates Altheda;
trying to take the horn (a priceless artifact) makes her attack. Anyone who takes a horn finds dried
blood magically staining their hands — removable only by remove curse. Until then, every fey attacks on
sight and the Emerald Enclave treats them as criminals.`,
  },
  {
    category: 'story', sort_order: 40,
    title: 'Event — Overnight Encounter',
    body:
`If the party camps before reaching the cathedral: shortly after midnight a waking PC glimpses a spectral
figure gliding through the trees. It is the ghost of an extinct Uthgardt barbarian tribe that once lived
here; a coven of hags has occupied their sacred caves, leaving the spirits unable to rest. Following it
reveals 1d10 more barbarian ghosts wandering aimlessly.

The ghosts don't attack unless provoked. A PC who tries to speak with one hears only a whispered
"Help us" before it vanishes into mist. (Good spot to introduce the Lesca Stone from Treasures of the
High Forest.)`,
  },
  {
    category: 'story', sort_order: 50,
    title: 'Event — Disguised Trail (Deep Forest)',
    body:
`On the successful navigation check that brings them through the deep forest, the party notices the plants
are hiding the path:

"Out of the corner of your eye, you catch a glimpse of a shrub shifting into the middle of your path... A
hushed voice calls out, 'Did they notice us? I think they might have noticed us!'"

Silvia (awakened shrub) and Banyan & Linden (awakened trees) block the way to keep hostiles from the
cathedral. They are peaceful Emerald Enclave members and won't fight unless provoked. Show respect for
nature and peaceful intent, and they step aside and admit the party to Shadowtop Cathedral.`,
  },
  {
    category: 'story', sort_order: 60,
    title: 'Climax — Battle for Shadowtop Cathedral',
    body:
`At the cathedral the satyr Greenwhistle says Turlang has been gone for days. Then Tharra Shyndle bursts
in, bloodied: "Aerglas betrayed us! He defeated Turlang and now he's coming to destroy the cathedral!"

Aerglas arrives commanding a herd of 1d6+1 owlbears (one as his mount), charging and casting attack spells
with abandon — "You cannot oppose the kraken!" / "For Slarkrethel!" — targeting the most capable-looking
PC first. If his mount is downed he hides in the foliage (+2 AC from partial cover); the PCs may do the
same. Greenwhistle flees to warn other creatures; Tharra (down to 10 HP) may stay and fight.`,
  },
  {
    category: 'story', sort_order: 70,
    title: 'Resolution — Rescuing Turlang & Reward',
    body:
`After the battle the party can track the owlbear herd's path of destruction back to where Aerglas betrayed
Turlang (no check needed). Turlang is at 0 HP but stabilized naturally — he wakes in 1d4 hours, or sooner
with healing magic.

Awake, Turlang (CG treant) is furious at Aerglas but grateful, offers the party initiation into the
Emerald Enclave, and suggests Tharra, Banyan, Linden and Silvia accompany them onward.

Treasure: when Tharra parts ways she gives the party a pouch of 1d4+4 silver berries — each works like a
potion of invisibility when swallowed.`,
  },

  // ---- LOCATION --------------------------------------------------------------
  {
    category: 'location', sort_order: 10,
    title: 'The High Forest (navigation)',
    body:
`A thick canopy lets in little light, so sun/stars are useless for navigation; strange creatures, magical
wards and dense foliage confuse travelers.

Navigation: occasionally call for one chosen PC to make a DC 15 Wis (Nature) check to stay on the path.
The deep forest imposes disadvantage (Emerald Enclave agents hide the way). On a failure the party is
lost — roll on the Random Encounters Table. Recommended pacing: at least two successful checks to pass
the outer forest into the deep forest, and one more inside the deep forest to find the cathedral entrance.

Distance & travel: ~25 miles of dense wood separate the cathedral from the nearest border (Evermoor Road).
Difficult terrain allows ~12–15 miles per 8 hours, so expect at least one overnight camp. Pushing past
8 hours without a rest: each PC makes a Con save, DC 10 +1 per hour beyond the eighth, or takes a level of
exhaustion.`,
  },
  {
    category: 'location', sort_order: 20,
    title: 'Outer Forest (entrance)',
    body:
`Boxed read-aloud on entering, then call for the first Wis (Survival) check — success runs "Unicorn in
Mourning," failure rolls on the Random Encounters Table:

"The trail you've been following enters the High Forest through an ornate archway carved directly into the
living wood of an immense tree trunk. As you pass through the arch, you hear the buzz of insects and the
song of birds overhead. Little sunlight pierces the thick canopy, and gloomy shadows cover the trail
before you."`,
  },
  {
    category: 'location', sort_order: 30,
    title: 'Deep Forest',
    body:
`Reached after enough successful outer-forest checks (recommended two; deep-forest checks are at
disadvantage). On a failed check, roll on the Random Encounters Table; on a success, run the Disguised
Trail encounter. Read aloud and call for a Wis (Nature) check:

"The air grows stale as you push much deeper into the forest. You no longer hear birdsong or insects.
Instead, your ears detect only faint whispers all around you. As you squint into the gloom, you see no
signs of the trail."`,
  },
  {
    category: 'location', sort_order: 40,
    title: 'Shadowtop Cathedral',
    body:
`The party's destination, deep in the wood — Turlang's seat and an Emerald Enclave sanctuary:

"Orderly rows of massive trunks rise out of the ground like pillars holding up a vaulted ceiling of
leaves. Intricate paper lanterns hang from the mighty branches, providing warm illumination. Trickling
through the cathedral like a central aisle is a shimmering brook where rainbow trout swim just below the
surface. A heartrendingly beautiful melody fills the air."

The melody is the satyr Greenwhistle's panpipes. (An Emerald Enclave standing stone here is the far end
of the teleportation circle from random-encounter result 12.)`,
  },

  // ---- NPC -------------------------------------------------------------------
  {
    category: 'npc', sort_order: 10,
    title: 'Turlang (CG treant)',
    body:
`The ancient treant the party is sent to find; aligned with the Emerald Enclave. Betrayed and left at 0 HP
by Aerglas, but stabilized. Rewards rescuers with initiation into the Enclave.
  Trait: strokes his mossy beard thoughtfully before answering any question.
  Ideal: the entire world would benefit from an expansion of the High Forest.
  Bond:  anyone who harms the least creature in his forest must answer to him.
  Flaw:  no interest in politics, art or civilization unless it affects the High Forest.`,
  },
  {
    category: 'npc', sort_order: 20,
    title: 'Tharra Shyndle (NG half-elf druid)',
    body:
`A friendly druid the party may meet on the road (random encounter 8), where she answers three yes/no
questions and warns that Aerglas has returned and is acting strangely. She secretly followed Aerglas and
Turlang, saved Turlang from a killing blow, and flees wounded to the cathedral to raise the alarm. Down to
10 HP, she may help in the climactic battle, and later gifts the party 1d4+4 invisibility "silver berries."
  Trait: her eyes squint whenever she smiles, which is most of the time.
  Ideal: we have only one world; protect it from those who would exploit its bounty.
  Bond:  will give anything to a friend in need.
  Flaw:  likes word games instead of answering directly.`,
  },
  {
    category: 'npc', sort_order: 30,
    title: 'Aerglas (CE elf druid — villain)',
    body:
`Once a respected Emerald Enclave druid. Months ago Slarkrethel's agents corrupted him with promises of
power and ancient knowledge; under the kraken's telepathic influence he aims to drive the Enclave from the
High Forest and claim Shadowtop Cathedral. He lured Turlang into a ravine ambush, then pursued Tharra to
the cathedral. Fights mounted amid a herd of 1d6+1 owlbears, casting attack spells; hides in foliage (+2
AC) if unhorsed. Speaks with the blank face of the mind-controlled.
  Ideal: Slarkrethel is the rightful ruler of the world — so I, his servant, rightfully rule the forest.
  Bond:  would rather die than let the Emerald Enclave keep sway over the High Forest.
  Flaw:  cannot allow another spellcaster to show him up.`,
  },
  {
    category: 'npc', sort_order: 40,
    title: 'Greenwhistle (satyr)',
    body:
`A satyr who plays panpipes by the brook in Shadowtop Cathedral, composing a song to win over a dryad who
rejected him. Tells the party Turlang has been absent for days and invites them to wait. When fighting
breaks out he flees into the forest to warn other creatures.`,
  },
  {
    category: 'npc', sort_order: 50,
    title: 'Altheda the Unicorn & Lolantha the Pixie',
    body:
`Altheda is a unicorn who wanders from the Feywild into the High Forest, mourning her mate Florian (slain
three centuries ago by a blue dragon). Her clearing is a fey crossing ringed by standing stones, with
Florian's horn on a central altar. The pixie Lolantha greets the party and asks them to leave Altheda in
peace. Taking either horn curses the thief: dried blood stains their hands (remove curse only), every fey
attacks on sight, and the Emerald Enclave treats them as criminals.`,
  },
  {
    category: 'npc', sort_order: 60,
    title: 'Silvia, Banyan & Linden (awakened plants)',
    body:
`Peaceful Emerald Enclave members who guard the deep-forest approach to Shadowtop Cathedral — Silvia is an
awakened shrub, Banyan and Linden awakened trees. They block and disguise the trail to keep hostiles out
and won't fight unless provoked; shown respect and peaceful intent, they admit the party. Turlang later
suggests they travel on with the party.`,
  },

  // ---- FACTION ---------------------------------------------------------------
  {
    category: 'faction', sort_order: 10,
    title: 'The Emerald Enclave',
    body:
`The druidic faction that protects the High Forest. Its agents hide the path to Shadowtop Cathedral, mark
sites with standing stones bearing a powerful stag in profile, and count Turlang, Tharra, Greenwhistle and
the awakened plants among their friends. Saving Turlang earns the party initiation into the Enclave.`,
  },
  {
    category: 'faction', sort_order: 20,
    title: 'Slarkrethel & the Kraken Cult',
    body:
`Slarkrethel is a tyrannical kraken whose agents corrupted the druid Aerglas, dominating him telepathically
to seize the High Forest and Shadowtop Cathedral in the kraken's name. The kraken is the hidden hand behind
the module's conflict — defeating Aerglas frees the forest from its immediate reach but not the kraken
itself.`,
  },
]

// --- insert (skip titles already present) ------------------------------------
const { data: existing, error: exErr } = await supabase
  .from('lore_entries')
  .select('title')
  .eq('session_id', sessionId)
if (exErr) { console.error('existing fetch:', exErr.message); process.exit(1) }
const have = new Set((existing || []).map((e) => e.title))

const toInsert = ENTRIES
  .filter((e) => !have.has(e.title))
  .map((e) => ({ session_id: sessionId, revealed: false, ...e }))

if (!toInsert.length) {
  console.log('✅ Nothing to do — all module entries already present in this campaign.')
  process.exit(0)
}

const { error: insErr } = await supabase.from('lore_entries').insert(toInsert)
if (insErr) { console.error('insert:', insErr.message); process.exit(1) }

const skipped = ENTRIES.length - toInsert.length
console.log(
  `✅ Imported ${toInsert.length} hidden Codex entries (${skipped} already existed).\n` +
  `   Open the DM dashboard → Codex to review and reveal them as the party progresses.`
)
