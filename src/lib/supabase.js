import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars prefixed with VITE_ at build time.
// Keep these values in .env.local (do NOT commit them).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail loudly in dev to make misconfiguration obvious.
  // eslint-disable-next-line no-console
  console.error('Missing Supabase env vars. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          // Let Supabase auto-refresh sessions where possible.
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

