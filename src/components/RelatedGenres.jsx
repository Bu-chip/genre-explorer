import { Fragment, useMemo, useState } from 'react'
import './RelatedGenres.css'

const MAX_VISIBLE = 10

// Curated related genres from the per-genre detail file, set as an inline
// editorial paragraph — names separated by " / ", each in its EveryNoise
// color, wrapping naturally. Entries are matched by name against the main
// index; the ~10% that don't resolve are dropped. Distinct from the
// coordinate-based CLOSE/FAR blocks.
export function RelatedGenres({ related, allGenres, onSelect }) {
  const [showAll, setShowAll] = useState(false)

  const items = useMemo(() => {
    if (!related?.length || !allGenres?.length) return []
    const byName = new Map(allGenres.map((g) => [g.name, g]))
    return related.map((name) => byName.get(name)).filter(Boolean)
  }, [related, allGenres])

  if (items.length === 0) return null

  const visible = showAll ? items : items.slice(0, MAX_VISIBLE)
  const hiddenCount = items.length - visible.length

  return (
    <div className="related-genres">
      <h3 className="related-genres__title">related genres</h3>
      <p className="related-genres__flow">
        {visible.map((genre, i) => (
          <Fragment key={genre.slug}>
            {i > 0 && <span className="related-genres__sep" aria-hidden="true"> / </span>}
            <button
              type="button"
              className="related-genres__link"
              style={{ '--genre-color': genre.color }}
              onClick={() => onSelect(genre)}
            >
              {genre.name}
            </button>
          </Fragment>
        ))}
        {hiddenCount > 0 && (
          <>
            <span className="related-genres__sep" aria-hidden="true"> / </span>
            <button
              type="button"
              className="related-genres__more"
              onClick={() => setShowAll(true)}
            >
              +{hiddenCount} more
            </button>
          </>
        )}
      </p>
    </div>
  )
}
