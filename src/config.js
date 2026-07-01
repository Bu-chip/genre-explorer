// Deezer proxy configuration.
//
// Deezer's API (api.deezer.com) sends no CORS headers, so the browser must
// call it through a proxy. We run our own Cloudflare Worker (see /worker)
// instead of corsproxy.io, whose free tier no longer allows the production
// origin. The Worker is deployed manually from the Cloudflare dashboard.
export const DEEZER_PROXY = 'https://deezer-proxy.mborrajor.workers.dev'

// Build the proxied URL for a given Deezer API URL.
// The Worker expects the target URL in the `?url=` query parameter.
export function deezerProxyUrl(targetUrl) {
  return `${DEEZER_PROXY}/?url=${encodeURIComponent(targetUrl)}`
}
