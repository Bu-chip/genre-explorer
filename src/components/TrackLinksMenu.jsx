import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { isMobile, YOUTUBE_PATH, SPOTIFY_PATH } from './ListenLinks'
import './TrackLinksMenu.css'

// Deezer equalizer glyph (simple-icons), monochrome like the rest.
const DEEZER_PATH =
  'M18.81 4.16v3.03H24V4.16zM6.27 8.38v3.027h5.189V8.38zm12.54 0v3.027H24V8.38zM0 12.594v3.027h5.19v-3.027zm6.27 0v3.027h5.19v-3.027zm6.27 0v3.027h5.19v-3.027zm6.27 0v3.027H24v-3.027zM0 16.81v3.029h5.19v-3.03zm6.27 0v3.029h5.19v-3.03zm6.27 0v3.029h5.19v-3.03zm6.27 0v3.029H24v-3.03z'

const DESTINATIONS = [
  {
    id: 'youtube',
    label: 'YouTube',
    path: YOUTUBE_PATH,
    url: (q) => `https://www.youtube.com/results?search_query=${q}`,
  },
  {
    id: 'deezer',
    label: 'Deezer',
    path: DEEZER_PATH,
    url: (q) => `https://www.deezer.com/search/${q}`,
  },
  {
    id: 'spotify',
    label: 'Spotify',
    path: SPOTIFY_PATH,
    url: (q) =>
      isMobile()
        ? `spotify:search:${q}`
        : `https://open.spotify.com/search/${q}`,
  },
]

// The player's track line doubles as a menu toggle: clicking it offers
// search links to keep listening outside the app. Same dismiss pattern
// as TrackInfoPopover (outside pointer or Escape).
export function TrackLinksMenu({ artist, title }) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const wrapperRef = useRef(null)
  const menuRef = useRef(null)

  // Flip the menu above the track line when it would run past the bottom of
  // the viewport (the player sits near the fold on short viewports). Based
  // on wrapper geometry + menu height, so it's stable across re-measures.
  useLayoutEffect(() => {
    if (!open) return
    const wrapper = wrapperRef.current
    const menu = menuRef.current
    if (!wrapper || !menu) return
    const gap = 8
    const wrapRect = wrapper.getBoundingClientRect()
    const menuHeight = menu.getBoundingClientRect().height
    const overflowsBelow = wrapRect.bottom + gap + menuHeight > window.innerHeight
    const fitsAbove = wrapRect.top - gap - menuHeight >= 0
    setOpenUp(overflowsBelow && fitsAbove)
  }, [open])

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

  const query = encodeURIComponent(`${artist} ${title}`)

  return (
    <div className="track-links" ref={wrapperRef}>
      <button
        type="button"
        className="track-links__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Keep listening elsewhere"
      >
        <span className="track-links__text">
          {artist} &mdash; {title}
        </span>
        <span className="track-links__glyph" aria-hidden="true">
          &#8599;
        </span>
      </button>

      {open && (
        <nav
          ref={menuRef}
          className={`track-links__menu ${openUp ? 'track-links__menu--up' : ''}`}
          aria-label="Keep listening on"
        >
          {DESTINATIONS.map(({ id, label, path, url }) => (
            <a
              key={id}
              className="track-links__item"
              href={url(query)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={path} />
              </svg>
              {label}
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
