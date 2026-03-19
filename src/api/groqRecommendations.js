import { supabase } from '../lib/supabase.js';

function getEdgeBaseUrl() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  // https://<project-ref>.supabase.co -> https://<project-ref>.functions.supabase.co
  return supabaseUrl.replace('.supabase.co', '.functions.supabase.co');
}

export async function getGroqPersonalizedPicks({
  likedItems,
  candidates,
  limitPerRow = 15,
  avoidStrength = 'strong'
}) {
  if (!supabase) return null;
  const edgeBase = getEdgeBaseUrl();
  if (!edgeBase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) return null;

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) return null;

  const res = await fetch(`${edgeBase}/personalized-recs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey
    },
    body: JSON.stringify({
      likedItems,
      candidates,
      limitPerRow,
      avoidStrength
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data && typeof data === 'object' ? data : null;
}

