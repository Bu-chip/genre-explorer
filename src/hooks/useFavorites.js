import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'genre-explorer:favorites'

function readStorage() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s) => typeof s === 'string')
  } catch {
    return []
  }
}

function writeStorage(slugs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
  } catch {
    // localStorage unavailable (private mode, quota) — ignore silently
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => readStorage())

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== STORAGE_KEY) return
      setFavorites(readStorage())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const isFavorite = useCallback(
    (slug) => favorites.includes(slug),
    [favorites],
  )

  const toggleFavorite = useCallback((slug) => {
    if (!slug) return
    setFavorites((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
      writeStorage(next)
      return next
    })
  }, [])

  const clearFavorites = useCallback(() => {
    setFavorites([])
    writeStorage([])
  }, [])

  return { favorites, isFavorite, toggleFavorite, clearFavorites }
}
