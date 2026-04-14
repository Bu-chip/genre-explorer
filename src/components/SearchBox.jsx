import { useState, useRef, useCallback, useEffect } from 'react'
import './SearchBox.css'

const MAX_RESULTS = 8

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
    if (score >= 0) {
      scored.push({ genre, score })
    }
  }

  scored.sort((a, b) => a.score - b.score || a.genre.name.localeCompare(b.genre.name))

  return scored.slice(0, MAX_RESULTS).map((s) => s.genre)
}

function SearchIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  )
}

export function SearchBox({ genres, onSelect }) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)
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

  const collapse = useCallback(() => {
    setExpanded(false)
    setQuery('')
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  const expand = useCallback(() => {
    setExpanded(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    updateResults(val)
  }

  const select = useCallback(
    (genre) => {
      collapse()
      onSelect(genre)
    },
    [onSelect, collapse],
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      collapse()
      return
    }

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
    }
  }

  // close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        collapse()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [collapse])

  return (
    <div className="search-box" ref={containerRef}>
      <button
        className={`search-box__icon ${expanded ? 'search-box__icon--hidden' : ''}`}
        onClick={expand}
        aria-label="Search genres"
      >
        <SearchIcon />
      </button>

      <div
        className={`search-box__field ${expanded ? 'search-box__field--expanded' : ''}`}
      >
        <input
          ref={inputRef}
          className="search-box__input"
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="search genre..."
          spellCheck={false}
          autoComplete="off"
          tabIndex={expanded ? 0 : -1}
        />
      </div>

      {open && expanded && (
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
