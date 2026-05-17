import './FavoriteButton.css'

export function FavoriteButton({ active, onToggle }) {
  const label = active ? 'Remove from favorites' : 'Save to favorites'

  return (
    <button
      type="button"
      className={`fav-btn ${active ? 'fav-btn--active' : ''}`}
      onClick={onToggle}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      <svg
        className="fav-btn__icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
