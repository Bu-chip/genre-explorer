import { motion } from 'framer-motion'
import { ensureContrast } from '../utils/color'
import './GenreCard.css'

export function GenreName({ genre, displayName }) {
  if (!genre) return null

  const displayColor = ensureContrast(genre.color)

  return (
    <div className="genre-card" style={{ '--genre-color': displayColor }}>
      <p className="genre-card__context">spinning...</p>

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

      <p className="genre-card__origin">Origin unknown</p>

      <p className="genre-card__meta">
        {genre.x},{genre.y} {genre.color}
      </p>

      <motion.div
        className="genre-card__color-swatch"
        key={genre.slug}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      />
    </div>
  )
}

export function GenreLinks({ genre, lastfm }) {
  if (!genre) return null

  const trackUrl = lastfm?.topTrack
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(lastfm.topTrack.artist + ' ' + lastfm.topTrack.title)}`
    : null

  if (!lastfm?.topTrack) return null

  return (
    <a
      className="genre-card__track"
      href={trackUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {'\u25b6'} {lastfm.topTrack.artist} — {lastfm.topTrack.title}
    </a>
  )
}

export function GenreDescription({ lastfm }) {
  if (!lastfm?.summary) return null
  return <p className="genre-card__desc">{lastfm.summary}</p>
}
