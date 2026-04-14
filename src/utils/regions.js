const REGIONS = {
  'East Asia': ['japanese', 'chinese', 'korean', 'cantonese', 'mandopop', 'j-', 'k-'],
  'Southeast Asia': ['thai', 'indonesian', 'filipino', 'vietnamese', 'malay'],
  'South Asia': ['indian', 'bollywood', 'hindi', 'bengali', 'tamil', 'pakistani', 'desi'],
  'Middle East': ['arabic', 'turkish', 'persian', 'israeli', 'oud', 'maqam'],
  'Africa': ['african', 'afro', 'highlife', 'soukous', 'mbira', 'gnawa', 'ethio'],
  'Northern Europe': ['nordic', 'scandinavian', 'swedish', 'norwegian', 'finnish', 'danish', 'icelandic'],
  'Western/Southern Europe': ['french', 'italian', 'spanish', 'german', 'portuguese', 'dutch', 'belgian', 'celtic', 'flamenco', 'fado'],
  'Eastern Europe': ['russian', 'polish', 'balkan', 'romanian', 'hungarian', 'slavic', 'czech', 'slovak', 'ukrainian'],
  'Latin America': ['latin', 'brazilian', 'reggaeton', 'cumbia', 'bachata', 'salsa', 'bossa', 'samba', 'corrido', 'norte\u00f1o', 'mexican', 'cuban', 'colombian'],
  'Caribbean': ['jamaican', 'reggae', 'dancehall', 'soca', 'calypso', 'trinidadian'],
  'Oceania': ['australian', 'new zealand', 'polynesian', 'aboriginal'],
  'Global/Unknown': [],
}

export const REGION_NAMES = Object.keys(REGIONS)

export function classifyGenre(name) {
  const lower = name.toLowerCase()
  for (const [region, keywords] of Object.entries(REGIONS)) {
    if (region === 'Global/Unknown') continue
    if (keywords.some((kw) => lower.includes(kw))) return region
  }
  return 'Global/Unknown'
}

export function getGenresByRegion(genres, region) {
  return genres.filter((g) => classifyGenre(g.name) === region)
}
