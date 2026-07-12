import { useState, useEffect, useRef, useCallback } from 'react'
import { TrackInfoPopover } from './TrackInfoPopover'
import { TrackLinksMenu } from './TrackLinksMenu'
import { deezerProxyUrl } from '../config'
import './DeezerPreview.css'

const DEEZER_SEARCH = 'https://api.deezer.com/search'
const FADE_IN_MS = 400

async function fetchDeezer(artist, track) {
  const query = `${artist} ${track}`
  const url = `${DEEZER_SEARCH}?q=${encodeURIComponent(query)}&limit=1`

  // Try direct first. Deezer normally blocks this with CORS, but it's cheap
  // to attempt and avoids a proxy round-trip when it happens to work.
  try {
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data?.data?.[0]) return data.data[0]
    }
  } catch {
    // CORS likely blocked — fall through to the proxy.
  }

  // Try via our Deezer proxy (Cloudflare Worker).
  const proxied = deezerProxyUrl(url)
  try {
    const res = await fetch(proxied)
    if (res.ok) {
      const data = await res.json()
      if (data?.data?.[0]) return data.data[0]
      // Reached Deezer fine, but no track matched — not an error.
      return null
    }
    console.warn(
      `[DeezerPreview] proxy responded ${res.status} ${res.statusText} for ${proxied}`,
    )
  } catch (err) {
    console.warn(`[DeezerPreview] proxy fetch failed for ${proxied}:`, err)
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
      <Label />
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

function Label() {
  return (
    <p className="deezer-preview__label">
      a taste of the genre <TrackInfoPopover />
    </p>
  )
}

export function DeezerPreview({ artist, track, preview, cover }) {
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)
  const rafRef = useRef(null)
  const fadeRafRef = useRef(null)

  // Resolve the preview: reuse the one the cascade already found (Deezer hit
  // in useTrack), or search Deezer by artist + track (Last.fm / iTunes hits
  // only carry names, no preview URL).
  useEffect(() => {
    if (!artist || !track) return

    let cancelled = false

    if (preview) {
      setData({ preview, cover, artist, title: track })
    } else {
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
    }

    return () => {
      cancelled = true
      setData(null)
      setNotFound(false)
      setPlaying(false)
      setProgress(0)
    }
  }, [artist, track, preview, cover])

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

  // Setup audio element, autoplay when a new preview URL arrives
  useEffect(() => {
    if (!data?.preview) return

    const audio = new Audio(data.preview)
    audio.volume = 0
    audioRef.current = audio

    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
    }
    audio.addEventListener('ended', onEnded)

    // Autoplay; stay silently paused if the browser blocks it (e.g. Safari iOS
    // before user gesture). fadeIn resets volume to 0 on every play, so a
    // blocked autoplay needs no volume cleanup here.
    audio.play().then(() => {
      setPlaying(true)
      fadeIn(audio)
    }).catch(() => {})

    return () => {
      audio.removeEventListener('ended', onEnded)
      cancelFade()
      audio.pause()
      audioRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [data?.preview, fadeIn, cancelFade])

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
      cancelFade()
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => {
        setPlaying(true)
        fadeIn(audio)
      }).catch(() => {})
    }
  }, [playing, fadeIn, cancelFade])

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
      <Label />
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
          <TrackLinksMenu artist={data.artist} title={data.title} />
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
