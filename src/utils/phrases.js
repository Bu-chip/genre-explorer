const RARE = [
  'somewhere between noise and silence',
  "you won't find this on any playlist",
  'uncharted waters',
  "this one's been hiding",
  'deep in the catalog',
  'here be dragons',
  'off every radar',
  'a whisper in the algorithm',
]

const COMMON = [
  'you probably know this one',
  'safe harbor',
  'a familiar frequency',
  'well-traveled territory',
  'solid ground',
]

const NEUTRAL = [
  "let's see where this goes",
  'what do we have here',
  'another corner of the map',
  'X marks the spot',
]

let lastPhrase = null

function pickFromPool(pool) {
  const available = pool.length > 1 ? pool.filter((p) => p !== lastPhrase) : pool
  const phrase = available[Math.floor(Math.random() * available.length)]
  lastPhrase = phrase
  return phrase
}

export function getPhrase(score, genreData) {
  if (score > 70) return pickFromPool(RARE)
  if (score < 30) return pickFromPool(COMMON)

  const neutralPool = [...NEUTRAL]
  if (genreData?.index != null) {
    neutralPool.push(
      `genre ${(genreData.index + 1).toLocaleString()} of 5,453`,
    )
  }
  return pickFromPool(neutralPool)
}
