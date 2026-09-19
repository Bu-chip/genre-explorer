import { isMobile, YOUTUBE_PATH, SPOTIFY_PATH } from '../utils/platformLinks'
import './ListenLinks.css'

const LINKS = [
  {
    id: 'youtube',
    title: 'Listen on YouTube',
    url: (name) =>
      `https://youtube.com/results?search_query=${encodeURIComponent(name + ' playlist')}`,
    path: YOUTUBE_PATH,
  },
  {
    id: 'spotify',
    title: 'Listen on Spotify',
    url: (name) => {
      const query = encodeURIComponent('The Sound of ' + name)
      return isMobile()
        ? `spotify:search:${query}`
        : `https://open.spotify.com/search/${query}`
    },
    path: SPOTIFY_PATH,
  },
  {
    id: 'bandcamp',
    title: 'Listen on Bandcamp',
    url: (_, slug) => `https://bandcamp.com/tag/${slug}`,
    path: 'M0 18.75l7.437-13.5H24l-7.438 13.5H0z',
  },
]

export function ListenLinks({ name, slug }) {
  return (
    <nav className="listen-links">
      {LINKS.map(({ id, title, url, path }) => (
        <a
          key={id}
          className={`listen-links__icon listen-links__icon--${id}`}
          href={url(name, slug)}
          target="_blank"
          rel="noopener"
          title={title}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d={path} />
          </svg>
        </a>
      ))}
    </nav>
  )
}
