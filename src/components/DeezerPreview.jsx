import { useState, useEffect, useRef, useCallback } from 'react'
import { TrackInfoPopover } from './TrackInfoPopover'
import './DeezerPreview.css'

const PROXY = 'https://corsproxy.io/?'
const DEEZER_SEARCH = 'https://api.deezer.com/search'

async function fetchDeezer(artist, track) {
  const query = `${artist} ${track}`
  const url = `${DEEZER_SEARCH}?q=${encodeURIComponent(query)}&limit=1`

  // Try direct first
  try {
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data?.data?.[0]) return data.data[0]
    }
  } catch {
    // CORS likely blocked, try proxy
  }

  // Try with CORS proxy
  try {
    const res = await fetch(`${PROXY}${encodeURIComponent(url)}`)
    if (res.ok) {
      const data = await res.json()
      if (data?.data?.[0]) return data.data[0]
    }
  } catch {
    // Both failed
  }

  return null
}

function PlayIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  )
}

function Skeleton() {
  return (
    <div className="deezer-preview-wrapper">
      <p className="deezer-preview__label">a taste of the genre</p>
      <div className="deezer-preview deezer-preview--skeleton" aria-hidden="true">
        <div className="deezer-preview__skel-cover" />
        <div className="deezer-preview__skel-button" />
        <div className="deezer-preview__skel-info">
          <div className="deezer-preview__skel-text" />
          <div className="deezer-preview__skel-bar" />
        </div>
      </div>
    </div>
  )
}

export function DeezerPreview({ artist, track }) {
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)
  const rafRef = useRef(null)

  // Fetch Deezer data
  useEffect(() => {
    if (!artist || !track) return

    let cancelled = false

    fetchDeezer(artist, track).then((result) => {
      if (cancelled) return
      if (result?.preview) {
        setData({
          preview: result.preview,
          cover: result.album?.cover_medium,
          artist: result.artist?.name || artist,
          title: result.title || track,
        })
      } else {
        setNotFound(true)
      }
    })

    return () => {
      cancelled = true
      setData(null)
      setNotFound(false)
      setPlaying(false)
      setProgress(0)
    }
  }, [artist, track])

  // Setup audio element, autoplay when a new preview URL arrives
  useEffect(() => {
    if (!data?.preview) return

    const audio = new Audio(data.preview)
    audioRef.current = audio

    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
    }
    audio.addEventListener('ended', onEnded)

    // Autoplay; stay silently paused if the browser blocks it (e.g. Safari iOS
    // before user gesture).
    audio.play().then(() => setPlaying(true)).catch(() => {})

    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audioRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [data?.preview])

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
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [playing])

  const handleBarClick = useCallback((e) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = pct * audio.duration
    setProgress(pct)
  }, [])

  if (notFound) return null
  if (!data) return <Skeleton />

  return (
    <div className="deezer-preview-wrapper">
      <p className="deezer-preview__label">a taste of the genre</p>
      <div className="deezer-preview">
        {data.cover && (
          <img
            className="deezer-preview__cover"
            src={data.cover}
            alt=""
            width={64}
            height={64}
          />
        )}
        <button
          className="deezer-preview__play"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="deezer-preview__info">
          <p className="deezer-preview__track">
            <span className="deezer-preview__track-text">
              {data.artist} &mdash; {data.title}
            </span>
            <TrackInfoPopover />
          </p>
          <div className="deezer-preview__bar" onClick={handleBarClick}>
            <div
              className="deezer-preview__fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
