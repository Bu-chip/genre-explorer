import { useMemo } from 'react'
import { useIdleGlitch } from '../hooks/useIdleGlitch'
import './Marquee.css'

export function Marquee({ direction = 'rtl', text, className = '' }) {
  const chars = useIdleGlitch(text, {
    delayMin: 6000,
    delayMax: 12000,
    holdMin: 400,
    holdMax: 600,
    letterCountMin: 2,
    letterCountMax: 3,
  })

  const displayed = useMemo(
    () => (chars.length ? chars.join('') : text),
    [chars, text],
  )

  return (
    <div
      className={`marquee marquee--${direction} ${className}`.trim()}
      aria-hidden="true"
    >
      <div className="marquee__track">
        <span className="marquee__copy">{displayed}</span>
        <span className="marquee__copy">{displayed}</span>
      </div>
    </div>
  )
}
