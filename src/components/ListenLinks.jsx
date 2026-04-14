import './ListenLinks.css'

const LINKS = [
  {
    id: 'youtube',
    title: 'Listen on YouTube',
    url: (name) =>
      `https://youtube.com/results?search_query=${encodeURIComponent(name + ' playlist')}`,
    path: 'M21.8 8.001a2.75 2.75 0 0 0-1.94-1.93C18.12 5.5 12 5.5 12 5.5s-6.12 0-7.86.57A2.75 2.75 0 0 0 2.2 8.001 28.7 28.7 0 0 0 1.75 12a28.7 28.7 0 0 0 .45 3.999 2.75 2.75 0 0 0 1.94 1.93c1.74.57 7.86.57 7.86.57s6.12 0 7.86-.57a2.75 2.75 0 0 0 1.94-1.93A28.7 28.7 0 0 0 22.25 12a28.7 28.7 0 0 0-.45-3.999zM9.75 15.02V8.98L15.5 12l-5.75 3.02z',
  },
  {
    id: 'spotify',
    title: 'Listen on Spotify',
    url: (name) =>
      `https://open.spotify.com/search/${encodeURIComponent('The Sound of ' + name)}`,
    path: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 0 1-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.225-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.972-.516.781.781 0 0 1 .516-.973c3.632-1.102 8.147-.568 11.236 1.327a.78.78 0 0 1 .257 1.071zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.935.935 0 1 1-.543-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 0 1-.953 1.609z',
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
