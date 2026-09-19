import { useMemo, useEffect } from 'react'
import './DiscoveryCounter.css'

const STORAGE_KEY = 'genre-explorer-seen'

function getSeenSlugs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addSeenSlug(slug) {
  const seen = getSeenSlugs()
  if (!seen.includes(slug)) {
    seen.push(slug)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen))
  }
  return seen.length
}

export function DiscoveryCounter({ genre, total, compact }) {
  const slug = genre?.slug

  // Recording a genre as seen writes to localStorage, so it stays in an
  // effect. The number shown is derived from that same store plus the genre
  // on screen, so it needs no state of its own: whether the write has landed
  // yet or not, the count comes out the same.
  const count = useMemo(() => {
    const seen = getSeenSlugs()
    if (!slug) return seen.length
    return seen.includes(slug) ? seen.length : seen.length + 1
  }, [slug])

  useEffect(() => {
    if (slug) addSeenSlug(slug)
  }, [slug])

  if (!genre) return null

  if (compact) {
    return (
      <span className="discovery-counter discovery-counter--compact">
        genre {count.toLocaleString()} of {total.toLocaleString()}
      </span>
    )
  }

  const text = count > 0
    ? `${count.toLocaleString()} / ${total.toLocaleString()} genres discovered`
    : `${total.toLocaleString()} genres to explore`

  return (
    <p className="discovery-counter">{text}</p>
  )
}
