import { useMemo } from 'react'
import './RelativePosition.css'

function getMedian(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function RelativePosition({ genre, allGenres }) {
  const { medianX, medianY } = useMemo(() => {
    const xs = allGenres.map((g) => g.x)
    const ys = allGenres.map((g) => g.y)
    return { medianX: getMedian(xs), medianY: getMedian(ys) }
  }, [allGenres])

  const horizontal = genre.x < medianX ? 'organic' : 'electronic'
  const horizontalOpp = genre.x < medianX ? 'electronic' : 'organic'
  const vertical = genre.y < medianY ? 'energetic' : 'atmospheric'
  const verticalOpp = genre.y < medianY ? 'atmospheric' : 'energetic'

  return (
    <p className="relative-position">
      more {horizontal} than {horizontalOpp} &middot; more {vertical} than{' '}
      {verticalOpp}
    </p>
  )
}
