/**
 * Find the n nearest and n farthest genres by euclidean distance on x/y coordinates.
 * Returns { nearest, farthest } arrays of { genre, similarity }.
 * Similarity is 0–100 where 100 = same point, 0 = max possible distance.
 */
export function getRelatedGenres(target, allGenres, n = 10) {
  let maxDist = 0

  const scored = []
  for (const genre of allGenres) {
    if (genre.slug === target.slug) continue
    const dx = genre.x - target.x
    const dy = genre.y - target.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    scored.push({ genre, distance: dist })
    if (dist > maxDist) maxDist = dist
  }

  scored.sort((a, b) => a.distance - b.distance)

  const toResult = ({ genre, distance }) => ({
    genre,
    similarity: maxDist > 0 ? Math.round((1 - distance / maxDist) * 100) : 100,
  })

  return {
    nearest: scored.slice(0, n).map(toResult),
    farthest: scored.slice(-n).reverse().map(toResult),
  }
}
