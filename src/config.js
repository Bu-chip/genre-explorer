// Deezer proxy configuration.
//
// Deezer's API (api.deezer.com) sends no CORS headers, so the browser must call
// it through a proxy. We run our own Cloudflare Worker (see /worker) instead of
// relying on corsproxy.io, whose free tier no longer allows the production
// origin.
//
// PASTE THE DEPLOYED WORKER URL HERE after running `wrangler deploy`.
// Format: the base origin only, no trailing slash, no query string. Examples:
//   'https://deezer-proxy.<your-subdomain>.workers.dev'
//   'https://deezer-proxy.queimadacircuitrecords.com'
export const DEEZER_PROXY = 'https://deezer-proxy.REPLACE-ME.workers.dev'

// Build the final proxied URL for a given Deezer API URL.
// The Worker expects the target URL in the `?url=` query parameter.
export function deezerProxyUrl(deezerUrl) {
  return `${DEEZER_PROXY}/?url=${encodeURIComponent(deezerUrl)}`
}
