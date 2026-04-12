import { useState, useCallback } from 'react'
import { useGenres } from './hooks/useGenres'
import { ensureContrast } from './utils/color'
import { SlotMachine } from './components/SlotMachine'
import { SearchBox } from './components/SearchBox'
import { GenreCard } from './components/GenreCard'
import { NearbyGenres } from './components/NearbyGenres'
import './App.css'

function App() {
  const { genres, loading, error } = useGenres()
  const [selectedGenre, setSelectedGenre] = useState(null)

  const handleResult = useCallback((genre) => {
    setSelectedGenre(genre)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (error) {
    return (
      <div className="app">
        <p className="app__error">failed to load genres: {error}</p>
      </div>
    )
  }

  const hasGenre = !!selectedGenre
  const glowColor = hasGenre ? ensureContrast(selectedGenre.color) : null

  return (
    <div
      className="app"
      style={glowColor ? { '--glow-color': glowColor } : undefined}
    >
      {hasGenre && <div className="app__ambient" />}

      {loading ? (
        <p className="app__loading">loading genres...</p>
      ) : hasGenre ? (
        <>
          <nav className="app__nav">
            <SlotMachine genres={genres} onResult={handleResult} compact />
            <SearchBox genres={genres} onSelect={handleResult} />
          </nav>

          <main className="app__main">
            <GenreCard key={selectedGenre.slug} genre={selectedGenre} />
            <NearbyGenres
              key={`nearby-${selectedGenre.slug}`}
              genre={selectedGenre}
              allGenres={genres}
              onSelect={handleResult}
            />
          </main>
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
