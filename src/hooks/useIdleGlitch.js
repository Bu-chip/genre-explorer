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
    letterCountMin,
    letterCountMax,
    chainProbability = 0,
    chainDelay = 100,
  } = options

  const [overlay, setOverlay] = useState(null)

  useEffect(() => {
    if (paused || !baseText) return

    let cancelled = false
    let pending = null

    const pickCount = () => {
      if (letterCountMin != null && letterCountMax != null) {
        const range = letterCountMax - letterCountMin
        return letterCountMin + Math.floor(Math.random() * (range + 1))
      }
      return letterCount
    }

    const scheduleNext = () => {
      const delay = delayMin + Math.random() * (delayMax - delayMin)
      pending = setTimeout(() => runGlitch(false), delay)
    }

    const runGlitch = (isChained) => {
      if (cancelled) return
      const count = Math.min(pickCount(), baseText.length)
      const positions = new Set()
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

        if (!isChained && chainProbability > 0 && Math.random() < chainProbability) {
          pending = setTimeout(() => runGlitch(true), chainDelay)
        } else {
          scheduleNext()
        }
      }, hold)
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (pending) clearTimeout(pending)
      setOverlay(null)
    }
  }, [
    baseText,
    paused,
    delayMin,
    delayMax,
    holdMin,
    holdMax,
    letterCount,
    letterCountMin,
    letterCountMax,
    chainProbability,
    chainDelay,
  ])

  return useMemo(() => {
    if (!baseText) return []
    const base = baseText.split('')
    if (paused || !overlay) return base
    return base.map((c, i) => (i in overlay ? overlay[i] : c))
  }, [baseText, paused, overlay])
}
