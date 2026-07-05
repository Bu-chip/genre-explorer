import { useState, useEffect } from 'react'

// Per-genre detail files (public/data/genres/{slug}.json) carry the ranked
// artist list and curated related genres. Loaded lazily per genre, cached
// for the session. A missing file or fetch error caches null so the genre
// simply renders without those sections. `loaded` distinguishes "still
// fetching" from "fetched and empty" — callers gate the by-tag track
// fallback on it so the old cascade only fires for artist-less genres.
const cache = new Map()

export function useGenreDetail(slug) {
  const [, bump] = useState(0)

  useEffect(() => {
    if (!slug || cache.has(slug)) return
    let cancelled = false

    fetch(`${import.meta.env.BASE_URL}data/genres/${encodeURIComponent(slug)}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data) => {
        cache.set(slug, data)
        if (!cancelled) bump((n) => n + 1)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (!slug) return { detail: null, loaded: false }
  return { detail: cache.get(slug) ?? null, loaded: cache.has(slug) }
}
