/**
 * Deezer CORS proxy — Cloudflare Worker
 *
 * The Deezer public API (api.deezer.com) does not send CORS headers, so the
 * browser cannot call it directly. This Worker fetches Deezer server-side and
 * re-emits the response with the proper Access-Control-Allow-Origin header.
 *
 * Usage from the browser:
 *   https://deezer-proxy.mborrajor.workers.dev/?url=<url-encoded Deezer API URL>
 *
 * Only requests whose Origin is in ALLOWED_ORIGINS are served; everything else
 * gets a 403. Preflight OPTIONS requests are handled explicitly.
 *
 * This file is the source of record for the Worker deployed at
 * deezer-proxy.mborrajor.workers.dev. Deployment is manual: paste this code
 * into the Worker editor in the Cloudflare dashboard.
 */

const ALLOWED_ORIGINS = [
  'https://genres.queimadacircuitrecords.com',
  'http://localhost:5173',
]

// Only proxy requests to the Deezer API — never let this become an open proxy.
const ALLOWED_TARGET_HOST = 'api.deezer.com'

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin')
    const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)

    // Preflight
    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin) {
        return new Response('Origin not allowed', { status: 403 })
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Block disallowed origins. A request with no Origin header (e.g. curl,
    // server-to-server) is rejected too, since this proxy only serves the app.
    if (!isAllowedOrigin) {
      return new Response('Origin not allowed', { status: 403 })
    }

    const target = new URL(request.url).searchParams.get('url')
    if (!target) {
      return new Response('Missing "url" query parameter', {
        status: 400,
        headers: corsHeaders(origin),
      })
    }

    let targetUrl
    try {
      targetUrl = new URL(target)
    } catch {
      return new Response('Invalid "url" query parameter', {
        status: 400,
        headers: corsHeaders(origin),
      })
    }

    if (targetUrl.hostname !== ALLOWED_TARGET_HOST) {
      return new Response('Target host not allowed', {
        status: 403,
        headers: corsHeaders(origin),
      })
    }

    let upstream
    try {
      upstream = await fetch(targetUrl.toString(), {
        headers: { Accept: 'application/json' },
        cf: { cacheTtl: 300, cacheEverything: true },
      })
    } catch (err) {
      return new Response(`Upstream fetch failed: ${err}`, {
        status: 502,
        headers: corsHeaders(origin),
      })
    }

    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(origin),
        'Content-Type':
          upstream.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    })
  },
}
