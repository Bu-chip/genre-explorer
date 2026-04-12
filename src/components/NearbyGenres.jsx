import { useMemo } from 'react'
import { getRelatedGenres } from '../utils/nearest'
import './NearbyGenres.css'

function GenreList({ items, onSelect }) {
  return (
    <ul className="related__list">
      {items.map(({ genre: g, similarity }) => (
        <li key={g.slug}>
          <button className="related__row" onClick={() => onSelect(g)}>
            <span className="related__dot" style={{ backgroundColor: g.color }} />
            <span className="related__name">{g.name}</span>
            <span className="related__pct">{similarity}%</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function NearbyGenres({ genre, allGenres, onSelect }) {
  const { nearest, farthest } = useMemo(
    () => getRelatedGenres(genre, allGenres, 10),
    [genre, allGenres],
  )

  return (
    <div className="related">
      <div className="related__col">
        <h3 className="related__title">close</h3>
        <GenreList items={nearest} onSelect={onSelect} />
      </div>
      <div className="related__col">
        <h3 className="related__title">far</h3>
        <GenreList items={farthest} onSelect={onSelect} />
      </div>
    </div>
  )
}
