import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGenres } from './hooks/useGenres'
import { useLastfm } from './hooks/useLastfm'
import { useTrack } from './hooks/useTrack'
import { useWikipedia } from './hooks/useWikipedia'
import { useFavorites } from './hooks/useFavorites'
import { getRarityScore } from './utils/rarityScore'
import { getPhrase } from './utils/phrases'
import { randomGlyph } from './utils/glitch'
import { NavBar } from './components/NavBar'
import { GenreName, GenreDescription } from './components/GenreCard'
import { WikipediaCard } from './components/WikipediaCard'
import { ListenLinks } from './components/ListenLinks'
import { DeezerPreview } from './components/DeezerPreview'
import { NearbyGenres } from './components/NearbyGenres'
import { ShareButton } from './components/ShareButton'
import { FavoriteButton } from './components/FavoriteButton'
import { DiscoveryCounter } from './components/DiscoveryCounter'
import { Marquee } from './components/Marquee'
import { ContextPhrase } from './components/ContextPhrase'
import './App.css'

const CYCLE_COUNT = 5
const CYCLE_TICK = 100

const RANDOM_LETTERS = ['R', 'A', 'N', 'D', 'O', 'M']
const SCRAMBLE_DURATION = 520
const SCRAMBLE_TICK = 40
const RANDOM_COUNT = 4
const RANDOM_ALIGNMENTS = ['left', 'center', 'right', 'center']
const GLITCH_DELAY_MIN = 800
const GLITCH_DELAY_MAX = 1800
const GLITCH_HOLD_MIN = 200
const GLITCH_HOLD_MAX = 300
const GLITCH_LETTER_COUNT = 3

const MARQUEE_TEXT = 'random · random · random · genre explorer · '.repeat(14)
const HEADER_MARQUEE_TEXT = 'random genre explorer · '.repeat(20)

function freshDisplays() {
  return Array.from({ length: RANDOM_COUNT }, () => [...RANDOM_LETTERS])
}

function Landing({ onRandom, total }) {
  const [displays, setDisplays] = useState(freshDisplays)
  const [scrambling, setScrambling] = useState(false)
  const scrambleTimerRef = useRef(null)

  const handleClick = () => {
    if (scrambling) return
    setScrambling(true)

    const start = performance.now()
    const settleStep = SCRAMBLE_DURATION / RANDOM_LETTERS.length

    scrambleTimerRef.current = setInterval(() => {
      const elapsed = performance.now() - start
      const next = Array.from({ length: RANDOM_COUNT }, () =>
        RANDOM_LETTERS.map((target, i) => {
          const settledAt = (i + 1) * settleStep
          return elapsed >= settledAt ? target : randomGlyph()
        }),
      )
      setDisplays(next)

      if (elapsed >= SCRAMBLE_DURATION) {
        clearInterval(scrambleTimerRef.current)
        scrambleTimerRef.current = null
        setDisplays(freshDisplays())
        setScrambling(false)
        onRandom()
      }
    }, SCRAMBLE_TICK)
  }

  useEffect(() => {
    return () => {
      if (scrambleTimerRef.current) clearInterval(scrambleTimerRef.current)
    }
  }, [])

  // Idle micro-glitch loop — paused while click-scramble is running.
  useEffect(() => {
    if (scrambling) return

    let cancelled = false
    let pending = null

    const scheduleNext = () => {
      if (cancelled) return
      const delay = GLITCH_DELAY_MIN + Math.random() * (GLITCH_DELAY_MAX - GLITCH_DELAY_MIN)
      pending = setTimeout(runGlitch, delay)
    }

    const runGlitch = () => {
      if (cancelled) return
      const which = Math.floor(Math.random() * RANDOM_COUNT)
      const positions = new Set()
      while (positions.size < GLITCH_LETTER_COUNT) {
        positions.add(Math.floor(Math.random() * RANDOM_LETTERS.length))
      }
      setDisplays((prev) =>
        prev.map((d, i) =>
          i === which
            ? RANDOM_LETTERS.map((c, j) => (positions.has(j) ? randomGlyph() : c))
            : d,
        ),
      )

      const hold = GLITCH_HOLD_MIN + Math.random() * (GLITCH_HOLD_MAX - GLITCH_HOLD_MIN)
      pending = setTimeout(() => {
        if (cancelled) return
        setDisplays((prev) =>
          prev.map((d, i) => (i === which ? [...RANDOM_LETTERS] : d)),
        )
        scheduleNext()
      }, hold)
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (pending) clearTimeout(pending)
    }
  }, [scrambling])

  return (
    <div className="app__landing">
      <h1 className="visually-hidden">Random Genre Explorer</h1>

      <Marquee direction="rtl" text={MARQUEE_TEXT} className="marquee--landing" />

      <div className="landing__randoms">
        {displays.map((display, i) => (
          <button
            key={i}
            type="button"
            className={`landing__random landing__random--${RANDOM_ALIGNMENTS[i]}`}
            onClick={handleClick}
            aria-label={`Random genre, option ${i + 1} of ${RANDOM_COUNT}`}
          >
            {display.map((char, j) => (
              <span key={j} className="landing__random-letter">{char}</span>
            ))}
          </button>
        ))}
      </div>

      <Marquee direction="ltr" text={MARQUEE_TEXT} className="marquee--landing" />

      <DiscoveryCounter genre={null} total={total} compact />
    </div>
  )
}

function App() {
  const { genres, loading, error } = useGenres()
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [spinDisplay, setSpinDisplay] = useState(null)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [scrollHintVisible, setScrollHintVisible] = useState(true)
  const nameRef = useRef(null)
  const cyclingRef = useRef(false)
  const cyclingTimerRef = useRef(null)

  // Deep link: load genre from hash on initial load
  useEffect(() => {
    if (!genres?.length || selectedGenre) return
    const hash = window.location.hash
    const match = hash.match(/^#genre=(.+)$/)
    if (match) {
      const slug = decodeURIComponent(match[1])
      const genre = genres.find((g) => g.slug === slug)
      if (genre) setSelectedGenre(genre)
    }
  }, [genres, selectedGenre])

  const lastfm = useLastfm(selectedGenre?.name)
  const track = useTrack(selectedGenre?.name)
  const wikipedia = useWikipedia(selectedGenre?.name)
  const { favorites, isFavorite, toggleFavorite, clearFavorites } = useFavorites()

  const genreIndex = useMemo(() => {
    if (!selectedGenre || !genres) return null
    return genres.findIndex((g) => g.slug === selectedGenre.slug)
  }, [selectedGenre, genres])

  const rarityScore = useMemo(() => {
    if (!selectedGenre || !genres?.length) return 50
    return getRarityScore(selectedGenre, genres, lastfm)
  }, [selectedGenre, genres, lastfm])

  const [contextPhrase, setContextPhrase] = useState(null)

  useEffect(() => {
    if (!selectedGenre) return
    setContextPhrase(getPhrase(rarityScore, { index: genreIndex }))
  }, [selectedGenre, rarityScore, genreIndex])

  const handleResult = useCallback((genre) => {
    if (cyclingTimerRef.current) {
      clearInterval(cyclingTimerRef.current)
      cyclingTimerRef.current = null
      cyclingRef.current = false
    }
    setSpinDisplay(null)
    setSelectedGenre(genre)
    setHeaderVisible(false)
    window.location.hash = `genre=${genre.slug}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const pickRandom = useCallback(() => {
    if (!genres?.length) return null
    return genres[Math.floor(Math.random() * genres.length)]
  }, [genres])

  const handleRandom = useCallback(() => {
    const genre = pickRandom()
    if (!genre) return

    if (!selectedGenre) {
      handleResult(genre)
      return
    }

    if (cyclingRef.current) return

    cyclingRef.current = true
    setHeaderVisible(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    setSpinDisplay(genres[Math.floor(Math.random() * genres.length)].name)

    let tick = 1
    cyclingTimerRef.current = setInterval(() => {
      if (tick < CYCLE_COUNT) {
        setSpinDisplay(genres[Math.floor(Math.random() * genres.length)].name)
        tick++
      } else {
        clearInterval(cyclingTimerRef.current)
        cyclingTimerRef.current = null
        cyclingRef.current = false
        setSpinDisplay(null)
        setSelectedGenre(genre)
      }
    }, CYCLE_TICK)
  }, [selectedGenre, genres, handleResult, pickRandom])

  // Spacebar shortcut
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code !== 'Space') return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      handleRandom()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleRandom])

  useEffect(() => {
    return () => {
      if (cyclingTimerRef.current) clearInterval(cyclingTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!selectedGenre) return
    setScrollHintVisible(true)
    const onScroll = () => {
      if (window.scrollY > 50) {
        setScrollHintVisible(false)
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [selectedGenre])

  useEffect(() => {
    const el = nameRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setHeaderVisible(!entry.isIntersecting),
      { threshold: 0 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [selectedGenre])

  if (error) {
    return (
      <div className="app">
        <p className="app__error">failed to load genres: {error}</p>
      </div>
    )
  }

  const hasGenre = !!selectedGenre
  const spinning = cyclingRef.current

  return (
    <div className="app">
      <div className="app__noise" />

      {loading ? (
        <p className="app__loading">loading genres...</p>
      ) : hasGenre ? (
        <>
          <header
            className="sticky-header"
            style={{
              opacity: headerVisible ? 1 : 0,
              pointerEvents: headerVisible ? 'auto' : 'none',
            }}
          >
            <NavBar genres={genres} onRandom={handleRandom} onSelect={handleResult} disabled={spinning} currentGenre={selectedGenre} favorites={favorites} onClearFavorites={clearFavorites} />
          </header>

          <section className="zone-discovery">
            <h1 className="visually-hidden">Random Genre Explorer</h1>

            <div className="discovery-header">
              <Marquee
                direction="rtl"
                text={HEADER_MARQUEE_TEXT}
                className="marquee--header"
              />
              <div className="discovery-header__nav" ref={nameRef}>
                <NavBar genres={genres} onRandom={handleRandom} onSelect={handleResult} disabled={spinning} currentGenre={selectedGenre} favorites={favorites} onClearFavorites={clearFavorites} />
              </div>
              <div className="discovery-content">
                <GenreName genre={selectedGenre} displayName={spinDisplay} />
                <ContextPhrase phrase={contextPhrase} spinning={!!spinDisplay} />
                <ListenLinks name={selectedGenre.name} slug={selectedGenre.slug} />
                <div className="discovery-actions">
                  <FavoriteButton
                    active={isFavorite(selectedGenre.slug)}
                    onToggle={() => toggleFavorite(selectedGenre.slug)}
                  />
                  <ShareButton genre={selectedGenre} />
                </div>
              </div>
            </div>

            <DiscoveryCounter genre={selectedGenre} total={genres.length} compact />

            <div className="discovery-preview">
              <DeezerPreview
                artist={track?.artist}
                track={track?.title}
              />
            </div>

            {scrollHintVisible && (
              <div className="scroll-hint" aria-hidden="true">
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1l7 7 7-7" />
                </svg>
              </div>
            )}
          </section>

          <section className="zone-exploration">
            <AnimatePresence mode="wait">
              <motion.div
                className="exploration-content"
                key={selectedGenre.slug}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="exploration-grid">
                  <GenreDescription lastfm={lastfm} />
                  <WikipediaCard wikipedia={wikipedia} />
                  <NearbyGenres
                    genre={selectedGenre}
                    allGenres={genres}
                    onSelect={handleResult}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </section>
        </>
      ) : (
        <Landing onRandom={handleRandom} total={genres.length} />
      )}
    </div>
  )
}

export default App
