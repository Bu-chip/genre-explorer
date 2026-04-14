import { useState, useRef, useEffect, useCallback } from 'react'
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

export function DiceButton({ onRandom, disabled }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef(null)

  const handleOptionClick = useCallback(
    (optionId) => {
      setDropdownOpen(false)
      // All options currently route to the same random function
      onRandom()
    },
    [onRandom],
  )

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false)
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
          <button
            key={opt.id}
            className="dice-button__option"
            onClick={() => handleOptionClick(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
