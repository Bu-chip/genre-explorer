# Deezer CORS proxy (Cloudflare Worker)

Proxies the Deezer public API (`api.deezer.com`) and adds CORS headers so the
browser can call it from `genres.queimadacircuitrecords.com`. Replaces the
dependency on `corsproxy.io`, whose free tier no longer allows the production
origin.

## What it does

- Accepts `GET /?url=<url-encoded Deezer API URL>`.
- Only serves requests whose `Origin` is in the allowlist (production domain +
  localhost dev). Otherwise responds `403`.
- Only proxies requests to `api.deezer.com` (not an open proxy).
- Handles the `OPTIONS` preflight.

The browser-side allowlist lives in `src/index.js` (`ALLOWED_ORIGINS`). Update
it there if the domain ever changes.

## Deploy (run these in your own Cloudflare account)

From this `worker/` directory:

```bash
# 1. Install wrangler (Cloudflare's CLI) if you don't have it
npm install

# 2. Authenticate wrangler with your Cloudflare account (opens a browser)
npx wrangler login

# 3. Deploy the Worker
npx wrangler deploy
```

### Getting the public URL

After `wrangler deploy` finishes, it prints the deployed URL, e.g.:

```
Published deezer-proxy (x.xx sec)
  https://deezer-proxy.<your-subdomain>.workers.dev
```

That `https://deezer-proxy.<your-subdomain>.workers.dev` is the public URL.

- The first time you deploy a Worker, Cloudflare asks you to register a
  `*.workers.dev` subdomain for your account — pick one (e.g. `queimada`), and
  the URL becomes `https://deezer-proxy.queimada.workers.dev`.
- You can also see/copy it in the Cloudflare dashboard under
  **Workers & Pages → deezer-proxy**.

### Optional: custom subdomain

If you prefer `https://deezer-proxy.queimadacircuitrecords.com`, uncomment the
`routes` block in `wrangler.toml` (the zone must be active on your Cloudflare
account) and redeploy.

## After deploy — wire it into the app

Copy the public URL and paste it into `src/config.js` in the repo root project
(`DEEZER_PROXY`). See that file for the exact format expected.
