let cachedMedians = null

function getMedian(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function getMedians(allGenres) {
  if (cachedMedians) return cachedMedians

  const xs = allGenres.map((g) => g.x)
  const ys = allGenres.map((g) => g.y)
  const medianX = getMedian(xs)
  const medianY = getMedian(ys)

  let maxDist = 0
  for (const g of allGenres) {
    const dx = g.x - medianX
    const dy = g.y - medianY
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d > maxDist) maxDist = d
  }

  cachedMedians = { medianX, medianY, maxDist }
  return cachedMedians
}

/**
 * Rarity score 0–100. Higher = rarer.
 * - Distance from center: 0–40 (far = rare)
 * - Listener count: 0–30 (few = rare), 15 if unknown
 * - No description: +30 (undocumented = rare)
 */
export function getRarityScore(genre, allGenres, lastfmData) {
  const { medianX, medianY, maxDist } = getMedians(allGenres)

  // Distance score (0-40)
  const dx = genre.x - medianX
  const dy = genre.y - medianY
  const dist = Math.sqrt(dx * dx + dy * dy)
  const distanceScore = maxDist > 0 ? (dist / maxDist) * 40 : 0

  // Listener score (0-30), default 15
  let listenerScore = 15
  if (lastfmData?.listeners != null) {
    const listeners = Math.max(0, lastfmData.listeners)
    if (listeners === 0) {
      listenerScore = 30
    } else {
      const logMax = Math.log10(1_000_000)
      const logVal = Math.log10(Math.max(1, listeners))
      listenerScore = Math.max(0, 30 * (1 - logVal / logMax))
    }
  }

  // Description: documented genres are less rare
  const descriptionBonus = lastfmData?.summary ? 0 : 30

  const score = distanceScore + listenerScore + descriptionBonus
  return Math.round(Math.max(0, Math.min(100, score)))
}
