import { useMemo } from 'react'
import { getRelatedGenres } from '../utils/nearest'
import './NearbyGenres.css'

function GenreChips({ items, onSelect }) {
  return (
    <div className="related__chips">
      {items.map(({ genre: g }) => (
        <button
          key={g.slug}
          className="related__chip"
          style={{ '--chip-color': g.color }}
          onClick={() => onSelect(g)}
        >
          <span className="related__name">{g.name}</span>
        </button>
      ))}
    </div>
  )
}

export function NearbyGenres({ genre, allGenres, onSelect }) {
  const { nearest, farthest } = useMemo(
    () => getRelatedGenres(genre, allGenres, 5),
    [genre, allGenres],
  )

  return (
    <div className="related">
      <div className="related__col">
        <h3 className="related__title">close</h3>
        <GenreChips items={nearest} onSelect={onSelect} />
      </div>
      <div className="related__col">
        <h3 className="related__title">far</h3>
        <GenreChips items={farthest} onSelect={onSelect} />
      </div>
    </div>
  )
}
