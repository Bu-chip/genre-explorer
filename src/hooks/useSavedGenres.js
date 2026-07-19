import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// Supabase-backed collection, mirroring the useFavorites() interface so
// useCollection() can swap sources transparently. `favorites` is an array of
// genre slugs. Only meaningful when a session exists.
//
// Slugs are stored tagged with the user they belong to. Deriving `favorites`
// from a userId match means a user switch shows an empty collection instantly
// (no stale flash of the previous user's data) until the new fetch lands — and
// it keeps every setState out of the effect body (React hooks lint).
export function useSavedGenres(session) {
  const userId = session?.user?.id ?? null
  const [state, setState] = useState({ userId: null, slugs: [] })

  useEffect(() => {
    if (!userId) return
    let active = true
    supabase
      .from('saved_genres')
      .select('genre_slug')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Failed to load saved genres:', error.message)
          return
        }
        setState({ userId, slugs: data.map((row) => row.genre_slug) })
      })
    return () => {
      active = false
    }
  }, [userId])

  const favorites = useMemo(
    () => (state.userId === userId ? state.slugs : []),
    [state, userId],
  )

  const isFavorite = useCallback((slug) => favorites.includes(slug), [favorites])

  const toggleFavorite = useCallback(
    async (slug) => {
      if (!slug || !userId) return
      const has = favorites.includes(slug)

      // Optimistic update — reconcile / revert on error.
      setState((prev) => {
        const base = prev.userId === userId ? prev.slugs : []
        return {
          userId,
          slugs: has ? base.filter((s) => s !== slug) : [slug, ...base],
        }
      })

      if (has) {
        const { error } = await supabase
          .from('saved_genres')
          .delete()
          .eq('user_id', userId)
          .eq('genre_slug', slug)
        if (error) {
          console.error('Failed to remove saved genre:', error.message)
          setState((prev) => ({
            userId,
            slugs: prev.slugs.includes(slug) ? prev.slugs : [slug, ...prev.slugs],
          }))
        }
      } else {
        // Idempotent: user_id is filled server-side by default auth.uid();
        // ignoreDuplicates makes a repeated save a no-op (unique constraint).
        const { error } = await supabase
          .from('saved_genres')
          .upsert(
            { genre_slug: slug },
            { onConflict: 'user_id,genre_slug', ignoreDuplicates: true },
          )
        if (error) {
          console.error('Failed to save genre:', error.message)
          setState((prev) => ({
            userId,
            slugs: prev.slugs.filter((s) => s !== slug),
          }))
        }
      }
    },
    [favorites, userId],
  )

  const clearFavorites = useCallback(async () => {
    if (!userId) return
    const snapshot = favorites
    setState({ userId, slugs: [] })
    const { error } = await supabase
      .from('saved_genres')
      .delete()
      .eq('user_id', userId)
    if (error) {
      console.error('Failed to clear saved genres:', error.message)
      setState({ userId, slugs: snapshot })
    }
  }, [favorites, userId])

  return { favorites, isFavorite, toggleFavorite, clearFavorites }
}
