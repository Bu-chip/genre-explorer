import { useState } from 'react'
import { fetchTrackByArtist } from '../utils/artistSearch'
import './GenreArtists.css'

function pad(n) {
  return String(n).padStart(2, '0')
}

function Chevron({ open }) {
  return (
    <svg
      className={`artists__chevron ${open ? 'artists__chevron--open' : ''}`}
      width="9"
      height="9"
      viewBox="0 0 10 10"
      aria-hidden="true"
    >
      <path d="M2 3.5 L5 7 L8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  )
}

// Dial + list. One artist visible at a time with a "next" control to tune
// through the ranking; the chevron unfolds the full list. Clicking any name
// searches Deezer (then iTunes) by artist and hands the track up to the
// player via onTrack.
export function GenreArtists({ artists, onTrack }) {
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [busyName, setBusyName] = useState(null)
  const [failedName, setFailedName] = useState(null)
  const [playingName, setPlayingName] = useState(null)

  if (!artists?.length) return null

  const current = artists[index % artists.length]

  const play = async (artist) => {
    if (busyName) return
    setFailedName(null)
    setBusyName(artist.name)
    const result = await fetchTrackByArtist(artist.name)
    setBusyName(null)
    if (result) {
      setPlayingName(artist.name)
      onTrack(result)
    } else {
      setFailedName(artist.name)
    }
  }

  const next = () => {
    setFailedName(null)
    setIndex((i) => (i + 1) % artists.length)
  }

  const nameState = (name) => {
    if (name === busyName) return 'artists__name-btn--busy'
    if (name === playingName) return 'artists__name-btn--playing'
    return ''
  }

  const status = busyName
    ? `tuning in ${busyName}...`
    : failedName
      ? `no preview found for ${failedName}`
      : playingName
        ? `now playing ${playingName}`
        : ' '

  return (
    <div className="artists">
      <div className="artists__header">
        <h3 className="artists__title">artists</h3>
        <span className="artists__counter">
          {pad((index % artists.length) + 1)} / {pad(artists.length)}
        </span>
      </div>

      <div className="artists__dial">
        <button
          type="button"
          className={`artists__name-btn artists__dial-name ${nameState(current.name)}`}
          onClick={() => play(current)}
          aria-label={`Play a track by ${current.name}`}
        >
          {current.name}
        </button>
        <button
          type="button"
          className="artists__next"
          onClick={next}
          aria-label="Next artist"
        >
          next
        </button>
      </div>

      <p className="artists__status" aria-live="polite">{status}</p>

      <button
        type="button"
        className="artists__toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        all {artists.length} artists <Chevron open={expanded} />
      </button>

      {expanded && (
        <ul className="artists__list">
          {artists.map((artist) => (
            <li key={artist.id || artist.name} className="artists__item">
              <button
                type="button"
                className={`artists__name-btn artists__item-btn ${nameState(artist.name)}`}
                onClick={() => play(artist)}
                aria-label={`Play a track by ${artist.name}`}
              >
                {artist.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
