import { useState, useEffect } from 'react'

const SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
const OPENSEARCH_URL = 'https://en.wikipedia.org/w/api.php'

async function fetchSummary(title) {
  try {
    const res = await fetch(SUMMARY_BASE + encodeURIComponent(title))
    if (!res.ok) return null
    const json = await res.json()
    if (json.type === 'disambiguation') return null
    return json
  } catch {
    return null
  }
}

async function searchTitle(query) {
  try {
    const url = new URL(OPENSEARCH_URL)
    url.search = new URLSearchParams({
      action: 'opensearch',
      search: query,
      format: 'json',
      origin: '*',
      limit: '1',
    })
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const titles = data?.[1]
    if (Array.isArray(titles) && titles.length > 0) return titles[0]
    return null
  } catch {
    return null
  }
}

export function useWikipedia(genreName) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!genreName) return

    let cancelled = false

    async function load() {
      let summary = await fetchSummary(genreName)

      if (!summary) {
        const fallbackTitle = await searchTitle(genreName)
        if (fallbackTitle) {
          summary = await fetchSummary(fallbackTitle)
        }
      }

      if (cancelled) return

      if (!summary?.extract) {
        setData(null)
        return
      }

      setData({
        title: summary.title,
        extract: summary.extract,
        thumbnail: summary.thumbnail?.source || null,
        url:
          summary.content_urls?.desktop?.page ||
          summary.content_urls?.mobile?.page ||
          null,
      })
    }

    setData(null)
    load()

    return () => {
      cancelled = true
    }
  }, [genreName])

  return data
}
