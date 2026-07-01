import { useState, useEffect } from 'react'

// Wikipedias to try, in order. Spanish runs ONLY when English yields nothing,
// so genres that already resolve keep their exact behavior. Each wiki brings
// its own title patterns, music-keyword list for the sanity check, and
// opensearch fallback strategy.
const WIKIS = [
  {
    api: 'https://en.wikipedia.org/w/api.php',
    articleBase: 'https://en.wikipedia.org/wiki/',
    patterns: ['', ' music', ' (music)', ' (genre)', ' (music genre)'],
    keywords: [
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
    ],
    // Kept verbatim from the EN-only implementation: a deliberately narrow
    // suggestion query. Loosening it to the bare name is what produced the
    // historical false positives (Arab Electronic -> Ars Electronica).
    opensearchQuery: (name) => `${name} music genre`,
    guardOpensearch: false,
  },
  {
    api: 'https://es.wikipedia.org/w/api.php',
    articleBase: 'https://es.wikipedia.org/wiki/',
    patterns: ['', ' (música)', ' (género musical)', ' (género)'],
    // 'music' (not 'música') also catches "musical"/"musicales", which carry
    // no accent in Spanish.
    keywords: [
      'music',
      'música',
      'género',
      'canción',
      'canto',
      'banda',
      'músico',
      'artista',
      'álbum',
      'sonido',
      'estilo',
      'ritmo',
      'instrumento',
      'vocalista',
      'cantante',
      'melodía',
      'baile',
    ],
    // Index names are ASCII ("musica llanera") while es titles carry
    // accents ("Música llanera"), so exact-title lookups can miss and the
    // suggestion API (which folds accents) is the useful path — queried with
    // the bare name, but guarded below so fuzzy suggestions can't smuggle in
    // an unrelated article.
    opensearchQuery: (name) => name,
    guardOpensearch: true,
  },
]

// Genre names in the index are all-lowercase, but MediaWiki titles are
// case-sensitive beyond the first letter (which the API uppercases itself).
// Titles containing proper nouns — "Latin Christian music" — only resolve
// when the inner words are capitalized too, so each pattern is tried with
// the raw name and with a Title-Cased name.
function titleCaseWords(name) {
  return name.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1))
}

function buildCandidates(name, patterns) {
  const bases = [name, titleCaseWords(name)]
  const seen = new Set()
  const candidates = []
  for (const pattern of patterns) {
    for (const base of bases) {
      const candidate = `${base}${pattern}`
      // The API uppercases a title's first letter, so candidates differing
      // only there are the same page — skip the duplicate lookup.
      const key = candidate[0].toUpperCase() + candidate.slice(1)
      if (!seen.has(key)) {
        seen.add(key)
        candidates.push(candidate)
      }
    }
  }
  return candidates
}

function passesSanityCheck(wiki, extract) {
  if (!extract) return false
  const lower = extract.toLowerCase()
  return wiki.keywords.some((kw) => lower.includes(kw))
}

// Accent-insensitive, lowercase comparison form ("Música" -> "musica").
function foldForCompare(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function pageUrl(wiki, title) {
  return `${wiki.articleBase}${encodeURIComponent(title.replace(/ /g, '_'))}`
}

async function fetchPage(wiki, title) {
  try {
    const url = new URL(wiki.api)
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
      url: pageUrl(wiki, page.title),
    }
  } catch {
    return null
  }
}

async function opensearchTitle(wiki, query) {
  try {
    const url = new URL(wiki.api)
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

async function tryWiki(wiki, genreName, isCancelled) {
  for (const candidate of buildCandidates(genreName, wiki.patterns)) {
    if (isCancelled()) return null
    const page = await fetchPage(wiki, candidate)
    if (page && passesSanityCheck(wiki, page.extract)) return page
  }

  if (isCancelled()) return null
  const fallbackTitle = await opensearchTitle(wiki, wiki.opensearchQuery(genreName))
  if (!fallbackTitle || isCancelled()) return null

  // The suggestion API fuzzy-matches, so a bare-name query can return a
  // near-miss title. Only accept it when the title actually contains the
  // genre name (accent-folded), e.g. "musica llanera" -> "Música llanera"
  // passes, "arab electronic" -> "Ars Electronica" does not.
  if (
    wiki.guardOpensearch &&
    !foldForCompare(fallbackTitle).includes(foldForCompare(genreName))
  ) {
    return null
  }

  const page = await fetchPage(wiki, fallbackTitle)
  if (page && passesSanityCheck(wiki, page.extract)) return page
  return null
}

export function useWikipedia(genreName) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!genreName) return

    let cancelled = false

    async function load() {
      for (const wiki of WIKIS) {
        const page = await tryWiki(wiki, genreName, () => cancelled)
        if (cancelled) return
        if (page) {
          setData(page)
          return
        }
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
