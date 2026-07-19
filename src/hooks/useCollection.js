import { useAuth } from './useAuth'
import { useFavorites } from './useFavorites'
import { useSavedGenres } from './useSavedGenres'

// Single source of truth for the saved-genre collection, called unconditionally
// in App.jsx (Rules of Hooks). Both underlying hooks always run; we pick which
// one is authoritative based on session:
//   - signed in  -> Supabase only (cloud)
//   - signed out -> localStorage (current behavior), never mixed or migrated
export function useCollection() {
  const { session } = useAuth()
  const local = useFavorites()
  const cloud = useSavedGenres(session)

  const active = session ? cloud : local

  return {
    favorites: active.favorites,
    isFavorite: active.isFavorite,
    toggleFavorite: active.toggleFavorite,
    clearFavorites: active.clearFavorites,
    signedIn: !!session,
  }
}
