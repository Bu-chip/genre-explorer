import { useEffect, useState } from 'react'
import { useIdleGlitch } from '../hooks/useIdleGlitch'
import './ContextPhrase.css'

const SETTLE_MS = 2000

export function ContextPhrase({ phrase, spinning }) {
  const [readyPhrase, setReadyPhrase] = useState(null)

  useEffect(() => {
    if (!phrase) return
    const t = setTimeout(() => setReadyPhrase(phrase), SETTLE_MS)
    return () => clearTimeout(t)
  }, [phrase])

  const ready = readyPhrase === phrase

  const display = useIdleGlitch(phrase || '', {
    paused: !ready || spinning,
    delayMin: 2000,
    delayMax: 4000,
    holdMin: 400,
    holdMax: 600,
    letterCountMin: 3,
    letterCountMax: 4,
    chainProbability: 0.5,
    chainDelay: 100,
  })

  if (spinning) {
    return <p className="context-phrase">spinning...</p>
  }

  if (!phrase) return <p className="context-phrase">&nbsp;</p>

  return (
    <p className="context-phrase" aria-label={phrase}>
      {display.map((char, i) => (
        <span key={i} aria-hidden="true">{char}</span>
      ))}
    </p>
  )
}
