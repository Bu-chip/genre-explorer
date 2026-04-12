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
  if (!genre) return null

  return (
    <div className="genre-card" style={{ '--genre-color': genre.color }}>
      <h2 className="genre-card__name">{genre.name}</h2>

      <div className="genre-card__color-swatch" />

      <p className="genre-card__meta">
        {genre.x},{genre.y} {genre.color}
      </p>

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
    </div>
  )
}
