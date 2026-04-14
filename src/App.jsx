import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGenres } from './hooks/useGenres'
import { useLastfm } from './hooks/useLastfm'
import { SlotMachine } from './components/SlotMachine'
import { NavBar } from './components/NavBar'
import { SearchBox } from './components/SearchBox'
import { GenreName, GenreLinks, GenreDescription } from './components/GenreCard'
import { ListenLinks } from './components/ListenLinks'
import { DeezerPreview } from './components/DeezerPreview'
import { RelativePosition } from './components/RelativePosition'
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
  const nameRef = useRef(null)
  const cyclingRef = useRef(false)
  const cyclingTimerRef = useRef(null)

  const lastfm = useLastfm(selectedGenre?.name)

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
            <NavBar genres={genres} onRandom={handleRandom} onSelect={handleResult} disabled={spinning} />
          </header>

          <section className="zone-discovery">
            <div ref={nameRef}>
              <NavBar genres={genres} onRandom={handleRandom} onSelect={handleResult} disabled={spinning} />
            </div>

            <div className="discovery-content">
              <GenreName genre={selectedGenre} displayName={spinDisplay} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedGenre.slug}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <GenreLinks genre={selectedGenre} lastfm={lastfm} />
                </motion.div>
              </AnimatePresence>
              <ListenLinks name={selectedGenre.name} slug={selectedGenre.slug} />
            </div>
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
                  <div className="exploration-grid__main">
                    <GenreDescription lastfm={lastfm} />
                    <DeezerPreview
                      artist={lastfm?.topTrack?.artist}
                      track={lastfm?.topTrack?.title}
                    />
                  </div>
                  <div className="exploration-grid__side">
                    <RelativePosition genre={selectedGenre} allGenres={genres} />
                    <NearbyGenres
                      genre={selectedGenre}
                      allGenres={genres}
                      onSelect={handleResult}
                    />
                  </div>
                </div>
                <div className="exploration-footer">
                  <ShareButton genre={selectedGenre} />
                  <DiscoveryCounter genre={selectedGenre} total={genres.length} />
                </div>
              </motion.div>
            </AnimatePresence>
          </section>
        </>
      ) : (
        <>
          <header className="app__hero">
            <h1 className="app__title">Random Genre Explorer</h1>
            <p className="app__subtitle">
              {genres.length.toLocaleString()} genres
            </p>
          </header>

          <div className="app__controls">
            <SlotMachine genres={genres} onResult={handleResult} />
            <SearchBox genres={genres} onSelect={handleResult} />
          </div>
        </>
      )}
    </div>
  )
}

export default App
