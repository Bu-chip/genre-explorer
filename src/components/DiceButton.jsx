import { useState, useRef, useEffect, useCallback } from 'react'
import { getGenresByRegion, REGION_NAMES } from '../utils/regions'
import { getRarityScore } from '../utils/rarityScore'
import './DiceButton.css'

const DROPDOWN_OPTIONS = [
  { id: 'random', label: 'Random' },
  { id: 'region', label: 'By region' },
  { id: 'rare', label: 'Only rare' },
  { id: 'nearby', label: 'Nearby current' },
]

function DiceIcon({ size = 20 }) {
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
      <rect x="3" y="3" width="18" height="18" rx="0" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function DiceButton({ onRandom, onSelect, disabled, genres, currentGenre }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [regionOpen, setRegionOpen] = useState(false)
  const containerRef = useRef(null)
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
        if (!genres?.length) { onRandom(); return }
        if (!rareGenresCache.current) {
          rareGenresCache.current = genres.filter(
            (g) => getRarityScore(g, genres, null) > 60,
          )
        }
        const pool = rareGenresCache.current
        if (pool.length > 0 && onSelect) {
          onSelect(pool[Math.floor(Math.random() * pool.length)])
        } else {
          onRandom()
        }
      } else if (optionId === 'nearby') {
        if (currentGenre && genres?.length && onSelect) {
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
      if (!genres?.length) { onRandom(); return }
      const pool = getGenresByRegion(genres, region)
      if (pool.length > 0 && onSelect) {
        onSelect(pool[Math.floor(Math.random() * pool.length)])
      } else {
        onRandom()
      }
    },
    [genres, onSelect, onRandom],
  )

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setRegionOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="dice-button" ref={containerRef}>
      <button
        className="dice-button__trigger"
        onClick={onRandom}
        disabled={disabled}
        aria-label="Random genre"
      >
        <DiceIcon />
      </button>
      <span
        className="dice-button__chevron"
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) setDropdownOpen((o) => !o)
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Random options"
        aria-expanded={dropdownOpen}
      >
        <svg width="8" height="8" viewBox="0 0 10 10">
          <path d="M2 3.5 L5 7 L8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
      </span>

      <div
        className={`dice-button__dropdown ${dropdownOpen ? 'dice-button__dropdown--open' : ''}`}
      >
        {DROPDOWN_OPTIONS.map((opt) => (
          <div key={opt.id}>
            <button
              className="dice-button__option"
              onClick={() => handleOptionClick(opt.id)}
            >
              {opt.label}
            </button>
            {opt.id === 'region' && regionOpen &&
              REGION_NAMES.map((region) => (
                <button
                  key={region}
                  className="dice-button__option"
                  style={{ paddingLeft: 'var(--space-6)', color: 'var(--gray-400)', fontSize: '0.6875rem' }}
                  onClick={() => handleRegionSelect(region)}
                >
                  {region}
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
