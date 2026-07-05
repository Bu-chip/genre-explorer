import { useMemo } from 'react'
import { GenreChips } from './NearbyGenres'
import './RelatedGenres.css'

// Curated related genres from the per-genre detail file, as clickable chips.
// Entries are matched by name against the main index; the ~10% that don't
// resolve are dropped. Distinct from the coordinate-based CLOSE/FAR columns.
export function RelatedGenres({ related, allGenres, onSelect }) {
  const items = useMemo(() => {
    if (!related?.length || !allGenres?.length) return []
    const byName = new Map(allGenres.map((g) => [g.name, g]))
    return related
      .map((name) => byName.get(name))
      .filter(Boolean)
      .map((genre) => ({ genre }))
  }, [related, allGenres])

  if (items.length === 0) return null

  return (
    <div className="related-genres">
      <h3 className="related__title">related genres</h3>
      <GenreChips items={items} onSelect={onSelect} />
    </div>
  )
}
