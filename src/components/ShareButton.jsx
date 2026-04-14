import { useState } from 'react'
import './ShareButton.css'

export function ShareButton({ genre }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#genre=${genre.slug}`
    const shareData = { title: `${genre.name} — Random Genre Explorer`, url }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // User cancelled or share failed, fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <button className="share-btn" onClick={handleShare}>
      {copied ? (
        'Copied!'
      ) : (
        <>
          Share
          <svg
            className="share-btn__icon"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5" />
          </svg>
        </>
      )}
    </button>
  )
}
