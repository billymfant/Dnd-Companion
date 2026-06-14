// ---------------------------------------------------------------
// Tiny wrapper around the free Open5e API (https://api.open5e.com).
// No API key needed. We use the stable /v1/ endpoints and cache
// responses in memory so repeated lookups don't re-hit the network.
// ---------------------------------------------------------------
const BASE = 'https://api.open5e.com/v1'
const cache = new Map()

async function getJson(url) {
  if (cache.has(url)) return cache.get(url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open5e request failed (${res.status})`)
  const data = await res.json()
  cache.set(url, data)
  return data
}

// Search spells by name. Returns an array of spell objects.
export async function searchSpells(query) {
  const url = `${BASE}/spells/?search=${encodeURIComponent(query)}&limit=20`
  const data = await getJson(url)
  return data.results || []
}

// Spells available to a class at a given spell level, limited to the official
// SRD document. `className` is the display name (e.g. 'Wizard'); `level` is the
// numeric spell level (0 = cantrips). Verified filters: dnd_class__icontains,
// level_int, document__slug=wotc-srd. Returns [{ slug, name, level, ... }].
export async function spellsByClass(className, level) {
  const url =
    `${BASE}/spells/?dnd_class__icontains=${encodeURIComponent(className)}` +
    `&level_int=${level}&document__slug=wotc-srd&limit=200`
  const data = await getJson(url)
  return (data.results || []).sort((a, b) => a.name.localeCompare(b.name))
}

// Search monsters by name. Returns an array of monster stat blocks.
export async function searchMonsters(query) {
  const url = `${BASE}/monsters/?search=${encodeURIComponent(query)}&limit=20`
  const data = await getJson(url)
  return data.results || []
}

// Fetch the full list of conditions (there are only ~15, so grab all).
export async function getConditions() {
  const url = `${BASE}/conditions/?limit=50`
  const data = await getJson(url)
  return data.results || []
}
