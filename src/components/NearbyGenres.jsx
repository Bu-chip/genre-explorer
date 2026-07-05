import { useMemo } from 'react'
import { getRelatedGenres } from '../utils/nearest'
import './NearbyGenres.css'

const CLOSE_COUNT = 5
const FAR_COUNT = 4

// Coordinate-based neighbours. CLOSE is a compact mono list — RELATED's
// little sister, not its clone. FAR is a handful of jump tickets: mono,
// an arrow, and the destination genre's own color.
export function NearbyGenres({ genre, allGenres, onSelect }) {
  const { nearest, farthest } = useMemo(
    () => getRelatedGenres(genre, allGenres, CLOSE_COUNT),
    [genre, allGenres],
  )

  return (
    <div className="nearby">
      <div className="nearby__block">
        <h3 className="nearby__title">close</h3>
        <ul className="nearby__list">
          {nearest.map(({ genre: g }) => (
            <li key={g.slug}>
              <button
                type="button"
                className="nearby__close-link"
                style={{ '--genre-color': g.color }}
                onClick={() => onSelect(g)}
              >
                {g.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="nearby__block">
        <h3 className="nearby__title">far</h3>
        <ul className="nearby__list nearby__list--far">
          {farthest.slice(0, FAR_COUNT).map(({ genre: g }) => (
            <li key={g.slug}>
              <button
                type="button"
                className="nearby__jump"
                style={{ '--genre-color': g.color }}
                onClick={() => onSelect(g)}
              >
                <span className="nearby__jump-arrow" aria-hidden="true">&rarr;</span>
                <span className="nearby__jump-name">{g.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
