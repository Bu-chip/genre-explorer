import { useState, useRef, useCallback } from 'react'
import './SlotMachine.css'

const SPIN_DURATION = 1400
const TICK_START = 30
const TICK_END = 180

export function SlotMachine({ genres, onResult, compact }) {
  const [display, setDisplay] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const rafRef = useRef(null)

  const pickRandom = useCallback(() => {
    return genres[Math.floor(Math.random() * genres.length)]
  }, [genres])

  const spin = useCallback(() => {
    if (spinning || !genres?.length) return

    setSpinning(true)
    const startTime = performance.now()
    const finalGenre = pickRandom()

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / SPIN_DURATION, 1)

      if (progress < 1) {
        const interval = TICK_START + (TICK_END - TICK_START) * (progress * progress)
        const tickIndex = Math.floor(elapsed / interval)

        if (!rafRef.current || rafRef.current !== tickIndex) {
          rafRef.current = tickIndex
          setDisplay(pickRandom())
        }

        requestAnimationFrame(tick)
      } else {
        setDisplay(finalGenre)
        setSpinning(false)
        onResult(finalGenre)
        rafRef.current = null
      }
    }

    requestAnimationFrame(tick)
  }, [spinning, genres, pickRandom, onResult])

  if (compact) {
    return (
      <button
        className="slot-machine__button"
        onClick={spin}
        disabled={spinning}
      >
        {spinning && display ? display.name : 'random'}
      </button>
    )
  }

  return (
    <div className="slot-machine">
      <div className="slot-machine__display">
        <span
          className={`slot-machine__text ${spinning ? 'slot-machine__text--spinning' : ''}`}
          style={display ? { '--genre-color': display.color } : undefined}
        >
          {display ? display.name : 'press to explore'}
        </span>
      </div>

      <button
        className="slot-machine__button"
        onClick={spin}
        disabled={spinning}
      >
        {spinning ? '...' : 'random'}
      </button>
    </div>
  )
}
