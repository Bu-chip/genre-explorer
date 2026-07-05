import { useState, useEffect, useRef } from 'react'
import { fetchTrackByArtist } from '../utils/artistSearch'
import './GenreArtists.css'

const ROTATE_EVERY_MS = 2500
const ROTATE_FADE_MS = 300

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

// Dial + list. The big name is the single source of truth: it is what plays
// (or will play on tap). NEXT advances the dial AND plays; a name tapped in
// the unfolded list comes to the dial AND plays. Until the first
// interaction the dial idles through the ranking with an opacity-only
// crossfade — no audio, stopped for good (per genre) once the user touches
// anything, and skipped entirely under prefers-reduced-motion.
export function GenreArtists({ artists, onTrack }) {
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [fading, setFading] = useState(false)
  const [busyName, setBusyName] = useState(null)
  const [failedName, setFailedName] = useState(null)
  const requestRef = useRef(0)
  const aliveRef = useRef(true)

  const count = artists?.length ?? 0

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  // Idle rotation: tick every ROTATE_EVERY_MS while untouched.
  useEffect(() => {
    if (interacted || count < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const interval = setInterval(() => setFading(true), ROTATE_EVERY_MS)
    return () => clearInterval(interval)
  }, [interacted, count])

  // Second half of the crossfade: once the name has faded out, swap name
  // and counter in the same instant, then let opacity ease back in.
  useEffect(() => {
    if (!fading) return
    const timeout = setTimeout(() => {
      setIndex((i) => (i + 1) % count)
      setFading(false)
    }, ROTATE_FADE_MS)
    return () => clearTimeout(timeout)
  }, [fading, count])

  if (!count) return null

  const current = artists[index % count]

  const markInteracted = () => {
    setInteracted(true)
    setFading(false)
  }

  const play = async (artist) => {
    const request = ++requestRef.current
    setFailedName(null)
    setBusyName(artist.name)
    const result = await fetchTrackByArtist(artist.name)
    if (!aliveRef.current || request !== requestRef.current) return
    setBusyName(null)
    if (result) {
      onTrack(result)
    } else {
      setFailedName(artist.name)
    }
  }

  const playCurrent = () => {
    markInteracted()
    play(current)
  }

  const next = () => {
    markInteracted()
    const nextIndex = (index + 1) % count
    setIndex(nextIndex)
    play(artists[nextIndex])
  }

  const playFromList = (artist, i) => {
    markInteracted()
    setIndex(i)
    play(artist)
  }

  const toggleList = () => {
    markInteracted()
    setExpanded((e) => !e)
  }

  const status = busyName
    ? `tuning in ${busyName}...`
    : failedName
      ? `no preview found for ${failedName}`
      : ' '

  return (
    <div className="artists">
      <div className="artists__header">
        <h3 className="artists__title">artists</h3>
        <span className="artists__counter">
          {pad((index % count) + 1)} / {pad(count)}
        </span>
      </div>

      <div className="artists__dial">
        <button
          type="button"
          className={`artists__dial-name ${fading ? 'artists__dial-name--fading' : ''}`}
          onClick={playCurrent}
          aria-label={`Play a track by ${current.name}`}
        >
          {current.name}
        </button>
        <button
          type="button"
          className="artists__next"
          onClick={next}
          aria-label="Next artist, play a track"
        >
          next
        </button>
      </div>

      <p className="artists__status" aria-live="polite">{status}</p>

      <button
        type="button"
        className="artists__toggle"
        onClick={toggleList}
        aria-expanded={expanded}
      >
        all {count} artists <Chevron open={expanded} />
      </button>

      {expanded && (
        <ul className="artists__list">
          {artists.map((artist, i) => (
            <li key={artist.id || artist.name} className="artists__item">
              <button
                type="button"
                className={`artists__item-btn ${i === index ? 'artists__item-btn--current' : ''}`}
                onClick={() => playFromList(artist, i)}
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
