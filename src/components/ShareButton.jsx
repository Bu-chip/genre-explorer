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

  const label = copied ? 'Link copied' : 'Share genre'

  return (
    <button
      type="button"
      className={`share-btn ${copied ? 'share-btn--copied' : ''}`}
      onClick={handleShare}
      aria-label={label}
      title={label}
    >
      <svg
        className="share-btn__icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    </button>
  )
}
