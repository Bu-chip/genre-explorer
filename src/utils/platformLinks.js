// Platform helpers shared by ListenLinks and TrackLinksMenu. They live
// outside the component files so fast refresh keeps working there (a module
// that exports both components and plain values can't be hot-swapped).

export function isMobile() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod|Android/.test(ua)) return true
  // iPadOS 13+ reports a Mac UA by default; touch points disambiguate it.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
}

// Monochrome brand glyphs (24x24 viewBox, drawn with fill=currentColor).
export const YOUTUBE_PATH =
  'M21.8 8.001a2.75 2.75 0 0 0-1.94-1.93C18.12 5.5 12 5.5 12 5.5s-6.12 0-7.86.57A2.75 2.75 0 0 0 2.2 8.001 28.7 28.7 0 0 0 1.75 12a28.7 28.7 0 0 0 .45 3.999 2.75 2.75 0 0 0 1.94 1.93c1.74.57 7.86.57 7.86.57s6.12 0 7.86-.57a2.75 2.75 0 0 0 1.94-1.93A28.7 28.7 0 0 0 22.25 12a28.7 28.7 0 0 0-.45-3.999zM9.75 15.02V8.98L15.5 12l-5.75 3.02z'

export const SPOTIFY_PATH =
  'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 0 1-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.225-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.972-.516.781.781 0 0 1 .516-.973c3.632-1.102 8.147-.568 11.236 1.327a.78.78 0 0 1 .257 1.071zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.935.935 0 1 1-.543-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 0 1-.953 1.609z'
