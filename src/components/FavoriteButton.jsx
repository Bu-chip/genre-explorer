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
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 10.2 L1.6 6.0 A2.4 2.4 0 0 1 5.0 2.6 L6 3.6 L7.0 2.6 A2.4 2.4 0 0 1 10.4 6.0 Z" />
      </svg>
      <span>{active ? 'Saved' : 'Save'}</span>
    </button>
  )
}
