import React from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Fetch accepted friends (regardless of online status).
 * Returns objects shaped like: { id, username, avatar_url }.
 */
export function useAcceptedFriends() {
  const [friends, setFriends] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        if (!supabase) {
          if (alive) {
            setFriends([]);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        setError(null);

        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) {
          if (alive) setFriends([]);
          return;
        }

        const meId = user.id;

        const { data: friendships, error: fErr } = await supabase
          .from('friendships')
          .select('user_id_1,user_id_2')
          .eq('status', 'accepted')
          .or(`user_id_1.eq.${meId},user_id_2.eq.${meId}`);

        if (fErr) throw fErr;

        const friendIds = new Set();
        for (const fr of friendships ?? []) {
          if (fr.user_id_1 === meId) friendIds.add(String(fr.user_id_2));
          else if (fr.user_id_2 === meId) friendIds.add(String(fr.user_id_1));
        }

        if (friendIds.size === 0) {
          if (alive) setFriends([]);
          return;
        }

        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('id,username,avatar_url')
          .in('id', Array.from(friendIds));

        if (pErr) throw pErr;

        const mapped = (profiles ?? []).map((p) => ({
          id: p.id,
          username: p.username,
          avatar_url: p.avatar_url ?? null
        }));

        if (alive) setFriends(mapped);
      } catch (e) {
        if (alive) setError(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  return { friends, loading, error };
}

