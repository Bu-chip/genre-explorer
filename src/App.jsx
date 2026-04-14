import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGenres } from './hooks/useGenres'
import { useLastfm } from './hooks/useLastfm'
import { getRarityScore } from './utils/rarityScore'
import { getPhrase } from './utils/phrases'
import { NavBar } from './components/NavBar'
import { GenreName, GenreDescription } from './components/GenreCard'
import { ListenLinks } from './components/ListenLinks'
import { DeezerPreview } from './components/DeezerPreview'
import { NearbyGenres } from './components/NearbyGenres'
import { ShareButton } from './components/ShareButton'
import { DiscoveryCounter } from './components/DiscoveryCounter'
import './App.css'

const CYCLE_COUNT = 5
const CYCLE_TICK = 100

function App() {
  const { genres, loading, error } = useGenres()
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [spinDisplay, setSpinDisplay] = useState(null)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [scrollHintVisible, setScrollHintVisible] = useState(true)
  const nameRef = useRef(null)
  const cyclingRef = useRef(false)
  const cyclingTimerRef = useRef(null)

  const lastfm = useLastfm(selectedGenre?.name)

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
      <span className="app__watermark">Random Genre Explorer</span>

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
            <NavBar genres={genres} onRandom={handleRandom} onSelect={handleResult} disabled={spinning} currentGenre={selectedGenre} />
          </header>

          <section className="zone-discovery">
            <div ref={nameRef}>
              <NavBar genres={genres} onRandom={handleRandom} onSelect={handleResult} disabled={spinning} currentGenre={selectedGenre} />
            </div>

            <div className="discovery-content">
              <GenreName genre={selectedGenre} displayName={spinDisplay} contextPhrase={contextPhrase} />
              <ListenLinks name={selectedGenre.name} slug={selectedGenre.slug} />
              <ShareButton genre={selectedGenre} />
            </div>

            {scrollHintVisible && (
              <div className="scroll-hint" aria-hidden="true">
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1l7 7 7-7" />
                </svg>
              </div>
            )}
          </section>

          <section className="zone-exploration" style={{ '--genre-tint': selectedGenre.color }}>
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
                  <div className="exploration-grid__main">
                    <GenreDescription lastfm={lastfm} />
                    <DeezerPreview
                      artist={lastfm?.topTrack?.artist}
                      track={lastfm?.topTrack?.title}
                    />
                  </div>
                  <div className="exploration-grid__side">
                    <NearbyGenres
                      genre={selectedGenre}
                      allGenres={genres}
                      onSelect={handleResult}
                    />
                  </div>
                </div>
                <DiscoveryCounter genre={selectedGenre} total={genres.length} />
              </motion.div>
            </AnimatePresence>
          </section>
        </>
      ) : (
        <div className="app__landing">
          <NavBar genres={genres} onRandom={handleRandom} onSelect={handleResult} disabled={false} currentGenre={null} />
          <p className="app__landing-sub">
            {genres.length.toLocaleString()} genres to explore
          </p>
        </div>
      )}
    </div>
  )
}

export default App
