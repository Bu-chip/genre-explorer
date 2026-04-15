import { motion } from 'framer-motion'
import './GenreCard.css'

export function GenreName({ genre, displayName, contextPhrase }) {
  if (!genre) return null

  return (
    <div className="genre-card">
      <p className="genre-card__context">
        {displayName ? 'spinning...' : (contextPhrase || 'spinning...')}
      </p>

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
            {genre.name}
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
