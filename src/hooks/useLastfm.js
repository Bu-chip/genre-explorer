import { useState, useEffect } from 'react'

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY
const BASE = 'https://ws.audioscrobbler.com/2.0/'

function truncateToSentences(text, max = 3) {
  if (!text) return null
  // strip HTML tags and Last.fm's "Read more on Last.fm" stub
  const clean = text
    .replace(/<[^>]+>/g, '')
    .replace(/Read more on Last\.?\s*fm\.?/gi, '')
    .trim()
  if (!clean || clean.length < 20) return null
  // split on sentence boundaries
  const sentences = clean.match(/[^.!?]+[.!?]+/g)
  if (!sentences) return clean.length > 200 ? clean.slice(0, 200) + '...' : clean
  return sentences.slice(0, max).join(' ').trim()
}

async function fetchJson(params) {
  if (!API_KEY) return null
  const url = new URL(BASE)
  url.search = new URLSearchParams({
    ...params,
    api_key: API_KEY,
    format: 'json',
  })
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function useLastfm(genreName) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!genreName || !API_KEY) return

    let cancelled = false

    async function load() {
      const infoRes = await fetchJson({ method: 'tag.getinfo', tag: genreName })

      if (cancelled) return

      const summary = truncateToSentences(infoRes?.tag?.wiki?.summary)
      const reach = infoRes?.tag?.reach != null ? Number(infoRes.tag.reach) : null

      if (summary || reach != null) {
        setData({ summary, listeners: reach })
      } else {
        setData(null)
      }
    }

    setData(null)
    load()

    return () => { cancelled = true }
  }, [genreName])

  return data
}
