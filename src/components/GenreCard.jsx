import { motion } from 'framer-motion'
import { ensureContrast } from '../utils/color'
import './GenreCard.css'

// Deterministic per-genre pick of one letter to tint with the genre's
// EveryNoise color — stable across visits (hash of the slug), never a space.
function accentLetterIndex(slug, name) {
  const positions = []
  for (let i = 0; i < name.length; i++) {
    if (name[i] !== ' ') positions.push(i)
  }
  if (positions.length === 0) return -1
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  }
  return positions[hash % positions.length]
}

function AccentedName({ genre }) {
  const { name, slug, color } = genre
  const idx = color ? accentLetterIndex(slug, name) : -1
  if (idx === -1) return name

  return (
    <>
      {name.slice(0, idx)}
      <span style={{ color: ensureContrast(color) }}>{name[idx]}</span>
      {name.slice(idx + 1)}
    </>
  )
}

export function GenreName({ genre, displayName, onRandom }) {
  if (!genre) return null

  return (
    <div className="genre-card">
      <div className="genre-card__name-wrapper">
        {displayName ? (
          <h2 className="genre-card__name">{displayName}</h2>
        ) : (
          <motion.h2
            key={genre.slug}
            className="genre-card__name"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <button
              type="button"
              className="genre-card__name-button"
              onClick={onRandom}
              aria-label={`${genre.name} — load another random genre`}
            >
              <AccentedName genre={genre} />
            </button>
          </motion.h2>
        )}
      </div>
    </div>
  )
}

export function GenreDescription({ lastfm }) {
  if (!lastfm?.summary) return null
  return (
    <div className="genre-card__desc-wrapper">
      <p className="genre-card__desc-label">about this genre</p>
      <p className="genre-card__desc">{lastfm.summary}</p>
    </div>
  )
}
