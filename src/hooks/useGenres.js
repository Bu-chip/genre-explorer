import { useState, useEffect } from 'react'

let cachedGenres = null

export function useGenres() {
  const [genres, setGenres] = useState(cachedGenres)
  const [loading, setLoading] = useState(!cachedGenres)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cachedGenres) return

    fetch('/data/genres_index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        cachedGenres = data
        setGenres(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return { genres, loading, error }
}
