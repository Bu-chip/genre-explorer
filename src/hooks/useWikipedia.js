import { useState, useEffect } from 'react'

const API_URL = 'https://en.wikipedia.org/w/api.php'

const MUSIC_KEYWORDS = [
  'music',
  'genre',
  'song',
  'band',
  'musician',
  'artist',
  'album',
  'sound',
  'style',
  'rhythm',
  'instrument',
  'vocalist',
  'singer',
  'beat',
  'melody',
]

function buildCandidates(name) {
  return [
    name,
    `${name} music`,
    `${name} (music)`,
    `${name} (genre)`,
    `${name} (music genre)`,
  ]
}

function passesSanityCheck(extract) {
  if (!extract) return false
  const lower = extract.toLowerCase()
  return MUSIC_KEYWORDS.some((kw) => lower.includes(kw))
}

function pageUrl(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`
}

async function fetchPage(title) {
  try {
    const url = new URL(API_URL)
    url.search = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      redirects: '1',
      titles: title,
      prop: 'extracts|pageimages|description|pageprops',
      exintro: 'true',
      explaintext: 'true',
      piprop: 'thumbnail',
      pithumbsize: '200',
    })
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null
    const page = Object.values(pages)[0]
    if (!page) return null
    if (page.missing !== undefined) return null
    if (page.pageprops?.disambiguation !== undefined) return null
    if (!page.extract) return null
    return {
      title: page.title,
      extract: page.extract,
      description: page.description || null,
      thumbnail: page.thumbnail?.source || null,
      url: pageUrl(page.title),
    }
  } catch {
    return null
  }
}

async function opensearchTitle(query) {
  try {
    const url = new URL(API_URL)
    url.search = new URLSearchParams({
      action: 'opensearch',
      format: 'json',
      origin: '*',
      search: query,
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
      for (const candidate of buildCandidates(genreName)) {
        if (cancelled) return
        const page = await fetchPage(candidate)
        if (page && passesSanityCheck(page.extract)) {
          setData(page)
          return
        }
      }

      if (cancelled) return
      const fallbackTitle = await opensearchTitle(`${genreName} music genre`)
      if (!fallbackTitle || cancelled) return

      const page = await fetchPage(fallbackTitle)
      if (cancelled) return
      if (page && passesSanityCheck(page.extract)) {
        setData(page)
      }
    }

    setData(null)
    load()

    return () => {
      cancelled = true
    }
  }, [genreName])

  return data
}
