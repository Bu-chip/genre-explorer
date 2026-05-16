import './WikipediaCard.css'

function splitParagraphs(text) {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function WikipediaCard({ wikipedia }) {
  if (!wikipedia?.extract) return null

  const paragraphs = splitParagraphs(wikipedia.extract)
  if (paragraphs.length === 0) return null

  return (
    <div className="wiki-card">
      <div className="wiki-card__header">
        <p className="wiki-card__label">from wikipedia</p>
        {wikipedia.description && (
          <p className="wiki-card__description">{wikipedia.description}</p>
        )}
      </div>
      <div className="wiki-card__body">
        {wikipedia.thumbnail && (
          <img
            className="wiki-card__thumb"
            src={wikipedia.thumbnail}
            alt={wikipedia.title}
            loading="lazy"
          />
        )}
        <div className="wiki-card__text">
          {paragraphs.map((para, i) => (
            <p key={i} className="wiki-card__extract">{para}</p>
          ))}
          {wikipedia.url && (
            <a
              className="wiki-card__link"
              href={wikipedia.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              read on wikipedia
              <svg
                className="wiki-card__link-icon"
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
