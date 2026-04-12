import { useState, useRef, useCallback, useEffect } from 'react'
import './SearchBox.css'

const MAX_RESULTS = 8

function matchScore(name, query) {
  const idx = name.indexOf(query)
  if (idx === -1) return -1
  // exact start gets priority, then by position
  return idx === 0 ? 0 : 1 + idx
}

function fuzzyMatch(genres, query) {
  if (!query) return []

  const q = query.toLowerCase()

  // first pass: substring match
  const scored = []
  for (const genre of genres) {
    const score = matchScore(genre.name.toLowerCase(), q)
    if (score >= 0) {
      scored.push({ genre, score })
    }
  }

  // sort: starts-with first, then by position, then alphabetical
  scored.sort((a, b) => a.score - b.score || a.genre.name.localeCompare(b.genre.name))

  return scored.slice(0, MAX_RESULTS).map((s) => s.genre)
}

export function SearchBox({ genres, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const updateResults = useCallback(
    (q) => {
      const matches = fuzzyMatch(genres, q)
      setResults(matches)
      setOpen(matches.length > 0)
      setActiveIndex(-1)
    },
    [genres],
  )

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    updateResults(val)
  }

  const select = useCallback(
    (genre) => {
      setQuery('')
      setResults([])
      setOpen(false)
      setActiveIndex(-1)
      onSelect(genre)
    },
    [onSelect],
  )

  const handleKeyDown = (e) => {
    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      select(results[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  // close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!inputRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="search-box">
      <input
        ref={inputRef}
        className="search-box__input"
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query && updateResults(query)}
        placeholder="search genre..."
        spellCheck={false}
        autoComplete="off"
      />

      {open && (
        <ul ref={listRef} className="search-box__list">
          {results.map((genre, i) => (
            <li
              key={genre.slug}
              className={`search-box__item ${i === activeIndex ? 'search-box__item--active' : ''}`}
              onMouseDown={() => select(genre)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="search-box__item-name">{genre.name}</span>
              <span
                className="search-box__item-dot"
                style={{ backgroundColor: genre.color }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
