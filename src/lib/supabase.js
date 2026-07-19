import { createClient } from '@supabase/supabase-js'

// Single Supabase client for the whole app.
//
// Only the PUBLIC key ships here (anon / publishable — the new sb_publishable_...
// format works as-is in createClient). The secret / service_role key must never
// reach the bundle.
//
// detectSessionInUrl: parses the magic-link / OAuth tokens Supabase returns in
// the URL hash (#access_token=...) and strips them. Our genre deep-link only
// matches ^#genre=, so the two hash uses don't collide.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Surfaced in dev only — production build injects these via CI env.
  console.warn(
    'Supabase env missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
