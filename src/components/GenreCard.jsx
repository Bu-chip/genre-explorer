import { useLastfm } from '../hooks/useLastfm'
import { ensureContrast } from '../utils/color'
import './GenreCard.css'

const LISTEN_LINKS = [
  {
    label: 'youtube',
    url: (name) => `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' playlist')}`,
  },
  {
    label: 'spotify',
    url: (name) => `https://open.spotify.com/search/${encodeURIComponent('The Sound of ' + name)}`,
  },
  {
    label: 'bandcamp',
    url: (_, slug) => `https://bandcamp.com/tag/${slug}`,
  },
]

export function GenreCard({ genre }) {
  const lastfm = useLastfm(genre?.name)

  if (!genre) return null

  const displayColor = ensureContrast(genre.color)

  const trackUrl = lastfm?.topTrack
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(lastfm.topTrack.artist + ' ' + lastfm.topTrack.title)}`
    : null

  return (
    <div className="genre-card" style={{ '--genre-color': displayColor }}>
      <div className="genre-card__header">
        <h2 className="genre-card__name">{genre.name}</h2>
        <p className="genre-card__meta">
          {genre.x},{genre.y} {genre.color}
        </p>
      </div>

      <div className="genre-card__color-swatch" />

      {lastfm?.summary && (
        <p className="genre-card__desc">{lastfm.summary}</p>
      )}

      <nav className="genre-card__links">
        {LISTEN_LINKS.map(({ label, url }, i) => (
          <span key={label}>
            {i > 0 && <span className="genre-card__sep">{'\u00b7'}</span>}
            <a href={url(genre.name, genre.slug)} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          </span>
        ))}
      </nav>

      {lastfm?.topTrack && (
        <a
          className="genre-card__track"
          href={trackUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {'\u25b6'} {lastfm.topTrack.artist} — {lastfm.topTrack.title}
        </a>
      )}
    </div>
  )
}
