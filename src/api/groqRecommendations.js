import { supabase } from '../lib/supabase.js';

export async function getGroqPersonalizedPicks({
  likedItems,
  candidates,
  limitPerRow = 15,
  avoidStrength = 'strong'
}) {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke('personalized-recs', {
    body: {
      likedItems,
      candidates,
      limitPerRow,
      avoidStrength
    }
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('personalized-recs invoke failed:', error);
    return null;
  }
  return data && typeof data === 'object' ? data : null;
}

