import { useState, useEffect } from 'react'
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

export function DiscoveryCounter({ genre, total }) {
  const [count, setCount] = useState(() => getSeenSlugs().length)

  useEffect(() => {
    if (genre?.slug) {
      setCount(addSeenSlug(genre.slug))
    }
  }, [genre?.slug])

  return (
    <p className="discovery-counter">
      {count.toLocaleString()} / {total.toLocaleString()} explored
    </p>
  )
}
