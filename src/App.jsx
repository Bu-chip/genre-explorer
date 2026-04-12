import { useState, useCallback } from 'react'
import { useGenres } from './hooks/useGenres'
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
  }, [])

  if (error) {
    return (
      <div className="app">
        <p className="app__error">failed to load genres: {error}</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Random Genre Explorer</h1>
        {genres && (
          <p className="app__subtitle">
            {genres.length.toLocaleString()} genres
          </p>
        )}
      </header>

      <main className="app__main">
        {loading ? (
          <p className="app__loading">loading genres...</p>
        ) : (
          <>
            <SlotMachine genres={genres} onResult={handleResult} />
            <SearchBox genres={genres} onSelect={handleResult} />
            {selectedGenre && (
              <>
                <GenreCard key={selectedGenre.slug} genre={selectedGenre} />
                <NearbyGenres
                  key={`nearby-${selectedGenre.slug}`}
                  genre={selectedGenre}
                  allGenres={genres}
                  onSelect={handleResult}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
