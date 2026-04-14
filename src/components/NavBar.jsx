import { useState, useRef, useCallback, useEffect } from 'react'
import { getGenresByRegion, REGION_NAMES } from '../utils/regions'
import { getRarityScore } from '../utils/rarityScore'
import './NavBar.css'

const MAX_RESULTS = 8

const DROPDOWN_OPTIONS = [
  { id: 'random', label: 'Random' },
  { id: 'region', label: 'By region' },
  { id: 'rare', label: 'Only rare' },
  { id: 'nearby', label: 'Nearby current' },
]

function matchScore(name, query) {
  const idx = name.indexOf(query)
  if (idx === -1) return -1
  return idx === 0 ? 0 : 1 + idx
}

function fuzzyMatch(genres, query) {
  if (!query) return []
  const q = query.toLowerCase()
  const scored = []
  for (const genre of genres) {
    const score = matchScore(genre.name.toLowerCase(), q)
    if (score >= 0) scored.push({ genre, score })
  }
  scored.sort((a, b) => a.score - b.score || a.genre.name.localeCompare(b.genre.name))
  return scored.slice(0, MAX_RESULTS).map((s) => s.genre)
}

function DiceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  )
}

export function NavBar({ genres, onRandom, onSelect, disabled, currentGenre }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [regionOpen, setRegionOpen] = useState(false)
  const [searchActive, setSearchActive] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [resultsOpen, setResultsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const barRef = useRef(null)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const inputRef = useRef(null)

  const updateResults = useCallback(
    (q) => {
      const matches = fuzzyMatch(genres, q)
      setResults(matches)
      setResultsOpen(matches.length > 0)
      setActiveIndex(-1)
    },
    [genres],
  )

  const collapseSearch = useCallback(() => {
    setSearchActive(false)
    setQuery('')
    setResults([])
    setResultsOpen(false)
    setActiveIndex(-1)
  }, [])

  const expandSearch = useCallback(() => {
    setSearchActive(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const selectGenre = useCallback(
    (genre) => {
      collapseSearch()
      onSelect(genre)
    },
    [onSelect, collapseSearch],
  )

  const rareGenresCache = useRef(null)

  const handleOptionClick = useCallback(
    (optionId) => {
      if (optionId === 'region') {
        setRegionOpen((o) => !o)
        return
      }

      setDropdownOpen(false)
      setRegionOpen(false)

      if (optionId === 'random') {
        onRandom()
      } else if (optionId === 'rare') {
        if (!rareGenresCache.current) {
          rareGenresCache.current = genres.filter(
            (g) => getRarityScore(g, genres, null) > 60,
          )
        }
        const pool = rareGenresCache.current
        if (pool.length > 0) {
          onSelect(pool[Math.floor(Math.random() * pool.length)])
        } else {
          onRandom()
        }
      } else if (optionId === 'nearby') {
        if (currentGenre) {
          const scored = []
          for (const g of genres) {
            if (g.slug === currentGenre.slug) continue
            const dx = g.x - currentGenre.x
            const dy = g.y - currentGenre.y
            scored.push({ genre: g, dist: dx * dx + dy * dy })
          }
          scored.sort((a, b) => a.dist - b.dist)
          const nearby = scored.slice(0, 20)
          onSelect(nearby[Math.floor(Math.random() * nearby.length)].genre)
        } else {
          onRandom()
        }
      }
    },
    [genres, onRandom, onSelect, currentGenre],
  )

  const handleRegionSelect = useCallback(
    (region) => {
      setDropdownOpen(false)
      setRegionOpen(false)
      const pool = getGenresByRegion(genres, region)
      if (pool.length > 0) {
        onSelect(pool[Math.floor(Math.random() * pool.length)])
      } else {
        onRandom()
      }
    },
    [genres, onSelect, onRandom],
  )

  // Outside click: close dropdown and search
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setRegionOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        collapseSearch()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [collapseSearch])

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      collapseSearch()
      return
    }
    if (!resultsOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectGenre(results[activeIndex])
    }
  }

  return (
    <nav className="nav-bar" ref={barRef}>
      {/* Left: Random */}
      <div className="nav-bar__section" ref={dropdownRef}>
        <button
          className="nav-bar__action"
          onClick={onRandom}
          disabled={disabled}
        >
          <DiceIcon />
          <span>Random</span>
        </button>
        <span
          className="nav-bar__chevron"
          onClick={() => { if (!disabled) setDropdownOpen((o) => !o) }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Random options"
          aria-expanded={dropdownOpen}
        >
          <svg width="8" height="8" viewBox="0 0 10 10">
            <path d="M2 3.5 L5 7 L8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
        </span>

        <div className={`nav-bar__dropdown ${dropdownOpen ? 'nav-bar__dropdown--open' : ''}`}>
          {DROPDOWN_OPTIONS.map((opt) => (
            <div key={opt.id}>
              <button
                className="nav-bar__dropdown-option"
                onClick={() => handleOptionClick(opt.id)}
              >
                {opt.label}
                {opt.id === 'region' && (
                  <span className="nav-bar__submenu-arrow">{regionOpen ? '\u2039' : '\u203A'}</span>
                )}
              </button>
              {opt.id === 'region' && regionOpen && (
                <div className="nav-bar__submenu">
                  {REGION_NAMES.map((region) => (
                    <button
                      key={region}
                      className="nav-bar__dropdown-option nav-bar__dropdown-option--sub"
                      onClick={() => handleRegionSelect(region)}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="nav-bar__separator" />

      {/* Right: Search */}
      <div className="nav-bar__section" ref={searchRef}>
        {searchActive ? (
          <div className="nav-bar__search-field">
            <SearchIcon />
            <input
              ref={inputRef}
              className="nav-bar__search-input"
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); updateResults(e.target.value) }}
              onKeyDown={handleSearchKeyDown}
              placeholder="search genre..."
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        ) : (
          <button className="nav-bar__action" onClick={expandSearch}>
            <SearchIcon />
            <span>Search</span>
          </button>
        )}

        {resultsOpen && searchActive && (
          <ul className="nav-bar__results">
            {results.map((genre, i) => (
              <li
                key={genre.slug}
                className={`nav-bar__result ${i === activeIndex ? 'nav-bar__result--active' : ''}`}
                onMouseDown={() => selectGenre(genre)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span className="nav-bar__result-name">{genre.name}</span>
                <span className="nav-bar__result-dot" style={{ backgroundColor: genre.color }} />
              </li>
            ))}
          </ul>
        )}
      </div>

    </nav>
  )
}
