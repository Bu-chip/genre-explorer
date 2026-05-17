import { useEffect, useMemo, useState } from 'react'
import { randomGlyph } from '../utils/glitch'

export function useIdleGlitch(baseText, options = {}) {
  const {
    paused = false,
    delayMin = 8000,
    delayMax = 15000,
    holdMin = 200,
    holdMax = 300,
    letterCount = 2,
  } = options

  const [overlay, setOverlay] = useState(null)

  useEffect(() => {
    if (paused || !baseText) return

    let cancelled = false
    let pending = null

    const scheduleNext = () => {
      const delay = delayMin + Math.random() * (delayMax - delayMin)
      pending = setTimeout(runGlitch, delay)
    }

    const runGlitch = () => {
      if (cancelled) return
      const positions = new Set()
      const count = Math.min(letterCount, baseText.length)
      while (positions.size < count) {
        positions.add(Math.floor(Math.random() * baseText.length))
      }
      const chars = {}
      positions.forEach((p) => { chars[p] = randomGlyph() })
      setOverlay(chars)

      const hold = holdMin + Math.random() * (holdMax - holdMin)
      pending = setTimeout(() => {
        if (cancelled) return
        setOverlay(null)
        scheduleNext()
      }, hold)
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (pending) clearTimeout(pending)
      setOverlay(null)
    }
  }, [baseText, paused, delayMin, delayMax, holdMin, holdMax, letterCount])

  return useMemo(() => {
    if (!baseText) return []
    const base = baseText.split('')
    if (paused || !overlay) return base
    return base.map((c, i) => (i in overlay ? overlay[i] : c))
  }, [baseText, paused, overlay])
}
