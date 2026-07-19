import { createClient } from '@supabase/supabase-js'

// Single Supabase client for the whole app.
//
// Only the PUBLIC key ships here (anon / publishable — the new sb_publishable_...
// format works as-is in createClient). The secret / service_role key must never
// reach the bundle.
//
// flowType 'pkce': the magic-link / OAuth return lands the auth in the query
// string (?code=...), not the hash. supabase-js stores a code_verifier in
// storage when the flow starts and exchanges the code for a session on return
// (the code is single-use and valid ~5 min). This frees the URL hash entirely,
// so our ^#genre= deep-link never collides with auth.
// detectSessionInUrl: detects the ?code= on return, runs the exchange, and
// strips it from the URL.
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
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
