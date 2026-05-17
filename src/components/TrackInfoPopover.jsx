import { useState, useRef, useEffect } from 'react'
import './TrackInfoPopover.css'

const DISCLAIMER =
  "Tracks pulled automatically from Last.fm, Deezer or iTunes. Some won't fit. Genres are labels, not boxes."

export function TrackInfoPopover() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const handlePointer = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false)
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('touchstart', handlePointer)
    window.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('touchstart', handlePointer)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <span className="track-info" ref={wrapperRef}>
      <button
        type="button"
        className="track-info__button"
        onClick={() => setOpen((v) => !v)}
        aria-label="About these tracks"
        aria-expanded={open}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
      </button>
      {open && (
        <div className="track-info__popover" role="tooltip">
          {DISCLAIMER}
        </div>
      )}
    </span>
  )
}
