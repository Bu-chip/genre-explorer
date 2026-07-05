import { useState, useEffect, useRef, useCallback } from 'react'
import { TrackInfoPopover } from './TrackInfoPopover'
import { fetchTrackByArtist, fetchPreviewForTrack } from '../utils/artistSearch'
import './TasteOfGenre.css'

const ROTATE_EVERY_MS = 2500
const ROTATE_FADE_MS = 300
const FADE_IN_MS = 400

function pad(n) {
  return String(n).padStart(2, '0')
}

function youtubeUrl(artist, title) {
  const query = encodeURIComponent(`${artist} ${title}`)
  return `https://www.youtube.com/results?search_query=${query}`
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  )
}

function Chevron({ open }) {
  return (
    <svg
      className={`taste__chevron ${open ? 'taste__chevron--open' : ''}`}
      width="9"
      height="9"
      viewBox="0 0 10 10"
      aria-hidden="true"
    >
      <path d="M2 3.5 L5 7 L8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  )
}

function Label() {
  return (
    <p className="taste__label">
      a taste of the genre <TrackInfoPopover />
    </p>
  )
}

function Skeleton() {
  return (
    <div className="taste">
      <div className="taste__header">
        <Label />
      </div>
      <div className="taste__player taste__player--skeleton" aria-hidden="true">
        <div className="taste__skel-cover" />
        <div className="taste__skel-button" />
        <div className="taste__info">
          <div className="taste__skel-text" />
          <div className="taste__skel-bar" />
        </div>
      </div>
    </div>
  )
}

// The player row: cover, play/pause, artist — title, progress bar, plus an
// optional action slot (NEXT) and a status/youtube line underneath.
// `display` is the single source of truth for what is shown AND what plays:
// { name, title?, preview?, cover?, play?, seq }. A new seq recreates the
// audio element; `play: true` asks for an autoplay attempt (browsers may
// still block it before the first gesture — we stay silently paused).
function TastePlayer({ display, statusText, action, fading, onPlayingChange, onInteract }) {
  const [playing, setPlayingState] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)
  const rafRef = useRef(null)
  const fadeRafRef = useRef(null)

  const setPlaying = useCallback(
    (value) => {
      setPlayingState(value)
      if (onPlayingChange) onPlayingChange(value)
    },
    [onPlayingChange],
  )

  // Ramp volume 0 → 1 so previews don't slam in at full volume. On iOS
  // Safari, setting .volume is a no-op (system-controlled), which just means
  // full volume from the start — same as before.
  const fadeIn = useCallback((audio) => {
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current)
    audio.volume = 0
    const start = performance.now()
    const step = (now) => {
      const t = Math.min((now - start) / FADE_IN_MS, 1)
      audio.volume = t
      fadeRafRef.current = t < 1 ? requestAnimationFrame(step) : null
    }
    fadeRafRef.current = requestAnimationFrame(step)
  }, [])

  const cancelFade = useCallback(() => {
    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current)
      fadeRafRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!display?.preview) return

    const audio = new Audio(display.preview)
    audio.volume = 0
    audioRef.current = audio

    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
    }
    audio.addEventListener('ended', onEnded)

    if (display.play) {
      audio.play().then(() => {
        setPlaying(true)
        fadeIn(audio)
      }).catch(() => {})
    }

    return () => {
      audio.removeEventListener('ended', onEnded)
      cancelFade()
      audio.pause()
      audioRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setPlaying(false)
      setProgress(0)
    }
  }, [display, fadeIn, cancelFade, setPlaying])

  // Animate progress bar
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const tick = () => {
      const audio = audioRef.current
      if (audio && audio.duration) {
        setProgress(audio.currentTime / audio.duration)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing])

  const togglePlay = useCallback(() => {
    if (onInteract) onInteract()
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      cancelFade()
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => {
        setPlaying(true)
        fadeIn(audio)
      }).catch(() => {})
    }
  }, [playing, fadeIn, cancelFade, setPlaying, onInteract])

  const handleBarClick = useCallback(
    (e) => {
      if (onInteract) onInteract()
      const audio = audioRef.current
      if (!audio || !audio.duration) return

      const rect = e.currentTarget.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      audio.currentTime = pct * audio.duration
      setProgress(pct)
    },
    [onInteract],
  )

  const fadeClass = fading ? ' taste__fade--out' : ''

  return (
    <>
      <div className="taste__player">
        <div className={`taste__cover-slot${fadeClass}`}>
          {display.cover && (
            <img className="taste__cover" src={display.cover} alt="" width={64} height={64} />
          )}
        </div>
        <button
          className="taste__play"
          onClick={togglePlay}
          disabled={!display.preview}
          aria-label={playing ? 'Pause' : `Play a track by ${display.name}`}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="taste__info">
          <p className={`taste__track${fadeClass}`}>
            <span className="taste__artist">{display.name}</span>
            {display.title && (
              <span className="taste__title"> &mdash; {display.title}</span>
            )}
          </p>
          <div className="taste__bar" onClick={handleBarClick}>
            <div className="taste__fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        {action}
      </div>
      <div className="taste__meta">
        <p className="taste__status" aria-live="polite">{statusText || ' '}</p>
        {display.title && (
          <a
            className="taste__youtube"
            href={youtubeUrl(display.name, display.title)}
            target="_blank"
            rel="noopener noreferrer"
          >
            listen in full &rarr; youtube
          </a>
        )}
      </div>
    </>
  )
}

// Artist mode: one section fed by the genre's EveryNoise artist list. A
// random artist is picked on load and resolved to a playable preview
// (Deezer by artist via the Worker, iTunes fallback); NEXT advances the
// list AND plays; a name tapped in the unfolded list comes to the player
// AND plays. What the player names is always what sounds (or will sound on
// play). Until the first gesture, and only while nothing is playing, the
// player idles through the list with an opacity-only crossfade — each swap
// is pre-resolved so the visible artist is always ready to play. The idle
// walk never starts audio, stops for good at the first interaction, and is
// skipped under prefers-reduced-motion.
function ArtistTaste({ artists }) {
  const count = artists.length
  const [index, setIndex] = useState(() => Math.floor(Math.random() * count))
  const [display, setDisplay] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [fading, setFading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [busyName, setBusyName] = useState(null)
  const [failedName, setFailedName] = useState(null)
  const requestRef = useRef(0)
  const aliveRef = useRef(true)
  const seqRef = useRef(0)
  const cacheRef = useRef(new Map())
  const initialIndexRef = useRef(index)

  // Resolve an artist to a playable track, cached per artist for the life
  // of the genre. Pre-warms the cover so idle swaps don't flash.
  const resolve = useCallback((name) => {
    const cache = cacheRef.current
    if (!cache.has(name)) {
      cache.set(
        name,
        fetchTrackByArtist(name).then((track) => {
          if (track?.cover) {
            const img = new Image()
            img.src = track.cover
          }
          return track
        }),
      )
    }
    return cache.get(name)
  }, [])

  // Initial pick: walk forward from the random start until an artist
  // resolves, then hand it to the player with an autoplay attempt.
  useEffect(() => {
    aliveRef.current = true
    const request = ++requestRef.current
    const start = initialIndexRef.current

    ;(async () => {
      for (let step = 0; step < count; step++) {
        const i = (start + step) % count
        const track = await resolve(artists[i].name)
        if (!aliveRef.current || request !== requestRef.current) return
        if (track) {
          setIndex(i)
          setDisplay({ name: artists[i].name, ...track, play: true, seq: ++seqRef.current })
          return
        }
      }
      // Nothing in the whole list resolved (offline, or all previews
      // missing): show the starting artist, unplayable, and say so.
      setDisplay({ name: artists[start].name, seq: ++seqRef.current })
      setFailedName(artists[start].name)
    })()

    return () => {
      aliveRef.current = false
    }
  }, [artists, count, resolve])

  const markInteracted = useCallback(() => {
    setInteracted(true)
    setFading(false)
  }, [])

  const playArtist = useCallback(
    (i) => {
      const artist = artists[i]
      const request = ++requestRef.current
      setIndex(i)
      setFailedName(null)
      setBusyName(artist.name)
      // Show the chosen name right away; audio and cover follow when the
      // track resolves, so the visible name never lies about the source.
      setDisplay({ name: artist.name, seq: ++seqRef.current })
      resolve(artist.name).then((track) => {
        if (!aliveRef.current || request !== requestRef.current) return
        setBusyName(null)
        if (track) {
          setDisplay({ name: artist.name, ...track, play: true, seq: ++seqRef.current })
        } else {
          setFailedName(artist.name)
        }
      })
    },
    [artists, resolve],
  )

  const next = () => {
    markInteracted()
    playArtist((index + 1) % count)
  }

  const playFromList = (i) => {
    markInteracted()
    playArtist(i)
  }

  const toggleList = () => {
    markInteracted()
    setExpanded((e) => !e)
  }

  // Idle walk. Re-armed after every swap (display is a dep), so the cadence
  // is a steady ROTATE_EVERY_MS from the last change.
  useEffect(() => {
    if (interacted || playing || count < 2 || !display) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    let swapTimeout = null

    const tick = async () => {
      let hit = null
      for (let step = 1; step < count && !hit; step++) {
        const i = (index + step) % count
        const track = await resolve(artists[i].name)
        if (cancelled) return
        if (track) hit = { i, track }
      }
      if (!hit) return
      setFading(true)
      swapTimeout = setTimeout(() => {
        if (cancelled) return
        setIndex(hit.i)
        setDisplay({ name: artists[hit.i].name, ...hit.track, play: false, seq: ++seqRef.current })
        setFading(false)
      }, ROTATE_FADE_MS)
    }

    const interval = setInterval(tick, ROTATE_EVERY_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
      if (swapTimeout) clearTimeout(swapTimeout)
    }
  }, [interacted, playing, count, display, index, artists, resolve])

  const status = busyName
    ? `tuning in ${busyName}...`
    : failedName
      ? `no preview found for ${failedName}`
      : ''

  if (!display) return <Skeleton />

  return (
    <div className="taste">
      <div className="taste__header">
        <Label />
        <span className="taste__counter">
          {pad(index + 1)} / {pad(count)}
        </span>
      </div>

      <TastePlayer
        display={display}
        statusText={status}
        fading={fading}
        onPlayingChange={setPlaying}
        onInteract={markInteracted}
        action={
          count > 1 ? (
            <button
              type="button"
              className="taste__next"
              onClick={next}
              aria-label="Next artist, play a track"
            >
              next
            </button>
          ) : null
        }
      />

      <button
        type="button"
        className="taste__toggle"
        onClick={toggleList}
        aria-expanded={expanded}
      >
        all {count} artists <Chevron open={expanded} />
      </button>

      {expanded && (
        <ul className="taste__list">
          {artists.map((artist, i) => (
            <li key={artist.id || artist.name} className="taste__item">
              <button
                type="button"
                className={`taste__item-btn ${i === index ? 'taste__item-btn--current' : ''}`}
                onClick={() => playFromList(i)}
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

// Fallback for the handful of genres whose EveryNoise artist list is empty:
// the old by-tag cascade (Last.fm → Deezer → iTunes, via useTrack) feeds a
// plain player so those genres don't go mute. No dial — there is no list.
function FallbackTaste({ track }) {
  const [display, setDisplay] = useState(() =>
    track.preview
      ? {
          name: track.artist,
          title: track.title,
          preview: track.preview,
          cover: track.cover,
          play: true,
          seq: 1,
        }
      : null,
  )
  const [notFound, setNotFound] = useState(false)

  // Last.fm / iTunes cascade hits only carry names — resolve a preview URL.
  useEffect(() => {
    if (track.preview) return
    let cancelled = false
    fetchPreviewForTrack(track.artist, track.title).then((result) => {
      if (cancelled) return
      if (result) {
        setDisplay({
          name: result.artist,
          title: result.title,
          preview: result.preview,
          cover: result.cover,
          play: true,
          seq: 1,
        })
      } else {
        setNotFound(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [track])

  if (notFound) return null
  if (!display) return <Skeleton />

  return (
    <div className="taste">
      <div className="taste__header">
        <Label />
      </div>
      <TastePlayer display={display} />
    </div>
  )
}

// One section, one source: "a taste of the genre" plays the genre's own
// artists. `fallbackTrack` only matters for genres with no artist list.
export function TasteOfGenre({ artists, artistsLoaded, fallbackTrack }) {
  if (!artistsLoaded) return <Skeleton />
  if (artists?.length) return <ArtistTaste artists={artists} />
  if (fallbackTrack) return <FallbackTaste track={fallbackTrack} />
  return <Skeleton />
}
